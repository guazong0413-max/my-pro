"use strict";
const {rect,round,ell,path,line,poly,grad,glow,text,place,rain,ripples,shrub,camera,alpha,rand,mod,ease,lerp,pulse}=require("./visual.cjs");
const {runner}=require("./cast.cjs");
function windows(c,x,y,cols,rows,dx,dy,w,h,seed){
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const v=rand(seed+i*9+j*21),a=x+i*dx,b=y+j*dy;
    rect(c,a-2,b-3,w+4,h+6,"#263640");
    rect(c,a,b,w,h,v>.83?"#b69b73":v>.66?"#82877a":v>.37?"#526975":"#374e5c");
    if(v>.76)rect(c,a+2,b+1,w*.37,h-1,"#8f8777");
    rect(c,a+w*.53,b,2,h,"#36434a");rect(c,a-3,b+h,w+6,2.2,"#657078");
  }
}
function sign(c,x,y){
  round(c,x,y,23,30,2,"#57615a","#b4a680",1);
  text(c,"3",x+11.5,y+22,19,"#e6d8b5","center",true);
}
function ledge(c,x,y,s){
  place(c,x,y,s,()=>{
    round(c,0,0,36,19,1.5,"#83908d","#414f56",1);
    for(let j=0;j<6;j++)rect(c,3,3+2.1*j,14,1,"#5b6e73");
    ell(c,26,9.5,6.2,6.2,null,"#536769",1);
    for(let a=0;a<4;a++){const v=a*Math.PI*.5;line(c,[[26,9.5],[26+5*Math.cos(v),9.5+5*Math.sin(v)]],"#57686c",1.4);}
    path(c,"M36 15 Q41 15 40 20 L40 28",null,"#87918b",1.2);
  });
}
function bike(c,x,y,s){
  place(c,x,y,s,()=>{
    for(const dx of [-12,12]){ell(c,dx,-7,7,7,null,"#253b41",1.5);ell(c,dx,-7,5.5,5.5,null,"#788683",.65);}
    line(c,[[-12,-7],[-7,-16],[0,-7],[-12,-7],[6,-16],[12,-7]],"#394d50",1.6);
    line(c,[[-8,-17],[-4,-17]],"#2c3a3d",1.9);line(c,[[5,-19],[8,-20],[9,-17]],"#71807c",1.2);
  });
}
function windLeaves(c,t,base){
  for(let i=0;i<9;i++){
    const age=mod(t*.30+rand(i+307),1),xx=base+rand(i+94)*140-260*age,yy=312+rand(i+78)*49+18*Math.sin(age*7+i);
    c.save();c.translate(xx,yy);c.rotate(age*8+i);ell(c,0,0,3.3,1.0,"#8e937a");c.restore();
  }
}
function tower(c,x,y,w,h,k){
  rect(c,x,y,w,h,"#283f50");rect(c,x+6,y-5,w-13,6,"#334958");
  for(let j=0;j<7;j++)for(let i=0;i<5;i++){
    const z=rand(k+i*4+j*9);if(z>.39)rect(c,x+7+i*(w-12)/5,y+10+j*21,4+z*5,5,z>.86?"#868578":"#455f6c");
  }
}
function facade(c,t){
  rect(c,-400,-290,1850,1150,grad(c,0,-80,0,480,[[0,"#213644"],[.53,"#536675"],[1,"#293c4a"]]));
  for(let i=0;i<15;i++){const x=-300+i*105;const y=48+rand(i+412)*105;tower(c,x,y,80+rand(i+47)*48,230,80+i);}
  rect(c,-90,119,427,218,"#435560");windows(c,-59,134,8,4,54,46,29,27,154);
  rect(c,315,35,182,305,"#394951");windows(c,331,58,3,6,52,45,32,26,572);
  for(const [x,y,s] of [[34,178,.75],[193,218,.75],[365,181,.64],[421,272,.65]])ledge(c,x,y,s);
  rect(c,469,-110,637,450,"#5e5e60");rect(c,678,-110,249,450,"#695b59");
  for(let j=0;j<24;j++){let yy=-70+j*17;line(c,[[681,yy],[927,yy]],"#725f5c",.85);for(let k=0;k<4;k++){const xx=686+(j%2)*29+59*k;line(c,[[xx,yy],[xx,yy+15]],"#75625f",.62);}}
  windows(c,487,-23,3,5,61,69,39,44,354);
  for(let j=0;j<3;j++){
    const y=-43+j*76;rect(c,712,y-3,150,60,"#3c474e");rect(c,719,y+3,134,49,j===2?"#b9a085":"#61717a");
    if(j===2){rect(c,722,y+4,33,48,"#8c776b");rect(c,816,y+4,34,48,"#d6b990");}
    for(const dx of [0,44,89,134])rect(c,718+dx,y+2,3,52,"#454e53");
    poly(c,[[704,y+54],[867,y+54],[860,y+60],[712,y+60]],"#87908e");
  }
  rect(c,895,-100,7,434,"#acaca2");rect(c,901,-100,4,434,"#7c8580");
  for(let y=-15;y<330;y+=70)rect(c,894,y,12,3,"#657271");
  rect(c,738,238,108,94,"#384346");rect(c,748,248,87,81,"#242f32");
  rect(c,751,252,78,75,"#81745e");rect(c,758,258,28,45,"#b4a481");rect(c,792,258,29,45,"#928b76");rect(c,785,249,3,81,"#3a4441");
  poly(c,[[716,236],[844,236],[862,228],[734,227]],"#817970");rect(c,716,236,131,6,"#4c5350");
  rect(c,762,241,39,3,"#efcb91");glow(c,779,265,88,61,"rgba(236,186,112,.22)");
  sign(c,852,256);
  rect(c,-120,333,1350,23,"#738284");rect(c,-120,350,1350,5,"#374c59");
  rect(c,-300,355,1700,320,grad(c,0,350,0,560,[[0,"#354e5c"],[.45,"#4c6472"],[1,"#263f4d"]]));
  for(let i=0;i<130;i++){
    const xx=rand(305+i)*1390-160,yy=359+rand(888+i)*206;
    const light=xx>739&&xx<832;
    rect(c,xx,yy,5+rand(379+i)*49,.55+rand(421+i)*1.1,light?"rgba(219,175,116,.37)":"rgba(144,175,185,.23)");
  }
  for(let j=0;j<10;j++){const xx=-330+j*160;poly(c,[[xx,447],[xx+54,447],[xx+59,449],[xx+1,449]],"#87918d");}
  for(const [x,y,s] of [[90,335,1.6],[143,336,1.16],[297,338,1.08],[586,337,1.22],[950,337,1.8]])shrub(c,x,y,s,t+x);
  bike(c,227,339,1.36);bike(c,252,339,1.22);
  windLeaves(c,t,472);
  path(c,"M-100 42 Q150 97 405 51 Q640 26 920 -30",null,"#263a45",1.5);
  line(c,[[266,334],[266,147],[281,137],[304,137]],"#344c56",3.3);
  round(c,289,136,23,4,2,"#d3c5a3");glow(c,300,147,58,46,"rgba(238,213,162,.16)");
}
function car(c,x,t){
  const flash=.5+.5*Math.sin(t*16), rev=1-flash;
  for(const [off,r,g,b,f] of [[-16,229,75,77,flash],[26,74,153,224,rev]]){
    glow(c,x+off,402,106,19,alpha(r,g,b,.39*f));
    for(let j=0;j<12;j++)rect(c,x+off-48+rand(477+j)*70,403+j*3.2,12+rand(j+235)*45,1.5,alpha(r,g,b,(.08+.15*rand(j+53))*f));
  }
  glow(c,x+136,381,118,16,"rgba(239,222,173,.22)");
  place(c,x,389,1,()=>{
    ell(c,0,3,137,10,"rgba(22,39,47,.6)");
    path(c,"M-122 -12 L-122 -31 Q-118 -39 -91 -40 L-65 -66 Q-57 -73 -31 -74 L24 -73 Q40 -71 66 -46 L103 -39 Q122 -33 124 -21 L123 -12 Q119 -7 105 -7 L-106 -6 Q-120 -6 -122 -12Z","#c1cfcc","#35464e",2.5);
    path(c,"M-80 -43 L-59 -62 Q-53 -67 -35 -68 L-14 -68 L-14 -43Z","#425866");
    path(c,"M-8 -68 L20 -67 Q33 -65 54 -45 L-8 -44Z","#5a7580");
    path(c,"M-118 -29 Q-27 -29 64 -38 L103 -35 L59 -23 L-119 -18Z","#3a617b");
    text(c,"警 察",19,-16,12,"#304857","center",true);
    line(c,[[-10,-42],[-11,-12]],"#74888a",1);rect(c,-24,-39,10,2,"#75878a");
    round(c,-25,-79,39,6,2,"#485862");rect(c,-24,-79,17,5,alpha(243,102,94,.62+flash*.38));rect(c,-6,-79,18,5,alpha(95,181,234,.6+rev*.4));
    glow(c,-18,-77,46,29,alpha(247,79,86,.41*flash));glow(c,5,-77,49,27,alpha(61,151,255,.42*rev));
    for(const wx of [-76,80]){
      ell(c,wx,-10,18.8,18.8,"#26323a");ell(c,wx,-10,11,11,"#768488");ell(c,wx,-10,6.6,6.6,"#465963");
      const theta=t*24;for(let i=0;i<3;i++)line(c,[[wx,-10],[wx+8*Math.cos(theta+i*2.094),-10+8*Math.sin(theta+i*2.094)]],"#a2acab",1.3);
      path(c,"M"+(wx-18)+" -7 Q"+(wx-12)+" -32 "+wx+" -30 Q"+(wx+14)+" -29 "+(wx+18)+" -10",null,"#667e84",2);
    }
    round(c,106,-33,16,5,2,"#f2dcab");round(c,-123,-29,10,5,2,"#be7168");
    for(let i=0;i<24;i++){const p=mod(t*3+rand(i+271),1),xx=-78-p*(26+rand(i+861)*69),yy=4-(8+rand(i+56)*18)*Math.sin(Math.PI*p);line(c,[[xx,yy],[xx+4,yy+2]],alpha(155,188,198,.45*(1-p)),1.1);}
  });
}
function street(c,t,id){
  const x=-325+(t-2)*195;
  let cx=lerp(488,516,ease(0,4.2,t)),cy=258,z=1.035+ease(0,4.2,t)*.055;
  if(id==="patrol"){cx=lerp(326,690,ease(4.2,9.05,t));cy=320;z=1.44;}
  camera(c,cx,cy,z,()=>{facade(c,t);ripples(c,t,-90,358,1250,195,95);car(c,x,t);rain(c,t,-230,-70,1620,735,420,1.23);});
}
function entryMotion(t){
  return {x:281+(t-20.8)*144,y:442-43*ease(22.15,25,t),scale:.85-.13*ease(22.9,25.2,t),open:pulse(23.1,24.18,25.15,25.85,t)};
}
function court(c,t,id){
  const close=id==="entry",ending=id==="endwindow";
  let cx=lerp(445,500,ease(16.65,20.8,t)),cy=lerp(167,259,ease(16.65,18.9,t)),z=1.10;
  if(close){cx=lerp(565,789,ease(20.8,24.9,t));cy=lerp(320,344,ease(20.8,24.4,t));z=lerp(1.24,1.62,ease(20.8,25,t));}
  if(ending){cx=lerp(741,761,ease(49.65,53,t));cy=328;z=1.38;}
  camera(c,cx,cy,z,()=>{
    rect(c,-400,-350,1950,1300,grad(c,0,-50,200,600,[[0,"#253e4d"],[.52,"#4c6672"],[1,"#344c58"]]));
    poly(c,[[-340,-200],[753,-180],[749,137],[-340,247]],"#435862");
    for(let i=0;i<16;i++){const xx=-270+i*74,off=-.102*xx;windows(c,xx,-62+off,1,4,45,57,41,32,190+i*9);}
    poly(c,[[-270,232],[754,128],[754,144],[-270,248]],"#869190");
    poly(c,[[-270,248],[757,143],[758,159],[-270,264]],"#334c57");
    bike(c,82,205,.75);bike(c,112,203,.74);ledge(c,182,92,.75);ledge(c,404,72,.64);
    for(const [xx,yy] of [[185,218],[526,184],[636,173]]){
      poly(c,[[xx-13,yy-12],[xx+12,yy-14],[xx+10,yy],[xx-10,yy+2]],"#485b5c");
      shrub(c,xx,yy-12,.69,t+xx);
    }
    for(let i=0;i<90;i++){const xx=-180+rand(i+118)*1270,yy=174+rand(i+210)*485;if(yy<202-xx*.1)continue;line(c,[[xx,yy],[xx+6+rand(i+690)*35,yy-1.4]],"rgba(166,188,188,.19)",.85);}
    for(let i=0;i<6;i++){const y=279+i*56;line(c,[[-200,y+40],[1100,y-85]],"rgba(32,61,73,.36)",1);}
    poly(c,[[688,-270],[1240,-260],[1245,474],[765,415]],"#685b59");
    for(let j=0;j<32;j++){const yy=-226+j*22;line(c,[[690,yy],[1245,yy+53]],"rgba(177,140,124,.19)",1);for(let k=0;k<8;k++){const xx=729+(j%2)*32+k*74;line(c,[[xx,yy+(xx-690)*.095],[xx+2,yy+20+(xx-690)*.095]],"rgba(173,138,122,.16)",.72);}}
    poly(c,[[687,-230],[700,-232],[775,416],[761,416]],"#92918b");
    line(c,[[722,-76],[751,133],[788,414]],"#a6aaa1",6);line(c,[[726,-76],[755,133],[791,414]],"#677770",1.5);
    for(let i=0;i<7;i++){const yy=-12+i*68,xx=733+(yy+12)*.132;line(c,[[xx-5,yy],[xx+5,yy+.8]],"#60736f",2.5);}
    const motion=entryMotion(t),op=motion.open;
    rect(c,803,282,91,128,"#384342");rect(c,809,288,79,118,"#413d36");rect(c,815,292,69,103,"#514b3e");
    rect(c,825,303,26,81,"#625542");rect(c,829,305,18,52,"#847153");
    const right=885-op*60;
    poly(c,[[809,286],[right,289+op*8],[right,404-op*10],[809,405]],"#7c7662","#394640",2.2);
    poly(c,[[815,295],[right-4,297+op*8],[right-4,354-op*4],[815,354]],"#9d9a7c");
    line(c,[[right-7,363],[right-7,376]],"#ddd3a5",2);rect(c,809,404,83,5,"#ab9f83");
    poly(c,[[772,269],[908,279],[926,260],[790,251]],"#92998f");poly(c,[[772,269],[909,279],[909,287],[773,277]],"#45534f");
    line(c,[[804,281],[858,285]],"#ead0a2",3);sign(c,907,304);glow(c,852,346,94,107,"rgba(221,177,104,.20)");
    round(c,839,287,15,5,2.2,"#3b4442");ell(c,850,289.5,1.25,1,op>.03?"#bbe4ac":"#897e70");
    poly(c,[[809,406],[891,409],[880,462],[755,456]],"rgba(224,187,124,.13)");
    ripples(c,t,23,217,735,330,53,5);
    const lead=170+(t-16.65)*138;
    for(const [kind,xx,yy,s] of [["hood",lead,257-lead*.066,.69],["chase",lead-112,268-lead*.066,.76]]){
      if(!ending&&xx<759){ell(c,xx+2,yy+1,17,3.4,"rgba(31,49,58,.38)");runner(c,kind,xx,yy,s,(xx-10)/s,0,kind==="hood"?pulse(17.75,18.01,18.40,18.65,t):0);}
    }
    if(t>19&&t<25.45){
      const xx=motion.x,yy=motion.y,s=motion.scale;
      c.save();c.beginPath();c.rect(-500,-350,1389,1100);c.clip();
      ell(c,xx-1,yy+2,20,4,"rgba(35,48,54,.44)");runner(c,"entry",xx,yy,s,(xx-281)/s,.9*ease(23.50,24.98,t));c.restore();
    }
    rect(c,889,287,5,123,"#4e5350");rain(c,t,-130,-90,1350,750,326,1.03,24);
  });
  if(id==="look"||ending){
    const a=ending?.72:1-ease(17.1,18.4,t)*.8;c.save();c.globalAlpha=a;
    poly(c,[[0,0],[30,0],[51,540],[0,540]],"#253239");
    poly(c,[[0,506],[960,478],[960,495],[0,529]],"#33444b");
    path(c,"M0 162 Q41 153 63 203 Q79 245 52 288 L63 309 Q110 325 140 431 L151 540 H0Z","#263037");c.restore();
  }
}
module.exports={street,court,entryMotion};
