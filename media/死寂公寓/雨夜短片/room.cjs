"use strict";

const {lerp,ease,pulse,path,rect,round,ell,line,poly,text,grad,glow,place}=require("../开篇九十秒/drawing.cjs");
const {makeActor,wristOf}=require("../门前的面粉/art.cjs");
const {route}=require("../门前的面粉/scenes.cjs");
const {bodyPoint,headPoint,continuousLimb,sole}=require("../人物动作/rig.cjs");
const {W,H,camera,night,rain}=require("./art.cjs");
const {events}=require("./story.json");

const floor=443, wallX=478;
const windowFrame={left:87,right:438,top:61,sill:386};
const length=sole.yu.flat;
const curtainHandY=319;
const openAmount=.84;
const first={dir:-1,initial:{left:[484,floor],right:[502,floor]},lands:events.firstSteps,
  next:[[455,floor],[425,floor],[370,floor],[387,floor]],start:15.43};
const retreatPlan={dir:1,initial:{left:[370,floor],right:[387,floor]},lands:events.retreatSteps,
  next:[[412,floor],[438,floor],[454,floor],[474,floor]],start:56.92};
const hidePlan={dir:1,initial:{left:[454,floor],right:[474,floor]},lands:events.hideSteps,
  next:[[493,floor],[524,floor],[554,floor],[584,floor],[616,floor],[646,floor],[677,floor],[708,floor],[731,floor]],start:69.43};

const curtainX=amount=>263+79*amount;
const phoneWaves=events.phoneBuzz;
const appShape=[
  [.19,3.6],[.22,4.0],[.17,3.2]
];

function buzzing(t) {
  return phoneWaves.reduce((v,at,i)=>{
    const [seconds,energy]=appShape[i], d=t-at;
    if(d<0||d>seconds)return v;
    return v+energy*Math.sin(d*172)*pulse(at,at+.012,at+seconds-.035,at+seconds,t);
  },0);
}

function curtains(c,amount,detail=1) {
  const {left,right,top,sill}=windowFrame;
  const cloth=[{lo:left-5,hi:261-71*amount,folds:12},{lo:curtainX(amount),hi:right+5,folds:12}];
  for(const {lo,hi,folds} of cloth){
    rect(c,lo,top,hi-lo,sill-top,"#182936");
    for(let i=0;i<folds;i++){
      const w=(hi-lo)/folds,x=lo+i*w;
      const ribbon=grad(c,x,top,x+w,top,[[0,"#172734"],[.57,"#273945"],[1,"#15242f"]]);
      path(c,"M"+x+" "+top+" H"+(x+w)+" Q"+(x+w-1.8)+" 208 "+(x+w+.1)+" 319 L"+(x+w)+" "+(sill+2)+" Q"+(x+w*.42)+" "+(sill+6)+" "+x+" "+(sill+2)+"Z",ribbon);
      line(c,[[x+1.52,top+1],[x+.72,sill+1]],"rgba(104,122,126,"+(.081*detail)+")",.7);
    }
  }
}

