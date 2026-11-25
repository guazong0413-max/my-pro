import React from 'react';
import {at,clamp,mix,u,bezier,pt,drawing,penTimes} from './motion.cjs';

const wetInk='#583e3a', blue='#315e68';
export function BirdInk({x=0,y=0,s=1,angle=0,color=blue}){return <g transform={'translate('+x+' '+y+') rotate('+angle+') scale('+s+')'} fill={color}>
 <path d="M0 1Q-3-5-15-9q7 7 11 11Q-8 4-10 8l8-4 2 1 3-5 7-2-5-.9Q2-2 0 1Z"/><path d="M-.8 1q-4-6-4-12 4 7 6 9Z"/>
 </g>;}
export function Glider({light=false,bank=0,wet=0}){const wing=bank*3;const a=light?'#f7e4b7':(wet>.45?'#bf7057':'#d9664c'),b=light?'#d1bd92':(wet>.45?'#9e5b4d':'#af4e42'),c=light?'#ecce94':(wet>.45?'#ce8568':'#e88862'),edge=light?'#aa946d':'#a95142';
 return <g strokeLinejoin="round">
 <path d={'M-21 '+(-10+wing)+'L27-2-5 7-18 4Z'} fill={b} stroke={edge} strokeWidth=".48"/>
 <path d={'M-13 '+(-15-wing)+'L27-2-4 3Z'} fill={c} stroke={edge} strokeWidth=".45"/>
 <path d={'M-21 '+(-10+wing)+'L27-2-4.8 6.5Z'} fill={a} stroke={edge} strokeWidth=".48"/>
 {light&&<><path d={'M-18 '+(-9.1+wing*.85)+'l3.2 .55 11 13.2-2.2 1Z'} fill="#477d81"/><path d={'M-13.6 '+(-8.4+wing*.72)+'l1.35 .2 9 11.2-1.2 .65Z'} fill="#83a59a"/></>}
 <path d="M-4.8 6.5L27-2-9 12.5Z" fill={b} stroke={edge} strokeWidth=".45"/><path d="M-8.2 11.5L23-1" fill="none" stroke={c} strokeWidth=".55"/>
 <BirdInk x={light?-.8:-.5} y={-2.2+wing*.2} s={light?.29:.33} angle={8} color={light?blue:wetInk}/>
 {light&&<BirdInk x={5.2} y={-1.2+wing*.15} s={.21} angle={4}/>}
 </g>;}
function Dapple({x,y,s=1}){return <g transform={'translate('+x+' '+y+') scale('+s+')'}><path d="M-17 2q-4-7 8-9 9-4 13 0 13 1 11 8-5 10-18 7-10 2-14-6Z" fill="#795b48" opacity=".26"/><path d="M-12-3q4-4 11-3" fill="none" stroke="#e5bf8c" opacity=".6" strokeWidth="1.4"/></g>;}
const TableBase=React.memo(function TableBase(){return <g>
 <rect width="960" height="540" fill="#709b8b"/><path d="M0 47L960 3V540H0Z" fill="#89654f"/>
 <path d="M0 56L960 12v528H0Z" fill="#c79769"/>
 {[0,1,2,3,4,5,6].map((i)=><g key={i} transform={'translate(0 '+(36+i*90)+') rotate(-3 0 0)'}>
 <path d="M0 22H970v78H0Z" fill={['#c6976c','#c1966b','#c99f75','#bd9067'][i%4]}/><path d="M-8 24q218-2 489 1t501-2" fill="none" stroke="#906f54" strokeWidth="2.3"/><path d="M0 28q316-2 480 0t490 0" stroke="#ddba88" strokeWidth="1.3" fill="none"/>
 {[0,1,2,3,4].map(j=><path key={j} d={'M'+(-135+j*210)+' '+(44+(i*3+j*13)%31)+'q50 -4 84 .2t91-1 m8-1 18-.5'} fill="none" stroke={j%2?'#ae805d':'#d7ae80'} strokeWidth={.95+j%2} opacity=".65"/>)}
 </g>)}
 <g transform="translate(828 39) rotate(12)"><ellipse cx="2" cy="4" rx="67" ry="29" fill="#8a7258" opacity=".3"/><path d="M-59-15h118v24q-4 21-60 23-54-2-58-21Z" fill="#8f9e83" stroke="#647e6c" strokeWidth="2"/><ellipse cy="-14" rx="59" ry="21" fill="#ddc69b" stroke="#6e8976" strokeWidth="3"/><ellipse cy="-13" rx="48" ry="15" fill="#8c7b5d"/><path d="M-31-10q25-12 60-5" fill="none" stroke="#bba17a" strokeWidth="2"/></g>
 <path d="M-36 407q87-31 100 23t-73 67q-38-6-7-39 26-26 52-9t-13 23" fill="none" stroke="#947353" strokeWidth="13"/><path d="M-36 404q87-31 100 23t-73 67q-38-6-7-39 26-26 52-9t-13 23" fill="none" stroke="#d3b079" strokeWidth="8" strokeDasharray="4 2"/>
 <Dapple x={293} y={293} s={1.4}/><Dapple x={333} y={350} s={.55}/><Dapple x={734} y={378} s={.72}/>
 </g>;});
