"""Package the tested static pages as one portable, offline review file."""
from pathlib import Path
import base64,json,re,mimetypes
from bs4 import BeautifulSoup
root=Path(__file__).resolve().parents[1];dist=root/'dist'
def uri(p):return 'data:'+str(mimetypes.guess_type(str(p))[0] or 'application/octet-stream')+';base64,'+base64.b64encode(p.read_bytes()).decode()
def css_inline(path):
 text=path.read_text()
 def replace(m):
  value=m.group(1).strip('"\'');p=dist/value.lstrip('/') if value.startswith('/') else path.parent/value
  return 'url('+uri(p)+')' if p.is_file() else m.group(0)
 return re.sub(r'url\(([^)]+)\)',replace,text)
pages={};home=None
for path in dist.rglob('index.html'):
 if '/lab/' in str(path):continue
 route='/'+str(path.relative_to(dist)).replace('index.html','')
 soup=BeautifulSoup(path.read_text(),'html.parser')
 for img in soup.find_all('img'):
  img['src']=uri(dist/img['src'].lstrip('/'));img.attrs.pop('srcset',None)
 for a in soup.find_all('a',href=True):
  if a['href'].endswith('.pdf') and a['href'].startswith('/'):
   a['href']=uri(dist/a['href'].lstrip('/'));a['download']='Dave Bettner Resume.pdf'
 assert soup.main is not None and soup.title is not None
 pages[route]={'main':str(soup.main),'title':soup.title.string}
 if route=='/':home=soup
assert home is not None and home.body is not None
for link in home.find_all('link'):
 if 'stylesheet' in link.get('rel',[]):
  style=home.new_tag('style');style.string=css_inline(dist/link['href'].lstrip('/'));link.replace_with(style)
 elif 'icon' in link.get('rel',[]):link['href']=uri(dist/link['href'].lstrip('/'))
 elif 'canonical' in link.get('rel',[]):link.decompose()
script=home.new_tag('script');script.string='const pages='+json.dumps(pages).replace('</','<\/')+''';
function navigate(route){const p=pages[route];if(!p)return;document.querySelector('main').outerHTML=p.main;document.title=p.title;document.querySelectorAll('.masthead nav a').forEach(a=>{if(a.getAttribute('href')===route)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});scrollTo(0,0);}
document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;const route=a.getAttribute('href');if(pages[route]){e.preventDefault();location.hash=route;navigate(route)}});
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));if(location.hash.startsWith('#/'))navigate(location.hash.slice(1));
''';home.body.append(script)
out=root/'review/ramp/Dave-Bettner-private-preview.html';out.write_text(str(home));print(out)
