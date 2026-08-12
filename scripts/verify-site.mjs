import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';

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
    preview.kill('SIGTERM');
    throw new Error('Static production preview did not become ready within 15 seconds');
  }
}

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});

const projects = [
  {
    slug: 'regulated-reporting-mcp',
    title: 'Regulated Reporting MCP',
    repo: 'https://github.com/dbett4/regulated-reporting-mcp',
    proof: '126 credential-free tests',
  },
  {
    slug: 'hermes-deployment-lab',
    title: 'Hermes Deployment Lab',
    repo: 'https://github.com/dbett4/hermes-enterprise-deployment-lab',
    proof: '73 public credential-free tests',
  },
  {
    slug: 'hermes-field-kit',
    title: 'Hermes Enterprise Evaluation Kit',
    repo: 'https://github.com/dbett4/hermes-enterprise-field-kit',
    proof: '318-row',
    boundaries: ['needs_review', '$0.406986 estimate', 'actual billed cost', 'two recorded execution-time exceptions'],
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

async function assertHomepageResponsiveContracts(page, viewport) {
  const { name, width } = viewport;

  if (width <= 390) {
    const navGeometry = await page.evaluate(() => {
      const nav = document.querySelector('.mobile-section-nav');
      if (!(nav instanceof HTMLElement)) return null;
      const navRect = nav.getBoundingClientRect();
      const links = [...nav.querySelectorAll('a')].map((link) => {
        const rect = link.getBoundingClientRect();
        return {
          href: link.getAttribute('href'),
          text: (link.textContent ?? '').trim(),
          width: rect.width,
          height: rect.height,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          insideNav:
            rect.left >= navRect.left - 0.5 &&
            rect.right <= navRect.right + 0.5 &&
            rect.top >= navRect.top - 0.5 &&
            rect.bottom <= navRect.bottom + 0.5,
          insideViewport:
            rect.left >= -0.5 &&
            rect.right <= innerWidth + 0.5 &&
            rect.width > 0 &&
            rect.height > 0,
        };
      });
      return {
        linkCount: links.length,
        navScrollWidth: nav.scrollWidth,
        navClientWidth: nav.clientWidth,
        navOverflows: nav.scrollWidth > nav.clientWidth + 1,
        links,
      };
    });
    ok(Boolean(navGeometry), `${name}: mobile section-nav present`);
    ok(navGeometry?.linkCount === 5, `${name}: mobile section-nav has five links`, String(navGeometry?.linkCount));
    ok(
      Boolean(navGeometry?.links.every((target) => target.width >= 44 && target.height >= 44)),
      `${name}: mobile section-nav targets are at least 44×44`,
      JSON.stringify(navGeometry?.links),
    );
    ok(
      Boolean(navGeometry && !navGeometry.navOverflows),
      `${name}: mobile section-nav does not overflow horizontally`,
      JSON.stringify({
        scrollWidth: navGeometry?.navScrollWidth,
        clientWidth: navGeometry?.navClientWidth,
      }),
    );
    ok(
      Boolean(navGeometry?.links.every((target) => target.insideNav && target.insideViewport)),
      `${name}: mobile section-nav link rectangles stay inside nav/viewport`,
      JSON.stringify(navGeometry?.links),
    );
  }

  if (width === 768) {
    const tabletGeometry = await page.evaluate(() => {
      const copy = document.querySelector('.cover-copy');
      const specimen = document.querySelector('.cover-specimen');
      const stages = [...document.querySelectorAll('.loop-stage')];
      const cards = [...document.querySelectorAll('.building-card')];
      const portrait = document.querySelector('.about-portrait');
      const aboutCopy = document.querySelector('.about-copy');
      if (!copy || !specimen || !portrait || !aboutCopy) {
        return { ok: false, reason: 'missing cover/about nodes' };
      }
      const cr = copy.getBoundingClientRect();
      const sr = specimen.getBoundingClientRect();
      const pr = portrait.getBoundingClientRect();
      const ar = aboutCopy.getBoundingClientRect();
      const coverVerticalOverlap = Math.min(cr.bottom, sr.bottom) > Math.max(cr.top, sr.top) + 24;
      const coverSeparateColumns = Math.abs(cr.left - sr.left) > 80;
      const stageTops = stages.map((stage) => Math.round(stage.getBoundingClientRect().top));
      const loopOneRow = stages.length === 4 && stageTops.every((top) => Math.abs(top - stageTops[0]) <= 2);
      const cardRects = cards.map((card) => card.getBoundingClientRect());
      const leftColumn = cardRects.filter((rect) => Math.abs(rect.left - cardRects[0].left) <= 2);
      const proofTwoColumns = cards.length === 4 && leftColumn.length === 2;
      const aboutVerticalOverlap = Math.min(pr.bottom, ar.bottom) > Math.max(pr.top, ar.top) + 24;
      const aboutSeparateColumns = Math.abs(pr.left - ar.left) > 80;
      return {
        ok: true,
        coverVerticalOverlap,
        coverSeparateColumns,
        loopOneRow,
        stageTops,
        proofTwoColumns,
        leftColumnCount: leftColumn.length,
        aboutVerticalOverlap,
        aboutSeparateColumns,
      };
    });
    ok(tabletGeometry.ok, `${name}: tablet geometry nodes present`, tabletGeometry.reason ?? '');
    ok(tabletGeometry.coverVerticalOverlap && tabletGeometry.coverSeparateColumns, `${name}: tablet cover is two-column / vertically paired`, JSON.stringify(tabletGeometry));
    ok(tabletGeometry.loopOneRow, `${name}: tablet loop is one row of four stages`, JSON.stringify(tabletGeometry.stageTops));
    ok(tabletGeometry.proofTwoColumns, `${name}: tablet proof index is two columns`, String(tabletGeometry.leftColumnCount));
    ok(tabletGeometry.aboutVerticalOverlap && tabletGeometry.aboutSeparateColumns, `${name}: tablet About portrait and copy are paired`, JSON.stringify(tabletGeometry));
  }

  if (width <= 390) {
    const phoneOrder = await page.evaluate(() => {
      const heading = document.querySelector('#thesis-heading');
      const specimen = document.querySelector('.cover-specimen');
      const support = document.querySelector('.cover-support');
      if (!heading || !specimen || !support) return null;
      const ht = heading.getBoundingClientRect().top;
      const st = specimen.getBoundingClientRect().top;
      const spt = support.getBoundingClientRect().top;
      return { ht, st, spt, headingBeforeSpecimen: ht < st, specimenBeforeSupport: st < spt };
    });
    ok(Boolean(phoneOrder), `${name}: phone cover order nodes present`);
    ok(phoneOrder?.headingBeforeSpecimen && phoneOrder?.specimenBeforeSupport, `${name}: phone visual order is H1 → specimen → support`, JSON.stringify(phoneOrder));

    const loopRail = await page.evaluate(() => {
      const stages = [...document.querySelectorAll('.loop-stage')];
      return stages.map((stage) => {
        const styles = getComputedStyle(stage);
        const number = stage.querySelector('.loop-n');
        const body = stage.querySelector('.loop-body');
        const nr = number?.getBoundingClientRect();
        const br = body?.getBoundingClientRect();
        return {
          columns: styles.gridTemplateColumns,
          twoColumn: Boolean(nr && br && Math.abs(nr.top - br.top) < 40 && br.left > nr.right - 1),
          text: (body?.textContent ?? '').trim().length,
        };
      });
    });
    ok(loopRail.length === 4, `${name}: phone loop has four stages`);
    ok(
      loopRail.every((stage) => stage.twoColumn && stage.text > 0),
      `${name}: phone loop stages use two-column internal layout with visible text`,
      JSON.stringify(loopRail),
    );

    const proofScroll = await page.evaluate(() => {
      const list = document.querySelector('.building-list');
      if (!(list instanceof HTMLElement)) return null;
      const doc = document.documentElement;
      return {
        listScrollWidth: list.scrollWidth,
        listClientWidth: list.clientWidth,
        docScrollWidth: doc.scrollWidth,
        docClientWidth: doc.clientWidth,
      };
    });
    ok(Boolean(proofScroll), `${name}: phone proof list present`);
    ok(
      Boolean(proofScroll && proofScroll.listScrollWidth > proofScroll.listClientWidth),
      `${name}: phone proof index is horizontally scrollable`,
      JSON.stringify(proofScroll),
    );
    ok(
      Boolean(proofScroll && proofScroll.docScrollWidth <= proofScroll.docClientWidth),
      `${name}: phone document does not overflow horizontally with proof index`,
      JSON.stringify(proofScroll),
    );

    const fourthReachable = await page.evaluate(() => {
      const list = document.querySelector('.building-list');
      const cards = [...document.querySelectorAll('.building-card')];
      const fourth = cards[3];
      if (!(list instanceof HTMLElement) || !fourth) return { ok: false, reason: 'missing list/card' };
      const link = fourth.querySelector('a');
      if (!(link instanceof HTMLElement)) return { ok: false, reason: 'missing link' };
      list.scrollLeft = list.scrollWidth;
      link.focus({ preventScroll: false });
      link.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const rect = link.getBoundingClientRect();
      const style = getComputedStyle(fourth);
      const evidence = fourth.querySelector('.building-evidence')?.textContent?.trim() ?? '';
      const limit = fourth.querySelector('.building-limit')?.textContent?.trim() ?? '';
      return {
        ok: true,
        focused: document.activeElement === link,
        inView: rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < innerWidth,
        evidenceVisible: evidence.length > 0 && style.visibility !== 'hidden',
        limitVisible: limit.length > 0,
        evidence,
        limit,
      };
    });
    ok(fourthReachable.ok, `${name}: fourth proof card present`, fourthReachable.reason ?? '');
    ok(fourthReachable.focused && fourthReachable.inView, `${name}: fourth proof card link reachable after horizontal scroll`, JSON.stringify(fourthReachable));
    ok(fourthReachable.evidenceVisible && fourthReachable.limitVisible, `${name}: fourth proof card evidence/limit remain visible`, JSON.stringify(fourthReachable));

    const allCardText = await page.locator('.building-card').evaluateAll((cards) =>
      cards.map((card) => ({
        evidence: card.querySelector('.building-evidence')?.textContent?.trim() ?? '',
        limit: card.querySelector('.building-limit')?.textContent?.trim() ?? '',
      })),
    );
    ok(
      allCardText.length === 4 && allCardText.every((card) => card.evidence.length > 0 && card.limit.length > 0),
      `${name}: all four proof cards keep evidence and limit text`,
      JSON.stringify(allCardText.map((card) => ({ evidence: card.evidence.length, limit: card.limit.length }))),
    );
  }
}

async function auditPage(page, route, label) {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  const response = await page.goto(`${base}${route === '/' ? '' : route}`, { waitUntil: 'networkidle' });
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
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'mobile-320', width: 320, height: 720 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await auditPage(page, '/', viewport.name);
    ok(await page.locator('#work').count() === 1, `${viewport.name}: work section exists`);
    ok(await page.locator('#work .building-card').count() === 4, `${viewport.name}: four public engineering cards`);
    ok(await page.locator('a[href="https://github.com/dbett4"]').count() >= 1, `${viewport.name}: GitHub profile is linked`);
    const body = await page.locator('body').innerText();
    ok(body.includes('publication dates'), `${viewport.name}: publication provenance visible`);
    ok(!body.includes('459 Python'), `${viewport.name}: stale Wingman count absent`);
    const coverKicker = await page.locator('.cover-kicker').textContent();
    ok(
      coverKicker?.trim() === 'Forward-deployed · solutions engineering',
      `${viewport.name}: homepage kicker targets forward-deployed / solutions engineering`,
      String(coverKicker),
    );
    ok(body.includes('inside a customer environment'), `${viewport.name}: thesis names customer environment`);
    ok(
      body.includes('where agent systems meet real operations'),
      `${viewport.name}: direction targets agent systems / real operations`,
    );
    ok(body.includes('technical validation'), `${viewport.name}: loop names technical validation`);
    ok(
      body.includes('onboarding, observability, recovery, and adoption'),
      `${viewport.name}: loop names onboarding through adoption`,
    );
    ok(
      body.includes('finance, audit, and assurance'),
      `${viewport.name}: domain depth names finance, audit, and assurance`,
    );
    ok(
      body.includes('forward-deployed and solutions engineering roles'),
      `${viewport.name}: closing CTA names forward-deployed / solutions engineering roles`,
    );
    ok(
      body.includes('Financial reporting QA with readback'),
      `${viewport.name}: Wingman card uses financial reporting QA name`,
    );
    ok(
      body.includes('controlled changes are read back and restored on mismatch'),
      `${viewport.name}: Wingman evidence names readback/restore`,
    );
    ok(!body.includes('Fieldguide'), `${viewport.name}: Fieldguide string absent`);
    ok(!body.includes('Nous Research'), `${viewport.name}: Nous Research string absent`);
    ok(!body.includes('I am an auditor'), `${viewport.name}: auditor identity claim absent`);
    const buildingCardOrder = await page.locator('.building-card').evaluateAll((cards) =>
      cards.map((card) => card.id),
    );
    ok(
      buildingCardOrder.join(',') ===
        'hermes-deployment-lab,regulated-reporting-mcp,hermes-field-kit,wingman',
      `${viewport.name}: building-card order is deployment lab → MCP → field kit → Wingman`,
      buildingCardOrder.join(','),
    );
    await assertHomepageResponsiveContracts(page, viewport);
    await page.evaluate(async () => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      await Promise.all(
        Array.from(document.images, (image) =>
          typeof image.decode === 'function' ? image.decode().catch(() => undefined) : Promise.resolve(),
        ),
      );
      const list = document.querySelector('.building-list');
      if (list instanceof HTMLElement) list.scrollLeft = 0;
      window.scrollTo(0, 0);
      for (let i = 0; i < 4; i += 1) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    });
    if (viewport.width <= 390) {
      const proofReset = await page.evaluate(() => {
        const list = document.querySelector('.building-list');
        const cards = [...document.querySelectorAll('.building-card')];
        if (!(list instanceof HTMLElement) || cards.length < 2) return null;
        const listRect = list.getBoundingClientRect();
        const first = cards[0].getBoundingClientRect();
        const second = cards[1].getBoundingClientRect();
        const visibleWidth = (rect) =>
          Math.max(0, Math.min(rect.right, listRect.right) - Math.max(rect.left, listRect.left));
        const firstVisible = visibleWidth(first);
        const secondVisible = visibleWidth(second);
        return {
          scrollLeft: list.scrollLeft,
          firstVisible,
          secondVisible,
          listWidth: listRect.width,
          firstPrimary: firstVisible >= secondVisible && firstVisible >= listRect.width * 0.55,
          secondPeeks: secondVisible >= 8 && second.left < listRect.right && second.right > listRect.left,
        };
      });
      ok(Boolean(proofReset), `${viewport.name}: proof list reset nodes present`);
      ok(
        Boolean(proofReset && Math.abs(proofReset.scrollLeft) <= 1),
        `${viewport.name}: proof list scrollLeft reset near zero`,
        String(proofReset?.scrollLeft),
      );
      ok(
        Boolean(proofReset?.firstPrimary),
        `${viewport.name}: first proof card is primary after reset`,
        JSON.stringify(proofReset),
      );
      ok(
        Boolean(proofReset?.secondPeeks),
        `${viewport.name}: next proof card peeks after reset`,
        JSON.stringify(proofReset),
      );
    }
    await page.screenshot({ path: `${out}/${viewport.name}.png`, fullPage: true });
    await context.close();
  }

  const animatedContext = await browser.newContext({ viewport: { width: 960, height: 720 } });
  const animatedPage = await animatedContext.newPage();
  await animatedPage.goto(base, { waitUntil: 'networkidle' });
  const animatedCanvas = animatedPage.locator('[data-signal-canvas]');
  const animatedFrameA = await animatedCanvas.screenshot();
  await animatedPage.waitForTimeout(700);
  const animatedFrameB = await animatedCanvas.screenshot();
  ok(!animatedFrameA.equals(animatedFrameB), 'Homepage signal field changes over time');
  await animatedContext.close();

  const reducedContext = await browser.newContext({
    viewport: { width: 960, height: 720 },
    reducedMotion: 'reduce',
  });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(base, { waitUntil: 'networkidle' });
  const reducedCanvas = reducedPage.locator('[data-signal-canvas]');
  const reducedFrameA = await reducedCanvas.screenshot();
  await reducedPage.waitForTimeout(700);
  const reducedFrameB = await reducedCanvas.screenshot();
  ok(reducedFrameA.equals(reducedFrameB), 'Homepage signal field is static with reduced motion');
  await reducedContext.close();

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
    Boolean(
      metadata.description?.includes('customer environments') &&
        metadata.description?.includes('finance and regulated workflows'),
    ),
    'Homepage meta description targets customer environments and finance/regulated workflows',
    String(metadata.description),
  );
  ok(
    metadata.ogTitle === 'Dave Bettner | Forward-Deployed and Solutions Engineering',
    'Homepage Open Graph title matches launch positioning',
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
  } catch (error) {
    ok(false, 'JSON-LD parses', error.message);
  }

  for (const project of projects) {
    const route = `/work/${project.slug}/`;
    await auditPage(page, route, route);
    ok((await page.locator('h1').innerText()).includes(project.title), `${route}: project title`);
    ok(await page.locator(`a[href="${project.repo}"]`).count() >= 1, `${route}: direct repository link`);
    const projectText = await page.locator('body').innerText();
    ok(projectText.includes(project.proof), `${route}: exact proof marker`, project.proof);
    for (const boundary of project.boundaries ?? []) {
      ok(projectText.includes(boundary), `${route}: proof boundary ${boundary}`);
    }
  }

  await page.goto(`${base}/experience/`, { waitUntil: 'networkidle' });
  const experienceText = await page.locator('main').innerText();
  for (const marker of [
    'Senior Manager · LSL, LLP',
    'Manager of Digital Services · Citrin Cooperman',
    'Solutions Architect · Workiva',
    'Solutions Consultant · Ambra Health',
    'SEC Reporting Consultant · Workiva',
    'Chicago, then Des Moines',
  ]) {
    ok(experienceText.includes(marker), `Experience contains ${marker}`);
  }
  ok(!experienceText.includes('Remote'), 'Experience omits Remote labels');
  ok(!experienceText.includes('Kaiser Permanente'), 'Experience anonymizes private client name');

  await page.goto(`${base}/about/`, { waitUntil: 'networkidle' });
  const aboutText = await page.locator('main').innerText();
  ok(!aboutText.includes('My career has moved from accounting'), 'About omits accountant-first career framing');
  ok(
    aboutText.includes('enterprise solution delivery') && aboutText.includes('financial reporting technology'),
    'About leads from enterprise solution delivery / financial reporting technology',
  );

  await page.goto(`${base}/fit/`, { waitUntil: 'networkidle' });
  const fitPayload = await page.locator('#fit-profile-data').textContent();
  ok(fitPayload?.includes('github.com/dbett4/regulated-reporting-mcp'), 'Fit payload includes repository proof');
  ok(fitPayload?.includes('462 Python'), 'Fit payload includes corrected Wingman count');
  ok(!fitPayload?.includes('CPA-firm practice lead'), 'Fit payload omits unsupported practice-lead claim');
  ok(
    !fitPayload?.includes('not career software engineering or ML research'),
    'Fit payload omits self-rejecting career framing',
  );
  ok(
    fitPayload?.includes('10+ years') || fitPayload?.includes('Ten-plus years') || fitPayload?.includes('More than ten years'),
    'Fit payload keeps bounded enterprise-delivery tenure',
  );
  ok(
    Boolean(fitPayload?.match(/Python/i) && fitPayload?.match(/agent/i)),
    'Fit payload mentions recent hands-on agent-integration work',
  );

  const providersPayload = await page.locator('#fit-providers-data').textContent();
  ok(Boolean(providersPayload), 'Fit providers payload is embedded');
  try {
    const providers = JSON.parse(providersPayload ?? 'null');
    ok(Array.isArray(providers) && providers.length > 0, 'Fit providers payload parses', String(providers?.length));
    ok(providers.every((provider) => provider.id && provider.label && provider.prefix), 'Fit providers include launch prefixes');
  } catch (error) {
    ok(false, 'Fit providers payload parses', error.message);
  }

  const fitJobDescription =
    'Senior forward-deployed AI implementation lead for regulated enterprise software rollouts.';
  await page.evaluate(() => {
    window.__fitOpenCalls = [];
    window.open = (url, target, features) => {
      window.__fitOpenCalls.push({ url: String(url ?? ''), target, features });
      return null;
    };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.__fitClipboard = String(text ?? '');
        },
      },
    });
  });
  await page.locator('#job-description').fill(fitJobDescription);
  await page.locator('.fit-ai-btn[data-provider="chatgpt"]').click();
  await page.waitForFunction(() =>
    (document.getElementById('fit-status')?.textContent ?? '').includes('Opened ChatGPT'),
  );
  const providerLaunch = await page.evaluate(() => ({
    opens: window.__fitOpenCalls ?? [],
    clipboard: window.__fitClipboard ?? '',
    status: document.getElementById('fit-status')?.textContent ?? '',
  }));
  ok(providerLaunch.opens.length === 1, 'Fit provider click opens exactly one stubbed window', String(providerLaunch.opens.length));
  ok(
    providerLaunch.opens[0]?.url.startsWith('https://chatgpt.com/?q=') &&
      decodeURIComponent(providerLaunch.opens[0].url).includes(fitJobDescription),
    'Fit provider URL includes pasted job description without a real tab',
  );
  ok(providerLaunch.clipboard.includes(fitJobDescription), 'Fit provider click copies prompt with job description');
  ok(
    providerLaunch.status.includes('Copied prompt') && providerLaunch.status.includes('Opened ChatGPT'),
    'Fit provider click shows success status',
    providerLaunch.status,
  );

  await page.evaluate(() => {
    window.__fitClipboard = '';
  });
  await page.locator('#fit-copy-prompt').click();
  await page.waitForFunction(() =>
    document.getElementById('fit-status')?.textContent === 'Prompt copied to clipboard.',
  );
  const copyResult = await page.evaluate(() => ({
    opens: window.__fitOpenCalls ?? [],
    clipboard: window.__fitClipboard ?? '',
    status: document.getElementById('fit-status')?.textContent ?? '',
  }));
  ok(copyResult.opens.length === 1, 'Fit copy button does not open another window', String(copyResult.opens.length));
  ok(copyResult.clipboard.includes(fitJobDescription), 'Fit copy button copies prompt with job description');
  ok(copyResult.status === 'Prompt copied to clipboard.', 'Fit copy button shows success status', copyResult.status);

  const resumeResponse = await page.request.get(`${base}/dave-bettner-resume.pdf`);
  ok(resumeResponse.status() === 200, 'Public résumé HTTP 200', String(resumeResponse.status()));
  ok(resumeResponse.headers()['content-type']?.includes('application/pdf'), 'Public résumé has PDF content type', resumeResponse.headers()['content-type']);

  const sitemap = await readFile('dist/sitemap-0.xml', 'utf8');
  for (const route of [...coreRoutes.filter((route) => route !== '/' && route !== '/fit/'), ...projectRoutes]) {
    ok(sitemap.includes(`https://davebettner.com${route}`), `Sitemap includes ${route}`);
  }

  const notFoundResponse = await page.goto(`${base}/definitely-missing`, { waitUntil: 'load' });
  ok(notFoundResponse?.status() === 404, 'Custom 404 returns HTTP 404', String(notFoundResponse?.status()));
  ok(await page.locator('h1').count() === 1, 'Custom 404 has one h1');

  await context.close();
} finally {
  await browser.close();
  if (preview) {
    if (preview.exitCode === null) {
      preview.kill('SIGTERM');
      await once(preview, 'exit');
    }
  }
}

console.log(JSON.stringify({ pass: errors.length === 0, count: checks.length, checks, errors }, null, 2));
if (errors.length) process.exit(1);
