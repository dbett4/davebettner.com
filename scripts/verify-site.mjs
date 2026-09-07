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
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-webgl', '--disable-3d-apis'],
});

/* ---------------------------------------------------------------------------
 * The Working Record — locked contract fixtures.
 * ------------------------------------------------------------------------- */

const TOKENS = {
  paper: 'rgb(245, 242, 234)',
  ink: 'rgb(23, 23, 23)',
  orangeDark: 'rgb(169, 61, 18)',
};

const experienceRows = [
  { dates: 'Dec 2024–Oct 2025', role: 'Manager of Digital Services · Citrin Cooperman' },
  { dates: 'Oct 2022–Oct 2024', role: 'Solutions Architect · Workiva' },
  { dates: 'Sept 2021–Oct 2022', role: 'Solutions Consultant · Ambra Health' },
];

const workCases = [
  { id: 'hermes-deployment-lab', display: 'Failed-write recovery lab', title: 'Recover an uncertain write without creating a duplicate', href: '/work/hermes-deployment-lab/' },
  { id: 'regulated-reporting-mcp', display: 'Regulated Reporting MCP', title: 'Limit an agent to the write access its job needs', href: '/work/regulated-reporting-mcp/' },
];

const caseEyebrows = {
  'agent-operating-system': 'How the pieces fit · Agent Operating System',
  'dedup-readback-bridge': 'Repeat-work prevention · Dedup Read-Back Bridge',
  'regulated-reporting-mcp': 'Limited system access · Regulated Reporting MCP',
  'hermes-deployment-lab': 'Failed-write recovery · Hermes Deployment Lab',
  'hermes-field-kit': 'Independent evaluation · Hermes Enterprise Evaluation Kit',
  wingman: 'Review and restore · Spreadsheet quality',
};

const caseStepCounts = {
  'agent-operating-system': 6,
  'dedup-readback-bridge': 6,
  'regulated-reporting-mcp': 5,
  'hermes-deployment-lab': 5,
  'hermes-field-kit': 5,
  wingman: 6,
};

const caseTitles = {
  'agent-operating-system': 'Make agent work explainable after the fact',
  'dedup-readback-bridge': 'Stop recurring agent jobs from repeating work',
  'regulated-reporting-mcp': 'Give an agent only the write access its job requires',
  'hermes-deployment-lab': 'Recover a failed write without creating a duplicate',
  'hermes-field-kit': 'Keep an evaluation from approving itself',
  wingman: 'Find spreadsheet defects—and reverse a bad fix',
};

const caseProofMarkers = {
  'agent-operating-system': 'Architecture map',
  'dedup-readback-bridge': '19 tests, including a two-thread race and a crash-safety check',
  'regulated-reporting-mcp': 'Credential-free test suite',
  'hermes-deployment-lab': 'Public GitHub Actions run 31892965924 forces the failure',
  'hermes-field-kit': 'Offline FIELD_KIT_PROOF_PASS',
  wingman: '462 Python tests pass',
};

const caseRepos = {
  'agent-operating-system': 'https://github.com/dbett4',
  'dedup-readback-bridge': 'https://github.com/dbett4/dedup-readback-bridge',
  'regulated-reporting-mcp': 'https://github.com/dbett4/regulated-reporting-mcp',
  'hermes-deployment-lab': 'https://github.com/dbett4/hermes-enterprise-deployment-lab',
  'hermes-field-kit': 'https://github.com/dbett4/hermes-enterprise-evaluation-kit',
  wingman: 'https://github.com/dbett4/wingman',
};

const caseIds = Object.keys(caseEyebrows);
const coreRoutes = ['/', '/about/', '/experience/', '/work/', '/fit/'];
const projectRoutes = caseIds.map((id) => `/work/${id}/`);
const primaryNavTargets = [
  { text: 'Work', href: '/work/' },
  { text: 'Experience', href: '/experience/' },
  { text: 'About', href: '/about/' },
];

const forbiddenSurfaceTerms = [
  'gradient-orb',
  'glow',
  'glass',
  'blur',
  'grain',
  'halftone',
  'dither',
  'pill-',
  'orb-',
  'cutout-campaign',
];

/* ---------------------------------------------------------------------------
 * Shared per-page audits.
 * ------------------------------------------------------------------------- */

