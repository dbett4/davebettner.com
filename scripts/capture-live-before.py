from pathlib import Path
import json,hashlib
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]; out=root/'review/ramp/before';out.mkdir(parents=True,exist_ok=True)
rows=[]
with sync_playwright() as p:
 b=p.chromium.launch();page=b.new_page(viewport={'width':1440,'height':1000})
 for route in ['','work/','experience/','fit/','about/']:
  res=page.goto('https://davebettner.com/'+route,wait_until='networkidle');page.evaluate('document.fonts.ready')
  name=route.strip('/') or 'home';text=page.locator('body').inner_text();(out/f'{name}.txt').write_text(text)
  (out/f'{name}.html').write_bytes(res.body())
  page.screenshot(path=str(out/f'{name}-1440.png'),full_page=True)
  rows.append({'url':page.url,'status':res.status,'sha256':hashlib.sha256(res.body()).hexdigest()})
 page.set_viewport_size({'width':390,'height':844});page.goto('https://davebettner.com/',wait_until='networkidle');page.screenshot(path=str(out/'home-390.png'),full_page=True)
 b.close()
(out/'manifest.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows,indent=2))
