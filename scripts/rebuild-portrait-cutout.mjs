import sharp from 'sharp';
import process from 'node:process';
import {
  BACKGROUND_KEY_MIN,
  BACKGROUND_KEY_MAX,
  FOREGROUND_KEY_MAX,
  CUTOUT_CROP,
} from './portrait-key.mjs';

/**
 * Rebuilds the hero portrait cutout from the untouched studio source.
 *
 * The studio backdrop is a smooth blue-grey gradient, so background pixels sit in a
 * narrow band of normalised blueness ((B - R) / luma) that no part of the subject
 * occupies: suit 0.02-0.10, shirt ~0.00, skin and hair negative, backdrop 0.34-0.40.
 * The navy tie is bluer still (~0.8), which is why background is never keyed by colour
 * alone: a pixel counts as background only when it is also reachable from the frame
 * border through non-subject pixels. That reachability rule is what clears the wedges
 * between each sleeve and the torso — they open at the bottom of the frame — while
 * leaving every enclosed subject region untouched.
 *
 * Rim coverage is solved in chromaticity rather than raw RGB. The backdrop inside the
 * sleeve-to-torso crevice is deeply shadowed, so its absolute colour is nothing like the
 * open backdrop, but hue survives shading: normalising each sample by its own luma lets
 * one projection cover the open edge and the crevice alike. The luma weights then convert
 * that chromaticity share back into true coverage, and the surviving rim colour is un-mixed
 * against the local backdrop so hair keeps its own colour instead of a blue-grey halo.
 */

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, value = 'true'] = arg.replace(/^--/, '').split('=');
  return [key, value];
}));

const input = args.input;
const output = args.output;
if (!input || !output) {
  console.error('Usage: node scripts/rebuild-portrait-cutout.mjs --input=source.png --output=cutout.png [--left=220 --width=1100 --height=1023]');
  process.exit(2);
}

const cropLeft = Number(args.left ?? CUTOUT_CROP.left);
const cropTop = Number(args.top ?? CUTOUT_CROP.top);
const cropWidth = Number(args.width ?? CUTOUT_CROP.width);
const cropHeight = Number(args.height ?? CUTOUT_CROP.height);

const SAMPLE_RADIUS = Number(args.sampleRadius ?? 14);
// Backdrop samples for the luma correction may sit further away than a colour sample,
// because a crevice can run a long way before it opens into the open backdrop.
const BACKDROP_RADIUS = Number(args.backdropRadius ?? 28);
// Below this chromaticity separation the backdrop and the subject are the same hue and
// the projection is numerically unstable, so the pixel keeps full coverage.
const MIN_CHROMA_SEPARATION = Number(args.minSeparation ?? 0.08);

const source = sharp(input).extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight });
const { data, info } = await source.removeAlpha().raw().toBuffer({ resolveWithObject: true });
const width = info.width;
const height = info.height;
if (info.channels !== 3) throw new Error(`Expected RGB source; received ${info.channels} channels`);

const pixelCount = width * height;
const at = (x, y) => (y * width + x);

// Blueness is computed on a 3x3 mean so fabric grain and sensor noise do not flip a
// pixel between classes; the alpha maths below always uses the untouched sample.
const blueness = new Float32Array(pixelCount);
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    let red = 0;
    let green = 0;
    let blue = 0;
    let samples = 0;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const sx = x + dx;
        const sy = y + dy;
        if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
        const offset = at(sx, sy) * 3;
        red += data[offset];
        green += data[offset + 1];
        blue += data[offset + 2];
        samples += 1;
      }
    }
    const luma = Math.max((red + green + blue) / (3 * samples), 1);
    blueness[at(x, y)] = (blue - red) / (samples * luma);
  }
}

const isBackgroundColour = (pixel) => blueness[pixel] >= BACKGROUND_KEY_MIN && blueness[pixel] <= BACKGROUND_KEY_MAX;
const isForegroundColour = (pixel) => blueness[pixel] <= FOREGROUND_KEY_MAX;