function room(c,t,opening=0) {
  night(c,"#233542","#12212c");
  rect(c,-960,floor,2880,775,grad(c,0,floor,0,floor+162,[[0,"#1d252b"],[1,"#0e161e"]]));
  rect(c,-960,floor-9,2880,8,"#293441");
  for(const y of [floor+9,floor+26,floor+51,floor+83]){
    line(c,[[-850,y],[1840,y]],"#27323a",.74);
  }
  for(let i=0;i<9;i++){
    const x=115*i;
    line(c,[[x,floor],[x+34*(i-4),563]],"rgba(117,122,117,.095)",.7);
  }
  const {left,right,top,sill}=windowFrame;
  rect(c,left-8,top-9,right-left+16,sill-top+19,"#17242e");
  rect(c,left,top,right-left,sill-top,grad(c,left,top,right,sill,[[0,"#263847"],[1,"#192a39"]]));
  glow(c,224,203,178,227,"rgba(107,151,183,.22)");
  for(let j=0;j<6;j++){
    const bx=left+4+j*61,by=180+((j*59)%128);
    rect(c,bx,by,47,sill-by,"#1c2a37");
    for(let k=0;k<4;k++)rect(c,bx+9,by+8+k*19,10,6,k===1&&j%2===0?"#69594c":"#1a2430");
  }
  if(opening>.02){
    glow(c,249,186,28,39,"rgba(183,158,119,.17)");
    rect(c,247.3,184.3,3.4,3.2,"#a88f6d");
    rain(c,t,{x:left,y:top,w:right-left,h:sill-top,count:50,strength:.56});
  }
  line(c,[[262,top],[262,sill]],"#192a38",4.6);
  curtains(c,opening);
  line(c,[[left-6,sill+7],[right+8,sill+7]],"#3a4a52",2.0);
  rect(c,wallX,55,5,floor-55,"#202d38");
  rect(c,wallX+5,55,2,floor-55,"rgba(80,99,112,.18)");
  round(c,545,123,152,77,1.4,"#1d2b35","#344753",1.65);
  round(c,552,129,137,64,1.0,"#243641");
  round(c,523,333,245,84,9,"#314454","#203141",1.4);
  round(c,515,362,259,60,6,"#384b5b");
  round(c,517,364,245,26,3,"#3e5360");
  rect(c,527,414,5,27,"#24343e");
  rect(c,746,413,5,27,"#24343e");
  line(c,[[620,365],[620,416]],"#364957",.96);
  round(c,550,405,162,8,2.6,"#665446");
  rect(c,558,412,4,30,"#473a33");
  rect(c,702,412,4,30,"#473a33");
  entry(c);
  glow(c,260,281,233,175,"rgba(102,132,155,.095)");
}

function entry(c) {
  const x=813, y=156,w=119,h=floor-y;
  rect(c,x-6,y-7,w+12,h+9,"#182632");
  line(c,[[x-4,floor],[x-4,y-5],[x+w+4,y-5],[x+w+4,floor]],"#3f4a51",1.6);
  rect(c,x,y,w,h,grad(c,x,y,x+w,floor,[[0,"#4b4136"],[1,"#362d28"]]));
  round(c,x+10,y+12,w-20,111,1.65,"#433b33","#292725",1.1);
  round(c,x+10,y+145,w-20,h-154,1.65,"#403831","#252523",1.05);
  ell(c,x+w*.53,y+85,2.3,2.3,"#a09070");
  ell(c,x+w*.53,y+85,1.04,1.04,"#1b2027");
  round(c,x+10,y+128,6.5,22,1.6,"#857e6c");
  round(c,x+12,y+135,15,3.6,.85,"#b4a68b");
  line(c,[[x,floor-.28],[x+w,floor-.28]],"#675447",1);
}

