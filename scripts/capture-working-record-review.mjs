import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';

const revisionIndex = process.argv.indexOf('--revision');
const revision = revisionIndex >= 0 ? process.argv[revisionIndex + 1] : '';
if (!/^[0-9a-f]{40}$/.test(revision)) throw new Error('Pass --revision followed by the exact 40-character Git commit.');

const out = resolve('handoff/working-record', revision);
const dist = resolve('dist');
await mkdir(out, { recursive: true });

const port = await new Promise((accept, reject) => {
  const server = createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    const selected = typeof address === 'object' && address ? address.port : null;
    server.close((error) => (error ? reject(error) : accept(selected)));
  });
});
const base = `http://127.0.0.1:${port}`;
const preview = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', dist], {
  stdio: 'ignore',
});

for (let attempt = 0; attempt < 100; attempt += 1) {
  try {
    if ((await fetch(base)).ok) break;
  } catch {}
  if (attempt === 99) throw new Error('Static preview did not become ready.');
  await new Promise((accept) => setTimeout(accept, 100));
}

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-webgl', '--disable-3d-apis'],
});

const results = [];
const screenshots = [];
const widths = [320, 360, 390, 414, 768, 1024, 1440];

async function audit(width, options = {}) {
  const context = await browser.newContext({
    viewport: { width, height: width <= 414 ? 844 : 900 },
    reducedMotion: options.reducedMotion ? 'reduce' : 'no-preference',
    javaScriptEnabled: options.javaScriptEnabled ?? true,
  });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  if (options.textSpacing) {
    await page.addStyleTag({
      content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}',
    });
  }
  if (options.zoom) await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  const value = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    h1: document.querySelectorAll('h1').length,
    sourcePortraits: document.querySelectorAll('[data-source-portrait]').length,
    canvases: document.querySelectorAll('canvas').length,
    primaryLabel: document.querySelector('.hero-actions .action-primary')?.textContent?.trim(),
    primaryHref: document.querySelector('.hero-actions .action-primary')?.getAttribute('href'),
    details: document.querySelectorAll('.nav-disclosure').length,
    ready: document.readyState,
  }));
  results.push({ name: options.name ?? `width-${width}`, ...value, noHorizontalOverflow: value.scrollWidth <= value.clientWidth });
  await context.close();
}

try {
  for (const width of widths) await audit(width);
  await audit(390, { name: 'reduced-motion-390', reducedMotion: true });
  await audit(390, { name: 'javascript-disabled-390', javaScriptEnabled: false });
  await audit(390, { name: 'text-spacing-390', textSpacing: true });
  await audit(768, { name: 'zoom-200-percent-768', zoom: true });

  for (const shot of [
    { name: 'desktop-fold-1440x900.png', width: 1440, height: 900, fullPage: false },
    { name: 'desktop-full-1440x900.png', width: 1440, height: 900, fullPage: true },
    { name: 'mobile-fold-390x844.png', width: 390, height: 844, fullPage: false },
    { name: 'mobile-full-390x844.png', width: 390, height: 844, fullPage: true },
  ]) {
    const context = await browser.newContext({ viewport: { width: shot.width, height: shot.height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => { document.activeElement instanceof HTMLElement && document.activeElement.blur(); scrollTo(0, 0); });
    const path = resolve(out, shot.name);
    await page.screenshot({ path, fullPage: shot.fullPage });
    const bytes = await readFile(path);
    screenshots.push({
      name: shot.name,
      path,
      viewport: { width: shot.width, height: shot.height },
      fullPage: shot.fullPage,
      reducedMotion: true,
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
    await context.close();
  }
} finally {
  await browser.close();
  preview.kill('SIGTERM');
}

const failures = results.filter((item) => !item.noHorizontalOverflow || item.h1 !== 1 || item.sourcePortraits !== 1 || item.canvases !== 0 || item.primaryLabel !== 'View selected work' || item.primaryHref !== '/work/' || item.details !== 1 || item.ready !== 'complete');
const packet = {
  schema: 'vision_review_packet.v1',
  generatedAt: new Date().toISOString(),
  revision,
  branch: process.env.BRANCH_NAME ?? '',
  worktree: process.cwd(),
  route: '/',
  visualSystem: 'The Working Record',
  unpublished: true,
  mechanical: { pass: failures.length === 0, results, failures },
  screenshots,
};
await writeFile(resolve(out, 'vision_review_packet.json'), `${JSON.stringify(packet, null, 2)}\n`);
console.log(JSON.stringify(packet, null, 2));
if (failures.length) process.exitCode = 1;
