"use strict";

const assert=require("node:assert/strict");
const {engine}=require("./film.cjs");
const {createCanvas}=require("./draw.cjs");
const {chainGeometry,LINK_COUNT,CHAIN_LENGTH,MOUNT_DISTANCE}=require("./props.cjs");
const {duration,fps,events}=require("./timeline.json");
const film=engine(createCanvas(480,270));
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

for(let i=0;i<=100;i++){
  const anchor=[0,0],end=[MOUNT_DISTANCE+(CHAIN_LENGTH-MOUNT_DISTANCE)*i/100,0];
  const chain=chainGeometry(anchor,end,CHAIN_LENGTH);
  assert.equal(chain.links.length,LINK_COUNT);
  assert(Math.abs(chain.measured-CHAIN_LENGTH)<.008,"Chain length drift during opening");
  assert(chain.links[0].point[0]>=anchor[0]&&chain.links.at(-1).point[0]<=end[0]);
}

let joints=0,dualGrip=0,rail=0,hardware=0,maxReachError=0;
for(let f=0;f<duration*fps;f++){
  const t=f/fps,d=film.frame(t);
  for(const sample of d.diagnostics){
    const {anchor,joint,end,target,lengths,scale}=sample;
    assert(Math.abs(distance(anchor,joint)-lengths[0]*scale)<1e-6,"Upper segment changed length");
    assert(Math.abs(distance(joint,end)-lengths[1]*scale)<1e-6,"Lower segment changed length");
    const residual=distance(end,target);
    maxReachError=Math.max(maxReachError,residual);
    assert(residual<.13,"Unreachable wrist or shoe on frame "+f);
    joints++;
  }
  const e=d.extras;
  if(e?.hardware){
    assert.equal(e.hardware.links.length,LINK_COUNT);
    assert(Math.abs(e.hardware.measured-CHAIN_LENGTH*3.57)<.009);
    hardware++;
  }
  if(e?.bottle&&e.give>=.99&&e.take>=.99){
    assert(Math.abs(e.bottle[0]-e.leftHand[0]-56)<.04);
    assert(Math.abs(e.rightHand[0]-e.bottle[0]-56)<.04);
    dualGrip++;
  }
  if(e?.bottle&&e.give<.98)assert(e.take>.99,"First hand released before the second held");
  if(e?.grasp===1){
    const arm=d.diagnostics.filter(x=>x.kind==="arm").at(-1);
    assert(distance(arm.end,e.hold)<.13,"Rail grip drifted");
    rail++;
  }
  if(f===Math.ceil(events.chainTaut*fps)&&e?.hardware)assert(e.hardware.sag<.10);
}
assert(dualGrip>=20,"The exchange needs a visibly held two-hand beat");
assert(rail>=8,"The railing contact needs a stable hold");
console.log(JSON.stringify({frames:duration*fps,joints,maxReachError,dualGrip,rail,hardware}));