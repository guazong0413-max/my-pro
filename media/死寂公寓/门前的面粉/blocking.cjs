"use strict";

const assert=require("node:assert/strict");
const {doors,floor,ajar,stairX,events,wristOf}=require("./art.cjs");

const timing={
  eyeAtViewer:20.39,
  viewerCut:20.90,
  openEnd:42.42,
  stairCut:51.97,
  stairAligned:52.45,
  neighborCut:54.51,
  closeStart:85.26
};

function kindFor(index,t){
  if(index===3)return t<timing.viewerCut?"peephole-approach":"peephole-view";
  if(index===7)return "door-opening";
  if(index===9)return t<timing.stairCut?"door-opening":"stair-view";
  if(index===10 && t<timing.neighborCut)return "stair-view";
  if(index===16)return "door-closing";
  return undefined;
}

function verifyDirection(index,t,blocking){
  const kind=kindFor(index,t), at=t.toFixed(2)+"s";
  assert.equal(blocking?.kind,kind,"Missing or wrong camera side at "+at);
  if(!kind)return;

  const {door,rear,actor,hold}=blocking;
  if(kind==="peephole-approach"||kind==="peephole-view"){
    assert.equal(door.frame,doors.mei,"Peephole must belong to Mei's closed door at "+at);
    assert.equal(door.open,0,"Mei's door opened during the peephole shot at "+at);
    if(rear){
      assert(rear.view==="rear" && rear.cameraDepth>rear.roomDepth && rear.roomDepth>0,"Camera belongs behind Mei and inside the room at "+at);
      if(t>=timing.eyeAtViewer){
        assert(Math.hypot(rear.eye[0]-door.viewer[0],rear.eye[1]-door.viewer[1])<.1,"Eye misses the door's viewer at "+at);
      }
    }else{
      assert.equal(kind,"peephole-view","Rear pose is missing at "+at);
    }
    return;
  }

  assert.equal(door.frame,doors.yu,"Wrong leaf in Yu's doorway at "+at);
  const [x,y,w]=door.frame;
  assert(door.open>=0 && door.open<=ajar && door.hinge[0]===x+.85 && door.hinge[1]===y,"Door hinge moved or swing exceeded the stop at "+at);
  assert(door.edge[0]<=x+w && door.depth>=0,"Door leaf must swing inward at "+at);
  if(kind==="stair-view"){
    const {projectX,left,right}=blocking;
    assert(door.open===ajar && right>left,"Yu's door gap changed during the view at "+at);
    if(t>=timing.stairAligned){
      assert(left<projectX(stairX) && projectX(stairX)<right,"Stairs fall outside the gap at "+at);
    }
    assert(projectX(stairX)<projectX(x+w),"Inside view must reverse the hallway camera's left and right at "+at);
    return;
  }

  const opening=kind==="door-opening";
  assert.equal(actor.dir,Math.sign(door.grip[0]-actor.x),"Yu faces away from the handle at "+at);
  assert(opening?actor.y<floor:actor.y>floor,"Yu crossed the threshold during the door action at "+at);
  const moving=opening
    ?t>=events.latch[0] && t<=timing.openEnd
    :t>=timing.closeStart && t<=events.latch.at(-1);
  if(index===7 && t<=events.latch[0])assert.equal(door.open,0,"Door moved before Yu gripped it at "+at);
  if(opening && t>=timing.openEnd)assert.equal(door.open,ajar,"Door gap changed across the clock cut at "+at);
  if(!opening && t<=timing.closeStart)assert.equal(door.open,ajar,"Door gap changed before Yu pulled it closed at "+at);
  if(!opening && t>=events.latch.at(-1))assert.equal(door.open,0,"Door latch sounded before the leaf closed at "+at);
  if(moving)assert(hold>=.999,"Yu let go while the leaf moved at "+at);
  if(hold>=.999){
    const wrist=wristOf(actor);
    assert(Math.hypot(wrist[0]-door.grip[0],wrist[1]-door.grip[1])<.055,"Yu's hand slipped off the lever at "+at);
  }
}

module.exports={timing,verifyDirection};
