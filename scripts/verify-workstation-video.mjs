import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
const base=process.env.SITE_URL;
assert.ok(base,'Run against the native served build with SITE_URL');
const out=resolve('review/seated-animation/browser');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const checks=[],errors=[];
const check=(condition,label)=>{assert.ok(condition,label);checks.push(label);};
const watch=p=>p.on('pageerror',e=>errors.push(String(e)));
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light'});
  const page=await context.newPage();watch(page);await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>{const v=document.querySelector('video');return !v.paused&&v.currentTime>.4;});
  const meta=await page.locator('video').evaluate(v=>({w:v.videoWidth,h:v.videoHeight,d:v.duration,muted:v.muted,inline:v.playsInline,loop:v.loop,opacity:getComputedStyle(v).opacity}));
  check(meta.w===1000&&meta.h===1000&&meta.d>4.5&&meta.d<5,'Browser decodes the complete 1000-square, under-five-second clip');
  check(meta.muted&&meta.inline&&!meta.loop&&meta.opacity==='1','Muted inline finite video remains opaque');
  check(await page.locator('[data-workstation] button').count()===0,'No playback controls are shown');
  await page.screenshot({path:resolve(out,'desktop.png'),fullPage:true});
  await page.locator('.workstation-media').screenshot({path:resolve(out,'desktop-scene.png')});
  await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(300);
  check(await page.locator('video').evaluate(v=>v.paused),'Off-screen video pauses');
  await page.evaluate(()=>scrollTo(0,0));await page.waitForFunction(()=>!document.querySelector('video').paused);
  await page.emulateMedia({reducedMotion:'reduce'});
  // CDP changes the CSS media query before dispatching its JS change event.
  // Wait for that event's observable effect rather than racing one round trip.
  await page.waitForFunction(()=>{const v=document.querySelector('video');return v.paused&&getComputedStyle(v).display==='none';},null,{timeout:1000});
  check(await page.locator('video').evaluate(v=>v.paused&&getComputedStyle(v).display==='none'),'Live reduced-motion change immediately restores the poster');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.waitForFunction(()=>!document.querySelector('video').paused);
  await page.waitForFunction(()=>document.querySelector('[data-workstation]').dataset.motionComplete==='true',null,{timeout:14000});
  check(await page.locator('video').evaluate(v=>v.ended&&v.paused),'Playback ends once and holds its final frame');
  await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(150);await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(200);
  check(await page.locator('video').evaluate(v=>v.ended&&v.paused),'Viewport re-entry does not restart completed motion');
  // Decode the bytes actually served over HTTP. Browser lifecycle proof above
  // is separate from frame-content proof, avoiding compositor-dependent seek captures.
  const response=await context.request.get(base+'/video/workstation-seated.mp4');
  check(response.ok(),'The rendered clip is served successfully');
  const served=resolve(out,'served.mp4');await writeFile(served,await response.body());
  const frames=[];
  for(const time of [0,.8,1.6,2.4,3.2,4,4.7]){
    const path=resolve(out,`decoded-${time}.png`);
    execFileSync('/usr/bin/ffmpeg',['-v','error','-y','-ss',String(time),'-i',served,'-frames:v','1',path]);
    const buffer=await readFile(path);
    frames.push({time,buffer,pixels:await sharp(buffer).removeAlpha().raw().toBuffer()});
  }
  const regions={mouse:[560,362,615,410],typing:[430,340,469,365],dog:[702,635,785,710],spreadsheet:[427,207,550,295],agent:[569,213,755,345],deskFoot:[711,525,740,570],rug:[160,580,225,640]};
  const deltas={};
  for(const [name,[x1,y1,x2,y2]]of Object.entries(regions)){
    let maxMean=0;
    for(const f of frames.slice(1)){let sum=0,n=0;for(let y=y1;y<y2;y++)for(let x=x1;x<x2;x++)for(let c=0;c<3;c++){const i=(y*1000+x)*3+c;sum+=Math.abs(f.pixels[i]-frames[0].pixels[i]);n++;}maxMean=Math.max(maxMean,sum/n);}
    deltas[name]=maxMean;
  }
  await writeFile(resolve(out,'motion-deltas.json'),JSON.stringify(deltas,null,2));
  for(const name of ['mouse','typing','dog','spreadsheet','agent'])check(deltas[name]>.15,`Decoded ${name} region changes during playback`);
  check(deltas.deskFoot<1.2&&deltas.rug<1.2,'Desk feet and rug remain stationary through the decoded clip');
  await writeFile(resolve(out,'motion-deltas.json'),JSON.stringify(deltas,null,2));
  const thumbs=await Promise.all(frames.map(f=>sharp(f.buffer).resize(330,330).png().toBuffer()));
  await sharp({create:{width:1320,height:660,channels:3,background:'#e6ebf0'}}).composite(thumbs.map((input,i)=>({input,left:(i%4)*330,top:Math.floor(i/4)*330}))).png().toFile(resolve(out,'playback-contact-sheet.png'));
  await context.close();

  for(const width of [768,390,320]){
    const c=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce',colorScheme:'dark'}),p=await c.newPage();watch(p);
    const requested=[];p.on('request',r=>{if(r.url().includes('.mp4'))requested.push(r.url());});
    await p.goto(base,{waitUntil:'networkidle'});await p.locator('.scene-wrap').scrollIntoViewIfNeeded();
    const state=await p.evaluate(()=>{const img=document.querySelector('.scene-render'),video=document.querySelector('video'),r=img.getBoundingClientRect(),s=document.querySelector('.scene-wrap').getBoundingClientRect();return{loaded:img.complete&&img.naturalWidth===1000,paused:video.paused,src:video.currentSrc,overflow:document.documentElement.scrollWidth>innerWidth,dogVisible:r.x+r.width*.605>=s.x&&r.x+r.width*.815<=s.right&&r.y+r.height*.635>=s.y&&r.y+r.height*.815<=s.bottom};});
    check(state.loaded&&state.paused&&!state.src&&!requested.length,`${width}px reduced motion loads only the matching still`);
    check(!state.overflow&&state.dogVisible,`${width}px layout preserves the complete dog without horizontal overflow`);
    await p.screenshot({path:resolve(out,`mobile-${width}.png`),fullPage:true});await p.locator('.scene-wrap').screenshot({path:resolve(out,`scene-${width}.png`)});await c.close();
  }
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),np=await nojs.newPage();await np.goto(base);
  check(await np.locator('video').evaluate(v=>v.paused&&!v.currentSrc),'JavaScript-disabled page does not request video');
  check(await np.locator('.scene-render').evaluate(i=>i.complete&&i.naturalWidth===1000),'JavaScript-disabled page retains the matching poster');await nojs.close();

  const failure=await browser.newContext({viewport:{width:1440,height:900}}),fp=await failure.newPage();watch(fp);await fp.route('**/video/*.mp4',r=>r.abort());await fp.goto(base,{waitUntil:'networkidle'});await fp.waitForTimeout(350);
  check(await fp.locator('.scene-render').evaluate(i=>i.complete&&i.naturalWidth===1000),'Unavailable video retains a complete still');
  check(await fp.locator('video').evaluate(v=>v.paused&&getComputedStyle(v).visibility==='hidden'),'Unavailable video stays hidden');await failure.close();
  check(errors.length===0,'No browser script errors');
  await writeFile(resolve(out,'checks.json'),JSON.stringify({base,checks,errors,metadata:meta},null,2));
  console.log(JSON.stringify({passed:checks.length,errors,metadata:meta,output:out}));
}finally{await browser.close();}
