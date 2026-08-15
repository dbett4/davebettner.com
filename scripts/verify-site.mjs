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

const buildingRoles = [
  'Failure recovery',
  'Upstream product fix',
  'Guarded integration',
];

const loopStagesExpected = [
  { cue: 'Discover', handoff: 'Decision criteria' },
  { cue: 'Shape', handoff: 'Scoped proposal / SOW' },
  { cue: 'Demonstrate', handoff: 'Demo against criteria' },
  { cue: 'Deliver', handoff: 'Signed-off go-live' },
  { cue: 'Adopt', handoff: 'Operating cadence' },
];

const caseEyebrows = {
  'regulated-reporting-mcp': 'Guarded integration · Regulated Reporting MCP',
  'hermes-deployment-lab': 'Failure recovery · Hermes Deployment Lab',
  'hermes-field-kit': 'Evaluation · Hermes Enterprise Evaluation Kit',
  wingman: 'Readback + restore · Confirm-before-write quality',
};

const caseStepCounts = {
  'regulated-reporting-mcp': 5,
  'hermes-deployment-lab': 5,
  'hermes-field-kit': 5,
  wingman: 6,
};

const outcomeStories = [
  {
    label: 'Statutory certification handoff',
    context: 'Manager of Digital Services · Citrin Cooperman',
    title: 'Bidirectional API workflow carried through sign-off',
    result: 'Bidirectional reporting ↔ system-of-record handoff with audit trail and finance, IT, and executive sign-off at go-live.',
  },
  {
    label: 'GRC reporting with human review',
    context: 'Solutions Architect · Workiva',
    title: 'Controlled reporting with human review and native readback',
    result: 'SSO, API, and ERP-scoped GRC and reporting implementations with controlled writes, human sign-off, and native readback.',
  },
  {
    label: 'HIPAA imaging integration',
    context: 'Solutions Consultant · Ambra Health',
    title: 'HIPAA imaging, EHR, and portal integrations through acquisition',
    result: 'HIPAA imaging, EHR, portal, and billing workflows through acquisition; integrations cleared review before go-live.',
  },
];

