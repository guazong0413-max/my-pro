"use strict";

const FPS=30;
const SEGMENTS=[
  {id:"neutral",label:"平静 · 眨眼",seconds:3.05,rise:.65,release:.35},
  {id:"doubt",label:"疑惑",seconds:3.4,rise:.78,release:.48},
  {id:"alert",label:"警觉",seconds:3.25,rise:.48,release:.52},
  {id:"surprise",label:"惊讶",seconds:3.15,rise:.30,release:.52},
  {id:"worry",label:"担心",seconds:3.35,rise:.85,release:.56},
  {id:"sad",label:"难过",seconds:3.40,rise:.96,release:.60},
  {id:"anger",label:"克制生气",seconds:3.35,rise:.76,release:.54},
  {id:"relief",label:"松口气 · 微笑",seconds:3.55,rise:.92,release:.51}
];

const REST={
  eye:1, lower:0, inner:0, outer:0, arch:0, uneven:0, gaze:0, down:0,
  smile:0, lips:.12, width:1, press:0, skew:0, jaw:0, cheek:0, tilt:0
};

const CORE={
  neutral:{},
  doubt:{eye:.79,lower:.10,inner:-.45,outer:-.20,arch:.22,uneven:.84,gaze:-.50,down:.10,
    smile:-.12,lips:.18,press:.36,skew:.34,tilt:-3.0},
  alert:{eye:1.32,lower:-.14,inner:-.65,outer:-.36,arch:.08,gaze:.72,down:-.20,
    smile:-.12,lips:.10,width:.95,press:.66,skew:.07,tilt:-1.2},
  surprise:{eye:1.75,lower:-.25,inner:-1.46,outer:-1.02,arch:.40,gaze:.20,down:-.07,
    smile:.02,lips:2.34,width:.78,press:0,skew:.04,jaw:1.68,tilt:-3.60},
  worry:{eye:1.14,lower:.07,inner:-1.57,outer:.66,arch:.29,uneven:.14,gaze:-.36,down:.32,
    smile:-.91,lips:.61,width:.92,press:.14,skew:-.08,jaw:.42,tilt:1.85},
  sad:{eye:.56,lower:.13,inner:-1.30,outer:.67,arch:.12,uneven:.17,gaze:-.18,down:.69,
    smile:-.72,lips:.15,width:.82,press:.44,skew:-.12,jaw:.02,tilt:4.3},
  anger:{eye:.70,lower:.29,inner:1.31,outer:-.64,arch:-.11,uneven:.14,gaze:.12,down:.08,
    smile:-.31,lips:.18,press:.91,width:1.03,skew:.20,jaw:0,cheek:.26,tilt:1.32},
  relief:{eye:.78,lower:.33,inner:.13,outer:-.17,arch:.07,uneven:.12,gaze:.17,down:.10,
    smile:1.04,lips:.54,width:1.14,press:0,skew:.11,jaw:.14,cheek:.88,tilt:1.25}
};

const ACTORS={
  yu:{
    delay:.035,blink:1.22,drift:1.04,
    poses:{
      doubt:{uneven:1.10,gaze:-.72,skew:.46,tilt:-3.7},
      alert:{gaze:.87,eye:1.28,press:.88},
      surprise:{lips:1.91,jaw:1.35,tilt:-3.14},
      worry:{lips:.36,gaze:-.51,smile:-.80,tilt:1.55},
      sad:{down:.82,eye:.49,smile:-.62,width:.81},
      anger:{inner:1.54,eye:.65,press:1,skew:.21,tilt:1.8},
      relief:{smile:.91,lips:.31,skew:.24,tilt:1.3}
    }
  },
  mei:{
    delay:.105,blink:1.61,drift:.91,
    poses:{
      doubt:{uneven:.62,gaze:.65,eye:.84,skew:-.30,tilt:2.60},
      alert:{gaze:-.83,eye:1.37,inner:-.99,tilt:-1.65},
      surprise:{gaze:-.25,lips:1.65,jaw:1.15,width:.75,tilt:-3.35},
      worry:{inner:-1.83,outer:.76,gaze:-.47,down:.45,smile:-.98,lips:.72,jaw:.53},
      sad:{eye:.51,inner:-1.52,smile:-.86,down:.61,tilt:3.9},
      anger:{outer:-.31,inner:1.37,smile:-.35,press:.84,skew:-.27},
      relief:{eye:.67,lower:.42,smile:1.08,lips:.42,cheek:.88,tilt:1.85}
    }
  },
  xu:{
    delay:.014,blink:.91,drift:1.27,
    poses:{
      doubt:{gaze:.67,uneven:.80,eye:.96,lips:.46,width:.89,tilt:4.50},
      alert:{gaze:-.95,eye:1.45,press:.50,tilt:-2.15},
      surprise:{eye:1.93,inner:-1.33,outer:-1.16,gaze:-.11,lips:2.64,jaw:1.65,width:.86,tilt:-4.2},
      worry:{eye:1.26,inner:-1.22,outer:.41,smile:-.94,width:.84,jaw:.45,tilt:2.35},
      sad:{eye:.57,smile:-1.0,lips:.22,lower:.20,width:.82,tilt:4.85},
      anger:{eye:.84,inner:1.01,smile:-.58,press:.73,width:.91,skew:-.13},
      relief:{eye:.72,lower:.46,smile:1.28,lips:.90,cheek:1,width:1.16,tilt:-.66}
    }
  },
  uncle:{
    delay:.156,blink:1.94,drift:.79,
    poses:{
      doubt:{eye:.68,uneven:.93,gaze:.23,press:.64,skew:-.25,tilt:-2.12},
      alert:{eye:1.19,gaze:.60,inner:-.45,outer:-.13,press:.96,tilt:.92},
      surprise:{eye:1.44,inner:-1.09,outer:-.75,lips:1.53,jaw:1.22,width:.70,tilt:-2.63},
      worry:{eye:.94,inner:-1.11,outer:.62,lips:.31,smile:-.60,press:.42,tilt:2.01},
      sad:{eye:.49,down:.58,smile:-.48,lips:.11,width:.82,press:.66,tilt:3.34},
      anger:{eye:.61,inner:1.45,outer:-.46,lips:.11,press:1,skew:.12,tilt:1.77},
      relief:{eye:.62,lower:.42,smile:.76,lips:.31,cheek:.73,uneven:.33,skew:.25}
    }
  }
};

