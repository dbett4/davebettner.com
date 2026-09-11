import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';


const out = resolve('node_modules/.cache/theme-review');
await mkdir(out, { recursive: true });
const base = process.env.SITE_URL;
assert.ok(/^https?:\/\//.test(base || ''), 'Set SITE_URL to a real server serving dist; file fixtures cannot prove site navigation.');
const routes = [
  '/', '/experience/', '/experience/connected-reporting/', '/work/', '/fit/', '/about/', '/404.html',
  '/work/accounting-acceptance-lab/', '/work/regulated-reporting-mcp/', '/work/hermes-deployment-lab/',
  '/work/dedup-readback-bridge/', '/work/hermes-field-kit/', '/work/wingman/', '/work/agent-operating-system/',
];
const axeSource = await readFile(resolve('node_modules/axe-core/axe.min.js'), 'utf8');
const checks = [];
const check = (pass, label, detail = '') => {
  checks.push({ pass: Boolean(pass), label, detail });
  assert.ok(pass, `${label}${detail ? `: ${detail}` : ''}`);
};

const fixtureUrl = (route) => new URL(route, base).href;

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-webgl', '--disable-3d-apis', '--disable-breakpad'],
});
const pageErrors = [];
const screenshotCases = [
  { route: '/', mode: 'light', width: 1440, height: 768, file: 'home-light-desktop.png' },
  { route: '/', mode: 'dark', width: 1440, height: 768, file: 'home-dark-desktop.png' },
  { route: '/', mode: 'light', width: 390, height: 844, file: 'home-light-mobile.png' },
  { route: '/', mode: 'dark', width: 390, height: 844, file: 'home-dark-mobile.png' },
  { route: '/experience/', mode: 'light', width: 1440, height: 768, file: 'experience-light-desktop.png' },
  { route: '/experience/', mode: 'dark', width: 1440, height: 768, file: 'experience-dark-desktop.png' },
  { route: '/experience/', mode: 'light', width: 390, height: 844, file: 'experience-light-mobile.png' },
  { route: '/experience/', mode: 'dark', width: 390, height: 844, file: 'experience-dark-mobile.png' },
];

