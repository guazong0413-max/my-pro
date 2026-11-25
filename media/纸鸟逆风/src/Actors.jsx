import React from 'react';
import {child,adult,solve,pt,at,u,toWorld,wrist,rim} from './motion.cjs';
import {ink} from './Harbor';

const jointPath=(a,b,c)=>'M'+a.x+' '+a.y+'Q'+b.x+' '+b.y+' '+b.x+' '+b.y+'L'+c.x+' '+c.y;
function Boots({x,y,adult:grown,far}) {const fill=grown?(far?'#394b47':'#374c48'):(far?'#47726a':'#407c73');
 return <g transform={'translate('+x+' '+y+')'}><path d={grown?'M-4-6h8l1 5 8 1q4 1 4 4H-6l-.4-4Z':'M-5-12h9l.3 10 6 1q3 .5 4 4H-6l-.5-4Z'} fill={fill}/>
 <path d={grown?'M-6 3h22v1H-6Z':'M-6 2h20v2H-6Z'} fill={grown?'#293e3d':'#a3794e'}/>
 <path d={grown?'M5 0l4 .3':'M-4-10h7'} stroke={grown?'#a79a7b':'#9cb799'} strokeWidth="1.2"/></g>;
}
function Legs({a,grown}){return a.feet.map((foot,i)=>{
 const hip=pt(a.hip.x+(i===0?-4:2),a.hip.y);
 const pose=solve(hip,foot,grown?27:20,grown?27:20,-1);
 return <g key={i}><path d={jointPath(hip,pose.joint,pose.end)} stroke={grown?(i?'#3f6967':'#365657'):(i?'#654c47':'#564643')} strokeWidth={grown?13:9} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
 {!grown&&<path d={'M'+(foot.x-3.5)+' '+(foot.y-9)+'h7m-7 3h7'} stroke="#e1bb84" strokeWidth="1.5"/>}
 <Boots x={foot.x} y={foot.y} adult={grown} far={!i}/></g>;
 });}
