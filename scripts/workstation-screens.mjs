import sharp from 'sharp';
const W=720,H=430;
const smooth=x=>(x=Math.max(0,Math.min(1,x)),x*x*(3-2*x));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const text=(x,y,s,fill='#253b45',size=17,weight=400)=>`<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}">${esc(s)}</text>`;
const rect=(x,y,w,h,fill,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const svg=body=>`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g font-family="DejaVu Sans, sans-serif">${body}</g></svg>`;

function spreadsheet(t){
  const scroll=28*smooth((t-.75)/.7);
  let out=rect(0,0,W,H,'#f9fcfb')+rect(0,0,W,36,'#207353')+text(22,25,'Workbook','#fff',18,600)+text(533,24,'Saved · 100%','#d8eee3',14);
  out+=rect(0,36,W,39,'#eef4f0')+text(18,62,'File     Home     Insert     Data     Review','#43584e',16)+rect(18,82,61,24,'#fff','stroke="#cad8d0"')+text(28,100,'D12','#4f625a',14)+rect(88,82,614,24,'#fff','stroke="#cad8d0"')+text(99,100,'fx   =SUM(D5:D11)','#43564d',14);
  out+='<defs><clipPath id="grid"><rect x="0" y="139" width="720" height="250"/></clipPath></defs>';
  out+=rect(0,114,W,25,'#e9f0ec');
  const columns=[0,38,278,397,515,618,720];
  ['','A','B','C','D','E'].forEach((s,i)=>out+=text(columns[i]+(columns[i+1]-columns[i])/2-5,132,s,'#62756b',13));
  out+='<g clip-path="url(#grid)">';
  const labels=['OPERATING SUMMARY','Revenue','Direct costs','Gross margin','People','Infrastructure','Software','Operations','Total expenses','Operating result','Cash reserve','Forecast'];
  const amounts=[['Actual','Budget','Variance',''],['248,000','240,000','8,000',''],['62,400','64,000','1,600',''],['185,600','176,000','9,600',''],['94,200','96,000','1,800',''],['12,800','14,000','1,200',''],['8,400','8,000','(400)',''],['15,700','16,000','300',''],['131,100','134,000','2,900',''],['54,500','42,000','12,500',''],['286,000','270,000','16,000',''],['Stable','Stable','—','']];
  for(let i=0;i<labels.length;i++){
    const y=139+i*28-scroll;
    out+=rect(0,y,38,28,'#eef3f0')+rect(38,y,682,28,i===0?'#dbeae2':i%2?'#fff':'#f7faf8');
    if(i===9)out+=rect(38,y,682,28,'#e6f1ea');
    out+=text(10,y+19,String(i+1),'#789084',13)+text(49,y+19,labels[i],i===0?'#28533f':'#354f43',i===0?15:16,i===0||i===9?600:400);
    amounts[i].forEach((v,j)=>out+=text(columns[j+2]+10,y+19,v,i===0?'#466151':j===2?'#247c58':'#354f43',15,i===0?600:400));
    out+=`<path d="M0 ${y+28}H720" stroke="#dce5df" stroke-width="1"/>`;
  }
  for(const x of columns)out+=`<path d="M${x} 139V510" stroke="#dae4de" stroke-width="1"/>`;
  out+=rect(515,139+5*28-scroll,103,28,'none','stroke="#2e8b62" stroke-width="2"');
  out+='</g>'+rect(0,390,W,40,'#edf3ef')+rect(41,390,143,35,'#fff')+text(57,414,'Summary','#21734f',16,600)+text(206,414,'Monthly','#75877c',15)+text(324,414,'Forecast','#75877c',15)+rect(42,424,142,3,'#2f855d');
  return svg(out);
}

function coding(t){
  let out=rect(0,0,W,H,'#142028')+rect(0,0,W,33,'#1c2b35')+text(17,23,'WORKSPACE','#879ba8',13,600)+text(258,23,'WorkstationMedia.astro','#e0e9ee',14)+text(638,23,'main','#8db7a6',13);
  out+=rect(0,33,152,370,'#17252e')+text(14,65,'EXPLORER','#79919e',12,600);
  ['src','  components','    Profile.astro','    Workstation…','  styles','    theme.css','public','  images','  video'].forEach((s,i)=>out+=text(14,93+i*25,s,i===3?'#b7e1d0':'#8ca3af',13,i===3?600:400));
  out+=rect(155,33,565,30,'#17252f')+text(173,54,'WorkstationMedia.astro','#becfd8',13);
  out+='<defs><clipPath id="code"><rect x="157" y="67" width="563" height="182"/></clipPath></defs><g clip-path="url(#code)" font-family="DejaVu Sans Mono, monospace">';
  const lines=[['const',' video = root.querySelector(\'video\');'],['const',' motion = matchMedia('],['','  \'(prefers-reduced-motion: reduce)\''],['',');'],['function',' syncPlayback() {'],['  if',' (motion.matches || document.hidden) {'],['','    video.pause();'],['  } else',' {'],['','    video.play();'],['','  }'],['','}']];
  const scroll=22*smooth((t-1.1)/.65);
  lines.forEach(([a,b],i)=>{const y=87+i*22-scroll;out+=text(168,y,String(i+12),'#4e6877',12)+text(204,y,a,'#a4baf3',13)+text(204+a.length*7.85,y,b,a===''?'#a6c9bb':'#c2d1d9',13);});
  out+='</g>'+rect(157,250,563,1,'#31434e')+text(175,275,'AGENT','#a5cbbf',13,600)+text(605,275,'Local','#6f8d9d',12);
  const prompt='Refine the seated animation timing.';
  const chars=t<2?0:Math.min(prompt.length,Math.floor((t-2)*26));
  out+=rect(172,287,529,40,'#1d303b','rx="5" stroke="#3b5663"')+text(184,313,'› '+prompt.slice(0,chars),'#d5e2e8',15);
  if(t>=2&&t<3.35&&Math.floor(t*3)%2===0)out+=rect(201+chars*7.8,299,2,16,'#a1d7c3');
  out+=text(180,351,t<3.4?'Ready for your next change':'Reading WorkstationMedia.astro','#8da4b2',13);
  if(t>=3.9)out+=text(180,376,'✓ Motion preferences respected','#97c6ae',13);
  out+=rect(0,403,W,27,'#213c47')+text(14,421,'main   ✓ 0 issues','#b8d4d9',12)+text(552,421,'Astro   UTF-8','#a4c2cb',12);
  return svg(out);
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
