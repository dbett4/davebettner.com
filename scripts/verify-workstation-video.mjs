import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
const base=process.env.SITE_URL;
assert.ok(base,'Run against the native served build with SITE_URL');
const out=resolve('review/workstation-loop/browser');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const checks=[],errors=[];
const check=(condition,label)=>{assert.ok(condition,label);checks.push(label);};
const watch=p=>p.on('pageerror',e=>errors.push(String(e)));
const size=1254;
const advancing=async (page,timeout=4000)=>{
  const before=await page.locator('video').evaluate(v=>v.currentTime);
  await page.waitForFunction(before=>{const v=document.querySelector('video');return !v.paused&&(v.currentTime>before+.12||v.currentTime<before);},before,{timeout});
};
const state=page=>page.locator('video').evaluate(v=>({paused:v.paused,ended:v.ended,loop:v.loop,time:v.currentTime}));
// Play through the loop's end quickly rather than seeking: the static preview
// server has no range support, so a seek would restart the file at 0.
const wraps=async (page,timeout=9000)=>{
  await page.locator('video').evaluate(v=>{window.__times=[];v.addEventListener('timeupdate',()=>window.__times.push(v.currentTime));v.playbackRate=5;});
  await page.waitForFunction(()=>{const t=window.__times,i=t.findIndex(x=>x>9.3);return i>=0&&t.slice(i+1).some(x=>x<2);},null,{timeout});
  const s=await state(page);
  await page.locator('video').evaluate(v=>{v.playbackRate=1;});
  return !s.ended&&!s.paused;
};
const controls=page=>page.evaluate(()=>{const r=document.querySelector('[data-workstation]');return r.querySelectorAll('button,[role=button],input,[tabindex]:not([tabindex="-1"])').length+(r.querySelector('video').controls?1:0);});
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light'});
  const page=await context.newPage();watch(page);await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>{const v=document.querySelector('video');return !v.paused&&v.currentTime>.4;});
  const meta=await page.locator('video').evaluate(v=>({w:v.videoWidth,h:v.videoHeight,d:v.duration,muted:v.muted,inline:v.playsInline,loop:v.loop,opacity:getComputedStyle(v).opacity}));
  check(meta.w===size&&meta.h===size&&meta.d>9.9&&meta.d<10.1,'Browser decodes the complete 1254-square, ten-second loop');
  check(meta.muted&&meta.inline&&meta.loop&&meta.opacity==='1','Muted inline looping video remains opaque');
  check(await wraps(page),'Playback wraps from the last frame to the first without ending');
  check(await controls(page)===0,'No playback controls are shown');
  for (const preference of ['reduce', 'no-preference']) {
    await page.emulateMedia({reducedMotion:preference});
    await advancing(page,3000);
    check((await state(page)).loop,`Live preference change to ${preference} keeps looping`);
  }
  await page.screenshot({path:resolve(out,'desktop.png'),fullPage:true});
  await page.locator('.workstation-media').screenshot({path:resolve(out,'desktop-scene.png')});
  await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(300);
  check(await page.locator('video').evaluate(v=>v.paused),'Off-screen video pauses');
  await page.evaluate(()=>scrollTo(0,0));await page.waitForFunction(()=>!document.querySelector('video').paused);
  check(true,'Returning on-screen resumes the loop');

  // Decode the bytes actually served over HTTP, the way browsers convert them.
  const response=await context.request.get(base+'/video/workstation-loop.mp4');
  check(response.ok(),'The rendered loop is served successfully');
  const served=resolve(out,'served.mp4');await writeFile(served,await response.body());
  const frames=[];
  for(const time of [0,1,2.2,3.6,5.9,6.25,7.6,9]){
    const raw=execFileSync('ffmpeg',['-v','error','-ss',String(time),'-i',served,'-frames:v','1','-vf','scale=in_color_matrix=bt709:in_range=tv:out_range=full:flags=accurate_rnd+full_chroma_int','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:8*1024*1024});
    assert.equal(raw.length,size*size*3);
    frames.push({time,pixels:raw,png:await sharp(raw,{raw:{width:size,height:size,channels:3}}).resize(330,330).png().toBuffer()});
  }
  const regions={mouse:[700,455,770,510],typing:[535,425,595,462],head:[440,300,535,405],dog:[870,780,1000,875],spreadsheet:[490,225,690,330],agent:[720,265,945,430],deskFoot:[300,650,390,705],rug:[200,780,280,840]};
  const deltas={};
  for(const [name,[x1,y1,x2,y2]]of Object.entries(regions)){
    let maxMean=0;
    for(const f of frames.slice(1)){let sum=0,n=0;for(let y=y1;y<y2;y++)for(let x=x1;x<x2;x++)for(let c=0;c<3;c++){const i=(y*size+x)*3+c;sum+=Math.abs(f.pixels[i]-frames[0].pixels[i]);n++;}maxMean=Math.max(maxMean,sum/n);}
    deltas[name]=maxMean;
  }
  await writeFile(resolve(out,'motion-deltas.json'),JSON.stringify(deltas,null,2));
  for(const name of ['mouse','typing','head','dog','spreadsheet','agent'])check(deltas[name]>.15,`Decoded ${name} region changes during the loop (${deltas[name].toFixed(2)})`);
  check(deltas.deskFoot<1.2&&deltas.rug<1.2,'Desk feet and rug remain stationary through the decoded loop');
  // Loop seam: the last frame flows into the first like any other step.
  const tail=execFileSync('ffmpeg',['-v','error','-sseof','-0.05','-i',served,'-frames:v','1','-vf','scale=in_color_matrix=bt709:in_range=tv:out_range=full:flags=accurate_rnd+full_chroma_int','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:8*1024*1024});
  let seam=0;for(let i=0;i<tail.length;i+=3)if(Math.max(Math.abs(tail[i]-frames[0].pixels[i]),Math.abs(tail[i+1]-frames[0].pixels[i+1]),Math.abs(tail[i+2]-frames[0].pixels[i+2]))>12)seam++;
  check(seam<2500,`Loop seam changes no more than an ordinary frame step (${seam} pixels)`);
  await sharp({create:{width:1320,height:660,channels:3,background:'#e6ebf0'}}).composite(frames.map((f,i)=>({input:f.png,left:(i%4)*330,top:Math.floor(i/4)*330}))).png().toFile(resolve(out,'playback-contact-sheet.png'));
  await context.close();

  // The loop runs regardless of the OS motion setting (Dave's decision, 2026-09-11 and 2026-09-28).
  const rc=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),rp=await rc.newPage();watch(rp);
  await rp.goto(base,{waitUntil:'networkidle'});
  await rp.waitForFunction(()=>{const v=document.querySelector('video');return !v.paused&&v.currentTime>.3;});
  check((await state(rp)).loop&&await wraps(rp),'Reduced motion still loops seamlessly');await rc.close();

  // Autoplay refused (as in a power-saving mode): the poster stays, and the first gesture starts the loop.
  const bc=await browser.newContext({viewport:{width:1440,height:900}}),bp=await bc.newPage();watch(bp);
  await bc.addInitScript(()=>{const play=HTMLMediaElement.prototype.play;let refused=false;
    HTMLMediaElement.prototype.play=function(){if(!refused){refused=true;return Promise.reject(new DOMException('Autoplay refused','NotAllowedError'));}return play.call(this);};});
  await bp.goto(base,{waitUntil:'networkidle'});await bp.waitForTimeout(400);
  check(await bp.locator('video').evaluate(v=>v.paused&&getComputedStyle(v).visibility==='hidden'),'Refused autoplay leaves the matching poster in place');
  await bp.locator('.hero h1').click();
  await bp.waitForFunction(()=>{const v=document.querySelector('video');return !v.paused&&v.currentTime>.2&&getComputedStyle(v).visibility==='visible';},null,{timeout:4000});
  check(true,'The first click starts the loop after autoplay is refused');await bc.close();

  for(const width of [1440,768,390,320])for(const preference of ['reduce','no-preference']){
    const c=await browser.newContext({viewport:{width,height:844},reducedMotion:preference,colorScheme:'dark'}),p=await c.newPage();watch(p);
    const requested=[];p.on('request',r=>{if(r.url().includes('.mp4'))requested.push(r.url());});
    await p.goto(base,{waitUntil:'networkidle'});await p.locator('.scene-wrap').scrollIntoViewIfNeeded();
    await p.waitForFunction(()=>{const v=document.querySelector('video');return !v.paused&&v.currentTime>.2&&getComputedStyle(v).visibility==='visible'&&getComputedStyle(v).display!=='none';});
    await advancing(p);
    const view=await p.evaluate(()=>{const img=document.querySelector('.scene-render'),video=document.querySelector('video'),r=img.getBoundingClientRect(),s=document.querySelector('.scene-wrap').getBoundingClientRect();return{loaded:img.complete&&img.naturalWidth>0&&img.naturalWidth===img.naturalHeight&&/\/workstation-loop-poster(-760)?\.webp$/.test(img.currentSrc),paused:video.paused,src:video.currentSrc,overflow:document.documentElement.scrollWidth>innerWidth,dogVisible:r.x+r.width*.605>=s.x&&r.x+r.width*.815<=s.right&&r.y+r.height*.635>=s.y&&r.y+r.height*.815<=s.bottom};});
    check(view.loaded&&!view.paused&&view.src&&requested.length,`${width}px ${preference}: matching poster loads and video visibly advances`);
    check(!view.overflow&&view.dogVisible,`${width}px ${preference}: complete dog remains framed without horizontal overflow`);
    await p.screenshot({path:resolve(out,`page-${width}-${preference}.png`),fullPage:true});await p.locator('.scene-wrap').screenshot({path:resolve(out,`scene-${width}-${preference}.png`)});await c.close();
  }
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),np=await nojs.newPage();await np.goto(base);
  check(await np.locator('video').evaluate(v=>v.paused&&!v.currentSrc),'JavaScript-disabled page does not request video');
  check(await np.locator('.scene-render').evaluate(i=>i.complete&&i.naturalWidth>0&&i.naturalWidth===i.naturalHeight&&/\/workstation-loop-poster(-760)?\.webp$/.test(i.currentSrc)),'JavaScript-disabled page retains the matching poster');
  check(await controls(np)===0,'JavaScript-disabled page shows no controls');await nojs.close();

  const failure=await browser.newContext({viewport:{width:1440,height:900}}),fp=await failure.newPage();watch(fp);await fp.route('**/video/*.mp4',r=>r.abort());await fp.goto(base,{waitUntil:'networkidle'});await fp.waitForTimeout(350);
  check(await fp.locator('.scene-render').evaluate(i=>i.complete&&i.naturalWidth>0&&i.naturalWidth===i.naturalHeight&&/\/workstation-loop-poster(-760)?\.webp$/.test(i.currentSrc)),'Unavailable video retains a complete still');
  check(await fp.locator('video').evaluate(v=>v.paused&&getComputedStyle(v).visibility==='hidden'),'Unavailable video stays hidden');await failure.close();
  check(errors.length===0,'No browser script errors');
  await writeFile(resolve(out,'checks.json'),JSON.stringify({base,checks,errors,metadata:meta},null,2));
  console.log(JSON.stringify({passed:checks.length,errors,metadata:meta,output:out}));
}finally{await browser.close();}
