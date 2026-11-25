import React from 'react';
import {interpolate} from 'remotion';
import edit from '../edit.json';

const W = 960, H = 540;
const clamp = (n) => Math.max(0, Math.min(1, n));
export function smooth(from, to, n) {
  const x = clamp((n-from)/(to-from));
  return x*x*(3-2*x);
}
function rand(n) {
  const q = Math.sin(n*43.187 + 1.936)*19883.816;
  return q-Math.floor(q);
}
const seq = (count, draw) => Array.from({length:count}, (_,i)=>draw(i));
const svgProps = {viewBox:'0 0 960 540', width:'100%', height:'100%', style:{display:'block'}};

function RainStrokes({time, near=false}) {
  const count = near ? 35 : 96, width = near ? 1.15 : .76;
  return <g fill="none" strokeLinecap="round">{seq(count,i=>{
    const seed = i+(near ? 303 : 507);
    const length = (near ? 15 : 5)+rand(seed+11)*(near ? 32 : 14);
    const y = (rand(seed+1)*634+time*(near?590:300)*(1+.76*rand(seed+66)))%634-61;
    const x = rand(seed+13)*1055-30-.063*y;
    return <path key={i} d={`M ${x} ${y} l ${-length*.102} ${length}`}
      stroke={near?'#a3bec9':'#9bb0b9'} opacity={(near?.09:.08)+rand(seed+20)*.18} strokeWidth={width}/>;
  })}</g>;
}

function GlassDrops({time, weight=1}) {
  return <g opacity={weight} fill="none" strokeLinecap="round">{seq(33,i=>{
    const h = 13+rand(i+900)*32;
    const u = (time/(2.5+3.1*rand(i+220))+rand(i+413))%1;
    const slip = smooth(.32,.74,u);
    const x = 27+rand(i+205)*902;
    const y = 15+rand(i+619)*441+h*slip;
    const opacity = (.13+.29*rand(i+32))*smooth(0,.1,u)*(1-smooth(.88,1,u));
    return <g key={i} opacity={opacity} transform={`translate(${x},${y})`}>
      <path d={`M .4 ${-2-h*slip*.66} Q -1 -6 -.5 0`} stroke="#829ba6" strokeWidth=".8"/>
      <path d="M -.4 -3.3 Q -2.1 -.6 -1.5 1.2 Q .15 2.75 1.55 1.1 Q 2 -.2 .35 -3.3Z"
        fill="#75929f" stroke="#a5b5b8" strokeWidth=".48"/>
      <path d="M -.65 -.48 L -.65 .62" stroke="#e2d9c7" strokeWidth=".65"/>
    </g>;
  })}</g>;
}

const farHouses = seq(13,i=>{
  const x = i*86-42, y=117+rand(i+28)*170, w=60+rand(i+61)*39;
  return <g key={i}>
    <rect x={x} y={y} width={w} height={560-y} fill={i%2?'#1e303b':'#203340'}/>
    <path d={`M ${x-2} ${y+2} h ${w+4}`} stroke="#354750" strokeWidth="2"/>
    {seq(24,j=>{
      const xx=x+9+(j%3)*(w-15)/3, yy=y+13+Math.floor(j/3)*20;
      return <rect key={j} x={xx} y={yy} width="7.8" height="7.3" fill={rand(j+91*i+75)>.935?'#ac8761':'#293c47'} />;
    })}
  </g>;
});

