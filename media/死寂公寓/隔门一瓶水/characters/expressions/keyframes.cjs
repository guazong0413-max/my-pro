"use strict";

const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const {svg}=require("../art.cjs");
const {models}=require("../models.cjs");
const {expressionModel,faceParts,standPose}=require("./face.cjs");
const {chapters,totalFrames,FPS,performance}=require("./moves.cjs");

const dest=path.resolve(process.argv[2]||"expression-keyframes");
const shapes=["front","side"];
let exported=0;
const blinkPeaks=[];

for(const model of models){
  const folder=path.join(dest,model.id);
  fs.mkdirSync(folder,{recursive:true});
  const closures=[];
  for(let i=0;i<chapters[0].to;i++)closures.push(performance(model.id,i).blink);
  const closure=Math.max(...closures);
  assert.ok(closure>.955,"Natural blink never fully closes for "+model.id);
  blinkPeaks.push(closures.indexOf(closure));
  for(const direction of shapes){
    const identities=new Set();
    for(const cue of chapters){
      const pose=standPose(model.id,cue.id);
      const art=expressionModel(model,direction,pose);
      const vector=svg(art,direction,{gear:false,angles:{head:pose.tilt},pixels:6,
        bounds:[-37,-12,74,model.height+22]});
      assert.doesNotMatch(vector,/(NaN|Infinity)/);
      const signature=JSON.stringify(faceParts(model,direction,pose));
      assert.ok(!identities.has(signature),model.id+"/"+direction+"/"+cue.id+" duplicates another state");
      identities.add(signature);
      fs.writeFileSync(path.join(folder,direction+"-"+cue.id+".svg"),vector+"\n");
      exported++;
    }
  }
  for(let i=0;i<totalFrames;i++){
    const current=performance(model.id,i);
    for(const field of Object.values(current))assert.ok(Number.isFinite(field));
    for(const direction of shapes){
      const pieces=faceParts(model,direction,current);
      for(const item of Object.values(pieces).flat()){
        if(item.tag==="path")assert.doesNotMatch(item.d,/(NaN|Infinity)/);
        if(item.tag==="ellipse")assert.ok(item.rx>0&&item.ry>0);
      }
    }
  }
}

assert.equal(new Set(blinkPeaks).size,models.length,"The natural blinks must be staggered.");
assert.equal(exported,models.length*shapes.length*chapters.length);
const meta={
  fps:FPS,frames:totalFrames,seconds:totalFrames/FPS,
  segments:chapters.map(({id,label,from,to})=>({id,label,from,to,start:from/FPS,end:to/FPS}))
};
fs.writeFileSync(path.join(dest,"timing.json"),JSON.stringify(meta,null,2)+"\n");
console.log(exported+" editable expression SVGs and "+totalFrames+" animation frames checked");
