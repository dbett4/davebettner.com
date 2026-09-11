import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
const root=resolve('review/light-soft-fade/fade');
const mask=await sharp('animation/seated/peripheral-mask.svg').removeAlpha().raw().toBuffer();
const source=await sharp('animation/seated/source.png').resize(1000,1000).removeAlpha().raw().toBuffer();
// Verify the committed deliverables, without requiring a prior local render.
const frame=execFileSync('/usr/bin/ffmpeg',['-v','error','-i','public/video/workstation-seated.mp4','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});
const poster=await sharp('public/images/workstation-seated-poster.webp').removeAlpha().raw().toBuffer();
assert.equal(frame.length,1000*1000*3,'Decode a complete first video frame');
const protectedPoints=[['dog face',741,656],['dog ear',712,666],['dog back',665,699],['dog paws',775,790],['dog tail',625,642],['desk',646,394],['chair',378,478]];
for(const [label,x,y]of protectedPoints){
 const i=(y*1000+x)*3;assert.equal(mask[i],255,label+' remains fully opaque');
 for(const [kind,pixels]of [['video',frame],['poster',poster]]){
  let error=0;
  // Small patch averages tolerate normal lossy encoding, but reject fading.
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)for(let c=0;c<3;c++){
   const p=((y+dy)*1000+x+dx)*3+c;error+=Math.abs(pixels[p]-source[p]);
  }
  assert.ok(error/75<9,label+' is preserved in the '+kind+' (mean RGB error '+(error/75).toFixed(2)+')');
 }
}
for(const [x,y]of [[0,0],[999,0],[0,999],[999,999],[500,0],[999,500]]){const i=(y*1000+x)*3;for(const pixels of [frame,poster])for(let c=0;c<3;c++)assert.ok(Math.abs(pixels[i+c]-[230,235,240][c])<=2,'Encoded matte joins the page background');}
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
