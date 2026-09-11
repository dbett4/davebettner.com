import { readFileSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const source=new URL('../resume/dave-bettner-current.pdf',import.meta.url);
const bytes=readFileSync(source);
const hash=createHash('sha256').update(bytes).digest('hex');
if(hash!=='e23cee694991e19d6a3bbc18f4bc18744e5c41a84b6dd4982e46bc06c0a7ec4c') throw new Error('Supplied resume changed; review before replacing the download.');
copyFileSync(source,new URL('../public/dave-bettner-resume.pdf',import.meta.url));
console.log('Supplied resume preserved byte-for-byte:',hash);
