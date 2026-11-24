"use strict";
const {rect,round,ell,line,poly,path,grad,glow,text,place,vignette,rand,clamp,lerp,ease,pulse}=require("./drawing.cjs");
const {city,tower,pedestrian,traffic,apartment,pane,bathroom,bottle,bread,candle,hallDoor}=require("./places.cjs");
const {actor,cat,visitor,blink}=require("./cast.cjs");
const ink="#35444b",paper="#e6dac0";
function camera(c,x,y,z,fn){c.save();c.translate(480,270);c.scale(z,z);c.translate(-x,-y);fn();c.restore();}
function exterior(c,t){
  const crowded=t>=4.12;
  camera(c,crowded?481+8*ease(4.12,8.16,t):480+4*t,268,crowded?1.025:1.04+.035*ease(0,4.12,t),()=>{
    city(c,t);tower(c,crowded?414:406,43,crowded?1.04:1.09,t);
    rect(c,-50,411,1060,20,"#a99f92");rect(c,-50,431,1060,109,"#74767a");rect(c,-50,429,1060,3,"#c0b4a1");
    for(let i=0;i<12;i++)rect(c,-22+i*104,488,40,3,"#aba69d");
    for(let i=0;i<(crowded?36:9);i++){
      const lane=i%3,x=-25+rand(i+100)*1040+(t*(i%5===0?-1:1))*(.85+rand(i+79)*1.3);
      const ground=420+lane*13+rand(i+31)*3;pedestrian(c,x,ground,.39+.105*lane,i+2,t);
    }
    if(crowded){for(let i=0;i<12;i++)pedestrian(c,-35+i*92+rand(i+25)*23,520+7*rand(i),1.11+rand(i+1)*.45,i+83,t);}
  });
}
function windowScene(c,t){
  apartment(c,t);pane(c,202,62,504,287,t);
  poly(c,[[212,359],[445,359],[553,454],[271,454]],"rgba(233,208,159,.21)");
  line(c,[[171,54],[743,54]],"#898b84",5);
  path(c,"M164 58 L214 58 Q210 181 190 231 L182 350 L156 351 Q177 199 164 58Z","#9c8c78");
  path(c,"M702 58 L739 57 Q727 197 748 348 L727 349 Q705 210 702 58Z","#b6a591");
  ell(c,423,448,51,6,"rgba(81,78,74,.22)");actor(c,"mei",409,445,1.48,{t,expression:t>10?"worry":"neutral",tilt:-3,near:[7,89],blink:blink(t,[10.72])});
  cat(c,631,347,.78,t,{tail:.27,blinks:[11.13]});
  text(c,"第 一 天",61,83,16,"#5b625f", "left",true);text(c,"07:38",59,134,43,"#414b50");line(c,[[62,153],[123,153]],"#959281",1.4);
}
function street(c,t){
  camera(c,478-9*ease(11.8,16,t),268,1.04,()=>{
    city(c,t);
    const facades=[[-24,39,266,"#b7ac99"],[239,10,241,"#c7b9a4"],[483,68,255,"#c3b49f"],[742,18,260,"#a9a497"]];
    for(const [x,y,w,clr] of facades){
      rect(c,x,y,w,389-y,clr);rect(c,x,y,w,7,"#d0c2af");
      for(let j=0;j<3;j++)for(let i=0;i<4;i++){
        rect(c,x+19+i*54,y+25+j*59,30,37,"#cfc1ae");rect(c,x+21+i*54,y+27+j*59,26,31,"#5c6671");
        rect(c,x+33+i*54,y+27+j*59,1.8,31,"#8f9190");rect(c,x+18+i*54,y+59+j*59,34,2.5,"#e0d0b8");
      }
      rect(c,x+24,266,w-50,121,"#767875");
      for(let j=0;j<16;j++)line(c,[[x+26,271+j*7.3],[x+w-27,271+j*7.3]],"#888882",.9);
      rect(c,x+19,249,w-39,17,"#8b8c81");
    }
    rect(c,-25,390,1020,28,"#aaa396");rect(c,-25,419,1020,120,"#75777b");
    traffic(c,t);
    for(let i=0;i<43;i++){const row=i%3;
      pedestrian(c,-20+rand(i+7)*1020+(t-12)*(i%5===0?-1:1)*2.3,397+row*11+rand(i+33)*4,.63+row*.17,i+105,t);}
    for(let i=0;i<16;i++)pedestrian(c,-38+i*70+rand(i+4)*16,499+rand(i)*18,1.62+rand(i+9)*.55,i+34,t);
    rect(c,-40,-20,1040,590,"rgba(90,90,97,.065)");
  });
}
function tub(c,t){
  bathroom(c,t);round(c,90,74,224,79,2,"#7e9399","#c3cac1",3);
  rect(c,99,82,206,63,grad(c,98,80,306,143,[[0,"#c2cdca"],[1,"#9bb0b0"]]));
  for(let i=0;i<7;i++)line(c,[[99,87+i*8],[304,87+i*8]],"#a3b3b1",1);
  rect(c,718,135,127,3,"#687e86");rect(c,738,139,66,63,"#9a9a88");line(c,[[744,192],[797,192]],"#b8b39d",2);
  ell(c,345,432,216,8,"rgba(45,63,70,.20)");ell(c,600,440,48,5,"rgba(45,63,70,.20)");
  // Side section: the pale enamel surrounds a single continuous water surface.
  path(c,"M112 303 Q114 297 125 297 L515 297 Q528 297 529 305 L518 395 Q516 420 490 425 L158 425 Q131 423 127 403Z","#d7d9ca","#809398",2);
  path(c,"M131 315 L508 315 L500 396 Q499 409 485 411 L161 411 Q147 410 145 397Z","#b6c7c5");
  const flow=1-ease(17.6,18.04,t),water=369-7*ease(16.02,18.06,t);
  path(c,"M139 "+water+" Q265 "+(water+1)+" 358 "+water+" Q438 "+(water-1.3)+" 505 "+water+" L500 396 Q499 409 485 411 L161 411 Q147 410 145 397Z","#83aeb7");
  line(c,[[140,water],[503,water]],"#a9c8ca",2);
  round(c,108,295,427,14,6,"#e2e3d5","#a7b5b2",1);
  path(c,"M536 298 L536 267 Q536 254 524 254 L498 254 Q487 254 487 265 L487 278",null,"#617b85",9);
  path(c,"M534 295 L534 267 Q534 257 524 257 L499 257 Q490 257 490 266",null,"#aababc",2.5);
  ell(c,541,266,9,7,"#81969b");line(c,[[541,265],[551,262]],"#aab6b3",4.5);
  if(flow>.005){c.save();c.globalAlpha=.77*flow;
    path(c,"M486 279 Q485 310 487 335 Q486 347 487 362",null,"#d5e6dc",2.8);
    ell(c,487,water,7+2*Math.sin(t*22),1.5,null,"#c3d8d5",1);c.restore();}
  for(const hit of [18.44,18.96,19.61]){
    if(t>=hit-.24&&t<hit){const q=(t-hit+.24)/.24;ell(c,487,279+(water-279)*q*q,1.45,2.3,"#d4e2d9");}
    if(t>=hit&&t<hit+.34){const q=(t-hit)/.34;c.save();c.globalAlpha=1-q;ell(c,487,water,2+q*12,1+q*1.7,null,"#c2d7d4",1);c.restore();}
  }
  const back=ease(18.67,19.84,t);
  actor(c,"mei",606,443,1.64,{t,mirror:true,near:[lerp(35,15,back),lerp(64,73,back)],tilt:3.7,expression:back>.4?"doubt":"neutral",blink:blink(t,[18.22])});
  cat(c,709,436,.73,t,{watch:.28,mirror:true,blinks:[19.42]});
}
function pantry(c,t){
  apartment(c,t);pane(c,619,56,228,198,t);
  rect(c,0,324,960,30,"#9c8b77");rect(c,0,349,960,86,"#8b7d6e");
  for(let i=0;i<5;i++)line(c,[[20+i*201,362],[20+i*201,429]],"#776e66",1.7);
  const z=1+.035*ease(20,24.5,t);camera(c,480,269,z,()=>{
    poly(c,[[122,342],[757,342],[829,378],[81,378]],"#b9a58c");rect(c,81,377,749,14,"#927d69");
    rect(c,110,390,13,78,"#83725f");rect(c,796,390,13,78,"#83725f");
    // Stagger three bottles without hiding any cap.
    for(const [x,y] of [[424,352],[452,359],[480,351]]){ell(c,x,y,11.5,2.6,"rgba(69,82,82,.23)");bottle(c,x,y,1.38);}
    bread(c,613,358,1.62);
    round(c,143,138,183,91,3,"#e0d6bf");text(c,"浴缸存水",161,167,16,"#6e7774");text(c,"40 升",160,211,34,"#455a62", "left",true);
    line(c,[[238,230],[238,301],[278,318]],"#8b9590",1);
  });
}
function ledger(c,t,second=false){
  const z=1+.028*ease(second?50:24.55,second?55.8:27.9,t);
  camera(c,480,270,z,()=>{
    rect(c,-30,-30,1020,620,grad(c,0,0,920,520,[[0,"#8e8980"],[.65,"#aa9d86"],[1,"#8e8578"]]));
    for(let i=0;i<8;i++)line(c,[[0,39+i*64],[960,36+i*64]],"rgba(96,82,69,.15)",1.2);
    c.save();c.translate(470,251);c.rotate(-.045);rect(c,-254,-154,511,335,"rgba(64,55,51,.20)");
    round(c,-258,-164,511,332,6,"#8a8976");round(c,-249,-167,495,328,5,"#e5dcc6");
    rect(c,-229,-151,2,298,"#c5b69a");
    for(let j=0;j<9;j++)line(c,[[-217,-106+29*j],[219,-106+29*j]],"#cfc5ac",.95);
    text(c,"第 1 天  /  物资记录",-199,-119,15,"#6d7774", "left",true);
    if(second){
      const entries=[["浴缸","40 升"],["水箱","+ 5 升"],["合计","45 升"]];
      entries.forEach(([a,b],i)=>{text(c,a,-190,-62+45*i,19,i===2?ink:"#61716f");text(c,b,108,-62+45*i,i===2?27:20,ink,"right",i===2);});
      line(c,[[-190,0],[133,0]],"#9c947f",1.15);line(c,[[-189,45],[133,45]],"#82979a",2);
      if(t>52.5){text(c,"约两周",116,89,20,"#758a7a","right");}
      if(t>54.10)text(c,"食物  /  一袋面包",-191,124,17,"#92745e");
    }else{
      text(c,"第一条规矩",-193,-53,21,"#697873");
      text(c,"物资得省着用。",-197,16,42,"#3f5355","left",true);
      line(c,[[-195,37],[-194+279*ease(24.7,26.4,t),37]],"#ad795d",2.4);
      text(c,"水   40 升      瓶装水 × 3      面包 × 1",-190,109,16,"#75807a");
    }
    c.restore();
    place(c,757,287,1,()=>{c.rotate(.28);round(c,0,-63,8,133,2,"#645d55");poly(c,[[0,70],[8,70],[3.7,83]],"#c3ad8b");poly(c,[[2.1,78],[5.3,78],[3.7,83]],"#4a4b48");});
  });
}
function tankWide(c,t){
  bathroom(c,t);
  rect(c,724,102,91,46,"#8ea1a5");rect(c,728,105,83,39,"#bac5bf");
  line(c,[[747,113],[747,134],[759,134]],"#a4b1ac",2);
  // Tank with an open rim, seat and foot on one porcelain base.
  path(c,"M536 319 L675 319 Q681 359 645 380 L638 420 L582 420 L584 389 Q558 379 551 351Z","#d8dace","#9aa9a5",1.5);
  ell(c,606,321,75,11,"#e7e6d8");ell(c,606,321,56,6,"#afc2c2");
  round(c,505,251,84,77,6,"#d6d9cc","#9babaa",1.5);ell(c,547,252,42,6,"#a5b6b5");ell(c,547,252,34,3.4,"#769ba5");
  round(c,619,411,76,9,4,"#dee0d4","#a1acab",1);
  rect(c,339,363,85,7,"#a49780");rect(c,345,370,6,55,"#8c8271");rect(c,411,370,6,55,"#8c8271");
  round(c,349,316,58,48,5,"#a8c0c0","#7e9b9f",1.4);rect(c,354,336,48,22,"#8eacb2");
  round(c,358,311,30,6,2,"#b6c9c6");path(c,"M392 320 Q403 316 402 331",null,"#809d9e",3);
  const g=ease(28.05,29.71,t);
  actor(c,"mei",458,434,1.71,{t,near:[lerp(10,39,g),lerp(88,62,g)],tilt:lerp(1,5,g),lean:2.8*g,expression:"doubt",blink:blink(t,[29.32])});
}
function dipper(c,t){
  c.save();c.translate(480,265);c.scale(1.48,1.48);c.translate(-536,-261);
  bathroom(c,t);rect(c,0,357,960,7,"#869c9e");rect(c,0,364,960,102,"#7b908f");
  round(c,573,273,96,113,11,"#adc4c1","#6f8f94",2);round(c,580,271,78,12,4,"#c6d2c4");ell(c,618.5,273,35,4,"#6c929b");
  rect(c,582,333-9*ease(30.65,31.83,t),77,41+9*ease(30.65,31.83,t),"#91b1b4");
  path(c,"M645 294 Q674 282 668 321 L658 328",null,"#77959b",4);
  text(c,"5 L",622,355,16,"#5c7e85","center");
  const pour=pulse(30.25,30.74,31.66,32.39,t), s=1.0;
  const cx=559+9*pour,cy=201-4*pour, angle=.61*pour;
  const local=(x,y)=>[cx+x*Math.cos(angle)-y*Math.sin(angle),cy+x*Math.sin(angle)+y*Math.cos(angle)];
  const sp=local(53,-5),grip=local(-58,1);
  if(pour>.1){
    const v=pulse(30.50,30.76,31.66,32.0,t);
    if(v>.01){c.save();c.globalAlpha=v;path(c,"M"+sp+" Q"+(sp[0]+5)+" "+(sp[1]+16)+" 617 273",null,"#cee1d8",4*v);
      ell(c,615,273,6+Math.sin(t*24)*2,1.2,null,"#d7e4d9",1.3);c.restore();}
  }
  // Thumb on the handle, curled fingertips underneath. Cuff and palm share a contour.
  path(c,"M-20 101 Q178 112 "+(grip[0]-28)+" "+(grip[1]-11)+" L"+(grip[0]-36)+" "+(grip[1]+17)+" Q186 165 -20 200Z","#9d7d4e");
  path(c,"M"+(grip[0]-42)+" "+(grip[1]-16)+" Q"+(grip[0]-32)+" "+(grip[1]-17)+" "+(grip[0]-25)+" "+(grip[1]-11)+" L"+(grip[0]-33)+" "+(grip[1]+17)+" L"+(grip[0]-50)+" "+(grip[1]+13)+"Z","#836747");
  place(c,cx,cy,s,()=>{
    c.rotate(angle);
    round(c,-75,-5,88,10,4,"#747c75");line(c,[[-69,-3],[-2,-3]],"#a5a89b",1.8);
    path(c,"M-4 -11 Q22 -18 53 -6 L47 6 Q44 27 24 30 Q2 31 -5 9Z","#d0d7c9","#7a9194",2);
    path(c,"M-2 -11 Q21 -18 52 -6 Q34 0 4 -3Z","#91abb0");path(c,"M4 -10 Q23 -14 47 -7",null,"#b5cdd0",2);
  });
  place(c,grip[0],grip[1],1,()=>{
    path(c,"M-35 -12 Q-21 -19 -12 -12 L-4 -9 Q1 -8 4 -2 L1 2 L-15 -1 Q-18 8 -23 12 L-34 11Z","#caa489");
    path(c,"M-18 0 Q-12 -1 -8 2 L-2 5 Q1 9 -2 11 Q-7 12 -12 9 L-21 7Z","#b38f79");
    path(c,"M-10 -11 Q-5 -13 0 -9 L10 -3 Q13 0 10 3 Q8 5 3 2 L-6 -2Z","#d6b398");
  });
  c.restore();
}
function lidHands(c,t){
  c.save();c.translate(480,260);c.scale(1.20,1.20);c.translate(-486,-265);
  rect(c,0,0,960,540,grad(c,0,0,960,490,[[0,"#8f9fa4"],[1,"#657e8d"]]));
  for(let i=0;i<5;i++)line(c,[[0,61+109*i],[960,61+109*i]],"rgba(212,224,215,.17)",1.5);
  for(let j=0;j<3;j++)line(c,[[138+j*307,0],[138+j*307,540]],"rgba(212,224,215,.12)",1.3);
  round(c,328,303,327,191,19,"#d4d8ca","#82999b",2);
  ell(c,491.5,303,158,10,"#bdc7bd");ell(c,491.5,302,144,5.8,"#80999b");
  const lower=ease(33.22,35.96,t),impact=t>=35.96?Math.exp(-(t-35.96)*14)*Math.sin((t-35.96)*49):0;
  const x=483+8*lower,y=237+62*lower-2*impact,ang=-.084*(1-lower)+.026*lower*(1-ease(35.96,36.43,t));
  const edge=k=>[x+k*Math.cos(ang),y+k*Math.sin(ang)];
  const [lx,ly]=edge(-160),[rx,ry]=edge(160);
  function palmBase(px,py,mirror){
    place(c,px,py,1,()=>{
      path(c,"M-410 -166 Q-258 -134 -57 -41 L-22 -23 L-34 7 Q-252 -64 -409 -70Z","#a48450");
      path(c,"M-87 -54 L-27 -32 L-13 -23 L-28 7 L-91 -12Z","#907346");
      path(c,"M-32 -25 Q-23 -30 -14 -23 L1 -14 Q12 -9 17 -3 L10 8 L-8 11 Q-21 11 -37 -3Z","#c6a087");
    },mirror);
  }
  palmBase(lx,ly,false);palmBase(rx,ry,true);
  place(c,x,y,1,()=>{c.rotate(ang);
    path(c,"M-169 -3 Q-165 -11 -154 -12 Q0 -17 155 -11 Q166 -10 170 -4 L172 1 Q170 8 162 9 L-163 9 Q-170 8 -171 3Z","#e5e6d9","#a2b0ad",1.7);
    path(c,"M-166 4 Q-3 7 167 3",null,"#bbc7be",2.4);
  });
  function fingers(px,py,mirror){
    place(c,px,py,1,()=>{
      path(c,"M-20 -18 Q-18 -25 -10 -21 Q-3 -17 11 -15 Q20 -14 23 -9 Q25 -4 17 -3 L4 -5 Q-6 -4 -12 -7Z","#dab59a");
      path(c,"M-15 1 Q-5 5 .5 7 Q6 9 8 6 L9 2 Q11 -1 14 1 Q18 3 15 8 Q12 16 5 16 Q-9 15 -19 9Z","#b48f79");
      path(c,"M-15 8 Q-6 12 1 13 Q3 16 -.5 18 Q-8 18 -17 13Z","#c69f84");
      path(c,"M12 -11 Q18 -11 20 -9",null,"#e4c4aa",1.15);
    },mirror);
  }
  fingers(lx,ly,false);fingers(rx,ry,true);c.restore();
}
module.exports={exterior,windowScene,street,tub,pantry,ledger,tankWide,dipper,lidHands};