async function assertNoSpectacleSurfaces(page, label) {
  const offenders = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('body *').forEach((el) => {
      const style = getComputedStyle(el);
      const tag = el.tagName.toLowerCase();
      if (tag === 'canvas') bad.push(`canvas:${el.className}`);
      if (style.boxShadow !== 'none') bad.push(`box-shadow:${tag}.${el.className}`);
      if (style.backdropFilter && style.backdropFilter !== 'none') bad.push(`backdrop-filter:${tag}.${el.className}`);
      if (style.filter && style.filter !== 'none') bad.push(`filter:${tag}.${el.className}`);
      const radius = style.borderRadius;
      if (radius && radius !== '0px' && !radius.split(' ').every((part) => part === '0px')) {
        bad.push(`border-radius:${tag}.${el.className}=${radius}`);
      }
      const bgImage = style.backgroundImage;
      if (bgImage && bgImage !== 'none') {
        // Allow the monochrome linear-gradient(currentColor, currentColor) trick used to
        // draw an animated underline; flag any gradient that mixes distinct colors.
        const colorStops = bgImage.match(/rgba?\([^)]*\)/g) ?? [];
        const isMonochromeUnderline = /^linear-gradient\(/.test(bgImage) && colorStops.length > 0 && new Set(colorStops).size === 1;
        if (!isMonochromeUnderline) bad.push(`background-image:${tag}.${el.className}=${bgImage}`);
      }
    });
    return bad;
  });
  ok(offenders.length === 0, `${label}: no shadows/blur/backdrop-filter/radius/decorative-gradient/canvas`, offenders.slice(0, 10).join(', '));

  const bodyClassAudit = await page.evaluate((terms) => {
    const tokens = new Set();
    document.querySelectorAll('body [class], body [id]').forEach((el) => {
      el.classList.forEach((cls) => tokens.add(cls.toLowerCase()));
      if (el.id) tokens.add(el.id.toLowerCase());
    });
    const joined = [...tokens].join(' ');
    return terms.filter((term) => joined.includes(term));
  }, forbiddenSurfaceTerms);
  ok(bodyClassAudit.length === 0, `${label}: no forbidden decorative class/id markers`, bodyClassAudit.join(', '));

  ok((await page.locator('canvas').count()) === 0, `${label}: zero canvas elements (no WebGL)`);
}

async function auditPage(page, route, label) {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  const response = await page.goto(`${base}${route === '/' ? '' : route}`, { waitUntil: 'networkidle' });
  ok(response?.status() === 200, `${label}: HTTP 200`, String(response?.status()));
  ok((await page.locator('h1').count()) === 1, `${label}: exactly one h1`);

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
    images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.getAttribute('src')),
  );
  ok(brokenImages.length === 0, `${label}: images load`, brokenImages.join(', '));

  const themeLinks = await page.locator('link[rel="stylesheet"]').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')).filter(Boolean),
  );
  ok(
    themeLinks.filter((href) => href === '/styles/working-record.css').length === 1,
    `${label}: The Working Record is the only public theme stylesheet`,
    themeLinks.join(', '),
  );

  const metaTokens = await page.evaluate(() => ({
    theme: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
    scheme: document.querySelector('meta[name="color-scheme"]')?.getAttribute('content'),
    bodyBackground: getComputedStyle(document.body).backgroundColor,
    bodyColor: getComputedStyle(document.body).color,
  }));
  ok(
    metaTokens.theme === '#F5F2EA' &&
      metaTokens.scheme === 'light' &&
      metaTokens.bodyBackground === TOKENS.paper &&
      metaTokens.bodyColor === TOKENS.ink,
    `${label}: paper/ink tokens and light color-scheme are active`,
    JSON.stringify(metaTokens),
  );

  ok((await page.locator('header.masthead').count()) === 1, `${label}: shared masthead present`);
  ok((await page.locator('footer.site-footer').count()) === 1, `${label}: shared footer present`);

  const actionTargets = await page.locator('a, button, summary').evaluateAll((nodes) =>
    nodes
      .filter((node) => {
        const style = getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length > 0;
      })
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return { text: node.textContent?.trim().slice(0, 40), width: rect.width, height: rect.height };
      })
      .filter((node) => node.width > 0 && node.height > 0),
  );
  const undersized = actionTargets.filter((target) => target.width < 44 || target.height < 44);
  ok(undersized.length === 0, `${label}: interactive targets are at least 44×44`, JSON.stringify(undersized.slice(0, 8)));

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
  ok(missingFragmentTargets.length === 0, `${label}: same-page links target existing IDs`, missingFragmentTargets.join(', '));

  await assertNoSpectacleSurfaces(page, label);

  ok(consoleErrors.length === 0, `${label}: no console/page errors`, consoleErrors.join(' | '));
}

async function assertPrimaryNavContract(page, label) {
  const navLinks = await page.locator('.primary-nav a').evaluateAll((links) =>
    links.map((link) => ({ text: link.textContent?.trim(), href: link.getAttribute('href'), current: link.getAttribute('aria-current') })),
  );
  ok(
    JSON.stringify(navLinks.map(({ text, href }) => ({ text, href }))) === JSON.stringify(primaryNavTargets),
    `${label}: primary nav is exactly Work, Experience, About`,
    JSON.stringify(navLinks),
  );
  ok(!navLinks.some((link) => link.href === '/fit/'), `${label}: /fit/ is not in primary navigation`);
  const navLabel = await page.locator('.primary-nav').getAttribute('aria-label');
  ok(navLabel === 'Primary navigation', `${label}: primary nav has an accessible label`, String(navLabel));

  const utilityLinks = await page.locator('.masthead-utility a').evaluateAll((links) =>
    links.map((link) => ({ text: link.textContent?.trim(), href: link.getAttribute('href'), download: link.hasAttribute('download') })),
  );
  ok(
    utilityLinks.some((link) => link.text === 'Résumé' && link.href === '/dave-bettner-resume.pdf' && link.download) &&
      utilityLinks.some((link) => link.text === 'Email' && link.href === 'mailto:dbett4@gmail.com'),
    `${label}: quiet Résumé and Email utilities are present`,
    JSON.stringify(utilityLinks),
  );
}

