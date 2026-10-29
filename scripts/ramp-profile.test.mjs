import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read = p => fs.readFileSync(p, 'utf8');
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

test('public identity leads with enterprise delivery and AI workflows while retaining accurate history', () => {
  const robots = read('dist/robots.txt');
  assert.match(robots, /^Allow: \/$/m);
  assert.doesNotMatch(robots, /^Disallow:\s*\/\s*$/m);
  assert.match(robots, /Sitemap: https:\/\/davebettner\.com\/sitemap-index\.xml/);
  const home = read('dist/index.html');
  assert.match(home, /I build AI tools and agent workflows grounded in accounting and enterprise implementation\./);
  assert.match(home, /I own product direction and implementation for Homebase, Passal, and Leasekite, working through AI coding tools/i);
  assert.match(home, /looking for my next role building AI tools and agent workflows/i);
  assert.match(home, /Customer delivery background/);
  assert.match(home, /managed a five-person implementation team/i);
  assert.match(home, /6–12 concurrent implementations/);
  assert.ok(home.indexOf('id="selected-work"') < home.indexOf('id="building"'), 'selected products precede the building approach');
  assert.ok(home.indexOf('id="selected-work"') < home.indexOf('Customer delivery background'), 'selected products precede employment background');
  assert.match(home, /href="#selected-work"[^>]*>View selected work/);
  assert.match(home, /Based in Des Moines/);
  const experience = read('dist/experience/index.html');
  assert.match(experience, /href="\/experience\/connected-reporting\/"/);
  const mcp = read('dist/work/regulated-reporting-mcp/index.html');
  assert.match(mcp, /confirmation supplied by the caller/);
  assert.match(mcp, /other tools return receipts or readback according to their contracts/);
  assert.doesNotMatch(mcp, /default tools check approval before writes and read the result back/);
  const about = read('dist/about/index.html');
  assert.match(about, /I studied accounting\. My career has been in software implementation and customer delivery\./);
  assert.match(about, /Master of Accounting/);
  assert.match(about, /B\.S\. in Accounting/);
  assert.match(about, /enterprise implementation leadership, solutions architecture, and applied AI roles/i);
  assert.match(about, /I own product direction, interface design, and implementation for Homebase, Passal, and Leasekite/);
  assert.ok(about.indexOf('I carry product decisions through implementation') < about.indexOf('Accounting education'), 'product contribution leads the about page');
  for (const route of ['', 'experience/', 'work/', 'fit/', 'about/']) {
    const page = read('dist/' + route + 'index.html');
    assert.doesNotMatch(page, /\b(?:an|former|practicing|practising) accountant\b|Accounting background\.|Accounting, technology, and customer delivery/i);
    assert.match(page, /Dave Bettner leads enterprise software delivery and builds practical AI workflows/);
    assert.match(page, /"jobTitle":"AI tools and agent-workflow builder"/);
    assert.doesNotMatch(page, /"jobTitle":"(?:Forward Deployed Engineer|Accountant|CPA)"/i);
  }
  const projects = read('dist/work/index.html');
  assert.match(projects, /personal projects/i);
  assert.match(projects, /synthetic|mock/i);
  assert.doesNotMatch(home, /0-to-1|PROOF TRAVELS|Operating rules|FIRST 90 DAYS/);
  for (const route of ['', 'experience/', 'work/', 'fit/', 'about/']) {
    const page = read('dist/' + route + 'index.html');
    assert.doesNotMatch(page, /<meta[^>]+name="robots"[^>]+noindex/);
    assert.doesNotMatch(page, /class="(?:eyebrow|section-index|rule-number)"/);
  }
});

test('download is the source-bound AI-workflow resume and previous sources are retained', () => {
  // Verified against Dave's supplied PDF and the imported repository copy.
  // A private attachment path is neither available nor appropriate in release/CI.
  const suppliedDigest = 'e23cee694991e19d6a3bbc18f4bc18744e5c41a84b6dd4982e46bc06c0a7ec4c';
  assert.equal(hash('resume/dave-bettner-current.pdf'), suppliedDigest);
  const publicDigest = '53fe842ccc5d560af349d2c627397c84dffe91965fbd20eae16067ada68ff4a0';
  assert.equal(hash('resume/dave-bettner-public.pdf'), publicDigest);
  const designDigest = '53d16be1c62d918bc73dd1ed64fc2c70c9b8ddbfdf6e609905f26d37c6e17d19';
  assert.equal(hash('resume/dave-bettner-design-engineering.pdf'), designDigest);
  const manifest = JSON.parse(read('resume/ai-workflows-manifest.json'));
  for (const field of ['source', 'html', 'css', 'font', 'pdf']) {
    assert.equal(hash(manifest[field]), manifest[field + 'Sha256'], field);
  }
  assert.equal(hash('public/dave-bettner-resume.pdf'), manifest.pdfSha256);
  assert.equal(hash('dist/dave-bettner-resume.pdf'), manifest.pdfSha256);
});

test('homepage serves the recorded workstation loop with a matching poster', () => {
  const home = read('dist/index.html');
  assert.match(home, /class="scene-render"[^>]+src="\/images\/workstation-loop-poster\.webp"/);
  assert.match(home, /srcset="\/images\/workstation-loop-poster-760\.webp 760w, \/images\/workstation-loop-poster\.webp 1254w"/);
  assert.match(home, /class="brand masthead-brand"[^>]+href="\/"[^>]+aria-label="Dave Bettner home"[^>]*><img[^>]+src="\/images\/dave-bettner-headshot-20260808-square\.webp"/);
  assert.match(home, /href="\/dave-bettner-resume\.pdf" download/);
  assert.doesNotMatch(home, /Private design study|private concept|<canvas/i);
  assert.match(home, /data-src="\/video\/workstation-loop\.mp4"/);
  assert.match(home, /<video class="workstation-video"[^>]+\bloop\b/);
  const unit = home.slice(home.indexOf('data-workstation'), home.indexOf('</video>'));
  assert.doesNotMatch(unit, /<button|\bcontrols\b/, 'The hero loop has no playback controls');
  // The committed media are exactly what the rig's manifest recorded.
  const manifest = JSON.parse(read('animation/workstation-loop/render.json'));
  for (const asset of [manifest.video, ...manifest.posters]) {
    assert.equal(hash(asset.path), asset.sha256, asset.path);
    assert.equal(hash('dist/' + asset.path.replace(/^public\//, '')), asset.sha256, 'dist copy of ' + asset.path);
  }
  assert.equal(manifest.frames, 240);   // 10 s at the generated dog clip's 24 fps
  assert.ok(manifest.dogClip && manifest.dogClip.frames_used === 240, 'the generated dog clip spans the loop');
  assert.equal(manifest.period, 10);
});
