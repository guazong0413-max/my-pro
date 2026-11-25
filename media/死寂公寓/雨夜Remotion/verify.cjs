"use strict";
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const edit = require('./edit.json');
const cuts = edit.shots;
const {createCanvas} = require('../开篇九十秒/drawing.cjs');
const {railTop, soil, weightOnHands, handsOff, bracedPalms} = require('../雨夜短片/street.cjs');
const {events} = require('../雨夜短片/story.json');
const {draw} = require('./src/scenes.cjs');
const visualInserts = new Set(['motor','block','alert','pane','threshold']);
const c = createCanvas(240,135).getContext('2d');
const length = edit.durationInFrames;
const frameAt = (time) => Math.ceil(time*edit.fps);
function shotAt(frame) {return cuts.findLast(shot=>shot.from<=frame).id;}
assert.equal(cuts[0].from,0);
assert(cuts.every((s,i)=>Number.isInteger(s.from)&&s.from<length&&(!i||s.from>cuts[i-1].from)));
assert.equal(shotAt(frameAt(events.railRelease)), 'balcony');
assert.equal(shotAt(frameAt(events.impact)), 'balcony');
for (const knock of events.knock) assert.equal(shotAt(frameAt(knock)), 'threshold');
for (const name of ['narration','dialogue','weather','actions','police','breath','motor-short','motor-long']) {
  assert(fs.statSync(path.join(__dirname,'public','sound',name+'.flac')).size>1000);
}
let armMax=0,grips=0,handSupports=0,framesInFlight=0,hiddenFrames=0;
let lastCameraY=-Infinity;
for (let frame=0;frame<length;frame++) {
  const shot=shotAt(frame), t=frame/edit.fps;
  if (visualInserts.has(shot)) continue;
  c.setTransform(.25,0,0,.25,0,0);
  const state=draw(c,shot,t,frame);
  if (!state) continue;
  if (state.view==='rear-to-window') {
    const gapCentre=(state.left+state.right)/2;
    assert(Math.abs(state.headX-gapCentre)<39, 'Rear view faces the curtain away from the opening at '+frame);
    if(shot==='witness') assert(state.opening>.82);
  }
  if (shot==='hide' && t>75.7) {
    assert(state.actor.x>=515 && state.actor.x<774,'Actor crosses the far end of the sofa');
    hiddenFrames++;
  }
  if (!state.phase) continue;
  for (const limb of [...Object.values(state.arms),...Object.values(state.legs)]) {
    armMax=Math.max(armMax,limb.error);
    assert(limb.error<.05,'Joint overreaches at '+frame+' '+limb.error);
  }
  if (state.phase==='rail') {
    const left=state.arms.left.end, right=state.arms.right.end;
    assert(right[0]-left[0]>76 && Math.abs(left[1]-railTop)<.04 && Math.abs(right[1]-railTop)<.04);
    if (shot==='grip') {
      const v=state.camera;
      const px=480+(right[0]-v.x)*v.zoom, py=270+(right[1]-v.y)*v.zoom;
      assert(px>500 && px<680 && py>185 && py<305,'Near hand leaves the close-up');
      grips++;
    }
  } else if (state.phase==='air') {
    const v=state.camera;
    assert(v.y>=lastCameraY && 270+(state.hip[1]-v.y)*v.zoom<432);
    lastCameraY=v.y; framesInFlight++;
  } else {
    assert(Math.max(...state.faceEdge.map(p=>p[1]))<=soil,'Face passes under soil at '+frame);
    if(t>=weightOnHands && t<=handsOff) {
      for(const [side,arm] of Object.entries(state.arms)) {
        assert(Math.hypot(arm.end[0]-bracedPalms[side][0],arm.end[1]-bracedPalms[side][1])<.05);
        assert(arm.middle[1]<soil,'Elbow crosses planter at '+frame);
      }
      handSupports++;
    }
  }
}
assert(grips>95 && handSupports>40 && framesInFlight>35 && hiddenFrames>150);
console.log(JSON.stringify({frames:length,shots:cuts.length,gripCloseFrames:grips,
  airborneFrames:framesInFlight,weightOnPalmsFrames:handSupports,behindSofaFrames:hiddenFrames,maxJointError:armMax}));