function Palm({point,grown,far=false}) {return <g transform={'translate('+point.x+' '+point.y+')'}><path d={grown?'M-3.4-2.8q1.3-2.6 4-.8l2.7.2q2.8 1.2 1.6 4.1-1.3 2.6-4.2 2.7-3.8.2-4.3-3Z':'M-3.2-2.5q1.1-2.2 3.3-1.1 1.8-.9 3.1 1.3 2.4 4-1.4 5.6-3.8 1.6-5.4-1.7Z'} fill={grown?(far?'#bb825f':'#d6996f'):(far?'#d69b76':'#edb38a')}/></g>;}
function Arm({a,grown,far=false}) {const s=far?a.farShoulder:a.shoulder,arm=far?a.backArm:a.arm,k=arm.joint,e=arm.end;
 const sleeve=grown?(far?'#bdba96':'#e8dbb5'):(far?'#c88548':'#e5a54c');
 const end=pt(e.x+(k.x-e.x)*.2,e.y+(k.y-e.y)*.2);
 const rolled=pt(s.x+(k.x-s.x)*.80,s.y+(k.y-s.y)*.80);
 const band=pt(s.x+(k.x-s.x)*.96,s.y+(k.y-s.y)*.96);
 return <g>{grown?<><path d={jointPath(rolled,k,e)} fill="none" stroke={far?'#b87c58':'#cf9168'} strokeWidth="7.1" strokeLinejoin="round" strokeLinecap="round"/>
 <path d={'M'+s.x+' '+s.y+'L'+rolled.x+' '+rolled.y} stroke={sleeve} strokeWidth="10.1" strokeLinecap="round"/>
 <path d={'M'+rolled.x+' '+rolled.y+'L'+band.x+' '+band.y} stroke={far?'#85978a':'#9da995'} strokeWidth="10.25" strokeLinecap="butt"/></>:
 <><path d={jointPath(s,k,end)} fill="none" stroke={sleeve} strokeWidth="9.4" strokeLinejoin="round" strokeLinecap="round"/>
 <path d={'M'+(end.x+(k.x-end.x)*.18)+' '+(end.y+(k.y-end.y)*.18)+'L'+end.x+' '+end.y} stroke={far?'#b47842':'#cc8b40'} strokeWidth="9.45" strokeLinecap="butt"/></>}
 <Palm point={e} grown={grown} far={far}/></g>;
}
function shut(t,when){let v=0;for(const s of when)v=Math.max(v,Math.max(0,1-Math.abs(t-s)/.125));return v;}
function ChildHead({t,a}){
 const dip=at(t,[[0,10],[9,4],[13.4,-7],[16,-12],[21,4],[23.2,18],[40,12],[44,9],[48.8,1],[69,-8],[75,-9],[77,10],[82,13],[84,-7],[90,-8]]);
 const hopeful=u(73,76.6,t),worried=u(18,22.5,t)*(1-u(47.3,66,t)),blink=shut(t,[2.45,7.4,12.2,22.14,24.85,31.2,44.62,47.46,68.1,76.16,84.9]);
 const eyeY=-2+.9*Math.sin(dip*Math.PI/30);
 return <g transform={'translate('+(a.lean+1)+' '+(-91+a.h)+') rotate('+dip+' 0 7)'}>
 <path d="M-17 0q-3-20 13-24 15-4 23 10 3 6 0 14l-5 13-20 2-13-7Z" fill="#523f3d"/>
 <path d="M-12-8q8-10 22-7 8 4 8 13l4.6 3.1q1 1.8-3.7 3l-1.6 5q-.5 6-5.7 7-6 2-13.4-3l-5 5-5-3 1-11Z" fill="#efb58c"/>
 <path d="M-16-12q8-13 22-10 14 3 14 12-5 2-10-5 0 5-2 8-3-2-5-8-.4 7-5 11-2-1-2-4l-4 6-5 4-2 7-6-6q-4-6 3-15Z" fill="#4a3a37"/>
 <path d="M-14-13q8-8 16-8m-19 15q2-6 6-9" fill="none" stroke="#886650" strokeWidth="1.2" strokeLinecap="round"/>
 <path d="M-12 0q-7-3-6 3 .3 6 7 6" fill="#e8a67d"/><path d="M-16 3q3-2 4 2" fill="none" stroke="#bd815e" strokeWidth=".8"/>
 <path d={'M7 '+(-5.7-worried*1.3)+'q3-2.3 7 '+(-.2+worried*1.3)} fill="none" stroke="#61473b" strokeWidth="1.55" strokeLinecap="round"/>
 {blink>.62?<path d="M8 0q2.7 1.1 5-.4" fill="none" stroke="#523f37" strokeWidth="1.3"/>:<><ellipse cx={11.9+hopeful*.6} cy={eyeY} rx="1.57" ry={2.1-.65*blink} fill="#423b35"/><circle cx="12.2" cy={eyeY-.47} r=".42" fill="#f8e2c5"/></>}
 <ellipse cx="6.1" cy="5.7" rx="4.5" ry="2.2" fill="#db9273" opacity=".76"/>
 <path d={'M12.6 10q2.5 '+(hopeful?2.1:worried?-1.4:.35)+' 4.8 '+(hopeful?-1.1:.0)} fill="none" stroke="#a66556" strokeWidth="1.05" strokeLinecap="round"/>
 <path d="M-17-4q-7-6-10-1l3 5-5 1q2 6 11 3Z" fill="#af5345"/><path d="M-20 1q-11 3-9 12 4-4 6-1 4-3 5-11Z" fill="#503f3b"/>
 </g>;
}
function ChildBody({t,a}){const w=Math.sin(t*4.1);
 return <><path d={'M'+(a.lean-6)+' '+(-77+a.h)+'L'+(a.lean-4)+' '+(-86+a.h)+'l10-1 2 10Z'} fill="#dfa07a"/>
 <g transform={'translate('+a.lean*.4+' '+a.h+')'}><path d="M-9-77q8-6 17 .5l4 11 5 32q-12 6-34 .7l4-32Z" fill="#e9ab53"/>
 <path d="M-9-74q-3 19-7 41l5 1 8-41Z" fill="#cd8d48"/><path d="M-13-33q16 3 29-.4" stroke="#ae773e" strokeWidth="1.2" fill="none"/>
 <path d="M2-51l9-1-1 8q-5 3-8 .4Z" fill="#d89849" stroke="#a97742" strokeWidth=".7"/><path d="M4-51l6-.5" stroke="#f4c77b" strokeWidth="1.2"/>
 <path d="M9-65l4 27" stroke="#bd823f" strokeWidth=".75"/><circle cx="9.5" cy="-61" r="1" fill="#876e49"/>
 <path d={'M-7-77q-3 8-8 11t-8 '+(1+w*2)+'l4-5-4-1q7-4 12-12Z'} fill="#a94e42"/><path d="M-9-79q9 4 17 0l4 5q-12 5-21-.5Z" fill="#c8684f"/>
 </g></>;
}
function AdultHead({t,a}){const look=at(t,[[0,4],[23,4],[26.4,16],[31,20],[36,12],[39,9],[64,8],[67,-2],[69.6,-6],[75,-4],[83,-1],[90,-4]]);
 const blink=shut(t,[6.1,17.5,25.74,28.7,32.2,46.4,53.3,65.75,70.5,84.6]),smile=u(35,37,t);
 return <g transform={'translate('+(a.lean+1)+' '+(-114+a.h)+') rotate('+look+' 0 12)'}>
 <path d="M-12-13q14-13 25-1 4 5 3 14l6 5q1.5 2.3-4.3 3l-2 8q-2 5-9 4l-10-2-5 4-6-3 1-12q-9-10 1-20Z" fill="#d69a71"/>
 <path d="M-15-11q-4 5-2 13l3 4q-5 7-3 11l5 3 1-6q5-1 4-10l3-7Z" fill="#b9b6a0"/>
 <path d="M-13 3q-7-4-7 2t7 7" fill="#c78a66"/><path d="M-17 6q2-2 4 1" fill="none" stroke="#9e6c52"/><circle cx="-13" cy="11" r="2.3" fill="none" stroke="#eab660" strokeWidth="1.2"/>
 <path d="M-20-9q-1-19 12-23 19-5 26 15l-1 8Z" fill="#3b6460"/><path d="M-19-10q13-8 37-3l2 6q-19-3-38 4Z" fill="#314f4e"/>
 <path d="M-18-8q18-6 36-3" stroke="#bb7857" strokeWidth="2.4" fill="none"/>
 <path d="M-13-17q1-8 5-12m4 10q1-8 3-12m4 11q0-6-1-10m8 11-3-8" fill="none" stroke="#638078" strokeWidth="1.1"/>
 <path d="M4-1q4-3 9-1.8" fill="none" stroke="#766657" strokeWidth="2" strokeLinecap="round"/>
 {blink>.6?<path d="M6 3q4 1.7 7-.5" fill="none" stroke="#564b3e" strokeWidth="1.2"/>:<ellipse cx="10.5" cy={3+look*.04} rx="1.6" ry="1.8" fill="#494439"/>}
<path d="M1 5l-3 1m4 1-2.2 2" stroke="#ac745d" strokeWidth=".78" fill="none"/>
 <path d={'M9 12q4 '+(smile?2.6:.6)+' 7 0'} stroke="#815b4d" strokeWidth="1.12" fill="none" strokeLinecap="round"/>
 </g>;}
