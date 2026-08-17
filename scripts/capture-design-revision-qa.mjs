/**
 * Design-revision QA capture for davebettner.com.
 * Serves dist/, writes the five required production-qa screenshots, and
 * prints pass/fail for primary CTA viewport fit, horizontal overflow, and
 * SignalField touch activation.
 *
 * Usage (from repo root, after a current build):
 *   node scripts/capture-design-revision-qa.mjs
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';

const out = 'research/production-qa';
const distDir = resolve('dist');
await mkdir(out, { recursive: true });

const localPort = await new Promise((resolvePort, reject) => {
  const server = createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : null;
    server.close((error) => (error ? reject(error) : resolvePort(port)));
  });
});

const base = `http://127.0.0.1:${localPort}`;
const preview = spawn(
  'python3',
  ['-m', 'http.server', String(localPort), '--bind', '127.0.0.1', '--directory', distDir],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);

const deadline = Date.now() + 15_000;
let ready = false;
while (Date.now() < deadline) {
  try {
    const response = await fetch(base);
    if (response.ok) {
      ready = true;
      break;
    }
  } catch {
    // still starting
  }
  await new Promise((r) => setTimeout(r, 150));
}
if (!ready) {
  preview.kill('SIGTERM');
  throw new Error('Static production preview did not become ready within 15 seconds');
}

const checks = [];
const ok = (condition, label, detail = '') => {
  checks.push({ label, pass: Boolean(condition), detail });
};

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});

const shots = [
  { file: 'homepage-desktop-1440x900.png', path: '/', width: 1440, height: 900 },
  { file: 'homepage-laptop-1280x720.png', path: '/', width: 1280, height: 720 },
  { file: 'homepage-mobile-390x844.png', path: '/', width: 390, height: 844, hasTouch: true },
  { file: 'experience-desktop-1440x900.png', path: '/experience/', width: 1440, height: 900 },
  { file: 'experience-mobile-390x844.png', path: '/experience/', width: 390, height: 844, hasTouch: true },
];

async function assertOverflow(page, label) {
  const dimensions = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
  });
  ok(
    dimensions.scrollWidth <= dimensions.clientWidth,
    `${label}: no horizontal overflow`,
    JSON.stringify(dimensions),
  );
}

async function assertHireCtaInViewport(page, label) {
  const hireCtaVisible = await page.evaluate(() => {
    const cta = document.querySelector('.cover-actions-primary a.round.blue');
    if (!(cta instanceof HTMLElement)) return null;
    const rect = cta.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      inViewport: rect.top >= 0 && rect.bottom <= innerHeight && rect.height > 0,
    };
  });
  ok(
    Boolean(hireCtaVisible?.inViewport),
    `${label}: primary hiring CTA visible in first viewport`,
    JSON.stringify(hireCtaVisible),
  );
}

try {
  for (const shot of shots) {
    const context = await browser.newContext({
      viewport: { width: shot.width, height: shot.height },
      hasTouch: Boolean(shot.hasTouch),
      isMobile: Boolean(shot.hasTouch),
    });
    const page = await context.newPage();
    await page.goto(`${base}${shot.path}`, { waitUntil: 'networkidle' });
    await assertOverflow(page, shot.file);

    if (shot.path === '/' && (shot.width === 1280 || shot.width <= 390)) {
      await assertHireCtaInViewport(page, shot.file);
    }

    await page.screenshot({ path: `${out}/${shot.file}`, fullPage: false });
    console.log(`WROTE ${out}/${shot.file}`);
    await context.close();
  }

  const shaderContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const shaderPage = await shaderContext.newPage();
  await shaderPage.goto(base, { waitUntil: 'networkidle' });
  const shaderContract = await shaderPage.locator('[data-interstellar-field]').evaluate((field) => {
    const canvas = field.querySelector('canvas');
    return {
      ready: document.documentElement.dataset.interstellarReady === 'true',
      webgl: field.getAttribute('data-webgl'),
      fallback: field.getAttribute('data-fallback'),
      canvasCount: field.querySelectorAll('canvas').length,
      pointerEvents: canvas instanceof HTMLCanvasElement ? getComputedStyle(canvas).pointerEvents : null,
      ariaHidden: canvas?.getAttribute('aria-hidden'),
    };
  });
  ok(
    Boolean(
      shaderContract.ready &&
        shaderContract.canvasCount === 1 &&
        (shaderContract.webgl === 'ready' || shaderContract.fallback === 'true') &&
        shaderContract.pointerEvents === 'none' &&
        shaderContract.ariaHidden === 'true'
    ),
    'shader: mobile field is ready, decorative, and pointer-inert',
    JSON.stringify(shaderContract),
  );
  await shaderContext.close();

  const reducedContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(base, { waitUntil: 'networkidle' });
  const reducedCanvas = reducedPage.locator('[data-interstellar-field] canvas');
  const firstFrame = await reducedCanvas.evaluate((canvas) => canvas.toDataURL());
  await reducedPage.waitForTimeout(500);
  const secondFrame = await reducedCanvas.evaluate((canvas) => canvas.toDataURL());
  ok(firstFrame === secondFrame, 'shader: reduced-motion field remains on one authored frame');
  await reducedContext.close();
} finally {
  await browser.close();
  preview.kill('SIGTERM');
}

const failed = checks.filter((c) => !c.pass);
for (const check of checks) {
  const status = check.pass ? 'PASS' : 'FAIL';
  const detail = check.detail ? ` — ${check.detail}` : '';
  console.log(`${status}: ${check.label}${detail}`);
}

console.log(
  failed.length === 0
    ? `DESIGN_REVISION_QA_PASS (${checks.length}/${checks.length})`
    : `DESIGN_REVISION_QA_FAIL (${checks.length - failed.length}/${checks.length} passed)`,
);

if (failed.length > 0) {
  process.exitCode = 1;
}
