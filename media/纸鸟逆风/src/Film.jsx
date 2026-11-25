import React from 'react';
import {AbsoluteFill,Html5Audio,Img,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {PaintDefs,Landscape,Dock,Boat,Gulls} from './Harbor';
import {Actor,Net,PalmOver} from './Actors';
import {Glider,Insert} from './Paper';
import {fps,shots,length,beat,red,white,camera,rim,u,clamp} from './motion.cjs';

function WaterMark({t,start,x,y,power=1}) {
 const d=t-start;if(d<0||d>2.5)return null;
 return <g>{[0,.32,.70].map((lag,i)=>{const p=clamp((d-lag)/1.8);return p>0&&p<1&&<ellipse key={lag} cx={x} cy={y} rx={(4+30*p)*power} ry={(1+4.5*p)*power} fill="none" stroke={i===1?'#5b9993':'#eee4c0'} strokeWidth={1.5-.9*p} opacity={.85*(1-p)}/>;})}
 {[0,1,2,3].map(i=>{const k=clamp(d/(.33+.045*i));return k>0&&k<1&&<ellipse key={i} cx={x+(i%2?-1:1)*(2+(2+i)*k)*power} cy={y-(3+i*1.7)*4*k*(1-k)*power} rx=".85" ry="1.4" fill="#eee7c5" opacity={1-k}/>;})}</g>;
}
function Plane({p,light,t}){const wet=light?0:u(beat.splash,beat.splash+.52,t);return <g transform={'translate('+p.x+' '+p.y+') scale('+(p.dir||1)+' 1) rotate('+p.angle+') scale(1 '+(1-.48*wet)+') translate('+(8*(1-wet))+' '+(-10*(1-wet))+')'}><Glider light={light} wet={wet} bank={.55*(1-wet)*Math.sin(t*(light?3.4:4.6))}/></g>;}
function Exterior({id,t}) {
 const cam=camera(id,t),scale=960/cam.w,redVisible=t<37.6,ivory=t>=65,net=rim(32.95);
 return <><PaintDefs/><g transform={'translate(480 270) scale('+scale+') translate('+(-cam.x)+' '+(-cam.y)+')'}>
 <Landscape t={t}/><Gulls t={t}/><Dock/><Boat t={t}/>
 <WaterMark t={t} x={619} y={467} start={beat.splash}/><WaterMark t={t} x={net.x} y={470} start={beat.netDip} power={1.25}/>
 <Net t={t}/><Actor t={t}/><Actor t={t} grown/>
 {redVisible&&<Plane t={t} p={red(t)}/>}
 {redVisible&&t<=beat.launch&&<PalmOver t={t}/>}
 {ivory&&<Plane light t={t} p={white(t)}/>}
 {ivory&&(t<=beat.reply||t>=beat.catch)&&<PalmOver t={t} grown={t<=beat.reply}/>}
 </g></>;
}
const tabletops=['wet','draw','fold','answer'];
function Shot({shot}) {const t=(shot.from+useCurrentFrame())/fps;
 const title=u(4.17,4.9,t)*(1-u(8.85,9.62,t));
 return <AbsoluteFill><svg viewBox="0 0 960 540" width="100%" height="100%" style={{display:'block'}} aria-label={shot.name}>
 {tabletops.includes(shot.id)?<Insert id={shot.id} t={t}/>:<Exterior id={shot.id} t={t}/>}
 </svg>{shot.id==='harbor'&&title>0&&<Img src={staticFile('title.svg')} style={{position:'absolute',left:'8.5%',top:'13.5%',width:'32%',opacity:title,transform:'translateY('+((1-title)*5)+'px)'}}/>}</AbsoluteFill>;
}
export function Film({water=1,ferry=1,foley=1,music=1}){
 const frame=useCurrentFrame(),fade=1-u(0,8,frame)+u(2664,2699,frame);
 return <AbsoluteFill style={{backgroundColor:'#f0dcba'}}>
 {shots.map((shot,i)=><Sequence key={shot.id} from={shot.from} durationInFrames={(shots[i+1]?.from??length*fps)-shot.from} name={shot.name}><Shot shot={shot}/></Sequence>)}
 <AbsoluteFill style={{backgroundImage:'url("'+staticFile('grain.png')+'")',backgroundSize:'320px 320px',opacity:.74,pointerEvents:'none'}}/>
 {fade>0&&<AbsoluteFill style={{backgroundColor:'#f0dfbe',opacity:fade}}/>}
 {[['river','河面、风和远鸟',water],['ferry','船体、引擎和汽笛',ferry],['foley','鞋底、湿纸与铅笔',foley],['score','原创拨弦旋律',music]].map(([file,name,volume])=>
 <Sequence key={file} name={name} layout="none"><Html5Audio src={staticFile('sound/'+file+'.flac')} volume={volume}/></Sequence>)}
 </AbsoluteFill>;
}