try {
  const context = await browser.newContext({ colorScheme: 'light', viewport: { width: 1440, height: 768 } });
  const page = await context.newPage();
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  for (const mode of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: mode });
    await page.goto(fixtureUrl('/'), { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('db-theme'));
    await page.reload({ waitUntil: 'networkidle' });
    check(await page.locator('html').getAttribute('data-theme') === mode, `OS ${mode} default`, await page.locator('html').getAttribute('data-theme'));
  }

  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(fixtureUrl('/'), { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('db-theme'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Use dark theme' }).click();
  check(await page.locator('html').getAttribute('data-theme') === 'dark', 'explicit dark selection applies');
  check(await page.getByRole('button', { name: 'Use dark theme' }).getAttribute('aria-pressed') === 'true', 'dark control exposes pressed state');
  await page.getByRole('link', { name: 'Experience', exact: true }).first().click();
  check(await page.locator('html').getAttribute('data-theme') === 'dark', 'explicit preference persists across navigation');
  await page.reload({ waitUntil: 'networkidle' });
  check(await page.locator('html').getAttribute('data-theme') === 'dark', 'explicit preference persists across reload');

  const storageBlocked = await browser.newContext({ colorScheme: 'light', viewport: { width: 390, height: 844 } });
  await storageBlocked.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('storage blocked by test'); } });
  });
  const blockedPage = await storageBlocked.newPage();
  await blockedPage.goto(fixtureUrl('/'), { waitUntil: 'networkidle' });
  check(await blockedPage.locator('html').getAttribute('data-theme') === 'light', 'blocked localStorage does not break first paint');
  await blockedPage.getByRole('button', { name: 'Use dark theme' }).click();
  check(await blockedPage.locator('html').getAttribute('data-theme') === 'dark', 'blocked localStorage still permits in-session toggle');
  await storageBlocked.close();

  await page.goto(fixtureUrl('/'), { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('db-theme'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.emulateMedia({ colorScheme: 'dark' });
  check(await page.locator('html').getAttribute('data-theme') === 'dark', 'system preference changes apply before explicit choice');
  await page.getByRole('button', { name: 'Use light theme' }).click();
  await page.emulateMedia({ colorScheme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });
  check(await page.locator('html').getAttribute('data-theme') === 'light', 'system preference stops changing after explicit choice');
  await page.getByRole('button', { name: 'Use dark theme' }).click();

  await page.goto(fixtureUrl('/'), { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  check(await page.getByRole('link', { name: 'Skip to content', exact: true }).evaluate((element) => element === document.activeElement), 'skip link receives first keyboard focus');
  await page.keyboard.press('Enter');
  check(await page.evaluate(() => location.hash === '#main'), 'skip link reaches main content');
  await page.getByRole('button', { name: 'Use dark theme' }).focus();
  await page.keyboard.press('Enter');
  check(await page.locator('html').getAttribute('data-theme') === 'dark', 'theme toggle works from keyboard');

  for (const route of routes) {
    await page.goto(fixtureUrl(route), { waitUntil: 'networkidle' });
    const routeResult = await page.evaluate(() => ({
      theme: document.documentElement.dataset.theme,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      h1: document.querySelectorAll('h1').length,
      main: document.querySelectorAll('main').length,
      images: [...document.images].every((image) => image.complete && image.naturalWidth > 0),
      controls: document.querySelectorAll('[data-theme-choice]').length,
    }));
    check(routeResult.theme === 'dark', `${route} honors shared explicit theme`);
    check(!routeResult.overflow, `${route} has no horizontal overflow`);
    check(routeResult.h1 === 1 && routeResult.main === 1, `${route} preserves page structure`);
    check(routeResult.images, `${route} loads all images`);
    check(routeResult.controls === 2, `${route} exposes both theme controls`);
    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations);
    check(violations.length === 0, `${route} axe accessibility`, JSON.stringify(violations.map((violation) => violation.id)));
    for (const href of await page.locator('a[href]').evaluateAll((elements) => elements.map((element) => element.getAttribute('href')))) {
      if (!href || href.startsWith('#') || href.startsWith('mailto:')) continue;
      const target = new URL(href, page.url());
      if (target.origin !== new URL(base).origin) continue;
      const response = await page.request.get(target.href);
      check(response.ok(), `${route} link ${href}`, `HTTP ${response.status()}`);
    }
  }

  const noJs = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark', viewport: { width: 390, height: 844 } });
  const noJsPage = await noJs.newPage();
    await noJsPage.goto(fixtureUrl('/'), { waitUntil: 'networkidle' });
  check(!(await noJsPage.locator('html').getAttribute('data-theme')), 'no-JS leaves theme attribute unset for CSS fallback');
  check(await noJsPage.evaluate(() => getComputedStyle(document.body).backgroundColor === 'rgb(17, 22, 29)'), 'no-JS honors dark OS CSS mode');
  check(await noJsPage.locator('main').isVisible(), 'no-JS content remains accessible');
  await noJs.close();

  const reduced = await browser.newContext({ reducedMotion: 'reduce', colorScheme: 'dark', viewport: { width: 390, height: 844 } });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(fixtureUrl('/'), { waitUntil: 'networkidle' });
  check(await reducedPage.evaluate(() => document.getAnimations().every((animation) => animation.playState !== 'running')), 'reduced motion has no running animations');
  await reduced.close();

  for (const shot of screenshotCases) {
    const shotContext = await browser.newContext({ colorScheme: shot.mode, viewport: { width: shot.width, height: shot.height } });
    const shotPage = await shotContext.newPage();
    await shotPage.goto(fixtureUrl(shot.route), { waitUntil: 'networkidle' });
    await shotPage.screenshot({ path: resolve(out, shot.file), fullPage: false });
    check(await shotPage.locator('html').getAttribute('data-theme') === shot.mode, `${shot.file} captures requested mode`);
    await shotContext.close();
  }
  await context.close();
  check(pageErrors.length === 0, 'browser page errors', JSON.stringify(pageErrors));
} finally {
  await browser.close();
}

const result = {
  routes,
  route_coverage: {
    primary: ['/', '/experience/', '/work/', '/fit/', '/about/'],
    experience_case_study: ['/experience/connected-reporting/'],
    linked_case_studies: routes.filter((route) => route.startsWith('/work/') && route !== '/work/'),
    utility: ['/404.html'],
  },
  viewports: [1440, 390],
  screenshot_paths: screenshotCases.map((shot) => resolve(out, shot.file)),
  browser_mode: 'Chrome against the actual served site over HTTP/HTTPS',
  base,
  checks,
  passed: checks.filter((item) => item.pass).length,
  failed: checks.filter((item) => !item.pass).length,
};
await import('node:fs/promises').then(({ writeFile }) => writeFile(resolve(out, 'theme-checks.json'), JSON.stringify(result, null, 2)));
console.log(JSON.stringify({ passed: result.passed, failed: result.failed, routes: routes.length, screenshots: result.screenshot_paths }, null, 2));
