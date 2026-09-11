import sharp from 'sharp';
const W=720,H=430;
const smooth=x=>(x=Math.max(0,Math.min(1,x)),x*x*(3-2*x));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const text=(x,y,s,fill='#253b45',size=17,weight=400)=>`<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}">${esc(s)}</text>`;
const rect=(x,y,w,h,fill,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const svg=body=>`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g font-family="DejaVu Sans, sans-serif">${body}</g></svg>`;

function spreadsheet(t){
  const scroll=32*smooth((t-.65)/.95);
  let out=rect(0,0,W,H,'#eef0ed')+rect(0,0,W,34,'#376a53')+text(18,24,'Budget · Saved','#f1f4ef',18,600);
  out+=rect(0,34,W,37,'#e9ece7')+text(18,60,'File    Home    Insert    Formulas    Data','#4d5650',17);
  out+=rect(0,71,W,42,'#f0f2ee')+rect(12,79,73,27,'#fafbf8','stroke="#bfc7bf"')+text(23,99,'D8','#445149',18);
  out+=rect(96,79,610,27,'#fafbf8','stroke="#bfc7bf"')+text(108,99,'fx   =B8-C8','#59655d',18);
  const cols=[0,38,323,460,589,720];
  out+=rect(0,113,W,26,'#dfe5df');
  ['','A','B','C','D'].forEach((s,i)=>out+=text((cols[i]+cols[i+1])/2-5,132,s,'#56625a',15));
  out+='<defs><clipPath id="grid"><rect x="0" y="139" width="720" height="253"/></clipPath></defs><g clip-path="url(#grid)">';
  const rows=[
    ['Monthly forecast','Actual','Budget','Change'],
    ['Revenue','248,000','240,000','8,000'],
    ['Direct costs','62,400','64,000','1,600'],
    ['Gross profit','185,600','176,000','9,600'],
    ['People','94,200','96,000','1,800'],
    ['Infrastructure','12,800','14,000','1,200'],
    ['Software','8,400','8,000','(400)'],
    ['Operations','15,700','16,000','300'],
    ['Net income','54,500','42,000','12,500'],
    ['Cash reserve','286,000','270,000','16,000']
  ];
  rows.forEach((row,i)=>{
    const y=139+i*32-scroll, heading=i===0;
    out+=rect(0,y,38,32,'#e7ebe5')+rect(38,y,682,32,heading?'#d7e2d6':i===8?'#e2e8dd':'#f7f8f3');
    out+=text(10,y+22,String(i+1),'#869084',15);
    out+=text(49,y+22,row[0],heading?'#3c5442':'#475247',20,heading||i===8?600:400);
    row.slice(1).forEach((v,j)=>out+=`<text x="${cols[j+3]-12}" y="${y+22}" text-anchor="end" fill="#4b574b" font-size="19" font-weight="${heading||i===8?600:400}">${v}</text>`);
    out+=`<path d="M0 ${y+32}H720" stroke="#ced6cc" stroke-width="1"/>`;
  });
  for(const x of cols)out+=`<path d="M${x} 139V490" stroke="#ccd4c9" stroke-width="1"/>`;
  out+=rect(589,139+7*32-scroll,131,32,'none','stroke="#3d7d50" stroke-width="2"');
  out+=rect(716,139+8*32-scroll-4,4,4,'#3d7d50');
  out+='</g>'+rect(0,392,W,38,'#e1e6de')+rect(32,392,148,34,'#f8f9f4')+text(49,416,'Forecast','#346746',19,600)+rect(32,426,148,3,'#487452')+text(203,416,'Actuals','#778171',18)+text(326,416,'Inputs','#778171',18);
  return glass(out,'light');
}

function coding(t){
  let out=rect(0,0,W,H,'#252a30')+rect(0,0,W,35,'#30353b');
  out+=text(18,24,'project / website','#a5afb8',18)+text(574,24,'main','#a4b7ae',17);
  out+=rect(0,35,41,362,'#282d33')+rect(12,53,17,21,'none','rx="2" stroke="#a4adb5" stroke-width="2"')+rect(13,96,16,16,'none','stroke="#76828d" stroke-width="2"')+rect(13,137,16,16,'none','rx="8" stroke="#76828d" stroke-width="2"');
  out+=rect(41,35,679,33,'#22272d')+rect(41,35,232,33,'#2b3036')+text(58,58,'workstation.astro','#c3ccd0',18);
  out+='<defs><clipPath id="code"><rect x="42" y="70" width="678" height="146"/></clipPath></defs><g clip-path="url(#code)" font-family="DejaVu Sans Mono, monospace">';
  const lines=[
    [['const ','#bd9ece'],['scene','#ced4db'],[' = createScene({','#ced4db']],
    [['  motion: ','#c1cad2'],['"subtle"','#b3c5a1'],[',','#c1cad2']],
    [['  duration: ','#c1cad2'],['4.8','#c5b794'],[',','#c1cad2']],
    [['  reduceMotion: ','#c1cad2'],['true','#c5b794']],
    [['});','#ced4db']],
    [['await ','#bd9ece'],['scene.render();','#b9cbdc']]
  ];
  const scroll=25*smooth((t-.8)/.85);
  lines.forEach((parts,i)=>{
    const y=94+i*25-scroll;out+=text(56,y,String(i+18),'#707d88',17);
    let x=95;for(const [s,color]of parts){out+=text(x,y,s,color,21);x+=s.length*12.65;}
  });
  out+='</g>'+rect(41,217,679,1,'#4b535b')+rect(41,218,679,35,'#292e34')+text(58,242,'Agent','#d8dcd9',21,600)+text(505,242,'Local workspace','#8f9b9f',16);
  out+=text(60,279,'✓ Read workstation.astro','#a8b8a4',18);
  out+=text(60,309,t<3.5?'Ready to edit the animation.':'Updating the animation timing…','#bfc8cc',20);
  const prompt='Keep the movement subtle.';
  const chars=t<2?0:Math.min(prompt.length,Math.floor((t-2)*21));
  out+=rect(57,330,644,49,'#30363d','rx="6" stroke="#66737b" stroke-width="1.5"')+text(72,361,'› '+prompt.slice(0,chars),'#dee2df',21);
  if(t>=2&&t<3.35&&Math.floor(t*4)%2===0)out+=rect(91+chars*11.4,341,2,22,'#b9cabe');
  out+=rect(0,397,W,33,'#34464e')+text(15,420,'main    ✓ 0 problems','#b6c8cb',16)+text(576,420,'Astro','#aabec4',16);
  return glass(out,'dark');
}

function glass(body,tone){
  const strength=tone==='light'?.035:.065;
  return svg('<defs><linearGradient id="reflection" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f7f5eb" stop-opacity="'+strength+'"/><stop offset=".55" stop-color="#d4dde3" stop-opacity="0"/><stop offset="1" stop-color="#0e1824" stop-opacity=".07"/></linearGradient></defs>'+body+rect(0,0,W,H,'url(#reflection)'));
}

function solve(A,b){
  for(let i=0;i<b.length;i++){
    let pivot=i;for(let j=i+1;j<b.length;j++)if(Math.abs(A[j][i])>Math.abs(A[pivot][i]))pivot=j;
    [A[i],A[pivot]]=[A[pivot],A[i]];[b[i],b[pivot]]=[b[pivot],b[i]];
    const v=A[i][i];if(Math.abs(v)<1e-9)throw new Error('Degenerate monitor plane');
    for(let k=i;k<b.length;k++)A[i][k]/=v;b[i]/=v;
    for(let j=0;j<b.length;j++)if(j!==i){const f=A[j][i];for(let k=i;k<b.length;k++)A[j][k]-=f*A[i][k];b[j]-=f*b[i];}
  }return b;
}
function inverse(quad){
  const A=[],b=[],uv=[[0,0],[W-1,0],[W-1,H-1],[0,H-1]];
  quad.forEach(([x,y],i)=>{const [u,v]=uv[i];A.push([x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]);b.push(u,v);});
  const h=solve(A,b);return(x,y)=>{const z=h[6]*x+h[7]*y+1;return[(h[0]*x+h[1]*y+h[2])/z,(h[3]*x+h[4]*y+h[5])/z];};
}
function inPoly(x,y,poly){let v=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)v=!v;}return v;}
const head=[[370,244],[384,245],[395,242],[403,241],[410,243],[418,241],[423,247],[423,260],[425,269],[424,283],[420,298],[368,298]];
export function screenMaps(size){
  return [ [[386,174],[554,201],[554,299],[386,270]], [[568,204],[756,242],[756,350],[568,304]] ].map((quad,index)=>{
    const map=inverse(quad),points=[];
    for(let y=Math.floor(Math.min(...quad.map(p=>p[1])));y<=Math.ceil(Math.max(...quad.map(p=>p[1])));y++)
      for(let x=Math.floor(Math.min(...quad.map(p=>p[0])));x<=Math.ceil(Math.max(...quad.map(p=>p[0])));x++){
        const [u,v]=map(x+.5,y+.5);
        if(u<0||u>=W-1||v<0||v>=H-1||(index===0&&inPoly(x,y,head)))continue;
        points.push({offset:(y*size+x)*3,u,v});
      }
    return points;
  });
}
export async function paintScreens(frame,t,maps){
  // Prefilter before projecting: direct 4:1 point sampling turns fine text into
  // sparkling broken strokes during a scroll. The mip level keeps glyphs stable.
  const tw=280,th=168;
  const textures=await Promise.all([spreadsheet(t),coding(t)].map(s=>sharp(Buffer.from(s)).resize(tw,th).removeAlpha().raw().toBuffer()));
  textures.forEach((pixels,index)=>{
    for(const p of maps[index]){
      const u=p.u*(tw-1)/(W-1),v=p.v*(th-1)/(H-1);
      const x=Math.floor(u),y=Math.floor(v),fx=u-x,fy=v-y;
      const a=(y*tw+x)*3,b=a+3,c=a+tw*3,d=c+3;
      for(let k=0;k<3;k++)frame[p.offset+k]=Math.round((pixels[a+k]*(1-fx)+pixels[b+k]*fx)*(1-fy)+(pixels[c+k]*(1-fx)+pixels[d+k]*fx)*fy);
    }
  });
}
export const screenSVGs = t => [spreadsheet(t), coding(t)];
