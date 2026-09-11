import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import sharp from 'sharp';

const reviewRoot = resolve('review/light-soft-fade/fade');
const maskPath = resolve('public/images/dave-workstation-soft-fade-mask.png');
const artworkPath = resolve('public/images/dave-workstation-transparent.webp');
const widths = [1440, 768, 390, 320];
const dogRegion = { left: 610, top: 610, right: 790, bottom: 765 };
const centerRegion = { left: 400, top: 320, right: 690, bottom: 610 };
const peripheralRegions = [
  { left: 0, top: 500, right: 170, bottom: 830 },
  { left: 830, top: 620, right: 1000, bottom: 900 },
  { left: 300, top: 875, right: 760, bottom: 1000 },
];

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const minimum = values => values.reduce((a, b) => Math.min(a, b), Infinity);
const maximum = values => values.reduce((a, b) => Math.max(a, b), -Infinity);
const readRgba = async (path) => {
  const image = sharp(path);
  const metadata = await image.metadata();
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels, metadata };
};
const pixel = (image, x, y) => {
  const offset = (y * image.width + x) * image.channels;
  return image.data.subarray(offset, offset + 4);
};
const cropBounds = (region, record, screenshot) => {
  const scaleX = record.image.width / 1000;
  const scaleY = record.image.height / 1000;
  return {
    left: clamp(Math.floor(record.image.x - record.scene.x + region.left * scaleX), 0, screenshot.width),
    top: clamp(Math.floor(record.image.y - record.scene.y + region.top * scaleY), 0, screenshot.height),
    right: clamp(Math.ceil(record.image.x - record.scene.x + region.right * scaleX), 0, screenshot.width),
    bottom: clamp(Math.ceil(record.image.y - record.scene.y + region.bottom * scaleY), 0, screenshot.height),
  };
};
const compare = (masked, unmasked, bounds) => {
  let compared = 0;
  let changed = 0;
  let maxDelta = 0;
  let totalDelta = 0;
  for (let y = bounds.top; y < bounds.bottom; y += 1) {
    for (let x = bounds.left; x < bounds.right; x += 1) {
      const a = pixel(masked, x, y);
      const b = pixel(unmasked, x, y);
      const delta = Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
      compared += 1;
      totalDelta += delta;
      maxDelta = Math.max(maxDelta, delta);
      if (delta > 3) changed += 1;
    }
  }
  return { compared, changed, maxDelta, meanDelta: compared ? totalDelta / compared : 0 };
};

const mask = await readRgba(maskPath);
const artwork = await readRgba(artworkPath);
if (mask.width !== 1000 || mask.height !== 1000) throw new Error('soft-fade mask must remain 1000x1000');
if (artwork.width !== 1000 || artwork.height !== 1000 || artwork.metadata.hasAlpha !== true) {
  throw new Error('original workstation artwork must remain intact and transparent');
}

const dogMaskPixels = [];
for (let y = dogRegion.top; y < dogRegion.bottom; y += 1) {
  for (let x = dogRegion.left; x < dogRegion.right; x += 1) {
    if (pixel(artwork, x, y)[3] > 32) dogMaskPixels.push(pixel(mask, x, y)[3]);
  }
}
const centerPixels = [];
for (let y = centerRegion.top; y < centerRegion.bottom; y += 1) {
  for (let x = centerRegion.left; x < centerRegion.right; x += 1) centerPixels.push(pixel(mask, x, y)[3]);
}
const peripheralPixels = peripheralRegions.flatMap((region) => {
  const values = [];
  for (let y = region.top; y < region.bottom; y += 1) {
    for (let x = region.left; x < region.right; x += 1) {
      if (pixel(artwork, x, y)[3] > 32) values.push(pixel(mask, x, y)[3]);
    }
  }
  return values;
});

const result = {
  source: {
    artworkSha256: createHash('sha256').update(await readFile(artworkPath)).digest('hex'),
    maskSha256: createHash('sha256').update(await readFile(maskPath)).digest('hex'),
    dimensions: [artwork.width, artwork.height],
  },
  sourceMask: {
    dogRegion,
    dogOpaque: dogMaskPixels.length > 0 && minimum(dogMaskPixels) === 255,
    dogOpaqueMinimum: dogMaskPixels.length ? minimum(dogMaskPixels) : null,
    centerUnattenuated: centerPixels.length > 0 && minimum(centerPixels) === 255,
    centerMinimum: centerPixels.length ? minimum(centerPixels) : null,
    peripheralFade: peripheralPixels.length > 0 && minimum(peripheralPixels) < 245 && maximum(peripheralPixels) === 255,
    peripheralRange: peripheralPixels.length ? [minimum(peripheralPixels), maximum(peripheralPixels)] : null,
  },
  rendered: [],
};

try {
  const manifest = JSON.parse(await readFile(resolve(`${reviewRoot}/after/manifest.json`), 'utf8'));
  if (!/^https?:\/\//.test(manifest.base || '') || manifest.errors.length) throw new Error('real HTTP capture without page errors is required');
  for (const width of widths) {
    const record = manifest.records.find((candidate) => candidate.width === width);
    if (!record?.image || !record.scene) throw new Error(`missing geometry record for ${width}`);
    if (!record.imageLoaded || record.overflow) throw new Error(`image missing or layout overflow at ${width}`);
    if (record.sceneMask !== 'none' || !record.mediaMask.includes('dave-workstation-soft-fade-mask.png')) throw new Error(`wrong mask surface at ${width}`);
    const scale = record.image.width / 1000;
    const dogVisible = record.image.x + 610 * scale >= record.scene.x && record.image.x + 780 * scale <= record.scene.x + record.scene.width
      && record.image.y + 618 * scale >= record.scene.y && record.image.y + 758 * scale <= record.scene.y + record.scene.height;
    if (!dogVisible) throw new Error(`dog silhouette cropped at ${width}`);
    const scenePath = resolve(`${reviewRoot}/after/scene-${width}x${record.height}.png`);
    const unmaskedPath = resolve(`${reviewRoot}/after/scene-unmasked-${width}x${record.height}.png`);
    const masked = await readRgba(scenePath);
    const unmasked = await readRgba(unmaskedPath);
    const dog = compare(masked, unmasked, cropBounds(dogRegion, record, masked));
    const center = compare(masked, unmasked, cropBounds(centerRegion, record, masked));
    const peripheral = peripheralRegions.map((region) => compare(masked, unmasked, cropBounds(region, record, masked)));
    result.rendered.push({ width, dogVisible, dog, center, peripheral });
  }
} catch (error) {
  result.renderedError = String(error);
}

const sourcePass = result.sourceMask.dogOpaque && result.sourceMask.centerUnattenuated && result.sourceMask.peripheralFade;
const renderedPass = result.rendered.length === widths.length
  && result.rendered.every(({ dogVisible, dog, center, peripheral }) => dogVisible && dog.compared > 0 && center.compared > 0 && dog.maxDelta <= 3 && center.maxDelta <= 3 && peripheral.some((sample) => sample.changed > 0));
result.pass = sourcePass && renderedPass;
await writeFile(resolve(`${reviewRoot}/verification.json`), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exitCode = 1;
