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

  execFileSync('pdftotext', [outputPdf, textOut], { stdio: 'inherit' });
  execFileSync('pdfinfo', [outputPdf], { stdio: ['ignore', 'pipe', 'inherit'] });
  const pdfinfo = execFileSync('pdfinfo', [outputPdf], { encoding: 'utf8' });
  await writeFile(metaOut, pdfinfo, 'utf8');

  const text = await readFile(textOut, 'utf8');
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
    'PUBLIC ENGINEERING (BY FUNCTION)',
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
  const pagesMatch = pdfinfo.match(/^Pages:\s+(\d+)/m);
  const pages = Number(pagesMatch?.[1] || 0);
  if (pages !== 1) {
    throw new Error(`public résumé must be one page; generated ${pages}`);
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
