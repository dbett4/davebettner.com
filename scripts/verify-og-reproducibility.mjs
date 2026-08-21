import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const output = new URL('../public/images/dave-bettner-og-interstellar.jpg', import.meta.url);
const generator = new URL('./generate-og-image.mjs', import.meta.url);

async function sha256() {
  const bytes = await readFile(output);
  return createHash('sha256').update(bytes).digest('hex');
}

function readJpegDimensions(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) return null;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return {
        height: bytes.readUInt16BE(offset + 3),
        width: bytes.readUInt16BE(offset + 5),
      };
    }
    offset += length;
  }
  return null;
}

execFileSync(process.execPath, [generator.pathname], { stdio: 'ignore' });
const first = await sha256();
await new Promise((resolve) => setTimeout(resolve, 1_100));
execFileSync(process.execPath, [generator.pathname], { stdio: 'ignore' });
const second = await sha256();

if (first !== second) {
  console.error(`OG_REPRODUCIBILITY_FAIL first=${first} second=${second}`);
  process.exit(1);
}

const bytes = await readFile(output);
const dimensions = readJpegDimensions(bytes);
if (dimensions?.width !== 1200 || dimensions?.height !== 630) {
  console.error(`OG_DIMENSIONS_FAIL dimensions=${JSON.stringify(dimensions)}`);
  process.exit(1);
}

console.log(`OG_REPRODUCIBILITY_PASS sha256=${second} dimensions=${dimensions.width}x${dimensions.height}`);
