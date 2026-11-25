import React from 'react';
import {hull, u} from './motion.cjs';

export const ink='#263e43', dark='#28484b', cream='#fff0ce', rust='#c4533e', teal='#467f78';
const seq=(n,fn)=>Array.from({length:n},(_,i)=>fn(i));
export function PaintDefs(){return <defs>
  <linearGradient id="sky" x2="0" y2="1"><stop stopColor="#c1d5ce"/><stop offset=".52" stopColor="#f4dfb7"/><stop offset="1" stopColor="#f8d5a5"/></linearGradient>
  <linearGradient id="river" x2=".12" y2="1"><stop stopColor="#aad1bb"/><stop offset=".38" stopColor="#83b6ae"/><stop offset="1" stopColor="#428783"/></linearGradient>
  <linearGradient id="hullShade" x2=".2" y2="1"><stop stopColor="#44756c"/><stop offset="1" stopColor="#285755"/></linearGradient>
  <linearGradient id="glass" x2=".8" y2=".6"><stop stopColor="#51817e"/><stop offset="1" stopColor="#9aba9d"/></linearGradient>
  <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(32)"><path d="M0 0V5" stroke="#204643" strokeWidth=".7" opacity=".28"/></pattern>
  <pattern id="woodgrain" width="63" height="12" patternUnits="userSpaceOnUse"><path d="M0 2Q11 0 28 2 T58 2 M4 8q12 -3 27 0m3 0q12 2 25 -1" fill="none" stroke="#805a43" strokeWidth=".7" opacity=".56"/></pattern>
  <pattern id="mesh" width="5" height="6" patternUnits="userSpaceOnUse"><path d="M0 0l5 6M5 0L0 6" fill="none" stroke="#345954" strokeWidth=".7"/></pattern>
 </defs>;}
const skyline=[[15,27,56],[70,35,37],[113,24,47],[171,31,63],[212,38,34],[246,29,54],[283,15,58],[337,36,34],[371,26,45],[406,29,36],[512,32,33],[548,22,41],[650,43,34],[688,26,43],[722,30,36],[767,18,40],[950,28,36],[1004,32,48],[1040,28,42],[1083,40,36],[1160,26,31]];
function Town(){return <g>
  {skyline.map(([x,w,h],i)=>{const y=294-h;return <g key={x} transform={'translate('+x+' '+y+')'}><path d={'M0 0h'+w+'v'+h+'H0Z'} fill={['#cdbfa4','#e7caab','#d6cbb5','#ded1ac'][i%4]}/><path d={'M-2 0l'+(w*.39)+' -'+(7+i%8)+' L'+(w+2)+' 0Z'} fill={['#b38471','#b99780','#94a291'][i%3]}/>{seq(Math.floor(w/8),(j)=><g key={j} fill="#8e9e8c"><path d={'M'+(3+j*8)+' 8h2.4v5h-2.4z'}/><path d={'M'+(3+j*8)+' 21h2.4v4h-2.4z'}/></g>)}</g>})}
  <g fill="#8aaba1" stroke="#8aaba1" strokeWidth="1.3"><path d="M850 276v-69l-5-2 10-7 3 9-3 2v67Z"/><path d="M849 207l-52 16 50-22 28 4-1 3-20-2m-53 15v17" fill="none"/><path d="M898 277v-58l-3-5 6-6 5 8-3 4v56Zm2-63-41 10 39-14 27 3-1 4z"/></g>
 </g>;}
