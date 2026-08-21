import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';

const out = resolve('research/recovery-proof-qa');
const dist = resolve('dist');
await mkdir(out, { recursive: true });

const port = await new Promise((resolvePort, reject) => {
  const server = createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    const selected = typeof address === 'object' && address ? address.port : null;
    server.close((error) => error ? reject(error) : resolvePort(selected));
  });
});

const base = `http://127.0.0.1:${port}`;
const preview = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', dist], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

const stopPreview = async () => {
  if (preview.exitCode !== null) return;
  preview.kill('SIGTERM');
  await Promise.race([
    new Promise((resolveExit) => preview.once('exit', resolveExit)),
    new Promise((resolveTimeout) => setTimeout(resolveTimeout, 2000)),
  ]);
  if (preview.exitCode === null) {
    preview.kill('SIGKILL');
    await Promise.race([
      new Promise((resolveExit) => preview.once('exit', resolveExit)),
      new Promise((resolveTimeout) => setTimeout(resolveTimeout, 2000)),
    ]);
  }
};

const deadline = Date.now() + 15_000;
while (true) {
  try {
    const response = await fetch(base);
    if (response.ok) break;
  } catch {
    // Preview is still starting.
  }
  if (Date.now() >= deadline) {
    await stopPreview();
    throw new Error('Static preview did not become ready within 15 seconds');
  }
  await new Promise((resolveWait) => setTimeout(resolveWait, 150));
}

const checks = [];
const check = (pass, label, detail = '') => checks.push({ pass: Boolean(pass), label, detail });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const stages = [
  { index: 0, key: 'scope', state: 'The agent gets only the access it needs', effects: '0', receipt: 'Nothing changed yet' },
  { index: 2, key: 'fault', state: 'The change went through, but the confirmation was lost', effects: '1', receipt: 'Result still needs to be checked' },
  { index: 4, key: 'readback', state: 'The final count is still one', effects: '1', receipt: 'Verified' },
];

try {
  for (const viewport of [
    { key: 'desktop', width: 1440, height: 1000, isMobile: false },
    { key: 'mobile', width: 390, height: 844, isMobile: true },
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.isMobile,
      isMobile: viewport.isMobile,
    });
    const page = await context.newPage();
    await page.goto(`${base}/work/hermes-deployment-lab/`, { waitUntil: 'networkidle' });
    const explorer = page.locator('[data-recovery-proof]');
    await explorer.scrollIntoViewIfNeeded();

    const geometry = await explorer.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return {
        documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        explorerOverflow: node.scrollWidth - node.clientWidth,
        left: rect.left,
        right: rect.right,
        viewportWidth: innerWidth,
      };
    });
    check(geometry.documentOverflow <= 0, `${viewport.key}: no page-level horizontal overflow`, JSON.stringify(geometry));
    check(geometry.left >= -15 && geometry.right <= viewport.width + 15, `${viewport.key}: explorer stays within intended viewport bleed`, JSON.stringify(geometry));

    for (const stage of stages) {
      await explorer.locator('[data-recovery-stage]').nth(stage.index).click();
      const state = await explorer.locator('[data-stage-state]').innerText();
      const effects = await explorer.locator('[data-stage-effects]').innerText();
      const receipt = await explorer.locator('[data-stage-receipt]').innerText();
      const selected = await explorer.locator('[data-recovery-stage][aria-pressed="true"]').count();
      check(state === stage.state, `${viewport.key}/${stage.key}: state text`, state);
      check(effects === stage.effects, `${viewport.key}/${stage.key}: side-effect count`, effects);
      check(receipt === stage.receipt, `${viewport.key}/${stage.key}: receipt state`, receipt);
      check(selected === 1, `${viewport.key}/${stage.key}: exactly one selected control`, String(selected));
      await explorer.screenshot({ path: resolve(out, `${viewport.key}-${stage.key}.png`) });
    }

    await explorer.locator('[data-recovery-stage]').nth(2).focus();
    await explorer.locator('[data-recovery-stage]').nth(2).press('End');
    check(await explorer.getAttribute('data-stage') === '4', `${viewport.key}: End key reaches readback`);
    const finalStageFocused = await explorer.locator('[data-recovery-stage]').nth(4).evaluate((node) => node === document.activeElement);
    check(finalStageFocused, `${viewport.key}: keyboard focus follows selection`);
    await context.close();
  }

  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(`${base}/work/hermes-deployment-lab/`, { waitUntil: 'networkidle' });
  const duration = await reducedPage.locator('[data-recovery-stage]').first().evaluate((node) => getComputedStyle(node).transitionDuration);
  check(['0s', '1e-05s', '0.00001s'].includes(duration), 'reduced motion: interaction transitions are effectively disabled', duration);
  await reducedContext.close();
} finally {
  await browser.close();
  await stopPreview();
}

const failed = checks.filter((item) => !item.pass);
console.log(JSON.stringify({ pass: failed.length === 0, count: checks.length, failed, checks, output: out }, null, 2));
if (failed.length) process.exitCode = 1;