const facade = <>
  <rect x="429" y="-83" width="430" height="682" fill="#21323d"/>
  <path d="M 408 -83 L 430 -83 V 599 L 408 584Z" fill="#14242e"/>
  <path d="M 430 -48 H 861 M 430 -43 H 861" fill="none" stroke="#516169" strokeWidth="2"/>
  {seq(11,row=><g key={row} transform={`translate(0,${-54+row*62})`}>
    <rect x="429" y="1" width="430" height="51" fill={row%3===1?'#2c414d':'#2a3d48'}/>
    {seq(9,col=>{
      const x=436+col*47, id=row*9+col, lit=[19,31,37,53,62,76,88].includes(id);
      return <g key={col}>
        <rect x={x} y="7" width="39" height="36" fill="#131f29"/>
        <rect x={x+2} y="8" width="35" height="33" fill={lit?(id%2?'#b08561':'#8e7157'):(id%4?'#233540':'#293d48')}/>
        {lit ? <><path d={`M ${x+4} 8 h 8 l -2 32 h -7Z`} fill="#695343"/><rect x={x+23} y="8" width="9" height="32" fill="#c39b73" opacity=".46"/></>
          : <path d={`M ${x+4} 38 L ${x+30} 9 h 5 L ${x+11} 40Z`} fill="#485c65" opacity=".2"/>}
        <path d={`M ${x+21} 7 v 35 M ${x+1} 20 h 36`} fill="none" stroke="#26343c" strokeWidth="1.5"/>
        {id%7===3 && <g><rect x={x+22} y="44" width="13" height="7" rx=".8" fill="#52616a"/><path d={`M ${x+25} 47 h 7 M ${x+25} 49 h 7`} stroke="#384952" strokeWidth=".8"/></g>}
      </g>;
    })}
    <path d="M426 52 H862 V57 H426Z" fill="#435560"/><path d="M429 58 H859" stroke="#182935" strokeWidth="3"/>
    {row%3!==0 && <g fill="none" stroke="#536671" strokeWidth=".85" opacity=".85">
      <path d="M428 39 H858"/>{seq(48,i=><path key={i} d={`M ${431+i*9} 39 v 13`}/>)}
    </g>}
  </g>)}
  <path d="M 850 -70 V 570 M 853 -70 V 570" stroke="#182a35" strokeWidth="2"/>
  {seq(8,i=><path key={i} d={`M 848 ${i*74+33} h 7`} stroke="#59676b" strokeWidth="1.5"/>)}
</>;

function NightBlock({t, glass=false}) {
  const drift = glass ? smooth(61.07,63.92,t) : smooth(2.4,5.36,t);
  const sky = glass?'pane-sky':'block-sky', haze = glass?'pane-haze':'block-haze';
  return <svg {...svgProps}>
    <defs>
      <linearGradient id={sky} x2=".29" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#12212e"/><stop offset=".69" stopColor="#354957"/><stop offset="1" stopColor="#263743"/></linearGradient>
      <radialGradient id={haze}><stop stopColor="#b99d76" stopOpacity=".31"/><stop offset="1" stopColor="#907b69" stopOpacity="0"/></radialGradient>
      {glass && <filter id="pane-distance" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="4.7"/></filter>}
    </defs>
    <rect width={W} height={H} fill={`url(#${sky})`}/>
    <g transform={`translate(${-3*drift} ${1.6*drift})`}>{farHouses}</g>
    <ellipse cx="200" cy="414" rx="262" ry="117" fill={`url(#${haze})`}/>
    <g filter={glass?'url(#pane-distance)':undefined} transform={glass ? `translate(${-455-9*drift} -132) scale(1.51)` : `translate(${-15*drift} ${-7*drift}) scale(${1+.027*drift})`}>
      {facade}
    </g>
    <RainStrokes time={t} />
    {glass ? <>
      <rect width="960" height="540" fill="#718a99" opacity=".115"/>
      <path d="M-15 336 L386 -31 H474 L32 372Z M514 546 L946 50 V95 L556 546Z" fill="#b4c3c8" opacity=".045"/>
      <g transform="translate(-138 -63) scale(1.42)"><GlassDrops time={t-59} weight={1.45}/></g>
      {[0,1,2].map((i)=>{
        const x=[361,538,606][i], q=smooth(61.09+.40*i,63.5+.27*i,t);
        const y=142+i*64+q*q*(101+i*13);
        return <g key={i} transform={`translate(${x},${y})`}>
          <path d={`M-1 ${-12-q*46} C-1 -15 2 -7 .2 -.7`} fill="none" stroke="#a8b7bd" strokeWidth=".95" opacity=".62"/>
          <path d="M.2 -5 Q-.9 -1.6 -2.1 .6 Q-3 4.7 .4 5.2 Q3.6 5.4 3.1 2.1 Q2 .7 .2 -5Z" fill="#617983" stroke="#a2b2b9" strokeWidth=".73"/>
          <path d="M-.9 .7 q-1.1 1.8 -.1 2.8" fill="none" stroke="#e1dbca" strokeWidth=".96"/>
        </g>;
      })}
      <path d="M0 0 H242 Q262 143 235 263 Q222 382 257 540 H0Z M960 0 H752 Q723 175 754 389 L733 540 H960Z" fill="#182833"/>
      <path d="M166 0 Q193 200 170 371 L185 540 M209 0 Q236 191 212 383 M789 0 Q766 221 791 484" fill="none" stroke="#31434f" strokeWidth="5"/>
      <path d="M245 495 H745 V504 H245Z" fill="#344653"/>
    </> : <>
      <g transform={`translate(${-24*drift} ${3*drift})`}>
        <path d="M-28 72 Q168 135 366 131 M-28 80 Q128 127 365 140" fill="none" stroke="#152431" strokeWidth="1.9"/>
        <path d="M-28 435 L84 403 L91 408 L151 389 L170 399 L170 573 H-28Z" fill="#14232e"/>
        <path d="M-25 436 L82 404 L91 408 L151 389" fill="none" stroke="#40505a" strokeWidth="1.8"/>
      </g>
      <RainStrokes time={t} near />
    </>}
  </svg>;
}

