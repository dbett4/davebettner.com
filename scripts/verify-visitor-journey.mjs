import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const base = process.env.SITE_URL;
assert.ok(/^https?:\/\//.test(base || ''), 'Set SITE_URL to an HTTP server serving dist.');
const out = resolve(process.env.VISITOR_JOURNEY_OUT || 'node_modules/.cache/visitor-journey');
await mkdir(out, { recursive: true });
const axeSource = await readFile(resolve('node_modules/axe-core/axe.min.js'), 'utf8');
const checks = [];
const failures = [];
const check = (condition, label, detail = '') => {
  const result = { pass: Boolean(condition), label, detail };
  checks.push(result);
  if (!result.pass) failures.push(`${label}${detail ? `: ${detail}` : ''}`);
};

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});
const pageErrors = [];
const consoleErrors = [];
const fixtureUrl = (route) => new URL(route, base).href;
const observedPage = async (context) => {
  const page = await context.newPage();
  page.on('pageerror', (error) => pageErrors.push(`${page.url()}: ${error}`));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(`${page.url()}: ${message.text()}`);
  });
  return page;
};

try {
  const context = await browser.newContext({ colorScheme: 'light', viewport: { width: 1440, height: 900 } });
  const page = await observedPage(context);

  await page.goto(fixtureUrl('/'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.addScriptTag({ content: axeSource });
  const axeViolations = await page.evaluate(async () => (
    await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })
  ).violations);
  check(axeViolations.length === 0, 'homepage has no axe violations', JSON.stringify(axeViolations.map((violation) => violation.id)));

  const explore = page.getByRole('link', { name: 'Explore my work', exact: true });
  check(await explore.getAttribute('href') === '#selected-work', 'primary action targets selected work');
  await explore.click();
  await page.waitForFunction(() => location.hash === '#selected-work' && (() => {
    const rect = document.querySelector('#selected-work')?.getBoundingClientRect();
    return Boolean(rect && rect.top >= -2 && rect.top < window.innerHeight);
  })());
  check(await page.locator('#selected-work').count() === 1, 'selected work target exists exactly once');
  check(await page.locator('#selected-work').evaluate((target) => {
    const rect = target.getBoundingClientRect();
    return rect.top >= -2 && rect.top < window.innerHeight;
  }), 'primary action lands on selected work target');

  await page.goto(fixtureUrl('/'), { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  check(await page.locator('.skip').evaluate((element) => element === document.activeElement), 'skip link receives first keyboard focus');
  await page.keyboard.press('Enter');
  check(await page.evaluate(() => location.hash === '#main'), 'skip link updates the URL hash');
  check(await page.locator('main#main').evaluate((element) => element === document.activeElement), 'skip destination receives programmatic focus');

  const desktopNames = await page.evaluate(() => [...document.querySelectorAll('.projects .project')].map((project) => ({
    name: project.querySelector('h3 a')?.textContent?.trim(),
    nameHref: project.querySelector('h3 a')?.getAttribute('href'),
    aboutLabel: project.querySelector('a[aria-label^="About "]')?.getAttribute('aria-label'),
    repositoryLabel: project.querySelector('a[href^="https://github.com/"]')?.getAttribute('aria-label'),
  })));
  check(desktopNames.length === 2, 'homepage exposes two selected projects', JSON.stringify(desktopNames));
  check(desktopNames.every((project) => project.name && project.nameHref?.startsWith('/work/') && project.aboutLabel?.startsWith('About the project: ') && project.repositoryLabel?.startsWith('View repository: ')), 'homepage project links have contextual names', JSON.stringify(desktopNames));

  await page.goto(fixtureUrl('/work/'), { waitUntil: 'networkidle' });
  const workStructure = await page.evaluate(() => ({
    firstHeading: document.querySelector('h1')?.tagName,
    projectHeadings: [...document.querySelectorAll('.project-list .project h2')].map((heading) => ({
      text: heading.textContent?.trim(),
      href: heading.querySelector('a')?.getAttribute('href'),
    })),
    projectH3s: document.querySelectorAll('.project-list .project h3').length,
    links: [...document.querySelectorAll('.project-list .project')].map((project) => ({
      aboutLabel: project.querySelector('a[aria-label^="About "]')?.getAttribute('aria-label'),
      repositoryLabel: project.querySelector('a[href^="https://github.com/"]')?.getAttribute('aria-label'),
    })),
  }));
  check(workStructure.firstHeading === 'H1' && workStructure.projectH3s === 0, 'work project list follows h1 with h2 headings', JSON.stringify(workStructure));
  check(workStructure.projectHeadings.length === 2 && workStructure.projectHeadings.every((heading) => heading.href?.startsWith('/work/')), 'work project names are links', JSON.stringify(workStructure.projectHeadings));
  check(workStructure.links.every((project) => project.aboutLabel?.startsWith('About the project: ') && project.repositoryLabel?.startsWith('View repository: ')), 'work project links have contextual names', JSON.stringify(workStructure.links));

  const mobileContext = await browser.newContext({ colorScheme: 'light', viewport: { width: 320, height: 844 } });
  const mobilePage = await observedPage(mobileContext);
  await mobilePage.goto(fixtureUrl('/'), { waitUntil: 'networkidle' });
  const mobileHeader = await mobilePage.evaluate(() => {
    const header = document.querySelector('.masthead');
    const brand = document.querySelector('.masthead-brand');
    const tools = document.querySelector('.header-tools');
    const nav = document.querySelector('.masthead nav');
    const navLinks = [...document.querySelectorAll('.masthead nav a')];
    const rowOneBottom = Math.max(brand?.getBoundingClientRect().bottom ?? 0, tools?.getBoundingClientRect().bottom ?? 0);
    return {
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      headerWidth: header?.getBoundingClientRect().width,
      brandBox: brand?.getBoundingClientRect().toJSON(),
      toolsBox: tools?.getBoundingClientRect().toJSON(),
      navBox: nav?.getBoundingClientRect().toJSON(),
      rowOneBottom,
      navCount: navLinks.length,
      navHeights: navLinks.map((link) => link.getBoundingClientRect().height),
      themeHeight: document.querySelector('[data-theme-toggle]')?.getBoundingClientRect().height,
      emailHeight: document.querySelector('.header-email')?.getBoundingClientRect().height,
    };
  });
  check(!mobileHeader.overflow && mobileHeader.headerWidth <= 320, '320px masthead has no horizontal overflow', JSON.stringify(mobileHeader));
  check(mobileHeader.navCount === 4 && mobileHeader.navBox.top >= mobileHeader.rowOneBottom - 1, 'mobile masthead uses two rows with full navigation below controls', JSON.stringify(mobileHeader));
  check(mobileHeader.brandBox.width >= 44 && mobileHeader.brandBox.height >= 44 && mobileHeader.themeHeight >= 44 && mobileHeader.emailHeight >= 44 && mobileHeader.navHeights.every((height) => height >= 44), 'mobile masthead targets remain at least 44px', JSON.stringify(mobileHeader));
  await mobileContext.close();

  const reducedContext = await browser.newContext({ reducedMotion: 'reduce', colorScheme: 'dark', viewport: { width: 390, height: 844 } });
  const reducedPage = await observedPage(reducedContext);
  await reducedPage.goto(fixtureUrl('/'), { waitUntil: 'networkidle' });
  const reduced = await reducedPage.evaluate(() => ({
    media: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    runningAnimations: document.getAnimations().filter((animation) => animation.playState === 'running').length,
  }));
  check(reduced.media && reduced.scrollBehavior === 'auto', 'reduced motion disables smooth scrolling', JSON.stringify(reduced));
  check(reduced.runningAnimations === 0, 'reduced motion stops running animations', JSON.stringify(reduced));
  await reducedContext.close();

  for (const shot of [
    { mode: 'light', width: 1440, height: 900, file: 'home-light-desktop.png' },
    { mode: 'dark', width: 1440, height: 900, file: 'home-dark-desktop.png' },
    { mode: 'light', width: 320, height: 844, file: 'home-light-mobile.png' },
    { mode: 'dark', width: 320, height: 844, file: 'home-dark-mobile.png' },
  ]) {
    const shotContext = await browser.newContext({ colorScheme: shot.mode, viewport: { width: shot.width, height: shot.height } });
    const shotPage = await observedPage(shotContext);
    await shotPage.goto(fixtureUrl('/'), { waitUntil: 'networkidle' });
    await shotPage.evaluate(() => document.fonts.ready);
    await shotPage.screenshot({ path: resolve(out, shot.file), fullPage: true });
    check(await shotPage.locator('html').getAttribute('data-theme') === shot.mode, `${shot.file} captures requested OS theme`);
    await shotContext.close();
  }

  await context.close();
} finally {
  await browser.close();
}

check(pageErrors.length === 0, 'browser page errors', JSON.stringify(pageErrors));
check(consoleErrors.length === 0, 'browser console errors', JSON.stringify(consoleErrors));
const result = {
  base,
  checks,
  passed: checks.filter((item) => item.pass).length,
  failed: failures.length,
  screenshot_paths: [
    resolve(out, 'home-light-desktop.png'),
    resolve(out, 'home-dark-desktop.png'),
    resolve(out, 'home-light-mobile.png'),
    resolve(out, 'home-dark-mobile.png'),
  ],
};
await writeFile(resolve(out, 'visitor-journey-checks.json'), JSON.stringify(result, null, 2));
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ passed: result.passed, failed: result.failed, screenshots: result.screenshot_paths }, null, 2));
}
