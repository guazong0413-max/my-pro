"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {createCanvas}=require("../开篇九十秒/drawing.cjs");
const {sole,bodyPoint}=require("../人物动作/rig.cjs");
const {wristOf}=require("../门前的面粉/art.cjs");
const {createRenderer}=require("./film.cjs");
const {railTop,railDeck,soil,planter,bracedPalms,weightOnHands,handsOff}=require("./street.cjs");
const story=require("./story.json");

const performancePath=process.argv[2]??path.join(__dirname,"performance.json");
const performance=fs.existsSync(performancePath)?JSON.parse(fs.readFileSync(performancePath,"utf8")):null;
const render=createRenderer(createCanvas(480,270),performance??{});
const {events,fps,duration}=story;
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

if(performance){
  assert.deepEqual(performance.subs.map(row=>row[2]),story.lines.flatMap(row=>row.subs));
  assert.equal(performance.voices.length,story.lines.length);
  let previous=0;
  for(const [at,end] of performance.subs){
    assert(at>=previous-.001 && end>at,"Subtitle timing overlaps");
    previous=end;
  }
  for(const [i,voice] of performance.voices.entries()){
    const row=story.lines[i];
    assert.equal(voice.id,row.id);
    assert.equal(voice.at,row.at);
    assert(voice.tempo<=1.29 && voice.at+voice.seconds<=row.until,"Voice misses its time slot");
  }
  const talk=story.lines.filter(row=>row.role==="chen");
  for(const [frame,value] of Object.entries(performance.lips)){
    const t=Number(frame)/fps;
    if(value>0)assert(talk.some(row=>t>=row.at&&t<row.until),"Mouth opens outside Chen's line");
  }
}

const visited=new Set(), phaseFrames={};
let last=null, maximumReachError=0, planted=0, curtainContact=0, handSupport=0;
for(let frame=0;frame<duration*fps;frame++){
  const t=frame/fps,{id,state}=render(t);
  visited.add(id);
  if(!state)continue;
  if(state.phase){
    const {hip,phase,arms,legs}=state;
    phaseFrames[phase]=(phaseFrames[phase]??0)+1;
    for(const limb of [...Object.values(arms),...Object.values(legs)]){
      maximumReachError=Math.max(maximumReachError,limb.error);
      assert(limb.error<.05,"Visitor limb overextends at "+t.toFixed(3)+" by "+limb.error.toFixed(2));
    }
    if(phase==="rail"){
      assert(t<events.railRelease && hip[1]<railDeck,"Figure slipped before release");
      for(const wrist of Object.values(arms))assert(Math.abs(wrist.end[1]-railTop)<.04,"Hand misses balcony rail");
      for(const foot of Object.values(legs))assert(Math.abs(foot.end[1]+3.4-railDeck)<.04,"Foot misses balcony edge");
    }
    if(phase==="air"){
      assert(t>=events.railRelease && t<events.impact && hip[1]<soil,"Invalid flight interval");
      if(last?.state.phase==="air")assert(hip[1]>last.state.hip[1],"Figure rises during the fall");
    }
    if(t>=events.impact){
      assert(hip[0]>planter.left && hip[0]<planter.right && hip[1]<soil,"Figure misses the planter");
      assert(Object.values(legs).some(foot=>Math.abs(foot.end[1]+3.7-soil)<.045),"No foot remains on the planter");
    }
    if(t>=weightOnHands && t<=handsOff){
      for(const [side,arm] of Object.entries(arms)){
        assert(distance(arm.end,bracedPalms[side])<.045,"Brace palm slides across soil");
        assert(arm.middle[1]<soil,"The elbow sinks into the planter");
        handSupport++;
      }
    }
  }
  if(state.actor){
    const {actor,mode,curtain}=state;
    const {rig,feet}=actor;
    for(const limb of [...Object.values(rig.arms),...Object.values(rig.legs)]){
      maximumReachError=Math.max(maximumReachError,limb.error);
      assert(limb.error<.055,"Chen limb overextends at "+t.toFixed(3)+" by "+limb.error.toFixed(2));
    }
    if(curtain?.take>=.999){
      assert.equal(actor.dir,-1,"Chen faces away from the window");
      assert(distance(wristOf(actor),curtain.grip)<.06,"Hand slides off the curtain before release");
      curtainContact++;
    }
    if(id==="retreat" && t>=events.wallTouch && t<events.wallTouch+.08){
      const back=actor.world(bodyPoint(rig,[-14,57]));
      assert(Math.abs(back[0]-state.wallX)<6,"Chen stops away from the wall");
    }
    assert(Object.values(feet).some(foot=>foot.planted),"No supporting foot at "+t);
    for(const [side,foot] of Object.entries(feet)){
      const [x,y]=actor.world(rig.legs[side].end);
      assert(distance([x,y+actor.s*sole.yu.flat],foot.xy)<.045,"Bare foot misses its mark at "+t.toFixed(3));
      if(!foot.planted)continue;
      const before=last?.id===id?last.state.actor.feet[side]:null;
      if(before?.planted)assert(distance(foot.xy,before.xy)<.001,"Planted sole slides");
      planted++;
    }
    if(last?.id===id && mode!=="turn"){
      const advance=(actor.x-last.state.actor.x)*actor.dir;
      assert((mode==="backing"?-advance:advance)>=-.001,"Body direction changed against the action at "+t);
    }
  }
  if(id==="window")assert(state.glass && state.view==="room-to-street","Window point of view is reversed");
  last={id,state};
}
assert.equal(visited.size,story.shots.length);
assert(curtainContact>0 && handSupport>0,"Missing contact stage");
for(const phase of ["rail","air","landed","brace","rise"])assert(phaseFrames[phase]>0,"Missing "+phase);
console.log(JSON.stringify({frames:duration*fps,shots:visited.size,phaseFrames,planted,curtainContact,handSupport,maximumReachError,subtitles:performance?.subs.length??0}));
