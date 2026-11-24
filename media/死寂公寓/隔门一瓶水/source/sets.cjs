"use strict";
const {W,H,createCanvas,painter,clamp,mix,ease,rgba,seeded}=require("./draw.cjs");

function rooms(b) {
  const {g,rect,path,poly,line,box,ell,glow,grad,text,at,clip}=b;
  const cool="#1c2a38", mortar="#283845", warm="#74614e";
  const wallBlue="#223346";
  function wallTone(warmth) {
    return warmth?["#272933","#222731","#39363b"]:["#1c2937","#162330","#33434b"];
  }
  function specks(x,y,w,h,n,seed,color,alpha){
    const r=seeded(seed);
    g.save();
    for(let i=0;i<n;i++){
      g.globalAlpha=alpha*(.24+r()*.76);
      const px=x+r()*w,py=y+r()*h;
      rect(px,py,.46+r()*2.9,.45+r()*.67,color);
    }
    g.restore();
  }
  function floor(y,shade){
    rect(-100,y,1160,760-y,grad(0,y,0,650,[[0,shade],[1,"#111b27"]]));
    line([[-130,y],[1090,y]],rgba("92a5ac",.37),.9);
    for (let x=-120;x<1240;x+=119) {
      const p=481+(x-481)*.58;
      line([[p,y],[x,630]],rgba("829297",.113),.73);
    }
    for(const off of [32,70,121,180]){
      line([[-119,y+off],[1080,y+off]],rgba("718388",.107),.81);
    }
    glow(431,y+12,374,45,"6a7d7c",.105);
  }
  function plaster(inside=false){
    const c=wallTone(inside);
    rect(-140,-110,1240,760,grad(97,50,808,527,[[0,c[1]],[.53,c[0]],[1,inside?"#1b232e":"#131e2c"]]));
    rect(-140,371,1240,73,inside?"#282a31":"#20343d");
    line([[-120,371],[1090,371]],rgba(c[2].slice(1),.52),1.2);
    rect(-140,428,1240,14,inside?"#292a30":"#263944");
    line([[-120,430],[1090,430]],rgba("90a09d",.17),.8);
    specks(-80,37,1120,386,1857,inside?134:247,c[2],.15);
  }
  function bollard(x,y){
    rect(x,y,38,10,"#243740");
    box(x+5,y+3,28,4,1.8,"#58675f");
    glow(x+18,y+5,62,32,"9bab7e",.105);
  }
  function hall(floorLabel="09"){
    plaster(false);
    poly([[0,-9],[960,-9],[960,100],[632,70],[0,98]],"#182431");
    line([[0,98],[632,70],[960,100]],"#334654",1);
    path("M-100 124 H787 L949 102 M80 120 L94 140 M472 123 L484 134 M720 121 L734 111",null,"#2a3a48",.9);
    rect(765,96,198,347,grad(758,218,966,440,[[0,"#1b2936"],[1,"#0a141f"]]));
    poly([[765,95],[951,110],[894,140],[765,122]],"#2b3b47");
    path("M765 121 L765 442 H896 L925 410 V177 H901 V151 L765 121Z","#0e1a27","#2b3b48",.8);
    poly([[822,440],[927,439],[959,399],[845,403]],"#1b2b39");
    for(let k=0;k<5;k++){
      const dx=k*10,dy=k*11;
      poly([[825+dx,441-dy],[940+dx,441-dy],[950+dx,436-dy],[834+dx,436-dy]],"#354553");
      line([[828+dx,441-dy],[940+dx,441-dy]],rgba("6d8390",.28),.9);
    }
    line([[875,418],[936,367],[982,348]],"#455761",2);
    line([[886,426],[886,410]],"#455761",.9);
    box(784,160,63,19,2,"#25393c","#3c514d",.7);
    text("楼梯",812,174,9.5,"#89a697",{align:"center",weight:550});
    glow(812,169,72,37,"7cb699",.13);
    box(248,185,59,33,2,"#2a3a48","#3d4d55",1);
    text(floorLabel,277,209,19,"#a9b3ac",{align:"center",weight:520});
    ell(252,201,.9,.9,"#859292");
    ell(303,201,.9,.9,"#859292");
    glow(426,120,381,225,"afc3b1",.115);
    box(388,105,126,9,3,"#45555a");
    rect(403,110,97,2.9,"#97a5a0");
    glow(452,114,185,112,"a5baaa",.19);
    glow(165,225,203,233,"608792",.102);
    floor(443,"#28353f");
    bollard(748,423);
    rect(-120,-88,1240,763,grad(811,44,122,517,[[0,rgba("07101a",.24)],[.46,rgba("0b121c",.10)],[1,rgba("05101d",.44)]]));
  }
  function inside(){
    plaster(true);
    rect(-140,-90,1240,115,"#282833");
    line([[-100,26],[1080,26]],rgba("7a684e",.24),.75);
    poly([[40,135],[277,135],[264,375],[11,375]],"#1b222e","#40434a",.9);
    rect(65,159,188,175,"#263446");
    poly([[68,165],[247,165],[247,332],[64,332]],grad(86,162,214,346,[[0,"#313f51"],[1,"#131e2c"]]));
    line([[156,163],[156,334]],"#435061",4.0);
    line([[64,249],[251,249]],"#435061",4.0);
    path("M70 148 C90 190 69 271 88 340 Q65 351 46 356 L40 135Z", "#444049");
    path("M251 148 C229 187 251 281 230 346 L266 360 L275 136Z", "#48414a");
    line([[63,154],[67,201],[60,273],[66,341]],rgba("a18370",.22),1.1);
    line([[261,150],[251,203],[255,279],[249,345]],rgba("a18370",.21),1.1);
    path("M136 197 Q256 193 351 252 L467 418 L264 421Z",grad(136,188,396,429,[[0,rgba("8da3b4",.17)],[1,rgba("849daf",0)]]));
    floor(443,"#302f34");
    sideTable(135,410,.90);
    lamp(166,332,.75);
    glow(165,352,214,127,"d2a464",.157);
    glow(486,301,218,168,"c0ab81",.057);
    rect(-120,-88,1240,763,grad(800,40,240,521,[[0,rgba("050d17",.41)],[.69,rgba("08101b",.055)],[1,rgba("0b111b",.34)]]));
  }
  function sideTable(x,y,s=1){
    at(x,y,s,s,0,()=>{
      box(-12,-5,167,14,2,"#4a3c39","#685348",.73);
      rect(-8,8,158,7,"#342d31");
      for(const px of [6,135]){
        poly([[px,12],[px+6,12],[px+5,54],[px-1,54]],"#463a36");
        line([[px+.6,16],[px-.2,53]],rgba("a1886f",.33),.8);
      }
      line([[-3,2],[143,2]],rgba("ab8668",.33),1);
    });
  }
  function lamp(x,y,s=1){
    at(x,y,s,s,0,()=>{
      glow(0,-9,72,67,"e6b67c",.263);
      path("M-24 -23 Q0 -27 24 -23 L34 13 Q0 19 -34 13Z", "#988264","#bca586",.77);
      path("M-23 -21 Q0 -25 23 -21 L32 12 Q0 17 -32 12Z",grad(0,-25,0,15,[[0,"#88745d"],[1,"#d5b388"]]));
      ell(0,13,33,3.5,"#b89268");
      ell(0,13,21,2.3,"#ddbc8e");
      line([[0,17],[0,57]],"#7e6d5c",2.9);
      ell(0,58,15,3.6,"#6a5d53","#918373",.71);
    });
  }
  function chain(x,y,span,tension=1,shade=1){
    if(span<3)return;
    const n=Math.max(3,Math.floor(span/5.5));
    const sag=4+12*(1-tension);
    const slope=q=>y+sag*Math.sin(Math.PI*q)+1.55*q;
    for(let i=0;i<n;i++){
      const q=(i+.5)/n,q1=Math.min(1,q+.021);
      const theta=Math.atan2(slope(q1)-slope(q),Math.max(.1,span*(q1-q)));
      ell(x+q*span,slope(q),Math.min(7,span/n*.74),i%2===0?2.5:1.34,null,rgba("a6a08a",.78*shade),.77,theta);
      if(i%2===0)ell(x+q*span,slope(q)-.28,Math.min(7,span/n*.61),1.7,null,rgba("e1caa5",.29*shade),.41,theta);
    }
  }
  function door(x,y,w,h,open=0,inside=false,turn=0,chainOn=true){
    const gap=38*clamp(open), near=inside?1:-1;
    const leafX=x+(inside?gap:0),leafW=w-gap;
    rect(x-8,y-8,w+16,h+9,"#202e3a");
    line([[x-7,y+h],[x-7,y-7],[x+w+7,y-7],[x+w+7,y+h]],"#3a4c55",1.5);
    rect(x,y,w,h,"#0b1724");
    if(gap>0.3){
      const slit=inside?x:x+w-gap;
      rect(slit,y,gap,h,grad(slit,y,slit+gap,y,[[0,"#141e2b"],[.72,"#121d29"],[1,"#77705f"]]));
      poly([[slit,y+h-2],[slit+gap,y+h-2],[slit+gap+15,y+h+9],[slit-11,y+h+9]],
          rgba("a39777",.21*open));
      rect(slit+(inside?2:gap-2),y+2,1.4,h-6,rgba("a5ac96",.57));
    }
    rect(leafX,y,leafW,h,grad(leafX,y,leafX+leafW,y+h,[[0,"#334955"],[.56,"#293e4e"],[1,"#243645"]]));
    line([[leafX+2,y+1],[leafX+leafW-2,y+1],[leafX+leafW-2,y+h]],"#536270",.8);
    line([[leafX+1,y+h-1],[leafX+1,y+1]], "#384c58",1.2);
    const panelX=leafX+10,panelW=leafW-20;
    box(panelX,y+16,panelW,h*.39,2,"#293d4a","#41545d",.95);
    box(panelX,y+h*.60,panelW,h*.348,2,"#293b49","#3e505a",.85);
    box(leafX+3,y+h*.493,leafW-6,h*.068,2,"#2b3d4b");
    const peepholeX=leafX+leafW*.516, peepholeY=y+h*.264;
    ell(peepholeX,peepholeY,3.4,3.1,"#6d6a5e","#7f8071",.61);
    ell(peepholeX,peepholeY,1.68,1.65,"#111e2a");
    const handX=leafX+(inside?19:leafW-20), handY=y+h*.552;
    box(handX-4,handY-10,8,22,1.8,"#726d5e","#938a75",.56);
    at(handX,handY,near,1,-turn*.20,()=>{
      path("M0 -1.1 H13.8 Q16.5 -1.1 16.5 1.3 Q16.5 3.4 13.8 3.4 H0Z","#a09278","#c3b394",.71);
    });
    box(handX-1.1,handY+6.5,2.2,3.2,.45,"#2c3436");
    if(inside&&chainOn){
      const cx=x-5.5, cy=y+h*.435;
      box(cx-2,cy-2,8,7,1,"#868374","#a5a094",.58);
      const edge=leafX+10;
      box(edge,cy-2,13,6.4,1,"#6e6d63","#999485",.55);
      chain(cx+3,cy+1,edge-cx,open,.84);
    }
    if (!inside){
      box(x+w+14,y+h*.452,20,34,2,"#283742","#4f5e62",.71);
      rect(x+w+20,y+h*.452+7,9,8,"#111c23");
      glow(x+w+25,y+h*.452+7,14,14,"cdb384",.16);
      ell(x+w+25,y+h*.452+7,1.7,1.55,"#b88d62");
    }
    const s=seeded(915);
    for(let i=0;i<41;i++){
      const k=leafX+5+s()*(leafW-15), y2=y+h*.12+s()*h*.85;
      line([[k,y2],[k+s()*4+1,y2+.52]],rgba("8ba0a5",.14),.51);
    }
    return {handle:[handX,handY],gap};
  }
  function radio(x,y,s,t){
    at(x,y,s,s,0,()=>{
      glow(18,10,105,76,"75a592",.10);
      path("M-31 -62 L29 -62 L37 -55 L37 15 Q35 23 28 23 L-29 23 Q-35 23 -35 16 V-55Z","#253037","#526463",.95);
      poly([[29,-61],[40,-55],[40,14],[37,20],[34,19],[34,-53]],"#182a30");
      box(-25,-49,48,21,3,"#161f27","#5c6868",.8);
      box(-22,-46,42,14,2,grad(-20,-48,21,-37,[[0,"#415e54"],[1,"#6d8a71"]]));
      rect(-17,-42,18,1,"#a0b49b");
      for(let j=0;j<5;j++)rect(-14+j*5,-38,2.9,1,rgba("b1c0a5",.73));
      for(let i=0;i<7;i++){
        box(-24,-21+i*4.3,47,1.8,.9,"#101d26");
        line([[-22,-19.05+i*4.3],[21,-19.05+i*4.3]],rgba("7b918b",.30),.53);
      }
      box(12,-70,9,10,2.1,"#43504d","#59655b",.68);
      line([[30,-60],[38,-94],[41,-113]],"#4b5a56",4.0);
      line([[32,-63],[40,-98]],"#879183",.61);
      const led=(Math.sin(t*11)>.48||t>=80&&t<=84.6)?1:.20;
      glow(-19,-55,29,20,"dd8460",.39*led);
      ell(-19,-55,2.5,2.2,rgba("e6ab73",led));
    });
  }
  function radioRoom(){
    plaster(false);
    rect(160,83,688,360,grad(342,109,829,447,[[0,"#263633"],[1,"#152630"]]));
    rect(-120,373,1210,69,"#263a3b");
    line([[-120,373],[1080,373]],rgba("9a9a70",.27),.77);
    path("M655 145 H794 V442 H655Z","#182833","#415454",1);
    line([[666,153],[784,153],[784,432]],"#354952",.75);
    rect(669,439,108,2,"#a59471");
    glow(720,440,126,22,"b5a27f",.151);
    box(759,306,15,5,1.2,"#827b64");
    floor(443,"#263638");
    sideTable(287,398,1.42);
    box(328,311,114,76,5,"#253535","#425852",1.1);
    box(335,318,100,57,3,"#283934");
    rect(340,323,90,44,grad(340,323,430,367,[[0,"#28473f"],[1,"#38564b"]]));
    for(let i=0;i<8;i++)line([[340,327+i*4.6],[429,327+i*4.6]],rgba("8da894",.13),.5);
    poly([[363,386],[404,386],[412,394],[352,394]],"#263737");
    glow(392,345,97,74,"749b82",.126);
    glow(230,254,280,215,"728e7c",.097);
  }
  function bottle(x,y,s=1,tilt=0){
    at(x,y,s,s,tilt,()=>{
      path("M-12 34 Q-15 31 -15 24 L-15 -13 Q-14 -22 -9 -24 Q-5 -28 -4 -32 L-4 -37 H5 V-31 Q6 -27 10 -24 Q15 -21 15 -13 V26 Q15 34 11 35 Q0 37 -12 34Z",
        grad(-15,-10,15,-3,[[0,"#496c79"],[.26,"#85aeb7"],[.72,"#678d9b"],[1,"#476b7b"]]),"#b3c7c2",.68);
      path("M-12 -8 Q-4 -2 11 -6 L11 26 Q10 31 7 32 Q-2 34 -10 31 L-12 28Z",rgba("9fbfbe",.31));
      path("M-11 -17 Q-10 -20 -5 -24 Q-1 -26 -1 -32 M-12 -9 V14",null,rgba("e3eedc",.49),1.0);
      box(-15,-8,30,17,1.5,"#768d86","#a5af96",.53);
      path("M-14 -6 Q0 -3 14 -6 M-13 4 Q0 7 13 4",null,"#405d64",1.2);
      line([[-4,.6],[6,.6]],"#b3c7b2",1.12);
      box(-6,-42,12,8,1.5,"#5e7a91","#8ba9b4",.79);
      for(let i=0;i<5;i++)line([[-4+i*2,-40],[-4+i*2,-36]],rgba("252f43",.61),.55);
      for(const yy of [14,20,26])path("M-11 "+yy+" Q0 "+(yy+2.3)+" 11 "+yy,null,rgba("c2d7cf",.31),.62);
      path("M-10 32 Q0 33.8 9 32.2",null,rgba("e3e7dc",.32),.83);
    });
  }
  function doorDetail(t,open){
    rect(0,0,W,H,"#182433");
    poly([[0,0],[385,0],[444,540],[0,540]],"#263a4b");
    poly([[0,0],[360,0],[420,540],[0,540]],"#283a48");
    path("M-90 116 H335 L356 242 H-83 M-90 336 H359 L393 579",null,"#3d5360",1.3);
    const gap=77+50*open;
    poly([[385,0],[385+gap,0],[447+gap,540],[444,540]],grad(400,0,550,540,[[0,"#101c2a"],[.70,"#1b2936"],[1,"#263745"]]));
    poly([[385+gap,0],[W,0],[W,H],[447+gap,H]],"#2b3440");
    line([[385+gap,0],[447+gap,H]],"#64716d",1.05);
    box(561,186,56,23,3,"#505956");
    box(379,201,48,14,2,"#6f7163","#8e9083",.7);
    chain(418,207,Math.max(25,gap+5),open,1);
    glow(476,239,186,139,"969f97",.145);
    specks(0,0,W,H,1028,44,"#5f777e",.16);
  }
  const STEP={x:171,y:450,dx:45,dy:14};
  function tread(i){return [STEP.x+i*STEP.dx,STEP.y-i*STEP.dy];}
  const railHeight=x=>STEP.y-100-(x-STEP.x)*STEP.dy/STEP.dx;
  function stairs(){
    rect(-160,-160,1280,800,grad(140,38,816,521,[[0,"#273847"],[.5,"#1b2c3c"],[1,"#152431"]]));
    poly([[-110,430],[927,113],[1080,154],[1080,680],[-130,680]],"#243843");
    line([[-110,431],[945,108]],rgba("97a6a2",.24),1);
    box(714,55,108,104,2,"#354854","#4b5d64",.84);
    rect(724,66,88,82,grad(731,67,801,148,[[0,"#465f73"],[1,"#2a4157"]]));
    line([[769,66],[769,148]], "#4d5e6c",2.5);
    line([[724,110],[812,110]], "#4d5e6c",2.5);
    for(let i=0;i<9;i++){
      const h=7+(i*13)%31;
      rect(725+i*10,147-h,8,h,"#293f54");
    }
    glow(758,119,181,145,"8199a8",.13);
    const first=tread(0);
    const steps=[[-140,500],[-140,first[1]], [first[0]-STEP.dx/2,first[1]]];
    for(let i=0;i<=14;i++){
      const [x,y]=tread(i);
      steps.push([x-STEP.dx/2,y],[x+STEP.dx/2,y]);
    }
    steps.push([1020,tread(14)[1]],[1050,600],[-140,600]);
    poly(steps,"#233545");
    line(steps.slice(1,-3),"#57707f",3);
    for(let i=1;i<=14;i++){
      const [x,y]=tread(i);
      rect(x-STEP.dx/2,y+1.6,STEP.dx,7.7,"#2a4050");
      line([[x-STEP.dx/2+1,y+.8],[x+STEP.dx/2-1,y+.8]],rgba("a2a9a4",.45),1.22);
      line([[x-STEP.dx/2+1,y+12],[x+STEP.dx/2-1,y+12]],rgba("111f2c",.65),.7);
    }
    for(let i=0;i<=14;i+=2){
      const [x,y]=tread(i);
      line([[x,y],[x,y-103]],"#242f38",3.0);
      line([[x+1.1,y-2],[x+1.1,y-102]],rgba("74817c",.34),.75);
    }
    line([[93,railHeight(93)+2],[840,railHeight(840)+2]],"#303f46",4.3);
    line([[93,railHeight(93)+.8],[840,railHeight(840)+.8]],"#5a6a6a",1.35);
    line([[94,railHeight(94)+41],[839,railHeight(839)+41]],"#2a3e48",2.6);
    specks(-137,0,1230,435,2400,711,"#698082",.113);
    box(844,146,67,29,2,"#2a3b42","#42615d",.74);
    text("11",876,167,17,"#a6b0a4",{align:"center",weight:520});
  }
  function plate(draw){
    const margin=100,sc=b.g.canvas.width/W;
    const c=createCanvas(Math.round((W+2*margin)*sc),Math.round((H+2*margin)*sc));
    const pb=painter(c);
    pb.g.setTransform(sc,0,0,sc,margin*sc,margin*sc);
    draw(rooms(pb));
    return ()=>g.drawImage(c,-margin,-margin,W+2*margin,H+2*margin);
  }
  return {hall,inside,door,doorDetail,radioRoom,radio,sideTable,lamp,stairs,bottle,chain,plate,railHeight,tread};
}

module.exports={rooms};