const Backdrop=React.memo(function Backdrop(){return <g>
  <rect x="-1200" y="-800" width="3600" height="1180" fill="url(#sky)"/>
  <circle cx="812" cy="142" r="48" fill="#fff0c2"/><circle cx="812" cy="142" r="53" fill="none" stroke="#fae7bd" strokeWidth="1.5"/>
  <g fill="#fff0d4" opacity=".71"><path d="M29 121q32-8 64-5 11-19 35-14 15-11 33 5 31-3 39 5l37 7Z"/><path d="M498 96q25-3 48-3 14-12 27-7 18-11 37 4 23-1 32 5Z"/><path d="M960 114q35-13 63-8 21-22 48-11 27-8 42 6l49 10Z"/></g>
  <path fill="#d5c5ab" d="M-800 273Q-130 252 63 212Q143 169 226 200T388 216Q493 185 573 207Q655 222 749 192T911 184Q1004 201 1113 171T1450 200L2400 267V330H-800Z"/>
  <path fill="#adbaaa" d="M-600 280Q-75 270 82 238Q166 216 223 239T365 235Q435 204 504 223Q578 243 657 222T809 227Q914 245 1023 213T1198 217L1560 258V310H-600Z"/>
  <path fill="#96ada1" d="M-300 274Q21 251 94 255T251 252Q331 235 415 252T589 248Q685 237 790 252T1011 245Q1130 234 1290 253V280H-300Z"/>
  <Town/>
  <g fill="#829d91"><path d="M-20 282q22-23 34-13 11-25 27-5 16-20 32 4 19-18 37 3 24-14 40 7v13H-20Zm293 1q18-34 32-17 13-23 29-3 15-17 32 5 23-15 37 6l46 7v13h-176Zm310-3q22-21 38-14 10-16 26-6 13-20 30-4 16-10 31 5 15-12 35 12l28 5v13H583Z"/></g>
  <path d="M-800 293C-200 290 89 287 222 291S489 288 650 291s355-5 533-1 506-5 1100-1v11H-800Z" fill="#718f85"/>
  <path d="M-700 295H2000" stroke="#eddeb7" strokeWidth="2.5"/>
 </g>;});
function Swallow({x,y,s=1,angle=0,phase=0,color='#3a514e'}) {
  const a=Math.sin(phase)*3.4;
  return <g transform={'translate('+x+' '+y+') rotate('+angle+') scale('+s+')'} fill={color}>
   <path d={'M2 0Q-3 '+(-5+a)+' -16 '+(-11+a*1.9)+'Q-9 '+(-2+a*.35)+' -3 2L-10 8l8-4 2 1 4-6 8-2-6-.4Z'}/>
  </g>;
}
export {Swallow};
const riverLines=Array.from({length:160},(_,i)=>{const noise=n=>{const v=Math.sin(n*78.233+12.9898)*43758.5453;return v-Math.floor(v);};const y=298+Math.pow(noise(i+77),1.3)*298;return {x:-400+noise(i+390)*2070,y,w:5+noise(i+544)*(7+(y-295)*.15),p:noise(i+200)*6,light:i%4!==0};});
function River({t}){return <g>
  <rect x="-900" y="296" width="3600" height="990" fill="url(#river)"/>
  <path d="M-900 298q700 10 942 2t472 0q241 6 410-1l760-2v5q-329-4-489 2t-376 2q-152-4-333 2t-492 0-894 5z" fill="#c9d5b7" opacity=".8"/>
  {riverLines.map(({x,y,w,p,light},i)=>{const dx=Math.sin(t*(.23+(i%3)*.09)+p)*(1+(y-295)*.014);return <path key={i} d={'M'+(x+dx)+' '+y+'q'+w*.2+' -1.1 '+w*.52+' -.2t'+w*.48+' -.5'} fill="none" stroke={light?'#ebdfb5':'#3b8a89'} opacity={light?.48:.34} strokeWidth={.62+(y-295)/270} strokeLinecap="round"/>;})}
  {seq(17,i=><path key={i} d={'M'+(808+Math.sin(i*8.1+t*.32)*(6+i*1.8)-i*1.1)+' '+(300+i*3.8)+'q'+(7+i*.7)+' -1 '+(22+i)+' 0'} fill="none" stroke="#f6deb0" opacity={.59-i*.015} strokeWidth="1.6"/>)}
 </g>;}
function HarborDetail({t}){return <g>
  <g transform="translate(152 273)" stroke="#899c8d" strokeWidth="1.4" fill="none"><path d="M-114 7h227M-113 3h227M-106 4v12m33-12v13m34-13v13m35-13v13m33-13v13m33-13v13m34-13v13"/></g>
  <g transform={'translate('+(175+t*.21)+' 306)'}><path d="M-18-2h35l-6 5h-23Z" fill="#7f9990"/><path d="M0-32V-2h-15Z" fill="#e7d7b6"/><path d="M2-25V-2h10Z" fill="#cead8f"/></g>
 </g>;}
