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
for (const [label, x, y] of [['mic_head_gap', 420, 220], ['left_monitor_gap', 500, 320], ['stand_gap', 558, 330]]) {
  check(alphaAt(x, y) === 0, `matte clears confirmed enclosed pocket: ${label}`, String(alphaAt(x, y)));
}
for (const [label, x, y] of [['spreadsheet_screen', 330, 315], ['silver_can_or_desk_object', 570, 575], ['light_foreground_detail', 488, 555], ['rug_detail', 725, 630]]) {
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
        check(state.pauseButtons === 0 && !state.pauseCopy, `${mode}/${width} ${route} has no screen-pause control`);
        if (route === '/') check(state.sceneMask === 'none' && state.mediaMask.includes('dave-workstation-soft-fade-mask.png'), `${mode}/${width} home applies source-coordinate alpha falloff without a dog-fading wrapper mask`, JSON.stringify({ sceneMask: state.sceneMask, mediaMask: state.mediaMask }));
        check(state.brandCount === 1 && state.brandHref === '/' && state.brandLabel === 'Dave Bettner home', `${mode}/${width} ${route} has accessible home avatar link`);
        check(state.brandText === '' && state.imageSrc === avatarPath && state.imageAlt === '' && state.imageComplete, `${mode}/${width} ${route} uses current square headshot`);
        check(state.anchorTarget && state.imageSize, `${mode}/${width} ${route} avatar target/image dimensions`, JSON.stringify({ anchorTarget: state.anchorTarget, imageSize: state.imageSize }));
      }
      await context.close();
    }
  }

  const motionContext = await browser.newContext({ colorScheme: 'light', viewport: { width: 1440, height: 900 } });
  const motionPage = await motionContext.newPage();
  motionPage.on('pageerror', (error) => pageErrors.push(`motion: ${error}`));
  await motionPage.goto(`${base}/`, { waitUntil: 'networkidle' });
  await motionPage.waitForFunction(() => document.querySelector('[data-workstation]')?.dataset.motionActive === 'true');
  const animation = await motionPage.locator('.terminal-content').evaluate((element) => {
    const style = getComputedStyle(element);
    const current = element.getAnimations()[0];
    return {
      duration: style.animationDuration,
      delay: style.animationDelay,
      iterations: style.animationIterationCount,
      name: style.animationName,
      currentTime: current?.currentTime ?? null,
      transform: style.transform,
    };
  });
  check(animation.name === 'workstation-terminal-scroll', 'monitor uses the bounded scroll animation');
  check(Number.parseFloat(animation.duration) <= 2.1 && Number.parseFloat(animation.duration) >= 1.8, 'monitor scroll lasts about two seconds', animation.duration);
  check(Number.parseFloat(animation.delay) >= 0.5 && Number.parseFloat(animation.delay) <= 1.2, 'monitor starts with a still hold', animation.delay);
  check(animation.iterations === '1', 'monitor scroll is not infinite', animation.iterations);
  check(animation.transform === 'none' || animation.transform === 'matrix(1, 0, 0, 1, 0, 0)', 'monitor begins still before its eased pass', animation.transform);
  const frameBefore = await motionPage.locator('.workstation-media').screenshot();
  await motionPage.waitForFunction(() => document.querySelector('[data-workstation]')?.dataset.motionComplete === 'true', { timeout: 5000 });
  const frameAfter = await motionPage.locator('.workstation-media').screenshot();
  const finished = await motionPage.locator('.terminal-content').evaluate((element) => {
    const current = element.getAnimations()[0];
    return { playState: current?.playState, currentTime: current?.currentTime, transform: getComputedStyle(element).transform };
  });
  check(finished.playState !== 'running' && finished.transform !== 'none', 'monitor scroll finishes and holds', JSON.stringify(finished));
  const [beforePixels, afterPixels] = await Promise.all([
    sharp(frameBefore).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(frameAfter).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  let changed = 0;
  let minX = beforePixels.info.width;
  let minY = beforePixels.info.height;
  let maxX = 0;
  let maxY = 0;
  for (let offset = 0; offset < beforePixels.data.length; offset += 4) {
    if (Math.max(
      Math.abs(beforePixels.data[offset] - afterPixels.data[offset]),
      Math.abs(beforePixels.data[offset + 1] - afterPixels.data[offset + 1]),
      Math.abs(beforePixels.data[offset + 2] - afterPixels.data[offset + 2]),
    ) <= 5) continue;
    const x = (offset / 4) % beforePixels.info.width;
    const y = Math.floor(offset / 4 / beforePixels.info.width);
    changed += 1;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const monitorBounds = { changed, minX, minY, maxX, maxY, width: beforePixels.info.width, height: beforePixels.info.height };
  check(changed >= 30, 'monitor scroll changes visible pixels', JSON.stringify(monitorBounds));
  check(minX >= beforePixels.info.width * 0.54 && maxX <= beforePixels.info.width * 0.74 && minY >= beforePixels.info.width * 0.23 && maxY <= beforePixels.info.width * 0.37, 'monitor scroll stays inside registered monitor glass', JSON.stringify(monitorBounds));
  await motionPage.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await motionPage.waitForTimeout(100);
  await motionPage.evaluate(() => scrollTo(0, 0));
  await motionPage.waitForTimeout(300);
  const reentry = await motionPage.locator('.terminal-content').evaluate((element) => {
    const current = element.getAnimations()[0];
    return { playState: current?.playState, currentTime: current?.currentTime, complete: element.closest('[data-workstation]')?.dataset.motionComplete };
  });
  check(reentry.complete === 'true' && reentry.playState !== 'running' && Math.abs(Number(reentry.currentTime) - Number(finished.currentTime)) < 5, 'monitor does not restart on viewport reentry', JSON.stringify({ finished, reentry }));
  await motionContext.close();

  const noJsContext = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', colorScheme: 'dark', viewport: { width: 390, height: 844 } });
  const noJsPage = await noJsContext.newPage();
  await noJsPage.goto(`${base}/`, { waitUntil: 'networkidle' });
  const noJs = await noJsPage.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    overflow: document.documentElement.scrollWidth > innerWidth,
    animations: document.getAnimations().map((animation) => animation.playState),
    sceneVisible: document.querySelector('.scene-render')?.getBoundingClientRect().width > 0,
    terminalVisible: getComputedStyle(document.querySelector('.terminal-layer')).display !== 'none' && getComputedStyle(document.querySelector('.terminal-layer')).visibility !== 'hidden',
    mask: getComputedStyle(document.querySelector('.workstation-media')).maskImage,
    webkitMask: getComputedStyle(document.querySelector('.workstation-media')).getPropertyValue('-webkit-mask-image'),
    buttonCount: document.querySelectorAll('[data-theme-toggle]').length,
    scheme: getComputedStyle(document.documentElement).colorScheme,
  }));
  check(!noJs.theme && !noJs.overflow && noJs.animations.every((state) => state !== 'running'), 'no-JS remains static and overflow-free', JSON.stringify(noJs));
  check(noJs.sceneVisible && !noJs.terminalVisible, 'no-JS preserves static workstation only');
  check(noJs.mask !== 'none' || noJs.webkitMask !== 'none', 'no-JS keeps scene alpha falloff');
  check(noJs.buttonCount === 0 && noJs.scheme === 'light', 'no-JS dark OS remains light with no theme control');
  await noJsContext.close();

  const reducedContext = await browser.newContext({ reducedMotion: 'reduce', colorScheme: 'dark', viewport: { width: 390, height: 844 } });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(`${base}/`, { waitUntil: 'networkidle' });
  const reduced = await reducedPage.evaluate(() => ({
    running: document.getAnimations().some((animation) => animation.playState === 'running'),
    terminalVisible: getComputedStyle(document.querySelector('.terminal-layer')).display !== 'none' && getComputedStyle(document.querySelector('.terminal-layer')).visibility !== 'hidden',
    active: document.querySelector('[data-workstation]')?.dataset.motionActive,
    complete: document.querySelector('[data-workstation]')?.dataset.motionComplete,
  }));
  check(!reduced.running && !reduced.terminalVisible && reduced.active !== 'true', 'reduced motion remains static', JSON.stringify(reduced));
  await reducedContext.close();

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
