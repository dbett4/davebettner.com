import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const externalBase = process.env.SITE_URL?.replace(/\/$/, '');
const base = externalBase || 'http://127.0.0.1:4322';
let preview;
let browser;
const checks = [];

function check(condition, label, detail = '') {
  checks.push({ label, pass: Boolean(condition), detail });
  if (!condition) throw new Error(`${label}${detail ? `: ${detail}` : ''}`);
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(base);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Preview did not become ready at ${base}`);
}

async function previewIsReady() {
  try {
    const response = await fetch(base);
    return response.ok;
  } catch {
    return false;
  }
}

try {
  if (!externalBase && !(await previewIsReady())) {
    preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4322'], {
      cwd: process.cwd(),
      stdio: 'ignore',
    });
    await waitForPreview();
  }

  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: true,
  });
  const page = await browser.newPage();

  await page.goto(`${base}/fit/`, { waitUntil: 'networkidle' });
  const fitRegression = await page.evaluate(() => ({
    phases: document.querySelectorAll('.ninety-plan > li').length,
    oldToolControls: document.querySelectorAll('#job-description, .fit-ai-btn, #fit-copy-prompt').length,
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    relatedTargets: [...document.querySelectorAll('.page-links a')].map((link) => link.getAttribute('href') ?? ''),
  }));
  check(fitRegression.phases === 4, 'First 90 days plan keeps four phases', String(fitRegression.phases));
  check(fitRegression.oldToolControls === 0, 'Removed fit-prompt controls do not regress into the static page', String(fitRegression.oldToolControls));
  check(fitRegression.horizontalOverflow === 0, 'First 90 days page has no horizontal overflow', String(fitRegression.horizontalOverflow));
  for (const route of ['/about/', '/experience/', '/work/']) {
    check(fitRegression.relatedTargets.includes(route), `First 90 days related links include ${route}`);
  }

  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  const sourcePortrait = page.locator('[data-source-portrait]');
  check(
    (await sourcePortrait.count()) === 1 &&
      (await page.locator('[data-kinetic-portrait]').count()) === 0,
    'Hero contains one source-preserving portrait cutout',
  );
  check(
    (await sourcePortrait.getAttribute('src')) === '/images/dave-bettner-headshot-c13-navy-cutout.png' &&
      (await page.locator('.cover-specimen canvas').count()) === 0,
    'Hero preserves the approved navy-tie cutout without a processing canvas',
  );
  const heroResume = page.locator('.cover-actions-primary a[download]');
  check((await heroResume.count()) === 1, 'Hero contains one résumé download');

  const redirects = await readFile('dist/_redirects', 'utf8');
  for (const source of ['/dither', '/dither/', '/mockups/dither', '/mockups/dither/']) {
    check(
      redirects.split(/\r?\n/).some((line) => line.trim() === `${source} /preview-dither/ 301`),
      `Redirect manifest includes ${source}`,
    );
  }
  for (const source of ['/work/deployment-lab', '/work/deployment-lab/']) {
    check(
      redirects.split(/\r?\n/).some((line) => line.trim() === `${source} /work/hermes-deployment-lab/ 301`),
      `Redirect manifest includes ${source} → hermes-deployment-lab`,
    );
  }

  if (externalBase) {
    for (const source of ['/dither', '/dither/', '/mockups/dither', '/mockups/dither/']) {
      const response = await page.request.get(`${base}${source}`, { maxRedirects: 0 });
      check(response.status() === 301, `Production ${source} returns 301`, String(response.status()));
      check(response.headers().location === '/preview-dither/', `Production ${source} targets preview-dither`, response.headers().location);
    }
  }

  await page.goto(`${base}/mockups/`, { waitUntil: 'networkidle' });
  const mockupLinks = await page.locator('li a[href^="/"]').evaluateAll((links) =>
    [...new Set(links.map((link) => link.getAttribute('href')).filter(Boolean))],
  );
  const brokenMockupLinks = [];
  for (const href of mockupLinks) {
    const response = await page.request.get(`${base}${href}`);
    if (response.status() >= 400) brokenMockupLinks.push(`${href}:${response.status()}`);
  }
  check(brokenMockupLinks.length === 0, 'Mockup index links resolve', brokenMockupLinks.join(', '));

  console.log(JSON.stringify({ pass: true, count: checks.length, checks }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ pass: false, count: checks.length, checks, error: error.message }, null, 2));
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (preview && !preview.killed) preview.kill('SIGTERM');
}