function Wood({id, base='#393738'}) {
  return <>
    <defs>
      <linearGradient id={id} x2=".85" y2="1"><stop stopColor="#514b48"/><stop offset=".39" stopColor={base}/><stop offset="1" stopColor="#20282f"/></linearGradient>
    </defs>
    <rect x="-20" y="-24" width="1004" height="590" fill={`url(#${id})`}/>
    {seq(38,i=>{
      const y=9+rand(i+360)*535;
      const x=rand(i+112)*350-110, end=x+220+rand(i+42)*730;
      return <path key={i} d={`M${x} ${y} Q${x+152} ${y-10} ${x+249} ${y+1.2} T${end} ${y-2.3}`} fill="none" stroke={i%4?'#21292d':'#837263'} strokeWidth={i%4?.8:.66} opacity=".32"/>;
    })}
  </>;
}

function Motor({t}) {
  const f=t*edit.fps;
  let shake=0,lit=0;
  for(const cue of edit.motors.slice(0,2)){
    const local=(f-cue.from)/edit.fps, len=cue.type==='long'?.49:.226;
    if(local<0||local>len+.095) continue;
    const env=smooth(0,.025,local)*(1-smooth(len-.045,len+.055,local));
    shake+=env*Math.sin(2*Math.PI*38.7*local+.37)*1.22;
    lit+=env;
  }
  const creep=smooth(0,2.4,t), blue=.20+.43*smooth(.3,.75,t)+.06*lit;
  return <svg {...svgProps}>
    <defs>
      <linearGradient id="bedwall" x2=".3" y2="1"><stop stopColor="#263947"/><stop offset="1" stopColor="#101b26"/></linearGradient>
      <linearGradient id="table-side" x2="0" y2="1"><stop stopColor="#58493f"/><stop offset=".18" stopColor="#3d3532"/><stop offset="1" stopColor="#19222a"/></linearGradient>
      <linearGradient id="phone-edge" x2=".9" y2=".4"><stop stopColor="#25313a"/><stop offset=".57" stopColor="#485660"/><stop offset="1" stopColor="#18232c"/></linearGradient>
      <linearGradient id="mobileglass" x2=".76" y2=".85"><stop stopColor="#678598"/><stop offset=".35" stopColor="#344957"/><stop offset="1" stopColor="#182a38"/></linearGradient>
      <radialGradient id="screen-spill"><stop stopColor="#b4d2dc" stopOpacity=".52"/><stop offset="1" stopColor="#accbd5" stopOpacity="0"/></radialGradient>
      <clipPath id="tabletop"><path d="M-24 361 L653 256 L1000 311 V375 L288 526 L-24 461Z"/></clipPath>
    </defs>
    <rect width={W} height={H} fill="url(#bedwall)"/>
    <path d="M-40 226 Q78 197 160 208 Q200 212 240 217 Q190 239 170 267 L-40 307Z" fill="#293c4b"/>
    <path d="M-8 252 Q91 218 151 232 Q91 246 51 260Z" fill="#344754"/>
    <g transform={`translate(${-15*creep} ${-8*creep}) scale(${1+.023*creep})`}>
      <path d="M-24 358 L650 254 L992 306 V389 L289 547 L-24 474Z" fill="url(#table-side)"/>
      <g clipPath="url(#tabletop)"><g transform="matrix(1 -.135 .35 .58 -95 293)"><Wood id="macro-wood" base="#453f3b"/></g></g>
      <path d="M-5 458 L286 521 L970 372" fill="none" stroke="#796555" strokeWidth="1.35" opacity=".77"/>
      <path d="M434 355 L577 317 Q593 313 614 315 L768 331 Q782 332 769 336 L606 376 Q596 379 585 377Z" fill="#17232c" opacity=".78"/>
      <ellipse cx="550" cy="362" rx="145" ry="19" fill="url(#screen-spill)" opacity={blue*.67}/>
      <g transform={`translate(${shake} ${Math.abs(shake)*-.18})`}>
        <path d="M399 340 L578 300 Q590 297 610 299 L757 312 Q770 313 768 318 L767 324 Q766 327 757 330 L572 373 Q562 376 549 374 L407 357 Q398 356 397 350Z" fill="url(#phone-edge)" stroke="#15212b" strokeWidth="1.5"/>
        <path d="M399 340 L582 300 Q593 297.5 610 299 L757 312 Q775 314 762 319 L573 364 Q563 367 550 365 L407 348 Q397 347 399 340Z" fill="#17232e" stroke="#67808b" strokeWidth="1.4"/>
        <path d="M411 342 L585 303 Q597 300 608 302 L747 314 Q753 315 745 317 L570 359 Q562 361 554 360Z" fill="url(#mobileglass)" opacity={blue}/>
        <path d="M429 346 L547 360 M581 359 L677 336" fill="none" stroke="#a3c5d2" strokeWidth="1.1" opacity={blue}/>
        <path d="M615 360 L639 354" stroke="#60727c" strokeWidth="1.6"/>
      </g>
    </g>
  </svg>;
}

