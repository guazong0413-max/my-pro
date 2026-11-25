"use strict";

const {clamp,lerp,ease,path,rect,ell,line,poly,grad,glow,place,rand}=require("../开篇九十秒/drawing.cjs");
const {rotate,add,sub,mixPoint,solve,continuousLimb}=require("../人物动作/rig.cjs");
const {W,H,camera,night,rain}=require("./art.cjs");
const {events}=require("./story.json");

const railDeck=182, railTop=117, soil=478;
const planter={left:308,right:743,top:soil};
const railHip=[516,railDeck-50];
const landedHip=[576,soil-7];
const upAngle=.038, downAngle=1.541;
const sides=["left","right"];
const railFeet={left:[507,railDeck-3.4],right:[525,railDeck-3.4]};
const railPalms={left:[504,railTop],right:[527,railTop]};
const fallenFeet={left:[524,soil-3.7],right:[531,soil-3.7]};
const fallenPalms={left:[590,soil-4.1],right:[642,soil-3.75]};
const bracedPalms={left:[600,soil-3.4],right:[627,soil-3.4]};
const weightOnHands=48.70, handsOff=50.55;

function windows(c,x,y,w,h,columns,rows){
  const gap=5, sx=(w-12)/columns, sy=(h-11)/rows;
  rect(c,x,y,w,h,"#293d4a");
  for(let row=0;row<rows;row++){
    const over=rand(row+106);
    rect(c,x+1,y+row*sy,w-2,sy*.12,over>.47?"#354b59":"#304653");
    for(let k=0;k<columns;k++){
      const ox=x+6+k*sx, oy=y+4+row*sy;
      const warm=rand(k*17+row*43)>.937;
      rect(c,ox,oy,sx-gap,sy-gap+1,warm?"#745943":"#162633");
      if(warm)rect(c,ox+2,oy,sx-gap-4,sy-gap+1,"#7d5e46");
      else poly(c,[[ox,oy+sy*.58],[ox+sx*.54,oy],[ox+sx*.78,oy],[ox+sx*.2,oy+sy-gap]],"rgba(105,129,146,.075)");
      line(c,[[ox+(sx-gap)*.51,oy],[ox+(sx-gap)*.51,oy+sy-gap+1]],warm?"#513f35":"#273d4a",.75);
    }
  }
}

function skyline(c,t) {
  const trace=ease(0,5.36,t);
  camera(c,482-9*trace,273-8*trace,1.01+.079*trace,()=>{
    night(c,"#20313b","#101b23");
    for(let i=0;i<10;i++){
      const x=i*112-96+12*rand(i+31), y=173+140*rand(i+45);
      rect(c,x,y,77+Math.floor(rand(i+75)*32),H-y,"#172631");
      rect(c,x+2,y+2,2.2,H-y,"rgba(89,109,126,.11)");
      for(let j=0;j<8;j++){
        if(rand(i*11+j*5+34)>.20)continue;
        rect(c,x+14+(j%2)*27,y+31+j*20,4,5,"#6e5a47");
      }
    }
    const bx=298,by=-72;
    glow(c,514,263,363,386,"rgba(104,141,166,.155)");
    windows(c,bx,by,385,638,7,14);
    rect(c,bx-10,by,10,641,"#223542");
    rect(c,bx+385,by,13,641,"#21313e");
    glow(c,122,493,96,97,"rgba(177,142,93,.13)");
    glow(c,865,486,91,91,"rgba(132,119,96,.13)");
  });
  rain(c,.78*t,{strength:.66,count:144,seed:244});
  rain(c,1.22*t,{strength:.58,count:40,seed:112});
}