export function Landscape({t}){return <><Backdrop/><River t={t}/><HarborDetail t={t}/></>;}
export const Dock=React.memo(function Dock(){return <g>
  <path d="M-700 444H470l-8 8h-92l-49 32-16-3 36-28H-700Z" fill="#4c635a"/>
  {[-80,91,230,394,454].map((x,i)=><g key={x}><path d={'M'+(x-7)+' 435h15l-2 81-5 15-7-22Z'} fill={i%2?'#5a6c5c':'#677562'}/><path d={'M'+(x+2)+' 453v48m-5-24v20'} stroke="#395f59" strokeWidth="1.1"/><path d={'M'+(x-6)+' 490q8 4 14-1'} stroke="#acc3a6" fill="none" strokeWidth="2"/></g>)}
  <path d="M-700 420H473v18l-5 5H-700Z" fill="#b98c65"/><path d="M-700 429q683 1 1173-1v10H-700Z" fill="#a47858"/><path d="M-700 423H471v16H-700Z" fill="url(#woodgrain)"/>
  <path d="M-700 416l1164-1 12 4-4 4H-700Z" fill="#debb8b"/><path d="M-700 422H474" stroke="#715b48" strokeWidth="1.7"/>
  {seq(21,i=><g key={i} transform={'translate('+(i*29-126)+' 0)'}><path d="M0 416l-5 4m-1 3v9" stroke="#906f53" strokeWidth="1"/>{i%2===0&&<circle cx="2" cy="432" r="1.15" fill="#6d6250"/>}</g>)}
  <g transform="translate(453 415)"><path d="M-9 0h19l-2-4-4-1v-11q5-2 5-4-8-5-17 0 0 2 5 4v11l-5 1Z" fill="#475952"/><path d="M-5-18q5-2 11 0" fill="none" stroke="#90a288" strokeWidth="1.4"/></g>
  <path d="M49 413q9-10 22-5l13 5m-33 1q14-8 29-1" fill="none" stroke="#83744e" strokeWidth="3"/>
 </g>;});
