"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {createCanvas,installFont}=require("./draw.cjs");
const {engine}=require("./film.cjs");
const PLAN=JSON.parse(fs.readFileSync(path.join(__dirname,"timeline.json"),"utf8").replace(/^\uFEFF/,""));
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

installFont();
const movie=engine(createCanvas(480,270));
const report={frames:Math.round(PLAN.duration*PLAN.fps),legs:0,arms:0,twoHandFrames:0,
  bracedFrames:0,stairFrames:0,worstContactError:0};
let priorStair=null;
let bottleAtHold=null;

for(let i=0;i<report.frames;i++){
  const t=i/PLAN.fps;
  const {shot,diagnostics,extras}=movie.frame(t);
  for(const row of diagnostics){
    const arm=row.kind==="arm";
    const [first,second]=arm?[28,24]:[40,39];
    const label=row.person+" "+row.kind+" at "+t.toFixed(3)+"s";
    assert.ok(Math.abs(distance(row.anchor,row.joint)-first*row.scale)<1e-5,label+" upper segment");
    assert.ok(Math.abs(distance(row.joint,row.end)-second*row.scale)<1e-5,label+" lower segment");
    assert.ok(row.error<=.125,label+" misses its target by "+row.error.toFixed(3));
    report.worstContactError=Math.max(report.worstContactError,row.error);
    report[arm?"arms":"legs"]++;
  }
  if(shot===4){
    if(extras.give>.998&&extras.take>.998){
      assert.ok(Math.abs(extras.leftHand[0]-extras.bottle[0])<=62);
      assert.ok(Math.abs(extras.rightHand[0]-extras.bottle[0])<=64);
      if(!bottleAtHold)bottleAtHold=extras.bottle;
      assert.ok(distance(extras.bottle,bottleAtHold)<.02,"bottle moves during the settled two-hand hold");
      report.twoHandFrames++;
    }
  }
  if(shot===8){
    const {foot,grasp,hold,grip}=extras;
    assert.ok(foot.some(p=>p.support),"no support on the stairs at "+t.toFixed(3));
    foot.forEach((p,k)=>{
      assert.ok(p.p[1]<=p.ground+.001,"foot penetrates the step at "+t.toFixed(3));
      const last=priorStair?.[k];
      const skid=p.contact===PLAN.events.slip&&t<=PLAN.events.slip+.19;
      if(p.support&&last?.support&&p.contact===last.contact&&!skid){
        assert.ok(distance(p.p,last.p)<.001,"planted foot slides at "+t.toFixed(3));
      }
    });
    if(grasp>.999){
      assert.ok(distance(hold,grip)<.12,"hand misses the rail at "+t.toFixed(3));
      report.bracedFrames++;
    }
    priorStair=foot;
    report.stairFrames++;
  }
}
assert.ok(report.twoHandFrames>=20);
assert.ok(report.bracedFrames>=10);
console.log(JSON.stringify(report,null,2));