function facade(c,t) {
  const left=150,right=846,w=right-left;
  night(c,"#172833","#14232c");
  rect(c,left-15,-350,w+30,897,"#293d4b");
  rect(c,left-15,-350,11,895,"#1f303d");
  rect(c,right+3,-350,12,891,"#1c2e3a");
  const decks=[-172,-54,64,182,300,418];
  for(const [row,deck] of decks.entries()){
    rect(c,left-9,deck-6,w+18,11,"#344955");
    rect(c,left-7,deck-101,w+14,95,"#233543");
    for(let i=0;i<9;i++){
      const x=left+17+i*75.4, lit=rand(row*19+i+161)>.916;
      rect(c,x,deck-93,57,84,lit?"#6e5641":"#111e29");
      if(lit)poly(c,[[x+1,deck-91],[x+36,deck-91],[x+38,deck-10],[x+1,deck-10]],"#7e6145");
      line(c,[[x+30,deck-92],[x+30,deck-11]],lit?"#4e4438":"#233a48",1.1);
    }
    const rail=deck-(railDeck-railTop);
    for(let i=0;i<=54;i++){
      const x=left-2+i*(w+4)/54;
      line(c,[[x,rail],[x,deck-1]],i%9===0?"#657885":"#4a5d6a",i%9===0?1.22:.67);
    }
    line(c,[[left-2,rail],[right+2,rail]],"#617481",1.68);
    line(c,[[left-4,deck],[right+5,deck]],"#435963",2.05);
  }
  rect(c,left-14,422,w+28,84,"#334550");
  for(let i=0;i<7;i++){
    const x=left+10+i*99;
    rect(c,x,427,88,77,"#1b2b35");
    for(let j=0;j<13;j++)line(c,[[x+2,431+j*5.35],[x+86,431+j*5.35]],"#31424b",.60);
  }
  const road=503;
  rect(c,-800,road,2700,400,"#1b2b35");
  line(c,[[-300,road+99],[1320,road+99]],"#2c3b42",1.8);
  for(let x=-75;x<1050;x+=129)rect(c,x,road+60,59,1.35,"#49545a");
  const phase=(.5+.5*Math.sin((t-23.4)*3.83))**2;
  glow(c,175,543,279,95,"rgba(119,164,214,"+(.065+.122*phase)+")");
  glow(c,728,548,294,106,"rgba(174,81,74,"+(.045+.10*(1-phase))+")");
}

function garden(c,front=false) {
  const {left,right,top}=planter;
  if(!front){
    rect(c,left-2,top-3,right-left+4,25,"#3f5058");
    rect(c,left+5,top-3,right-left-10,5,"#353730");
    for(let j=0;j<11;j++){
      const x=left+18+j*40;
      if(x>479&&x<674)continue;
      ell(c,x,top-.86,17+6*rand(j+154),7.5+2*rand(j+45),"#263e3c");
    }
    line(c,[[left,top],[right,top]],"#707672",.92);
    return;
  }
  rect(c,left,top+1.0,right-left,21,grad(c,left,top,left,top+22,[[0,"#58646b"],[1,"#3a4b55"]]));
  line(c,[[left,top+1.2],[right,top+1.2]],"#63777a",1.5);
  for(let j=1;j<9;j++){
    const x=left+j*(right-left)/9;
    line(c,[[x,top+3],[x,top+22]],"#4b5c61",.67);
  }
}

function distantCar(c,x,y,direction,blue,t){
  place(c,x,y,.90,()=>{
    ell(c,0,13,64,6,"rgba(13,24,33,.36)");
    path(c,"M-57 4 L-51 -7 L-29 -11 L-14 -28 H25 L41 -11 L54 -5 L59 4 L55 12 H-55Z","#657078","#3c505d",1.1);
    path(c,"M-22 -12 L-10 -24 H22 L33 -12Z","#24353e");
    line(c,[[4,-24],[4,-12]],"#455a66",1.35);
    ell(c,-34,12,11,11,"#19252e");ell(c,35,12,11,11,"#19252e");
    if(blue){
      const q=(.5+.5*Math.sin(t*5.8))**3;
      rect(c,-11,-30,23,3.4,"#5c6e85");
      rect(c,-10,-30,10,3.4,q>.27?"#a5d2ef":"#73a4c9");
      rect(c,1,-30,10,3.4,q>.27?"#73505a":"#c67a73");
      glow(c,-2,-29,52,43,q>.27?"rgba(100,162,231,.54)":"rgba(210,85,87,.41)");
      glow(c,0,22,149,12,q>.27?"rgba(114,171,231,.29)":"rgba(206,89,81,.20)");
    }else{
      ell(c,55,-2,2.2,2,"#d8b48e");
      glow(c,57,-1,31,31,"rgba(217,168,102,.56)");
    }
  },direction<0);
}

function windowPOV(c,t) {
  night(c);
  const follow=ease(24.33,27.08,t);
  const x=lerp(555,522,follow),y=lerp(441,128,follow);
  const zoom=lerp(.74,1.09,follow);
  camera(c,x,y,zoom,()=>{
    facade(c,t);garden(c);
    const police=155+505*ease(22.4,26.44,t);
    distantCar(c,police,552,1,true,t);
    distantCar(c,780,565,-1,false,t);
    c.save();c.globalAlpha=.54+.46*follow;
    visitor(c,falling(t),t);
    c.restore();
    garden(c,true);
  });
  rain(c,t,{strength:.64,count:160,seed:277});
  const spread=ease(events.curtainOpen,23.55,t);
  const lean=20*ease(22.86,26.84,t);
  for(const [lo,hi] of [[0,232-59*spread-lean],[721+46*spread-lean,960]]){
    rect(c,lo,0,hi-lo,H,"#172631");
    for(let j=0;j<8;j++){
      const w=(hi-lo)/8,x0=lo+j*w;
      rect(c,x0,0,w,H,grad(c,x0,0,x0+w,0,[[0,"#13232e"],[.57,"#263a47"],[1,"#101d27"]]));
    }
    line(c,[[lo?lo:hi,0],[lo?lo+1:hi-1,H]],"#324854",2);
  }
  const sill=lerp(475,531,follow);
  rect(c,0,sill,W,H-sill,grad(c,0,sill,0,H,[[0,"#233441"],[.10,"#162733"],[1,"#0e1923"]]));
  for(let i=0;i<12;i++){
    const x0=235+rand(i+104)*504,y0=77+rand(i+417)*393;
    line(c,[[x0,y0-4],[x0-.6,y0+6]],"rgba(197,216,220,.22)",.6);
  }
  return {view:"room-to-street",glass:true,camera:{x,y,zoom}};
}

