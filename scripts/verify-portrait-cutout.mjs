import sharp from 'sharp';
import process from 'node:process';
import {
  SOURCE_IMAGE,
  CUTOUT_IMAGE,
  SOURCE_SIZE,
  CUTOUT_CROP,
  isBackdropColour,
} from './portrait-key.mjs';

/**
 * Contract for the hero portrait cutout.
 *
 * The old contract sampled four pixels inside the sleeve-to-torso wedges and declared them
 * clear. Four samples passed while the wedges still held backdrop either side of them and
 * the head still carried a backdrop-coloured halo, so the checks here are regional: every
 * backdrop-coloured pixel along the cutout's own edge is counted, wherever it is.
 *
 * The subject itself is never retouched — every fully covered pixel must still equal the
 * studio source. Only partially covered rim pixels may differ, because those are the pixels
 * the backdrop was un-mixed out of.
 */

const HALO_SEARCH_RADIUS = 3;
const HALO_COVERAGE_FLOOR = 128;
const CLEAR_FRACTION_RANGE = [0.50, 0.58];
// Windows over each sleeve-to-torso wedge, and the suit either side of it.
const WEDGES = [
  { name: 'left', x: [270, 315], y: [860, 1023], minimumClearPixels: 300, anchors: [[278, 950], [307, 950]] },
  { name: 'right', x: [800, 850], y: [860, 1023], minimumClearPixels: 1200, anchors: [[798, 950], [842, 950]] },
];

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const readRaw = async (image) => {
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
};

const sourceMetadata = await sharp(SOURCE_IMAGE).metadata();
check(
  sourceMetadata.width === SOURCE_SIZE.width && sourceMetadata.height === SOURCE_SIZE.height,
  `Unexpected source portrait dimensions: ${sourceMetadata.width}x${sourceMetadata.height}`,
);

const cutout = await readRaw(sharp(CUTOUT_IMAGE).ensureAlpha());
check(
  cutout.width === CUTOUT_CROP.width && cutout.height === CUTOUT_CROP.height,
  `Unexpected cutout portrait dimensions: ${cutout.width}x${cutout.height}`,
);
check(cutout.channels === 4, `Cutout is not RGBA: ${cutout.channels} channels`);

const source = await readRaw(sharp(SOURCE_IMAGE).extract(CUTOUT_CROP).removeAlpha());

const { width, height } = cutout;
const alphaAt = (x, y) => cutout.data[(((y * width) + x) * 4) + 3];

// 1. The subject is the photograph, untouched: full-coverage pixels must equal the source.
let retouchedSubjectPixels = 0;
let alteredRimPixels = 0;
for (let pixel = 0; pixel < width * height; pixel += 1) {
  const cutoutOffset = pixel * 4;
  const sourceOffset = pixel * 3;
  let differs = false;
  for (let channel = 0; channel < 3; channel += 1) {
    if (cutout.data[cutoutOffset + channel] !== source.data[sourceOffset + channel]) {
      differs = true;
      break;
    }
  }
  if (!differs) continue;
  const coverage = cutout.data[cutoutOffset + 3];
  if (coverage === 255) retouchedSubjectPixels += 1;
  else if (coverage > 0) alteredRimPixels += 1;
}
check(retouchedSubjectPixels === 0, `Cutout retouches ${retouchedSubjectPixels} fully covered source pixels`);

// 2. The frame corners are the open backdrop and must be gone.
for (const [x, y] of [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]) {
  check(alphaAt(x, y) === 0, `Cutout corner ${x},${y} is not transparent`);
}

// 3. Overall coverage stays in the band a head-and-shoulders portrait occupies.
let clearPixels = 0;
for (let pixel = 0; pixel < width * height; pixel += 1) {
  if (cutout.data[(pixel * 4) + 3] === 0) clearPixels += 1;
}
const clearFraction = clearPixels / (width * height);
check(
  clearFraction >= CLEAR_FRACTION_RANGE[0] && clearFraction <= CLEAR_FRACTION_RANGE[1],
  `Cutout clears ${(clearFraction * 100).toFixed(1)}% of the frame, outside the accepted portrait contract`,
);

