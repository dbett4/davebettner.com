import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
const root=resolve('review/light-soft-fade/fade');
const mask=await sharp('animation/seated/peripheral-mask.svg').removeAlpha().raw().toBuffer();
const source=await sharp('animation/seated/source.png').resize(1000,1000).removeAlpha().raw().toBuffer();
const frame=await sharp('review/seated-animation/frame-000.png').removeAlpha().raw().toBuffer();
const protectedPoints=[['dog face',741,656],['dog ear',712,666],['dog back',665,699],['dog paws',775,790],['dog tail',625,642],['desk',677,379],['chair',378,478]];
for(const [label,x,y]of protectedPoints){const i=(y*1000+x)*3;assert.equal(mask[i],255,label+' remains fully opaque');for(let c=0;c<3;c++)assert.equal(frame[i+c],source[i+c],label+' is not attenuated');}
for(const [x,y]of [[0,0],[999,0],[0,999],[999,999],[500,0],[999,500]]){const i=(y*1000+x)*3;assert.deepEqual([...frame.subarray(i,i+3)],[230,235,240],'Matte joins the exact page background');}
let soft=0;for(let i=0;i<mask.length;i+=3)if(mask[i]>0&&mask[i]<255)soft++;assert.ok(soft>15000,'Peripheral edge is feathered');
const manifest=JSON.parse(await readFile(resolve(root,'after/manifest.json'),'utf8'));
assert.equal(manifest.errors.length,0);
const results=[];
for(const width of [1440,768,390,320]){
 const r=manifest.records.find(r=>r.width===width);assert.ok(r&&r.imageLoaded&&!r.overflow);
 assert.equal(r.sceneMask,'none');assert.equal(r.mediaMask,'none','No rectangular fade');
 const b=r.image,s=r.scene;assert.ok(b.x>=s.x-1&&b.x+b.width<=s.x+s.width+1,'Complete rug fits horizontally');
 assert.ok(b.y+b.height*.95<=s.y+s.height+1,'Front rug fringe fits vertically');
 const a=await readFile(resolve(root,`after/scene-${width}x${r.height}.png`));
 const u=await readFile(resolve(root,`after/scene-unmasked-${width}x${r.height}.png`));
 assert.ok(a.equals(u),'CSS applies no additional fade to the dog or rug');results.push({width,completeRug:true,noRectangularMask:true});
}
const result={pass:true,protectedPoints,featheredPixels:soft,rendered:results};
await writeFile(resolve(root,'verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
