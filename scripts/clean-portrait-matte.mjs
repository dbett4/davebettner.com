import sharp from 'sharp';
import process from 'node:process';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, value = 'true'] = arg.replace(/^--/, '').split('=');
  return [key, value];
}));

const input = args.input;
const output = args.output;
if (!input || !output) {
  console.error('Usage: node scripts/clean-portrait-matte.mjs --input=source.webp --output=clean.webp [--low=32 --high=224 --close=1 --contract=1]');
  process.exit(2);
}

const low = Number(args.low ?? 32);
const high = Number(args.high ?? 224);
const closeRadius = Number(args.close ?? 1);
const contractRadius = Number(args.contract ?? 1);
const searchRadius = Number(args.search ?? 8);

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
if (channels !== 4) throw new Error(`Expected RGBA input; received ${channels} channels`);

const alpha = new Uint8Array(width * height);
for (let i = 0; i < alpha.length; i += 1) alpha[i] = data[i * 4 + 3];

const morphology = (source, radius, mode) => {
  if (radius <= 0) return source.slice();
  const result = new Uint8Array(source.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let value = mode === 'max' ? 0 : 255;
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if ((dx * dx) + (dy * dy) > radius * radius) continue;
          const sx = Math.max(0, Math.min(width - 1, x + dx));
          const sy = Math.max(0, Math.min(height - 1, y + dy));
          const candidate = source[sy * width + sx];
          value = mode === 'max' ? Math.max(value, candidate) : Math.min(value, candidate);
        }
      }
      result[y * width + x] = value;
    }
  }
  return result;
};

let matte = alpha;
if (closeRadius > 0) {
  matte = morphology(morphology(matte, closeRadius, 'max'), closeRadius, 'min');
}
if (contractRadius > 0) matte = morphology(matte, contractRadius, 'min');

for (let i = 0; i < matte.length; i += 1) {
  const value = matte[i];
  matte[i] = value <= low ? 0 : value >= high ? 255 : Math.round(((value - low) / (high - low)) * 255);
}

const outputData = Buffer.from(data);
let changedOpaqueRgb = 0;
let changedEdgeRgb = 0;
let changedAlpha = 0;

for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const pixel = y * width + x;
    const offset = pixel * 4;
    const originalAlpha = alpha[pixel];
    const nextAlpha = matte[pixel];
    if (originalAlpha !== nextAlpha) changedAlpha += 1;

    if (nextAlpha > 0 && originalAlpha < 250) {
      let bestPixel = -1;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let radius = 1; radius <= searchRadius && bestPixel < 0; radius += 1) {
        for (let dy = -radius; dy <= radius; dy += 1) {
          for (let dx = -radius; dx <= radius; dx += 1) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
            const sx = x + dx;
            const sy = y + dy;
            if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
            const candidate = sy * width + sx;
            if (alpha[candidate] < 250) continue;
            const distance = (dx * dx) + (dy * dy);
            if (distance < bestDistance) {
              bestDistance = distance;
              bestPixel = candidate;
            }
          }
        }
      }
      if (bestPixel >= 0) {
        const sourceOffset = bestPixel * 4;
        for (let channel = 0; channel < 3; channel += 1) {
          if (outputData[offset + channel] !== data[sourceOffset + channel]) changedEdgeRgb += 1;
          outputData[offset + channel] = data[sourceOffset + channel];
        }
      }
    }
    outputData[offset + 3] = nextAlpha;

    if (originalAlpha === 255) {
      for (let channel = 0; channel < 3; channel += 1) {
        if (outputData[offset + channel] !== data[offset + channel]) changedOpaqueRgb += 1;
      }
    }
  }
}

await sharp(outputData, { raw: { width, height, channels: 4 } })
  .webp({ lossless: true, alphaQuality: 100, effort: 6 })
  .toFile(output);

console.log(JSON.stringify({
  input,
  output,
  width,
  height,
  settings: { low, high, closeRadius, contractRadius, searchRadius },
  changedAlphaPixels: changedAlpha,
  changedEdgeRgbChannels: changedEdgeRgb,
  changedOpaqueRgbChannels: changedOpaqueRgb,
}, null, 2));
