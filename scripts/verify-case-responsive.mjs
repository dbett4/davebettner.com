// Focused responsive probe: zero horizontal overflow + acceptance-chain presence
// on the North Star case routes at 320/390/768/1440. Serves dist/ locally.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright-core';

const dist = new URL('../dist/', import.meta.url).pathname;
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2', '.hdr': 'application/octet-stream', '.pdf': 'application/pdf', '.xml': 'application/xml' };

const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(req.url.split('?')[0]));
    if (p.endsWith('/')) p += 'index.html';
    const file = join(dist, p);
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const routes = ['/work/regulated-reporting-mcp/', '/work/hermes-field-kit/', '/work/agent-operating-system/'];
const expectedStates = {
  '/work/regulated-reporting-mcp/': ['Scoped', 'Changed', 'Checked in the system', 'Checked separately', 'Decision'],
  '/work/hermes-field-kit/': ['Scoped', 'Run', 'Recomputed', 'Challenged', 'Decision'],
  '/work/agent-operating-system/': ['Scoped', 'Run', 'Checked in the system', 'Checked separately', 'Decision'],
};
const widths = [320, 390, 768, 1440];
const failures = [];
const pass = (cond, label) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}`);
  if (!cond) failures.push(label);
};

const browser = await chromium.launch({ args: ['--no-sandbox'] });
for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: width <= 390 ? 844 : 1024 } });
  const page = await ctx.newPage();
  for (const route of routes) {
    await page.goto(base + route, { waitUntil: 'networkidle' });
    const m = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      wide: [...document.querySelectorAll('main *')]
        .filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
        .slice(0, 4)
        .map((el) => `${el.tagName}.${el.className}`),
    }));
    pass(m.scrollW <= m.clientW + 1, `${route} @${width}: no horizontal overflow (${m.scrollW}/${m.clientW}) ${m.wide.join(',')}`);
    const states = await page.locator('.acceptance-list li h3').allInnerTexts();
    pass(
      JSON.stringify(states) === JSON.stringify(expectedStates[route]),
      `${route} @${width}: completion checks stay in reader-first order (${states.join(' → ')})`,
    );
    pass((await page.locator('.incident-story').count()) === 1, `${route} @${width}: one failure-mode section`);
    for (const link of await page.locator('.acceptance-link').all()) {
      const href = await link.getAttribute('href');
      pass(Boolean(href) && href !== '#', `${route} @${width}: acceptance link resolves (${href})`);
    }
  }
  await ctx.close();
}
await browser.close();
server.close();

console.log(failures.length === 0 ? '\nCASE_RESPONSIVE_PASS' : `\nCASE_RESPONSIVE_FAIL: ${failures.length}`);
process.exit(failures.length === 0 ? 0 : 1);
