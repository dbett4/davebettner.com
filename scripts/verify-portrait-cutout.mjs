import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const imagePath = 'public/images/dave-workstation-transparent.webp';
const homepage = await readFile('src/pages/index.astro', 'utf8');
const imageTag = homepage.slice(homepage.indexOf('class="scene-render"'));
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const { data, info } = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
check(info.format === 'raw', `Decoded asset unexpectedly reported format ${info.format}`);
check(info.width === 1000 && info.height === 1000, `Fallback is ${info.width}x${info.height}, not 1000x1000`);
check(info.channels === 4, `Fallback is not RGBA: ${info.channels} channels`);
check(imageTag.includes('src="/images/dave-workstation-transparent.webp"'), 'Homepage does not select the transparent workstation fallback');

const alphaAt = (x, y) => data[((y * info.width + x) * 4) + 3];
for (const [x, y] of [[0, 0], [info.width - 1, 0], [0, info.height - 1], [info.width - 1, info.height - 1]]) {
  check(alphaAt(x, y) === 0, `Fallback corner ${x},${y} is not transparent`);
}

let clear = 0;
let opaque = 0;
let partial = 0;
for (let index = 0; index < info.width * info.height; index += 1) {
  const alpha = data[(index * 4) + 3];
  if (alpha === 0) clear += 1;
  else if (alpha === 255) opaque += 1;
  else partial += 1;
}
check(clear / (info.width * info.height) > 0.45, 'Fallback does not clear a substantial exterior');
check(partial > 0, 'Fallback has no antialiased matte pixels');
check(opaque > 0, 'Fallback has no opaque subject pixels');

if (failures.length) {
  for (const failure of failures) process.stderr.write(`${failure}\n`);
  process.exit(1);
}

process.stdout.write(`Workstation fallback verified: ${clear} transparent, ${partial} antialiased, and ${opaque} opaque pixels.\n`);
