import React, {useLayoutEffect, useRef} from 'react';
import {useVideoConfig} from 'remotion';
import art from '../../雨夜短片/art.cjs';
import scenes from './scenes.cjs';

export function CanvasShot({shot, frame}) {
  const ref=useRef(null);
  const {width,height,fps}=useVideoConfig();
  useLayoutEffect(()=>{
    const ctx=ref.current.getContext('2d');
    ctx.save();
    try {
      ctx.setTransform(width/art.W,0,0,height/art.H,0,0);
      ctx.clearRect(0,0,art.W,art.H);
      ctx.lineCap='round';
      ctx.lineJoin='round';
      scenes.draw(ctx,shot,frame/fps,frame);
    } finally {
      ctx.restore();
    }
  },[frame,fps,width,height,shot]);
  return <canvas ref={ref} width={width} height={height} style={{width:'100%',height:'100%',display:'block'}}/>;
}