function legPosition(a,b,start,end,t) {
  const u=ease(start,end,t), px=lerp(a[0],b[0],u);
  const y=lerp(a[1],b[1],u)-4.8*Math.sin(Math.PI*u);
  return [px,y];
}

function risePose(t) {
  const placeAt=(a,b)=>ease(a,b,t);
  const shouldering=placeAt(weightOnHands,50.20);
  const tuck=placeAt(50.06,51.58);
  const stand=placeAt(51.58,events.stand);
  const raised=[landedHip[0]+5*tuck+4*stand,landedHip[1]-11.5*shouldering-9.5*tuck-22*stand];
  const angle=downAngle-.36*shouldering-.22*tuck-.68*stand;
  const settle=placeAt(events.impact,events.impact+.19);
  const hip=add(raised,[2.75*settle,1.5*Math.sin(Math.PI*settle)]);
  const handsTuck=placeAt(events.brace,weightOnHands);
  const released=placeAt(handsOff,51.74);
  const palms=Object.fromEntries(sides.map((side,i)=>{
    const hold=mixPoint(add(fallenPalms[side],[2.75*settle,0]),bracedPalms[side],handsTuck);
    const loose=add(hip,rotate([i?7.2:-8.4,5.75],angle));
    return [side,mixPoint(hold,loose,released)];
  }));
  const shifted=Object.fromEntries(sides.map(side=>[side,add(fallenFeet[side],[2.75*settle,0])]));
  const feet={
    left:legPosition(shifted.left,[560,soil-3.7],50.18,51.54,t),
    right:legPosition(shifted.right,[596,soil-3.7],48.93,50.17,t)
  };
  return {hip,angle,feet,palms,phase:t<events.brace?"landed":t<handsOff?"brace":"rise"};
}

function falling(t) {
  if(t<events.railRelease)return {hip:railHip,angle:upAngle,feet:railFeet,palms:railPalms,phase:"rail"};
  if(t>=events.impact)return risePose(t);
  const u=clamp((t-events.railRelease)/(events.impact-events.railRelease));
  const angle=lerp(upAngle,downAngle,ease(0,.99,u));
  const hip=[lerp(railHip[0],landedHip[0],u),lerp(railHip[1],landedHip[1],u*u)];
  const mid=Math.sin(Math.PI*u), loose=ease(0,.4,u);
  const link=(a,b,shift)=>Object.fromEntries(sides.map((side,i)=>{
    const origin=rotate(sub(a[side],railHip),-upAngle);
    const destination=rotate(sub(b[side],landedHip),-downAngle);
    const local=mixPoint(origin,destination,loose);
    return [side,add(hip,rotate(add(local,[shift*(i?1:-1)*mid,0]),angle))];
  }));
  return {hip,angle,feet:link(railFeet,fallenFeet,5.7),palms:link(railPalms,fallenPalms,9.4),phase:"air"};
}

