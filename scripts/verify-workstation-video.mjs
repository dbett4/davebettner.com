import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

// Encoding and browser transport evidence only. The player lifecycle cases live
// in workstation-playback.test.mjs. Neither suite approves the animation itself.
const base = process.env.SITE_URL;
assert.ok(base, 'SITE_URL must name the served candidate build');
const out = resolve(process.env.WORKSTATION_VIDEO_OUTPUT || 'review/animation-release/video-technical', new Date().toISOString().replaceAll(':', '-'));
await mkdir(out, { recursive: true });
const report = {
  kind: 'technical-encoding-and-playback', base,
  noClaim: 'Does not establish dog likeness, grounded movement, circle/curl choreography, human gestures, scenery fidelity, visual seam quality, or release approval.',
  checks: [], errors: [], viewports: [],
};
const check = (condition, label) => { assert.ok(condition, label); report.checks.push(label); };
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const rate = value => { const [n, d = 1] = value.split('/').map(Number); return n / d; };
let browser;

function mp4Boxes(bytes) {
  const boxes = [];
  for (let offset = 0; offset < bytes.length;) {
    assert.ok(offset + 8 <= bytes.length, 'Complete MP4 box header');
    let size = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    let headerSize = 8;
    if (size === 1) {
      assert.ok(offset + 16 <= bytes.length, 'Complete extended MP4 box header');
      size = Number(bytes.readBigUInt64BE(offset + 8));
      headerSize = 16;
    } else if (size === 0) size = bytes.length - offset;
    assert.ok(Number.isSafeInteger(size) && size >= headerSize && offset + size <= bytes.length, 'Complete bounded MP4 box');
    boxes.push(type);
    offset += size;
  }
  return boxes;
}

async function observeCycles(page, duration) {
  // Start observing wherever playback is already running. Four natural wraps
  // include three complete cycles after the first synchronization wrap; no seek,
  // playback-rate change, media mock, or shortened timeline is used.
  return page.evaluate(({ duration }) => new Promise((resolveTrace, rejectTrace) => {
    const video = document.querySelector('[data-workstation] video');
    const quality = () => {
      const q = video.getVideoPlaybackQuality();
      return { totalVideoFrames: q.totalVideoFrames, droppedVideoFrames: q.droppedVideoFrames, corruptedVideoFrames: q.corruptedVideoFrames };
    };
    const trace = { wraps: [], sampledFrames: 0, maxFrameGapMs: 0, pauses: 0, endedEvents: 0, qualityBefore: quality() };
    let previousTime, previousWall, request;
    const onPause = () => { trace.pauses++; };
    const onEnded = () => { trace.endedEvents++; };
    const finish = error => {
      clearTimeout(timer);
      video.cancelVideoFrameCallback(request);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      if (error) rejectTrace(error);
      else resolveTrace({ ...trace, qualityAfter: quality(), paused: video.paused, rate: video.playbackRate, currentTime: video.currentTime });
    };
    const timer = setTimeout(() => finish(new Error(`Three complete natural cycles did not finish within ${duration * 4 + 10}s`)), (duration * 4 + 10) * 1000);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    const frame = (now, metadata) => {
      trace.sampledFrames++;
      if (previousWall !== undefined) trace.maxFrameGapMs = Math.max(trace.maxFrameGapMs, now - previousWall);
      if (previousTime !== undefined && metadata.mediaTime < previousTime) {
        if (previousTime < duration * .7 || metadata.mediaTime > duration * .3) {
          finish(new Error('Media time moved backward away from the natural loop boundary'));
          return;
        }
        trace.wraps.push({ from: previousTime, to: metadata.mediaTime, wallTimeMs: now });
        if (trace.wraps.length === 4) { finish(); return; }
      }
      previousTime = metadata.mediaTime;
      previousWall = now;
      request = video.requestVideoFrameCallback(frame);
    };
    request = video.requestVideoFrameCallback(frame);
  }), { duration });
}