function heroHead(c,expression) {
  const lit=expression.lit,alert=expression.alert;
  const skin=lit?"#52616b":"#657174";
  const shade=lit?"#303e48":"#46545d";
  path(c,"M-8 2 Q-5 -1 3.6 .9 Q11.6 2.5 13.2 9.5 Q14.2 13.9 15.1 16.2 L18.6 19.6 Q19.1 21.6 15.0 22.4 Q14.6 27.5 11.6 31 Q8.9 33.9 3.5 31.1 Q-3.5 30.3 -8.2 25 Q-14 19.0 -13.4 11.6 Q-12.6 5.6 -8 2Z",skin);
  path(c,"M-12.5 12 Q-10.8 15.5 -6.0 18.7 L-3.2 23.7 Q-.2 28.3 4.6 31.6 Q-4 30.4 -8.2 25 Q-13.9 19.2 -13.4 11.6Z",shade);
  path(c,"M-12.3 19.2 Q-16.9 15.0 -15 8.3 Q-12.9 -.6 -4.1 -1.6 Q6.9 -2.9 11.6 3.8 Q15.8 7.9 13.0 11.4 Q11.1 7.6 6.1 7.6 Q3.0 10.2 -.6 11.0 Q-5.0 12.8 -5.1 18.9 L-7.5 21.7 Q-9.7 22.1 -12.3 19.2Z","#151f28");
  path(c,"M-12.7 8.4 Q-10.5 1.6 -5.4 1.13 Q1.6 -.24 7.4 3.2",null,"#35404a",.64);
  if(lit)line(c,[[8.9,9.0],[12.2,12.2],[14.8,16.4],[18.1,19.9]],"rgba(142,168,175,.26)",.49);
  const blink=expression.blink;
  line(c,[[8.0,13.7-alert],[11.3,13.1-alert],[13.0,14.0]],"#38424a",.74);
  if(blink>.48)line(c,[[9.2,16.9],[12.3,16.7]],"#283740",.63);
  else{
    ell(c,11.2,16.24,.84+.12*alert,.82,"#26323a");
    if(lit)ell(c,11.7,16.1,.32,.40,"#94a8af");
  }
  if(expression.lip>.28)ell(c,12.4,26.25,1.59,expression.lip>.53?1.01:.52,"#434950");
  else path(c,"M10.4 26.22 Q12.3 26.41 14 26.04",null,"#414b52",.62);
  path(c,"M-5.5 17.2 Q-8.2 16.7 -7.4 19.4 Q-6.5 21.9 -4.8 21.2Z",shade);
}

function bareFoot(c,limb,near) {
  c.save();
  c.translate(...limb.end);
  c.rotate(limb.angle);
  path(c,"M-3.30 -3 Q.1 -3.7 4 -2.7 L5.6 .8 Q7.8 2.4 11.3 3.0 Q14.1 3.5 13.7 5.55 Q13.3 6.61 9.0 6.65 L-4.2 6.54 Q-5.8 4.64 -4.7 1.83Z",
    near?"#727777":"#535d61","#4a555b",.35);
  c.restore();
}

function hero(c,a,t,{lit=false,alert=0,lip=0}={}) {
  const r=a.rig;
  const blink=Math.max(...[13.16,41.9,57.94,65.97,74.76,80.26].map(x=>pulse(x,x+.046,x+.08,x+.166,t)));
  place(c,a.x,a.y,a.s,()=>{
    for(const side of ["left","right"]){
      const near=side==="right";
      const leg=r.legs[side];
      continuousLimb(c,leg,[7.1,5.05,3.91],near?"#384653":"#283642");
      bareFoot(c,leg,near);
    }
    const arm=(side,near)=>{
      const a0=r.arms[side];
      continuousLimb(c,a0,[5.55,4.25,2.85],near?"#394954":"#2d3b46");
      ell(c,...a0.end,2.96,2.76,near?"#717b7a":"#5b676b");
    };
    arm("left",false);
    c.save();c.translate(...bodyPoint(r,[0,0]));c.rotate(r.lean);
    path(c,"M-7.64 25.1 Q-2 28.4 4.8 28.8 L5.8 35.5 Q-.1 42.1 -9.4 35.8Z",lit?"#384854":"#4f6067");
    path(c,"M-7.4 31.1 Q-.1 36.4 7.4 33.6 Q13.3 36.8 13.6 44.6 L12 62 Q11.8 78 13.9 103 Q.6 107.7 -14.9 103 Q-16 91.4 -14.7 76.8 Q-15.4 64.5 -16.1 53 Q-16.8 41.9 -12 36Z","#414c57","#2c3b45",.49);
    path(c,"M-16 49 Q-11.9 59.5 -11.6 70.8 L-13.6 102.5 L-15 103 Q-16.1 90.9 -14.7 76.1 Q-15.3 63.8 -16 49Z","#344652");
    path(c,"M-8.6 33.2 Q.9 39.5 9.1 35.5",null,"#53636a",.88);
    path(c,"M-11.13 99.52 Q.5 101.3 11.1 99.0",null,"#4f6068",.54);
    c.restore();
    arm("right",true);
    const pivot=r.parts.get("head").pivot;
    c.save();c.translate(...headPoint(r,pivot));c.rotate(r.lean+r.tilt);
    c.translate(-pivot[0],-pivot[1]);
    heroHead(c,{lit,alert,lip,blink});
    c.restore();
  },a.dir<0);
}

