// The site is deliberately light-only, including for returning dark-mode visitors.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const base = process.env.SITE_URL;
assert.ok(/^https?:\/\//.test(base || ''), 'Set SITE_URL to the actual served site.');
const out = resolve(process.env.THEME_OUT || 'node_modules/.cache/theme-review');
await mkdir(out, { recursive: true });
const routes = ['/', '/experience/', '/experience/connected-reporting/', '/work/', '/fit/', '/about/', '/404.html',
  '/work/accounting-acceptance-lab/', '/work/regulated-reporting-mcp/', '/work/hermes-deployment-lab/',
  '/work/dedup-readback-bridge/', '/work/hermes-field-kit/', '/work/wingman/', '/work/agent-operating-system/'];
const axeSource = await readFile(resolve('node_modules/axe-core/axe.min.js'), 'utf8');
const checks = [], pageErrors = [], screenshotPaths = [];
const check = (pass, label, detail = '') => {
  checks.push({ pass: Boolean(pass), label, detail });
  assert.ok(pass, `${label}${detail ? `: ${detail}` : ''}`);
};
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
const observedPage = async context => {
  const page = await context.newPage();
  page.on('pageerror', error => pageErrors.push(`${page.url()}: ${error}`));
  return page;
};
const state = page => page.evaluate(() => ({
  background: getComputedStyle(document.body).backgroundColor,
  color: getComputedStyle(document.body).color,
  scheme: getComputedStyle(document.documentElement).colorScheme,
  controls: document.querySelectorAll('[data-theme-toggle], .theme-control, .theme-icon-sun, .theme-icon-moon').length,
  themeColor: document.querySelector('meta[name="theme-color"]')?.content,
  darkRoot: document.documentElement.dataset.theme === 'dark',
  overflow: document.documentElement.scrollWidth > innerWidth,
  h1: document.querySelectorAll('h1').length,
  main: document.querySelectorAll('main').length,
  images: [...document.images].every(image => image.complete && image.naturalWidth > 0),
}));
const lightCheck = (value, label) => {
  check(value.background === 'rgb(230, 235, 240)' && value.color === 'rgb(24, 33, 43)' && value.scheme === 'light' && !value.darkRoot,
    `${label}: light palette and native controls`, JSON.stringify(value));
  check(value.controls === 0 && value.themeColor === '#e6ebf0', `${label}: no theme switch or dark browser chrome`, JSON.stringify(value));
};
try {
  for (const os of ['light', 'dark']) {
    for (const width of [1440, 768, 390, 320]) {
      const context = await browser.newContext({ colorScheme: os, viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      // Reproduce an existing visitor's persisted preference, without migrating it in test code.
      await context.addInitScript(() => localStorage.setItem('db-theme', 'dark'));
      const page = await observedPage(context);
      for (const route of routes) {
        const response = await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
        check(response?.ok() || (route === '/404.html' && response?.status() === 404), `${os}/${width} ${route}: serves page`);
        await page.evaluate(() => document.fonts.ready);
        const value = await state(page);
        lightCheck(value, `${os}/${width} ${route} with saved dark preference`);
        check(!value.overflow && value.h1 === 1 && value.main === 1 && value.images, `${os}/${width} ${route}: layout, structure, images`, JSON.stringify(value));
        if (width === 1440 && os === 'dark') {
          await page.addScriptTag({ content: axeSource });
          const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations);
          check(!violations.length, `${route}: axe accessibility`, JSON.stringify(violations.map(v => v.id)));
          for (const href of await page.locator('a[href]').evaluateAll(elements => elements.map(e => e.getAttribute('href')))) {
            if (!href || href.startsWith('#') || href.startsWith('mailto:')) continue;
            const target = new URL(href, page.url());
            if (target.origin !== new URL(base).origin) continue;
            const linked = await page.request.get(target.href);
            check(linked.ok(), `${route}: link ${href}`, String(linked.status()));
          }
        }
        if (route === '/' && [1440, 320].includes(width)) {
          const file = resolve(out, `home-light-os-${os}-${width}.png`);
          await page.screenshot({ path: file, fullPage: true });
          screenshotPaths.push(file);
        }
      }
      await page.goto(new URL('/', base).href, { waitUntil: 'networkidle' });
      await page.getByRole('link', { name: 'Experience', exact: true }).first().click();
      lightCheck(await state(page), `${os}/${width}: real navigation`);
      await page.reload({ waitUntil: 'networkidle' });
      lightCheck(await state(page), `${os}/${width}: reload`);
      await page.emulateMedia({ colorScheme: os === 'light' ? 'dark' : 'light' });
      lightCheck(await state(page), `${os}/${width}: changed OS preference`);
      await context.close();
    }
  }
  for (const javaScriptEnabled of [true, false]) {
    const context = await browser.newContext({ javaScriptEnabled, colorScheme: 'dark', reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
    if (javaScriptEnabled) await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('storage blocked by test'); } });
    });
    const page = await observedPage(context);
    for (const route of routes) {
      await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
      lightCheck(await state(page), `${javaScriptEnabled ? 'blocked storage' : 'no JS'} ${route}`);
    }
    await page.goto(new URL('/', base).href, { waitUntil: 'networkidle' });
    check(await page.evaluate(() => document.getAnimations().every(a => a.playState !== 'running')), 'reduced motion has no running animations');
    check(await page.locator('main').isVisible(), 'fallback content stays visible');
    await context.close();
  }
  const context = await browser.newContext({ colorScheme: 'dark', viewport: { width: 390, height: 844 } });
  const page = await observedPage(context);
  await page.goto(new URL('/', base).href, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  check(await page.locator('.skip').evaluate(e => e === document.activeElement), 'skip link gets first keyboard focus');
  await page.keyboard.press('Enter');
  check(await page.locator('main#main').evaluate(e => e === document.activeElement), 'skip link focuses main');
  await context.close();
  check(pageErrors.length === 0, 'browser page errors', JSON.stringify(pageErrors));
} finally {
  await browser.close();
  const result = { base, routes, osPreferences: ['light', 'dark'], renderedTheme: 'light-only', widths: [1440, 768, 390, 320], checks,
    passed: checks.filter(c => c.pass).length, failed: checks.filter(c => !c.pass).length, pageErrors, screenshot_paths: screenshotPaths };
  await writeFile(resolve(out, 'theme-checks.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ passed: result.passed, failed: result.failed, routes: routes.length, screenshots: screenshotPaths }, null, 2));
}