async function assertMobileDisclosureContract(page, label) {
  const disclosure = page.locator('.nav-disclosure');
  ok((await disclosure.count()) === 1, `${label}: mobile navigation disclosure present`);
  const summary = disclosure.locator('summary');
  const summaryBox = await summary.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  ok(summaryBox.width >= 44 && summaryBox.height >= 44, `${label}: disclosure summary is at least 44×44`, JSON.stringify(summaryBox));

  await summary.click();
  const panelLinks = await disclosure.locator('.nav-disclosure-panel a').evaluateAll((links) =>
    links.map((link) => ({ text: link.textContent?.trim(), href: link.getAttribute('href') })),
  );
  const expected = [...primaryNavTargets, { text: 'Résumé', href: '/dave-bettner-resume.pdf' }, { text: 'Email', href: 'mailto:dbett4@gmail.com' }];
  ok(
    JSON.stringify(panelLinks) === JSON.stringify(expected),
    `${label}: disclosure panel exposes every primary destination and both utilities`,
    JSON.stringify(panelLinks),
  );
  const panelTargetBoxes = await disclosure.locator('.nav-disclosure-panel a').evaluateAll((links) =>
    links.map((link) => {
      const rect = link.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }),
  );
  ok(
    panelTargetBoxes.every((box) => box.width >= 44 && box.height >= 44),
    `${label}: disclosure panel targets are at least 44×44`,
    JSON.stringify(panelTargetBoxes),
  );
  await summary.click();
}

async function assertFooterContract(page, label) {
  const footerNav = await page.locator('footer.site-footer .footer-nav a').evaluateAll((links) =>
    links.map((link) => ({ text: link.textContent?.trim(), href: link.getAttribute('href') })),
  );
  ok(
    footerNav.some((link) => link.href === '/fit/'),
    `${label}: /fit/ is discoverable from the shared footer`,
    JSON.stringify(footerNav),
  );
  ok(
    footerNav.some((link) => link.href === '/about/') && footerNav.some((link) => link.href === '/dave-bettner-resume.pdf'),
    `${label}: footer keeps About and résumé links`,
    JSON.stringify(footerNav),
  );
}

async function assertFocusRing(page, label) {
  const focusStyle = await page.locator('.skip-link').evaluate((link) => {
    link.focus();
    const style = getComputedStyle(link);
    return {
      outlineColor: style.outlineColor,
      outlineWidth: style.outlineWidth,
      outlineOffset: style.outlineOffset,
      outlineStyle: style.outlineStyle,
    };
  });
  ok(
    focusStyle.outlineWidth === '3px' && focusStyle.outlineOffset === '4px' && focusStyle.outlineStyle === 'solid',
    `${label}: focus ring is a 3px solid outline with a 4px offset`,
    JSON.stringify(focusStyle),
  );
}

/* ---------------------------------------------------------------------------
 * Run.
 * ------------------------------------------------------------------------- */