try {
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
  report.browser = browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light', reducedMotion: 'no-preference' });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(String(error)));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('[data-workstation]').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const v = document.querySelector('[data-workstation] video');
    return !v.paused && v.currentTime > .2 && getComputedStyle(v).visibility === 'visible';
  });
  const metadata = await page.locator('[data-workstation] video').evaluate(v => ({
    width: v.videoWidth, height: v.videoHeight, duration: v.duration,
    muted: v.muted, inline: v.playsInline, loop: v.loop, source: v.currentSrc,
    rate: v.playbackRate, fit: getComputedStyle(v).objectFit, opacity: getComputedStyle(v).opacity,
  }));
  report.browserMetadata = metadata;
  check(metadata.width === 1000 && metadata.height === 1000, 'Browser decodes the complete 1000-square composition');
  check(Number.isFinite(metadata.duration) && metadata.duration > 0, 'Browser reports the actual finite media duration without imposing the retired five-second timeline');
  check(metadata.muted && metadata.inline && metadata.loop && metadata.rate === 1 && metadata.opacity === '1' && metadata.fit === 'contain', 'Muted inline looping video plays at native speed without cropping or opacity changes');
  check(await page.locator('[data-workstation] [data-motion-control]').count() === 1, 'Controlled looping has one explicit playback control');
  check(new URL(metadata.source).pathname === '/video/workstation-seated.mp4', 'The current component requests the intended workstation asset');

  const response = await context.request.get(metadata.source);
  check(response.ok(), 'The exact browser media URL serves successfully');
  const bytes = await response.body();
  const served = resolve(out, 'served.mp4');
  await writeFile(served, bytes);
  report.mediaSha256 = sha256(bytes);
  check(report.mediaSha256 === sha256(await readFile('public/video/workstation-seated.mp4')), 'Served video bytes match the integration asset');
  const probe = JSON.parse(execFileSync('/usr/bin/ffprobe', ['-v', 'error', '-count_frames', '-show_entries', 'stream=codec_type,codec_name,pix_fmt,width,height,avg_frame_rate,r_frame_rate,duration,nb_read_frames:format=duration,format_name', '-of', 'json', served], { encoding: 'utf8' }));
  report.encoding = probe;
  const videos = probe.streams.filter(stream => stream.codec_type === 'video');
  check(videos.length === 1 && probe.streams.length === 1, 'Media contains one video stream and no audio or additional streams');
  const stream = videos[0];
  check(stream.codec_name === 'h264' && stream.pix_fmt === 'yuv420p', 'Media uses browser-compatible H.264 and yuv420p');
  check(stream.width === metadata.width && stream.height === metadata.height && Math.abs(Number(probe.format.duration) - metadata.duration) < .05, 'Encoded dimensions and duration agree with native browser decoding');
  const fps = rate(stream.avg_frame_rate), frames = Number(stream.nb_read_frames);
  check(Number.isFinite(fps) && fps > 0 && Number.isInteger(frames) && frames > 1, 'FFprobe counts an actual decoded multi-frame sequence and frame rate');
  check(Math.abs(frames / fps - Number(probe.format.duration)) <= 1 / fps + .02, 'Decoded frame count covers the reported duration');
  execFileSync('/usr/bin/ffmpeg', ['-v', 'error', '-xerror', '-i', served, '-map', '0:v:0', '-f', 'null', '-'], { stdio: 'pipe' });
  check(true, 'The entire served MP4 decodes without errors');
  const boxes = mp4Boxes(bytes);
  check(boxes.includes('moov') && boxes.includes('mdat') && boxes.indexOf('moov') < boxes.indexOf('mdat'), 'MP4 metadata precedes media data for fast-start playback');
  const posterResponse = await context.request.get(new URL('/images/workstation-seated-poster.webp', base).href);
  check(posterResponse.ok(), 'The poster URL serves successfully');
  const poster = await posterResponse.body();
  report.posterSha256 = sha256(poster);
  check(report.posterSha256 === sha256(await readFile('public/images/workstation-seated-poster.webp')), 'Served poster bytes match the integration asset');
  const posterMetadata = await sharp(poster).metadata();
  check(posterMetadata.width === metadata.width && posterMetadata.height === metadata.height, 'Poster dimensions match the video composition');

  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.locator('[data-workstation]').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => !document.querySelector('[data-workstation] video').paused);
    const geometry = await page.evaluate(() => {
      const v = document.querySelector('[data-workstation] video'), image = document.querySelector('[data-workstation] img');
      const a = v.getBoundingClientRect(), b = image.getBoundingClientRect();
      return { overflow: document.documentElement.scrollWidth > innerWidth, posterLoaded: image.complete && image.naturalWidth === 1000, aligned: ['x', 'y', 'width', 'height'].every(key => Math.abs(a[key] - b[key]) < 1), fit: getComputedStyle(v).objectFit };
    });
    check(!geometry.overflow && geometry.posterLoaded && geometry.aligned && geometry.fit === 'contain', `${width}px: video and loaded poster share uncropped geometry without page overflow`);
    const viewport = { width, geometry };
    if (width === 1440 || width === 390) {
      viewport.cycles = await observeCycles(page, metadata.duration);
      check(viewport.cycles.wraps.length === 4 && viewport.cycles.sampledFrames > 0 && !viewport.cycles.paused && viewport.cycles.rate === 1 && viewport.cycles.pauses === 0 && viewport.cycles.endedEvents === 0, `${width}px: decoded video completes three full natural cycles at native rate with no pause/end events`);
    }
    report.viewports.push(viewport);
  }
  check(report.errors.length === 0, 'No browser script errors');
  await context.close();
  report.passed = true;
} catch (error) {
  report.passed = false;
  report.errors.push(String(error));
  process.exitCode = 1;
} finally {
  await browser?.close();
  await writeFile(resolve(out, 'checks.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, errors: report.errors, mediaSha256: report.mediaSha256, kind: report.kind, noClaim: report.noClaim, output: out }));
}
