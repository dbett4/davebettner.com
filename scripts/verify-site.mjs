import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:net';

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
await mkdir(out, { recursive: true });

const checks = [];
const errors = [];
const ok = (condition, label, detail = '') => {
  checks.push({ label, pass: Boolean(condition), detail });
  if (!condition) errors.push(`${label}${detail ? `: ${detail}` : ''}`);
};

let preview;
if (!configuredBase) {
  preview = spawn('python3', ['-m', 'http.server', String(localPort), '--bind', '127.0.0.1', '--directory', 'dist'], {
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
    proof: '73 credential-free tests',
  },
  {
    slug: 'hermes-field-kit',
    title: 'Hermes Field Kit',
    repo: 'https://github.com/dbett4/hermes-enterprise-field-kit',
    proof: '318-row',
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
    await page.screenshot({ path: `${out}/${viewport.name}.png`, fullPage: true });
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  for (const route of coreRoutes) {
    await auditPage(page, route, route);
  }

  await page.goto(base, { waitUntil: 'networkidle' });
  const metadata = await page.evaluate(() => ({
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
    jsonLd: document.querySelector('script[type="application/ld+json"]')?.textContent,
  }));
  ok(metadata.canonical === 'https://davebettner.com/', 'Homepage canonical URL', String(metadata.canonical));
  ok(metadata.description?.includes('AI implementation'), 'Homepage meta description targets AI implementation', String(metadata.description));
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
    ok((await page.locator('body').innerText()).includes(project.proof), `${route}: exact proof marker`, project.proof);
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

  await page.goto(`${base}/fit/`, { waitUntil: 'networkidle' });
  const fitPayload = await page.locator('#fit-profile-data').textContent();
  ok(fitPayload?.includes('github.com/dbett4/regulated-reporting-mcp'), 'Fit payload includes repository proof');
  ok(fitPayload?.includes('462 Python'), 'Fit payload includes corrected Wingman count');
  ok(!fitPayload?.includes('CPA-firm practice lead'), 'Fit payload omits unsupported practice-lead claim');

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
