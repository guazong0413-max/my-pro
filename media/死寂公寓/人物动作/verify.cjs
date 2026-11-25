"use strict";

const assert = require("node:assert/strict");
const {createCanvas} = require("../开篇九十秒/drawing.cjs");
const {shots, FPS, frames, footsteps, mealEvents, ear} = require("./motion.cjs");
const {distance, rotate, sub, bodyPoint, sole, drawHead, drawSleeve, drawHand} = require("./rig.cjs");
const {drawSpoon, drawBowl} = require("./props.cjs");

const cross = (a,b) => a[0]*b[1]-a[1]*b[0];
const sampleScale=7, origin=[194,130];
const mask=createCanvas(480,406), ctx=mask.getContext("2d");
ctx.lineCap="round";
ctx.lineJoin="round";

function pixels(draw) {
  ctx.resetTransform();
  ctx.clearRect(0,0,mask.width,mask.height);
  ctx.setTransform(sampleScale,0,0,sampleScale,-origin[0]*sampleScale,-origin[1]*sampleScale);
  draw(ctx);
  return ctx.getImageData(0,0,mask.width,mask.height).data;
}

function overlap(first, second, grip) {
  let total=0;
  for(let i=3;i<first.length;i+=4) {
    if(first[i]<=150||second[i]<=150)continue;
    if(grip){
      const pixel=(i-3)/4;
      const x=origin[0]+(pixel%mask.width+.5)/sampleScale;
      const y=origin[1]+(Math.floor(pixel/mask.width)+.5)/sampleScale;
      if(distance([x,y],grip)<6)continue;
    }
    total++;
  }
  return total;
}

let checked=0, contacts=0, mealFrames=0, dipFrames=0, lipFrames=0, cupFrames=0;
for (const shot of shots) {
  let previous;
  for (let frame=0; frame<shot.to-shot.from; frame++) {
    const t=frame/FPS;
    const state=shot.sample(t), {rig}=state;
    const label=shot.id+" "+t.toFixed(3);
    for (const [side,leg] of Object.entries(rig.legs)) {
      assert(leg.error<.04,label+" unreachable ankle");
      const foot=rig.feet[side], style=sole[rig.id];
      const tipY=Math.max(...["heel","toe"].map(p=>rotate([style[p][0],style.flat],foot.angle)[1]));
      const lowest=leg.end[1]+tipY;
      assert(lowest<=(foot.marker?.[1]??rig.ground)+.011,label+" shoe below its support");
      const last=previous?.rig.feet[side];
      if (foot.marker && last && foot.contact===last.contact) {
        assert(distance(foot.marker,last.marker)<.001,label+" sliding contact");
        contacts++;
      }
    }
    for (const limb of Object.values(rig.arms)) {
      assert(limb.error<.04,label+" unreachable wrist");
    }

    if (footsteps[shot.id]) {
      const supports=Object.values(rig.feet).filter(foot=>foot.marker);
      assert(supports.length>=1,label+" missing support");
      const hip=bodyPoint(rig,rig.hips);
      if (previous) {
        const lastHip=bodyPoint(previous.rig,previous.rig.hips);
        assert(hip[0]>=lastHip[0]-.03,label+" unplanned backward pelvis drift");
        assert(Math.abs(hip[1]-lastHip[1])<1.3,label+" vertical pelvis jump");
      }
      if (supports.length===2) {
        const span=supports.map(foot=>foot.point[0]);
        assert(hip[0]>=Math.min(...span)-1.5&&hip[0]<=Math.max(...span)+1.5,label+" pelvis outside the two feet");
      }
    }

    if (state.spoon) {
      const {spoon,bowl}=state;
      if (t>=mealEvents.pick&&t<=mealEvents.release) {
        assert(distance(rig.arms.right.end,spoon.handle)<.04,label+" hand slipped off the spoon");
      }
      if (t>=mealEvents.bite&&t<=mealEvents.bite+.12) {
        assert(distance(spoon.tip,state.lip)<2.45&&spoon.tip[0]>state.faceEdge[0]+.65,label+" spoon misses lip clearance");
        lipFrames++;
      }

      const sleeve=pixels(c=>drawSleeve(c,rig,"right"));
      const hand=pixels(c=>drawHand(c,rig,"right"));
      const head=pixels(c=>drawHead(c,rig));
      const dish=pixels(c=>drawBowl(c,bowl,false));
      const utensil=pixels(c=>drawSpoon(c,spoon));
      assert.equal(overlap(sleeve,dish)+overlap(hand,dish),0,label+" sleeve or hand intersects the bowl");
      assert.equal(overlap(sleeve,head)+overlap(hand,head)+overlap(utensil,head),0,label+" hand, sleeve or spoon intersects the head");
      assert(overlap(sleeve,utensil,spoon.handle)<=2,label+" spoon intersects the sleeve beyond the grip");

      if(overlap(dish,utensil)>0){
        assert(t>=mealEvents.scoop-.35&&t<=mealEvents.lift+.024,label+" spoon entered the bowl outside the scoop");
        dipFrames++;
      }
      mealFrames++;
    }

    if (state.earPoint) {
      const arm=rig.arms.right;
      const upper=sub(arm.middle,arm.start), fore=sub(arm.end,arm.middle);
      assert(upper[1]>1.9,label+" elbow above shoulder");
      assert(cross(upper,fore)<-80,label+" elbow reversed");
      const [shoulder,elbow,wrist]=arm.parts;
      assert(Math.hypot(...upper)<=distance(shoulder.pivot,elbow.pivot)+.5,label+" upper arm stretched");
      assert(Math.hypot(...fore)<=distance(elbow.pivot,wrist.pivot)+.5,label+" lower arm stretched");
      if (previous) assert(distance(arm.end,previous.rig.arms.right.end)<5.6,label+" jump in the reaching hand");
      if (t>=ear.contact&&t<=ear.release) {
        assert(distance(arm.end,state.earPoint)<.04,label+" hand slipped off the earcup");
        cupFrames++;
      }
    }
    checked++;
    previous=state;
  }
}
assert.equal(checked,frames);
assert(lipFrames>=3&&cupFrames>=55&&dipFrames>=5&&mealFrames===324);
console.log(JSON.stringify({checked,contacts,mealFrames,dipFrames,lipFrames,cupFrames}));