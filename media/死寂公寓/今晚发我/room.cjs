"use strict";
const {rect,round,ell,path,line,poly,grad,glow,text,rand,ease,lerp,mod,camera,alpha,rain,streamGlass,wood,shrub}=require("./visual.cjs");
const {hero}=require("./cast.cjs");
function room(c,t){
  rect(c,-200,-140,1510,850,grad(c,120,30,906,460,[[0,"#344752"],[.39,"#4b5558"],[.75,"#665c55"],[1,"#514748"]]));
  poly(c,[[10,-10],[90,28],[90,349],[10,383]],"#38434a");
  rect(c,-100,351,1260,15,"#434b4c");rect(c,-100,361,1260,5,"#79766c");
  rect(c,-150,367,1410,340,grad(c,90,360,120,590,[[0,"#655c56"],[1,"#413e40"]]));
  for(let i=0;i<10;i++)line(c,[[i*146-150,610],[329+i*58,366]],"#615852",1.3);
  for(const yy of [384,407,445,501,577])line(c,[[-130,yy],[1150,yy]],"#6e6258",1.2);
  // Recessed bay with its own sill in front of the courtyard.
  rect(c,99,31,470,317,"#626762");rect(c,104,34,460,302,"#293a43");
  rect(c,115,45,435,280,grad(c,0,45,100,330,[[0,"#304653"],[.5,"#556d79"],[1,"#859398"]]));
  for(let j=0;j<7;j++){
    const xx=111+j*67,yy=102+rand(j+65)*74,hh=290-yy;rect(c,xx,yy,65,hh+35,j%2?"#465d69":"#536a76");
    for(let k=0;k<5;k++)for(let n=0;n<3;n++){const lit=rand(178+j*15+k*3+n);rect(c,xx+7+n*18,yy+9+k*28,9,13,lit>.83?"#a99c80":lit>.45?"#657b84":"#394f5d");}
  }
  rect(c,115,294,435,30,"#536975");rain(c,t,115,45,435,280,90,.68,42);
  const wind=Math.sin(.66*t+.8*Math.sin(.26*t)),branch=5.7*wind;
  c.save();c.beginPath();c.rect(115,45,435,280);c.clip();
  path(c,"M105 283 Q143 241 "+(192+branch)+" 212 Q"+(209+branch)+" 208 "+(229+branch)+" 177 M154 231 Q152 198 "+(169+branch)+" 181 M"+(185+branch)+" 215 Q"+(218+branch)+" 217 "+(239+branch)+" 199",null,"#3b515a",2.15);
  for(let j=0;j<14;j++){const u=rand(j+127),xx=161+u*71+branch*u,yy=230-u*38+rand(j+259)*10; c.save();c.translate(xx,yy);c.rotate(-.42+.4*Math.sin(t*1.8+j));ell(c,0,0,3.8,1.4,"#4b625f");c.restore();}
  glow(c,215,260,58,74,"rgba(223,193,137,.11)");c.restore();
  streamGlass(c,t,117,43,435,282,62);
  for(const xx of [113,268,415,549]){rect(c,xx,40,7,293,"#34454c");rect(c,xx+6,43,2,283,"#818a87");}
  rect(c,112,121,440,5,"#444f55");rect(c,114,325,441,8,"#354850");
  poly(c,[[98,333],[563,333],[582,343],[87,343]],"#a2a397");rect(c,87,343,495,6,"#737b76");
  // Curtains, each with weighted pleats. The closed glass keeps them mostly still.
  const drift=Math.sin(t*1.14)*1.2;
  path(c,"M85 22 L153 22 Q147 88 135 146 Q128 216 "+(152+drift)+" 316 Q137 322 124 313 Q112 320 97 313 L83 316Z","#746d69");
  path(c,"M100 26 Q117 113 109 173 Q96 250 109 313 M128 27 Q130 99 119 167 Q117 240 133 313",null,"#898078",2.2);
  path(c,"M536 23 H576 V319 Q562 324 553 317 L542 321 Q551 229 544 179 Q535 110 536 23Z","#74706e");
  line(c,[[81,22],[585,22]],"#3e4648",4);
  poly(c,[[105,350],[537,350],[452,440],[-30,501]],"rgba(151,172,176,.10)");
  glow(c,419,230,257,198,"rgba(145,184,194,.055)");
  for(let i=0;i<3;i++){const xx=130+i*141;line(c,[[xx,349],[xx-128,472]],"rgba(88,99,101,.27)",3);}
  rect(c,591,104,39,54,"#414748");rect(c,595,108,31,46,"#c0b59a");poly(c,[[598,144],[608,130],[621,143],[625,148],[598,148]],"#71867e");ell(c,617,120,3,3,"#bb9271");
  rect(c,888,28,115,187,"#54524e");rect(c,901,43,102,63,"#47484a");
  for(let j=0;j<12;j++){rect(c,903+j*8,61+rand(j+582)*10,6,40-rand(j+582)*10,["#84786a","#777a70","#a38d77","#706b64"][j%4]);}
  rect(c,897,108,115,4,"#8a7e6b");
}
function desk(c,t){
  rect(c,694,342,12,109,"#4b403c");rect(c,917,342,13,119,"#433c3c");
  rect(c,842,348,77,86,"#594c45");for(let j=0;j<2;j++){round(c,846,354+j*35,67,31,2,"#6b5a4e");line(c,[[871,362+j*35],[887,362+j*35]],"#a29379",2);}
  poly(c,[[689,330],[935,325],[981,339],[678,342]],"#a18b73");rect(c,678,342,305,8,"#695447");
  // Laptop hinges and keyboard are on the side toward her hands.
  poly(c,[[718,330],[773,330],[798,337],[694,338]],"#a3aaa4","#596768",1.05);
  for(let i=0;i<4;i++)line(c,[[718-i*3,331+i*1.15],[772+i*3,331+i*1.15]],"#6b7a7d",.7);
  poly(c,[[753,331],[794,331],[803,279],[762,280]],"#45545c","#273640",2);
  poly(c,[[758,327],[790,327],[798,284],[766,285]],"#a6b7b5");
  for(let i=0;i<6;i++)line(c,[[768-i*.9,290+i*4.8],[788-i*.8,290+i*4.8]],i===0?"#6c858b":"#8ba1a3",1);
  line(c,[[863,330],[867,282],[846,254]],"#485052",4);ell(c,861,332,19,3.1,"#5c6059");
  path(c,"M830 250 Q839 237 849 250 L858 260 L827 267Z","#758079");line(c,[[828,267],[858,260]],"#ead2a1",2.5);
  glow(c,816,291,81,55,"rgba(242,196,118,.18)");
  round(c,879,310,15,21,2,"#d5c1a1");path(c,"M894 313 Q905 312 900 323 Q898 326 894 324",null,"#b9a98e",2);
  poly(c,[[801,333],[833,330],[846,334],[814,336]],"#c5b8a1");
  round(c,774,335,17,3,1.2,"#30393e");
}
function roomScene(c,t,id){
  const move=ease(12.63,16.0,t),x=635-236*move;
  const turn=ease(10.85,11.77,t);
  let cx=lerp(645,627,ease(9.05,12.55,t)),cy=259,z=1.77;
  if(id==="cross"){cx=lerp(562,429,move);cy=277;z=1.24+.10*move;}
  if(id==="reaction"){const q=ease(45.94,48.35,t);cx=lerp(625,611,q);cy=244;z=2.55+.13*q;}
  camera(c,cx,cy,z,()=>{
    room(c,t);
    if(id==="reaction"){
      hero(c,621,448,1.66,t,{face:1,yaw:lerp(.50,-.94,ease(46.34,47.8,t)),gaze:lerp(1.7,-.42,ease(46.53,47.92,t)),tilt:lerp(.23,-.08,ease(46.49,47.9,t)),hold:1,alert:.21+.25*ease(46.58,48,t)});
    }else{
      const walk=Math.sin(Math.PI*move)**.5, away=ease(15.35,16.34,t);
      const work=(1-ease(10.32,11.38,t)),f=t<11.6?1:-1;
      hero(c,x,438,1.62,t,{face:f,yaw:1-1.96*turn,rear:away,alert:.76*turn,tilt:.1*work-.07*turn+.22*away,gaze:.75*work+.8*away,work,distance:(635-x)/1.62,walking:walk,lean:.3+away*.7});
    }
    desk(c,t);
  });
}
module.exports={roomScene};
