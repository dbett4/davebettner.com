import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { chromium } from 'playwright-core';

const dist = resolve('dist');
const out = resolve(process.env.CAPTURE_DIR || 'node_modules/.cache/avatar-fade/after');
const routes = [
  '/',
  '/about/',
  '/experience/',
  '/experience/connected-reporting/',
  '/fit/',
  '/work/',
  '/work/accounting-acceptance-lab/',
  '/work/regulated-reporting-mcp/',
  '/work/hermes-deployment-lab/',
  '/work/dedup-readback-bridge/',
  '/work/hermes-field-kit/',
  '/work/wingman/',
  '/work/agent-operating-system/',
];
const avatarPath = '/images/dave-bettner-headshot-20260808-square.webp';
const checks = [];
const check = (condition, label, detail = '') => {
  const result = { pass: Boolean(condition), label, detail };
  checks.push(result);
  assert.ok(result.pass, `${label}${detail ? `: ${detail}` : ''}`);
};

await mkdir(out, { recursive: true });
const asset = await sharp(resolve('public/images/dave-workstation-transparent.webp')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const alphaAt = (x, y) => asset.data[(y * asset.info.width + x) * 4 + 3];
// Re-registered against the dog/desk correction after independent visual review.
// (420,220) is now spreadsheet foreground; it must never be cleared as a gap.
for (const [label, x, y] of [['mic_head_gap', 433, 288], ['left_monitor_gap', 365, 220], ['stand_gap', 526, 308]]) {
  check(alphaAt(x, y) === 0, `matte clears confirmed enclosed pocket: ${label}`, String(alphaAt(x, y)));
}
for (const [label, x, y] of [['spreadsheet_screen', 420, 220], ['desk_foreground_detail', 681, 380], ['lower_figure_detail', 563, 575], ['rug_detail', 520, 720]]) {
  check(alphaAt(x, y) === 255, `matte keeps protected foreground opaque: ${label}`, String(alphaAt(x, y)));
}
for (const route of routes) {
  await access(resolve(dist, route === '/' ? 'index.html' : `${route.slice(1)}index.html`));
}

const port = await new Promise((resolvePort, reject) => {
  const probe = createServer();
  probe.once('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const address = probe.address();
    const selected = typeof address === 'object' && address ? address.port : null;
    probe.close((error) => (error ? reject(error) : resolvePort(selected)));
  });
});
const server = spawn('/usr/bin/python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', dist], { stdio: 'ignore' });
const base = `http://127.0.0.1:${port}`;
const pageErrors = [];
const captures = [];
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });

