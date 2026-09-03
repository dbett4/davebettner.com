import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4174';
const out = process.env.OUT_DIR ?? 'artifacts/accounting-acceptance-video/frames';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(`${base}/lab/accounting-acceptance/`, { waitUntil: 'networkidle' });
await page.screenshot({ path: `${out}/01-intro.png` });
await page.locator('.replay').scrollIntoViewIfNeeded();
await page.screenshot({ path: `${out}/02-c01.png` });
await page.locator('[data-case-id="C02"]').click();
await page.screenshot({ path: `${out}/03-c02.png` });
await page.locator('.comparison').scrollIntoViewIfNeeded();
await page.screenshot({ path: `${out}/04-benchmark.png` });
await page.locator('.replay').scrollIntoViewIfNeeded();
await page.locator('[data-case-id="C12"]').click();
console.log(`C12 packet ${await page.locator('[data-hash]').innerText()}`);
await page.screenshot({ path: `${out}/05-c12.png` });
await browser.close();
console.log('ACCOUNTING_DEMO_CAPTURE_PASS frames=5');
