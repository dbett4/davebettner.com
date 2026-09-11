"""Self-contained native browser checks for the private profile revision."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from urllib.parse import urlparse
import json,hashlib,re,os
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1];dist=root/'dist';out=root/'node_modules/.cache/site-qa';out.mkdir(parents=True,exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,format,*args):pass
base=os.environ.get('SITE_URL','').rstrip('/');server=None
if not base:
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(dist)));thread=Thread(target=server.serve_forever,daemon=True);thread.start()
 base=f'http://127.0.0.1:{server.server_port}'
checks=[];errors=[];links=set()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);context=browser.new_context();page=context.new_page()
  page.on('pageerror',lambda e:errors.append(str(e)))
  routes=sorted('/'+str(f.relative_to(dist)).replace('index.html','') for f in dist.rglob('index.html') if '/lab/' not in str(f))
  for width in [1440,768,390,320]:
   page.set_viewport_size({'width':width,'height':950 if width==1440 else 844})
   for route in routes:
    res=page.goto(base+route,wait_until='networkidle');assert res and res.status==200,route
    page.evaluate('document.fonts.ready');assert page.evaluate('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)'),route
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(route,width,'overflow')
    assert page.locator('h1').count()==1 and page.locator('main').count()==1,route
    assert page.locator('meta[name=robots]').get_attribute('content')=='noindex, nofollow',route
    assert page.locator('form,input,textarea,canvas').count()==0,route
    text=page.locator('body').inner_text()
    assert not re.search(r'[\u2190-\u21ff]|0-to-1|FIRST 90 DAYS|PROOF TRAVELS|^0[1-9]$',text,re.M),route
    assert page.locator('.eyebrow,.section-index,.rule-number').count()==0
    if width in [1440,390]:
     page.add_script_tag(path=str(root/'node_modules/axe-core/axe.min.js'))
     audit=page.evaluate("async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))}")
     assert not audit,(route,width,audit)
    for href in page.locator('a[href]').evaluate_all('(es)=>es.map(e=>e.getAttribute("href"))'):
     if href.startswith('/') and not href.startswith('//'):links.add(href)
    if width==1440:
     (out/((route.strip('/').replace('/','-') or 'home')+'.txt')).write_text(text)
    if width in [1440,390] and route in ['/','/experience/','/experience/connected-reporting/','/fit/','/work/','/about/','/work/accounting-acceptance-lab/']:
     name=route.strip('/').replace('/','-') or 'home';page.screenshot(path=str(out/f'{name}-{width}.png'),full_page=True)
    checks.append({'route':route,'width':width,'status':res.status})
  for link in sorted(links):
   assert context.request.get(base+link).status==200,link
  page.goto(base+'/');page.keyboard.press('Tab');assert page.locator('.skip').evaluate('(e)=>e===document.activeElement');page.keyboard.press('Enter');assert page.evaluate('location.hash')=='#main'
  with page.expect_download() as event:page.get_by_role('link',name='Download résumé',exact=True).click()
  download=event.value;pdf=Path(download.path()).read_bytes();assert hashlib.sha256(pdf).hexdigest()==hashlib.sha256((root/'resume/dave-bettner-current.pdf').read_bytes()).hexdigest()
  assert page.get_by_role('link',name='Get in touch').get_attribute('href')=='mailto:dbett4@gmail.com'
  page.get_by_role('link',name='Experience',exact=True).click();assert page.url.endswith('/experience/')
  page.goto(base+'/lab/accounting-acceptance/');page.wait_for_url('**/work/accounting-acceptance-lab/')
  assert context.request.get(base+'/not-a-page/').status==404
  assert context.request.get(base+'/mockups/').status==404
  nojs=browser.new_context(java_script_enabled=False,reduced_motion='reduce',viewport={'width':390,'height':844});np=nojs.new_page();np.goto(base+'/')
  scene=np.locator('img.scene-render')
  assert scene.count()==1 and scene.is_visible()
  assert scene.get_attribute('src')=='/images/dave-workstation-transparent.webp'
  assert scene.evaluate('(e)=>e.complete&&e.naturalWidth===1000&&e.naturalHeight===1000')
  assert scene.evaluate('(e)=>e.getBoundingClientRect().width>=innerWidth*1.05&&e.getBoundingClientRect().width<=innerWidth*1.2'), 'Intentional larger mobile illustration'
  assert np.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'Large illustration must not create page overflow'
  assert np.locator('.scene-wrap').evaluate('(e)=>getComputedStyle(e).maskImage==="none"'), 'Wrapper must not fade the dog'
  assert np.locator('.workstation-media').evaluate('(e)=>getComputedStyle(e).maskImage.includes("dave-workstation-soft-fade-mask.png")'), 'Source-coordinate soft fade is required'
  assert np.locator('video,canvas').count()==0
  assert np.evaluate('document.getAnimations().every(a=>a.playState!=="running")')
  assert np.locator('.hero h2').inner_text()=='I make financial systems work in the real world.';nojs.close()
  assert not errors,errors
  browser.close()
 result={'base':base,'route_width_checks':len(checks),'routes':len(routes),'local_destinations':len(links),'checks':checks,'keyboard_skip':'pass','resume_download_sha256':hashlib.sha256(pdf).hexdigest(),'nojs_reduced_motion':'pass','errors':errors}
 (out/'checks.json').write_text(json.dumps(result,indent=2));print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))
finally:
 if server:server.shutdown();server.server_close()
