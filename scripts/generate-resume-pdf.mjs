import { readFileSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const supplied=new URL('../resume/dave-bettner-current.pdf',import.meta.url);
if(createHash('sha256').update(readFileSync(supplied)).digest('hex')!=='e23cee694991e19d6a3bbc18f4bc18744e5c41a84b6dd4982e46bc06c0a7ec4c') throw new Error('Supplied resume changed; review before replacing the download.');
const previous=new URL('../resume/dave-bettner-public.pdf',import.meta.url);
if(createHash('sha256').update(readFileSync(previous)).digest('hex')!=='53fe842ccc5d560af349d2c627397c84dffe91965fbd20eae16067ada68ff4a0') throw new Error('Previous public resume changed.');
const design=new URL('../resume/dave-bettner-design-engineering.pdf',import.meta.url);
if(createHash('sha256').update(readFileSync(design)).digest('hex')!=='53d16be1c62d918bc73dd1ed64fc2c70c9b8ddbfdf6e609905f26d37c6e17d19') throw new Error('Previous design-engineering resume changed.');
const manifest=JSON.parse(readFileSync(new URL('../resume/ai-workflows-manifest.json',import.meta.url),'utf8'));
for(const field of ['source','html','css','font','pdf']) {
  const actual=createHash('sha256').update(readFileSync(new URL('../'+manifest[field],import.meta.url))).digest('hex');
  if(actual!==manifest[field+'Sha256']) throw new Error('AI-workflow resume source changed: '+field+'. Render and review before publishing.');
}
const source=new URL('../'+manifest.pdf,import.meta.url);
const bytes=readFileSync(source);
const hash=createHash('sha256').update(bytes).digest('hex');
copyFileSync(source,new URL('../public/dave-bettner-resume.pdf',import.meta.url));
console.log('Source-bound AI-workflow resume copied byte-for-byte; previous sources retained:',hash);
