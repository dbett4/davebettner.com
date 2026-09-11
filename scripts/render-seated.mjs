import sharp from 'sharp';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, rename } from 'node:fs/promises';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { screenMaps, paintScreens } from './workstation-screens.mjs';

// A continuous deformation field for small seated gestures. This is intentionally
// not a walking/standing rig: no translated cutouts, changing alpha, or crossfades.
const size = 1000, fps = 24, duration = 4.8, count = Math.round(fps * duration);
const root = new URL('../', import.meta.url);
const source = new URL('animation/seated/source.png', root);
const video = new URL('public/video/workstation-seated.mp4', root);
const pendingVideo = new URL('animation/seated/render-pending.mp4', root);
const pendingPoster = new URL('animation/seated/render-pending.webp', root);
const poster = new URL('public/images/workstation-seated-poster.webp', root);
const review = new URL('review/seated-animation/', root);
await mkdir(review, { recursive: true });
const pixels = await sharp(source.pathname).resize(size, size).removeAlpha().raw().toBuffer();
const maps = screenMaps(size);
const matte = await sharp(new URL('animation/seated/peripheral-mask.svg', root).pathname).removeAlpha().raw().toBuffer();
for(let i=0;i<pixels.length;i+=3){const a=matte[i]/255;for(let c=0;c<3;c++)pixels[i+c]=Math.round(pixels[i+c]*a+[230,235,240][c]*(1-a));}

const smooth = x => (x = Math.max(0, Math.min(1, x)), x * x * (3 - 2 * x));
const window = (t, a, b, edge = .45) => smooth((t-a)/edge) * smooth((b-t)/edge);
// Coordinates refer to the generated, anatomically continuous mouse-contact pose.
const fields = [
  { name: 'mouse-hand', x: 585, y: 384, rx: 39, ry: 31 },
  { name: 'right-forearm', x: 546, y: 415, rx: 49, ry: 34 },
  { name: 'left-fingers', x: 450, y: 352, rx: 20, ry: 13 },
  { name: 'left-wrist', x: 432, y: 350, rx: 19, ry: 17 },
  { name: 'shoulder-breath', x: 390, y: 347, rx: 71, ry: 42 },
  { name: 'dog-head', x: 740, y: 660, rx: 39, ry: 34 },
  { name: 'dog-chest', x: 726, y: 713, rx: 35, ry: 33 },
];
// Compactly supported smooth fields vanish outside their bounds. Feet, desk,
// chair, paws, rug fringe and page background have exactly zero displacement.
const active = [];
for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
  const weights = fields.map(f => {
    const q = ((x-f.x)/f.rx)**2 + ((y-f.y)/f.ry)**2;
    return q >= 1 ? 0 : (1-q)**2;
  });
  if (weights.some(Boolean)) active.push({ x, y, offset: (y*size+x)*3, weights });
}
function pose(t) {
  const m = window(t, .4, 1.85, .3);
  const mouseX = m * (3.8*Math.sin((t-.4)*2.6) + 1.4*Math.sin((t-.4)*5.1));
  const mouseY = m * 2.6*Math.sin((t-.4)*3.4);
  const typing = window(t, 2.0, 3.35, .25);
  const keys = typing * (1.25*Math.sin(t*23) + .45*Math.sin(t*37));
  const breath = window(t, .2, 4.4) * Math.sin((t-.4)*1.55);
  const sniff = window(t, 1.6, 4.1, .6);
  const headX = sniff * 3.8*Math.sin((t-1.6)*1.45);
  const headY = sniff * (1.8*Math.sin((t-1.6)*2.2) + .45*Math.sin(t*9));
  return [[mouseX,mouseY],[mouseX*.42,mouseY*.55],
    [keys*.18,keys],[keys*.08,keys*.35],
    [breath*.25,breath*.6],[headX,headY],
    [0,window(t,.4,4.4)*.7*Math.sin(t*2.5)]];
}
const encoder = spawn('/usr/bin/ffmpeg', ['-y','-hide_banner','-loglevel','error',
  '-f','rawvideo','-pix_fmt','rgb24','-s',`${size}x${size}`,'-r',String(fps),
  '-i','pipe:0','-an','-c:v','libx264','-preset','slow','-crf','20',
  '-vf','scale=in_range=full:out_range=tv:out_color_matrix=bt709','-pix_fmt','yuv420p','-movflags','+faststart','-color_primaries','bt709',
  '-color_trc','iec61966-2-1','-colorspace','bt709',pendingVideo.pathname], {stdio:['pipe','ignore','inherit']});
const exited = once(encoder, 'exit');
const sampleFrames = new Set([0,16,32,48,64,80,96,count-1]);
for (let n = 0; n < count; n++) {
  const frame = Buffer.from(pixels), offsets = pose(n/fps);
  for (const p of active) {
    let dx=0,dy=0;
    for (let k=0;k<fields.length;k++) {dx+=p.weights[k]*offsets[k][0];dy+=p.weights[k]*offsets[k][1];}
    const sx=p.x-dx, sy=p.y-dy, x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0;
    const a=(y0*size+x0)*3,b=a+3,c=a+size*3,d=c+3;
    for(let ch=0;ch<3;ch++) frame[p.offset+ch]=Math.round(
      (pixels[a+ch]*(1-fx)+pixels[b+ch]*fx)*(1-fy)+(pixels[c+ch]*(1-fx)+pixels[d+ch]*fx)*fy);
  }
  await paintScreens(frame, n/fps, maps);
  if(n === 0) await sharp(frame,{raw:{width:size,height:size,channels:3}}).webp({quality:92}).toFile(pendingPoster.pathname);
  if (sampleFrames.has(n)) await sharp(frame,{raw:{width:size,height:size,channels:3}})
    .png().toFile(new URL(`frame-${String(n).padStart(3,'0')}.png`,review).pathname);
  if(!encoder.stdin.write(frame)) await once(encoder.stdin,'drain');
}
encoder.stdin.end();
const [code] = await exited;
if(code !== 0) throw new Error(`Video encoder failed: ${code}`);
await rename(pendingVideo,video);
await rename(pendingPoster,poster);
const manifest={width:size,height:size,fps,duration,frames:count,
  sourcePixelHash:createHash('sha256').update(pixels).digest('hex'),
  fields, fixed:['desk','desk feet','chair','shoes','rug fringe','dog paws','background'],
  beats:[['hold',0,.4],['mouse',.4,1.85],['left-hand key presses',2,3.35],['dog head and chest',1.6,4.1],['settle',4.4,4.8]],
  limitations:['Micro-motion seated study only; no hand transfer, standing, walking or new hidden anatomy.','Requires playback review; this manifest does not certify natural movement.']};
await writeFile(new URL('render.json',review),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({video:video.pathname,poster:poster.pathname,...manifest},null,2));