function AdultBody({a}){return <g transform={'translate('+a.lean*.5+' '+a.h+')'}>
 <path d="M-8-97v-9l12-1 2 13Z" fill="#c68b65"/>
 <path d="M-15-93q10-7 24-1l8 46q-15 7-34-1Z" fill="#e6d8af"/>
 {[-85,-77,-69].map((y,i)=><path key={y} d={'M'+(-14+i*.1)+' '+y+'q11 2 25-.1'} fill="none" stroke="#667c71" strokeWidth="2.8"/>)}
 <path d="M-12-96l4-1 4 18 8 1 1-18 4 1 1 20 5 22 2 9q-18 6-35-1l3-22 6-5Z" fill="#47716b"/>
 <path d="M-5-68q7 1 12-.6l1 10q-7 4-13 0Z" fill="#527c70" stroke="#85a18a" strokeWidth="1"/><path d="M-15-49q16 4 30-.6" stroke="#789084" strokeWidth="1.1" fill="none"/>
 <circle cx="-6" cy="-77" r="1.25" fill="#d1a36e"/><circle cx="6.3" cy="-78" r="1.25" fill="#d1a36e"/>
 <path d="M-12-45q-2 6-2 12l8 2 3-13Z" fill="#3c605d"/>
 </g>;}
export function Actor({t,grown=false}){const a=grown?adult(t):child(t);
 return <g transform={'translate('+a.x+' '+a.y+') scale('+a.facing+' 1)'}>
 <ellipse cx="-3" cy=".5" rx={grown?22:18} ry="2.3" fill="#5b5b47" opacity=".24"/>
 <Legs a={a} grown={grown}/><Arm a={a} grown={grown} far/>
 {grown?<AdultBody a={a}/>:<ChildBody t={t} a={a}/>}
 {grown?<AdultHead t={t} a={a}/>:<ChildHead t={t} a={a}/>}
 <Arm a={a} grown={grown}/></g>;
}
export function Net({t}){if(t<28.1||t>37.62)return null;const a=adult(t),p=wrist(a),n=rim(t),k=u(28.1,28.7,t),dip=u(32.5,33,t)*(1-u(34.1,34.8,t));
 return <g opacity={k}>
 <path d={'M'+(p.x+Math.cos(a.angle)*23)+' '+(p.y-Math.sin(a.angle)*23)+'L'+n.x+' '+n.y} stroke="#6c735b" strokeWidth="3.4" strokeLinecap="round"/>
 <path d={'M'+(p.x+Math.cos(a.angle)*23)+' '+(p.y-Math.sin(a.angle)*23-.5)+'L'+n.x+' '+(n.y-.6)} stroke="#cca573" strokeWidth="1.55" strokeLinecap="round"/>
 <g transform={'translate('+n.x+' '+n.y+') rotate('+(-5+dip*5)+')'}>
 <path d="M-17 0q2 16 12 20 12 5 20-19Z" fill="#758f7d" opacity=".42"/><path d="M-17 0q2 16 12 20 12 5 20-19Z" fill="url(#mesh)" stroke="#5f8071" strokeWidth=".8"/>
 <ellipse rx="17" ry="5.3" fill="none" stroke="#65765d" strokeWidth="2.1"/><path d="M-16 1q13 8 30 .6" fill="none" stroke="#c6b384" strokeWidth=".9"/></g>
 {t>34&&t<37.55&&[0,1,2,3].map((i)=>{const z=((t-34)*1.55+i*.28)%1;return <ellipse key={i} cx={n.x+Math.sin(i*3.2)*8} cy={n.y+9+z*z*29} rx="1" ry={1+1.4*z} fill="#d9e0c3" opacity={1-z}/>})}
 </g>;}
export function PalmOver({t,grown}){const a=grown?adult(t):child(t),p=toWorld(a,a.arm.end);return <g transform={'translate('+p.x+' '+p.y+') scale('+a.facing+' 1)'}><path d="M-.8-.9q2.3-3.2 4.5-2.4 1.5 1.7-1.3 3.8l-2.1 1Z" fill={grown?'#dfa179':'#f0ba94'}/></g>;}
