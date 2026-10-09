import { readFileSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
// Retain Dave's supplied PDF; the reviewed public copy only corrects the MCP wording.
const supplied=new URL('../resume/dave-bettner-current.pdf',import.meta.url);
if(createHash('sha256').update(readFileSync(supplied)).digest('hex')!=='e23cee694991e19d6a3bbc18f4bc18744e5c41a84b6dd4982e46bc06c0a7ec4c') throw new Error('Supplied resume changed; review before replacing the download.');
const source=new URL('../resume/dave-bettner-public.pdf',import.meta.url);
const bytes=readFileSync(source);
const hash=createHash('sha256').update(bytes).digest('hex');
if(hash!=='53fe842ccc5d560af349d2c627397c84dffe91965fbd20eae16067ada68ff4a0') throw new Error('Public resume changed; review before replacing the download.');
copyFileSync(source,new URL('../public/dave-bettner-resume.pdf',import.meta.url));
console.log('Reviewed public resume copied byte-for-byte; supplied source retained:',hash);