// Flood the frame border through everything that is not confidently subject. The fill
// dies on suit, skin and hair, so it can only ever reach real backdrop plus the mixed
// rim in front of it.
const reachable = new Uint8Array(pixelCount);
const queue = new Int32Array(pixelCount + 1);
let queueHead = 0;
let queueTail = 0;
const seed = (pixel) => {
  if (reachable[pixel] || isForegroundColour(pixel)) return;
  reachable[pixel] = 1;
  queue[queueTail += 1] = pixel;
};
for (let x = 0; x < width; x += 1) {
  seed(at(x, 0));
  seed(at(x, height - 1));
}
for (let y = 0; y < height; y += 1) {
  seed(at(0, y));
  seed(at(width - 1, y));
}
while (queueHead < queueTail) {
  const pixel = queue[queueHead += 1];
  const x = pixel % width;
  const y = (pixel - x) / width;
  if (x > 0) seed(pixel - 1);
  if (x < width - 1) seed(pixel + 1);
  if (y > 0) seed(pixel - width);
  if (y < height - 1) seed(pixel + width);
}

const background = new Uint8Array(pixelCount);
const unknown = new Uint8Array(pixelCount);
let backgroundCount = 0;
let unknownCount = 0;
for (let pixel = 0; pixel < pixelCount; pixel += 1) {
  if (!reachable[pixel]) continue;
  if (isBackgroundColour(pixel)) {
    background[pixel] = 1;
    backgroundCount += 1;
  } else {
    unknown[pixel] = 1;
    unknownCount += 1;
  }
}

// Backdrop hue, measured from this frame rather than assumed, for the crevices that never
// reach an open backdrop sample.
const BACKDROP_CHROMATICITY = (() => {
  const totals = [0, 0, 0];
  let samples = 0;
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    if (!background[pixel]) continue;
    const offset = pixel * 3;
    const scale = Math.max((data[offset] + data[offset + 1] + data[offset + 2]) / 3, 1);
    totals[0] += data[offset] / scale;
    totals[1] += data[offset + 1] / scale;
    totals[2] += data[offset + 2] / scale;
    samples += 1;
  }
  if (!samples) throw new Error('No backdrop pixels found; check the blueness bands');
  return totals.map((total) => total / samples);
})();

// Confident subject pixels: not reachable from the border, and not adjacent to the rim.
const confidentForeground = new Uint8Array(pixelCount);
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const pixel = at(x, y);
    if (reachable[pixel]) continue;
    let touchesRim = false;
    for (let dy = -1; dy <= 1 && !touchesRim; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const sx = Math.max(0, Math.min(width - 1, x + dx));
        const sy = Math.max(0, Math.min(height - 1, y + dy));
        if (reachable[at(sx, sy)]) {
          touchesRim = true;
          break;
        }
      }
    }
    if (!touchesRim) confidentForeground[pixel] = 1;
  }
}

const nearest = (x, y, mask, limit) => {
  for (let radius = 1; radius <= limit; radius += 1) {
    let bestPixel = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        const sx = x + dx;
        const sy = y + dy;
        if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
        const candidate = at(sx, sy);
        if (!mask[candidate]) continue;
        const distance = (dx * dx) + (dy * dy);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestPixel = candidate;
        }
      }
    }
    if (bestPixel >= 0) return bestPixel;
  }
  return -1;
};

const alpha = new Float32Array(pixelCount);
for (let pixel = 0; pixel < pixelCount; pixel += 1) {
  alpha[pixel] = reachable[pixel] ? 0 : 1;
}

const luma = (pixel) => {
  const offset = pixel * 3;
  return Math.max((data[offset] + data[offset + 1] + data[offset + 2]) / 3, 1);
};
const chromaticity = (pixel) => {
  const offset = pixel * 3;
  const scale = luma(pixel);
  return [data[offset] / scale, data[offset + 1] / scale, data[offset + 2] / scale];
};