try {
  /* ---- Homepage content contract (desktop) --------------------------------- */
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await auditPage(page, '/', 'Homepage');
    await assertPrimaryNavContract(page, 'Homepage');
    await assertFooterContract(page, 'Homepage');
    await assertFocusRing(page, 'Homepage');

    const identity = (await page.locator('.identity-line').textContent())?.trim();
    ok(identity === 'Dave Bettner · Senior Manager · Des Moines, Iowa', 'Homepage: exact identity line', identity ?? '');

    const heroHeading = (await page.locator('#hero-heading').textContent())?.trim();
    ok(
      heroHeading === 'I lead enterprise deployments from discovery through adoption.',
      'Homepage: exact h1',
      heroHeading ?? '',
    );

    const heroSupport = (await page.locator('.hero-support').textContent())?.trim();
    ok(
      heroSupport ===
        'I work between customers, product, and engineering. I also build public agent and MCP projects that test bounded access, failure recovery, readback, and human review.',
      'Homepage: exact support copy',
      heroSupport ?? '',
    );

    const heroActions = await page.locator('.hero-actions a').evaluateAll((links) =>
      links.map((link) => ({ text: link.textContent?.trim(), href: link.getAttribute('href'), download: link.hasAttribute('download') })),
    );
    ok(
      heroActions.length === 3 &&
        heroActions[0].text === 'View selected work' &&
        heroActions[0].href === '/work/' &&
        heroActions.some((link) => link.text === 'Résumé' && link.href === '/dave-bettner-resume.pdf' && link.download) &&
        heroActions.some((link) => link.text === 'Email' && link.href === 'mailto:dbett4@gmail.com'),
      'Homepage: sole primary action to selected work plus quiet résumé/email actions',
      JSON.stringify(heroActions),
    );
    ok(
      (await page.locator('.hero-actions .action-primary').count()) === 1,
      'Homepage: exactly one primary hero action',
    );

    const credibility = (await page.locator('.credibility-line').textContent())?.trim();
    ok(
      credibility ===
        'Customer-facing delivery since 2015 across financial reporting, GRC, and healthcare imaging. The public engineering work is independent evidence, not a client production deployment.',
      'Homepage: exact credibility line',
      credibility ?? '',
    );

    const portrait = await page.locator('img[data-source-portrait]').evaluate((img) => ({
      count: 1,
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt'),
      width: img.getAttribute('width'),
      height: img.getAttribute('height'),
      naturalWidth: img instanceof HTMLImageElement ? img.naturalWidth : 0,
      naturalHeight: img instanceof HTMLImageElement ? img.naturalHeight : 0,
    }));
    ok((await page.locator('img[data-source-portrait]').count()) === 1, 'Homepage: exactly one source portrait');
    ok(
      portrait.src === '/images/dave-bettner-headshot-20260816-cutout.png' &&
        portrait.width === String(CUTOUT_SIZE.width) &&
        portrait.height === String(CUTOUT_SIZE.height) &&
        portrait.naturalWidth === CUTOUT_SIZE.width &&
        portrait.naturalHeight === CUTOUT_SIZE.height &&
        Boolean(portrait.alt) &&
        !/filter|mask|halftone|dither|shader/i.test(portrait.alt ?? ''),
      'Homepage: portrait is the approved byte-for-byte cutout, declared and rendered at 1312×1199',
      JSON.stringify(portrait),
    );

    // Experience section.
    const experienceRowsFound = await page.locator('#experience .ruled-row').evaluateAll((rows) =>
      rows.map((row) => ({
        dates: row.querySelector('.mono')?.textContent?.trim(),
        role: row.querySelector('.role-line')?.textContent?.trim(),
      })),
    );
    ok(
      JSON.stringify(experienceRowsFound) === JSON.stringify(experienceRows),
      'Homepage: exactly three ruled chronological experience rows in order',
      JSON.stringify(experienceRowsFound),
    );
    const experienceOrdinals = await page.locator('#experience .ruled-row .mono').evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.trim() ?? '').filter((text) => /^0\d\s*[·.]/.test(text)),
    );
    ok(experienceOrdinals.length === 0, 'Homepage: experience rows carry no numbering marks', JSON.stringify(experienceOrdinals));
    const experienceLink = await page.locator('#experience .section-link a').evaluate((a) => ({ text: a.textContent?.replace(/\s+/g, ' ').trim(), href: a.getAttribute('href') }));
    ok(
      experienceLink.href === '/experience/' && experienceLink.text?.startsWith('View full experience'),
      'Homepage: View full experience links to /experience/',
      JSON.stringify(experienceLink),
    );

    // Selected work section.
    const workRows = await page.locator('#work .ruled-row').evaluateAll((rows) =>
      rows.map((row) => ({
        id: row.getAttribute('id'),
        display: row.querySelector('.case-display')?.textContent?.trim(),
        title: row.querySelector('h3')?.textContent?.trim(),
        href: row.querySelector('a.text-link')?.getAttribute('href'),
      })),
    );
    ok(
      JSON.stringify(workRows) === JSON.stringify(workCases.map((c) => ({ id: c.id, display: c.display, title: c.title, href: c.href }))),
      'Homepage: exactly two ruled, text-led selected-work cases in order',
      JSON.stringify(workRows),
    );
    ok((await page.locator('#work svg, #work canvas, #work [data-diagram]').count()) === 0, 'Homepage: selected work has no diagrams');
    const workLink = await page.locator('#work > .wrap > .section-link a').evaluate((a) => ({ text: a.textContent?.replace(/\s+/g, ' ').trim(), href: a.getAttribute('href') }));
    ok(workLink.href === '/work/' && workLink.text?.startsWith('View all work'), 'Homepage: View all work links to /work/', JSON.stringify(workLink));

    // How I work section.
    const howIWorkTitle = (await page.locator('#how-i-work h2').textContent())?.trim();
    ok(howIWorkTitle === 'Stay close to the workflow', 'Homepage: exact how-I-work title', howIWorkTitle ?? '');
    const howIWorkLink = await page.locator('#how-i-work a').evaluate((a) => ({ text: a.textContent?.replace(/\s+/g, ' ').trim(), href: a.getAttribute('href') }));
    ok(howIWorkLink.href === '/about/' && howIWorkLink.text?.startsWith('About my approach'), 'Homepage: About my approach links to /about/', JSON.stringify(howIWorkLink));

    // Hiring close.
    const hiringTitle = (await page.locator('#contact h2').textContent())?.trim();
    ok(hiringTitle === 'Hiring for customer-facing technical work?', 'Homepage: exact hiring-close title', hiringTitle ?? '');
    const hiringActions = await page.locator('#contact .hiring-close-actions a').evaluateAll((links) =>
      links.map((link) => ({ text: link.textContent?.trim(), href: link.getAttribute('href') })),
    );
    ok(
      hiringActions.length === 2 &&
        hiringActions[0].text === 'Email Dave' &&
        hiringActions[0].href === 'mailto:dbett4@gmail.com' &&
        hiringActions[1].text === 'Download résumé' &&
        hiringActions[1].href === '/dave-bettner-resume.pdf',
      'Homepage: hiring close has Email Dave primary and Download résumé quiet',
      JSON.stringify(hiringActions),
    );
    const bodyText = await page.locator('body').innerText();
    ok(!/consulting availability|book a call|available for consulting/i.test(bodyText), 'Homepage: no consulting-availability close');

    // Section order.
    const sectionOrder = await page.locator('main > section').evaluateAll((sections) => sections.map((section) => section.id || section.className));
    ok(
      sectionOrder[0].includes('hero') &&
        sectionOrder[1].includes('credibility') &&
        sectionOrder[2] === 'experience' &&
        sectionOrder[3] === 'work' &&
        sectionOrder[4] === 'how-i-work' &&
        sectionOrder[5] === 'contact',
      'Homepage: sections are in the exact locked order',
      sectionOrder.join(' → '),
    );

    ok((await page.locator('.building-index, .loop-n, .proof-n, [data-panel-number]').count()) === 0, 'Homepage: no numbered panels');
    ok((await page.locator('[data-diagram], .taxonomy, .diagram').count()) === 0, 'Homepage: no diagrams or taxonomies');

    // Body opening comment contract.
    const html = await page.content();
    ok(html.includes('SEED: working-record-20260906'), 'Homepage: body comment carries the locked seed');
    ok(
      html.replace(/\s+/g, ' ').includes('unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md'),
      'Homepage: body comment carries the exact FINISH line',
    );

    // Grid 7/5 split at desktop.
    const heroSplit = await page.evaluate(() => {
      const copy = document.querySelector('.hero-copy');
      const portrait = document.querySelector('.hero-portrait');
      if (!(copy instanceof HTMLElement) || !(portrait instanceof HTMLElement)) return null;
      const cr = copy.getBoundingClientRect();
      const pr = portrait.getBoundingClientRect();
      return { copyLeft: cr.left, portraitLeft: pr.left, copyWidth: cr.width, portraitWidth: pr.width };
    });
    ok(
      Boolean(heroSplit) &&
        heroSplit.copyLeft < heroSplit.portraitLeft &&
        heroSplit.copyWidth > heroSplit.portraitWidth,
      'Homepage desktop: hero splits copy (7) ahead of portrait (5)',
      JSON.stringify(heroSplit),
    );
    const evidenceSplit = await page.evaluate(() => {
      const meta = document.querySelector('#experience .evidence-row-meta');
      const body = document.querySelector('#experience .evidence-row-body');
      if (!(meta instanceof HTMLElement) || !(body instanceof HTMLElement)) return null;
      const mr = meta.getBoundingClientRect();
      const br = body.getBoundingClientRect();
      return { metaWidth: mr.width, bodyWidth: br.width };
    });
    ok(
      Boolean(evidenceSplit) && evidenceSplit.bodyWidth > evidenceSplit.metaWidth,
      'Homepage desktop: evidence rows split meta (4) ahead of body (8)',
      JSON.stringify(evidenceSplit),
    );

    await page.screenshot({ path: `${out}/desktop-1440.png`, fullPage: true });
    await context.close();
  }

  /* ---- Reduced motion --------------------------------------------------- */
  {
    const context = await browser.newContext({ viewport: { width: 1024, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    const reduced = await page.evaluate(() => {
      const action = document.querySelector('.action-primary');
      const style = action ? getComputedStyle(action) : null;
      return {
        reducedMotionMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
        transitionDuration: style ? style.transitionDuration : null,
        scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      };
    });
    ok(
      reduced.reducedMotionMatches &&
        (reduced.transitionDuration === '0s' || parseFloat(reduced.transitionDuration ?? '1') < 0.01) &&
        reduced.scrollBehavior === 'auto',
      'Reduced motion: transitions and smooth scrolling are removed',
      JSON.stringify(reduced),
    );
    await context.close();
  }

  /* ---- Breakpoint sweep (no overflow + nav mode) ------------------------- */
  const breakpoints = [
    { name: 'mobile-320', width: 320, height: 720 },
    { name: 'mobile-360', width: 360, height: 740 },
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'mobile-414', width: 414, height: 896 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'desktop-1024', width: 1024, height: 900 },
    { name: 'desktop-1440', width: 1440, height: 1000 },
  ];
  for (const viewport of breakpoints) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const route of coreRoutes) {
      await auditPage(page, route, `${viewport.name} ${route}`);
    }
    if (viewport.width < 900) {
      await assertMobileDisclosureContract(page, viewport.name);
      ok((await page.locator('.primary-nav').evaluate((nav) => getComputedStyle(nav).display)) === 'none', `${viewport.name}: primary nav is hidden below 900px`);
    } else {
      await assertPrimaryNavContract(page, viewport.name);
      ok((await page.locator('.nav-disclosure').evaluate((nav) => getComputedStyle(nav).display)) === 'none', `${viewport.name}: mobile disclosure is hidden at 900px+`);
    }
    await context.close();
  }

  /* ---- 200% zoom / text spacing usability -------------------------------- */
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: 'html { font-size: 200% !important; } * { letter-spacing: 0.12em !important; word-spacing: 0.16em !important; line-height: 1.5 !important; }' });
    await page.waitForTimeout(50);
    const zoomOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    ok(zoomOverflow.scrollWidth <= zoomOverflow.clientWidth + 1, 'Homepage: usable at 200% zoom and increased text spacing without horizontal overflow', JSON.stringify(zoomOverflow));
    ok((await page.locator('h1').count()) === 1, 'Homepage: still exactly one h1 at 200% zoom');
    await context.close();
  }

  /* ---- JavaScript disabled ------------------------------------------------ */
  {
    const context = await browser.newContext({ viewport: { width: 1024, height: 900 }, javaScriptEnabled: false });
    const page = await context.newPage();
    for (const route of coreRoutes) {
      const response = await page.goto(`${base}${route === '/' ? '' : route}`, { waitUntil: 'load' });
      ok(response?.status() === 200, `No-JS ${route}: HTTP 200`);
      ok((await page.locator('h1').count()) === 1, `No-JS ${route}: exactly one h1`);
      ok((await page.locator('header.masthead').count()) === 1, `No-JS ${route}: masthead renders without JS`);
    }
    // Native disclosure works without JS at a narrow width.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base, { waitUntil: 'load' });
    await page.locator('.nav-disclosure summary').click();
    const noJsPanelVisible = await page.locator('.nav-disclosure[open] .nav-disclosure-panel').isVisible();
    ok(noJsPanelVisible, 'No-JS: native disclosure opens the full navigation panel without JavaScript');
    await context.close();
  }

  /* ---- Metadata ------------------------------------------------------------ */
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
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
      title: document.title,
      jsonLd: document.querySelector('script[type="application/ld+json"]')?.textContent,
    }));
    ok(metadata.canonical === 'https://davebettner.com/', 'Homepage canonical URL', String(metadata.canonical));
    ok(
      metadata.title === 'Dave Bettner | Senior Manager, Enterprise Deployments',
      'Homepage title is person-first',
      String(metadata.title),
    );
    ok(
      /^Dave Bettner is a Senior Manager in Des Moines, Iowa/.test(metadata.description ?? ''),
      'Homepage meta description is person-first',
      String(metadata.description),
    );
    ok(metadata.ogTitle === metadata.title, 'Homepage Open Graph title matches page title', String(metadata.ogTitle));
    ok(metadata.ogDescription === metadata.description, 'Homepage Open Graph description matches canonical description', String(metadata.ogDescription));
    ok(
      metadata.ogImage === 'https://davebettner.com/images/dave-bettner-og.jpg',
      'Homepage Open Graph image uses The Working Record social card',
      String(metadata.ogImage),
    );
    ok(metadata.ogImageWidth === '1200' && metadata.ogImageHeight === '630', 'Homepage Open Graph dimensions are 1200×630', `${metadata.ogImageWidth}×${metadata.ogImageHeight}`);
    ok(metadata.twitterTitle === metadata.ogTitle && metadata.twitterImage === metadata.ogImage, 'Twitter card metadata matches Open Graph metadata');

    const socialImage = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const image = new Image();
          image.onload = () => resolve({ loaded: true, width: image.naturalWidth, height: image.naturalHeight });
          image.onerror = () => resolve({ loaded: false, width: 0, height: 0 });
          image.src = '/images/dave-bettner-og.jpg';
        }),
    );
    ok(socialImage.loaded && socialImage.width === 1200 && socialImage.height === 630, 'Production social card loads at 1200×630', JSON.stringify(socialImage));

    try {
      const jsonLd = JSON.parse(metadata.jsonLd ?? '');
      ok(jsonLd.sameAs?.includes('https://github.com/dbett4'), 'JSON-LD includes GitHub identity');
      ok(jsonLd.jobTitle === 'Senior Manager', 'JSON-LD keeps the current job title', String(jsonLd.jobTitle));
      ok(jsonLd.homeLocation?.name === 'Des Moines, Iowa', 'JSON-LD keeps the current Des Moines location', String(jsonLd.homeLocation?.name));
      ok(jsonLd.name === 'Dave Bettner', 'JSON-LD identifies Dave Bettner by name');
    } catch (error) {
      ok(false, 'JSON-LD parses', error.message);
    }
    await context.close();
  }

  /* ---- Work index ----------------------------------------------------------- */
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await auditPage(page, '/work/', '/work/');
    await assertPrimaryNavContract(page, '/work/');

    const workRows = await page.locator('.ruled-list .ruled-row').evaluateAll((rows) =>
      rows.map((row) => ({
        id: row.getAttribute('id'),
        eyebrow: row.querySelector('.case-display')?.textContent?.trim(),
        title: row.querySelector('h2')?.textContent?.trim(),
      })),
    );
    ok(workRows.length === caseIds.length, '/work/: indexes every public case', String(workRows.length));
    ok(
      workRows.every((row) => row.id && caseEyebrows[row.id] === row.eyebrow),
      '/work/: every row states its own eyebrow and case identity',
      JSON.stringify(workRows),
    );
    ok((await page.locator('.numbered-value, [data-value-panel]').count()) === 0, '/work/: no numbered value panels');
    const workBody = await page.locator('body').innerText();
    ok(!/consulting availability|book a call/i.test(workBody), '/work/: no consulting close');
    ok((await page.locator('details.provenance-disclosure').count()) === 1, '/work/: provenance disclosure present');
    await context.close();
  }

  /* ---- Work detail pages ----------------------------------------------------- */
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    for (const id of caseIds) {
      const route = `/work/${id}/`;
      await auditPage(page, route, route);

      const h1 = (await page.locator('h1').innerText()).trim();
      ok(h1 === caseTitles[id], `${route}: h1 matches the locked case title`, h1);

      const eyebrow = (await page.locator('.eyebrow').first().textContent() ?? '').trim();
      ok(eyebrow === caseEyebrows[id], `${route}: eyebrow matches case identity`, eyebrow);

      ok((await page.locator(`a[href="${caseRepos[id]}"]`).count()) >= 1, `${route}: direct repository link present`);

      const evidenceSteps = page.locator('.evidence-steps');
      ok((await evidenceSteps.evaluate((list) => list?.tagName ?? '')) === 'OL', `${route}: evidence map is an ordered list`);
      const stepCount = await evidenceSteps.locator('li').count();
      ok(stepCount === caseStepCounts[id], `${route}: evidence step count`, String(stepCount));

      const bodyText = await page.locator('body').innerText();
      ok(bodyText.includes(caseProofMarkers[id]), `${route}: exact proof marker present`, caseProofMarkers[id]);

      const dtLabels = await page.locator('.case-list dt').evaluateAll((items) =>
        items.map((item) => item.textContent?.trim() ?? ''),
      );
      ok(
        JSON.stringify(dtLabels) === JSON.stringify(['Problem', 'What I built', 'My role', 'What stays human', 'Public proof', 'Scope']),
        `${route}: case detail keeps the full problem/build/role/limit/proof/scope record`,
        JSON.stringify(dtLabels),
      );

      if (id === 'hermes-deployment-lab' || id === 'hermes-field-kit' || id === 'agent-operating-system') {
        ok(
          bodyText.includes('Nous Research product') && bodyText.includes('Nous/Hermes Enterprise affiliation'),
          `${route}: independent-evidence note disclaims Nous/Hermes affiliation`,
        );
      }

      if (id === 'hermes-deployment-lab') {
        const explorer = page.locator('[data-recovery-proof]');
        const stages = explorer.locator('[data-recovery-stage]');
        ok((await explorer.count()) === 1, `${route}: one interactive recovery proof`);
        ok((await stages.count()) === 5, `${route}: recovery proof has five meaningful states`);
        ok((await stages.first().getAttribute('aria-pressed')) === 'true', `${route}: recovery proof exposes its initial state`);

        await stages.nth(2).click();
        ok(
          (await explorer.locator('[data-stage-state]').innerText()) === 'The change went through, but the confirmation was lost',
          `${route}: fault state explains the missing confirmation`,
        );
        ok((await explorer.locator('[data-stage-effects]').innerText()) === '1', `${route}: fault state records one side effect`);
        ok(
          (await explorer.locator('[data-stage-receipt]').innerText()) === 'Result still needs to be checked',
          `${route}: fault state does not overclaim proof`,
        );

        await stages.nth(2).press('End');
        ok((await explorer.getAttribute('data-stage')) === '4', `${route}: keyboard navigation reaches final readback`);
        ok((await stages.nth(4).getAttribute('aria-pressed')) === 'true', `${route}: final state is announced as selected`);
        ok((await explorer.locator('[data-stage-effects]').innerText()) === '1', `${route}: recovery preserves exactly one side effect`);
        ok((await explorer.locator('[data-stage-receipt]').innerText()) === 'Verified', `${route}: readback completes the synthetic receipt`);
      } else {
        ok((await page.locator('[data-recovery-proof]').count()) === 0, `${route}: recovery proof stays scoped to the deployment lab`);
      }

      ok((await page.locator('[data-evidence-motif][aria-hidden="true"]').count()) === 1, `${route}: process motif is flat and aria-hidden`);
    }
    await context.close();
  }

  /* ---- Experience ------------------------------------------------------------ */
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await auditPage(page, '/experience/', '/experience/');
    await assertPrimaryNavContract(page, '/experience/');
    const rows = await page.locator('.ruled-list .ruled-row').evaluateAll((rows) =>
      rows.map((row) => ({
        dates: row.querySelector('.mono')?.textContent?.trim(),
        title: row.querySelector('h2')?.textContent?.trim(),
        location: row.querySelector('.location-line')?.textContent?.trim() ?? null,
      })),
    );
    ok(rows.length === 5, '/experience/: five dated entries', String(rows.length));
    ok(rows[0].title === 'Senior Manager · LSL, LLP', '/experience/: current role is Senior Manager · LSL, LLP first', JSON.stringify(rows[0]));
    ok(rows[0].location === 'Chicago, then Des Moines', '/experience/: current role states Chicago then Des Moines', String(rows[0].location));
    const experienceText = await page.locator('main').innerText();
    ok(!experienceText.includes('Remote'), '/experience/: omits Remote labels');
    for (const marker of [
      'Manager of Digital Services · Citrin Cooperman',
      'Solutions Architect · Workiva',
      'Solutions Consultant · Ambra Health',
      'SEC Reporting Consultant · Workiva',
    ]) {
      ok(experienceText.includes(marker), `/experience/: contains ${marker}`);
    }
    await context.close();
  }

  /* ---- About ------------------------------------------------------------------ */
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await auditPage(page, '/about/', '/about/');
    await assertPrimaryNavContract(page, '/about/');
    const aboutPortrait = await page.locator('.hero-portrait img').evaluate((img) => ({
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt'),
      filter: getComputedStyle(img).filter,
      clipPath: getComputedStyle(img).clipPath,
    }));
    ok(
      aboutPortrait.filter === 'none' && (aboutPortrait.clipPath === 'none' || !aboutPortrait.clipPath),
      '/about/: portrait is a plain, unprocessed image',
      JSON.stringify(aboutPortrait),
    );
    ok((await page.locator('h2').filter({ hasText: 'How I work' }).count()) === 1, '/about/: keeps a working-method section');
    await context.close();
  }

  /* ---- Fit ------------------------------------------------------------------- */
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await auditPage(page, '/fit/', '/fit/');
    const fitHeading = (await page.locator('h1').innerText()).trim();
    ok(fitHeading === 'How I would lead my first 90 days as an FDE.', '/fit/: exact heading', fitHeading);
    const phases = await page.locator('.ninety-plan > li').evaluateAll((items) =>
      items.map((item) => ({
        range: item.querySelector('.mono')?.textContent?.trim(),
        title: item.querySelector('h2')?.textContent?.trim(),
      })),
    );
    ok(phases.length === 4, '/fit/: four dated phases', String(phases.length));
    ok(
      phases.map((phase) => phase.range).join('|') === 'Weeks 1–2|Weeks 3–6|Weeks 6–10|Weeks 10–13',
      '/fit/: phases retain chronological ranges',
      phases.map((phase) => phase.range).join('|'),
    );
    for (const title of ['Choose the first problem.', 'Own the first deployment.', 'Lead through failure.', 'Make the next deployment easier.']) {
      ok(
        phases.some((phase) => phase.title === title),
        `/fit/: includes phase titled "${title}"`,
      );
    }
    const relatedLinks = await page.locator('.related-nav a').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    for (const route of ['/about/', '/experience/', '/work/']) {
      ok(relatedLinks.includes(route), `/fit/: links to ${route}`);
    }
    ok(relatedLinks.some((href) => href?.startsWith('mailto:')), '/fit/: includes a conversation action');
    ok((await page.locator('.primary-nav a[href="/fit/"]').count()) === 0, '/fit/: stays off primary navigation even on its own page');
    ok((await page.locator('footer.site-footer a[href="/fit/"]').count()) === 1, '/fit/: remains reachable from the shared footer');
    await context.close();
  }

  /* ---- 404 --------------------------------------------------------------------- */
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const notFoundResponse = await page.goto(`${base}/definitely-missing`, { waitUntil: 'load' });
    ok(notFoundResponse?.status() === 404, 'Custom 404 returns HTTP 404', String(notFoundResponse?.status()));
    await page.goto(`${base}/404.html`, { waitUntil: 'load' });
    ok((await page.locator('h1').count()) === 1, 'Custom 404 has one h1');
    ok((await page.locator('header.masthead').count()) === 1, 'Custom 404 uses the shared masthead');
    ok((await page.locator('footer.site-footer').count()) === 1, 'Custom 404 uses the shared footer');
    ok((await page.locator('link[href="/styles/working-record.css"]').count()) === 1, 'Custom 404 loads The Working Record stylesheet');
    await context.close();
  }

  /* ---- Résumé / llms.txt / sitemap ---------------------------------------------- */
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    const resumeResponse = await page.request.get(`${base}/dave-bettner-resume.pdf`);
    ok(resumeResponse.status() === 200, 'Public résumé HTTP 200', String(resumeResponse.status()));
    ok(resumeResponse.headers()['content-type']?.includes('application/pdf'), 'Public résumé has PDF content type', resumeResponse.headers()['content-type']);

    const llmsResponse = await page.request.get(`${base}/llms.txt`);
    const llmsText = await llmsResponse.text();
    ok(llmsResponse.status() === 200, 'Agent-readable site guide HTTP 200', String(llmsResponse.status()));
    ok(llmsResponse.headers()['content-type']?.includes('text/plain'), 'Agent-readable site guide has plain-text content type', llmsResponse.headers()['content-type']);
    for (const route of coreRoutes) {
      ok(llmsText.includes(`https://davebettner.com${route}`), `Agent-readable site guide includes ${route}`);
    }
    ok(llmsText.includes('does not offer a public API, hosted MCP endpoint'), 'Agent-readable site guide states the public interface boundary');

    const sitemap = await readFile('dist/sitemap-0.xml', 'utf8');
    for (const route of [...coreRoutes.filter((route) => route !== '/'), ...projectRoutes]) {
      ok(sitemap.includes(`https://davebettner.com${route}`), `Sitemap includes ${route}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
  await stopPreview(preview);
}

console.log(JSON.stringify({ pass: errors.length === 0, count: checks.length, checks, errors }, null, 2));
if (errors.length) process.exit(1);
