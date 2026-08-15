import sharp from 'sharp';
import process from 'node:process';
import { readFile } from 'node:fs/promises';
import {
  CUTOUT_IMAGE,
  CUTOUT_SIZE,
  isBackdropColour,
} from './portrait-key.mjs';

/**
 * Contract for the hero portrait cutout.
 *
 * The cutout is supplied, so this checks the properties that make a cutout usable rather
 * than how it was produced. Two of them are the defects that shipped before: backdrop left
 * between a sleeve and the torso, and a backdrop-coloured halo around the hair. Both take
 * the same form — backdrop-coloured pixels surviving along the cutout's own edge — and both
 * were missed by a contract that sampled four fixed pixels, so the check is regional and
 * proves itself against a planted patch before its verdict is trusted.
 */

const HALO_SEARCH_RADIUS = 3;
const HALO_COVERAGE_FLOOR = 128;
const CLEAR_FRACTION_RANGE = [0.40, 0.55];
// Each sleeve-to-torso wedge must stay open. Windows cover the lower frame either side of
// the torso, where the wedges run down to the bottom edge.
const WEDGES = [
  { name: 'left', x: [270, 330], y: [1100, CUTOUT_SIZE.height], minimumClearPixels: 700 },
  { name: 'right', x: [995, 1060], y: [1100, CUTOUT_SIZE.height], minimumClearPixels: 700 },
];

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const { data, info } = await sharp(CUTOUT_IMAGE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
check(info.channels === 4, `Cutout is not RGBA: ${info.channels} channels`);
check(
  width === CUTOUT_SIZE.width && height === CUTOUT_SIZE.height,
  `Cutout is ${width}x${height}, not the declared ${CUTOUT_SIZE.width}x${CUTOUT_SIZE.height}`,
);

// The markup declares intrinsic size to reserve layout space; a swapped asset that leaves
// those attributes behind shifts the hero on load.
const homepage = await readFile('src/pages/index.astro', 'utf8');
const portraitTag = homepage.slice(homepage.indexOf('class="cover-portrait"'));
const declaredWidth = portraitTag.match(/width="(\d+)"/)?.[1];
const declaredHeight = portraitTag.match(/height="(\d+)"/)?.[1];
check(
  Number(declaredWidth) === CUTOUT_SIZE.width && Number(declaredHeight) === CUTOUT_SIZE.height,
  `Homepage declares the portrait as ${declaredWidth}x${declaredHeight}, not ${CUTOUT_SIZE.width}x${CUTOUT_SIZE.height}`,
);

const alphaAt = (x, y) => data[(((y * width) + x) * 4) + 3];

// The frame corners are open backdrop and must be gone.
for (const [x, y] of [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]) {
  check(alphaAt(x, y) === 0, `Cutout corner ${x},${y} is not transparent`);
}

let clearPixels = 0;
for (let pixel = 0; pixel < width * height; pixel += 1) {
  if (data[(pixel * 4) + 3] === 0) clearPixels += 1;
}
const clearFraction = clearPixels / (width * height);
check(
  clearFraction >= CLEAR_FRACTION_RANGE[0] && clearFraction <= CLEAR_FRACTION_RANGE[1],
  `Cutout clears ${(clearFraction * 100).toFixed(1)}% of the frame, outside the accepted portrait contract`,
);

/**
 * Counts backdrop-coloured pixels that survive at half coverage or more anywhere along the
 * cutout's own edge. Interior blue — the navy tie — is never near a cleared pixel and is
 * never counted.
 */
const countEdgeBackdrop = (pixels) => {
  let count = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = ((y * width) + x) * 4;
      if (pixels[offset + 3] < HALO_COVERAGE_FLOOR) continue;
      if (!isBackdropColour(pixels[offset], pixels[offset + 1], pixels[offset + 2])) continue;
      let nearClear = false;
      for (let dy = -HALO_SEARCH_RADIUS; dy <= HALO_SEARCH_RADIUS && !nearClear; dy += 1) {
        for (let dx = -HALO_SEARCH_RADIUS; dx <= HALO_SEARCH_RADIUS; dx += 1) {
          const sx = x + dx;
          const sy = y + dy;
          if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
          if (pixels[(((sy * width) + sx) * 4) + 3] === 0) {
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

// Prove the detector before trusting its verdict: a planted patch of backdrop against the
// subject's outer edge must be caught.
const planted = Buffer.from(data);
let plantedPixels = 0;
plantLoop: for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    if (alphaAt(x, y) !== 0) continue;
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

const edgeBackdropPixels = countEdgeBackdrop(data);
check(
  edgeBackdropPixels === 0,
  `Cutout keeps ${edgeBackdropPixels} backdrop-coloured pixels along its edge (background between a sleeve and the torso, or a halo)`,
);

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
}

if (failures.length) {
  for (const failure of failures) process.stderr.write(`${failure}\n`);
  process.exit(1);
}

process.stdout.write(
  `Portrait cutout verified: ${width}x${height} matching the declared intrinsic size, `
  + `${(clearFraction * 100).toFixed(1)}% of the frame cleared, both sleeve-to-torso wedges open, `
  + 'no backdrop-coloured pixel left along the edge.\n',
);