try {
  const deadline = Date.now() + 15000;
  let ready = false;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${base}/`);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  check(ready, 'static dist preview becomes ready', base);

  for (const mode of ['light', 'dark']) {
    for (const width of [1440, 768, 390, 320]) {
      const height = width >= 768 ? 900 : 844;
      const context = await browser.newContext({ colorScheme: mode, viewport: { width, height } });
      const page = await context.newPage();
      page.on('pageerror', (error) => pageErrors.push(`${mode}/${width}: ${error}`));
      for (const route of routes) {
        const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
        check(response?.status() === 200, `${mode}/${width} ${route} returns 200`, String(response?.status()));
        await page.evaluate(() => document.fonts.ready);
        const state = await page.evaluate((expectedAvatar) => {
          const root = document.documentElement;
          const brand = document.querySelector('header.masthead > a.masthead-brand');
          const image = brand?.querySelector('img');

          const sceneWrap = document.querySelector('.scene-wrap');
          const workstationMedia = document.querySelector('.workstation-media');
          const brandBox = brand?.getBoundingClientRect();
          const imageBox = image?.getBoundingClientRect();
          return {
            scheme: getComputedStyle(root).colorScheme,
            background: getComputedStyle(document.body).backgroundColor,
            overflow: root.scrollWidth > innerWidth,
            buttonCount: document.querySelectorAll('[data-theme-toggle]').length,

            pauseButtons: document.querySelectorAll('[data-workstation-motion-button], .scene-motion-toggle').length,
            pauseCopy: document.body.innerText.includes('Pause screen motion'),
            brandCount: document.querySelectorAll('header.masthead > a.masthead-brand').length,
            brandHref: brand?.getAttribute('href'),
            brandLabel: brand?.getAttribute('aria-label'),
            brandText: brand?.textContent?.trim(),
            imageSrc: image?.getAttribute('src'),
            imageAlt: image?.getAttribute('alt'),
            imageComplete: Boolean(image?.complete && image.naturalWidth === 1200 && image.naturalHeight === 1200),
            anchorTarget: Boolean(brandBox && brandBox.width >= 44 && brandBox.height >= 44),
            imageSize: Boolean(imageBox && imageBox.width >= 30 && imageBox.width <= 36 && imageBox.height >= 30 && imageBox.height <= 36),
            sceneMask: sceneWrap ? getComputedStyle(sceneWrap).maskImage : null,
            mediaMask: workstationMedia ? getComputedStyle(workstationMedia).maskImage : null,
            expectedAvatar,
          };
        }, avatarPath);
        check(state.scheme === 'light' && state.background === 'rgb(230, 235, 240)', `${mode}/${width} ${route} stays light regardless of OS`, state.scheme);
        check(!state.overflow, `${mode}/${width} ${route} has no horizontal overflow`);
        check(state.buttonCount === 0, `${mode}/${width} ${route} exposes no theme button`, String(state.buttonCount));
        check(state.pauseButtons === 0 && !state.pauseCopy, `${mode}/${width} ${route} has no obsolete screen-only pause control`);
        if (route === '/') check(state.sceneMask === 'none' && state.mediaMask === 'none', `${mode}/${width} home uses the baked rug matte without a rectangular wrapper mask`, JSON.stringify({ sceneMask: state.sceneMask, mediaMask: state.mediaMask }));
        check(state.brandCount === 1 && state.brandHref === '/' && state.brandLabel === 'Dave Bettner home', `${mode}/${width} ${route} has accessible home avatar link`);
        check(state.brandText === '' && state.imageSrc === avatarPath && state.imageAlt === '' && state.imageComplete, `${mode}/${width} ${route} uses current square headshot`);
        check(state.anchorTarget && state.imageSize, `${mode}/${width} ${route} avatar target/image dimensions`, JSON.stringify({ anchorTarget: state.anchorTarget, imageSize: state.imageSize }));
      }
      await context.close();
    }
  }

  // Recorded-media lifecycle and motion are exercised by verify-workstation-video.mjs.

  for (const [mode, width, height, label] of [['light', 1440, 900, 'desktop'], ['dark', 1440, 900, 'desktop'], ['light', 390, 844, 'mobile'], ['dark', 390, 844, 'mobile']]) {
    const context = await browser.newContext({ colorScheme: mode, viewport: { width, height } });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const prefix = `home-${mode}-${label}`;
    const fullPath = resolve(out, `${prefix}-full.png`);
    const foldPath = resolve(out, `${prefix}-fold.png`);
    const scenePath = resolve(out, `${prefix}-scene.png`);
    await page.screenshot({ path: fullPath, fullPage: true });
    await page.screenshot({ path: foldPath, fullPage: false });
    await page.locator('.scene-wrap').screenshot({ path: scenePath });
    captures.push({ mode, width, height, fullPath, foldPath, scenePath });
    await context.close();
  }
  check(pageErrors.length === 0, 'browser page errors', JSON.stringify(pageErrors));
} finally {
  await browser.close();
  server.kill('SIGTERM');
}

const result = {
  base,
  routes,
  routeCount: routes.length,
  captures,
  checks,
  passed: checks.filter((item) => item.pass).length,
  failed: checks.filter((item) => !item.pass).length,
};
await writeFile(resolve(out, 'avatar-fade-checks.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ routeCount: result.routeCount, passed: result.passed, failed: result.failed, captures: result.captures }, null, 2));
