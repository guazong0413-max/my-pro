"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {svg}=require("../art.cjs");
const {models}=require("../models.cjs");
const {keys,poseFor,faceParts,posedModel,shots,stage,move,FPS,frames}=require("./face.cjs");

if(shots.length!==models.length)throw new Error("Every character needs a review shot.");
const out=path.resolve(process.argv[2]||"reference-expression-keyframes");
let exported=0;
for(const model of models){
  const folder=path.join(out,model.id);
  fs.mkdirSync(folder,{recursive:true});
  for(const view of ["front","side"]){
    const neutral=faceParts(model,view,poseFor(model.id,"neutral"));
    const unique=new Set();
    for(const label of Object.keys(keys)){
      const pose=poseFor(model.id,label),parts=faceParts(model,view,pose);
      assert.deepEqual(parts.base,neutral.base,model.id+"/"+view+" head outline");
      const signature=JSON.stringify(parts);
      assert.ok(!unique.has(signature),model.id+"/"+view+" duplicated face");
      unique.add(signature);
      const revised=posedModel(model,view,pose);
      const vector=svg(revised,view,{gear:false,angles:{head:pose.tilt},pixels:6});
      assert.doesNotMatch(vector,/(NaN|Infinity)/);
      fs.writeFileSync(path.join(folder,view+"-"+label+".svg"),vector+"\n");
      exported++;
    }
  }
}
const blinks=new Map();
for(let i=0;i<frames;i++){
  const {shot,t}=stage(i), p=move(shot,t);
  for(const v of Object.values(p))assert.ok(typeof v!=="number"||Number.isFinite(v));
  assert.ok(Math.abs(p.tilt)<1.5);
  if(p.blink>.89)blinks.set(shot.id,true);
}
assert.equal(blinks.size,models.length);
const timing={
  fps:FPS,frames,duration:frames/FPS,
  shots:shots.map(({id,label,from,to})=>({id,label,from,to,start:from/FPS,end:to/FPS}))
};
fs.writeFileSync(path.join(out,"timing.json"),JSON.stringify(timing,null,2)+"\n");
console.log(exported+" editable poses and "+frames+" presentation frames");
