import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const output = new URL('../public/dave-bettner-resume.pdf', import.meta.url);
const generator = new URL('./generate-resume-pdf.mjs', import.meta.url);

async function sha256() {
  const bytes = await readFile(output);
  return createHash('sha256').update(bytes).digest('hex');
}

execFileSync(process.execPath, [generator.pathname], { stdio: 'ignore' });
const first = await sha256();
await new Promise((resolve) => setTimeout(resolve, 1_100));
execFileSync(process.execPath, [generator.pathname], { stdio: 'ignore' });
const second = await sha256();

if (first !== second) {
  console.error(`RESUME_REPRODUCIBILITY_FAIL first=${first} second=${second}`);
  process.exit(1);
}

console.log(`RESUME_REPRODUCIBILITY_PASS sha256=${second}`);