function Phone({t}) {
  const settle=smooth(8.27,9.14,t), message=smooth(8.31,8.55,t);
  return <svg {...svgProps}>
    <defs>
      <radialGradient id="locklight"><stop stopColor="#b58b7b" stopOpacity=".20"/><stop offset="1" stopColor="#7b6565" stopOpacity="0"/></radialGradient>
      <linearGradient id="lockpaper" x2=".8" y2="1"><stop stopColor="#65505c"/><stop offset=".49" stopColor="#413843"/><stop offset="1" stopColor="#282733"/></linearGradient>
      <clipPath id="display"><rect x="-84" y="-171" width="168" height="342" rx="18"/></clipPath>
    </defs>
    <Wood id="phone-wood"/><ellipse cx="489" cy="286" rx="292" ry="249" fill="url(#locklight)"/>
    <g fontFamily="FilmSans, sans-serif" transform={`translate(${486+6*settle} ${274-8*settle}) rotate(${-8.4+1.3*settle}) scale(${1.20+.055*settle})`}>
      <rect x="-81" y="-170" width="179" height="360" rx="23" fill="#121b22" opacity=".52"/>
      <rect x="-91" y="-178" width="182" height="358" rx="23" fill="#1c2630" stroke="#60646b" strokeWidth="2"/>
      <g clipPath="url(#display)">
        <rect x="-84" y="-171" width="168" height="342" fill="url(#lockpaper)"/>
        <path d="M-94 148 Q1 77 36 -41 Q53 -90 102 -120 L102 173 H-94Z" fill="#79616b" opacity=".15"/>
        <rect x="-15" y="-162" width="30" height="4.4" rx="2.2" fill="#232630"/>
        <path d="M51 -151 v-2 M54 -151 v-3.4 M57 -151 v-4.6" stroke="#d0c7ca" strokeWidth="1.5"/>
        <rect x="62" y="-155" width="11.5" height="5.4" rx="1.2" fill="none" stroke="#d0c7ca" strokeWidth=".7"/>
        <rect x="63.5" y="-153.7" width="7.3" height="2.8" rx=".4" fill="#d0c7ca"/>
        <text x="0" y="-117" fill="#d4c7c7" fontSize="9" textAnchor="middle">凌晨</text>
        <text x="0" y="-78" fill="#f0e8e1" fontSize="39" fontFamily="FilmSans, sans-serif" textAnchor="middle">02:17</text>
        <g opacity={message} transform={`translate(0,${3*(1-message)})`}>
          <rect x="-74" y="-45" width="148" height="80" rx="8" fill="#342a34" fillOpacity=".91" stroke="#8d737e" strokeOpacity=".34" strokeWidth=".65"/>
          <rect x="-66" y="-37" width="12" height="12" rx="3" fill="#ae675b"/>
          <path d="M-60 -34 v4 M-60 -28.6 v.3" stroke="#f9e8d7" strokeWidth="1.4" strokeLinecap="round"/>
          <text x="-49" y="-27" fontSize="8" fill="#d6bdb6">城市应急</text>
          <text x="63" y="-27" fontSize="7" fill="#c2aaa9" textAnchor="end">现在</text>
          <text x="-64" y="-6" fontSize="13" fill="#f0dfd5">紧急通知</text>
          <text x="-64" y="10" fontSize="10" fill="#ded3d1">请全体市民关闭门窗，</text>
          <text x="-64" y="24" fontSize="10" fill="#ded3d1">切勿外出。</text>
        </g>
        <rect x="-27" y="161" width="54" height="2.4" rx="1.2" fill="#c1aeb4"/>
      </g>
    </g>
  </svg>;
}

