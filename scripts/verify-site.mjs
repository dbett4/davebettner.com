import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { CUTOUT_SIZE } from './portrait-key.mjs';

const configuredBase = process.env.SITE_URL;
const localPort = configuredBase
  ? null
  : await new Promise((resolve, reject) => {
      const server = createServer();
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : null;
        server.close((error) => (error ? reject(error) : resolve(port)));
      });
    });
const base = configuredBase ?? `http://127.0.0.1:${localPort}`;
const out = 'research/production-qa';
const distDir = resolve('dist');
await mkdir(out, { recursive: true });

const checks = [];
const errors = [];
const ok = (condition, label, detail = '') => {
  checks.push({ label, pass: Boolean(condition), detail });
  if (!condition) errors.push(`${label}${detail ? `: ${detail}` : ''}`);
};

async function stopPreview(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;

  const exited = new Promise((resolve) => {
    const done = () => resolve(true);
    child.once('exit', done);
    child.once('error', done);
  });
  const timeout = (ms) => new Promise((resolve) => setTimeout(() => resolve(false), ms));

  child.kill('SIGTERM');
  if (await Promise.race([exited, timeout(2_000)])) return;

  console.warn('VERIFY_SITE_PREVIEW_STOP_TIMEOUT: escalating to SIGKILL');
  child.kill('SIGKILL');
  await Promise.race([exited, timeout(2_000)]);
}

let preview;
if (!configuredBase) {
  preview = spawn('python3', ['-m', 'http.server', String(localPort), '--bind', '127.0.0.1', '--directory', distDir], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
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
      // Preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  if (!ready) {
    await stopPreview(preview);
    throw new Error('Static production preview did not become ready within 15 seconds');
  }
}

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});

const caseEyebrows = {
  'agent-operating-system': 'Architecture · Agent operating system',
  'regulated-reporting-mcp': 'Guarded integration · Regulated Reporting MCP',
  'hermes-deployment-lab': 'Failure recovery · Hermes Deployment Lab',
  wingman: 'Readback + restore · Confirm-before-write quality',
};

const caseStepCounts = {
  'agent-operating-system': 6,
  'regulated-reporting-mcp': 5,
  'hermes-deployment-lab': 5,
  wingman: 6,
};

const projects = [
  {
    slug: 'agent-operating-system',
    title: 'Agent Operating System',
    repo: 'https://github.com/dbett4',
    proof: 'Architecture map',
  },
  {
    slug: 'regulated-reporting-mcp',
    title: 'Regulated Reporting MCP',
    repo: 'https://github.com/dbett4/regulated-reporting-mcp',
    proof: 'Credential-free test suite',
  },
  {
    slug: 'hermes-deployment-lab',
    title: 'Hermes Deployment Lab',
    repo: 'https://github.com/dbett4/hermes-enterprise-deployment-lab',
    proof: 'Public Actions run 31892965924 at release commit 1e68676 attests container restart/replay',
    boundaries: ['Synthetic lab', 'Cloud apply is not attested', 'not a model-driven production run claim', 'no-apply'],
  },
  {
    slug: 'wingman',
    title: 'Confirm-before-write spreadsheet quality',
    repo: 'https://github.com/dbett4/wingman',
    proof: '462 Python tests pass',
  },
];

const coreRoutes = ['/', '/about/', '/experience/', '/work/', '/fit/'];
const projectRoutes = projects.map((project) => `/work/${project.slug}/`);

