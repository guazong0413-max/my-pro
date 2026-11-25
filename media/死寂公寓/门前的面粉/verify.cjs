"use strict";

const assert=require("node:assert/strict");
const {createCanvas}=require("../开篇九十秒/drawing.cjs");
const {sole}=require("../人物动作/rig.cjs");
const {createRenderer}=require("./film.cjs");
const story=require("./story.json");
const performance=require("./performance.json");
const canvas=createCanvas(480,270);
const context=canvas.getContext("2d");
const paintText=context.fillText.bind(context);
const labels=[];
context.fillText=(value,x,y,...rest)=>{
  if(y!==251.5)labels.push(String(value).trim());
  paintText(value,x,y,...rest);
};
const draw=createRenderer(canvas,performance);
const frameCount=story.duration*story.fps;
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

assert.equal(story.cuts[0],0);
assert.equal(story.cuts.at(-1),story.duration);
assert.equal(performance.voices.length,story.lines.length);
assert.deepEqual(performance.subs.map(cue=>cue[2]),story.lines.flatMap(row=>row.subs));
let priorSubtitle=0;
for(const [a,b,text] of performance.subs){
  assert(a>=priorSubtitle-.001 && b>a && b<story.duration && text, "Caption interval invalid");
  priorSubtitle=b;
}
let previousCue=0;
for(const [i,voice] of performance.voices.entries()){
  const cue=story.lines[i];
  assert.equal(voice.id,cue.id);
  assert.equal(voice.time,cue.at);
  assert.equal(cue.subs.join(""),cue.text);
  assert(voice.time>=previousCue && voice.duration>0 && voice.time+voice.duration<=cue.until+.001,voice.id+" is outside its cue");
  assert(voice.tempo>=1 && voice.tempo<=1.29,voice.id+" was sped up too much");
  assert(voice.shortenedPause>=0,voice.id+" has an invalid pause adjustment");
  previousCue=cue.until;
}
for(const role of ["child","mei"]){
  const spoken=performance.voices.filter((_,i)=>story.lines[i].role===role);
  const mouth=Object.entries(performance.lips[role]).filter(([_,amplitude])=>amplitude>0);
  assert(mouth.length>0,role+" has no mouth animation");
  for(const [frame] of mouth){
    const t=Number(frame)/story.fps;
    assert(spoken.some(voice=>t>=voice.time && t<=voice.time+voice.duration+1/story.fps),role+" mouth moves outside dialogue");
  }
}

const visited=new Set();
const directionFrames={};
let prior=null, previousDoor=null, checkedLabels=false, contacts=0, motionFrames=0, error=0;
for(let f=0;f<frameCount;f++){
  labels.length=0;
  const t=f/story.fps, {index,actors,blocking}=draw(t);
  visited.add(index);
  assert(!labels.includes("楼梯"),"The set labels a visible staircase at "+t);
  checkedLabels||=labels.includes("1101");
  if(index<=4)assert(!labels.includes("09"),"An exterior door number is visible inside Mei's room at "+t);
  if(blocking){
    const {kind,door}=blocking;
    directionFrames[kind]=(directionFrames[kind]??0)+1;
    if(previousDoor?.index===index && previousDoor.kind===kind){
      const change=door.open-previousDoor.open;
      if(kind==="door-opening")assert(change>=0,"The leaf moved back while opening at "+t);
      if(kind==="door-closing")assert(change<=0,"The leaf moved back while closing at "+t);
    }
    previousDoor={index,kind,open:door.open};
  }
  for(const actor of actors){
    const {rig,feet}=actor;
    for(const group of [rig.arms,rig.legs]){
      for(const limb of Object.values(group)){
        assert(limb.end.every(Number.isFinite),"Invalid coordinate on "+t);
        error=Math.max(limb.error,error);
        assert(limb.error<.055,rig.id+" reaches beyond the rig on "+t+" by "+limb.error);
      }
    }
    if(!feet)continue;
    motionFrames++;
    if(prior?.index===index){
      assert(actor.dir*(actor.x-prior.actor.x)>=-.001,"Body faces away from the walking direction at "+t);
    }
    assert(Object.values(feet).some(x=>x.planted),"Missing ground contact on "+t);
    for(const [side,state] of Object.entries(feet)){
      const [x,y]=actor.world(rig.legs[side].end);
      assert(distance([x,y+sole[rig.id].flat*actor.s],state.xy)<.042,"Foot missed its mark on "+t);
      if(!state.planted)continue;
      const previous=prior?.index===index?prior.actor?.feet?.[side]:null;
      if(previous?.planted)assert(distance(previous.xy,state.xy)<.0001,"Planted foot drifted on "+t);
      contacts++;
    }
    prior={index,actor};
  }
}
assert.equal(visited.size,story.cuts.length-1);
assert(checkedLabels,"Could not inspect the rendered set labels");
console.log(JSON.stringify({frames:frameCount,shots:visited.size,motionFrames,contacts,maxReachError:error,captions:performance.subs.length,directionFrames}));
