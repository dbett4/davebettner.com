import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
const root=resolve('review/light-soft-fade/fade');
const size=1254;
const source=await sharp('animation/workstation-loop/art/source.png').removeAlpha().raw().toBuffer();
// Verify the committed deliverables, decoded the way browsers do (BT.709, limited range).
const frame=execFileSync('ffmpeg',['-v','error','-i','public/video/workstation-loop.mp4','-frames:v','1',
  '-vf','scale=in_color_matrix=bt709:in_range=tv:out_range=full:flags=accurate_rnd+full_chroma_int',
  '-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:8*1024*1024});
const poster=await sharp('public/images/workstation-loop-poster.webp').removeAlpha().raw().toBuffer();
assert.equal(frame.length,size*size*3,'Decode a complete first video frame');
assert.equal(poster.length,size*size*3,'Poster matches the video frame size');
// The loop opens at rest, so the dog and furniture must match the approved art.
const protectedPoints=[['dog face',929,823],['dog ear',893,835],['dog back',834,877],['dog paws',972,991],['dog tail',784,805],['desk',810,494],['chair',474,599]];
for(const [label,x,y]of protectedPoints)for(const [kind,pixels]of [['video',frame],['poster',poster]]){
  let error=0;
  // Small patch averages tolerate normal lossy encoding, but reject fading or drift.
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)for(let c=0;c<3;c++){
    const p=((y+dy)*size+x+dx)*3+c;error+=Math.abs(pixels[p]-source[p]);
  }
  assert.ok(error/75<9,label+' is preserved in the '+kind+' (mean RGB error '+(error/75).toFixed(2)+')');
}
const edges=[[0,0],[size-1,0],[0,size-1],[size-1,size-1],[627,0],[size-1,627],[0,300],[627,size-1]];
for(const [x,y]of edges){const i=(y*size+x)*3;for(const pixels of [frame,poster])for(let c=0;c<3;c++)assert.ok(Math.abs(pixels[i+c]-[230,235,240][c])<=2,'Encoded periphery joins the page background');}
// The rug corners fade into the page rather than ending at the frame edge.
let soft=0;
for(let y=680;y<760;y++)for(let x=10;x<40;x+=3)for(const xx of [x,size-1-x]){const i=(y*size+xx)*3,d=Math.abs(frame[i]-230)+Math.abs(frame[i+1]-235)+Math.abs(frame[i+2]-240);if(d>6&&d<120)soft++;}
assert.ok(soft>200,'Rug corners feather into the page ('+soft+' soft samples)');
const manifest=JSON.parse(await readFile(resolve(root,'after/manifest.json'),'utf8'));
assert.equal(manifest.errors.length,0);
const results=[];
for(const width of [1440,768,390,320]){
 const r=manifest.records.find(r=>r.width===width);assert.ok(r&&r.imageLoaded&&!r.overflow);
 assert.equal(r.sceneMask,'none');assert.equal(r.mediaMask,'none','No rectangular fade');
 assert.match(r.imageFilter,/workstation-cutout/,'Original artwork uses the transparent background filter');
 const b=r.image,s=r.scene;assert.ok(b.x>=s.x-1&&b.x+b.width<=s.x+s.width+1,'Complete rug fits horizontally');
 assert.ok(b.y+b.height*.95<=s.y+s.height+1,'Front rug fringe fits vertically');
 const a=await sharp(resolve(root,`after/scene-${width}x${r.height}.png`)).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const u=await sharp(resolve(root,`after/scene-unmasked-${width}x${r.height}.png`)).removeAlpha().raw().toBuffer();
 const sample=(x,y)=>((Math.round(y/size*(a.info.height-1)))*a.info.width+Math.round(x/size*(a.info.width-1)))*3;
 for(const [label,x,y]of [...protectedPoints,['left monitor',570,285],['right monitor',810,340],['rug',300,820]]){
   const i=sample(x,y);for(let c=0;c<3;c++)assert.ok(Math.abs(a.data[i+c]-u[i+c])<=2,`${width}px: ${label} retains its original pixels`);
 }
 for(const [x,y]of [[100,100],[1100,250],[300,300],[800,420],[640,390],[400,380],[180,1000]]){
   const i=sample(x,y);for(let c=0;c<3;c++)assert.ok(a.data[i+c]>=252,`${width}px: background at ${x},${y} clears to the white page`);
 }
 results.push({width,completeRug:true,noRectangularMask:true,backgroundRemoved:true,foregroundPreserved:true});
}
const result={pass:true,protectedPoints,softCornerSamples:soft,rendered:results};
await writeFile(resolve(root,'verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