function Hand({x,y,angle=0,grown=true,far=false,scale=1}) {const skin=grown?(far?'#c58b64':'#d59a71'):'#edb58d',sleeve=grown?'#e8dabc':'#e6a853';
 return <g transform={'translate('+x+' '+y+') rotate('+angle+') scale('+scale+')'}>
 <path d="M-1060-53-118-25l43 3 18 8-1 25-62 15-942 30Z" fill={sleeve}/>
 {grown&&[-152,-130,-108].map(v=><path key={v} d={'M'+v+'-24l6 49'} stroke="#748b7e" fill="none" strokeWidth="7"/>)}
 <path d="M-94-24q11-4 21 0l6 40-23 8Z" fill={grown?'#99a493':'#c98b44'}/>
 <path d="M-72-18q20 2 33-7 9-6 19-4 9-1 13 6l7 13q3 5-3 9l-11 1q-6 10-22 10-14 0-32 4Z" fill={skin}/>
 <path d="M-43-12q9-13 22-12l15 11q3 3 .8 6-4 4-11 .5l-10-5" fill={skin} stroke={grown?'#b17c5e':'#ce9573'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
 <path d="M-60 8q5-3 8-3" fill="none" stroke={grown?'#bb8666':'#d39977'} strokeWidth="1.4"/>
 </g>;}
function TicketPrinting(){return <g><path d="M377 180h308v167H377Z" fill="none" stroke="#6f9389" strokeWidth="1.6"/><path d="M458 177v173" stroke="#819c90" strokeDasharray="4 4" strokeWidth="1.3"/>
 <path d="M370 177h8v174h-8Z" fill="#51817f"/><path d="M382 177h3v174h-3Z" fill="#81a299"/>
 <g transform="translate(414 244)" fill="none" stroke="#55807b"><circle r="23" strokeWidth="1.3"/><circle r="19" strokeWidth=".7" strokeDasharray="2 2"/><path d="M-14 5h28l-6 6h-16Zm4-.5V0h15v4M-6 0v-5h7v5m1-5v-4h2v4" strokeWidth="1.7"/><path d="M-11 14q4-2 8 0t8 0 7 0" strokeWidth="1.2"/></g>
 <text x="414" y="309" fill="#4f7673" textAnchor="middle" fontFamily="Georgia,serif" fontSize="24" fontWeight="bold">07</text>
 <path d="M480 322h108m-108 5h70" stroke="#a1ac91" strokeWidth="1"/>
 <text x="672" y="335" fill="#718b7d" textAnchor="end" fontFamily="monospace" fontSize="11" letterSpacing="1.5">0273</text></g>;}
function Ticket(){return <><path d="M366 170h330v13q-8 2 0 7v15q-8 2 0 7v15q-8 2 0 7v15q-8 2 0 7v15q-8 2 0 7v15q-8 2 0 7v15q-8 2 0 7v28H366v-14q8-3 0-7v-15q8-3 0-7v-15q8-3 0-7v-15q8-3 0-7v-15q8-3 0-7v-15q8-3 0-7v-15q8-3 0-7Z" fill="#f8e8c4" stroke="#bba37a" strokeWidth="1.3"/><TicketPrinting/></>;}
function WetPaper({open=1,small=false}){const sx=.49+.51*open,sy=.23+.77*open;
 return <g transform={'scale('+sx+' '+sy+')'}>
 <path d="M-156-75l49-9 62 4 57-5 58 5 61-4 22 12-3 39 5 37-4 43 2 24-50 8-60-3-48 6-72-9-72 3-10-21 6-38-6-38Z" fill="#a96751" opacity=".3" transform="translate(6 9)"/>
 <path d="M-156-75l49-9 62 4 57-5 58 5 61-4 22 12-3 39 5 37-4 43 2 24-50 8-60-3-48 6-72-9-72 3-10-21 6-38-6-38Z" fill="#d77859" stroke="#ba684f" strokeWidth="1.3"/>
 <path d="M-156-75L-2 2-151 64-147 17Zm307 1L-2 2l150 69Z" fill="#c77155"/><path d="M-2 2l104 71 46-2Z" fill="#e18c68"/><path d="M-153-70L-2 2 150-71M-2 2l151 67M-149 66-2 2l-8-82M-2 2l2 72" fill="none" stroke="#e99a73" strokeWidth="1.8"/>
 <g opacity={.2+.8*open}><BirdInk x={7} y={6} s={3.9} angle={-5} color={wetInk}/></g>
 <path d="M-124 47q37-7 50 6l-16 16-48-4Zm217-120 39 3-3 24-29-5Z" fill="#ad654f" opacity=".42"/>
 {!small&&<><Dapple x={98} y={46} s={.43}/><Dapple x={-117} y={-37} s={.33}/></>}
 </g>;}
function WetScene({t}){const op=u(38.35,42.25,t),rock=mix(-14,-6,op);
 const spread=u(37.96,38.76,t);
 return <><TableBase/><g transform={'translate(487 264) rotate('+rock+')'}><g opacity={spread}><WetPaper open={op}/></g>{spread<1&&<g opacity={1-spread} transform="scale(4.2 1.59)"><Glider wet={1}/></g>}</g>
 <Hand x={mix(425,336,op)} y={mix(288,312,op)} angle={-28} far/><Hand x={mix(532,636,op)} y={mix(247,239,op)} angle={-147}/>
 {t<38.65&&<g opacity={1-u(37.65,38.65,t)}><Dapple x={676} y={306} s={.65}/></g>}</>;}
const dpath=points=>'M'+points[0].join(' ')+'C'+points.slice(1).map(v=>v.join(' ')).join(' ');
const marks=[
 'M543 251Q528 234 490 224Q514 238 536 253Z','M542 251Q530 235 528 204Q537 227 548 246Z',
 'M536 252Q546 244 555 240L574 240L563 244L550 248L542 255Z','M543 247L536 248 527 263 540 256 546 250Z',
 'M615 271Q603 255 584 253Q600 262 610 272Z','M614 271Q607 255 612 239Q615 254 619 266Z',
 'M610 271Q623 261 629 265L635 267 626 267 617 272Z','M616 268L609 271 605 278 614 274 618 270Z'
];
function Marks({t=59}) {return <g>{drawing.map((v,i)=>{
 const [a,b]=penTimes[i],s=clamp((t-a)/(b-a));if(!s)return null;
 if(s>=1)return <path key={i} d={marks[i]} fill={blue}/>;
 return <g key={i}><defs><mask id={'pencil-'+i} maskUnits="userSpaceOnUse" x="465" y="188" width="190" height="108"><path d={dpath(v)} fill="none" stroke="white" strokeWidth="19" strokeLinecap="round" pathLength="1" strokeDasharray={s+' 1.05'}/></mask></defs><path d={marks[i]} fill={blue} mask={'url(#pencil-'+i+')'}/></g>;
 })}</g>;}
function pencil(t){let p=pt(586,185);
 for(let i=0;i<drawing.length;i++){
   const [a,b]=penTimes[i],points=drawing[i].map(v=>pt(...v)),next=points[0];
   const past=i?penTimes[i-1][1]:49.25;
   if(t<a){const q=u(past,a,t);return {x:mix(p.x,next.x,q),y:mix(p.y,next.y,q)-7*Math.sin(Math.PI*q)};}
   if(t<=b)return bezier(...points,clamp((t-a)/(b-a)));
   p=points[3];
 }
 const s=u(57.18,58.6,t);return {x:mix(p.x,723,s),y:mix(p.y,191,s)};
}
function Drawing({t}){const q=pencil(t);
 return <><TableBase/><g transform="translate(167 215) rotate(-12) scale(.77)"><WetPaper small/></g>
 <path d="M374 175h325v185H374Z" fill="#8f7759" opacity=".28"/><Ticket/>
 <Marks t={t}/>
 <Hand x={392} y={348} angle={-30} scale={.87} far/>
 <g transform={'translate('+q.x+' '+q.y+') rotate(-30)'}><path d="M0 0l12-4 124-.1 1 7.2-125 .3Z" fill="#dcad5c" stroke="#947955" strokeWidth=".9"/><path d="M0 0l11-3.8-.2 6.5Z" fill="#ead1a2"/><path d="M0 0l3.5-1.2.1 2.1Z" fill="#38545a"/><path d="M14-2.5h118" stroke="#f6d58e" strokeWidth="1.2"/><path d="M126-4h10l1 7.2h-11Z" fill="#69847b"/></g>
 <Hand x={q.x+41} y={q.y-34} angle={-153} scale={.86}/><g transform={'translate('+q.x+' '+q.y+') rotate(-30)'}><path d="M47 1q1-5 5-6 4-.5 7 3l3 5-5 4q-7-.5-10-6Z" fill="#d59a71"/></g></>;}
function Fold({t}){const top=u(59.12,60.35,t),bottom=u(60.65,61.79,t),wing=u(62,64.38,t);
 const w=165,h=90,left=-w,right=w,ft={x:mix(-w,-65,top),y:mix(-h,0,top)},fb={x:mix(-w,-65,bottom),y:mix(h,0,bottom)};
 const outline='M'+left+' 0L'+ft.x+' '+ft.y+' -65 '+(-h)+' '+right+' '+(-h)+' '+right+' '+h+' -65 '+h+' '+fb.x+' '+fb.y+'Z';
 return <><TableBase/><g transform="translate(139 203) rotate(-12) scale(.65)"><WetPaper small/></g>
 <g transform={'translate(531 264) rotate('+(-5*wing)+')'}><g transform={'scale(1 '+(1-.56*wing)+')'} opacity={1-u(62.38,63.2,t)}><defs><clipPath id="ticketEdge"><path d="M-165 0L-65-90H165V90H-65Z"/><path d={outline}/></clipPath></defs>
 <g clipPath="url(#ticketEdge)"><path d="M-165-90h330V90h-330Z" fill="#f8e8c4"/><g transform="translate(-531 -260)"><Ticket/><Marks/></g>
 <path d={'M-165 0L-65 -90 '+ft.x+' '+ft.y+'Z'} fill="#eed8a8" opacity={top}/><path d={'M-165 0L-65 90 '+fb.x+' '+fb.y+'Z'} fill="#d6bf91" opacity={bottom}/>
 <path d={'M-165 0L-65 -90M-165 0l100 90'} fill="none" stroke="#af9a73" strokeWidth="1.7" opacity={Math.max(top,bottom)}/>
 <path d={'M-165 0L165 '+(-4-39*wing)+' 81 '+(17+68*wing)+'Z'} fill="#f2dbad" opacity={wing*.87}/><path d="M-160 0L159 0" fill="none" stroke="#b3a17c" strokeWidth="1.6" opacity={wing}/></g></g><FoldedWings t={t}/></g>
 <Hand x={at(t,[[58.8,386],[59.25,386],[60.35,459],[60.6,404],[61.79,462],[62.3,413],[64.38,455]])} y={at(t,[[58.8,351],[59.17,190],[60.35,258],[60.66,342],[61.79,267],[62.4,283],[64.4,278]])} angle={-36} scale={.85} far/>
 <Hand x={at(t,[[58.8,646],[60,624],[61.9,624],[63.7,585],[65,619]])} y={at(t,[[58.8,301],[60.2,284],[61.8,273],[63.7,247],[65,240]])} angle={-150} scale={.94}/></>;}
function FoldedWings({t}){
 const k=u(62.05,64.31,t),show=u(62.03,62.57,t),exact=u(63.42,64.35,t);if(!show)return null;
 const points=(aa,bb)=>aa.map((a,i)=>a.map((n,j)=>mix(n,bb[i][j],k)).join(',')).join(' ');
 const nose=[-156,-12],A=[-165,0],B=[-65,-90],C=[165,-90],D=[165,90],E=[-65,90],M=[56,0];
 return <g opacity={show}><g opacity={1-exact} stroke="#b79d75" strokeWidth="1.8" strokeLinejoin="round">
 <polygon points={points([A,B,C,M],[nose,[75,-87],[116,-53],[23,17]])} fill="#edd09a"/>
 <polygon points={points([A,M,D,E],[nose,[23,17],[106,22],[53,72]])} fill="#cdb78c"/>
 <polygon points={points([A,B,C,D],[nose,[117,-54],[121,-50],[29,38]])} fill="#f8e6ba"/>
 <BirdInk x={mix(10,5,k)} y={mix(-9,-12,k)} s={mix(1.55,1.4,k)} color={blue}/><BirdInk x={mix(74,-26,k)} y={mix(8,-7,k)} s={1.05}/>
 </g><g transform="scale(-5.8 5.8)" opacity={exact}><Glider light/></g></g>;
}
function Answer({t}){const s=u(78.4,82.9,t);
 return <><rect width="960" height="540" fill="#dcad6a"/><path d="M0 0h249l-71 540H0Z" fill="#c99555"/><path d="M351 0h609v72l-222 4-138 75-125-37Z" fill="#b76049"/><path d="M893 0l-56 540h123V0Z" fill="#c18a50"/>
 <path d="M62 462q245 55 460 20M78 475q217 43 417 18" fill="none" stroke="#b7824f" strokeWidth="3"/>
 <g transform={'translate('+(479-7*s)+' '+(277-7*s)+') rotate('+(4-5*s)+') scale('+(-10.2-s*.55)+' '+(10.2+s*.55)+')'}><Glider light bank={.55}/></g>
 <Hand x={417} y={339-5*s} angle={-58} grown={false} scale={1.07}/><Hand x={550} y={383-6*s} angle={-131} grown={false} scale={.95}/>
 </>;}
export function Insert({id,t}){if(id==='answer')return <Answer t={t}/>;const zoom=id==='wet'?1.20+.08*u(37.6,43.6,t):id==='draw'?1.19+.10*u(49.2,58.8,t):1.29-.07*u(58.8,65,t);return <g transform={'translate(480 270) scale('+zoom+') translate(-488 -270)'}>{id==='wet'?<WetScene t={t}/>:id==='draw'?<Drawing t={t}/>:<Fold t={t}/>}</g>;}
