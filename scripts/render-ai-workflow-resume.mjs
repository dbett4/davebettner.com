import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = `${root}resume/dave-bettner-ai-workflows.md`;
const html = `${root}resume/dave-bettner-ai-workflows.html`;
const pdf = `${root}resume/dave-bettner-ai-workflows.pdf`;
execFileSync('pandoc', [source, '--standalone', '--metadata', 'title=Dave Bettner | Resume', '--css', 'ai-workflows.css', '-o', html]);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(html).href);
  await page.evaluate(() => document.fonts.ready);
  if (!(await page.evaluate(() => [...document.fonts].some(font => font.family === 'Manrope' && font.status === 'loaded')))) {
    throw new Error('Resume font did not load.');
  }
  await page.pdf({ path: pdf, format: 'Letter', preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false, tagged: true });
} finally {
  await browser.close();
}
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const manifest = {
  source: 'resume/dave-bettner-ai-workflows.md', sourceSha256: hash(source),
  html: 'resume/dave-bettner-ai-workflows.html', htmlSha256: hash(html),
  css: 'resume/ai-workflows.css', cssSha256: hash(`${root}resume/ai-workflows.css`),
  font: 'public/fonts/manrope.woff2', fontSha256: hash(`${root}public/fonts/manrope.woff2`),
  pdf: 'resume/dave-bettner-ai-workflows.pdf', pdfSha256: hash(pdf),
};
writeFileSync(`${root}resume/ai-workflows-manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