export function shadowAt(t) {
  return interpolate(smooth(84.39,86.05,t),[0,1],[786,539]);
}
function Threshold({t}) {
  const follow=smooth(84.33,87.6,t);
  const x=shadowAt(t);
  const knocks=[85.37,86.19].reduce((n,at)=>{
    const d=t-at;
    return n+(d>=0 && d<.22 ? .84*Math.sin(d*88)*Math.exp(-25*d) : 0);
  },0);
  return <svg {...svgProps}>
    <defs>
      <linearGradient id="planks" x2=".2" y2="1"><stop stopColor="#30363b"/><stop offset=".35" stopColor="#28343b"/><stop offset="1" stopColor="#14212b"/></linearGradient>
      <linearGradient id="door-panel" x2=".92" y2=".47"><stop stopColor="#423b36"/><stop offset=".42" stopColor="#484034"/><stop offset="1" stopColor="#302d2c"/></linearGradient>
      <linearGradient id="threshold-beam" x2="0" y2="1"><stop stopColor="#c7a76e" stopOpacity=".41"/><stop offset=".24" stopColor="#c7a76e" stopOpacity=".22"/><stop offset="1" stopColor="#bca879" stopOpacity="0"/></linearGradient>
      <linearGradient id="shade-edge"><stop stopColor="#000" stopOpacity="0"/><stop offset=".2" stopColor="#000"/><stop offset=".8" stopColor="#000"/><stop offset="1" stopColor="#000" stopOpacity="0"/></linearGradient>
      <mask id="beam-shadow"><rect width="960" height="540" fill="white"/>{[0,69].map((o)=><path key={o} d={`M${x+o} 313 h 41 l ${16+o*.26} 116 h -79Z`} fill="url(#shade-edge)"/>)}</mask>
    </defs>
    <rect width="960" height="540" fill="#172730"/>
    <g transform={`translate(${-7*follow} ${-7*follow}) scale(${1+.016*follow})`}>
      <rect x="0" y="317" width="980" height="262" fill="url(#planks)"/>
      <path d="M0 366 L960 350 M0 431 L960 413 M0 517 L960 499 M282 363 L232 426 M691 417 L741 504 M64 511 L-18 580" fill="none" stroke="#17242c" strokeWidth="2"/>
      <path d="M0 368 L960 352 M0 433 L960 415 M0 519 L960 501" fill="none" stroke="#42494a" opacity=".5"/>
      <path d="M160 0 H827 V320 H160Z" fill="#1d2529"/>
      <path d="M146 0 H161 V323 H146Z M827 0 H846 V323 H827Z" fill="#46423b"/>
      <path d="M153 0 V320 M839 0 V319" stroke="#675c48" strokeWidth="2"/>
      <g transform={`translate(0,${knocks})`}>
        <rect x="164" y="-14" width="659" height="328" fill="url(#door-panel)"/>
        <path d="M205 -8 V245 H780 V-8 M210 -8 V240 H775 V-8" fill="none" stroke="#292826" strokeWidth="3.4"/>
        <path d="M214 -8 V235 H769" fill="none" stroke="#645343" strokeWidth="1.4"/>
        {seq(13,i=><path key={i} d={`M${182+i*49} -3 q 2 89 -2 157 t 2 156`} fill="none" stroke="#211f20" opacity=".15" strokeWidth="1"/>)}
        <path d="M164 306 L823 306 V314 H164Z" fill="#33302c"/>
      </g>
      <g mask="url(#beam-shadow)">
        <path d="M164 315 H823 V318 H164Z" fill="#c4a77b"/>
        <path d="M164 318 H823 L900 387 L95 408Z" fill="url(#threshold-beam)"/>
        <path d="M167 317 H818" stroke="#e0c591" opacity=".73" strokeWidth="1.15"/>
      </g>
    </g>
  </svg>;
}

export const inserts = {motor:Motor, block:NightBlock, alert:Phone, pane:({t})=><NightBlock t={t} glass/>, threshold:Threshold};
export {GlassDrops};
