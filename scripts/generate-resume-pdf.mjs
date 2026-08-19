#!/usr/bin/env node
/**
 * Deterministic résumé PDF generation from resume/dave-bettner-resume.html
 * Uses Playwright + system Chrome (same pattern as scripts/verify-site.mjs).
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceHtml = path.join(root, 'resume', 'dave-bettner-resume.html');
const outputPdf = path.join(root, 'public', 'dave-bettner-resume.pdf');
const receiptDir = path.join(root, 'tmp', 'resume-pdf');
const textOut = path.join(receiptDir, 'dave-bettner-resume.txt');
const metaOut = path.join(receiptDir, 'dave-bettner-resume.meta.txt');

const chromeCandidates = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
].filter(Boolean);

function resolveChrome() {
  for (const candidate of chromeCandidates) {
    try {
      execFileSync(candidate, ['--version'], { stdio: 'ignore' });
      return candidate;
    } catch {
      // try next
    }
  }
  throw new Error(`No Chrome/Chromium executable found. Tried: ${chromeCandidates.join(', ')}`);
}

async function normalizePdfDates() {
  const bytes = await readFile(outputPdf);
  const source = bytes.toString('latin1');
  const fields = [];
  const fixedDate = "D:20260811120000+00'00'";
  const normalized = source.replace(
    /\/(CreationDate|ModDate) \(D:\d{14}(?:Z|[+-]\d{2}'\d{2}')\)/g,
    (_match, field) => {
      fields.push(field);
      return `/${field} (${fixedDate})`;
    },
  );

  if (fields.sort().join(',') !== 'CreationDate,ModDate') {
    throw new Error(`Expected CreationDate and ModDate in generated PDF; found: ${fields.join(',')}`);
  }
  const normalizedBytes = Buffer.from(normalized, 'latin1');
  if (normalizedBytes.length !== bytes.length) {
    throw new Error('PDF date normalization changed byte length and would invalidate xref offsets');
  }
  await writeFile(outputPdf, normalizedBytes);
}

async function main() {
  const chrome = resolveChrome();
  const fileUrl = `file://${sourceHtml}`;

  await mkdir(receiptDir, { recursive: true });
  await mkdir(path.dirname(outputPdf), { recursive: true });

  const browser = await chromium.launch({
    executablePath: chrome,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    await page.pdf({
      path: outputPdf,
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.55in', right: '0.6in', bottom: '0.5in', left: '0.6in' },
      tagged: true,
      displayHeaderFooter: false,
    });
  } finally {
    await browser.close();
  }

  await normalizePdfDates();

  execFileSync('pdftotext', [outputPdf, textOut], { stdio: 'inherit' });
  execFileSync('pdfinfo', [outputPdf], { stdio: ['ignore', 'pipe', 'inherit'] });
  const pdfinfo = execFileSync('pdfinfo', [outputPdf], { encoding: 'utf8' });
  await writeFile(metaOut, pdfinfo, 'utf8');

  const text = await readFile(textOut, 'utf8');
  const normalizedText = text.replace(/\s+/g, ' ');
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const expectedHead = 'Dave Bettner';
  if (!lines[0]?.startsWith(expectedHead)) {
    throw new Error(`pdftotext reading-order check failed. First line: ${JSON.stringify(lines[0])}`);
  }

  const requiredInOrder = [
    'github.com/dbett4',
    'LSL, LLP · Senior Manager',
    'Citrin Cooperman · Manager of Digital Services',
    'Workiva · Solutions Architect',
    'Ambra Health · Solutions Consultant',
    'Workiva · SEC Reporting Consultant',
    'SELECTED ENGINEERING PROJECTS — AI AGENTS & ENTERPRISE SYSTEMS',
    'Personal Agent Operating System',
    'Hermes Deployment Lab',
    'Hermes Enterprise Evaluation Kit',
    'Regulated Reporting MCP',
    'Upstream Agent-Systems Contributions',
    'SKILLS',
    'EDUCATION',
  ];
  let previous = -1;
  for (const marker of requiredInOrder) {
    const current = text.indexOf(marker);
    if (current <= previous) {
      throw new Error(`pdftotext order/missing-marker check failed: ${marker}`);
    }
    previous = current;
  }
  if (/815[.\s-]*440[.\s-]*1756/.test(text)) {
    throw new Error('public résumé must not expose the phone number');
  }
  if (/not career software engineering or ML research/i.test(text)) {
    throw new Error('public résumé must not include self-rejecting career framing');
  }
  for (const marker of [
    'Python',
    'Docker Compose',
    'Hermes Agent',
    'failure injection/debugging',
    'capability routing',
    'fail-closed privilege brokerage',
  ]) {
    if (!text.includes(marker)) {
      throw new Error(`public résumé missing application-surface marker: ${marker}`);
    }
  }
  if (text.includes('Docker Compose (public CI parse-only)')) {
    throw new Error('skills must use Docker Compose without parse-only qualifier');
  }
  if (/parses Compose|container startup is not attested/i.test(text)) {
    throw new Error('résumé must not use obsolete parse-only container language');
  }
  if (!normalizedText.includes('restart/replay')) {
    throw new Error('résumé must attest Deployment Lab restart/replay behavior');
  }
  for (const marker of ['credential-free failure/replay', 'synthetic reference implementation', 'needs_review']) {
    if (!text.toLowerCase().includes(marker.toLowerCase())) {
      throw new Error(`public résumé missing evidence marker: ${marker}`);
    }
  }

  for (const repo of [
    'github.com/dbett4/hermes-enterprise-deployment-lab',
    'github.com/dbett4/hermes-enterprise-evaluation-kit',
    'github.com/dbett4/regulated-reporting-mcp',
  ]) {
    if (!text.includes(repo)) {
      throw new Error(`public résumé missing flagship repo link text: ${repo}`);
    }
  }
  const html = await readFile(sourceHtml, 'utf8');
  if (/not career software engineering or ML research/i.test(html)) {
    throw new Error('résumé HTML must not include self-rejecting career framing');
  }
  if (!/\.project\s+h3\s*\{[^}]*font-family:\s*Lato/i.test(html)) {
    throw new Error('project headings must use the selected Lato sans-serif system');
  }
  if (/\.project\s+h3\s*\{[^}]*font-family:\s*(?:Georgia|Arial)/i.test(html)) {
    throw new Error('project headings must not use the retired serif/Arial font system');
  }
  for (const href of [
    'https://github.com/dbett4/hermes-enterprise-deployment-lab',
    'https://github.com/dbett4/hermes-enterprise-evaluation-kit',
    'https://github.com/dbett4/regulated-reporting-mcp',
  ]) {
    if (!html.includes(`href="${href}"`)) {
      throw new Error(`résumé HTML missing clickable flagship repo link: ${href}`);
    }
  }
  const skillsBlock = html.match(/<div class="skills">([\s\S]*?)<\/div>/)?.[1] ?? '';
  const skillOrder = [
    'Python',
    'Docker Compose',
    'Hermes Agent',
    'MCP/FastMCP',
    'OAuth/API integration',
    'idempotency/failure recovery',
    'forward-deployed delivery',
    'human review gates',
    'failure injection/debugging',
    'capability routing',
    'fail-closed privilege brokerage',
  ];
  let skillPrevious = -1;
  for (const skill of skillOrder) {
    const current = skillsBlock.indexOf(`>${skill}<`);
    if (current <= skillPrevious) {
      throw new Error(`résumé skills order/missing-marker check failed: ${skill}`);
    }
    skillPrevious = current;
  }
  const pagesMatch = pdfinfo.match(/^Pages:\s+(\d+)/m);
  const pages = Number(pagesMatch?.[1] || 0);
  if (pages < 1 || pages > 2) {
    throw new Error(`public résumé must be one or two balanced pages; generated ${pages}`);
  }

  console.log('RESUME_PDF_PASS');
  console.log(`source=${sourceHtml}`);
  console.log(`output=${outputPdf}`);
  console.log(`pdftotext=${textOut}`);
  console.log(`pdfinfo=${metaOut}`);
  console.log(`first_line=${lines[0]}`);
  console.log(`pages=${pages}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
