import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>fs.readFileSync(p,'utf8');
test('public identity reflects current accounting consulting resume, not former FDE targeting',()=>{
 const home=read('dist/index.html');
 assert.match(home,/Financial systems consulting/);
 assert.match(home,/accounting firms/);
 assert.doesNotMatch(home,/0-to-1|PROOF TRAVELS|Operating rules|FIRST 90 DAYS/);
 for(const route of ['','experience/','work/','fit/','about/']){
  const page=read('dist/'+route+'index.html');
  assert.match(page,/noindex, nofollow/);
  assert.doesNotMatch(page,/class="(?:eyebrow|section-index|rule-number)"/);
 }
});
test('download is the supplied resume, not silently regenerated old copy',()=>{
 const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 assert.equal(hash('public/dave-bettner-resume.pdf'),hash('/home/dave/.hermes/profiles/design-partner/attachments/Dave Bettner Resume.pdf'));
});