async function assertHomepageContentContracts(page, name) {
  const nav = (await page.locator('.primary-nav a').allTextContents()).map((text) => text.trim());
  ok(nav.join('|') === 'Work|Experience|Contact', `${name}: primary nav is Work/Experience/Contact`, nav.join('|'));
  ok(((await page.locator('h1').textContent()) ?? '').replace(/\s+/g, '').toLowerCase() === 'davebettner', `${name}: H1 is Dave Bettner identity`);
  ok(((await page.locator('.role-line').textContent()) ?? '').trim() === 'Solutions architecture · implementation leadership · agent systems', `${name}: exact recruiter-readable role line`);
  ok(((await page.locator('.cover-role').textContent()) ?? '').includes('messy part'), `${name}: human customer-facing proposition`);
  ok((await page.locator('.cover-qualifier').count()) === 1, `${name}: one honest experience qualifier`);
  const artifacts = await page.locator('.artifact-figure').evaluateAll((figures) => figures.map((figure) => ({
    href: figure.querySelector('a')?.getAttribute('href') ?? '',
    src: figure.querySelector('img')?.getAttribute('src') ?? '',
    alt: figure.querySelector('img')?.getAttribute('alt') ?? '',
    caption: figure.querySelector('figcaption')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  })));
  ok(artifacts.length === 2, `${name}: two evidence artifacts`, JSON.stringify(artifacts));
  ok(new Set(artifacts.map((item) => item.href)).size === 2 && artifacts.every((item) => item.href === item.src && item.alt.length > 20 && item.caption.includes('Open evidence')), `${name}: evidence artifacts are distinct, inspectable, captioned, and accessible`, JSON.stringify(artifacts));
  ok((await page.locator('.evidence-boundary').count()) === 1, `${name}: exactly one page-level evidence boundary`);
  const boundary = ((await page.locator('.evidence-boundary').textContent()) ?? '').trim();
  ok(/client work stays private/i.test(boundary) && /not client deployments/i.test(boundary) && /Nous affiliation/i.test(boundary), `${name}: evidence boundary keeps claim limits`, boundary);
  ok((await page.locator('a[href="/work/hermes-deployment-lab/"]').count()) === 1, `${name}: deployment recovery case linked once`);
  ok((await page.locator('a[href="/work/regulated-reporting-mcp/"]').count()) === 1, `${name}: guarded reporting case linked once`);
  ok(((await page.locator('#contact h2').textContent()) ?? '').trim() === 'Have a hard implementation problem?', `${name}: specific closing CTA`);
  ok((await page.locator('#contact a[href^="mailto:"]').count()) === 1, `${name}: one closing email action`);
  const body = await page.locator('body').innerText();
  for (const forbidden of ['Fieldguide', 'Chief of Staff', 'Remote-friendly', 'I am an auditor']) ok(!body.includes(forbidden), `${name}: forbidden positioning absent (${forbidden})`);
}

async function assertHomepageResponsiveContracts(page, viewport) {
  const { name, width, height } = viewport;
  const geometry = await page.evaluate(() => {
    const rect = (selector) => {
      const node = document.querySelector(selector);
      if (!(node instanceof HTMLElement)) return null;
      const box = node.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
    };
    const nav = document.querySelector('.primary-nav');
    const links = nav ? [...nav.querySelectorAll('a')].map((link) => {
      const box = link.getBoundingClientRect();
      return { text: link.textContent?.trim(), width: box.width, height: box.height, left: box.left, right: box.right, clipped: link.scrollWidth > link.clientWidth + 1 };
    }) : [];
    return {
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      navOverflow: nav instanceof HTMLElement ? nav.scrollWidth - nav.clientWidth : null,
      links,
      qualifier: rect('.cover-qualifier'),
      actions: rect('.cover-actions'),
      portrait: rect('[data-source-portrait]'),
      artifacts: [...document.querySelectorAll('.artifact-figure')].map((node) => {
        const box = node.getBoundingClientRect();
        return { left: box.left, right: box.right, width: box.width };
      }),
    };
  });
  ok(geometry.overflowX === 0, `${name}: no horizontal page overflow`, JSON.stringify(geometry));
  ok(geometry.navOverflow !== null && geometry.navOverflow <= 1, `${name}: primary nav does not overflow`, JSON.stringify(geometry.links));
  ok(geometry.links.length === 3 && geometry.links.every((link) => link.height >= 44 && !link.clipped && link.left >= -0.5 && link.right <= width + 0.5), `${name}: nav links are readable 44px-high targets inside viewport`, JSON.stringify(geometry.links));
  ok(geometry.artifacts.length === 2 && geometry.artifacts.every((item) => item.width > 0 && item.left >= -0.5 && item.right <= width + 0.5), `${name}: artifacts stay inside viewport`, JSON.stringify(geometry.artifacts));
  if (width <= 390) {
    const contentBottom = Math.max(geometry.qualifier?.bottom ?? 0, geometry.actions?.bottom ?? 0);
    ok(Boolean(geometry.portrait && geometry.portrait.top >= contentBottom - 1 && geometry.portrait.top < height), `${name}: portrait is visible in first viewport without crossing hero copy/actions`, JSON.stringify({ contentBottom, portrait: geometry.portrait }));
  }
}