const projects = [
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
    slug: 'hermes-field-kit',
    title: 'Hermes Enterprise Evaluation Kit',
    repo: 'https://github.com/dbett4/hermes-enterprise-field-kit',
    proof: 'Offline FIELD_KIT_PROOF_PASS',
    boundaries: ['needs_review', 'estimated rather than billed cost', 'two recorded execution-time exceptions'],
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

async function assertCausalDeliveryLoopContracts(page, name) {
  const loopStages = await page.locator('.loop-stage').evaluateAll((stages) =>
    stages.map((stage) => ({
      cue: (stage.querySelector('.loop-cue')?.textContent ?? '').trim(),
      title: (stage.querySelector('.loop-body h3')?.textContent ?? '').trim(),
      detail: (stage.querySelector('.loop-body p')?.textContent ?? '').trim(),
    })),
  );
  ok(loopStages.length === 5, `${name}: engagement method has five stages`, String(loopStages.length));
  ok(
    loopStages.every((stage) => stage.cue && stage.title && stage.detail),
    `${name}: engagement stages expose cue, title, and detail`,
    JSON.stringify(loopStages),
  );
  ok(
    loopStages.map((stage) => stage.cue).join('|') === loopStagesExpected.map((stage) => stage.cue).join('|'),
    `${name}: engagement order is Discover → Shape → Demonstrate → Deliver → Adopt`,
    loopStages.map((stage) => stage.cue).join('|'),
  );

  const handoffs = await page.locator('.loop-handoff strong').allTextContents();
  ok(
    handoffs.map((handoff) => handoff.trim()).join('|') === loopStagesExpected.map((stage) => stage.handoff).join('|'),
    `${name}: every engagement stage names the artifact it hands forward`,
    handoffs.join('|'),
  );
  ok((await page.locator('.loop-transition').count()) === 4, `${name}: four forward transitions connect the five stages`);

  const boundaryCount = await page.locator('.loop-context').count();
  ok(boundaryCount === 1, `${name}: one customer-environment boundary frames the method`, String(boundaryCount));
  const boundaryText = boundaryCount === 1 ? await page.locator('.loop-context').innerText() : '';
  ok(
    boundaryText.includes('Inside the customer environment'),
    `${name}: system boundary explicitly names the customer environment`,
    boundaryText,
  );

  const feedbackCount = await page.locator('.loop-feedback').count();
  ok(feedbackCount === 1, `${name}: one feedback path closes the loop`, String(feedbackCount));
  const feedbackText = feedbackCount === 1 ? await page.locator('.loop-feedback').innerText() : '';
  ok(
    feedbackText.includes('Adopt → next Discover') &&
      feedbackText.includes('Adoption evidence reshapes the next discovery.'),
    `${name}: feedback states what Adopt changes in the next Discover`,
    feedbackText,
  );
  ok((await page.locator('.loop-return-rail').count()) === 1, `${name}: one visible return rail closes Adopt back to Discover`);

  ok((await page.locator('.loop-orbit-svg, .loop-center, .loop-legend').count()) === 0, `${name}: legacy decorative orbit nodes removed`);

  ok((await page.locator('.loop-n').count()) === 0, `${name}: loop ordinals removed`);
  ok((await page.locator('.building-index').count()) === 0, `${name}: building indices removed`);
  ok((await page.locator('.proof-n').count()) === 0, `${name}: proof ordinals removed`);

  const roleLabels = await page.locator('.building-role').evaluateAll((labels) =>
    labels.map((label) => ({
      text: (label.textContent ?? '').trim(),
      hiddenAncestor: Boolean(label.closest('[aria-hidden="true"]')),
    })),
  );
  ok(
    roleLabels.map((label) => label.text).join('|') === buildingRoles.join('|'),
    `${name}: building roles match project order`,
    roleLabels.map((label) => label.text).join('|'),
  );
  ok(
    roleLabels.every((label) => !label.hiddenAncestor),
    `${name}: building roles remain exposed to assistive technology`,
    JSON.stringify(roleLabels),
  );

  const outcomeRows = await page.locator('.proof-row').evaluateAll((rows) =>
    rows.map((row) => ({
      label: (row.querySelector('.proof-label')?.textContent ?? '').trim(),
      context: (row.querySelector('.proof-context')?.textContent ?? '').trim(),
      title: (row.querySelector('.proof-main h3')?.textContent ?? '').trim(),
      result: (row.querySelector('.proof-result')?.textContent ?? '').trim(),
      markClasses: [...row.querySelectorAll('.outcome-mark')].flatMap((mark) => [...mark.classList]),
    })),
  );
  ok(outcomeRows.length === 3, `${name}: three delivery outcome rows`, String(outcomeRows.length));
  ok(
    outcomeRows.every((row, index) =>
      row.label === outcomeStories[index].label &&
      row.context === outcomeStories[index].context &&
      row.title === outcomeStories[index].title &&
      row.result === outcomeStories[index].result,
    ),
    `${name}: delivery outcome copy leads with domain/result labels and keeps role context`,
    JSON.stringify(outcomeRows),
  );
  const markClassSets = outcomeRows.map((row) =>
    row.markClasses.filter((className) => className.startsWith('outcome-mark--')).sort().join(','),
  );
  ok(
    new Set(markClassSets).size === 3,
    `${name}: delivery outcome marks are geometrically distinct`,
    markClassSets.join('|'),
  );

  if ((page.viewportSize()?.width ?? Number.POSITIVE_INFINITY) <= 960) {
    const outcomeTextGeometry = await page.locator('.proof-row').evaluateAll((rows) =>
      rows.map((row) => {
        const main = row.querySelector('.proof-main')?.getBoundingClientRect();
        const summary = row.querySelector('.proof-summary')?.getBoundingClientRect();
        const result = row.querySelector('.proof-result')?.getBoundingClientRect();
        return main && summary && result
          ? {
              aligned: Math.abs(main.left - summary.left) < 1 && Math.abs(main.left - result.left) < 1,
              readableWidth: summary.width >= 180 && result.width >= 180,
              stacked: summary.top >= main.bottom && result.top >= summary.bottom,
            }
          : null;
      }),
    );
    ok(
      outcomeTextGeometry.every((row) => row?.aligned && row.readableWidth && row.stacked),
      `${name}: mobile delivery outcome copy stacks at a readable width without overlap`,
      JSON.stringify(outcomeTextGeometry),
    );
  }
  ok((await page.locator('ol.proof-ledger').count()) === 0, `${name}: delivery outcomes are not an ordered list`);

  const body = await page.locator('body').innerText();
  ok(!body.includes('SIG/01'), `${name}: decorative SIG/01 removed`);
  ok(
    (await page.locator('img[data-source-portrait][src="/images/dave-bettner-headshot-c13-navy-cutout.png"][width="1100"][height="1023"]').count()) === 1,
    `${name}: approved source-preserving navy-tie cutout is present`,
  );
  for (const token of ['01 ·', '02 ·', '03 ·', '04 ·']) {
    ok(!body.includes(token), `${name}: decorative serial token absent (${token})`);
  }
  for (const marker of [
    'Synthetic lab for agent-touching-internal-system failure modes',
    'MCP server for a Workiva-shaped reporting API',
  ]) {
    ok(body.includes(marker), `${name}: public proof problem statement retained (${marker})`);
  }
  for (const trivia of [
    'needs_review',
    '$0.406986',
    'v2026.8.3',
    'Chief of Staff',
    'Remote-friendly',
    'container startup is not attested',
    'parses Compose',
  ]) {
    ok(!body.includes(trivia), `${name}: homepage omits forbidden positioning trivia (${trivia})`);
  }
  ok((await page.locator('.building-limit, .limit-label').count()) === 0, `${name}: homepage has no per-card Limit blocks`);
  ok(
    body.includes('Labs and sanitized extracts') && body.includes('Nous/Hermes Enterprise affiliation'),
    `${name}: homepage evidence-boundary note present`,
  );
  ok(
    body.includes('Nous/Hermes Enterprise affiliation'),
    `${name}: evidence boundary denies Hermes Enterprise affiliation claim`,
  );
  ok(
    body.includes('production-engineering tenure'),
    `${name}: provenance keeps production-tenure claim boundary`,
  );
}

async function assertLoopCausalGeometry(page, name, width) {
  const geometry = await page.evaluate((isVertical) => {
    const field = document.querySelector('.loop-field');
    const context = document.querySelector('.loop-context');
    const mechanism = document.querySelector('.loop-mechanism');
    const stagePanels = [...document.querySelectorAll('.loop-stage-panel')];
    const transitions = [...document.querySelectorAll('.loop-transition')];
    const feedback = document.querySelector('.loop-feedback');
    const returnRail = document.querySelector('.loop-return-rail');
    if (
      !(field instanceof HTMLElement) ||
      !(context instanceof HTMLElement) ||
      !(mechanism instanceof HTMLElement) ||
      !(feedback instanceof HTMLElement) ||
      stagePanels.length !== 5 ||
      transitions.length !== 4
    ) {
      return { ok: false, reason: 'missing engagement-method nodes' };
    }

    const rect = (node) => {
      const bounds = node.getBoundingClientRect();
      return {
        left: bounds.left,
        right: bounds.right,
        top: bounds.top,
        bottom: bounds.bottom,
        width: bounds.width,
        height: bounds.height,
      };
    };
    const visible = (node) => {
      const bounds = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return bounds.width > 0 && bounds.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const contains = (outer, inner, gap = 1) =>
      inner.left >= outer.left - gap &&
      inner.right <= outer.right + gap &&
      inner.top >= outer.top - gap &&
      inner.bottom <= outer.bottom + gap;
    const overlaps = (first, second, gap = 1) =>
      first.left < second.right - gap &&
      first.right > second.left + gap &&
      first.top < second.bottom - gap &&
      first.bottom > second.top + gap;

    const fieldRect = rect(field);
    const contextRect = rect(context);
    const mechanismRect = rect(mechanism);
    const stageRects = stagePanels.map(rect);
    const transitionRects = transitions.map(rect);
    const feedbackRect = rect(feedback);
    const returnRailRect = returnRail instanceof HTMLElement ? rect(returnRail) : null;
    const stageCollisions = [];
    for (let first = 0; first < stageRects.length; first += 1) {
      for (let second = first + 1; second < stageRects.length; second += 1) {
        if (overlaps(stageRects[first], stageRects[second])) stageCollisions.push([first, second]);
      }
    }
    const ordered = stageRects.every((stage, index) => {
      if (index === 0) return true;
      const previous = stageRects[index - 1];
      return isVertical ? stage.top >= previous.bottom : stage.left >= previous.right;
    });
    const transitionsBetweenStages = transitionRects.every((transition, index) => {
      const current = stageRects[index];
      const next = stageRects[index + 1];
      return isVertical
        ? transition.top >= current.bottom - 1 && transition.bottom <= next.top + 1
        : transition.left >= current.right - 1 && transition.right <= next.left + 1;
    });
    const expectedTransitionGlyph = isVertical ? '↓' : '→';
    const transitionGlyphs = transitions.map((transition) => getComputedStyle(transition, '::before').content);
    const stageWidths = stageRects.map((stage) => stage.width);
    const stageWidthSpread = Math.max(...stageWidths) - Math.min(...stageWidths);
    const firstStage = stageRects[0];
    const lastStage = stageRects.at(-1);
    const firstCenterX = firstStage.left + firstStage.width / 2;
    const lastCenterX = lastStage.left + lastStage.width / 2;
    const verticalSequenceSpan = lastStage.bottom - firstStage.top;
    const stageSequenceLeft = Math.min(...stageRects.map((stage) => stage.left));
    const stageSequenceBottom = Math.max(...stageRects.map((stage) => stage.bottom));
    const railStyle = returnRail instanceof HTMLElement ? getComputedStyle(returnRail) : null;
    const returnArrowStyle = returnRail instanceof HTMLElement ? getComputedStyle(returnRail, '::before') : null;
    const returnArrowMetrics = returnArrowStyle
      ? {
          content: returnArrowStyle.content,
          display: returnArrowStyle.display,
          visibility: returnArrowStyle.visibility,
          opacity: Number.parseFloat(returnArrowStyle.opacity),
          color: returnArrowStyle.color,
          position: returnArrowStyle.position,
          left: Number.parseFloat(returnArrowStyle.left),
          top: Number.parseFloat(returnArrowStyle.top),
          width: Number.parseFloat(returnArrowStyle.width),
          height: Number.parseFloat(returnArrowStyle.height),
        }
      : null;
    const returnRailAdjacentToSequence = Boolean(
      returnRailRect &&
        (isVertical
          ? Math.abs(returnRailRect.top - firstStage.top) <= 16 &&
            Math.abs(returnRailRect.bottom - lastStage.bottom) <= 16 &&
            returnRailRect.right <= stageSequenceLeft &&
            stageSequenceLeft - returnRailRect.left <= 32
          : returnRailRect.top >= stageSequenceBottom - 1 && returnRailRect.top <= stageSequenceBottom + 4),
    );
    const returnRailPrecedesFeedback = Boolean(
      returnRailRect &&
        returnRailRect.bottom <= feedbackRect.top + 1 &&
        feedbackRect.top - returnRailRect.bottom <= 32,
    );
    const returnRailConnectsSequence = Boolean(
      returnRailRect &&
        (isVertical
          ? returnRailRect.left < stageSequenceLeft &&
            returnRailRect.top <= firstStage.top + firstStage.height / 2 &&
            returnRailRect.bottom >= lastStage.top + lastStage.height / 2 &&
            returnRailRect.height >= verticalSequenceSpan * 0.75
          : Math.abs(returnRailRect.left - firstCenterX) <= 16 &&
            Math.abs(returnRailRect.right - lastCenterX) <= 16 &&
            returnRailRect.height >= 20),
    );
    const returnRailDrawsPath = Boolean(
      railStyle &&
        (isVertical
          ? railStyle.borderLeftStyle === 'dashed' && Number.parseFloat(railStyle.borderLeftWidth) >= 1
          : railStyle.borderLeftStyle === 'dashed' &&
            Number.parseFloat(railStyle.borderLeftWidth) >= 1 &&
            railStyle.borderRightStyle === 'dashed' &&
            Number.parseFloat(railStyle.borderRightWidth) >= 1 &&
            railStyle.borderBottomStyle === 'dashed' &&
            Number.parseFloat(railStyle.borderBottomWidth) >= 1),
    );
    const returnArrowVisible = Boolean(
      returnArrowMetrics &&
        returnArrowMetrics.content.includes('↑') &&
        returnArrowMetrics.display !== 'none' &&
        returnArrowMetrics.visibility !== 'hidden' &&
        returnArrowMetrics.opacity > 0 &&
        returnArrowMetrics.color !== 'transparent' &&
        !/rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/.test(returnArrowMetrics.color) &&
        returnArrowMetrics.position === 'absolute' &&
        returnArrowMetrics.width > 0 &&
        returnArrowMetrics.height > 0,
    );
    const returnArrowAnchoredAtIntentEnd = Boolean(
      returnArrowMetrics &&
        Number.isFinite(returnArrowMetrics.left) &&
        Number.isFinite(returnArrowMetrics.top) &&
        Number.isFinite(returnArrowMetrics.width) &&
        Number.isFinite(returnArrowMetrics.height) &&
        Math.abs(returnArrowMetrics.left + returnArrowMetrics.width / 2) <= 16 &&
        Math.abs(returnArrowMetrics.top + returnArrowMetrics.height / 2) <= 16,
    );
    return {
      ok: true,
      contextVisible: visible(context),
      stagesVisible: stagePanels.every(visible),
      transitionsVisible: transitions.every(visible),
      feedbackVisible: visible(feedback),
      stagesInsideContext: stageRects.every((stage) => contains(contextRect, stage)),
      feedbackInsideContext: contains(contextRect, feedbackRect),
      mechanismInsideField: contains(fieldRect, mechanismRect),
      loopHasNoInternalOverflow:
        field.scrollWidth <= field.clientWidth + 1 &&
        context.scrollWidth <= context.clientWidth + 1 &&
        mechanism.scrollWidth <= mechanism.clientWidth + 1,
      ordered,
      transitionsBetweenStages,
      transitionGlyphsCorrect: transitionGlyphs.every((glyph) => glyph.includes(expectedTransitionGlyph)),
      transitionGlyphs,
      equalStageWidths: stageWidthSpread <= 1,
      stageWidthSpread,
      feedbackFollowsStages: feedbackRect.top >= Math.max(...stageRects.map((stage) => stage.bottom)),
      returnRailVisible: returnRail instanceof HTMLElement && visible(returnRail),
      returnRailAdjacentToSequence,
      returnRailPrecedesFeedback,
      returnRailConnectsSequence,
      returnRailDrawsPath,
      returnRailPointsBack: returnArrowVisible && returnArrowAnchoredAtIntentEnd,
      returnArrowMetrics,
      stageCollisions,
      stageRects,
      transitionRects,
      feedbackRect,
      returnRailRect,
      contextRect,
    };
  }, width <= 960);

  ok(geometry.ok, `${name}: causal loop geometry nodes present`, geometry.reason ?? '');
  ok(
    geometry.contextVisible && geometry.stagesVisible && geometry.transitionsVisible && geometry.feedbackVisible,
    `${name}: complete causal loop remains visible`,
    JSON.stringify(geometry),
  );
  ok(
    geometry.stagesInsideContext && geometry.feedbackInsideContext && geometry.mechanismInsideField,
    `${name}: stages, feedback, and mechanism stay inside customer-environment boundary`,
    JSON.stringify(geometry),
  );
  ok(geometry.loopHasNoInternalOverflow, `${name}: causal loop has no masked internal overflow`, JSON.stringify(geometry));
  ok(
    geometry.ordered,
    `${name}: causal stages follow ${width <= 960 ? 'top-to-bottom' : 'left-to-right'} order`,
    JSON.stringify(geometry.stageRects),
  );
  ok(
    geometry.transitionsBetweenStages && geometry.transitionGlyphsCorrect,
    `${name}: each ${width <= 960 ? 'down' : 'forward'} arrow sits between adjacent causal stages`,
    JSON.stringify({ rects: geometry.transitionRects, glyphs: geometry.transitionGlyphs }),
  );
  ok(geometry.equalStageWidths, `${name}: all five stage panels have equal width`, String(geometry.stageWidthSpread));
  ok(geometry.feedbackFollowsStages, `${name}: feedback statement follows the stage sequence`, JSON.stringify(geometry.feedbackRect));
  ok(
    geometry.returnRailVisible &&
      geometry.returnRailAdjacentToSequence &&
      geometry.returnRailPrecedesFeedback &&
      geometry.returnRailConnectsSequence &&
      geometry.returnRailDrawsPath &&
      geometry.returnRailPointsBack,
    `${name}: return path geometrically connects Adopt back toward Discover`,
    JSON.stringify({ rail: geometry.returnRailRect, arrow: geometry.returnArrowMetrics }),
  );
  ok(geometry.stageCollisions?.length === 0, `${name}: causal stages do not overlap`, JSON.stringify(geometry.stageCollisions));
}

async function assertHomepageResponsiveContracts(page, viewport) {
  const { name, width, height } = viewport;

  if (width <= 390) {
    const navGeometry = await page.evaluate(() => {
      const nav = document.querySelector('.primary-nav');
      if (!(nav instanceof HTMLElement)) return null;
      const navRect = nav.getBoundingClientRect();
      const links = [...nav.querySelectorAll('a')].map((link) => {
        const rect = link.getBoundingClientRect();
        return {
          href: link.getAttribute('href'),
          text: (link.textContent ?? '').trim(),
          clientWidth: link.clientWidth,
          scrollWidth: link.scrollWidth,
          textClipped: link.scrollWidth > link.clientWidth + 1,
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
    ok(Boolean(navGeometry), `${name}: primary nav present`);
    ok(navGeometry?.linkCount === 3, `${name}: primary nav has three links`, String(navGeometry?.linkCount));
    const mobileNavTargets = navGeometry?.links.map(({ text, href }) => ({ text, href }));
    ok(
      JSON.stringify(mobileNavTargets) === JSON.stringify([
        { text: 'Work', href: '/work/' },
        { text: 'Experience', href: '/experience/' },
        { text: 'Fit', href: '/fit/' },
      ]),
      `${name}: primary nav contains Work, Experience, and Fit`,
      JSON.stringify(mobileNavTargets),
    );
    ok(
      Boolean(navGeometry?.links.every((target) => target.width >= 44 && target.height >= 44)),
      `${name}: primary nav targets are at least 44×44`,
      JSON.stringify(navGeometry?.links),
    );
    ok(
      Boolean(navGeometry?.links.every((target) => !target.textClipped)),
      `${name}: primary nav labels remain fully visible`,
      JSON.stringify(navGeometry?.links),
    );
    ok(
      Boolean(navGeometry && !navGeometry.navOverflows),
      `${name}: primary nav does not overflow horizontally`,
      JSON.stringify({
        scrollWidth: navGeometry?.navScrollWidth,
        clientWidth: navGeometry?.navClientWidth,
      }),
    );
    ok(
      Boolean(navGeometry?.links.every((target) => target.insideNav && target.insideViewport)),
      `${name}: primary nav link rectangles stay inside nav/viewport`,
      JSON.stringify(navGeometry?.links),
    );

    const orangeContrast = await page.evaluate(() => {
      const sample = document.querySelector('.section-index, .proof-label, .loop-cue');
      if (!(sample instanceof HTMLElement)) return null;
      const color = getComputedStyle(sample).color;
      let surface = sample.parentElement;
      let bg = 'transparent';
      while (surface) {
        const candidate = getComputedStyle(surface).backgroundColor;
        if (candidate !== 'transparent' && candidate !== 'rgba(0, 0, 0, 0)') {
          bg = candidate;
          break;
        }
        surface = surface.parentElement;
      }
      const parse = (value) => {
        const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (!match) return null;
        return [Number(match[1]), Number(match[2]), Number(match[3])].map((channel) => {
          const srgb = channel / 255;
          return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
        });
      };
      const fg = parse(color);
      const paper = parse(bg);
      if (!fg || !paper) return { color, bg, ratio: 0 };
      const lum = (rgb) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
      const l1 = lum(fg);
      const l2 = lum(paper);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return { color, bg, ratio: (lighter + 0.05) / (darker + 0.05) };
    });
    ok(
      Boolean(orangeContrast && orangeContrast.ratio >= 4.5),
      `${name}: terracotta small-text contrast is at least 4.5:1`,
      JSON.stringify(orangeContrast),
    );

    const proofContextContrast = await page.evaluate(() => {
      const sample = document.querySelector('.proof-context');
      if (!(sample instanceof HTMLElement)) return null;
      const style = getComputedStyle(sample);
      const section = sample.closest('.proof-section');
      const background = section instanceof HTMLElement
        ? getComputedStyle(section).backgroundColor
        : getComputedStyle(document.body).backgroundColor;
      const parse = (value) => {
        const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
      };
      const foregroundRgb = parse(style.color);
      const backgroundRgb = parse(background);
      const opacity = Number(style.opacity);
      if (!foregroundRgb || !backgroundRgb || !Number.isFinite(opacity)) {
        return { color: style.color, background, opacity, ratio: 0 };
      }
      const composited = foregroundRgb.map((channel, index) =>
        channel * opacity + backgroundRgb[index] * (1 - opacity),
      );
      const linearize = (channel) => {
        const srgb = channel / 255;
        return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
      };
      const luminance = (rgb) =>
        0.2126 * linearize(rgb[0]) + 0.7152 * linearize(rgb[1]) + 0.0722 * linearize(rgb[2]);
      const foregroundLuminance = luminance(composited);
      const backgroundLuminance = luminance(backgroundRgb);
      const lighter = Math.max(foregroundLuminance, backgroundLuminance);
      const darker = Math.min(foregroundLuminance, backgroundLuminance);
      return {
        color: style.color,
        background,
        opacity,
        composited,
        ratio: (lighter + 0.05) / (darker + 0.05),
      };
    });
    ok(
      Boolean(proofContextContrast && proofContextContrast.ratio >= 4.5),
      `${name}: proof context text effective contrast is at least 4.5:1`,
      JSON.stringify(proofContextContrast),
    );

    const smallTextContrast = await page.evaluate(() => {
      const parse = (value) => {
        const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/i);
        return match
          ? [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? 1 : Number(match[4])]
          : null;
      };
      const linearize = (channel) => {
        const srgb = channel / 255;
        return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
      };
      const luminance = (rgb) =>
        0.2126 * linearize(rgb[0]) + 0.7152 * linearize(rgb[1]) + 0.0722 * linearize(rgb[2]);
      const measure = (foregroundSelector, backgroundSelector) => {
        const foreground = document.querySelector(foregroundSelector);
        const background = document.querySelector(backgroundSelector);
        if (!(foreground instanceof HTMLElement) || !(background instanceof HTMLElement)) return null;
        const color = getComputedStyle(foreground).color;
        const backgroundColor = getComputedStyle(background).backgroundColor;
        const foregroundRgb = parse(color);
        const backgroundRgb = parse(backgroundColor);
        const opacity = Number(getComputedStyle(foreground).opacity);
        if (!foregroundRgb || !backgroundRgb || !Number.isFinite(opacity) || backgroundRgb[3] < 0.999) {
          return { color, backgroundColor, opacity, ratio: 0 };
        }
        const foregroundAlpha = foregroundRgb[3] * opacity;
        const composited = foregroundRgb.slice(0, 3).map((channel, index) =>
          channel * foregroundAlpha + backgroundRgb[index] * (1 - foregroundAlpha),
        );
        const foregroundLuminance = luminance(composited);
        const backgroundLuminance = luminance(backgroundRgb);
        const lighter = Math.max(foregroundLuminance, backgroundLuminance);
        const darker = Math.min(foregroundLuminance, backgroundLuminance);
        return { color, backgroundColor, opacity, composited, ratio: (lighter + 0.05) / (darker + 0.05) };
      };
      return {
        ctaKicker: measure('.cta-kicker', '.cta-block'),
        profileAccent: measure('.cover-kicker', '.cover'),
      };
    });
    ok(
      Boolean(smallTextContrast.ctaKicker && smallTextContrast.ctaKicker.ratio >= 4.5),
      `${name}: CTA kicker small-text contrast is at least 4.5:1`,
      JSON.stringify(smallTextContrast.ctaKicker),
    );
    ok(
      Boolean(smallTextContrast.profileAccent && smallTextContrast.profileAccent.ratio >= 4.5),
      `${name}: profile accent small-text contrast is at least 4.5:1`,
      JSON.stringify(smallTextContrast.profileAccent),
    );
  }

  if (width === 768) {
    const tabletGeometry = await page.evaluate(() => {
      const copy = document.querySelector('.cover-copy');
      const specimen = document.querySelector('.cover-specimen');
      const cards = [...document.querySelectorAll('.building-card')];
      const portrait = document.querySelector('[data-portrait-source]');
      const aboutCopy = document.querySelector('.about-copy');
      if (!copy || !specimen || !portrait || !aboutCopy) {
        return { ok: false, reason: 'missing cover/about nodes' };
      }
      const cr = copy.getBoundingClientRect();
      const sr = specimen.getBoundingClientRect();
      const pr = portrait.getBoundingClientRect();
      const cardRects = cards.map((card) => card.getBoundingClientRect());
      const leftColumn = cardRects.filter((rect) => Math.abs(rect.left - cardRects[0].left) <= 2);
      const proofTwoColumns = cards.length === 3 && leftColumn.length === 2 &&
        Math.abs(cardRects[0].left - cardRects[1].left) > 80 &&
        Math.abs(cardRects[0].left - cardRects[2].left) <= 2;
      return {
        ok: true,
        specimenFollowsCopy: sr.top >= cr.bottom - 1,
        proofTwoColumns,
        leftColumnCount: leftColumn.length,
        portraitInsideSpecimen: pr.top >= sr.top - 1 && pr.bottom <= sr.bottom + 1,
      };
    });
    ok(tabletGeometry.ok, `${name}: tablet geometry nodes present`, tabletGeometry.reason ?? '');
    ok(tabletGeometry.specimenFollowsCopy, `${name}: tablet profile copy leads the portrait`, JSON.stringify(tabletGeometry));
    ok(tabletGeometry.proofTwoColumns, `${name}: tablet proof index is two columns`, String(tabletGeometry.leftColumnCount));
    ok(tabletGeometry.portraitInsideSpecimen, `${name}: tablet source portrait stays inside its specimen`, JSON.stringify(tabletGeometry));
  }

  await assertLoopCausalGeometry(page, name, width);

  if (width === 1280 && height === 720) {
    const identityHero = await page.evaluate(() => {
      const grid = document.querySelector('.cover-grid');
      const copy = document.querySelector('.cover-copy');
      const specimen = document.querySelector('.cover-specimen');
      const heading = document.querySelector('#thesis-heading');
      if (!(grid instanceof HTMLElement) || !(copy instanceof HTMLElement) ||
          !(specimen instanceof HTMLElement) || !(heading instanceof HTMLElement)) return null;
      const gridStyle = getComputedStyle(grid);
      const copyRect = copy.getBoundingClientRect();
      const specimenRect = specimen.getBoundingClientRect();
      const headingRect = heading.getBoundingClientRect();
      return {
        columnCount: gridStyle.gridTemplateColumns.split(' ').filter(Boolean).length,
        copyLeadsPortrait: copyRect.left < specimenRect.left,
        balancedSplit: copyRect.width >= innerWidth * 0.4 && specimenRect.width >= innerWidth * 0.3,
        monumentalName: Number.parseFloat(getComputedStyle(heading).fontSize) >= 120,
        headingWidth: headingRect.width,
      };
    });
    ok(Boolean(identityHero), `${name}: identity hero nodes present`);
    ok(
      Boolean(identityHero?.columnCount === 2 && identityHero.copyLeadsPortrait && identityHero.balancedSplit),
      `${name}: homepage hero is a balanced two-column identity and portrait split`,
      JSON.stringify(identityHero),
    );
    ok(
      Boolean(identityHero?.monumentalName),
      `${name}: Dave Bettner is monumental in the first viewport`,
      JSON.stringify(identityHero),
    );

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
    ok(Boolean(hireCtaVisible?.inViewport), `${name}: primary hiring CTA visible in first viewport`, JSON.stringify(hireCtaVisible));
  }

  if (width <= 390) {
    const phoneOrder = await page.evaluate(() => {
      const heading = document.querySelector('#thesis-heading');
      const portrait = document.querySelector('[data-portrait-source]');
      const specimen = document.querySelector('.cover-specimen');
      const support = document.querySelector('.cover-support');
      const actions = document.querySelector('.cover-actions');
      if (!heading || !portrait || !specimen || !support || !actions) return null;
      const pt = portrait.getBoundingClientRect().top;
      const ht = heading.getBoundingClientRect().top;
      const spt = support.getBoundingClientRect().top;
      const at = actions.getBoundingClientRect().top;
      const st = specimen.getBoundingClientRect().top;
      return {
        pt,
        ht,
        spt,
        at,
        st,
        headingBeforeSupport: ht < spt,
        supportBeforeActions: spt < at,
        actionsBeforeSpecimen: at < st,
        specimenContainsPortrait: pt >= st,
      };
    });
    ok(Boolean(phoneOrder), `${name}: phone cover order nodes present`);
    ok(
      phoneOrder?.headingBeforeSupport &&
        phoneOrder?.supportBeforeActions &&
        phoneOrder?.actionsBeforeSpecimen &&
        phoneOrder?.specimenContainsPortrait,
      `${name}: phone visual order is identity → support → actions → source portrait`,
      JSON.stringify(phoneOrder),
    );

    const phonePortraitBox = await page.evaluate(() => {
      const portrait = document.querySelector('[data-source-portrait]');
      const doc = document.documentElement;
      if (!(portrait instanceof HTMLElement)) return null;
      const rect = portrait.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        docScrollWidth: doc.scrollWidth,
        docClientWidth: doc.clientWidth,
        insideViewport: rect.width > 80 && rect.height > 80 && rect.left >= -1 && rect.right <= innerWidth + 1,
        noDocumentOverflow: doc.scrollWidth <= doc.clientWidth,
      };
    });
    ok(Boolean(phonePortraitBox), `${name}: phone source portrait node present`);
    ok(
      Boolean(phonePortraitBox?.insideViewport),
      `${name}: phone source portrait geometry stays inside the viewport with a useful box`,
      JSON.stringify(phonePortraitBox),
    );
    ok(
      Boolean(phonePortraitBox?.noDocumentOverflow),
      `${name}: phone document does not overflow horizontally around the portrait`,
      JSON.stringify(phonePortraitBox),
    );

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
    ok(Boolean(hireCtaVisible?.inViewport), `${name}: primary hiring CTA visible in first viewport`, JSON.stringify(hireCtaVisible));

    if (width === 320) {
      const primaryActionFit = await page.locator('.cover-actions-primary a.round.blue').evaluate((action) => {
        const style = getComputedStyle(action);
        return {
          whiteSpace: style.whiteSpace,
          clientWidth: action.clientWidth,
          scrollWidth: action.scrollWidth,
          fits: style.whiteSpace === 'nowrap' && action.scrollWidth <= action.clientWidth,
        };
      });
      ok(primaryActionFit.fits, `${name}: primary CTA stays on one line`, JSON.stringify(primaryActionFit));
    }

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

    const lastReachable = await page.evaluate(() => {
      const list = document.querySelector('.building-list');
      const cards = [...document.querySelectorAll('.building-card')];
      const last = cards.at(-1);
      if (!(list instanceof HTMLElement) || !last) return { ok: false, reason: 'missing list/card' };
      const link = last.querySelector('a');
      if (!(link instanceof HTMLElement)) return { ok: false, reason: 'missing link' };
      list.scrollLeft = list.scrollWidth;
      link.focus({ preventScroll: false });
      link.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const rect = link.getBoundingClientRect();
      const style = getComputedStyle(last);
      const evidence = last.querySelector('.building-evidence')?.textContent?.trim() ?? '';
      const limit = last.querySelector('.building-limit');
      return {
        ok: true,
        focused: document.activeElement === link,
        inView: rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < innerWidth,
        evidenceVisible: evidence.length > 0 && style.visibility !== 'hidden',
        limitAbsent: !limit,
        evidence,
      };
    });
    ok(lastReachable.ok, `${name}: final proof card present`, lastReachable.reason ?? '');
    ok(lastReachable.focused && lastReachable.inView, `${name}: final proof card link reachable after horizontal scroll`, JSON.stringify(lastReachable));
    ok(lastReachable.evidenceVisible && lastReachable.limitAbsent, `${name}: final proof card keeps evidence and omits Limit`, JSON.stringify(lastReachable));

    const allCardText = await page.locator('.building-card').evaluateAll((cards) =>
      cards.map((card) => ({
        evidence: card.querySelector('.building-evidence')?.textContent?.trim() ?? '',
        limit: card.querySelector('.building-limit')?.textContent?.trim() ?? '',
      })),
    );
    ok(
      allCardText.length === 3 && allCardText.every((card) => card.evidence.length > 0 && card.limit.length === 0),
      `${name}: all three featured proof cards keep evidence and omit Limit`,
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
  if (['/', '/experience/', '/work/', '/fit/'].includes(route)) {
    const editorialPalette = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const body = getComputedStyle(document.body);
      return {
        theme: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
        scheme: document.querySelector('meta[name="color-scheme"]')?.getAttribute('content'),
        paper: root.getPropertyValue('--paper').trim(),
        ink: root.getPropertyValue('--ink').trim(),
        blue: root.getPropertyValue('--blue').trim(),
        orange: root.getPropertyValue('--orange').trim(),
        bodyBackground: body.backgroundColor,
        bodyColor: body.color,
      };
    });
    ok(
      editorialPalette.theme === '#f3efe5' &&
        editorialPalette.scheme === 'light' &&
        editorialPalette.paper === '#f3efe5' &&
        editorialPalette.ink === '#151515' &&
        editorialPalette.blue === '#214fe5' &&
        editorialPalette.orange === '#cf4120' &&
        editorialPalette.bodyBackground === 'rgb(243, 239, 229)' &&
        editorialPalette.bodyColor === 'rgb(21, 21, 21)',
      `${label}: shared editorial paper palette is active`,
      JSON.stringify(editorialPalette),
    );
  }
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
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await auditPage(page, '/', viewport.name);
    ok(await page.locator('#work').count() === 1, `${viewport.name}: work section exists`);
    ok(await page.locator('#work .building-card').count() === 3, `${viewport.name}: three featured public engineering cards`);
    ok(await page.locator('a[href="https://github.com/dbett4"]').count() >= 1, `${viewport.name}: GitHub profile is linked`);
    const body = await page.locator('body').innerText();
    ok(body.includes('publication dates'), `${viewport.name}: publication provenance visible`);
    ok(!body.includes('459 Python'), `${viewport.name}: stale Wingman count absent`);
    const coverKicker = await page.locator('.cover-kicker').textContent();
    ok(
      coverKicker?.trim() === 'Profile · Enterprise agent deployment',
      `${viewport.name}: homepage kicker identifies a profile and enterprise-agent lane`,
      String(coverKicker),
    );
    ok(
      ((await page.locator('#thesis-heading').textContent()) ?? '').replace(/\s+/g, '') === 'DaveBettner',
      `${viewport.name}: H1 is Dave Bettner's identity`,
    );
    const coverSupport = ((await page.locator('.cover-support').textContent()) ?? '').trim();
    const provenance = ((await page.locator('.provenance-note').textContent()) ?? '').trim();
    ok(
      coverSupport === 'I deploy AI systems with customers—from discovery through adoption.' &&
        body.includes('Customer-facing AI implementation and forward-deployed delivery.'),
      `${viewport.name}: hero states customer-facing deployment and the adoption span`,
      coverSupport,
    );
    ok(
      /Labs and sanitized extracts/.test(provenance) &&
        /production-engineering tenure/.test(provenance) &&
        /Nous\/Hermes Enterprise affiliation/.test(provenance),
      `${viewport.name}: homepage provenance keeps lab and affiliation boundaries`,
      provenance,
    );
    ok(
      body.toLowerCase().includes('forward-deployed delivery and solutions engineering'),
      `${viewport.name}: direction names forward-deployed delivery and solutions engineering`,
    );
    ok(body.includes('proposals') || body.includes('SOW') || body.includes('RFP'), `${viewport.name}: engagement method includes shape/presales work`);
    ok(body.includes('Demonstrate the path against buyer and operator criteria'), `${viewport.name}: engagement method includes demonstrate work`);
    ok(
      body.toLowerCase().includes('finance, audit, and assurance'),
      `${viewport.name}: domain depth names finance, audit, and assurance`,
    );
    ok(
      body.includes('forward-deployed and solutions engineering roles'),
      `${viewport.name}: closing CTA names forward-deployed / solutions engineering roles`,
    );
    ok(body.includes('Hermes Deployment Lab'), `${viewport.name}: features Hermes Deployment Lab`);
    ok(body.includes('Regulated Reporting MCP'), `${viewport.name}: features Regulated Reporting MCP`);
    ok(body.includes('/work/') || (await page.locator('a[href="/work/"]').count()) >= 1, `${viewport.name}: links remaining work to /work/`);
    ok(!body.includes('Hermes Enterprise Evaluation Kit'), `${viewport.name}: field kit is not featured on homepage`);
    ok(!body.includes('Financial reporting QA with readback'), `${viewport.name}: Wingman is not featured on homepage`);
    ok(!body.includes('Fieldguide'), `${viewport.name}: Fieldguide string absent`);
    ok(!body.includes('Nous Research'), `${viewport.name}: Nous Research string absent`);
    ok(!body.includes('I am an auditor'), `${viewport.name}: auditor identity claim absent`);
    ok(!body.includes('Chief of Staff'), `${viewport.name}: Chief of Staff targeting absent`);
    ok(!body.includes('strategic operations'), `${viewport.name}: strategic operations targeting absent`);
    ok(!body.includes('Remote-friendly'), `${viewport.name}: Remote-friendly targeting absent`);
    const sectionOrder = await page.evaluate(() => {
      const ids = ['proof', 'direction', 'work'];
      return ids.map((id) => {
        const el = document.getElementById(id);
        return { id, top: el ? el.getBoundingClientRect().top + window.scrollY : Number.POSITIVE_INFINITY };
      });
    });
    ok(
      sectionOrder[0].top < sectionOrder[1].top && sectionOrder[1].top < sectionOrder[2].top,
      `${viewport.name}: delivery outcomes precede engagement method and public engineering`,
      JSON.stringify(sectionOrder),
    );
    const coverActions = await page.locator('.cover-actions a').evaluateAll((links) =>
      links.map((link) => ({
        text: (link.textContent ?? '').replace(/\s+/g, ' ').trim(),
        href: link.getAttribute('href'),
      })),
    );
    ok(
      coverActions.some((link) => link.href?.startsWith('mailto:') && link.text.includes('Start a conversation')),
      `${viewport.name}: primary CTA includes Start a conversation`,
      JSON.stringify(coverActions),
    );
    ok(
      coverActions.some((link) => link.href === '/dave-bettner-resume.pdf' && link.text.includes('Résumé')),
      `${viewport.name}: primary CTA includes Résumé`,
      JSON.stringify(coverActions),
    );
    ok(
      !coverActions.some((link) => link.href === '/experience/'),
      `${viewport.name}: cover CTA avoids duplicating Experience navigation`,
      JSON.stringify(coverActions),
    );
    ok(
      !coverActions.some((link) => link.href === '#work'),
      `${viewport.name}: cover CTA leaves proof discovery to the page flow`,
      JSON.stringify(coverActions),
    );
    ok(
      !coverActions.some((link) => link.href === '/fit/'),
      `${viewport.name}: cover actions do not duplicate the adjacent role-fit tool`,
      JSON.stringify(coverActions),
    );
    const buildingCardOrder = await page.locator('.building-card').evaluateAll((cards) =>
      cards.map((card) => card.id),
    );
    ok(
      buildingCardOrder.join(',') ===
        'hermes-deployment-lab,hermes-agent-pr-84621,regulated-reporting-mcp',
      `${viewport.name}: building-card order is deployment lab → Hermes PR → MCP`,
      buildingCardOrder.join(','),
    );
    await assertCausalDeliveryLoopContracts(page, viewport.name);
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
  ok(
    (await profilePage.locator('.cover-actions-primary a[href^="mailto:"]').count()) === 1 &&
      (await profilePage.locator('.cover-actions-primary a[download]').count()) === 1,
    'Homepage profile has one conversation action and one résumé action',
  );

  await profilePage.waitForFunction(() => {
    const source = document.querySelector('[data-source-portrait]');
    return source instanceof HTMLImageElement &&
      source.complete &&
      source.naturalWidth === 1100 &&
      document.documentElement.dataset.effectsReady === 'true';
  }, null, { timeout: 15_000 });

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
      primaryCanvasCount: document.querySelector('[data-primary-action]')?.querySelectorAll('canvas').length,
      effectsReady: document.documentElement.dataset.effectsReady,
    };
  });
  ok(
    Boolean(
      portraitContract?.src === '/images/dave-bettner-headshot-c13-navy-cutout.png' &&
        portraitContract.alt === 'Dave Bettner in a gray suit and navy tie' &&
        portraitContract.declaredWidth === '1100' &&
        portraitContract.declaredHeight === '1023' &&
        portraitContract.naturalWidth === 1100 &&
        portraitContract.naturalHeight === 1023 &&
        portraitContract.renderedWidth > 80 &&
        portraitContract.renderedHeight > 80 &&
        portraitContract.portraitCanvasCount === 0 &&
        portraitContract.primaryCanvasCount <= 1 &&
        portraitContract.effectsReady === 'true'
    ),
    'Homepage renders the approved source-preserving navy-tie cutout without a processing canvas',
    JSON.stringify(portraitContract),
  );

  const ambientShader = await profilePage.evaluate(() => ({
    hostCount: document.querySelectorAll('[data-shader-host]').length,
    canvasCount: document.querySelectorAll('[data-shader-host] canvas').length,
    labelCount: document.querySelectorAll('[data-shader-host] [data-shader-label]').length,
    mountCount: window.premiumControlState?.mountCount,
    shaderSpeed: window.premiumControlState?.shaderSpeed,
    motionReduced: window.premiumControlState?.motionReduced,
  }));
  ok(
    Boolean(
      ambientShader.hostCount === 2 &&
        ambientShader.canvasCount === 2 &&
        ambientShader.labelCount === 2 &&
        ambientShader.mountCount === 2 &&
        ambientShader.motionReduced === false &&
        ambientShader.shaderSpeed >= 0.5
    ),
    'Homepage primary actions keep a visibly moving ambient shader at rest',
    JSON.stringify(ambientShader),
  );

  await profilePage.locator('[data-primary-action]').hover();
  await profilePage.waitForFunction(
    () => window.premiumControlState?.activeCount === 1 && window.premiumControlState?.shaderSpeed > 1,
    null,
    { timeout: 3_000 },
  );
  const activeShader = await profilePage.evaluate(() => ({
    activeCount: window.premiumControlState?.activeCount,
    shaderSpeed: window.premiumControlState?.shaderSpeed,
  }));
  ok(
    activeShader.activeCount === 1 && activeShader.shaderSpeed > ambientShader.shaderSpeed,
    'Homepage primary action accelerates and brightens on hover or focus',
    JSON.stringify({ ambientShader, activeShader }),
  );
  await profilePage.locator('[data-source-portrait]').screenshot({ path: `${out}/source-portrait.png` });
  await profileContext.close();

  const profileReducedContext = await browser.newContext({
    viewport: { width: 960, height: 720 },
    reducedMotion: 'reduce',
  });
  const profileReducedPage = await profileReducedContext.newPage();
  await profileReducedPage.goto(base, { waitUntil: 'networkidle' });
  await profileReducedPage.waitForFunction(
    () => document.documentElement.dataset.effectsReady === 'true',
    null,
    { timeout: 15_000 },
  );
  const reducedPortrait = await profileReducedPage.evaluate(() => {
    const source = document.querySelector('[data-source-portrait]');
    return {
      sourceVisible: source instanceof HTMLImageElement &&
        source.naturalWidth === 1100 &&
        getComputedStyle(source).opacity !== '0',
      shaderSpeed: window.premiumControlState?.shaderSpeed,
      motionReduced: window.premiumControlState?.motionReduced,
    };
  });
  ok(
    Boolean(
      reducedPortrait?.sourceVisible &&
        reducedPortrait.motionReduced === true &&
        reducedPortrait.shaderSpeed === 0
    ),
    'Homepage reduced-motion mode keeps the source portrait visible and shader stationary',
    JSON.stringify(reducedPortrait),
  );
  await profileReducedContext.close();

  const shaderRolloutContext = await browser.newContext({ viewport: { width: 1100, height: 800 } });
  const shaderRolloutPage = await shaderRolloutContext.newPage();
  for (const route of ['/about/', '/fit/', '/experience/', projectRoutes[0]]) {
    await shaderRolloutPage.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
    await shaderRolloutPage.waitForFunction(
      () => document.documentElement.dataset.effectsReady === 'true',
      null,
      { timeout: 15_000 },
    );
    await shaderRolloutPage.locator('[data-shader-host]').first().scrollIntoViewIfNeeded();
    await shaderRolloutPage.waitForFunction(
      () => window.premiumControlState?.shaderSpeed >= 0.5,
      null,
      { timeout: 3_000 },
    );
    const rollout = await shaderRolloutPage.evaluate(() => ({
      hosts: document.querySelectorAll('[data-shader-host]').length,
      canvases: document.querySelectorAll('[data-shader-host] canvas').length,
      labels: document.querySelectorAll('[data-shader-host] [data-shader-label]').length,
      mounts: window.premiumControlState?.mountCount,
      speed: window.premiumControlState?.shaderSpeed,
    }));
    ok(
      rollout.hosts >= 1 &&
        rollout.canvases === rollout.hosts &&
        rollout.labels === rollout.hosts &&
        rollout.mounts === rollout.hosts &&
        rollout.speed >= 0.5,
      `${route}: selected primary actions use the shared ambient shader system`,
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
    Boolean(
      metadata.description?.includes('technical constraints') &&
        metadata.description?.includes('public AI-agent engineering proof'),
    ),
    'Homepage meta description targets customer constraints and public AI-agent proof',
    String(metadata.description),
  );
  ok(
    metadata.ogTitle === 'Dave Bettner | Forward-Deployed Delivery · AI-Agent Systems',
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
    ok(jsonLd.jobTitle === 'Senior Manager', 'JSON-LD keeps the current job title', String(jsonLd.jobTitle));
    ok(
      jsonLd.homeLocation?.name === 'Des Moines, Iowa',
      'JSON-LD keeps the current Des Moines location',
      String(jsonLd.homeLocation?.name),
    );
  } catch (error) {
    ok(false, 'JSON-LD parses', error.message);
  }

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
  const experienceText = await page.locator('main').innerText();
  for (const marker of [
    'since 2015',
    'Senior Manager · LSL, LLP',
    'Manager of Digital Services · Citrin Cooperman',
    'Solutions Architect · Workiva',
    'Solutions Consultant · Ambra Health',
    'SEC Reporting Consultant · Workiva',
    'Chicago, then Des Moines',
    'proposals',
    'SOW',
    'RFP',
    'on-site demos',
    'pitch presentations',
    'HIPAA',
    'EHR',
  ]) {
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
  const aboutLower = aboutText.toLowerCase();
  ok(
    aboutLower.includes('learn the environment') &&
      aboutLower.includes('ship the path') &&
      aboutLower.includes('stay through the hard parts'),
    'About leads from embedded delivery framing',
  );
  const aboutParagraphs = aboutText.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const openingDupes = aboutParagraphs.filter((line) =>
    line.startsWith('My background is in enterprise solution delivery'),
  );
  ok(openingDupes.length <= 1, 'About does not duplicate opening background paragraph', String(openingDupes.length));

  await page.goto(`${base}/fit/`, { waitUntil: 'networkidle' });
  const fitPayload = await page.locator('#fit-profile-data').textContent();
  ok(fitPayload?.includes('github.com/dbett4/hermes-enterprise-deployment-lab'), 'Fit payload includes deployment lab');
  ok(fitPayload?.includes('container restart/replay'), 'Fit payload cites public container restart/replay proof');
  ok(fitPayload?.includes('resume without double-writing'), 'Fit payload cites the Deployment Lab recovery contract');
  ok(!/parses Compose|container startup is not attested|runtime-unverified/i.test(fitPayload ?? ''), 'Fit payload omits obsolete parse-only lab language');
  ok(fitPayload?.includes('PR #84621'), 'Fit payload names open Hermes Agent PR as work sample');
  ok(fitPayload?.includes('TypeScript/Electron'), 'Fit payload identifies PR #84621 as TypeScript/Electron');
  ok(
    !fitPayload?.includes('Rust evidence is open Hermes Agent PR #84621'),
    'Fit payload does not falsely attribute Rust to PR #84621',
  );
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
  ok(!fitPayload?.includes('Chief of Staff'), 'Fit payload omits Chief of Staff targeting');
  ok(!fitPayload?.includes('strategic operations'), 'Fit payload omits strategic operations targeting');
  ok(!fitPayload?.includes('Remote-friendly'), 'Fit payload omits Remote-friendly targeting');
  ok(!/operator\s*\/\s*strategic/i.test(fitPayload ?? ''), 'Fit payload omits operator/strategic targeting');
  ok(
    /proposal|SOW|RFP|estimate|quote|demo|pitch/i.test(fitPayload ?? ''),
    'Fit payload includes supported presales evidence',
  );
  ok(
    /production software-engineering|customer-production agent|synthetic/i.test(fitPayload ?? ''),
    'Fit payload keeps honest production-engineering gaps / synthetic proof boundaries',
  );
  const fitMeta = await page.evaluate(() => ({
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
  }));
  ok(fitMeta.robots.includes('noindex'), 'Fit page remains noindex');
  ok(!fitMeta.description.includes('Chief of Staff'), 'Fit meta omits Chief of Staff');
  ok(!fitMeta.description.includes('strategic operations'), 'Fit meta omits strategic operations');
  ok(
    /forward-deployed|solutions engineering|AI implementation|deployment/i.test(fitMeta.description),
    'Fit meta targets forward-deployed / solutions / implementation roles',
    fitMeta.description,
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