const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const mix=(a,b,q)=>a+(b-a)*q;
function smooth(t,from,to){
  const u=clamp((t-from)/(to-from));
  return u*u*(3-2*u);
}
function impulse(t,enter,entered,leave,left){
  return smooth(t,enter,entered)*(1-smooth(t,leave,left));
}
function blink(t,at,length=.15){
  return impulse(t,at,at+length*.41,at+length*.46,at+length);
}

let cursor=0;
const chapters=SEGMENTS.map((stage,index)=>{
  const count=Math.round(stage.seconds*FPS),from=cursor;
  cursor+=count;
  return {...stage,index,from,to:cursor,seconds:count/FPS};
});

function shape(id,state){
  const actor=ACTORS[id];
  if(!actor||!CORE[state])throw new Error("Unknown character or expression: "+id+"/"+state);
  return {...REST,...CORE[state],...actor.poses[state],blink:0,breathe:0};
}

function atFrame(frame){
  const current=chapters.find(stage=>frame>=stage.from&&frame<stage.to)||chapters.at(-1);
  return {current,t:clamp((frame-current.from)/FPS,0,current.seconds)};
}
function performance(id,frame){
  const {current:stage,t}=atFrame(frame);
  const actor=ACTORS[id],target=shape(id,stage.id), pose={};
  const lead=stage.id==="surprise"?.22:stage.id==="alert"?.11:.055;
  const start=.25+actor.delay;
  const leave=stage.seconds-stage.release-.06;
  for(const field of Object.keys(REST)){
    let offset=0;
    if(field==="down"||field==="gaze")offset=-lead;
    else if(field==="jaw"||field==="lips"||field==="smile"||field==="width"||field==="press")offset=.08+(stage.id==="surprise"?.03:.09);
    else if(field==="tilt")offset=.075;
    const apex=start+stage.rise*(field==="eye"?.78:1.)+offset;
    const w=impulse(t,start+offset,apex,leave+offset*.26,stage.seconds-.035);
    pose[field]=mix(REST[field],target[field],w);
  }
  const time=frame/FPS;
  const phase=actor.blink*.94;
  const micro=Math.sin(time*1.94*actor.drift+phase);
  pose.breathe=.21*micro;
  pose.gaze+=.07*micro;
  pose.blink=stage.id==="neutral"?blink(t,actor.blink,.18):0.;
  if(stage.id==="doubt"||stage.id==="relief")pose.blink=blink(t,1.92+actor.delay,.159);
  if(stage.id==="sad")pose.blink=blink(t,1.68+actor.delay,.202);
  if(stage.id==="worry"){
    pose.gaze+=.29*impulse(t,1.49+actor.delay,1.76+actor.delay,2.12,2.45)*(id==="mei"?1:-1);
    if(id==="yu")pose.blink=blink(t,2.01,.134);
  }
  if(stage.id==="surprise"){
    const catchBreath=impulse(t,start+.20,start+.32,start+.54,start+.91);
    pose.jaw+=.29*catchBreath;
    pose.lips+=.26*catchBreath;
    pose.tilt-=.54*catchBreath;
  }
  if(stage.id==="relief"){
    pose.tilt+=Math.sin(Math.PI*smooth(t,.75,2.35))*(id==="uncle"?.65:.83);
  }
  return pose;
}

module.exports={FPS,chapters,totalFrames:cursor,atFrame,shape,performance,clamp,mix};
