#!/usr/bin/env node
// Audit of GitHub Actions run times: splits each job into waiting, setup and running.
// Usage: node scripts/ci-audit.mjs [--runs N]
// Needs the gh CLI signed in with read access to the repository.
import { execFileSync } from 'node:child_process';

const repo = process.env.AUDIT_REPO || 'dbett4/davebettner.com';
const wanted = Number(process.argv[process.argv.indexOf('--runs') + 1]) || 150;
const gh = args => JSON.parse(execFileSync('gh', ['api', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 }));
const ghLines = args => execFileSync('gh', ['api', '--paginate', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 }).trim().split('\n').map(line => JSON.parse(line));
const secs = (a, b) => (Date.parse(b) - Date.parse(a)) / 1000;
const isSetup = name => /^(Set up job|Run actions\/|Post Run|Complete job|Initialize|Install)/.test(name);
const quantile = (values, q) => {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (sorted.length - 1) * q;
  const lo = Math.floor(at);
  return sorted[lo] + (sorted[Math.ceil(at)] - sorted[lo]) * (at - lo);
};
const fmt = values => values.length ? `${quantile(values, 0.5).toFixed(0)} / ${quantile(values, 0.95).toFixed(0)}` : 'n/a';

const runs = ghLines([`repos/${repo}/actions/runs?per_page=100&status=completed`, '--jq', '.workflow_runs[]'])
  .sort((a, b) => b.run_number - a.run_number)
  .slice(0, wanted);

const jobs = new Map();
const wall = [];
const conclusions = {};
for (const run of runs) {
  conclusions[run.conclusion] = (conclusions[run.conclusion] || 0) + 1;
  wall.push(secs(run.created_at, run.updated_at));
  for (const job of gh([`repos/${repo}/actions/runs/${run.id}/jobs?per_page=100`]).jobs) {
    if (!job.started_at || !job.completed_at) continue;
    const row = jobs.get(job.name) ?? { waiting: [], setup: [], running: [], total: [], steps: new Map() };
    jobs.set(job.name, row);
    let setup = 0;
    let running = 0;
    for (const step of job.steps) {
      if (!step.started_at || !step.completed_at) continue;
      const length = secs(step.started_at, step.completed_at);
      if (isSetup(step.name)) setup += length; else running += length;
      const list = row.steps.get(step.name) ?? [];
      list.push(length);
      row.steps.set(step.name, list);
    }
    row.waiting.push(secs(job.created_at, job.started_at));
    row.setup.push(setup);
    row.running.push(running);
    row.total.push(secs(job.created_at, job.completed_at));
  }
}

console.log(`Runs audited: ${runs.length} (${JSON.stringify(conclusions)}). Seconds, p50 / p95.\n`);
console.log(`Run wall time (created to updated): ${fmt(wall)}\n`);
console.log('| Job | Waiting | Setup | Running | Total |');
console.log('| --- | --- | --- | --- | --- |');
for (const [name, row] of jobs) console.log(`| ${name} | ${fmt(row.waiting)} | ${fmt(row.setup)} | ${fmt(row.running)} | ${fmt(row.total)} |`);
for (const [name, row] of jobs) {
  console.log(`\nSteps of ${name}\n\n| Step | Bucket | p50 / p95 |\n| --- | --- | --- |`);
  for (const [step, list] of row.steps) console.log(`| ${step} | ${isSetup(step) ? 'setup' : 'running'} | ${fmt(list)} |`);
}
