"use strict";

const {clamp, lerp, ease, pulse, path, rect, round, ell, line, poly, text, grad, glow, place, rand}=require("../开篇九十秒/drawing.cjs");
const {cat}=require("../开篇九十秒/cast.cjs");
const {poseFor}=require("../隔门一瓶水/characters/reference-style/face.cjs");
const {createRig, bodyPoint, headPoint, restFoot, fitPelvis, placeLimbs, drawActor, sole, sides}=require("../人物动作/rig.cjs");
const story=require("./story.json");
const {events}=story;

const W=480, H=270, floor=226;
const doors={neighbor:[68,57,87,169], yu:[172,57,87,169], mei:[324,57,91,169]};

function camera(c,x,y,zoom,draw){
  c.save();
  c.translate(W/2,H/2);
  c.scale(zoom,zoom);
  c.translate(-x,-y);
  draw();
  c.restore();
}

function cue(t,keys){
  if(t<=keys[0][0])return keys[0].slice(1);
  if(t>=keys.at(-1)[0])return keys.at(-1).slice(1);
  const i=keys.findIndex(k=>k[0]>t);
  const a=keys[i-1], b=keys[i];
  return a.slice(1).map((x,j)=>lerp(x,b[j+1],ease(a[0],b[0],t)));
}

function expression(id,name,t,{blink=[],speech=0,look=0}={}){
  const e=poseFor(id,name);
  e.blink=Math.max(0,...blink.map(at=>pulse(at,at+.045,at+.067,at+.153,t)));
  e.lift+=look;
  if(speech>.23)e.mouth=speech>.51?"round":"tiny";
  return e;
}

function makeActor(id,x,y,s,dir,options={}){
  const {lean=0,drop=0,tilt=0,face,wrist,farWrist,feet,weight=0,headset=false,fit=false}=options;
  const rig=createRig(id,0,0,{drop,lean,tilt,face});
  const local=([u,v])=>[(u-x)/(s*dir),(v-y)/s];
  const world=([u,v])=>[x+u*s*dir,y+v*s];
  const stance=Object.fromEntries(sides.map(side=>{
    const foot=feet?.[side];
    if(!foot)return [side,restFoot(rig,side)];
    const [fx,fy]=local(foot.xy);
    return [side,{point:[fx,fy-sole[id].flat],angle:0,
      marker:foot.planted?foot.xy:null,contact:foot.planted?"flat":"swing"}];
  }));
  fitPelvis(rig,stance,{raise:fit,cushioning:fit ? .43 : 0});
  const hands=Object.fromEntries(sides.map(side=>{
    const neutral=rig.parts.get(side+"-arm-hand").pivot;
    const offset=(side==="right"?-weight:weight);
    return [side,{point:bodyPoint(rig,[neutral[0]+offset,neutral[1]-.55-Math.abs(offset)*.20])}];
  }));
  if(wrist)hands.right.point=local(wrist);
  if(farWrist)hands.left.point=local(farWrist);
  placeLimbs(rig,stance,hands);
  return {rig,x,y,s,dir,world,headset,feet};
}
function draw(c,a){
  place(c,a.x,a.y,a.s,()=>drawActor(c,a.rig,{headset:a.headset}),a.dir<0);
}
function wristOf(a,side="right"){return a.world(a.rig.arms[side].end);}
function facePoint(a,point){return a.world(headPoint(a.rig,point));}

function tiledFloor(c,y=226,day=false,warm=false){
  rect(c,-180,y,860,210,grad(c,0,y,30,y+80,[[0,day?"#46545d":warm?"#363335":"#2e3b43"],[1,day?"#303f48":"#1b2732"]]));
  for(const off of [11,27,50,78])line(c,[[-160,y+off],[640,y+off]],day?"#3d4b54":"#27343c",.55);
  for(let x=-105;x<680;x+=61){
    const a=226+(x-226)*.63;
    line(c,[[a,y],[x,y+101]],day?"#4b5961":"#343e46",.7);
  }
  line(c,[[-130,y],[650,y]],day?"#55616a":"#435058",.7);
}
function wall(c,y=226,colors=["#354551","#23303e","#192431"]){
  rect(c,-200,-150,880,620,grad(c,10,4,474,238,[[0,colors[0]],[.56,colors[1]],[1,colors[2]]]));
  rect(c,-140,y-49,800,48,"rgba(22,35,43,.28)");
  line(c,[[-140,y-49],[680,y-49]],"rgba(106,127,128,.25)",.75);
  rect(c,-130,y-7,800,6.8,"rgba(20,32,40,.55)");
}
function lock(c,x,y,tone="#ad9d80"){
  round(c,x-1.9,y-5.45,3.7,12,1.0,"#6e695f");
  path(c,"M"+x+" "+(y-1)+" h7.1 q1.3 .1 1.3 1.1 q0 1.04 -1.5 1.15 h-6.9Z",tone);
  ell(c,x+.08,y+4.4,.62,.85,"#262c32");
}

