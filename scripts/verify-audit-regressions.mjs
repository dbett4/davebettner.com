import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { chromium } from 'playwright-core';

const externalBase = process.env.SITE_URL?.replace(/\/$/, '');
const localPort = externalBase
  ? null
  : await new Promise((resolve, reject) => {
      const server = createServer();
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        const port = address && 'port' in Object(address) ? address.port : null;
        server.close((error) => (error ? reject(error) : resolve(port)));
      });
    });
const base = externalBase || `http://127.0.0.1:${localPort}`;
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

try {
  if (!externalBase) {
    preview = spawn('python3', ['-m', 'http.server', String(localPort), '--bind', '127.0.0.1', '--directory', 'dist'], {
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
  await page.evaluate(() => {
    window.__fitOpenCalls = [];
    window.open = (url, target, features) => {
      window.__fitOpenCalls.push({ url: String(url ?? ''), target, features });
      return null;
    };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.__fitClipboard = String(text ?? '');
        },
      },
    });
  });

  await page.locator('#job-description').fill('');
  await page.locator('.fit-ai-btn[data-provider="chatgpt"]').click();
  await page.waitForTimeout(50);
  let state = await page.evaluate(() => ({
    opens: window.__fitOpenCalls ?? [],
    clipboard: window.__fitClipboard ?? '',
    invalid: document.getElementById('job-description')?.getAttribute('aria-invalid'),
    status: document.getElementById('fit-status')?.textContent ?? '',
  }));
  check(state.opens.length === 0, 'Fit empty input opens no provider', String(state.opens.length));
  check(state.clipboard === '', 'Fit empty input copies no generic prompt');
  check(state.invalid === 'true', 'Fit empty input is marked invalid', String(state.invalid));
  check(state.status.includes('Paste a job description'), 'Fit empty input has actionable status', state.status);

  await page.evaluate(() => {
    const input = document.getElementById('job-description');
    input.value = 'A'.repeat(12_001);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    window.__fitOpenCalls = [];
    window.__fitClipboard = '';
  });
  await page.locator('.fit-ai-btn[data-provider="chatgpt"]').click();
  await page.waitForTimeout(50);
  state = await page.evaluate(() => ({
    opens: window.__fitOpenCalls ?? [],
    invalid: document.getElementById('job-description')?.getAttribute('aria-invalid'),
    status: document.getElementById('fit-status')?.textContent ?? '',
  }));
  check(state.opens.length === 0, 'Fit oversized input opens no provider', String(state.opens.length));
  check(state.invalid === 'true', 'Fit oversized input is marked invalid', String(state.invalid));
  check(state.status.includes('12,000'), 'Fit oversized input reports limit', state.status);

  const longJobDescription = `Senior implementation role ${'x'.repeat(9_000)}`;
  await page.locator('#job-description').fill(longJobDescription);
  await page.evaluate(() => {
    window.__fitOpenCalls = [];
    window.__fitClipboard = '';
  });
  await page.locator('.fit-ai-btn[data-provider="chatgpt"]').click();
  await page.waitForTimeout(50);
  state = await page.evaluate(() => ({
    opens: window.__fitOpenCalls ?? [],
    clipboard: window.__fitClipboard ?? '',
    invalid: document.getElementById('job-description')?.getAttribute('aria-invalid'),
    status: document.getElementById('fit-status')?.textContent ?? '',
  }));
  check(state.opens.length === 1, 'Fit long prompt opens one provider', String(state.opens.length));
  check(state.opens[0]?.url === 'https://chatgpt.com/', 'Fit long prompt opens provider base URL', state.opens[0]?.url);
  check(state.clipboard.includes(longJobDescription), 'Fit long prompt is copied');
  check(state.invalid === 'false', 'Fit valid long input clears invalid state', String(state.invalid));
  check(state.status.includes('too long to pre-fill'), 'Fit long prompt explains base-URL fallback', state.status);

  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  const sourcePortrait = page.locator('[data-source-portrait]');
  check(
    (await sourcePortrait.count()) === 1 &&
      (await page.locator('[data-kinetic-portrait]').count()) === 0,
    'Hero contains one unprocessed source portrait',
  );
  check(
    (await sourcePortrait.getAttribute('src')) === '/images/dave-bettner-headshot-c13-navy.png' &&
      (await page.locator('.cover-specimen canvas').count()) === 0,
    'Hero preserves the approved navy-tie portrait without a processing canvas',
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