export function Ring({x,y,r=14}){return <g transform={'translate('+x+' '+y+')'} fill="none"><circle r={r+3} stroke="#486761" strokeWidth="1"/><circle r={r} stroke="#f3ddb5" strokeWidth={r*.39}/>{[20,110,200,290].map(a=><path key={a} transform={'rotate('+a+')'} d={'M0 '+(-r)+'A'+r+' '+r+' 0 0 1 '+(r*.42)+' '+(-r*.908)} stroke="#c9684d" strokeWidth={r*.41}/>)}</g>;}
const BoatArt=React.memo(function BoatArt(){return <g>
  <path d="M606 423q39 4 89 3l229-1q68-1 119-22l-9 30q-21 35-57 42H664q-36-4-49-21Z" fill="url(#hullShade)"/>
  <path d="M616 448q113 11 251 4t165-22l-4 7q-65 24-191 23t-216-4Z" fill="#e2b87f"/>
  <path d="M626 458q129 12 255 3t145-18q-14 23-48 32H664q-27-4-38-17Z" fill="#af6650"/>
  <path d="M611 431q116 12 254 4t176-26" fill="none" stroke="#6f9b87" strokeWidth="4"/>
  <path d="M603 421q36 4 91 3l217-1q71 1 134-22l-.5 7q-62 23-137 22l-217 1q-49 1-87-4Z" fill="#d3a776" stroke="#4e6659" strokeWidth="1.2"/>
  {seq(24,i=><circle key={i} cx={623+i*16} cy={442+Math.sin(i*.19)*2-Math.max(0,i-17)**1.45} r="1" fill="#a1ab8c"/>)}
  <path d="M765 424v-55h65l9 55Z" fill="#c9b789"/><path d="M769 372h53v48h-53Z" fill="#98a990"/><path d="M775 379h18v31h-18Zm22 0h20v31h-20Z" fill="#52756d"/>
  <path d="M787 371l5-63q72-11 151-1l24 62Z" fill="#f0d6ad" stroke="#586c5c" strokeWidth="1.4"/>
  <path d="M788 311q68-14 156-2l-3-7q-76-13-147-1Z" fill="#b9644c"/><path d="M787 310q77-12 159 0" fill="none" stroke="#795f48" strokeWidth="2"/>
  {[0,1,2,3].map(i=><g key={i} transform={'translate('+(800+i*37)+' 316)'}><path d={i===3?'M0 0h23l10 32H0Z':'M0 0h29v32H0Z'} fill="url(#glass)" stroke="#647d6e" strokeWidth="2"/><path d="M4 25l11-19m-5 23L22 8" fill="none" stroke="#c4c7a3" opacity=".60" strokeWidth="1.4"/></g>)}
  <path d="M785 353l175-1 7 18H784Z" fill="#edd0a7"/><path d="M777 368q93-4 194 0v4H777Z" fill="#846f56"/><path d="M823 372h140v52H823Z" fill="#779b83"/>
  <path d="M839 376h44v47h-44Z" fill="#e5c69a"/><path d="M844 379h34v19h-34Z" fill="url(#glass)"/><circle cx="875" cy="407" r="1.7" fill="#4d6256"/><Ring x={923} y={395} r={15}/>
  <path d="M855 298l-3-27h21l5 28Z" fill="#4f7770"/><path d="M852 278l21-1 1 6-22 1Z" fill="#d48c66"/><path d="M851 271h23l-1-4-22 1Z" fill="#4d605a"/>
  <g fill="none" stroke="#687b68" strokeWidth="2"><path d="M968 416v-24l65-14v24m-44 9v-24m22 19v-24"/><path d="M968 398l66-14"/></g>
  <path d="M720 426v-24h43v24" fill="#b78e63" stroke="#725f4b" strokeWidth="1.4"/><path d="M717 399h49v4h-49Z" fill="#e0b781"/><path d="M725 407h33m-34 7h34" stroke="#8e7454" strokeWidth="1"/>
  <g fill="#334f4e"><ellipse cx="702" cy="447" rx="5.2" ry="13" transform="rotate(9 702 447)"/><ellipse cx="983" cy="440" rx="5.2" ry="13" transform="rotate(-13 983 440)"/></g>
 </g>;});
export function Boat({t}) {const b=hull(t),wind=Math.sin(t*3.4);
 return <g transform={'translate('+b.x+' '+b.y+')'}>
  <path d="M603 478q92 5 170 6 142 5 232-11-64 18-155 18-69 2-124-3l-40-2 8-1q-49-1-91-7Z" fill="#3f827d" opacity=".37"/>
  {t>79.7&&[0,1,2,3,4].map(i=><path key={i} d={'M'+(627-i*5)+' '+(476+i*2)+'q-33 10 '+(-25-Math.min(120,b.x)*(.63+i*.11))+' '+(5+i)} fill="none" stroke="#d5debc" strokeWidth={2.3-i*.22} opacity={u(79.7,83,t)*(.8-i*.1)}/>)}
  <BoatArt/><path d="M966 307v-63" stroke="#816b50" strokeWidth="2"/><circle cx="966" cy="244" r="2.4" fill="#ba8d67"/>
  <path d={'M966 246q-10 '+(4+wind*4)+' -18 2t-17 '+(4+wind*3)+'q15 1 16 3t19 1Z'} fill="#c97052"/>
 </g>;}
export function Gulls({t}){const v=u(80,89.7,t);return <g>
 {[0,1,2].map((d)=><Swallow key={d} x={220+d*24+t*.55} y={172+d%2*8-Math.sin(t*.4+d)*2} phase={t*3+d} s={.32-d*.03} color="#8e9c8a"/>)}
 {t>=80&&<><Swallow x={369+v*471} y={241-v*90-25*Math.sin(Math.PI*v)} angle={-9+v*14} s={.91} phase={t*5.2}/><Swallow x={345+v*467} y={259-v*91-30*Math.sin(Math.PI*v)} angle={-14+v*15} s={.64} phase={t*5.9+1.8}/></>}
 </g>;}
