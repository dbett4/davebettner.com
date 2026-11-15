#!/usr/bin/env node
/**
 * Deterministic Open Graph image generation from social/dave-bettner-og.html.
 * Uses Playwright + system Chrome and preserves the supplied headshot asset unchanged.
 */
import { chromium } from 'playwright-core';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceHtml = path.join(root, 'social', 'dave-bettner-og.html');
const outputImage = path.join(root, 'public', 'images', 'dave-bettner-og.jpg');
const width = 1200;
const height = 630;

const chromeCandidates = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
].filter(Boolean);

function resolveChrome() {
  for (const candidate of chromeCandidates) {
    try {
      execFileSync(candidate, ['--version'], { stdio: 'ignore' });
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }
  throw new Error(`No Chrome/Chromium executable found. Tried: ${chromeCandidates.join(', ')}`);
}

async function main() {
  const chrome = resolveChrome();
  const source = await readFile(sourceHtml, 'utf8');
  for (const marker of [
    'Forward-deployed delivery · AI-agent systems',
    'Messy customer workflows → deployed systems that hold up.',
    'Discovery, integration, debugging, proof, and adoption',
    'Discover',
    'Shape',
    'Deliver',
    'Adopt',
    'davebettner.com',
  ]) {
    if (!source.includes(marker)) {
      throw new Error(`Open Graph source is missing launch-positioning marker: ${marker}`);
    }
  }
  if (/Fieldguide|Nous Research/i.test(source)) {
    throw new Error('Open Graph source must remain employer-independent');
  }

  await mkdir(path.dirname(outputImage), { recursive: true });
  const browser = await chromium.launch({
    executablePath: chrome,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--force-color-profile=srgb',
      '--font-render-hinting=none',
      '--hide-scrollbars',
    ],
  });

  try {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    await page.goto(pathToFileURL(sourceHtml).href, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images, (image) => image.decode()),
      );
    });

    const state = await page.evaluate(() => {
      const card = document.querySelector('.social-card');
      const image = document.querySelector('.portrait');
      if (!(card instanceof HTMLElement) || !(image instanceof HTMLImageElement)) return null;
      const rect = card.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        imageWidth: image.naturalWidth,
        imageHeight: image.naturalHeight,
        text: card.innerText,
      };
    });

    if (!state || state.width !== width || state.height !== height) {
      throw new Error(`Open Graph card must render at ${width}×${height}; got ${JSON.stringify(state)}`);
    }
    if (state.scrollWidth !== width || state.scrollHeight !== height) {
      throw new Error(`Open Graph card overflowed its viewport: ${JSON.stringify(state)}`);
    }
    if (state.imageWidth !== 1200 || state.imageHeight !== 1200) {
      throw new Error(`Open Graph card did not load the approved 1200×1200 headshot: ${JSON.stringify(state)}`);
    }

    await page.screenshot({
      path: outputImage,
      type: 'jpeg',
      quality: 92,
      clip: { x: 0, y: 0, width, height },
      animations: 'disabled',
      caret: 'hide',
    });
  } finally {
    await browser.close();
  }

  const bytes = await readFile(outputImage);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  console.log('OG_IMAGE_PASS');
  console.log(`source=${sourceHtml}`);
  console.log(`output=${outputImage}`);
  console.log(`dimensions=${width}x${height}`);
  console.log(`bytes=${bytes.length}`);
  console.log(`sha256=${sha256}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
