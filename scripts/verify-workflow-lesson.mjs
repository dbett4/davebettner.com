import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const out = resolve(process.env.WORKFLOW_LESSON_OUT || 'node_modules/.cache/workflow-lesson-review');
await mkdir(out, { recursive: true });
const checks = [];
const pageErrors = [];
const externalRequests = [];
const screenshots = [];
let server;
let base = process.env.SITE_URL;
let browser;

function check(condition, label) {
  checks.push({ label, pass: Boolean(condition) });
  assert.ok(condition, label);
}

async function textIs(page, selector, expected, label) {
  const actual = (await page.locator(selector).textContent()).trim();
  check(actual === expected, `${label}. Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
}

async function applicationIs(page, stock, revision, writes, label) {
  await textIs(page, '#application-stock', stock, `${label} stock`);
  await textIs(page, '#application-revision', revision, `${label} revision`);
  await textIs(page, '#write-count', writes, `${label} write count`);
}

try {
  if (!base) {
    const port = await new Promise((resolvePort, reject) => {
      const probe = createServer();
      probe.once('error', reject);
      probe.listen(0, '127.0.0.1', () => {
        const address = probe.address();
        probe.close(error => error ? reject(error) : resolvePort(address.port));
      });
    });
    base = `http://127.0.0.1:${port}`;
    server = spawn('/usr/bin/python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', resolve('dist')], { stdio: 'ignore' });
    let serverError;
    server.once('error', error => { serverError = error; });
    const deadline = Date.now() + 10000;
    let ready = false;
    while (Date.now() < deadline) {
      if (serverError) throw serverError;
      if (server.exitCode !== null) throw new Error(`Local preview exited with ${server.exitCode}`);
      try {
        ready = (await fetch(base, { signal: AbortSignal.timeout(500) })).ok;
        if (ready) break;
      } catch {}
      await new Promise(resolveWait => setTimeout(resolveWait, 100));
    }
    check(ready, 'Built site is served by the local preview');
  }
  assert.match(base, /^https?:\/\//, 'SITE_URL must be an HTTP or HTTPS URL');
  const origin = new URL(base).origin;
  const url = new URL('/learn/verify-an-ai-update/', base).href;
  const axeSource = await readFile(resolve('node_modules/axe-core/axe.min.js'), 'utf8');
  browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  for (const width of [1440, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', colorScheme: 'dark' });
    const page = await context.newPage();
    page.on('pageerror', error => pageErrors.push(String(error)));
    page.on('request', request => {
      const target = new URL(request.url());
      if (target.protocol.startsWith('http') && target.origin !== origin) externalRequests.push(request.url());
    });
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    check(response?.ok(), `${width}px lesson route serves successfully`);
    await page.evaluate(() => document.fonts.ready);
    await textIs(page, 'h1', 'How do you know an AI update worked?', `${width}px lesson heading`);
    check(await page.getByRole('button', { name: 'Check proposal', exact: true }).isEnabled(), `${width}px controls initialize`);
    check(await page.getByRole('button', { name: 'Approve and apply', exact: true }).isDisabled(), `${width}px approval requires checks`);

    await page.keyboard.press('Tab');
    check(await page.locator('.skip').evaluate(element => element === document.activeElement), `${width}px skip link has first keyboard focus`);
    await page.keyboard.press('Enter');
    check(await page.locator('main').evaluate(element => element === document.activeElement), `${width}px skip link focuses main`);
    await page.getByLabel('Try a case', { exact: true }).focus();
    check(await page.getByLabel('Try a case', { exact: true }).evaluate(element => {
      const style = getComputedStyle(element);
      return element === document.activeElement && style.outlineStyle === 'solid' && style.outlineWidth === '3px';
    }), `${width}px native select shows keyboard focus`);

    await page.getByRole('button', { name: 'Read application', exact: true }).click();
    await applicationIs(page, '100 units', '3', '0', `${width}px read before applying`);
    check(await page.getByRole('button', { name: 'Approve and apply', exact: true }).isDisabled(), `${width}px reading does not authorize a write`);

    for (const fixture of ['valid', 'stale-source', 'wrong-calculation', 'lost-response']) {
      const label = `${width}px ${fixture}`;
      await page.getByLabel('Try a case', { exact: true }).selectOption(fixture);
      await applicationIs(page, '100 units', '3', '0', `${label} starts fresh`);
      check(await page.locator('#workflow-log li').count() === 1, `${label} fixture switch clears the action log`);
      check(await page.locator('#proposal-checks').isHidden(), `${label} fixture switch clears old checks`);
      await page.getByRole('button', { name: 'Check proposal', exact: true }).click();

      if (fixture === 'stale-source' || fixture === 'wrong-calculation') {
        await textIs(page, '#workflow-status', 'Checks failed. Apply is blocked. The application has not changed.', `${label} blocks the proposal`);
        check(await page.getByRole('button', { name: 'Approve and apply', exact: true }).isDisabled(), `${label} approval is disabled`);
        const failedCheck = fixture === 'stale-source'
          ? 'Fail. Proposal inspected inventory-6; current source is inventory-7.'
          : 'Fail. 100 + 30 − 20 = 110. Proposal is 115 units.';
        check((await page.locator('#proposal-checks').textContent()).includes(failedCheck), `${label} explains the actual failure`);
        await page.locator('#apply-proposal').dispatchEvent('click');
        await page.getByRole('button', { name: 'Read application', exact: true }).click();
        await applicationIs(page, '100 units', '3', '0', `${label} rejected write cannot mutate application`);
        await textIs(page, '#write-receipt', 'Not requested', `${label} has no write receipt`);
      } else {
        await textIs(page, '#workflow-status', 'Checks passed. You can approve the 110-unit update. No write has occurred.', `${label} passes checks`);
        check(await page.getByRole('button', { name: 'Approve and apply', exact: true }).isEnabled(), `${label} approval is available`);
        await page.getByRole('button', { name: 'Approve and apply', exact: true }).click();
        await applicationIs(page, '100 units', '3', fixture === 'lost-response' ? 'Unknown' : '1', `${label} receipt does not refresh the last read or reveal an uncertain write`);
        await textIs(page, '#write-receipt', fixture === 'lost-response' ? 'Response lost' : 'Accepted', `${label} receipt status`);
        check(await page.getByRole('button', { name: 'Approve and apply', exact: true }).isDisabled(), `${label} disables a second write`);
        await page.locator('#apply-proposal').dispatchEvent('click');
        await page.getByRole('button', { name: 'Read application', exact: true }).click();
        await applicationIs(page, '110 units', '4', '1', `${label} readback finds the saved update`);
        const verified = fixture === 'lost-response'
          ? 'Readback confirms 110 units at revision 4. The write succeeded despite the lost response. One write; no retry needed.'
          : 'Readback confirms 110 units at revision 4. The approved update is verified. One write made.';
        await textIs(page, '#workflow-status', verified, `${label} final verification`);
        await page.locator('#apply-proposal').dispatchEvent('click');
        await page.getByRole('button', { name: 'Read application', exact: true }).click();
        await applicationIs(page, '110 units', '4', '1', `${label} repeated read and duplicate apply keep exactly one write`);
      }
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label} has no document overflow`);
    }

    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations);
    check(violations.length === 0, `${width}px axe accessibility ${JSON.stringify(violations.map(violation => violation.id))}`);
    check(await page.getByRole('status').getAttribute('aria-live') === 'polite', `${width}px result announcements are polite`);
    check(await page.evaluate(() => document.getAnimations().every(animation => animation.playState !== 'running')), `${width}px reduced motion has no running animations`);
    check(await page.evaluate(() => getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)'), `${width}px page keeps the site's white theme`);
    const screenshot = resolve(out, `lesson-${width}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    screenshots.push(screenshot);

    await page.getByRole('button', { name: 'Reset example', exact: true }).click();
    await applicationIs(page, '100 units', '3', '0', `${width}px reset restores the application`);
    await textIs(page, '#write-receipt', 'Not requested', `${width}px reset clears the receipt`);
    check(await page.getByLabel('Try a case', { exact: true }).inputValue() === 'lost-response', `${width}px reset keeps the selected fixture`);
    check(await page.locator('#workflow-log li').count() === 1, `${width}px reset clears the action log`);
    await context.close();
  }

  const noScript = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
  const staticPage = await noScript.newPage();
  await staticPage.goto(url, { waitUntil: 'networkidle' });
  await textIs(staticPage, 'h1', 'How do you know an AI update worked?', 'No-JS lesson stays available');
  await applicationIs(staticPage, '100 units', '3', '0', 'No-JS static example');
  await textIs(staticPage, '#proposed-stock', '110 units', 'No-JS proposal');
  for (const button of await staticPage.locator('#workflow-demo button').all()) check(await button.isDisabled(), 'No-JS action remains disabled');
  check(await staticPage.getByLabel('Try a case', { exact: true }).isDisabled(), 'No-JS fixture remains disabled');
  check(await staticPage.locator('noscript').isVisible(), 'No-JS requirement is explained');
  check(await staticPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No-JS example has no document overflow');
  await noScript.close();
  check(pageErrors.length === 0, `Browser has no page errors ${JSON.stringify(pageErrors)}`);
  check(externalRequests.length === 0, `Demo makes no external requests ${JSON.stringify(externalRequests)}`);
} finally {
  await browser?.close();
  if (server && server.exitCode === null) {
    const exited = new Promise(resolveExit => server.once('exit', resolveExit));
    server.kill('SIGTERM');
    await exited;
  }
  const result = { base, passed: checks.filter(check => check.pass).length, failed: checks.filter(check => !check.pass).length, checks, pageErrors, externalRequests, screenshots };
  await writeFile(resolve(out, 'checks.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ passed: result.passed, failed: result.failed, screenshots }, null, 2));
}
