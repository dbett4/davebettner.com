import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
const read = p => fs.readFileSync(p, 'utf8');
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

test('public identity leads with customer-facing technical delivery, not accounting practice', () => {
  const home = read('dist/index.html');
  assert.match(home, /Technical implementation/);
  assert.match(home, /forward-deployed/i);
  assert.match(home, /Python/);
  const about = read('dist/about/index.html');
  assert.match(about, /I studied accounting\. My career has been in software implementation and customer delivery\./);
  assert.match(about, /Master of Accounting/);
  assert.match(about, /B\.S\. in Accounting/);
  for (const route of ['', 'experience/', 'work/', 'fit/', 'about/']) {
    const page = read('dist/' + route + 'index.html');
    assert.doesNotMatch(page, /\b(?:an|former|practicing|practising) accountant\b|Accounting background\.|Accounting, technology, and customer delivery/i);
    assert.match(page, /Customer-facing technical implementation/);
    assert.match(page, /"jobTitle":"Senior Manager"/);
    assert.doesNotMatch(page, /"jobTitle":"(?:Forward Deployed Engineer|Accountant|CPA)"/i);
  }
  const projects = read('dist/work/index.html');
  assert.match(projects, /personal projects/i);
  assert.match(projects, /synthetic|mock/i);
  assert.doesNotMatch(home, /0-to-1|PROOF TRAVELS|Operating rules|FIRST 90 DAYS/);
  for (const route of ['', 'experience/', 'work/', 'fit/', 'about/']) {
    const page = read('dist/' + route + 'index.html');
    assert.match(page, /noindex, nofollow/);
    assert.doesNotMatch(page, /class="(?:eyebrow|section-index|rule-number)"/);
  }
});

test('download is the supplied resume, not silently regenerated old copy', () => {
  // Verified against Dave's supplied PDF and the imported repository copy.
  // A private attachment path is neither available nor appropriate in release/CI.
  const suppliedDigest = 'e23cee694991e19d6a3bbc18f4bc18744e5c41a84b6dd4982e46bc06c0a7ec4c';
  assert.equal(hash('resume/dave-bettner-current.pdf'), suppliedDigest);
  assert.equal(hash('public/dave-bettner-resume.pdf'), suppliedDigest);
  assert.equal(hash('dist/dave-bettner-resume.pdf'), suppliedDigest);
});

test('homepage serves recorded workstation motion with a matching poster', async () => {
  const home = read('dist/index.html');
  assert.match(home, /class="scene-render"[^>]+src="\/images\/workstation-seated-poster\.webp"/);
  assert.match(home, /class="brand masthead-brand"[^>]+href="\/"[^>]+aria-label="Dave Bettner home"[^>]*><img[^>]+src="\/images\/dave-bettner-headshot-20260808-square\.webp"/);
  assert.match(home, /href="\/dave-bettner-resume\.pdf" download/);
  assert.doesNotMatch(home, /Private design study|private concept|<canvas/i);
  assert.match(home, /data-src="\/video\/workstation-seated\.mp4"/);
  assert.equal(hash('dist/video/workstation-seated.mp4'), hash('public/video/workstation-seated.mp4'));
  assert.equal(hash('dist/images/dave-workstation-transparent.webp'), hash('public/images/dave-workstation-transparent.webp'));
  const image = await sharp('public/images/dave-workstation-transparent.webp').metadata();
  assert.equal(image.format, 'webp');
  assert.equal(image.width, 1000);
  assert.equal(image.height, 1000);
  assert.equal(image.channels, 4);
});
