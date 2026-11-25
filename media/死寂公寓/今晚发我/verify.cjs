"use strict";
const assert=require("node:assert/strict");
const {entryMotion}=require("./street.cjs");
const {events,shots,lines,fps,duration}=require("./story.json");
const marks=require("./performance.json");
const prev=id=>shots.find(s=>s.id===id).at;
assert(prev("office")<events.scream && events.scream<events.lookStart && events.lookStart<prev("cross"));
assert(prev("cross")<prev("look") && prev("look")<events.doorOpen);
assert(events.doorOpen<events.threshold && events.threshold<events.doorLatch);
const before=entryMotion(events.doorOpen);
assert(before.x<803 && before.open===0);
const crossing=entryMotion(events.threshold);
assert(crossing.x>809 && crossing.x<889 && crossing.open>.98 && crossing.y>=396 && crossing.y<=409);
assert(entryMotion(events.doorLatch).x>889+22 && entryMotion(events.doorLatch).open===0);
for(let i=Math.ceil(20.8*fps);i<Math.floor(25.3*fps);i++){
  const t=i/fps,a=entryMotion(t),b=entryMotion(t+1/fps);
  assert(b.x>a.x && b.y<=a.y);
  if(a.x>813 && a.x<878)assert(a.open>.94);
}
assert(events.doorLatch<events.buzz[0] && events.buzz[0]<events.alertLight);
assert(events.buzz[2]<events.alertAt && marks.ends.repeat<events.boss1);
assert(events.boss1<events.tap && events.tap<events.typing && events.typing<events.boss2);
assert(events.boss2<lines.find(r=>r.id==="overtime").at);
for(let i=0;i<lines.length;i++){
  const row=lines[i];
  assert(marks.ends[row.id]>row.at && marks.ends[row.id]<(lines[i+1]?.at??duration));
}
assert(marks.truePeakDBTP< -1 && duration*fps===1272);
console.log("Blocking, threshold occlusion, chat order and all five voice intervals checked.");
