import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame, useDelayRender} from 'remotion';
import edit from '../edit.json';
import performance from '../../雨夜短片/performance.json';
import {CanvasShot} from './CanvasShot';
import {inserts, GlassDrops, smooth} from './Inserts';

const sans='FilmSans, "Microsoft YaHei", sans-serif';
const fontFaces=[['FilmSans','film-sans'],['FilmSerif','film-serif']];
let loadingFonts;
function Fonts() {
  const {delayRender,continueRender,cancelRender}=useDelayRender();
  const [handle]=useState(()=>delayRender('Loading both locally bundled Chinese font subsets'));
  useEffect(()=>{
    let active=true;
    loadingFonts ??= Promise.all(fontFaces.map(async ([family,file])=>{
      const face=await new FontFace(family,`url("${staticFile('fonts/'+file+'.woff2')}")`).load();
      document.fonts.add(face);
    }));
    loadingFonts.then(()=>{if(active)continueRender(handle);},cancelRender);
    return ()=>{active=false;};
  },[handle,continueRender,cancelRender]);
  return null;
}

function Picture({shot}) {
  const local=useCurrentFrame(), frame=local+shot.from, t=frame/edit.fps;
  const Insert=inserts[shot.id];
  return <AbsoluteFill>
    {Insert ? <Insert t={t}/> : <CanvasShot shot={shot.id} frame={frame}/>}
    {shot.id==='window' && <svg viewBox="0 0 960 540" style={{position:'absolute',width:'100%',height:'100%'}}>
      <defs><clipPath id="gap"><rect x="240" y="12" width="474" height="446"/></clipPath></defs>
      <g clipPath="url(#gap)"><GlassDrops time={t-20.1} weight={.53*(1-smooth(23.7,25.7,t))}/></g>
    </svg>}
    {shot.id==='block' && <div style={{position:'absolute',left:'7.45%',top:'34.4%',
      color:'#e2dfd3',opacity:smooth(2.4,2.77,t)*(1-smooth(5.04,5.355,t)),
      textShadow:'0 3px 14px #101923'}}>
      <div style={{fontFamily:'FilmSerif, serif',fontSize:74,letterSpacing:8,lineHeight:1.28}}>死寂公寓</div>
      <div style={{display:'flex',alignItems:'center',gap:15,marginTop:18,color:'#d4b69a'}}>
        <span style={{width:37,height:2,background:'#ba9978'}}/>
        <span style={{fontFamily:'FilmSerif, serif',fontSize:30,letterSpacing:6}}>第二声</span>
      </div>
    </div>}
  </AbsoluteFill>;
}

function Finish() {
  return <AbsoluteFill style={{pointerEvents:'none',background:'radial-gradient(ellipse at 50% 44%, transparent 48%, rgba(6,13,20,.12) 77%, rgba(3,9,15,.36) 100%)'}}/>;
}

function Captions() {
  const t=useCurrentFrame()/edit.fps;
  const sub=performance.subs.find(([a,b])=>t>=a&&t<b);
  if(!sub)return null;
  const [a,b,words]=sub;
  return <AbsoluteFill style={{justifyContent:'flex-end',alignItems:'center',
    background:'linear-gradient(0deg,rgba(9,16,22,.42),transparent 16%)',
    opacity:smooth(a,a+.055,t)*(1-smooth(b-.070,b,t))}}>
    <span style={{fontFamily:sans,fontSize:40,letterSpacing:.8,color:'#f1eee5',
      lineHeight:1.42,marginBottom:47,textShadow:'0 2px 4px #111923, 0 0 9px #111923'}}>{words}</span>
  </AbsoluteFill>;
}

function Sound({narrationVolume,ambientVolume}) {
  const track=(file,volume=1)=><Html5Audio src={staticFile('sound/'+file+'.flac')} volume={volume}/>;
  return <>
    <Sequence name="旁白" layout="none">{track('narration',narrationVolume)}</Sequence>
    <Sequence name="陈默与手机播报" layout="none">{track('dialogue')}</Sequence>
    <Sequence name="雨、风与房间底声" layout="none">{track('weather',ambientVolume)}</Sequence>
    <Sequence name="脚步、落地与敲门" layout="none">{track('actions')}</Sequence>
    {edit.motors.map((cue)=><Sequence key={cue.from} name="手机贴桌震动" from={cue.from}
      durationInFrames={cue.type==='long'?15:7} layout="none">
      {track('motor-'+cue.type,cue.volume)}
    </Sequence>)}
    <Sequence name="窗外警车经过" from={edit.siren.from} durationInFrames={edit.siren.frames} layout="none">
      {track('police',edit.siren.volume)}
    </Sequence>
    <Sequence name="陈默收住一口气" from={edit.breath.from} durationInFrames={edit.breath.frames} layout="none">
      {track('breath',edit.breath.volume)}
    </Sequence>
  </>;
}

export function RainNight({subtitles=true,narrationVolume=1,ambientVolume=1}) {
  const frame=useCurrentFrame();
  const fade=Math.max(1-smooth(0,7,frame),smooth(2662,2696,frame));
  return <AbsoluteFill style={{backgroundColor:'#101a23',overflow:'hidden'}}>
    <Fonts/>
    {edit.shots.map((shot,i)=>{
      const next=edit.shots[i+1]?.from ?? edit.durationInFrames;
      return <Sequence key={shot.from} from={shot.from} durationInFrames={next-shot.from} name={shot.name}>
        <Picture shot={shot}/>
      </Sequence>;
    })}
    <Finish/>
    {subtitles && <Captions/>}
    {fade>0 && <AbsoluteFill style={{backgroundColor:'#080d12',opacity:fade}}/>}
    <Sound narrationVolume={narrationVolume} ambientVolume={ambientVolume}/>
  </AbsoluteFill>;
}
