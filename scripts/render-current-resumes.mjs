#!/usr/bin/env node
// Render current resume HTML -> PDF (canonical + Duvo variant) with system Chrome.
// Replicates the settings of generate-resume-pdf.mjs minus its stale content assertions.
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const jobs = [
  {
    html: '/srv/hermes/work/davebettner.com/resume/dave-bettner-resume.html',
    pdf: '/srv/hermes/work/davebettner.com/resume/dave-bettner-resume.pdf',
    publicPdf: '/srv/hermes/work/davebettner.com/public/dave-bettner-resume.pdf',
  },
  {
    html: '/srv/hermes/work/job-search/duvo-fde/dave-bettner-resume-duvo-fde.html',
    pdf: '/srv/hermes/work/job-search/duvo-fde/dave-bettner-resume-duvo-fde.pdf',
    publicPdf: null,
  },
];

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
    } catch {}
  }
  throw new Error('No Chrome/Chromium executable found');
}

const chrome = resolveChrome();
const browser = await chromium.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

try {
  for (const job of jobs) {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(job.html).href, { waitUntil: 'networkidle' });
    await page.pdf({
      path: job.pdf,
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.6in', right: '0.7in', bottom: '0.6in', left: '0.7in' },
      tagged: true,
      displayHeaderFooter: false,
    });
    await page.close();
    if (job.publicPdf) {
      execFileSync('cp', [job.pdf, job.publicPdf]);
    }
    const info = execFileSync('pdfinfo', [job.pdf], { encoding: 'utf8' });
    const pages = Number(info.match(/^Pages:\s+(\d+)/m)?.[1] || 0);
    const text = execFileSync('pdftotext', ['-layout', job.pdf, '-'], { encoding: 'utf8' });
    console.log(`OK ${job.pdf} pages=${pages} first=${text.trim().split('\n')[0]}`);
    if (pages !== 1) throw new Error(`Expected 1 page, got ${pages}: ${job.pdf}`);
    if (!text.includes('reused across city and county ACFR')) {
      throw new Error(`Missing new LSL automation bullet in ${job.pdf}`);
    }
    if (!text.includes('Willing to travel and embed on-site')) {
      throw new Error(`Missing travel line in ${job.pdf}`);
    }
    if (!text.includes('AI-agent control plane')) {
      throw new Error(`Missing agent-stack bullet in ${job.pdf}`);
    }
    if (!text.includes('SOX') || !text.includes('DICOM') || !text.includes('Run multiple municipal')) {
      throw new Error(`Missing page-fill markers in ${job.pdf}`);
    }
    if (text.includes('—')) {
      throw new Error(`Em dash present in ${job.pdf}`);
    }
    if (text.includes('OpenAI Codex') || text.includes('Anthropic Claude')) {
      throw new Error(`Vendor prefixes present in ${job.pdf}`);
    }
    if (!text.includes('startup')) {
      throw new Error(`Missing Ambra startup context in ${job.pdf}`);
    }
    if (text.includes('integration glue')) {
      throw new Error(`Summary fix did not land in ${job.pdf}`);
    }
  }
} finally {
  await browser.close();
}
console.log('RENDER_ALL_PASS');
