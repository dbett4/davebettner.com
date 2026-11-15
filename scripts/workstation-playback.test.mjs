import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

// Run a private native Chrome instance: xvfb-run -a env SITE_URL=http://127.0.0.1:4382 node scripts/workstation-playback.test.mjs
const base = process.env.SITE_URL;
assert.ok(base, 'SITE_URL must name the served private candidate');
const output = resolve(process.env.PLAYBACK_OUTPUT || 'review/dog-rig/playback/current');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: false,
  args: ['--no-sandbox'],
});
const results = [];
const snapshot = page => page.evaluate(() => {
  const root = document.querySelector('[data-workstation]');
  const video = root.querySelector('video');
  const button = root.querySelector('button');
  const image = root.querySelector('img');
  return {
    paused: video.paused, time: video.currentTime, source: video.currentSrc,
    readyState: video.readyState, hidden: document.hidden,
    videoVisible: getComputedStyle(video).visibility,
    posterLoaded: image.complete && image.naturalWidth > 0,
    buttonText: button.textContent, buttonLabel: button.getAttribute('aria-label'),
    buttonHidden: getComputedStyle(button).display === 'none',
    active: root.dataset.motionActive,
    ratio: Math.max(0, Math.min(innerHeight, root.getBoundingClientRect().bottom) - Math.max(0, root.getBoundingClientRect().top)) / root.getBoundingClientRect().height,
    probe: window.__playProbe && { calls: window.__playProbe.calls },
  };
});
async function waitPlaying(page) {
  const before = (await snapshot(page)).time;
  await page.waitForFunction(before => {
    const v = document.querySelector('[data-workstation] video');
    return !v.paused && Math.abs(v.currentTime - before) > .08 && getComputedStyle(v).visibility === 'visible';
  }, before, { timeout: 6000 });
}
const waitPaused = page => page.waitForFunction(() => document.querySelector('[data-workstation] video').paused, null, { timeout: 3000 });
async function stablePause(page) {
  await waitPaused(page);
  const before = (await snapshot(page)).time;
  await page.waitForTimeout(220);
  const after = await snapshot(page);
  assert.ok(after.paused && Math.abs(after.time - before) < .02, 'Paused media must not continue advancing');
  assert.equal(after.active, 'false');
  return after;
}
async function ratio(page, value) {
  // Real IntersectionObserver geometry, including the exact configured threshold.
  await page.evaluate(value => {
    const root = document.querySelector('[data-workstation]');
    // Keep the real component and its observer; remove ancestor clipping so
    // this case measures only the viewport's precise intersection boundary.
    if (root.parentElement !== document.body) document.body.append(root);
    Object.assign(root.style, { position: 'fixed', left: '20px', width: '400px', height: '400px', top: `${innerHeight - 400 * value}px`, zIndex: '100' });
  }, value);
  await page.waitForTimeout(100);
}
async function hideWithTab(page, context) {
  const cover = await context.newPage();
  await cover.bringToFront();
  await page.waitForFunction(() => document.hidden, null, { timeout: 3000 });
  return cover;
}
async function nativeTabs() {
  // Playwright's normal launch forces every tab visible through focus emulation.
  // A private Chrome + noDefaults CDP attachment preserves native tab visibility.
  const profile = await mkdtemp(resolve(output, 'native-profile-'));
  const child = spawn(process.env.CHROME_PATH || '/usr/bin/google-chrome', [
    '--no-sandbox', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--disable-component-update', '--disable-sync',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: 'ignore' });
  const exited = new Promise(resolveExit => child.once('exit', resolveExit));
  let instance;
  const close = async () => {
    if (instance) await instance.close();
    if (child.exitCode === null) child.kill('SIGTERM');
    await exited;
    await rm(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 });
  };
  try {
    let port;
    for (let tries = 0; tries < 100; tries++) {
      try { port = (await readFile(resolve(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
      catch { await new Promise(resolveWait => setTimeout(resolveWait, 50)); }
    }
    assert.ok(port, 'Private native Chrome publishes its loopback debug port');
    instance = await chromium.connectOverCDP({ endpointURL: `http://127.0.0.1:${port}`, noDefaults: true });
    return { context: instance.contexts()[0], close };
  } catch (error) { await close(); throw error; }
}
async function delayedPlay(context) {
  await context.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    window.__playProbe = { calls: 0 };
    HTMLMediaElement.prototype.play = function () {
      const probe = window.__playProbe;
      probe.calls++;
      if (probe.calls !== 1) return original.call(this);
      return new Promise((resolve, reject) => {
        probe.release = () => original.call(this).then(resolve, reject);
        probe.abort = () => reject(new DOMException('Deliberate pending-play abort', 'AbortError'));
      });
    };
  });
}
async function run(name, fn, options = {}) {
  const native = options.nativeTabs ? await nativeTabs() : null;
  const context = native?.context || await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference', ...options });
  const errors = [];
  let page;
  try {
    if (options.delayed) await delayedPlay(context);
    if (options.playRefusal) await context.addInitScript(() => {
      const original = HTMLMediaElement.prototype.play;
      window.__playProbe = { calls: 0 };
      HTMLMediaElement.prototype.play = function () {
        if (++window.__playProbe.calls === 1) return Promise.reject(new DOMException('Deliberate autoplay refusal', 'NotAllowedError'));
        return original.call(this);
      };
    });
    page = await context.newPage();
    if (native) {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    }
    page.on('pageerror', error => errors.push(String(error)));
    if (options.mediaFailure) await page.route('**/video/*.mp4', route => route.abort());
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.bringToFront();
    const evidence = await fn(page, context);
    assert.deepEqual(errors, [], 'No browser script errors');
    const state = await snapshot(page);
    await page.screenshot({ path: resolve(output, `${name}.png`) });
    results.push({ name, passed: true, state, evidence });
  } catch (error) {
    const state = page ? await snapshot(page).catch(() => null) : null;
    if (page) await page.screenshot({ path: resolve(output, `${name}-failed.png`) }).catch(() => {});
    results.push({ name, passed: false, error: String(error), state, errors });
  } finally {
    try {
      if (native) await native.close();
      else await context.close();
    } finally {
      await writeFile(resolve(output, 'results.partial.json'), JSON.stringify(results, null, 2));
    }
  }
  console.log(`${results.at(-1).passed ? 'PASS' : 'FAIL'} ${name}${results.at(-1).error ? `: ${results.at(-1).error}` : ''}`);
}
try {
  await run('visible-scroll-and-keyboard', async page => {
    await waitPlaying(page);
    let state = await snapshot(page);
    assert.equal(state.buttonText, 'Pause');
    assert.equal(state.buttonLabel, 'Pause workstation animation');
    assert.equal(state.active, 'true');
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await stablePause(page);
    await page.evaluate(() => scrollTo(0, 0));
    await waitPlaying(page);
    const button = page.locator('[data-motion-control]');
    await button.focus();
    await page.keyboard.press('Space');
    state = await stablePause(page);
    assert.equal(state.buttonText, 'Play');
    assert.equal(state.buttonLabel, 'Play workstation animation');
    assert.equal(state.videoVisible, 'visible', 'Explicit pause retains the displayed frame');
    await page.keyboard.press('Enter');
    await waitPlaying(page);
  });
  await run('five-percent-threshold', async page => {
    await waitPlaying(page);
    await ratio(page, .04);
    let state = await stablePause(page);
    assert.ok(state.ratio > 0 && state.ratio < .05, 'Element is intersecting but below the threshold');
    await ratio(page, .05);
    await waitPlaying(page);
    await ratio(page, .049);
    state = await stablePause(page);
    assert.ok(state.ratio < .05);
  });
  await run('native-tab-hidden-resume', async (page, context) => {
    await waitPlaying(page);
    await hideWithTab(page, context);
    const background = await stablePause(page);
    assert.equal(background.hidden, true);
    await page.bringToFront();
    await page.waitForFunction(() => !document.hidden);
    await waitPlaying(page);
    return { background, foreground: await snapshot(page) };
  }, { nativeTabs: true });
  await run('explicit-pause-survives-automatic-changes', async (page, context) => {
    await waitPlaying(page);
    await page.locator('[data-motion-control]').click();
    await stablePause(page);
    await ratio(page, 0);
    await ratio(page, 1);
    await stablePause(page);
    await hideWithTab(page, context);
    await page.bringToFront();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    assert.equal((await stablePause(page)).buttonText, 'Play');
  }, { nativeTabs: true });
  await run('reduced-motion-default-and-opt-in', async page => {
    let state = await stablePause(page);
    assert.equal(state.source, '', 'Reduced motion does not request media before opt-in');
    assert.equal(state.videoVisible, 'hidden');
    assert.ok(state.posterLoaded);
    assert.equal(state.buttonText, 'Play');
    await page.locator('[data-motion-control]').focus();
    await page.keyboard.press('Enter');
    await waitPlaying(page);
    await ratio(page, 0);
    await stablePause(page);
    await ratio(page, 1);
    await waitPlaying(page);
    await page.locator('[data-motion-control]').click();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await stablePause(page);
  }, { reducedMotion: 'reduce' });
  await run('live-preference-without-opt-in', async page => {
    await waitPlaying(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await stablePause(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await waitPlaying(page);
  });
  await run('pending-abort-rapid-reentry', async page => {
    assert.equal((await snapshot(page)).probe.calls, 1);
    assert.equal((await snapshot(page)).videoVisible, 'hidden', 'Poster stays visible while no frame is available');
    await ratio(page, 0);
    await ratio(page, 1);
    await page.evaluate(() => window.__playProbe.abort());
    await waitPlaying(page);
    assert.ok((await snapshot(page)).probe.calls >= 2, 'Latest desired state retries after an interrupted pending play');
  }, { delayed: true });
  await run('pending-resolution-after-explicit-pause', async page => {
    assert.equal((await snapshot(page)).buttonText, 'Pause', 'Pending playback remains cancellable with Pause');
    await page.locator('[data-motion-control]').click();
    await page.evaluate(() => window.__playProbe.release());
    await stablePause(page);
    await ratio(page, 0);
    await ratio(page, 1);
    assert.equal((await stablePause(page)).buttonText, 'Play');
  }, { delayed: true });
  await run('pending-resolution-after-hide', async page => {
    await ratio(page, 0);
    await page.evaluate(() => window.__playProbe.release());
    await stablePause(page);
    await ratio(page, 1);
    await waitPlaying(page);
  }, { delayed: true });
  await run('pending-resolution-after-tab-hidden', async (page, context) => {
    await hideWithTab(page, context);
    await page.evaluate(() => { window.__playProbe.release(); });
    const background = await stablePause(page);
    assert.equal(background.hidden, true);
    await page.bringToFront();
    await waitPlaying(page);
    return { background, foreground: await snapshot(page) };
  }, { delayed: true, nativeTabs: true });
  await run('pending-abort-preference-reentry', async page => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(100);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForTimeout(100);
    await page.evaluate(() => window.__playProbe.abort());
    await waitPlaying(page);
  }, { delayed: true });
  await run('autoplay-refusal-can-retry-explicitly', async page => {
    const state = await stablePause(page);
    assert.equal(state.buttonText, 'Play');
    assert.equal(state.buttonHidden, false);
    assert.equal(state.videoVisible, 'hidden');
    assert.ok(state.posterLoaded);
    assert.equal(state.probe.calls, 1, 'Autoplay refusal does not create a retry loop');
    await page.locator('[data-motion-control]').click();
    await waitPlaying(page);
  }, { playRefusal: true });
  await run('mobile-reduced-motion-keyboard', async page => {
    const state = await stablePause(page);
    assert.equal(state.source, '');
    await page.locator('[data-motion-control]').focus();
    await page.keyboard.press('Enter');
    await waitPlaying(page);
    await page.keyboard.press('Space');
    await stablePause(page);
  }, { reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  await run('javascript-disabled-poster', async page => {
    const state = await snapshot(page);
    assert.ok(state.posterLoaded && state.paused && !state.source);
    assert.equal(state.videoVisible, 'hidden');
    assert.ok(state.buttonHidden, 'A control requiring JavaScript is hidden when JavaScript is disabled');
  }, { javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await run('media-error-poster', async page => {
    await page.waitForFunction(() => document.querySelector('[data-motion-control]').hidden);
    const state = await stablePause(page);
    assert.ok(state.posterLoaded && state.buttonHidden);
    assert.equal(state.videoVisible, 'hidden');
  }, { mediaFailure: true });
  const component = await readFile('src/components/WorkstationMedia.astro');
  const report = { base, browser: browser.version(), componentSha256: createHash('sha256').update(component).digest('hex'), passed: results.filter(r => r.passed).length, total: results.length, results };
  await writeFile(resolve(output, 'checks.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, total: report.total, output }));
  if (report.passed !== report.total) process.exitCode = 1;
} finally {
  await browser.close();
}
