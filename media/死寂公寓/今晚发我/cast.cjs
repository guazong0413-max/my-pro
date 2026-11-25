"use strict";
const {path,ell,line,round,rect,poly,lerp,ease,clamp,mod,tau}=require("./visual.cjs");
const {solve,continuousLimb}=require("../人物动作/rig.cjs");
function limb(c,start,end,l1,l2,bend,widths,color){
  const b=solve(start,end,l1,l2,bend);continuousLimb(c,b,widths,color,true);return b;
}
function foot(c,x,y,facing,col,scale=1){
  c.save();c.translate(x,y);c.scale(facing*scale,scale);
  path(c,"M-4 -3 Q-1 -4 3 -2 L7 .1 Q10 .6 10 2.6 Q10 3.6 6 3.6 L-3 3.6 Q-5 3 -4 -3Z",col);
  c.restore();
}
function cycleFoot(dist,offset,period,lift,rest){
  const u=mod(dist/period+offset,1),duty=.41,spread=period*duty*.5;
  if(u<duty)return [spread-period*u,rest];
  const k=(u-duty)/(1-duty),m=k*k*(3-2*k);
  return [lerp(-spread,spread,m),rest-lift*Math.sin(k*Math.PI)**1.25];
}
const blinkAt=(t,marks)=>Math.max(0,...marks.map(a=>Math.max(0,1-Math.abs(t-a)/.092)));
function girlHead(c,{yaw=0,rear=0,alarm=0,blink=0,tilt=0,gaze=0}={}){
  c.save();c.rotate(tilt);
  const side=Math.sign(yaw)||1,prof=Math.abs(yaw);
  const skin="#cda68a",shade="#ae8778",hair="#27303b",light="#47505b";
  // Local origin is the neck. The facial landmarks rotate between the two profiles.
  path(c,"M-14 -21 Q-17 -33 -12 -41 Q-6 -49 4 -47 Q16 -46 19 -35 L19 -18 Q18 -9 9 -3 L-3 -4 Q-11 -7 -14 -21Z",hair);
  c.save();c.scale(side,1);
  const far=lerp(16,12,prof);
  path(c,"M-"+far+" -28 Q-15 -39 -5 -41 Q7 -44 14 -36 Q18 -30 17 -22 L"+(18+3*prof)+" -17 Q21 -15 17 -14 Q16 -6 8 -3 Q-1 -2 -8 -7 Q-15 -13 -"+far+" -28Z",skin);
  path(c,"M-14 -29 Q-12 -15 -6 -12 Q-3 -6 3 -3 Q-7 -4 -12 -11 Q-17 -17 -14 -29Z",shade);
  ell(c,-9+2*prof,-19,3.4,4.2,shade);
  const ey=-24+gaze*1.25, fx=lerp(7,12.9,prof), nearOpen=1-blink;
  line(c,[[fx-3,ey-3.8-alarm*2],[fx+.8,ey-4.6-alarm*1.3],[fx+2.3,ey-4.2]],"#4e4141",1.05);
  if(prof<.8){
    const xx=-6+7*prof;
    line(c,[[xx-2.3,ey-3.6],[xx+.9,ey-4.1-alarm]],"#574745",.9);
    if(nearOpen>.25)ell(c,xx+gaze*.7,ey,1.15,1.25*nearOpen,"#33313a");
  }
  if(nearOpen<.21)line(c,[[fx-1.9,ey],[fx+2,ey-.1]],"#44383b",.8);
  else{
    ell(c,fx,ey,1.68,1.30*nearOpen+.46*alarm,"#40353a");
    ell(c,fx+.55,ey-.36,.35,.38,"#f6ddba");
  }
  line(c,[[8+prof*4,-9],[11.1+prof*2,-8.9-alarm*.65]],"#835d5a",.85);
  path(c,"M-15 -14 Q-20 -21 -18 -33 Q-17 -43 -9 -47 Q4 -52 14 -44 Q19 -40 18 -34 Q10 -33 6 -36 Q1 -27 -7 -24 L-9 -15 L-10 -7 Q-15 -10 -15 -14Z",hair);
  path(c,"M-16 -33 Q-15 -44 -6 -46 Q4 -48 11 -43",null,light,.85);
  path(c,"M-13 -17 Q-12 -7 -16 -4 Q-10 -4 -8 -11",hair);
  if(rear>0){
    c.globalAlpha=rear;
    path(c,"M-18 -29 Q-19 -46 -4 -48 Q13 -51 18 -37 Q22 -20 15 -11 Q9 -4 2 -6 Q-8 -4 -14 -11 Q-18 -18 -18 -29Z",hair);
    path(c,"M-13 -38 Q-6 -45 3 -43 M-9 -15 Q-4 -9 3 -10",null,light,.72);
  }
  c.restore();c.restore();
}
function hero(c,x,y,s,t,pose={}){
  const {face=1,yaw=.8,rear=0,alert=0,tilt=0,gaze=0,distance=0,walking=0,work=0,hold=0,lean=0}=pose;
  c.save();c.translate(x,y);c.scale(s,s);
  const osc=Math.sin(distance/77*tau),breath=.65*Math.sin(t*2.05);
  const hipY=-61.2+5.1*walking-2.2*walking*Math.cos(distance/77*tau*2);
  const hx=lean*1.3,sh=[hx+face*lean*3,hipY-37+breath];
  for(let i=0;i<2;i++){
    const k=cycleFoot(distance,i*.5,77,13,-4);
    const fx=face*lerp(i?5:-6,k[0],walking),fy=lerp(-4,k[1],walking);
    limb(c,[hx+(i?3:-3),hipY],[fx,fy],29.1,29.6,-face,[6.3,4.9,3.8],i?"#424752":"#323b48");
    foot(c,fx,fy,face,i?"#6e625c":"#554f50");
  }
  const arm=(i)=>{
    const shoulder=[sh[0]+(i?3:-3),sh[1]+1];
    let target=[shoulder[0]+face*(3+(i?1:-1)*13*osc*walking),shoulder[1]+41-3*walking];
    if(work>0){
      const tap=Math.max(0,Math.sin((t*14+i*2.7)))*2;
      target=[lerp(target[0],face*(i?42:38),work),lerp(target[1],-61.6+tap,work)];
    }
    if(hold>0)target=[lerp(target[0],face*(i?24:21),hold),lerp(target[1],-73+i*2,hold)];
    const b=limb(c,shoulder,target,26,26,face,[7.4,5.8,4.5],i?"#a76d52":"#825844");
    ell(c,b.end[0],b.end[1],4.0,3.7,i?"#c9a388":"#aa8874");
    return b.end;
  };
  arm(0);
  c.save();c.translate(sh[0],sh[1]);c.rotate(-lean*.035*face);
  path(c,"M-10 -2 Q-6 -5 5 -4 Q12 -4 14 5 L15 25 L16 38 Q5 42 -14 38 L-13 20 Q-16 4 -10 -2Z","#ac7457");
  path(c,"M-11 3 Q-9 14 -9 26 L-10 39 L-14 38 L-13 14Z","#835b4d");
  if(rear<.5){path(c,"M2 -3 L9 -2 L7 15 L4 11Z","#c0a286");line(c,[[6,12],[7,36]],"#896351",.6);}
  path(c,"M-12 32 Q2 34 14 31",null,"#bd8966",.8);
  round(c,-4.8,-12,10.5,14,3.6,"#b78e78");
  c.translate(0,-8);girlHead(c,{yaw,rear,alarm:alert,blink:blinkAt(t,[10.4,11.4,14.5,28.3,44.2,45.5,47.1,50.3]),tilt,gaze});
  c.restore();
  const hand=arm(1);
  if(hold>.8){
    c.save();c.translate(hand[0]+face*2,hand[1]-5);c.rotate(-.14*face);
    round(c,-4,-7,8,13,1.4,"#26313a","#677477",.65);c.restore();
  }
  c.restore();
}
const runners={
  hood:{coat:"#d3a64f",lit:"#ebc470",shade:"#9f7e46",trou:"#374050",shoe:"#abb1a4",skin:"#bd9278",hair:"#3a3736"},
  chase:{coat:"#86564d",lit:"#a66a59",shade:"#663f3d",trou:"#25343e",shoe:"#9c9e90",skin:"#a48472",hair:"#252e38"},
  entry:{coat:"#70a29a",lit:"#98bcb0",shade:"#4c7777",trou:"#344453",shoe:"#b8b6a1",skin:"#bc977e",hair:"#29343a"}
};
function runner(c,kind,x,y,s,distance,turn=0,glance=0){
  const a=runners[kind], phase=distance/94*tau,hip=-44-3.0*Math.cos(phase*2), lean=kind==="chase"?12:9;
  c.save();c.translate(x,y);c.scale(s*(1-.42*turn),s);
  for(let i=0;i<2;i++){
    const k=cycleFoot(distance,i*.5,94,25,-4.2);
    limb(c,[(i?3:-2),hip],k,27.4,27.9,-1,[5.9,4.2,2.8],i?a.trou:"#293642");
    foot(c,k[0],k[1],1,i?a.shoe:"#727f7c",.78);
  }
  const sy=hip-33;
  function arm(i){
    const wave=Math.sin(phase+(i?0:Math.PI));
    const sh=[lean+(i?2:-2),sy+2];
    const wrist=[sh[0]+6+19*wave,sh[1]+16-9*wave];
    const b=limb(c,sh,wrist,18.3,18.0,1,[5.1,3.9,2.8],i?a.lit:a.shade);
    ell(c,b.end[0]+.7,b.end[1]-.45,3.3,2.8,a.skin);
  }
  arm(0);
  path(c,"M"+(lean-7)+" "+(sy-1)+" Q"+(lean+4)+" "+(sy-7)+" "+(lean+10)+" "+(sy+1)+" L10 "+(hip+3)+" Q0 "+(hip+7)+" -10 "+(hip+1)+"Z",a.coat);
  if(kind==="entry"){
    line(c,[[lean+6,sy],[0,hip-6]],"#343f40",2.4);
    round(c,-7,hip-10,14,10,3,"#b59672");
  }
  c.save();c.translate(lean+3,sy-3);c.rotate(.12-.29*glance);
  if(glance>.5)c.scale(-1,1);
  ell(c,2,-8,9.5,12.3,a.skin);
  if(kind==="hood")path(c,"M-10 0 Q-14 -16 -5 -22 Q5 -27 10 -16 Q10 -12 9 -9 L5 -15 Q0 -15 -1 -5 L-2 4Z",a.lit);
  else if(kind==="entry"){ell(c,-9,-6,5.5,5.6,a.hair);path(c,"M-8 -2 Q-13 -15 -6 -20 Q3 -25 10 -15 L10 -11 Q4 -12 0 -14 L-4 1Z",a.hair);}
  else path(c,"M-8 -2 Q-13 -17 -5 -21 Q6 -24 11 -15 L12 -11 L4 -13 L1 -8 L-4 -5Z",a.hair);
  if(turn<.68){poly(c,[[9,-11],[12,-7],[9,-6]],a.skin);ell(c,8,-10,1,.8,"#34363b");}
  const back=Math.max(turn,1-Math.abs(2*glance-1));
  if(back>.03){c.globalAlpha=back;ell(c,0,-10,9.5,11.8,kind==="hood"?a.lit:a.hair);c.globalAlpha=1;}
  c.restore();arm(1);c.restore();
}
module.exports={hero,girlHead,runner,blinkAt};