function doorFrame(c,[x,y,w,h]){
  rect(c,x-4.5,y-4.3,w+9,h+5.0,"#293746");
  line(c,[[x-4,y+h],[x-4,y-4],[x+w+4,y-4],[x+w+4,y+h]],"#576673",.9);
  rect(c,x,y,w,h,"#101a24");
}
function doorLeaf(c,[x,y,w,h],angle=0,label=null){
  const gap=angle*w*.295, edge=x+w-gap;
  const face=grad(c,x,y,edge,y+h,[[0,"#4a616d"],[.65,"#34485a"],[1,"#2d4050"]]);
  poly(c,[[x+.85,y],[edge,y+1.2*angle],[edge,y+h-1.05*angle],[x+.85,y+h]],face);
  rect(c,edge-.6,y+2,1.08,h-4,angle>.1?"#63777b":"#536473");
  const panel=edge-x-13;
  round(c,x+6,y+9,panel,70,1.3,"#354958","#526572",.6);
  round(c,x+6,y+95,panel,h-104,1.3,"#324655","#4c5d6a",.65);
  const cx=(x+edge)/2;
  ell(c,cx,y+56.4,1.55,1.55,"#7c7464");
  ell(c,cx,y+56.4,.75,.78,"#111e29");
  lock(c,edge-9.9,y+96);
  if(label)text(c,label,cx,y+17,5.8,"#b9c2bc","center",true);
  return edge;
}
function closedChain(c,x,y){
  round(c,x-3.2,y-3,7,5.8,.8,"#857e6b");
  round(c,x+18,y-2.8,13,5.7,.9,"#796f60");
  for(let i=0;i<7;i++){
    const u=i/6;
    ell(c,x+2.9+i*2.87,y+2.25*Math.sin(Math.PI*u),1.88,i%2?.67:1.07,null,"#c0ae8d",.45);
  }
}
function staticCabinet(c){
  round(c,143,171,79,44,2,"#5e5047","#6e6254",.65);
  rect(c,147,177,71,32,"#51463f");
  line(c,[[183,178],[183,209]],"#726353",.6);
  line(c,[[151,182],[177,182]],"#5d5248",.5);
  round(c,139,169,87,6,1.3,"#786756","#89806a",.5);
  for(const x of [149,216])rect(c,x,214,3,12,"#423c3d");
  round(c,160,138,3,30,1,"#6f5849");
  ell(c,161.5,168,9.8,2.4,"#564840");
  path(c,"M151 124 Q161 121 172 124 L176 139 Q161 142 147 139Z","#a48b6d");
  ell(c,161.5,139,14.6,2.1,"#c2a27a");
}
function nightRoom(c,t){
  wall(c,226,["#363946","#2b303e","#181f2e"]);
  tiledFloor(c,226,false,true);
  round(c,18,52,102,91,1.7,"#283645","#4b4650",1.1);
  rect(c,24,57,87,80,grad(c,20,55,115,141,[[0,"#293d52"],[1,"#182638"]]));
  for(const a of [[28,116,12,21],[46,108,12,30],[83,119,16,19]])rect(c,...a,"#243244");
  line(c,[[67,56],[67,138]],"#485562",2.1);
  line(c,[[24,95],[111,95]],"#4a5765",1.2);
  path(c,"M10 48 Q34 50 37 61 Q29 93 34 145 L8 151Z","#5a4f59");
  path(c,"M110 50 L130 49 Q124 104 130 146 L108 143 Q113 96 110 50Z","#494551");
  glow(c,156,144,154,112,"rgba(225,178,124,.20)");
  staticCabinet(c);
  const [x,y]=doors.mei;
  doorFrame(c,doors.mei);doorLeaf(c,doors.mei,0,"09");
  closedChain(c,x+58,y+81);
  place(c,198,168.03,1,()=>round(c,-10.8,-2.65,23,4.15,.9,"#d5c7a6"),false,.036);
  glow(c,287,161,188,118,"rgba(93,117,137,.13)");
}
function hall(c,t,{open=0,inside,day=true}={}){
  wall(c,226,day?["#53636a","#374a56","#253540"]:["#334651","#253641","#1d2a35"]);
  tiledFloor(c,226,day);
  poly(c,[[321,55],[477,37],[477,226],[334,226],[321,213]],"#1b2937");
  poly(c,[[332,55],[364,58],[365,225],[334,226]],"#435660");
  for(let i=0;i<6;i++){
    const x=374+i*15,y=217-i*9;
    poly(c,[[x-11,y],[x+68,y],[x+76,y-5],[x-4,y-5]],i%2?"#3b4b56":"#475863");
    line(c,[[x-6,y],[x+67,y]],"#536873",.65);
  }
  line(c,[[358,194],[455,134]],"#5a6c71",2.0);
  for(let i=0;i<4;i++){
    const x=362+25*i,y=192-15*i;
    line(c,[[x,y],[x,y+26]],"#4c5f68",1.0);
  }
  doorFrame(c,doors.neighbor);doorLeaf(c,doors.neighbor,0,"1102");
  doorFrame(c,doors.yu);
  if(inside)inside();
  doorLeaf(c,doors.yu,open,"1101");
  if(day){
    path(c,"M396 23 L430 23 L345 226 H314Z",grad(c,408,26,352,225,[[0,"rgba(220,217,185,.20)"],[1,"rgba(196,205,189,.027)"]]));
    glow(c,404,64,125,124,"rgba(180,195,177,.151)");
  }
  round(c,339,42,36,10,1.3,"#324947","#5b7471",.55);
  text(c,"楼梯",357,49.7,5.75,"#a3ba9c","center",true);
  glow(c,156,25,172,56,day?"rgba(167,193,183,.10)":"rgba(104,117,111,.10)");
}
function powder(c,x,y,n=85,open=1,seed=51){
  const limit=Math.max(0,Math.min(1,open));
  ell(c,x,y,20,2.8,"rgba(152,149,130,.12)");
  for(let i=0;i<n;i++){
    const a=rand(i+seed), d=rand(i+seed+158);
    if(a>limit)continue;
    const px=x+(a-.5)*39, py=y+(d-.5)*4.9;
    ell(c,px,py,.21+.51*rand(i+210),.13+.22*rand(i+91),i%4?"#d8d0b8":"#bbb69e");
  }
}
function shadow(c,a,alpha=.22){
  ell(c,a.x,a.y+.76,14.0*a.s,2.35*a.s,"rgba(12,19,22,"+alpha+")");
  if(!a.feet)return;
  for(const foot of Object.values(a.feet)){
    if(foot.planted)ell(c,foot.xy[0]+2.7*a.dir,foot.xy[1]+.21,5.4*a.s,1.12*a.s,"rgba(12,19,22,.24)");
  }
}
function letter(c,t){
  rect(c,-100,-100,680,440,grad(c,217,99,449,268,[[0,"#706052"],[.59,"#4c4038"],[1,"#332e2d"]]));
  for(let i=0;i<6;i++){
    const y=i*54-3;
    line(c,[[-80,y],[560,y-6]],"rgba(156,124,92,.18)",1.04);
  }
  glow(c,224,128,156,107,"rgba(234,185,117,.18)");
  place(c,232,131,1,()=>{
    poly(c,[[-99,-68],[99,-65],[112,65],[-100,75]],"rgba(24,25,26,.34)");
    poly(c,[[-100,-73],[94,-76],[109,62],[-100,71]],"#decfb1");
    poly(c,[[90,64],[109,62],[99,47]],"#bbae90");
    for(let i=0;i<5;i++)line(c,[[-80,-34+i*23],[86,-35+i*23]],"#c7af92",.65);
    text(c,"我知道你收留了那个孩子。",-78,-45,10.1,"#50443b", "left");
    text(c,"我需要水。三天后有救援。",-78,-23,11,"#4f463d","left",true);
    text(c,"我给你证据。",-78,-1,11,"#55483d");
    text(c,"三瓶水放在门口。",-78,22,11.5,"#59483c","left",true);
    text(c,"三点我来取。",-78,46,11,"#51433b");
  },false,-.037+.014*ease(28.90,31.49,t));
}
function clock(c,t,ring=false){
  rect(c,-100,-100,680,420,grad(c,170,29,340,267,[[0,"#a8997d"],[.60,"#75654f"],[1,"#4c433b"]]));
  round(c,286,16,108,111,4,"#4c6869");
  rect(c,293,21,96,101,"#7b928d");
  line(c,[[340,21],[340,122]],"#9aa699",1.4);
  rect(c,-100,170,680,140,"#665046");
  line(c,[[-99,171],[579,171]],"#9e7f63",1.1);
  for(let i=0;i<6;i++){
    const y=184+i*18;
    line(c,[[-55,y],[548,y-3]],"rgba(172,145,110,.18)",.8);
  }
  glow(c,231,136,173,103,"rgba(238,194,130,.20)");
  const d=t-events.alarm;
  const shake=ring&&d>=0?.88*(Math.sin(d*48)+.23*Math.sin(d*118))*pulse(events.alarm,events.alarm+.037,84.08,84.49,t):0;
  ell(c,235,196,58,6.4,"rgba(46,34,31,.28)");
  place(c,235+shake,147,1,()=>{
    line(c,[[-26,31],[-33,46]],"#494541",4);
    line(c,[[27,30],[34,46]],"#494541",4);
    path(c,"M-39 -33 Q-46 -48 -36 -53 Q-25 -58 -16 -43Z","#884b44");
    path(c,"M39 -33 Q46 -48 36 -53 Q25 -58 16 -43Z","#884b44");
    ell(c,0,0,44,44,"#875046","#614944",1.2);
    ell(c,0,0,38.1,38.2,"#dfd4b7","#bcae95",.65);
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6, dx=Math.sin(a),dy=-Math.cos(a);
      if(i%3===0)text(c,["12","3","6","9"][i/3],dx*27,dy*26+3,7.8,"#5a5147","center",true);
      else line(c,[[dx*30,dy*30],[dx*34,dy*34]],"#756a5d",.84);
    }
    const minute=ring?38:30;
    for(const [v,len,sw] of [[(7+minute/60)*Math.PI/6,16.8,2.35],[minute*Math.PI/30,26.5,1.75]]){
      line(c,[[0,0],[Math.sin(v)*len,-Math.cos(v)*len]],"#4b4a40",sw);
    }
    const q=(ring?Math.max(0,d):t-44.9)*Math.PI/30;
    line(c,[[Math.sin(q)*-5,-Math.cos(q)*-5],[Math.sin(q)*29,-Math.cos(q)*29]],"#a05c4e",.75);
    ell(c,0,0,2.0,2.0,"#5a4d44");
  },false,shake*.013);
}
function keyring(c,x,y,r,a=0){
  place(c,x,y,r,()=>{
    ell(c,0,0,3.05,3.02,null,"#b5ad92",.62);
    path(c,"M1 1.6 L10.5 8.6 L9.7 10.2 L7.6 9.0 L6.8 9.9 L4.2 8.3 L4.1 7.3 L-.8 3.7Z","#b9a67c","#867553",.44);
    ell(c,-.28,2.13,.78,.62,"#5c5949");
    path(c,"M2.0 0.65 L8.8 4.1 L8.3 5.45 L6.5 4.7 L6.0 5.6 L3.3 4.2 L1.0 3.15Z","#a5a292","#74746a",.37);
  },false,a);
}
function paintCap(c,x,y,scale=1){
  ell(c,x,y,2.45*scale,2.25*scale,"#c0a18a");
}

module.exports={W,H,floor,events,doors,story,camera,cue,expression,makeActor,draw,shadow,wristOf,facePoint,doorFrame,doorLeaf,lock,wall,tiledFloor,nightRoom,hall,letter,clock,powder,keyring,paintCap,cat};