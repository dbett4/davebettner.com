import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const size = 1000;
const output = resolve('public/images/dave-workstation-soft-fade-mask.png');
const pixels = Buffer.alloc(size * size * 4);

const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

for (let y = 0; y < size; y += 1) {
  for (let x = 0; x < size; x += 1) {
    // Source-space floor field: the broad center stays at 100% opacity while
    // the irregular rug perimeter eases out over a real, long transition.
    const centerX = 500 + (y - 520) * 0.1;
    const dx = Math.abs((x - centerX) / 570);
    const dy = Math.abs((y - 520) / 430);
    const distance = (dx ** 4 + dy ** 4) ** 0.25;
    const floorAlpha = (1 - smoothstep(0.62, 1.03, distance)) * 255;
    // Keep the desk, screens, and chair fully present; the falloff is for the
    // peripheral rug, while the dog remains inside the opaque center field.
    const workstationAlpha = y <= 600 && x >= 245 && x <= 935 ? 255 : 0;
    const alpha = Math.round(Math.max(floorAlpha, workstationAlpha));
    const offset = (y * size + x) * 4;
    pixels[offset] = 255;
    pixels[offset + 1] = 255;
    pixels[offset + 2] = 255;
    pixels[offset + 3] = alpha;
  }
}

await mkdir(resolve('public/images'), { recursive: true });
await sharp(pixels, { raw: { width: size, height: size, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(output);
console.log(`SOFT_FADE_MASK ${output}`);
