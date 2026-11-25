"use strict";

const assert=require("node:assert/strict");
const {createCanvas}=require("../开篇九十秒/drawing.cjs");
const {sole}=require("../人物动作/rig.cjs");
const {createRenderer}=require("./film.cjs");
const story=require("./story.json");
const performance=require("./performance.json");
const draw=createRenderer(createCanvas(480,270),performance);
const frameCount=story.duration*story.fps;
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

assert.equal(story.cuts[0],0);
assert.equal(story.cuts.at(-1),story.duration);
assert(performance.voices.length===story.lines.length);
let priorSubtitle=0;
for(const [a,b,text] of performance.subs){
  assert(a>=priorSubtitle-.001 && b>a && b<story.duration && text, "Caption interval invalid");
  priorSubtitle=b;
}
for(const voice of performance.voices)assert(voice.tempo<=1.13,voice.id+" was sped up too much");

const visited=new Set();
let prior=null, contacts=0, motionFrames=0, error=0;
for(let f=0;f<frameCount;f++){
  const t=f/story.fps, {index,actors}=draw(t);
  visited.add(index);
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
console.log(JSON.stringify({frames:frameCount,shots:visited.size,motionFrames,contacts,maxReachError:error,captions:performance.subs.length}));