function roomShadow(c,actor) {
  ell(c,actor.x,actor.y+.34,29,3.9,"rgba(5,12,18,.38)");
}

function fromGait(t,plan,{dir=plan.dir,drop=0,lean=1.2,wrist,fit=drop===0,weight=1}={}) {
  const move=route(t,plan);
  const [x,y]=move.root;
  const actor=makeActor("yu",x,y,1.035,dir,{drop,lean,wrist,feet:move.feet,fit,weight:move.swing*weight});
  return actor;
}

function curtainPortrait(t) {
  const take=1-ease(events.curtainRelease,events.curtainRelease+.18,t);
  const opening=openAmount*(1-ease(events.curtainRelease,events.curtainRelease+.75,t));
  const near=fromGait(t,retreatPlan,{dir:-1,lean:2.6,weight:0});
  const wrist=wristOf(near);
  const grip=[curtainX(opening)+.5,curtainHandY];
  const point=grip.map((x,i)=>lerp(wrist[i],x,take));
  return {opening,grip,take,point};
}

function bedSetup(c,t){
  night(c,"#223442","#0a121b");
  rect(c,0,414,W,126,"#111c24");
  rect(c,18,414,W-33,3,"#253843");
  for(let i=0;i<6;i++){
    poly(c,[[0,55-6*i],[40-6*i,5],[671-12*i,473],[499+12*i,473]],
      grad(c,174,122,577,463,[[0,"rgba(144,176,205,.031)"],[1,"rgba(107,139,157,0)"]]));
  }
  round(c,111,78,143,96,1.6,"#172633","#40505b",1.5);
  round(c,126,297,473,95,15,"#263c4c");
  round(c,126,355,473,52,7,"#1d303f");
  rect(c,147,404,8,10,"#182731");rect(c,559,403,8,12,"#182731");
  round(c,510,315,89,39,9,"#405669");
  const q=ease(7.05,8.05,t);
  ell(c,549,318-2.1*q,19,19.4,"#667881");
  path(c,"M530 317 Q529 299 542 296 Q559 295 567 309 L565 316 Q550 309 545 318 Q535 320 531 323Z","#263441");
  path(c,"M127 354 C155 318 223 305 304 305 Q364 306 431 302 Q482 298 515 319 Q532 330 528 365 H127Z","#344a5a");
  path(c,"M143 352 Q202 319 253 338 Q317 346 352 322 M358 351 Q401 338 453 332",null,"#293f50",1.5);
  round(c,654,358,149,9,1.7,"#39444d");
  rect(c,663,366,5.2,42,"#2b3944");rect(c,790,366,5.5,42,"#2b3944");
  line(c,[[747,356],[748,328]],"#48525b",2.1);
  path(c,"M725 330 L732 304 L756 304 L767 330Z","#384651");
  ell(c,748,355,14.1,2.7,"#2d3947");
  const lit=pulse(5.39,5.55,8.17,8.24,t);
  const px=700+buzzing(t), py=353;
  rect(c,px-20,py-2.48,40,4.45,"#1a2735");
  if(lit>.01){
    rect(c,px-18,py-1.96,36,1.36,"#a3d6ec");
    glow(c,px,py,80,91,"rgba(126,194,232,"+(.26*lit)+")");
    glow(c,px,py,28,12,"rgba(190,225,242,"+(.62*lit)+")");
  }
}

