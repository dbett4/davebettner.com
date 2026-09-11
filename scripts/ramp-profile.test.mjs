import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
const read = p => fs.readFileSync(p, 'utf8');
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

test('public identity reflects current accounting consulting resume, not former FDE targeting', () => {
  const home = read('dist/index.html');
  assert.match(home, /Financial systems consulting/);
  assert.match(home, /accounting firms/);
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

test('homepage uses the compact workstation without private-study labels or fake motion', async () => {
  const home = read('dist/index.html');
  assert.match(home, /class="scene-render"[^>]+src="\/images\/dave-workstation-transparent\.webp"/);
  assert.match(home, /href="\/dave-bettner-resume\.pdf" download/);
  assert.doesNotMatch(home, /Private design study|private concept|<video|<canvas|src="[^"]*headshot[^\"]*"/i);
  assert.equal(hash('dist/images/dave-workstation-transparent.webp'), hash('public/images/dave-workstation-transparent.webp'));
  const image = await sharp('public/images/dave-workstation-transparent.webp').metadata();
  assert.equal(image.format, 'webp');
  assert.equal(image.width, 1000);
  assert.equal(image.height, 1000);
  assert.equal(image.channels, 4);
});