async function auditPage(page, route, label) {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  const response = await page.goto(`${base}${route === '/' ? '' : route}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts?.ready);
  ok(response?.status() === 200, `${label}: HTTP 200`, String(response?.status()));
  ok(await page.locator('h1').count() === 1, `${label}: exactly one h1`);
  const skipLink = page.locator('.skip-link');
  const skipLinkCount = await skipLink.count();
  ok(skipLinkCount === 1, `${label}: exactly one skip link`, String(skipLinkCount));
  if (skipLinkCount === 1) {
    await skipLink.focus();
    const skipLinkInViewport = await skipLink.evaluate((link) => {
      const rect = link.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.bottom > 0 && rect.left < innerWidth && rect.top < innerHeight;
    });
    ok(skipLinkInViewport, `${label}: skip link enters viewport on focus`);
  }
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  ok(dimensions.scrollWidth <= dimensions.clientWidth, `${label}: no horizontal overflow`, JSON.stringify(dimensions));
  const brokenImages = await page.locator('img').evaluateAll((images) =>
    images
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.getAttribute('src')),
  );
  ok(brokenImages.length === 0, `${label}: images load`, brokenImages.join(', '));
  if (coreRoutes.includes(route) || projectRoutes.includes(route)) {
    const themeLinks = await page.locator('link[rel="stylesheet"]').evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')).filter(Boolean),
    );
    ok(
      themeLinks.filter((href) => href === '/styles/interstellar-system.css').length === 1 &&
        !themeLinks.includes('/styles/editorial-paper-system.css'),
      `${label}: Interstellar is the only public theme stylesheet`,
      themeLinks.join(', '),
    );
    const interstellarPalette = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const body = getComputedStyle(document.body);
      return {
        theme: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
        scheme: document.querySelector('meta[name="color-scheme"]')?.getAttribute('content'),
        carbon: root.getPropertyValue('--space').trim(),
        warm: root.getPropertyValue('--warm').trim(),
        ember: root.getPropertyValue('--ember').trim(),
        rose: root.getPropertyValue('--rose').trim(),
        lavender: root.getPropertyValue('--lavender').trim(),
        bodyBackground: body.backgroundColor,
        bodyColor: body.color,
      };
    });
    ok(
      interstellarPalette.theme === '#08090b' &&
        interstellarPalette.scheme === 'dark' &&
        interstellarPalette.carbon === '#08090b' &&
        interstellarPalette.warm === '#f2eadf' &&
        interstellarPalette.ember === '#ff5005' &&
        interstellarPalette.rose === '#dbba95' &&
        interstellarPalette.lavender === '#d0bce1' &&
        interstellarPalette.bodyBackground === 'rgb(8, 9, 11)' &&
        interstellarPalette.bodyColor === 'rgb(242, 234, 223)',
      `${label}: shared Interstellar palette is active`,
      JSON.stringify(interstellarPalette),
    );
  }
  if (route !== '/') {
    ok(
      (await page.locator('[data-secondary-masthead] .mast-row').count()) === 1,
      `${label}: secondary route uses the shared masthead grammar`,
    );
  }
  const actionTargets = await page.locator('.round, .back-link, .mast-cta, .page-links a, .pdf-note a').evaluateAll((nodes) =>
    nodes.filter((node) => {
      const style = getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }).map((node) => {
      const rect = node.getBoundingClientRect();
      return { text: node.textContent?.trim(), width: rect.width, height: rect.height };
    }),
  );
  ok(
    actionTargets.every((target) => target.width >= 44 && target.height >= 44),
    `${label}: action targets are at least 44×44`,
    JSON.stringify(actionTargets.filter((target) => target.width < 44 || target.height < 44)),
  );
  const missingFragmentTargets = await page.locator('a[href^="#"]').evaluateAll((links) =>
    links
      .map((link) => link.getAttribute('href'))
      .filter((href) => {
        if (!href || href === '#') return false;
        try {
          return !document.getElementById(decodeURIComponent(href.slice(1)));
        } catch {
          return true;
        }
      }),
  );
  ok(
    missingFragmentTargets.length === 0,
    `${label}: same-page links target existing IDs`,
    missingFragmentTargets.join(', '),
  );
  ok(consoleErrors.length === 0, `${label}: no console/page errors`, consoleErrors.join(' | '));
}

try {
  for (const viewport of [
    { name: 'desktop-1440', width: 1440, height: 1000 },
    { name: 'laptop-1280x720', width: 1280, height: 720 },
    { name: 'horizontal-min-961', width: 961, height: 1024 },
    { name: 'vertical-max-960', width: 960, height: 1024 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'vertical-min-721', width: 721, height: 1024 },
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'mobile-320', width: 320, height: 720 },
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await auditPage(page, '/', viewport.name);
    await assertHomepageContentContracts(page, viewport.name);
    await assertHomepageResponsiveContracts(page, viewport);
    await page.evaluate(async () => {
      await Promise.all(Array.from(document.images, (image) => typeof image.decode === 'function' ? image.decode().catch(() => undefined) : Promise.resolve()));
      window.scrollTo(0, 0);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    await page.screenshot({ path: `${out}/${viewport.name}.png`, fullPage: true });
    await context.close();
  }

  const profileContext = await browser.newContext({ viewport: { width: 960, height: 720 } });
  const profilePage = await profileContext.newPage();
  await profilePage.goto(base, { waitUntil: 'networkidle' });
  ok(
    (await profilePage.locator('[data-source-portrait]').count()) === 1 &&
      (await profilePage.locator('[data-kinetic-portrait]').count()) === 0,
    'Homepage has exactly one unprocessed source portrait',
  );
  ok(
    (await profilePage.locator('.mast-name').allTextContents()).join('|') === 'Dave Bettner' &&
      (await profilePage.locator('.cover-identity-name').count()) === 0,
    'Homepage top area shows Dave Bettner once',
  );
  const primaryNavLabel = await profilePage.locator('.primary-nav').getAttribute('aria-label');
  ok(
    primaryNavLabel === 'Primary navigation',
    'Homepage primary navigation has an accurate accessible label',
    String(primaryNavLabel),
  );
  const profileActions = await profilePage.locator('.cover-actions a').evaluateAll((links) =>
    links.map((link) => ({ text: (link.textContent ?? '').trim(), href: link.getAttribute('href') })),
  );
  ok(
    JSON.stringify(profileActions) === JSON.stringify([
      { text: 'View work', href: '/work/' },
      { text: 'Read experience', href: '/experience/' },
    ]),
    'Homepage profile has the approved work and experience actions',
    JSON.stringify(profileActions),
  );

  await profilePage.waitForFunction((expectedWidth) => {
    const source = document.querySelector('[data-source-portrait]');
    return source instanceof HTMLImageElement &&
      source.complete &&
      source.naturalWidth === expectedWidth &&
      document.documentElement.dataset.interstellarReady === 'true';
  }, CUTOUT_SIZE.width, { timeout: 15_000 });

  const portraitContract = await profilePage.locator('[data-source-portrait]').evaluate((source) => {
    if (!(source instanceof HTMLImageElement)) return null;
    const box = source.getBoundingClientRect();
    return {
      src: source.getAttribute('src'),
      alt: source.getAttribute('alt'),
      declaredWidth: source.getAttribute('width'),
      declaredHeight: source.getAttribute('height'),
      naturalWidth: source.naturalWidth,
      naturalHeight: source.naturalHeight,
      renderedWidth: box.width,
      renderedHeight: box.height,
      portraitCanvasCount: source.closest('.cover-specimen')?.querySelectorAll('canvas').length,
      backdrop: (() => {
        const node = source.closest('.cover-specimen')?.querySelector('[data-portrait-backdrop]');
        if (!(node instanceof HTMLElement)) return null;
        const style = getComputedStyle(node);
        return {
          count: source.closest('.cover-specimen')?.querySelectorAll('[data-portrait-backdrop]').length,
          backgroundImage: style.backgroundImage,
          display: style.display,
          opacity: Number(style.opacity),
          zIndex: Number(style.zIndex),
        };
      })(),
      legacyPlate: (() => {
        const specimen = source.closest('.cover-specimen');
        if (!(specimen instanceof HTMLElement)) return null;
        return {
          before: getComputedStyle(specimen, '::before').display,
          after: getComputedStyle(specimen, '::after').display,
        };
      })(),
      portraitZIndex: Number(getComputedStyle(source).zIndex),
      primaryCanvasCount: document.querySelector('[data-primary-action]')?.querySelectorAll('canvas').length,
      effectsReady: document.documentElement.dataset.interstellarReady,
    };
  });
  ok(
    Boolean(
      portraitContract?.src === '/images/dave-bettner-headshot-20260816-cutout.png' &&
        portraitContract.alt === 'Dave Bettner in a gray suit and navy tie' &&
        portraitContract.declaredWidth === String(CUTOUT_SIZE.width) &&
        portraitContract.declaredHeight === String(CUTOUT_SIZE.height) &&
        portraitContract.naturalWidth === CUTOUT_SIZE.width &&
        portraitContract.naturalHeight === CUTOUT_SIZE.height &&
        portraitContract.renderedWidth > 80 &&
        portraitContract.renderedHeight > 80 &&
        portraitContract.portraitCanvasCount === 0 &&
        portraitContract.backdrop?.count === 1 &&
        portraitContract.backdrop.display === 'none' &&
        portraitContract.legacyPlate?.before === 'none' &&
        portraitContract.legacyPlate?.after === 'none' &&
        (portraitContract.primaryCanvasCount == null || portraitContract.primaryCanvasCount <= 1) &&
        portraitContract.effectsReady === 'true'
    ),
    'Homepage renders the approved source-preserving navy-tie cutout directly over the event horizon without legacy plate effects or a processing canvas',
    JSON.stringify(portraitContract),
  );

  const eventHorizon = await profilePage.evaluate(() => ({
    fieldCount: document.querySelectorAll('[data-interstellar-field]').length,
    canvasCount: document.querySelectorAll('[data-interstellar-field] canvas[aria-hidden="true"]').length,
    pointerEvents: getComputedStyle(document.querySelector('[data-interstellar-field] canvas')).pointerEvents,
    state: document.querySelector('[data-interstellar-field]')?.dataset.webgl,
    ready: document.documentElement.dataset.interstellarReady,
  }));
  ok(
    eventHorizon.fieldCount === 1 && eventHorizon.canvasCount === 1 &&
      eventHorizon.pointerEvents === 'none' && eventHorizon.state === 'ready' && eventHorizon.ready === 'true',
    'Homepage owns one pointer-inert, aria-hidden WebGL event-horizon field',
    JSON.stringify(eventHorizon),
  );
  // The continuously-rendering decorative canvas can keep Playwright's element-
  // stability heuristic unsettled even though the portrait itself is static.
  // Its contract is asserted above; remove it only for this artifact capture.
  await profilePage.locator('[data-interstellar-field] canvas').evaluate((canvas) => canvas.remove());
  await profilePage.locator('[data-source-portrait]').screenshot({ path: `${out}/source-portrait.png` });
  await profileContext.close();

  const profileReducedContext = await browser.newContext({
    viewport: { width: 960, height: 720 },
    reducedMotion: 'reduce',
  });
  const profileReducedPage = await profileReducedContext.newPage();
  await profileReducedPage.goto(base, { waitUntil: 'networkidle' });
  const reducedPortrait = await profileReducedPage.evaluate((expectedWidth) => {
    const source = document.querySelector('[data-source-portrait]');
    return {
      sourceVisible: source instanceof HTMLImageElement &&
        source.naturalWidth === expectedWidth &&
        getComputedStyle(source).opacity !== '0',
      canvas: document.querySelectorAll('[data-interstellar-field] canvas[aria-hidden="true"]').length,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  }, CUTOUT_SIZE.width);
  ok(
    Boolean(
      reducedPortrait?.sourceVisible && reducedPortrait.reduced === true && reducedPortrait.canvas === 1
    ),
    'Homepage reduced-motion mode keeps the source portrait visible and shader stationary',
    JSON.stringify(reducedPortrait),
  );
  await profileReducedContext.close();

  const shaderRolloutContext = await browser.newContext({ viewport: { width: 1100, height: 800 } });
  const shaderRolloutPage = await shaderRolloutContext.newPage();
  for (const route of ['/about/', '/experience/', projectRoutes[0]]) {
    await shaderRolloutPage.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
    await shaderRolloutPage.waitForFunction(
      () => document.documentElement.dataset.interstellarReady === 'true',
      null,
      { timeout: 15_000 },
    );
    const rollout = await shaderRolloutPage.evaluate(() => ({
      fields: document.querySelectorAll('[data-interstellar-field].interstellar-field--accent').length,
      canvases: document.querySelectorAll('[data-interstellar-field] canvas[aria-hidden="true"]').length,
      sharedStylesheet: Boolean(document.querySelector('link[href="/styles/interstellar-system.css"]')),
    }));
    ok(
      rollout.fields === 1 && rollout.canvases === 1 && rollout.sharedStylesheet,
      `${route}: shared Interstellar system supplies one restrained route-header field`,
      JSON.stringify(rollout),
    );
  }
  await shaderRolloutContext.close();

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  for (const route of coreRoutes) {
    await auditPage(page, route, route);
  }

  await page.goto(base, { waitUntil: 'networkidle' });
  const metadata = await page.evaluate(() => ({
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
    ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
    ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
    ogImageWidth: document.querySelector('meta[property="og:image:width"]')?.getAttribute('content'),
    ogImageHeight: document.querySelector('meta[property="og:image:height"]')?.getAttribute('content'),
    twitterTitle: document.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
    twitterImage: document.querySelector('meta[name="twitter:image"]')?.getAttribute('content'),
    jsonLd: document.querySelector('script[type="application/ld+json"]')?.textContent,
  }));
  ok(metadata.canonical === 'https://davebettner.com/', 'Homepage canonical URL', String(metadata.canonical));
  ok(
    metadata.description ===
      'Dave Bettner works with customers on the messy part of implementation: turning an unclear workflow into a system people can use and trust. Ten years in reporting, assurance, healthcare, and integration systems, with newer public agent engineering work published for inspection.',
    'Homepage meta description matches the approved customer-delivery positioning',
    String(metadata.description),
  );
  ok(
    metadata.ogTitle === 'Dave Bettner | Customer-facing technical delivery',
    'Homepage Open Graph title matches the approved positioning',
    String(metadata.ogTitle),
  );
  ok(
    metadata.ogDescription === metadata.description,
    'Homepage Open Graph description matches canonical description',
    String(metadata.ogDescription),
  );
  ok(
    metadata.ogImage === 'https://davebettner.com/images/dave-bettner-og.jpg',
    'Homepage Open Graph image uses the production social card',
    String(metadata.ogImage),
  );
  ok(
    metadata.ogImageWidth === '1200' && metadata.ogImageHeight === '630',
    'Homepage Open Graph dimensions are 1200×630',
    `${metadata.ogImageWidth}×${metadata.ogImageHeight}`,
  );
  ok(
    metadata.twitterTitle === metadata.ogTitle && metadata.twitterImage === metadata.ogImage,
    'Twitter card metadata matches Open Graph metadata',
    JSON.stringify({ title: metadata.twitterTitle, image: metadata.twitterImage }),
  );
  const socialImage = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve({ loaded: true, width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => resolve({ loaded: false, width: 0, height: 0 });
        image.src = '/images/dave-bettner-og.jpg';
      }),
  );
  ok(
    socialImage.loaded && socialImage.width === 1200 && socialImage.height === 630,
    'Production social card loads at 1200×630',
    JSON.stringify(socialImage),
  );
  try {
    const jsonLd = JSON.parse(metadata.jsonLd ?? '');
    ok(jsonLd.sameAs?.includes('https://github.com/dbett4'), 'JSON-LD includes GitHub identity');
    ok(jsonLd.jobTitle === 'Senior Manager', 'JSON-LD keeps the current job title', String(jsonLd.jobTitle));
    ok(
      jsonLd.homeLocation?.name === 'Des Moines, Iowa',
      'JSON-LD keeps the current Des Moines location',
      String(jsonLd.homeLocation?.name),
    );
  } catch (error) {
    ok(false, 'JSON-LD parses', error.message);
  }

  await page.goto(`${base}/work/`, { waitUntil: 'networkidle' });
  const workFlagships = await page.locator('.flagship').evaluateAll((items) => items.map((item) => ({
    id: item.id,
    artifact: item.querySelector('.flagship-art a')?.getAttribute('href') ?? '',
    title: item.querySelector('h2')?.textContent?.trim() ?? '',
    terms: [...item.querySelectorAll('dt')].map((node) => node.textContent?.trim()),
  })));
  ok(
    JSON.stringify(workFlagships.map(({ id, artifact }) => ({ id, artifact }))) === JSON.stringify([
      { id: 'hermes-deployment-lab', artifact: '/mockup-artifacts/deployment-recovery-receipt.svg' },
      { id: 'regulated-reporting-mcp', artifact: '/mockup-artifacts/regulated-reporting-contract.svg' },
    ]),
    'Work flagships map artifacts by stable case id',
    JSON.stringify(workFlagships),
  );
  ok(workFlagships.every((item) => item.terms.join('|') === 'Problem|What I built|Evidence|Limit'), 'Work flagships expose problem, build, evidence, and limit', JSON.stringify(workFlagships));
  ok((await page.locator('.quiet-index .index-row').count()) === 4, 'Work keeps four supporting cases in the quiet ruled index');
  ok((await page.locator('.evidence-boundary').count()) === 1, 'Work has one page-level evidence boundary');

  for (const project of projects) {
    const route = `/work/${project.slug}/`;
    await auditPage(page, route, route);
    ok((await page.locator('h1').innerText()).includes(project.title), `${route}: project title`);
    ok(await page.locator(`a[href="${project.repo}"]`).count() >= 1, `${route}: direct repository link`);
    const eyebrow = (await page.locator('.eyebrow').first().innerText()).trim();
    ok(
      eyebrow.localeCompare(caseEyebrows[project.slug], undefined, { sensitivity: 'accent' }) === 0,
      `${route}: case-study eyebrow role label`,
      eyebrow,
    );
    const evidenceSteps = page.locator('.evidence-steps');
    ok((await evidenceSteps.evaluate((list) => list?.tagName ?? '')) === 'OL', `${route}: evidence map remains ordered list`);
    const stepCount = await evidenceSteps.locator('li').count();
    ok(stepCount === caseStepCounts[project.slug], `${route}: evidence step count`, String(stepCount));
    const counterContract = await evidenceSteps.evaluate((list) => {
      const listStyle = getComputedStyle(list);
      const items = [...list.querySelectorAll('li')];
      return {
        counterReset: listStyle.counterReset,
        items: items.map((item) => {
          const before = getComputedStyle(item, '::before');
          return {
            absolute: before.position === 'absolute',
            hasGeneratedContent: before.content !== 'none' && before.content !== 'normal' && before.content !== '""',
          };
        }),
      };
    });
    ok(
      counterContract.counterReset.includes('step') &&
        counterContract.items.length === caseStepCounts[project.slug] &&
        counterContract.items.every((item) => item.absolute && item.hasGeneratedContent),
      `${route}: evidence steps keep generated leading-zero counters`,
      JSON.stringify(counterContract),
    );
    const projectText = await page.locator('body').innerText();
    ok(projectText.includes(project.proof), `${route}: exact proof marker`, project.proof);
    ok(
      !/parses Compose|does not attest container|container startup is not attested|runtime-unverified/i.test(
        projectText,
      ),
      `${route}: obsolete parse-only / unattested-container language absent`,
    );
    for (const boundary of project.boundaries ?? []) {
      ok(projectText.includes(boundary), `${route}: proof boundary ${boundary}`);
    }
  }

  await page.goto(`${base}/experience/`, { waitUntil: 'networkidle' });
  ok((await page.locator('ol.timeline').count()) === 1, 'Experience keeps dated timeline ordered list');
  ok((await page.locator('ol.timeline li').count()) >= 1, 'Experience timeline has dated entries');
  ok((await page.locator('.career-rail').count()) === 1, 'Experience has one recruiter-scan career chronology rail');
  ok((await page.locator('.career-rail span').count()) === 5, 'Experience chronology rail has five dated stops');
  ok((await page.locator('.evidence-boundary').count()) === 1, 'Experience has one page-level evidence boundary');
  const experienceText = await page.locator('main').innerText();
  for (const marker of ['2015–21', 'Workiva', 'Ambra Health', 'Citrin Cooperman', 'LSL', 'The agent work is newer.']) {
    ok(experienceText.includes(marker), `Experience contains ${marker}`);
  }
  ok(!experienceText.includes('Remote'), 'Experience omits Remote labels');
  ok(!experienceText.includes('Technical accounting judgment'), 'Experience omits accountant-screen framing');
  ok(!experienceText.includes('Kaiser Permanente'), 'Experience anonymizes private client name');
  ok(!experienceText.includes('quota'), 'Experience omits quota ownership claims');
  ok(!experienceText.includes('signature authority'), 'Experience omits signature-authority claims');

  await page.goto(`${base}/about/`, { waitUntil: 'networkidle' });
  const aboutText = await page.locator('main').innerText();
  ok(!aboutText.includes('My career has moved from accounting'), 'About omits accountant-first career framing');
  ok((await page.locator('.field-note').count()) === 1, 'About has one grounded field note');
  ok(((await page.locator('.field-note').textContent()) ?? '').includes('reporting platform and the system of record'), 'About field note names the real handoff lesson');
  ok(!aboutText.includes('Des Moines'), 'About does not promote location');
  const aboutLower = aboutText.toLowerCase();
  ok(
    aboutLower.includes('customer') &&
      aboutLower.includes('reporting platform') &&
      aboutLower.includes('outside client work'),
    'About adds personal working context and a public-building throughline',
  );
  ok((await page.locator('.principles-section').count()) === 0, 'About does not duplicate the deployment method');
  const aboutParagraphs = aboutText.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const openingDupes = aboutParagraphs.filter((line) =>
    line.startsWith('My background is in enterprise solution delivery'),
  );
  ok(openingDupes.length <= 1, 'About does not duplicate opening background paragraph', String(openingDupes.length));

  await page.goto(`${base}/fit/`, { waitUntil: 'networkidle' });
  const fitSurface = await page.evaluate(() => ({
    heading: document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    lead: document.querySelector('.lead')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    phases: [...document.querySelectorAll('.field-plan ol > li')].map((item) => ({
      number: item.querySelector('.step-meta b')?.textContent?.trim() ?? '',
      range: [...(item.querySelector('.step-meta')?.childNodes ?? [])]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent?.trim() ?? '')
        .filter(Boolean)
        .join(' '),
      title: item.querySelector('h2')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      detail: item.querySelector('p')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    })),
    related: [...document.querySelectorAll('.page-links a')].map((link) => ({
      text: link.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      href: link.getAttribute('href') ?? '',
    })),
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
  }));
  ok(fitSurface.heading === 'How I would start with a new customer.', 'Field approach page has the approved heading', fitSurface.heading);
  ok(fitSurface.phases.length === 4, 'Field approach page has four dated phases', String(fitSurface.phases.length));
  ok(fitSurface.phases.map((phase) => phase.number).join('|') === '01|02|03|04', 'Field approach has the approved 01–04 progression', fitSurface.phases.map((phase) => phase.number).join('|'));
  ok(
    fitSurface.phases.map((phase) => phase.range).join('|') === 'Weeks 1–2|Weeks 3–6|Weeks 6–10|Weeks 10–13',
    'Field approach phases retain their chronological ranges',
    fitSurface.phases.map((phase) => phase.range).join('|'),
  );
  ok(
    fitSurface.lead.includes('watch the customer') &&
      fitSurface.lead.includes('one workflow') &&
      fitSurface.lead.includes('product feedback'),
    'Field approach lead states the deployment method owned by this route',
    fitSurface.lead,
  );
  const phaseText = fitSurface.phases.map((phase) => `${phase.title} ${phase.detail}`).join(' ');
  for (const marker of ['Choose the first problem', 'Build one path end to end', 'Learn from the breakage', 'Make the next one easier']) {
    ok(phaseText.includes(marker), `Field approach plan includes ${marker}`);
  }
  for (const route of ['/about/', '/experience/', '/work/']) {
    ok(fitSurface.related.some((link) => link.href === route), `Field approach page links to ${route}`);
  }
  ok(fitSurface.related.some((link) => link.href.startsWith('mailto:')), 'Field approach page includes a conversation action');
  ok(fitSurface.robots.includes('index'), 'Field approach page is indexable', fitSurface.robots);
  ok(!fitSurface.description.includes('Chief of Staff'), 'Field approach meta omits Chief of Staff');
  ok(!fitSurface.description.includes('strategic operations'), 'Field approach meta omits strategic operations');
  ok(
    fitSurface.description ===
      "Dave Bettner's field approach: how he would start with a new customer, from choosing the first problem through making the next deployment easier.",
    'Field approach meta describes the current static page',
    fitSurface.description,
  );

  const resumeResponse = await page.request.get(`${base}/dave-bettner-resume.pdf`);
  ok(resumeResponse.status() === 200, 'Public résumé HTTP 200', String(resumeResponse.status()));
  ok(resumeResponse.headers()['content-type']?.includes('application/pdf'), 'Public résumé has PDF content type', resumeResponse.headers()['content-type']);

  const sitemap = await readFile('dist/sitemap-0.xml', 'utf8');
  for (const route of [...coreRoutes.filter((route) => route !== '/'), ...projectRoutes]) {
    ok(sitemap.includes(`https://davebettner.com${route}`), `Sitemap includes ${route}`);
  }

  const notFoundResponse = await page.goto(`${base}/definitely-missing`, { waitUntil: 'load' });
  ok(notFoundResponse?.status() === 404, 'Custom 404 returns HTTP 404', String(notFoundResponse?.status()));
  await page.goto(`${base}/404.html`, { waitUntil: 'load' });
  ok(await page.locator('h1').count() === 1, 'Custom 404 has one h1');
  ok((await page.locator('[data-secondary-masthead]').count()) === 1, 'Custom 404 uses the shared masthead grammar');

  await context.close();
} finally {
  await browser.close();
  await stopPreview(preview);
}

const failed = checks.filter((check) => !check.pass);
console.log(JSON.stringify({ pass: errors.length === 0, count: checks.length, failed, errors }, null, 2));
if (errors.length) process.exit(1);