function bed(c,t){
  const follow=ease(5.36,8.25,t);
  camera(c,482+52*follow,282+14*follow,1.035+.16*follow,()=>bedSetup(c,t));
}

function phone(c,t) {
  night(c,"#262831","#171a20");
  glow(c,463,278,236,219,"rgba(93,64,64,.26)");
  const focus=ease(8.25,9.08,t), angle=-.105+.031*focus;
  const bx=476+buzzing(t)*.27, by=274+5.5*(1-focus);
  place(c,bx,by,1.33+.075*focus+.034*ease(10.3,12.86,t),()=>{
    round(c,-79,-164,158,328,19,"#1d2028","#48515a",1.65);
    round(c,-73,-158,146,316,16,grad(c,-50,-159,71,155,[[0,"#4c343e"],[.55,"#352c3b"],[1,"#2b242e"]]));
    round(c,-14,-150,28,4,2,"#242834");
    ell(c,31,-148,2.25,2.25,"#292a36");
    text(c,"02:17",0,-83,35,"#eee3e0","center");
    text(c,"凌晨",0,-121,9,"#bda9aa","center");
    const a=ease(events.phoneChime-.05,events.phoneChime+.18,t);
    c.save();c.globalAlpha=a;
    round(c,-63,-51,126,113,7,"#402d36");
    rect(c,-55,-37,2.5,13.4,"#ba685c");
    text(c,"紧急通知",-47,-26,11.8,"#e8c2b5","left",true);
    text(c,"请全体市民", -54,-2,11,"#e6d8d6");
    text(c,"关闭门窗，切勿外出。",-54,17,10.1,"#e6d8d6");
    c.restore();
    round(c,-23,145,46,2.4,1.2,"#9e8691");
  },false,angle);
}

function portrait(c,t,{after=false,lip=0}={}) {
  night(c,after?"#1b2e3c":"#203442","#0c161f");
  for(let j=0;j<5;j++){
    poly(c,[[185+7*j,-18],[261-4*j,-18],[521-9*j,499],[398+8*j,503]],
      grad(c,257,12,448,493,[[0,"rgba(103,148,178,.033)"],[1,"rgba(62,112,151,0)"]]));
  }
  const actor=makeActor("yu",after?483:429,493,5.85,after?-1:1,
    {lean:after?-.68:1.51,tilt:after?1.22:3.69});
  const close=after?ease(61.04,67.77,t):ease(12.87,15.35,t);
  camera(c,(after?459:442)+(after?-8:10)*close,-370-11*close,1.006+.117*close,()=>{
    hero(c,actor,t,{lit:true,alert:after?.88:.41,lip});
  });
  if(!after)glow(c,661,461,144,122,"rgba(125,180,217,.18)");
  if(after)rect(c,721,0,4.1,H,"#233744");
  return actor;
}

function firstSteps(c,t) {
  const a=fromGait(t,first);
  camera(c,a.x-4,430,3.04,()=>{
    room(c,t);
    roomShadow(c,a);
    hero(c,a,t);
  });
  return {actor:a,mode:"forward"};
}