/**
 * Counts backdrop-coloured pixels that survive at half coverage or more anywhere along the
 * cutout's own edge. This is the shape both reported defects take: the sleeve-to-torso
 * wedges kept backdrop beside the pixels that were cleared, and the head kept a backdrop
 * ring outside the hair. Interior blue — the navy tie — is never near a cleared pixel and is
 * never counted.
 */
const countEdgeBackdrop = (data) => {
  let count = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = ((y * width) + x) * 4;
      if (data[offset + 3] < HALO_COVERAGE_FLOOR) continue;
      if (!isBackdropColour(data[offset], data[offset + 1], data[offset + 2])) continue;
      let nearClear = false;
      for (let dy = -HALO_SEARCH_RADIUS; dy <= HALO_SEARCH_RADIUS && !nearClear; dy += 1) {
        for (let dx = -HALO_SEARCH_RADIUS; dx <= HALO_SEARCH_RADIUS; dx += 1) {
          const sx = x + dx;
          const sy = y + dy;
          if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
          if (data[(((sy * width) + sx) * 4) + 3] === 0) {
            nearClear = true;
            break;
          }
        }
      }
      if (nearClear) count += 1;
    }
  }
  return count;
};

// 4. Prove the detector before trusting its verdict: a planted patch of backdrop must be
// caught, and removing the plant must clear the verdict again.
const planted = Buffer.from(cutout.data);
let plantedPixels = 0;
plantLoop: for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    if (alphaAt(x, y) !== 0) continue;
    // Plant against the outer edge of the subject, where a halo would sit.
    if (x + 12 >= width || alphaAt(x + 12, y) < 200) continue;
    for (let dy = 0; dy < 6; dy += 1) {
      for (let dx = 0; dx < 6; dx += 1) {
        const offset = ((((y + dy) * width) + x + dx) * 4);
        planted[offset] = 70;
        planted[offset + 1] = 85;
        planted[offset + 2] = 100;
        planted[offset + 3] = 255;
        plantedPixels += 1;
      }
    }
    break plantLoop;
  }
}
check(plantedPixels > 0, 'Detector self-test could not plant a control patch');
check(countEdgeBackdrop(planted) > 0, 'Detector self-test failed: planted backdrop was not detected');

// 5. The real verdict.
const edgeBackdropPixels = countEdgeBackdrop(cutout.data);
check(
  edgeBackdropPixels === 0,
  `Cutout keeps ${edgeBackdropPixels} backdrop-coloured pixels along its edge (background between a sleeve and the torso, or a halo)`,
);

// 6. The wedges stay open, and the suit either side of them stays whole.
for (const wedge of WEDGES) {
  let wedgeClear = 0;
  for (let y = wedge.y[0]; y < wedge.y[1]; y += 1) {
    for (let x = wedge.x[0]; x < wedge.x[1]; x += 1) {
      if (alphaAt(x, y) === 0) wedgeClear += 1;
    }
  }
  check(
    wedgeClear >= wedge.minimumClearPixels,
    `Cutout only clears ${wedgeClear} pixels between the ${wedge.name} sleeve and the torso`,
  );
  for (const [x, y] of wedge.anchors) {
    check(alphaAt(x, y) === 255, `Cutout removes suit beside the ${wedge.name} wedge at ${x},${y}`);
  }
}

if (failures.length) {
  for (const failure of failures) process.stderr.write(`${failure}\n`);
  process.exit(1);
}

process.stdout.write([
  'Portrait cutout verified:',
  `${width}x${height}, subject pixels identical to source,`,
  `${alteredRimPixels} rim pixels un-mixed from the backdrop,`,
  `${(clearFraction * 100).toFixed(1)}% of the frame cleared,`,
  'no backdrop-coloured pixel left along the edge.',
].join(' ') + '\n');
