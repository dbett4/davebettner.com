// Runs before every push: lint and typecheck what the pushed commits changed.
// There is no formatter in this repository, so there is no format step; see AGENTS.md.
import { execFileSync, spawnSync } from 'node:child_process';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const base = git('merge-base', 'HEAD', 'origin/main');
const changed = git('diff', '--name-only', '--diff-filter=ACMR', base, 'HEAD').split('\n').filter(Boolean);
const scripts = changed.filter(file => /\.(m?js|ts|astro)$/.test(file));
const started = Date.now();
const step = (label, command, args) => {
  const t = Date.now();
  const result = spawnSync(command, args, { stdio: 'inherit' });
  console.log(`pre-push: ${label} ${((Date.now() - t) / 1000).toFixed(1)}s`);
  if (result.status !== 0) {
    console.error(`pre-push: ${label} failed. Fix it, or run \`${[command, ...args].join(' ')}\` to see it again.`);
    process.exit(1);
  }
};

if (scripts.length) step('lint', 'node_modules/.bin/oxlint', scripts);
if (changed.some(file => file.endsWith('.astro'))) step('typecheck (astro check, .astro files changed)', 'node_modules/.bin/astro', ['check']);
else if (scripts.length) {
  step('astro sync (generates the types tsc needs)', 'node_modules/.bin/astro', ['sync']);
  step('typecheck (tsc)', 'node_modules/.bin/tsc', ['--noEmit']);
}
console.log(`pre-push: ${((Date.now() - started) / 1000).toFixed(1)}s of 9s`);