function approachWindow(c,t){
  const approach=ease(18.33,22.55,t);
  const opening=.17;
  const lean=14*approach;
  const rootX=376, targetX=(261-71*opening+curtainX(opening))*.5;
  camera(c,341-12*approach,224-19*approach,1.42+.32*approach,()=>{
    room(c,t,opening);
    place(c,rootX,floor,1.025,()=>{
      path(c,"M-23 -140 Q-33 -128 -33 -111 L-26 -72 L-31 2 H31 L32 -63 L33 -111 Q32 -132 21 -138 L7 -147 L-8 -145Z",
        grad(c,-28,-132,28,-88,[[0,"#303e49"],[1,"#182732"]]));
      path(c,"M-13 -143 Q-.5 -138 11 -144 L15 -137 Q1 -129 -15 -137Z","#35444e");
      line(c,[[-21,-134],[-25,-109],[-23,-84]],"#44535c",.58);
      place(c,-lean,-159,1,()=>{
        path(c,"M-5.2 5 L7.5 5.4 L9 19.4 Q1 23.1 -7.5 18.8Z","#3b4b53");
        path(c,"M-19 -5 Q-18 -17 -8.3 -22 Q.4 -27 10.8 -21 Q21 -15 18.7 -3 Q17.5 6 11.8 10.8 Q6.1 15.5 -4.9 14 Q-14.4 13.4 -17.9 5.2Z","#19242e");
        path(c,"M-15.7 -8 Q-13.3 -20 -2.4 -22.5 Q7.2 -24 12.5 -18",null,"#424d55",.83);
      });
    });
  });
  return {view:"rear-to-window",targetX,opening,left:261-71*opening,right:curtainX(opening)};
}

function pullAway(c,t) {
  const {opening,grip,take,point}=curtainPortrait(t);
  const bend=33*ease(58.76,59.72,t);
  const a=fromGait(t,retreatPlan,{dir:-1,drop:bend,lean:lerp(2.6,-3.4,ease(57.06,58.30,t)),wrist:take>.008?point:undefined,weight:.54});
  const track=route(t-.05,retreatPlan).root[0]-378.5;
  const recoil=ease(58.52,59.75,t);
  camera(c,408+.78*track,291+17*recoil,1.16+.103*recoil,()=>{
    room(c,t,opening);
    roomShadow(c,a);hero(c,a,t,{alert:.8});
  });
  return {actor:a,mode:"backing",curtain:{grip,take,opening},wallX};
}

function hide(c,t) {
  const stand=33*(1-ease(68.79,69.42,t)), sink=45*ease(74.54,75.68,t);
  const turning=t<69.20;
  const a=fromGait(t,hidePlan,{dir:turning?-1:1,drop:stand+sink,
    lean:turning?-2.82:2.40-5.4*ease(74.49,75.68,t)});
  const track=route(t-.09,hidePlan).root[0]-464;
  const drift=31*ease(76.12,81.6,t);
  camera(c,480+.45*track+drift,270+11*ease(73.7,80.3,t),1.00+.11*ease(69.15,75.92,t),()=>{
    room(c,t);
    roomShadow(c,a);hero(c,a,t,{alert:.38});
  });
  return {actor:a,mode:turning?"turn":"forward"};
}

function door(c,t) {
  const lower=116*ease(82.94,87.32,t);
  const at=events.knock.findLast(q=>t>=q)??-10;
  const d=t-at;
  const shake=d>=0&&d<.18?1.45*Math.sin(91*d)*Math.exp(-d*29):0;
  night(c);
  camera(c,873+6.5*ease(83.12,86.39,t),310+lower+shake,2.08+.49*ease(82.38,87.24,t),()=>{
    room(c,t);
    const visible=ease(82.26,83.34,t);
    const x=813,y=floor,w=119;
    const shadow=lerp(901,857,ease(83.8,86.09,t));
    rect(c,x,y-.35,w,.85,"rgba(176,152,113,"+(.62*visible)+")");
    poly(c,[[x,y],[x+w,y],[x+w+13,y+6],[x-7,y+7]],grad(c,0,y,0,y+9,[[0,"rgba(174,150,110,.18)"],[1,"rgba(174,150,110,0)"]]));
    for(const offset of [-12,10]){
      rect(c,shadow+offset,y-.62,9.7,1.7,"#19202a");
    }
    if(d<.22)line(c,[[818,y-37],[818-.52*Math.sin(d*117),y-3]],"rgba(148,129,103,.14)",.7);
  });
}

module.exports={bed,phone,portrait,firstSteps,approachWindow,pullAway,hide,door};
