const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {fps,length,shots,beat,child,adult,hull,toWorld,grip,rim,red,white,camera,penTimes,walkingPhase}=require('./src/motion.cjs');
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const almost=(a,b,eps=1e-4)=>assert.ok(Math.abs(a-b)<eps,a+' and '+b);
const close=(a,b,eps)=>assert.ok(distance(a,b)<eps,JSON.stringify({a,b,eps}));
assert.equal(shots[0].from,0);
assert.equal(shots.length,16);
assert.equal(new Set(shots.map(s=>s.id)).size,shots.length);
assert(shots.every((shot,i)=>shot.from===shot.at*fps && (!i||shot.from>shots[i-1].from)));
for(const base of ['river','ferry','foley','score']){
 const file=path.join(__dirname,'public','sound',base+'.flac');
 assert.equal(fs.readFileSync(file).toString('ascii',0,4),'fLaC');
}
for(const fn of [red,white]){
 for(const t of fn===red?[beat.launch,16.7,19.05,beat.splash,33.28]:[beat.reply,beat.catch]){
   close(fn(t-.00001),fn(t+.00001),t===33.28?2.4:.01);
 }
}
close(red(beat.launch),grip(child(beat.launch)),1e-6);
close(white(beat.reply),grip(adult(beat.reply)),1e-6);
close(white(beat.catch),grip(child(beat.catch)),1e-6);
const atImpact=red(beat.splash),rad=atImpact.angle*Math.PI/180;
close({x:atImpact.x+35*Math.cos(rad)+12*Math.sin(rad),y:atImpact.y+35*Math.sin(rad)-12*Math.cos(rad)},{x:619,y:467},1e-6);
const lip=rim(beat.netDip),floating=red(beat.netDip);
assert(((lip.x-floating.x)/17)**2+((lip.y-floating.y)/5.3)**2<1,'paper must be inside the projected net opening');
assert.equal(penTimes.length,8);
assert(penTimes.every(([a,b],i)=>b>a&&a>49.2&&b<58.8&&(!i||a>penTimes[i-1][1])));
const feetHeld=new Map();
let weightFrames=0,netFrames=0,catchFrames=0,framed=0;
for(let frame=0;frame<length*fps;frame++){
 const t=frame/fps,kid=child(t),crew=adult(t),boat=hull(t);
 assert(kid.x<crew.x&&kid.facing===1&&crew.facing===-1);
 for(const [a,front,back] of [[kid,[27,25],[25,24]],[crew,[32,31],[31,30]]]){
   for(const [shoulder,arm,bones] of [[a.shoulder,a.arm,front],[a.farShoulder,a.backArm,back]]){
     almost(distance(shoulder,arm.joint),bones[0]);almost(distance(arm.joint,arm.end),bones[1]);
   }
 }
 for(let i=0;i<2;i++){
   const phase=walkingPhase(t)+(i===0?1:0);
   if(phase%2<1&&t>=4.8&&t<=9.9){
      const key=i+'-'+Math.floor(phase/2),foot=toWorld(kid,kid.feet[i]);
      if(feetHeld.has(key))close(foot,feetHeld.get(key),1e-5);else feetHeld.set(key,foot);
      almost(foot.y+4,420);weightFrames++;
   }
   const foot=toWorld(crew,crew.feet[i]);
   almost(foot.y+4,426+boat.y);almost(foot.x,665+boat.x-crew.feet[i].x);
 }
 if(t>=33.28&&t<37.6){
   const basket=rim(t);close(red(t),{x:basket.x+1,y:basket.y-2},1e-5);netFrames++;
 }
 if(t>=32.9&&t<=34){
   const cam=camera('scoop',t),half=cam.w*9/32;
   assert(crew.y-114+crew.h-33>cam.y-half,'hat cropped at '+t);
   assert(rim(t).y+20<cam.y+half,'basket cropped at '+t);framed++;
 }
 if(t>=beat.catch&&t<=78.4){
   close(white(t),grip(kid),1e-5);
   if(t>=76.32)assert(white(t).y>kid.y-58,'return hold should be below the face');
   catchFrames++;
 }
 if(t<=beat.depart)almost(boat.x,0);
}
assert(weightFrames>=145&&netFrames>=126&&framed>=30&&catchFrames>=87);
console.log(JSON.stringify({frames:fps*length,shots:shots.length,plantedFootFrames:weightFrames,netCarriesPaperFrames:netFrames,scoopFramingFrames:framed,catchContactFrames:catchFrames,drawnStrokes:penTimes.length}));