let projectedPixels = 0;
let unstablePixels = 0;
let lumaCorrectedPixels = 0;
// The backdrop colour behind each rim pixel, kept so the un-mix below subtracts exactly
// the backdrop the coverage was solved against.
const backdropColour = new Float32Array(pixelCount * 3);
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const pixel = at(x, y);
    if (!unknown[pixel]) continue;
    const foregroundPixel = nearest(x, y, confidentForeground, SAMPLE_RADIUS);
    const backdropPixel = nearest(x, y, background, BACKDROP_RADIUS);
    const backdropLuma = backdropPixel >= 0 ? luma(backdropPixel) : luma(pixel);
    const backdropHue = backdropPixel >= 0 ? chromaticity(backdropPixel) : BACKDROP_CHROMATICITY;
    for (let channel = 0; channel < 3; channel += 1) {
      backdropColour[(pixel * 3) + channel] = backdropHue[channel] * backdropLuma;
    }
    if (foregroundPixel < 0) {
      alpha[pixel] = 1;
      unstablePixels += 1;
      continue;
    }

    // The open backdrop and a shadowed crevice share one chromaticity, so the backdrop
    // end of the colour line is the measured backdrop hue in both places.
    const sample = chromaticity(pixel);
    const subject = chromaticity(foregroundPixel);
    const backdrop = backdropPixel >= 0 ? chromaticity(backdropPixel) : BACKDROP_CHROMATICITY;
    let numerator = 0;
    let denominator = 0;
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = subject[channel] - backdrop[channel];
      numerator += (sample[channel] - backdrop[channel]) * delta;
      denominator += delta * delta;
    }
    if (Math.sqrt(denominator) < MIN_CHROMA_SEPARATION) {
      alpha[pixel] = 1;
      unstablePixels += 1;
      continue;
    }

    // Chromaticity mixes by luma share, not by coverage: convert one into the other.
    const subjectShare = Math.max(0, Math.min(1, numerator / denominator));
    const subjectLuma = luma(foregroundPixel);
    if (backdropPixel >= 0) lumaCorrectedPixels += 1;
    const coverage = (subjectShare * backdropLuma)
      / ((subjectLuma * (1 - subjectShare)) + (subjectShare * backdropLuma));
    alpha[pixel] = Math.max(0, Math.min(1, coverage));
    projectedPixels += 1;
  }
}

// A 3x3 mean across the rim only: it removes single-pixel stair steps without pulling
// coverage off the confident subject or bleeding coverage back into the backdrop.
const smoothed = Float32Array.from(alpha);
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const pixel = at(x, y);
    if (!unknown[pixel]) continue;
    let total = 0;
    let samples = 0;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const sx = x + dx;
        const sy = y + dy;
        if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
        total += alpha[at(sx, sy)];
        samples += 1;
      }
    }
    smoothed[pixel] = total / samples;
  }
}

const outputData = Buffer.alloc(pixelCount * 4);
let decontaminatedPixels = 0;
let clearedPixels = 0;
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const pixel = at(x, y);
    const offset = pixel * 3;
    const target = pixel * 4;
    const coverage = smoothed[pixel];
    let red = data[offset];
    let green = data[offset + 1];
    let blue = data[offset + 2];

    if (coverage <= 0) clearedPixels += 1;

    // Un-mix the backdrop out of partially covered pixels: C = aF + (1-a)B solved for F.
    if (unknown[pixel] && coverage > 0.02 && coverage < 0.99) {
      const unmix = (value, backdropValue) => Math.max(0, Math.min(255, Math.round((value - ((1 - coverage) * backdropValue)) / coverage)));
      red = unmix(red, backdropColour[offset]);
      green = unmix(green, backdropColour[offset + 1]);
      blue = unmix(blue, backdropColour[offset + 2]);
      decontaminatedPixels += 1;
    }

    outputData[target] = red;
    outputData[target + 1] = green;
    outputData[target + 2] = blue;
    outputData[target + 3] = Math.round(coverage * 255);
  }
}

await sharp(outputData, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9, effort: 10, palette: false })
  .toFile(output);

console.log(JSON.stringify({
  input,
  output,
  crop: { left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight },
  keys: { BACKGROUND_KEY_MIN, BACKGROUND_KEY_MAX, FOREGROUND_KEY_MAX, SAMPLE_RADIUS, BACKDROP_RADIUS, MIN_CHROMA_SEPARATION },
  backdropChromaticity: BACKDROP_CHROMATICITY.map((value) => Number(value.toFixed(4))),
  backgroundPixels: backgroundCount,
  rimPixels: unknownCount,
  projectedPixels,
  lumaCorrectedPixels,
  unstablePixels,
  decontaminatedPixels,
  clearedPixels,
}, null, 2));
