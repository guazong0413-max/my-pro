"use strict";
const {rect,round,ell,line,poly,path,grad,glow,text,place,vignette,rand,clamp,lerp,ease,pulse}=require("./drawing.cjs");
const {city,tower,apartment,pane,candle,hallDoor}=require("./places.cjs");
const {actor,cat,visitor,blink}=require("./cast.cjs");
function stair(c,t){
  rect(c,0,0,960,540,grad(c,0,70,960,509,[[0,"#293747"],[.6,"#40515e"],[1,"#283748"]]));
  rect(c,0,289,960,129,"#374a57");line(c,[[0,288],[960,288]],"#607076",2);
  rect(c,0,431,960,109,"#273542");
  rect(c,75,125,144,170,"#2b3b49");rect(c,82,132,130,154,"#627680");
  rect(c,87,137,120,144,grad(c,87,137,205,284,[[0,"#809197"],[1,"#546773"]]));
  line(c,[[146,137],[146,282]],"#40535f",4);line(c,[[86,210],[207,210]],"#40535f",3);
  poly(c,[[88,289],[207,289],[345,432],[110,432]],"rgba(167,180,176,.09)");
  text(c,"9",281,209,54,"#829092");text(c,"楼",320,209,14,"#718087");
  const steps=[];for(let i=0;i<15;i++)steps.push([324+i*38,439-i*20],[362+i*38,439-i*20]);
  poly(c,[...steps,[897,453],[324,471]],"#303f4d");
  for(let i=0;i<15;i++){let x=324+i*38,y=439-i*20;line(c,[[x,y],[x+38,y]],"#63737a",2.2);line(c,[[x+38,y],[x+38,y-18]],"#475966",1.25);}
  for(let i=0;i<8;i++){let x=330+i*76,y=435-i*40;line(c,[[x,y],[x,y-69]],"#64767a",2.3);}
  line(c,[[306,381],[891,73]],"#263742",7);line(c,[[306,378],[891,70]],"#899491",2.7);
  round(c,691,44,48,21,3,"#4e7972");path(c,"M707 54 L712 48 M712 48 L714 53 L721 53 M709 54 L707 60 M710 55 L714 61",null,"#bdcfaa",1.5);
  glow(c,717,54,58,44,"rgba(135,182,140,.10)");
  const q=ease(36.93,41.19,t),sx=811-215*q;
  c.save();const shade=c.createRadialGradient(sx,168+q*103,3,sx,168+q*103,46);shade.addColorStop(0,"rgba(23,33,45,.26)");shade.addColorStop(1,"rgba(23,33,45,0)");rect(c,sx-48,119+q*103,96,96,shade);c.restore();
  vignette(c,.25);
}
function mute(c,t){
  apartment(c,t,true);hallDoor(c,564,73,192,369);
  rect(c,134,242,64,77,"#323e4b");rect(c,141,249,50,60,"#58616a");
  line(c,[[147,266],[182,266]],"#7b827e",1.2);line(c,[[147,277],[177,277]],"#6e797a",1);
  const on=ease(42.38,42.78,t), dim=1-ease(43.26,43.73,t);const x=452,ground=446,s=1.82;
  const hand=[29,53+.75*on]; const px=x+s*hand[0],py=ground-171.2*s+s*hand[1];
  // Phone sits against the turned-in round palm; the speaker switch is silent.
  actor(c,"mei",x,ground,s,{t,expression:on>.35?"worry":"alert",near:hand,tilt:4*(1-ease(43.1,44,t)),blink:blink(t,[43.88]),freeze:on>.8});
  place(c,px+4,py-4,1,()=>{c.rotate(-.14);round(c,-4,-16,12.5,23,2.4,"#263744","#79878a",1);
    round(c,-2.4,-13.5,9.3,16.5,1,dim>.04?"#abbeb8":"#455460");
    if(on>.3&&dim>.2)line(c,[[-.7,-2.5],[5.8,-8.4]],"#9c7269",1);});
  glow(c,px,py-10,35,30,"rgba(181,209,202,"+(.08*dim)+")");
  cat(c,342,445,.79,t,{watch:.60,blinks:[44.97]});
}
function section(c,t){
  rect(c,0,0,960,540,grad(c,0,0,960,540,[[0,"#273645"],[1,"#3e4c58"]]));
  const x=278,y=43,w=428,fh=82;rect(c,x-8,y-8,w+16,5*fh+16,"#202e3c");
  for(let i=0;i<5;i++){
    const yy=y+i*fh,n=11-i;
    rect(c,x,yy,w,fh-5,n===9?"#4a5860":"#3c4b56");rect(c,x+117,yy,2.5,fh-6,"#293b47");
    rect(c,x+122,yy+5,299,fh-14,n===9?"#586163":"#45535d");
    for(let k=0;k<6;k++){let xx=x+15+k*15,sy=yy+fh-10-k*8;line(c,[[xx,sy],[xx+15,sy],[xx+15,sy-7]],"#788583",1.3);}
    line(c,[[x+10,yy+fh-25],[x+102,yy+9]],"#6c7b7c",1.4);
    for(let j=0;j<3;j++){let xx=x+145+j*91;rect(c,xx,yy+14,47,47,n===9&&j===1?"#a59069":"#344451");rect(c,xx+4,yy+18,39,39,n===9&&j===1?"#bba17a":"#40505d");}
    text(c,n+" 楼",x-22,yy+51,19,n===9?"#e4c386":"#99a4a2","right",n===9);
  }
  const pause=ease(45.7,46.5,t),down=ease(47.88,49.63,t);
  const px=x+lerp(96,68,pause)-16*down,py=y+2*fh+lerp(29,43,pause)+61*down;
  glow(c,px,py,21,17,"rgba(196,154,108,.20)");ell(c,px,py,4,4,"#c39d76");
  const hy=y+2*fh+38;line(c,[[x+w,hy],[763,hy]],"#aa997d",1);
  text(c,"小美的房间",777,hy+5,16,"#d0c5ae");
}
function curtain(c,t){
  const right=t>=57.46;
  const z=right?1.19:1.02;
  c.save();c.translate(480,270);c.scale(z,z);c.translate(right?-514:-478,-270);
  apartment(c,t,true);pane(c,238,70,491,285,t,true);
  line(c,[[211,59],[752,59]],"#727b7b",5);ell(c,210,59,5,5,"#7d7f7a");ell(c,754,59,5,5,"#7d7f7a");
  const leftPull=ease(56.15,57.40,t),rightPull=ease(57.50,58.68,t);
  const l=lerp(374,485,leftPull),r=lerp(592,483,rightPull);
  function cloth(edge,left){
    const x=left?217:edge,w=left?edge-217:742-edge;
    path(c,"M"+x+" 64 L"+(x+w)+" 64 Q"+(x+w-2)+" 161 "+(x+w+2)+" 250 L"+(x+w)+" 359 Q"+(x+w*.75)+" 363 "+(x+w*.52)+" 360 Q"+(x+w*.28)+" 366 "+x+" 360 Q"+(x+2)+" 220 "+x+" 64Z",left?"#765b5c":"#806062");
    for(let j=1;j<8;j++){
      const xx=x+j*w/8;
      path(c,"M"+xx+" 66 Q"+(xx-4)+" 162 "+(xx+1)+" 256 L"+(xx-1)+" 354",null,j%2?"#694e54":"#957174",j%2?2.5:1);
    }
    for(let j=0;j<7;j++){let xx=x+(j+.45)*w/7;ell(c,xx,62,2.1,4.2,null,"#999081",1.2);}
  }
  cloth(l,true);cloth(r,false);
  const edge=right?r:l;const s=1.63;const ground=438;
  const reach=1-ease(58.68,59.40,t);
  actor(c,"mei",edge+(right?1:-1)*49,ground,s,{t,mirror:right,near:[lerp(12,29,reach),lerp(85,54,reach)],expression:"neutral",walk:{progress:right?rightPull:leftPull,distance:(right?109:111)/s},tilt:-3,blink:blink(t,[57.16,59.17])});
  rect(c,0,0,960,540,"rgba(17,29,42,.12)");c.restore();
}
function loneWindow(c,t){
  const q=ease(59.62,63.96,t);c.save();c.translate(480,271);c.scale(1.14-.12*q,1.14-.12*q);c.translate(-480,-271);
  city(c,t,true);tower(c,521,112,.82,t,true);
  rect(c,-55,427,1070,120,"#1d2a39");
  for(let j=0;j<6;j++){const xx=j*198-78,h=38+rand(j+61)*58;rect(c,xx,429-h,169,h+50,"#1c2a3a");rect(c,xx-3,428-h,175,4,"#2b3845");}
  c.restore();vignette(c,.34);
}
function nearDoor(c,t,scale=1){
  c.save();const track=ease(64,69.76,t);
  c.translate(480,267);c.scale(scale,scale);c.translate(-478-6*track,-267);
  apartment(c,t,true);
  rect(c,0,0,960,540,"rgba(15,21,35,.16)");hallDoor(c,559,61,215,379);
  rect(c,133,326,180,10,"#635e56");rect(c,144,335,158,102,"#4c4c4a");
  line(c,[[152,357],[293,357]],"#67645c",1);line(c,[[199,348],[237,348]],"#7c766a",2);
  candle(c,227,324,1.03,t);
  const enter=ease(66.38,67.52,t),feet=ease(67.35,68.14,t);
  const light=grad(c,660,437,655,483,[[0,"rgba(230,204,139,"+(.39*enter)+")"],[1,"rgba(193,173,132,0)"]]);
  poly(c,[[562,438],[770,438],[819,495],[510,495]],light);
  rect(c,562,437,207,2,"rgba(226,206,155,"+(.76*enter)+")");
  if(feet>0){
    poly(c,[[634,438],[649,438],[638,470],[613,471]],"rgba(22,29,39,"+(.73*feet)+")");
    poly(c,[[670,438],[684,438],[690,468],[665,468]],"rgba(22,29,39,"+(.73*feet)+")");
  }
  const freeze=ease(65.87,66.34,t);
  cat(c,371,442,1.38,t,{watch:freeze,tail:.23+.74*freeze,turn:.97*freeze,blinks:[64.72]});
  if(t<66.2){
    c.save();c.globalAlpha=1-ease(65.64,66.18,t);
    text(c,"第 一 天  /  夜",71,87,16,"#a4b2ac");text(c,"22:13",67,144,47,"#d3cfb9");c.restore();
  }
  c.restore();
}
function listeningDoor(c,t,knocks){
  rect(c,0,0,960,540,grad(c,0,0,960,490,[[0,"#243345"],[.67,"#3c4856"],[1,"#273648"]]));
  // A tiny response in the leaf, only at each impact. The jamb and camera are fixed.
  const vibration=knocks.reduce((v,k)=>t<k?v:v+.97*Math.exp(-18*(t-k))*Math.sin((t-k)*51),0);
  rect(c,282,-20,404,620,"#26303d");rect(c,289,-20,392,620,"#535c65");
  c.save();c.translate(vibration,0);hallDoor(c,300,-287,367,806);c.restore();
  rect(c,0,519,960,21,"#28333e");
  poly(c,[[301,518],[666,518],[697,542],[269,542]],grad(c,480,516,480,541,[[0,"rgba(202,180,126,.38)"],[1,"rgba(202,180,126,0)"]]));
  for(const x of [440,507])poly(c,[[x,518],[x+23,518],[x+28,542],[x-11,542]],"#28313c");
  vignette(c,.37);
}
function listenFace(c,t){
  apartment(c,t,true);
  rect(c,693,0,267,485,"#2e3b4b");rect(c,683,0,10,489,"#626969");
  rect(c,701,0,3,487,"#475361");
  glow(c,112,332,226,204,"rgba(200,153,91,.18)");
  const at=ease(79.88,82.68,t),s=t<79.88?2.52:3.16;
  const base=t<79.88?456:536+54*at;
  // At the end her eye reaches the inner brass viewer, seen in profile.
  const ground=t<79.88?484:612;
  actor(c,"mei",base,ground,s,{t,lean:t<79.88?1.6:4.2+4.1*at,expression:t<79.88?"worry":"alert",tilt:t<79.88?-1.3:-2.4,near:t<79.88?[11,85]:[24,76],blink:blink(t,[76.24,78.66,80.61])});
  if(t>=79.88){round(c,672,136,15,23,3,"#847d69");ell(c,673,147.5,4.4,10,"#a09474");ell(c,671,147.5,2.2,6.7,"#2e3840");}
  else{hallDoor(c,624,41,201,410);cat(c,288,451,.93,t,{watch:.92,tail:.80});}
  vignette(c,.27);
}
function peephole(c,t,lip){
  rect(c,0,0,960,540,"#151c28");const cx=485,cy=255,r=218+9*ease(86.6,89.9,t);
  c.save();c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.clip();
  rect(c,0,0,960,540,grad(c,310,89,660,439,[[0,"#495767"],[.54,"#58626a"],[1,"#384856"]]));
  rect(c,285,290,395,86,"#485762");line(c,[[280,291],[690,288]],"#677273",1.7);
  rect(c,277,380,420,116,"#35434f");line(c,[[279,382],[687,379]],"#536367",2);
  rect(c,306,111,65,270,"#3d4b58");rect(c,311,116,55,264,"#4c5863");
  rect(c,645,114,48,267,"#45535e");rect(c,651,119,38,261,"#52606a");
  const q=ease(86.25,89.45,t),z=1+q*.11;
  c.save();c.translate(478,245);c.scale(z,z);c.translate(-478,-245);
  const handX=512,beamY=289;
  poly(c,[[handX-4,beamY],[handX+5,beamY],[537,405],[462,405]],grad(c,513,beamY,497,405,[[0,"rgba(254,229,165,.43)"],[.52,"rgba(240,214,153,.27)"],[1,"rgba(224,207,158,.09)"]]));
  glow(c,500,401,45,8,"rgba(241,215,151,.19)");
  ell(c,432,396.5,28,3.5,"rgba(20,28,36,.34)");ell(c,544,398.2,30,3.2,"rgba(20,28,36,.34)");
  actor(c,"xu",432,397,1.50,{t,view:"front",expression:t>86.3?"worry":"alert",tilt:t>86.3?-1.7:.5,gaze:.17,near:[13,64],blink:blink(t,[85.62,89.35])});
  visitor(c,544,136,1.76,t,lip);
  c.restore();
  const g=c.createRadialGradient(cx-10,cy-7,108,cx,cy,r);g.addColorStop(0,"rgba(17,22,31,0)");g.addColorStop(.76,"rgba(17,22,31,.16)");g.addColorStop(1,"rgba(13,18,25,.83)");
  rect(c,0,0,960,540,g);c.restore();
  ell(c,cx,cy,r+1,r+1,null,"#606368",2.1);ell(c,cx,cy,r+5,r+5,null,"#2b323a",3);
}
module.exports={stair,mute,section,curtain,loneWindow,nearDoor,listeningDoor,listenFace,peephole};
