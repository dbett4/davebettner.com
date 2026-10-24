import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
if (!process.env.REVIEW_OUTPUT_DIR) throw Error('Set REVIEW_OUTPUT_DIR to a directory outside this repository.');
const out=resolve(process.env.REVIEW_OUTPUT_DIR);
const repo=resolve('.');
if (out===repo || out.startsWith(repo+'/')) throw Error('Review evidence must be written outside this repository.');
const pdf=resolve(out,'dave-bettner-resume-candidate.pdf');
const html=resolve(out,'dave-bettner-business-operations-candidate.html');
await mkdir(out,{recursive:true});
execFileSync('pandoc',['resume/dave-bettner-business-operations-candidate.md','--standalone','--metadata','title=Dave Bettner | Resume draft','--css',pathToFileURL(resolve('resume/ai-workflows.css')).href,'-o',html]);
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-gpu','--disable-webgl','--disable-3d-apis']});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await page.goto(pathToFileURL(html).href);
  await page.pdf({path:pdf,format:'Letter',printBackground:true,preferCSSPageSize:true,tagged:true});
  for(const width of [1440,390]) {
    await page.setViewportSize({width,height:1000});
    for(const [slug,url] of [['case','/work/business-operations/'],['demo','/showcase/creative-operations-lab/'],['home','/']]){
      const response=await page.goto(`http://127.0.0.1:4322${url}`);if(response.status()!==200)throw Error(`HTTP ${response.status()} ${url}`);
      for(const image of await page.locator('img').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(element=>element.decode());}
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:`${out}/${slug}-${width}.png`,fullPage:true});
      if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`Overflow ${slug} ${width}`);
    }
  }
  await page.goto('http://127.0.0.1:4322/showcase/creative-operations-lab/');
  await page.getByRole('button',{name:'Approve current revision'}).click();
  await page.getByLabel('Physical sample accepted').check();
  await page.getByLabel('Fulfillment verified').check();
  if(!(await page.locator('output').innerText()).startsWith('Ready for a human'))throw Error('Missing ready state');
  await page.getByRole('button',{name:'Revise concept'}).click();
  if(!(await page.locator('output').innerText()).includes('approve this exact revision'))throw Error('Stale approval accepted');
  if(await page.getByLabel('Physical sample accepted').isChecked())throw Error('Stale evidence retained');
  await page.getByRole('button',{name:'Reset demonstration'}).click();
  if(!(await page.locator('#revision').innerText()).includes('revision 1'))throw Error('Reset failed');
  console.log('Desktop/mobile overflow, approval invalidation, evidence reset, and reset passed.');
} finally {await browser.close();}
execFileSync('pdftotext',[pdf,`${out}/resume.txt`]);
execFileSync('pdftoppm',['-scale-to','1400','-png',pdf,`${out}/resume`]);
console.log(execFileSync('pdfinfo',[pdf],{encoding:'utf8'}).split('\n').filter(x=>/Pages:|Page size:/.test(x)).join('\n'));
