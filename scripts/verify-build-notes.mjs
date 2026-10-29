import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const base = process.env.SITE_URL;
assert.ok(base, 'SITE_URL must identify the site being verified');
const out = resolve(process.env.BUILD_NOTES_REVIEW_DIR || 'node_modules/.cache/build-notes');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const errors = [];
const checks = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Notes', exact: true }).click();
    await page.waitForURL(new URL('/notes/', base).href);
    assert.equal(await page.getByRole('heading', { level: 1 }).innerText(), 'Build notes');
    assert.equal(await page.locator('.masthead a[aria-current="page"]').innerText(), 'Notes');
    const noteLinks = await page.locator('.note-list h2 a').evaluateAll(links => links.map(link => ({ title: link.textContent, path: link.getAttribute('href') })));
    assert.ok(noteLinks.length > 0, 'Published notes are discoverable');
    const feedPath = await page.locator('link[rel="alternate"][type="application/rss+xml"]').getAttribute('href');
    const feed = await page.request.get(new URL(feedPath, base).href);
    assert.equal(feed.status(), 200);
    assert.match(feed.headers()['content-type'], /xml/);
    const items = await page.evaluate(xml => {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      if (doc.querySelector('parsererror')) throw new Error('RSS is not valid XML');
      return [...doc.querySelectorAll('item')].map(item => ({ title: item.querySelector('title')?.textContent, url: item.querySelector('link')?.textContent, date: item.querySelector('pubDate')?.textContent }));
    }, await feed.text());
    assert.equal(new Set(items.map(item => item.url)).size, items.length, 'RSS contains unique article URLs');
    assert.deepEqual(items.map(item => ({ title: item.title, path: new URL(item.url).pathname })), noteLinks, 'RSS and Notes expose the same articles in the same order');
    assert.ok(items.every(item => new URL(item.url).origin === 'https://davebettner.com' && Number.isFinite(Date.parse(item.date))), 'RSS uses canonical URLs and valid publication dates');
    assert.ok(items.every((item, index) => index === 0 || Date.parse(items[index - 1].date) >= Date.parse(item.date)), 'RSS is newest first');
    await page.screenshot({ path: resolve(out, `notes-${width}.png`), fullPage: true });
    for (const item of items) {
      await page.goto(new URL(new URL(item.url).pathname, base).href, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('article h1').innerText(), item.title);
      assert.ok(await page.locator('article time').getAttribute('datetime'));
      assert.ok(await page.locator('article .writing-body').innerText().then(text => text.length > 500), 'RSS leads to a full article');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Article fits the viewport');
      const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
      const article = schemas.map(text => JSON.parse(text)).find(data => data['@type'] === 'BlogPosting');
      assert.equal(article.headline, item.title);
      assert.equal(article.url, item.url);
      if (new URL(item.url).pathname.includes('homebase-promises')) await page.screenshot({ path: resolve(out, `article-${width}.png`), fullPage: true });
    }
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Now', exact: true }).click();
    await page.waitForURL(new URL('/now/', base).href);
    assert.equal(await page.locator('.masthead a[aria-current="page"]').innerText(), 'Now');
    assert.ok(await page.getByRole('heading', { name: 'What I’m working on now', exact: true }).isVisible());
    assert.ok(await page.locator('.now-date').getAttribute('datetime'));
    await page.getByRole('link', { name: 'See the Homebase case study and sandbox screens', exact: true }).click();
    await page.waitForURL(new URL('/work/homebase/', base).href);
    assert.ok(await page.getByRole('heading', { name: 'Homebase', exact: true }).isVisible());
    await page.goto(new URL('/now/', base).href, { waitUntil: 'networkidle' });
    await page.screenshot({ path: resolve(out, `now-${width}.png`), fullPage: true });
    checks.push({ width, articles: items.length, indexFeedAgreement: true, articleSchema: true, nowToHomebase: true });
    await page.close();
  }
  assert.deepEqual(errors, [], 'No page errors during the reading and subscription journeys');
  await writeFile(resolve(out, 'checks.json'), JSON.stringify({ base, checks, errors }, null, 2));
  console.log(JSON.stringify({ buildNotes: 'pass', checks, errors }));
} finally {
  await browser.close();
}
