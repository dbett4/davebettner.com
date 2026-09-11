// Capture the actual served Astro build; never substitute HTML fixtures for it.
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright-core';
const phase = process.env.SOFT_FADE_PHASE || 'after';
assert.ok(['before', 'after'].includes(phase));
const dist = resolve(process.env.DIST_DIR || 'dist');
const out = resolve(`review/light-soft-fade/fade/${phase}`);
await mkdir(out, { recursive: true });
let server;
let base = process.env.SITE_URL;
if (!base) {
  const port = await new Promise((resolvePort, reject) => {
    const probe = createServer(); probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => { const port = probe.address().port; probe.close(error => error ? reject(error) : resolvePort(port)); });
  });
  base = `http://127.0.0.1:${port}`;
  server = spawn('/usr/bin/python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', dist], { stdio: 'ignore' });
}
assert.ok(/^https?:\/\//.test(base));
let browser;
const records = [], errors = [];
try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    try { ready = (await fetch(base)).ok; if (ready) break; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  assert.ok(ready, 'real preview must serve HTTP before capture');
  browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
  for (const width of [1440, 768, 390, 320]) {
    const height = width >= 768 ? 900 : 844;
    // Compare the real still fallback deterministically; the OS motion preference
    // no longer pauses video. Playback is verified separately by the video suite.
    const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: phase === 'before' ? 'light' : 'dark', reducedMotion: 'reduce', viewport: { width, height } });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(String(error)));
    const response = await page.goto(base, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    await page.evaluate(() => document.fonts.ready);
    assert.ok(await page.evaluate(() => [...document.images].every(i => i.complete && i.naturalWidth > 0)), 'actual images loaded');
    const suffix = `${width}x${height}`;
    await page.screenshot({ path: `${out}/homepage-${suffix}.png`, fullPage: true });
    await page.locator('.scene-wrap').scrollIntoViewIfNeeded();
    const state = await page.evaluate(() => {
      const scene = document.querySelector('.scene-wrap'), image = document.querySelector('.scene-render'), media = document.querySelector('.workstation-media');
      const rect = element => { const {x,y,width,height} = element.getBoundingClientRect(); return {x,y,width,height}; };
      return { scene: rect(scene), image: rect(image), media: rect(media), sceneMask: getComputedStyle(scene).maskImage, mediaMask: getComputedStyle(media).maskImage,
        imageLoaded: image.complete && image.naturalWidth === 1000, overflow: document.documentElement.scrollWidth > innerWidth,
        background: getComputedStyle(document.body).backgroundColor, scheme: getComputedStyle(document.documentElement).colorScheme };
    });
    await page.locator('.scene-wrap').screenshot({ path: `${out}/scene-${suffix}.png` });
    // Remove BOTH possible masks, otherwise this comparison falsely compares masked to masked.
    await page.evaluate(() => {
      for (const selector of ['.scene-wrap', '.workstation-media']) {
        const element = document.querySelector(selector);
        element.style.maskImage = 'none'; element.style.webkitMaskImage = 'none';
      }
    });
    await page.locator('.scene-wrap').screenshot({ path: `${out}/scene-unmasked-${suffix}.png` });
    records.push({ width, height, ...state });
    await context.close();
  }
  assert.equal(errors.length, 0, JSON.stringify(errors));
  const files = [];
  for (const r of records) for (const kind of ['homepage', 'scene', 'scene-unmasked']) {
    const path = `${out}/${kind}-${r.width}x${r.height}.png`;
    files.push({ path, sha256: createHash('sha256').update(await readFile(path)).digest('hex') });
  }
  await writeFile(`${out}/manifest.json`, JSON.stringify({ phase, base, dist, records, errors, files }, null, 2));
  console.log(JSON.stringify({ phase, base, widths: records.map(r => r.width), output: out }));
} finally {
  await browser?.close();
  server?.kill('SIGTERM');
}