function visitor(c,p,t,{detail=false}={}) {
  const {hip,angle,feet,palms,phase}=p;
  const transform=point=>add(hip,rotate(point,angle));
  const bodyShade=detail?"#59625a":"#36474a";
  const arms={},legs={};
  for(const [i,side] of sides.entries()){
    const sideSpace=i?1:-1;
    legs[side]=solve(transform([sideSpace*4.3,0.0]),feet[side],28.7,27.7,-1);
    arms[side]=solve(transform([sideSpace*4.65,-36.2]),palms[side],22.9,21.2,-sideSpace);
  }
  const shoeAngle=phase==="air"?angle*.83
    :downAngle*.83*(1-ease(events.impact,events.impact+.18,t))*(phase==="landed"?1:0);
  for(const [i,side] of sides.entries()){
    const part=legs[side];
    continuousLimb(c,part,[4.6,3.35,2.7],i?"#313b43":"#273138");
    place(c,...part.end,1,()=>{
      path(c,"M-3.3 -2.11 Q.5 -2.8 2.6 -.5 L7.6 1.1 Q10.4 2.2 8.8 3.59 H-4.1 Q-4.9 1.7 -3.3 -2.11Z",i?"#3e4749":"#2f3b41");
    },false,shoeAngle);
  }
  function sleeve(side,near){
    const part=arms[side];
    continuousLimb(c,part,[4.9,3.4,2.3],near?bodyShade:"#39494b");
    ell(c,...part.end,2.42,2.23,near?"#68756c":"#4b6461");
  }
  sleeve("left",false);
  place(c,...hip,1,()=>{
    path(c,"M-5.8 -48 Q.55 -51 6.75 -46.9 Q14.15 -42.5 13.6 -34.9 L10.9 -17.6 L12.66 4.8 Q2.5 8.8 -12.2 5.6 Q-14.1 -2.3 -12.7 -14.9 L-12.6 -31.8 Q-13.7 -42.74 -5.8 -48Z",bodyShade,"#69766e",.51);
    path(c,"M-12.7 -34.6 Q-8.6 -29.9 -8.84 -21.7 L-8.46 5.6 L-12.2 5.6 Q-14.1 -2.3 -12.7 -14.9Z","#405050");
    path(c,"M5.4 -36.7 L5.8 -21.3 M-8.62 1.49 Q1.8 3.1 10.4 1.3",null,"#6c7568",.62);
    path(c,"M-4.8 -50 L-5.1 -44 Q.7 -40.4 4.79 -45.53 L4.2 -51Z","#6a746d");
    const lift=ease(52.33,55.52,t);
    c.save();c.translate(0,-50);c.rotate(-.1-.15*lift);
    path(c,"M-6.1 -4.6 Q-8.4 -10.4 -4.4 -16.0 Q-1.2 -20.0 4.4 -18 Q10.9 -16.8 10.1 -11.1 L12.6 -7.63 Q13.3 -6.5 10.9 -5.5 L9.3 -.74 Q7.7 3.3 1.15 2.8 Q-4.23 .4 -6.1 -4.6Z",detail?"#73807a":"#4a6165");
    path(c,"M-5.34 -4.3 Q-10.1 -7.49 -8.6 -13.14 Q-6.55 -18.28 -.3 -19.7 Q7.22 -21 9.81 -15.4 L9.38 -12.46 Q5.66 -14.98 3.33 -13.43 Q-.2 -11.71 -.8 -7.1 L-2.71 -5.08Z","#26333a");
    if(t>51.7)ell(c,8.55,-9.3,1.06,.85,"#a7c2aa");
    c.restore();
  },false,angle);
  sleeve("right",true);
  return {...p,arms,legs};
}

function impactSplash(c,t) {
  const d=t-events.impact;
  if(d<0||d>.57)return;
  for(let j=0;j<21;j++){
    const local=d-(j%4)*.018;
    if(local<0)continue;
    const x=577+(rand(j+18)-.48)*(38+local*198);
    const y=soil-8-(21+rand(j+62)*82)*local+local*local*120;
    const a=(1-ease(.19,.57,local))*.40;
    ell(c,x,y,.5+rand(j+180),.5,"rgba(159,172,158,"+a+")");
  }
}

function fallScene(c,t) {
  night(c);
  const release=events.railRelease;
  const drop=clamp((t-release)/(events.impact-release));
  const cameraDrop=clamp((t-release-.072)/(events.impact-release));
  const at=t-events.impact;
  const shake=at>=0&&at<.24?5.2*Math.sin(77*at)*Math.exp(-at*21):0;
  const x=lerp(522,559,ease(0,1,cameraDrop))+2.5*ease(30.25,33.68,t);
  const y=lerp(128,415,cameraDrop**2)+16*ease(events.impact,events.impact+.48,t)+shake;
  const zoom=1.09+.055*ease(28.1,33.92,t)-.215*ease(0,1,drop);
  const actor=falling(t);
  let state;
  camera(c,x,y,zoom,()=>{
    facade(c,t);garden(c);
    state=visitor(c,actor,t);
    garden(c,true);impactSplash(c,t);
    if(t>=35.24)distantCar(c,732,566,-1,false,t);
  });
  rain(c,t,{strength:.85,count:156,seed:482});
  return {...state,camera:{x,y,zoom}};
}

function planterScene(c,t) {
  night(c);
  const watching=ease(events.brace,events.stand+.8,t);
  const creep=ease(37.34,46.32,t);
  const actor=falling(t);
  let state;
  camera(c,550+27*creep+15*watching,421+4*creep-23*watching,1.48+.21*creep+.067*watching,()=>{
    facade(c,t);garden(c);
    ell(c,actor.hip[0],soil-1.3,58,3.6,"rgba(8,20,19,.33)");
    state=visitor(c,actor,t,{detail:true});
    garden(c,true);
  });
  rain(c,t,{strength:.97,count:171,seed:654});
  return state;
}

module.exports={railDeck,railTop,soil,planter,bracedPalms,weightOnHands,handsOff,skyline,windowPOV,fallScene,planterScene};
