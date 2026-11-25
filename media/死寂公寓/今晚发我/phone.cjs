"use strict";
const {rect,round,path,poly,line,ell,grad,glow,text,wood,alpha,rand,ease,pulse,lerp}=require("./visual.cjs");
const {events,chat}=require("./story.json");
function sceneDesk(c){
  wood(c,-48,-50,1060,650);
  poly(c,[[0,0],[263,0],[148,126],[0,113]],"#747c78","#353f41",2);
  poly(c,[[0,0],[234,0],[190,48],[0,39]],"#414b50");
  for(let j=0;j<3;j++)for(let i=0;i<8;i++){const x=i*32-j*9-16,y=j*13-2;poly(c,[[x,y],[x+25,y+1],[x+17,y+10],[x-8,y+9]],"#69736f");}
  poly(c,[[39,52],[133,57],[98,95],[3,90]],null,"#525d5c",1.3);
  c.save();c.translate(806,398);c.rotate(-.18);
  rect(c,-55,-48,260,206,"#736b60");rect(c,-60,-53,260,205,"#aa9e87");rect(c,-66,-59,260,205,"#c2b49a");
  for(let j=0;j<9;j++){rect(c,-46,-29+j*15, j%4===0?69:124+rand(j+37)*45,1.5,"#a89b84");}
  c.restore();
  c.save();c.translate(849,64);c.rotate(.16);ell(c,3,10,55,52,"#473e3a");ell(c,0,0,54,48,"#807466");
  path(c,"M38 -19 Q77 -33 74 -2 Q71 20 46 20",null,"#bead91",10);ell(c,0,-9,46,41,"#c2b292");
  ell(c,0,-8,39,34,"#574c42");ell(c,1,-5,36,29,"#665645");path(c,"M-27 -15 Q-13 -35 15 -28",null,"#a68d69",1.3);c.restore();
  c.save();c.translate(190,391);c.rotate(.43);round(c,0,0,9,150,4,"#75837f");rect(c,1,9,7,10,"#bba785");poly(c,[[0,147],[9,147],[4.5,161]],"#b7a78c");c.restore();
  glow(c,774,126,425,397,"rgba(228,185,118,.12)");
}
function avatar(c,x,y,s){
  round(c,x,y,s,s,5,"#768f91");c.save();c.beginPath();c.rect(x+2,y+2,s-4,s-4);c.clip();
  ell(c,x+s*.69,y+s*.29,s*.115,s*.115,"#e4d29e");poly(c,[[x,y+s*.89],[x+s*.27,y+s*.43],[x+s*.54,y+s*.66],[x+s*.78,y+s*.4],[x+s,y+s*.66],[x+s,y+s],[x,y+s]],"#435f64");c.restore();
}
function status(c,light){
  const col=light?"#39423f":"#e7e7d9";text(c,chat.time,19,24,12,col,"left",true);
  for(let j=0;j<4;j++)round(c,167+j*4,20-j*2,2.7,3+j*2,1,col);
  round(c,190,14,17,8,2,null,col,1);round(c,192,16,11,4,1,col);rect(c,207.5,16,1.7,4,col);
}
function warning(c,t){
  rect(c,0,0,224,415,grad(c,0,0,206,412,[[0,"#354c57"],[.48,"#536462"],[1,"#263a45"]]));
  for(let j=0;j<3;j++)poly(c,[[-10,250+j*55],[60+j*14,200+j*62],[150,256+j*36],[234,178+j*68],[234,420],[-10,420]],["#4e6264","#40575d","#344c55"][j]);
  status(c,false);
  text(c,"20:47",112,94,43,"#f0eddc","center");
  round(c,12,126,200,153,12,"#e2dfd0");round(c,24,139,20,20,5,"#a94f40");
  path(c,"M34 142 L42 156 H26Z",null,"#f7e9cf",1.15);line(c,[[34,147],[34,151]],"#f9edd8",1.3);ell(c,34,153.5,.85,.85,"#f9edd8");
  text(c,"应急通知",51,153,12,"#594e45","left",true);text(c,"现在",197,153,10,"#776f65","right");
  text(c,"紧急情况",25,185,20,"#342f2c","left",true);
  text(c,"请各位市民立刻返回室内，",25,211,13.1,"#413c37");text(c,"不要外出。",25,231,13.1,"#413c37");
  line(c,[[25,244],[199,244]],"#c5c1b4",.9);
  for(let i=0;i<5;i++){const h=3+Math.abs(Math.sin(t*8+i*.92))*7;round(c,26+i*3,259-h*.5,1.6,h,.8,"#837662");}
  text(c,"应急广播",46,264,10,"#776e61");
}
function banner(c,t){
  const yy=lerp(-77,38,ease(events.boss1,events.boss1+.24,t));c.save();c.translate(0,yy);
  round(c,8,2,208,60,11,"rgba(38,43,42,.25)");round(c,8,0,208,59,11,"#eaece5");avatar(c,18,13,32);
  text(c,chat.contact,58,23,12.2,"#333b37","left",true);text(c,"现在",204,22,9,"#80847e","right");
  text(c,chat.first,58,43,12.6,"#414843");c.restore();
}
function bubble(c,y,words,a=1){
  c.save();c.globalAlpha*=a;avatar(c,10,y,29);const w=words.length*13.4+21;
  poly(c,[[43,y+12],[50,y+8],[50,y+17]],"#fffefa");
  round(c,47,y+1,w,30,4.2,"#fffefa");text(c,words,56,y+21,13.2,"#242b28");c.restore();
}
function conversation(c,t){
  rect(c,0,0,224,415,"#e8e9e5");status(c,true);line(c,[[0,59],[224,59]],"#cdd0ca",.8);
  line(c,[[19,36],[13,42.5],[19,49]],"#34403a",1.8);
  const typing=t>=events.typing&&t<events.boss2;
  text(c,typing?"对方正在输入…":chat.contact,112,47,14.3,"#28342d","center",true);
  for(let i=0;i<3;i++)ell(c,196+i*4.6,42,1.12,1.12,"#3e4840");
  text(c,chat.time,112,86,10,"#969c95","center");bubble(c,103,chat.first);
  if(t>=events.boss2){const a=ease(events.boss2,events.boss2+.17,t);bubble(c,148+4*(1-a),chat.second,a);}
  rect(c,0,368,224,47,"#f1f2ed");line(c,[[0,367],[224,367]],"#d6d8d2",.75);
  ell(c,15,388,8.4,8.4,null,"#526056",1.3);for(let i=0;i<3;i++)line(c,[[12+i*2.5,387-i],[12+i*2.5,390+i]],"#526056",.8);
  round(c,31,375,128,25,4,"#ffffff");ell(c,176,387,8,8,null,"#526056",1.3);ell(c,173,385,.65,.65,"#526056");ell(c,178,385,.65,.65,"#526056");path(c,"M172 389 Q176 393 180 389",null,"#526056",1);
  ell(c,201,387,8,8,null,"#526056",1.3);line(c,[[197,387],[205,387]],"#526056",1);line(c,[[201,383],[201,391]],"#526056",1);
}
function phone(c,t,id){
  sceneDesk(c);
  const close=ease(28.42,30.0,t),tilt=lerp(-.19,-.014,close);
  const pickup=ease(43.01,43.75,t);
  const size=lerp(.73,1.185,close)+.08*pickup,cx=lerp(508,480,close)-11*pickup,cy=lerp(295,270,close)-9*pickup;
  const buzz=events.buzz.reduce((s,at,i)=>s+pulse(at,at+.038,at+[.46,.49,.83][i],at+[.51,.54,.88][i],t),0);
  const xx=cx+buzz*2.45*Math.sin(t*95);
  c.save();c.translate(xx,cy);c.rotate(tilt+buzz*.0048*Math.sin(t*76));c.scale(size,size);c.translate(-112,-207.5);
  round(c,-5,0,239,435,22,"rgba(27,28,29,.36)");
  round(c,-8,-7,240,431,23,"#5a6160","#292e32",2.2);round(c,-5,-5,234,425,21,"#222b2f");
  c.save();c.beginPath();c.roundRect(0,0,224,415,17);c.clip();
  if(t<events.alertLight){rect(c,0,0,224,415,grad(c,0,0,190,415,[[0,"#27363d"],[1,"#41494a"]]));poly(c,[[0,120],[112,0],[186,0],[0,216]],"rgba(167,185,181,.05)");}
  else{
    warning(c,t);
    if(t>=events.boss1 && t<events.tap+.32)banner(c,t);
    if(t>=events.tap+.07){
      const a=ease(events.tap+.07,events.tap+.33,t);c.save();c.translate((1-a)*224,0);conversation(c,t);c.restore();
    }
  }
  round(c,91,6,42,7,3.5,"#20292d");
  if(t>=events.alertLight)round(c,85,407,54,2.5,1.2,t>events.tap+.3?"#535b55":"#e0e1d5");c.restore();c.restore();
  // The hand enters from the owner's right and the pad touches the notification.
  const tap=pulse(38.29,38.93,39.02,39.49,t);
  if(tap>.001){c.save();c.translate(lerp(1030,545,tap),lerp(365,119,tap));c.rotate(.24);
    path(c,"M2 4 Q-7 2 -7 -3 Q-6 -10 4 -9 Q25 -8 60 -1 L126 3 Q159 3 190 26 L311 99 L306 150 L163 104 Q134 92 115 70 L82 32 L26 14Z","#bb967b","#795f54",1.3);
    path(c,"M145 12 Q170 15 191 26 L640 160 L637 250 L225 127 Q206 97 199 72Z","#a26e56");c.restore();}
  if(pickup>.001){
    c.save();c.translate(lerp(1026,609,pickup),lerp(638,445,pickup));c.rotate(-.07);
    path(c,"M1 11 Q-7 -24 -4 -45 Q-2 -57 4 -54 Q11 -48 12 -31 L20 -3 Q20 -15 27 -6 L54 56 L112 96 L75 169 L28 98 Q7 70 1 11Z","#be9a81","#8f7263",1.3);
    path(c,"M42 60 L63 46 Q112 82 182 129 L254 206 H119 Q62 131 42 60Z","#a87258");c.restore();
  }
}
module.exports={phone};
