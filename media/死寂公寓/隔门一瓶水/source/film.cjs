"use strict";
const fs=require("node:fs");
const path=require("node:path");
const {spawn}=require("node:child_process");
const {once}=require("node:events");
const {Readable}=require("node:stream");
const {pipeline}=require("node:stream/promises");
const {W,H,createCanvas,painter,clamp,ease,mix,rgba,seeded,installFont}=require("./draw.cjs");
const {rooms}=require("./sets.cjs");
const {cast,point,length}=require("./character.cjs");

const read=(file)=>JSON.parse(fs.readFileSync(path.join(__dirname,file),"utf8").replace(/^\uFEFF/,""));
const PLAN=read("timeline.json"), E=PLAN.events, FPS=PLAN.fps;
const PERF=fs.existsSync(path.join(__dirname,"performance.json"))?read("performance.json"):{};
const times=PLAN.cuts;
const sec=(x)=>Math.round(x*FPS);

function pulse(t,a,b,c,d){return ease(t,a,b)*(1-ease(t,c,d));}
function curve(t,rows) {
  let i=0;
  while(i+1<rows.length&&t>=rows[i+1][0])i++;
  if(i===rows.length-1)return rows[i][1].slice();
  return point(rows[i][1],rows[i+1][1],ease(t,rows[i][0],rows[i+1][0]));
}

function contacts(t,rows,initial,{swing=.39,lift=13,stair=false}={}) {
  return [0,1].map(i=>{
    const pairs=[[initial[0],initial[i+1]],...rows.filter((_,j)=>j%2===i)];
    let k=0;
    while(k+1<pairs.length&&t>=pairs[k+1][0])k++;
    const [last,c]=pairs[k], next=pairs[k+1];
    let p=c.slice(), support=true,roll=0;
    if(stair&&last===E.slip) p[0]-=5.4*ease(t,last,last+.16);
    const realGround=p[1];
    if(next&&t>next[0]-swing){
      const z=clamp((t-next[0]+swing)/swing);
      const x=ease(z,.13,.925);
      const maxLift=Math.min(c[1],next[1][1])-lift;
      p=point(p,next[1],x);
      p[1]=z<.51?mix(c[1],maxLift,ease(z,0,.51)):mix(maxLift,next[1][1],ease(z,.51,1.0));
      roll=.19*Math.sin(z*Math.PI*2);
      support=false;
    }
    return {p,ground:realGround,support,roll,contact:last};
  });
}

function engine(canvas) {
  const b=painter(canvas), s=rooms(b), c=cast(b);
  const {g,path:svg,rect,box,poly,line,ell,grad,glow,text,at,lens,clip}=b;
  const hall9=s.plate(p=>p.hall("09")), inner=s.plate(p=>p.inside()), hall11=s.plate(p=>p.hall("11"));
  const stairPlate=s.plate(p=>p.stairs()), radioPlate=s.plate(p=>p.radioRoom());
  const scale=canvas.width/W;
  const Y=444;
  const mouth=(name,t)=>PERF.mouth?.[name]?.[sec(t)]||0;
  const grain=createCanvas(128,128), ctx=grain.getContext("2d"), p=ctx.createImageData(128,128), r=seeded(17705);
  for(let i=0;i<p.data.length;i+=4){
    const value=r()<.55?25:210;
    p.data[i]=p.data[i+1]=value;p.data[i+2]=Math.min(235,value+9);p.data[i+3]=Math.round(r()*16);
  }
  ctx.putImageData(p,0,0);
  const noise=g.createPattern(grain,"repeat");
  let diagnostics=[];

  function figure(name,pose) {
    const tests=c.body(name,{...pose,mouth:mouth(name,pose.t)});
    diagnostics.push(...tests.map(row=>({...row,person:name})));
    return tests;
  }
  const openAt=t=>pulse(t,20.10,23.58,46.83,48.78);
  const knobAt=t=>pulse(t,18.93,19.38,20.06,20.35)+.57*pulse(t,46.51,47.14,48.28,48.65);
  function levelWalk(t,which){
    const rows=which==="arrival"
      ? [[0,[777,Y]],[.83,[741,Y]],[1.50,[694,Y]],[2.18,[646,Y]],[3.01,[600,Y]],[3.49,[580,Y]]]
      : [[63.9,[724,Y]],[64.45,[702,Y]],[65.06,[663,Y]],[65.68,[625,Y]],[66.31,[592,Y]],[67.02,[570,Y]],[67.68,[558,Y]],[68.43,[537,Y]],[69.10,[511,Y]],[69.71,[486,Y]]];
    const x=curve(t,rows)[0];
    const foot=contacts(t,rows.slice(1).map(([at,k],i)=>{
      const before=rows[i][1][0], delta=before-k[0];
      return [at,[k[0]-.43*Math.min(delta,40)+(i%2?4:0),Y]];
    }),[rows[0][0],[rows[0][1][0]+9,Y],[rows[0][1][0]-3,Y]],{swing:.42,lift:12});
    const drop=.72+2.2*pulse(t,rows[0][0],rows[0][0]+.26,rows.at(-1)[0]-.36,rows.at(-1)[0]);
    return {x,y:Y,foot,drop};
  }
  function yuAtDoor(t,bottle=false) {
    const walk=levelWalk(t,"arrival"),x=walk.x;
    const reach=pulse(t,6.64,7.16,7.95,8.47);
    const tap=Math.max(...E.knock.map(k=>clamp(1-Math.abs(t-k)/.087)));
    const lean=.022+.155*reach+.043*pulse(t,8.5,9.6,11.8,13.17);
    const ww=point([x-3,333],[x-55-tap*4.2,305-2.7*tap],reach);
    if(bottle) {
      const u=ease(t,34.4,37.42);
      const w=point([x-31,317],[x-15,330],u);
      const bottlePos=[w[0]-11,w[1]+7];
      s.bottle(...bottlePos,.448,-.08+.10*u);
      figure("yu",{x,y:Y,scale:1.23,dir:-1,t,feet:walk.foot,drop:walk.drop,lean:.055,headTilt:.095*(1-u),
        wrist:w,grip:1,handAngle:Math.PI*.15});
    } else {
      figure("yu",{x,y:Y,scale:1.23,dir:-1,t,feet:walk.foot,drop:walk.drop,lean,
        headTilt:-.047*reach,wrist:reach>.01?ww:null,grip:.69*reach,handAngle:-.13,
        step:Math.sin(t*5.7)*pulse(t,.04,.28,2.58,3.30)});
    }
    return x;
  }
  function corridor(t,close,bottle=false){
    const zoom=close?(bottle?1.73:1.59):1.02;
    const u=close?ease(t,bottle?34.4:6.4,bottle?43:14.30):ease(t,0,6.4);
    const focus=close?550:488;
    lens(focus,323,zoom+u*.042,close?-65:0,close?-22:0,()=>{
      hall9();
      s.door(342,162,174,281,openAt(t),false,knobAt(t));
      if(openAt(t)>.02)glow(512,286,54,134,"a4a590",.123*openAt(t));
      yuAtDoor(t,bottle);
      if(close)rect(-120,-80,1200,710,grad(86,59,901,500,[[0,rgba("030d19",.35)],[.55,rgba("050e19",.02)],[1,rgba("050c16",.33)]]));
    });
  }
  function room(t,closing=false){
    const u=closing?ease(t,43,49.5):ease(t,14.3,20.8);
    lens(497,297,(closing?1.48:1.08)+.044*u,closing?38:0,closing?-21:0,()=>{
      inner();
      const open=openAt(t);
      const door=s.door(563,160,162,283,open,true,knobAt(t));
      glow(426,294,203,180,"bc966a",.084);
      const wristWeight=Math.max(pulse(t,17.59,19.2,20.31,20.75),pulse(t,44.8,46.9,48.15,48.75));
      const stepAt=closing?45.16:17.87;
      const forward=ease(t,stepAt,stepAt+.48);
      const back=closing?ease(t,48.37,49.34):0.;
      const shift=forward*(1-back);
      const parentX=514+35*shift;
      const near=point([parentX+7,332],[door.handle[0]-8.5,door.handle[1]+.8],wristWeight);
      const look=-.09*pulse(t,15.4,16.1,18.1,18.85)+.043*closing;
      figure("son",{x:368,y:Y,t,scale:.858,dir:1,lean:.016,drop:.37,headTilt:-.037});
      const footLift=4.5*Math.sin(forward*Math.PI)+5.2*Math.sin(back*Math.PI);
      const feet=[{p:[503,Y],ground:Y},{p:[521+37*shift,Y-footLift],ground:Y}];
      if(!closing&&t<18.85)s.bottle(parentX-2,340,.432,-.055);
      figure("mei",{x:parentX,y:Y,t,scale:1.19,dir:1,lean:.038+.18*wristWeight,headTilt:look,
        feet,drop:.49,wrist:wristWeight>.01?near:null,grip:wristWeight*.83,handAngle:.23,
        farWrist:!closing&&t<18.85?[parentX-8,332]:null});
      rect(-130,-90,1250,740,grad(202,328,867,309,[[0,rgba("26211f",.14)],[.68,rgba("121c25",0)],[1,rgba("081320",.18)]]));
    });
  }
  function detail(t){
    const u=ease(t,20.8,26.8);
    lens(486,269,1.0+.055*u,-11*u,0,()=>{
      s.doorDetail(t,openAt(t));
      const slide=curve(t,[[21,[213,409]],[24.3,[219,403]],[26.8,[264,367]]]);
      s.bottle(slide[0]+69,slide[1]+4,.75,.15*(1-u));
      svg("M-98 337 Q23 352 111 407 Q155 425 195 417 L"+(slide[0]+53)+" "+(slide[1]+5)+" L"+(slide[0]+47)+" "+(slide[1]-17)+" Q182 379 126 363 L-100 288Z",
        "#735b45","#947659",1.05);
      at(slide[0]+46,slide[1]-12,1,1,-.11,()=>{
        svg("M0 4 Q8 -2 16 .2 Q27 -2 40 6 Q42 11 38 13 Q29 12 24 12 L13 15 0 11Z","#ae8d77","#755e55",.71);
      });
    });
  }

  function macroArm(side,wrist,style,power=1){
    const leftSide=side===1;
    const [x,y]=wrist;
    const body=leftSide?"#775e48":"#46586a";
    const edge=leftSide?"#ad8967":"#738896";
    at(x,y,side,1,0,()=>{
      const angle=leftSide?0:-.08;
      g.rotate(angle);
      svg("M-570 148 C-412 145 -311 94 -234 65 C-206 54 -196 50 -169 44 C-117 30 -62 20 -16 14 L-3 12 Q1 5 -4 -16 L-20 -24 C-68 -23 -115 -16 -175 -10 Q-204 -8 -222 -13 C-309 -17 -424 29 -570 32Z",body,"#2e3842",1.4);
      svg("M-306 61 Q-254 39 -213 31 Q-186 24 -170 15 M-151 12 Q-107 1 -50 -7 L-11 -11",null,rgba(edge.slice(1),.50),1.31);
      svg("M-219 -9 Q-187 8 -199 36 M-213 -3 Q-204 6 -205 19 M-206 41 Q-195 30 -187 27",null,rgba("26303a",.57),1.48);
      svg("M-19 -23 L-3 -19 Q3 -9 1 12 L-14 18 Q-18 4 -19 -23Z",leftSide?"#8b6b50":"#536778","#2b3640",1.1);
      line([[-17,-14],[-13,8]],rgba(edge.slice(1),.55),1.18);
      if(power>.01&&style==="place")
        line([[-62,25],[-44,16]],rgba(edge.slice(1),.34),1.05);
    });
  }
  function macroPalm(wrist,dir,style,closed,front=false){
    const color=style==="mei"?"#b5937d":"#a88772", dim=style==="mei"?"#795f52":"#735b52";
    const opening=1-closed;
    at(wrist[0],wrist[1],dir,1,0,()=>{
      if(!front){
        svg("M-2 -14 Q13 -18 26 -15 Q35 -18 44 -13 L56 -5 Q60 1 54 7 L37 18 Q21 17 15 13 L-4 12Z",color,dim,1.15);
        svg("M7 7 Q19 12 33 10 L44 7 Q38 18 26 17 L13 14Z",rgba(dim.slice(1),.40));
        svg("M13 -7 Q25 -13 30 -13 Q38 -15 44 -11 L55 -7 Q60 -3 55 1 Q48 2 39 -.2 L26 1Z",color,dim,1.04);
      } else {
        for(let j=0;j<4;j++){
          const yy=-9+j*5.7;
          const goal=57.0-3*j+2.9*closed;
          const d=opening*(7.5+j*1.6);
          svg("M25 "+(yy-2)+" Q37 "+(yy-6-d*.55)+" "+goal+" "+(yy-3-d)+" Q"+(goal+6)+" "+(yy-.9-d)+" "+(goal+2)+" "+(yy+2.6-d)+" Q40 "+(yy+2-d*.44)+" 28 "+(yy+4.0)+" Q24 "+(yy+3.1)+" 25 "+(yy-2)+"Z",
              color,dim,.91);
          if(j<3)svg("M"+(goal-7)+" "+(yy-1.2-d)+" L"+(goal-3)+" "+(yy-.65-d),null,rgba("ead0b5",.44),.72);
        }
        svg("M6 -12 Q16 -22 24 -20 Q30 -19 38 -15 Q43 -12 42 -8 Q39 -4 32 -7 L23 -11 Q18 -9 11 -7Z",color,dim,1.13);
        svg("M13 7 Q19 11 25 9",null,rgba(dim.slice(1),.37),.8);
      }
    });
  }
  function handoff(t){
    rect(0,0,W,H,grad(0,5,960,540,[[0,"#24333d"],[.53,"#1b2a38"],[1,"#151e2f"]]));
    poly([[-70,0],[345,0],[386,540],[-70,540]],"#263847");
    poly([[357,0],[403,0],[437,540],[385,540]],"#3d4c51");
    poly([[403,0],[588,0],[632,540],[437,540]],grad(404,40,613,530,[[0,"#162738"],[1,"#213742"]]));
    poly([[588,0],[1010,0],[1010,540],[633,540]],"#273448");
    line([[355,0],[384,540]],"#53666b",1.9);
    line([[587,0],[633,540]],"#516169",1.5);
    line([[603,0],[649,540]],rgba("96a39d",.23),.8);
    box(375,115,36,16,2,"#626d67","#85887a",.9);
    box(590,113,33,17,1,"#566260","#777f72",.9);
    s.chain(405,124,190,1,.72);
    glow(470,288,198,202,"a1aca2",.163);
    glow(417,333,121,234,"c5a17c",.126);
    const bottlePos=curve(t,[[26.8,[345,344]],[28.5,[436,311]],[30.3,[479,284]],
      [31.87,[479,284]],[34.4,[548,321]]]);
    const [x,y]=bottlePos;
    const give=1-ease(t,31.67,32.35), take=ease(t,28.64,30.72);
    const retreat=ease(t,31.67,34.4);
    const leftHand=[x-60-233*retreat,y-20+74*retreat];
    const rightHand=[x+62+286*(1-take),y+22+77*(1-take)];
    macroArm(1,leftHand,"handoff");
    macroArm(-1,rightHand,"handoff");
    macroPalm(leftHand,1,"mei",give,false);
    macroPalm(rightHand,-1,"yu",take,false);
    s.bottle(x,y,2.21,.056*(1-ease(t,29.65,30.80))-.06*ease(t,32.8,34.4));
    macroPalm(leftHand,1,"mei",give,true);
    macroPalm(rightHand,-1,"yu",take,true);
    rect(0,0,W,H,grad(0,0,890,540,[[0,rgba("07111c",.39)],[.45,rgba("07101c",0)],[1,rgba("080f1a",.25)]]));
    return {bottle:bottlePos, give, take, leftHand,rightHand};
  }

  function radioInsert(t){
    const p=ease(t,49.5,54.7);
    lens(463,313,1.88+.09*p,20,-8,()=>{
      radioPlate();
      s.radio(470,367,1.0,t);
      line([[493,387],[508,388],[534,377],[559,380]],rgba("8e9e8f",.37),1.4);
      rect(-98,-83,1156,730,grad(190,107,895,515,[[0,rgba("080f16",.29)],[.6,rgba("06121d",0)],[1,rgba("070d15",.55)]]));
    });
  }
  function stair(t){
    const rows=E.stairSteps.map((k,i)=>[k,s.tread(i+1)]);
    const foot=contacts(t,rows,[54.3,[s.tread(0)[0]-22,450],[s.tread(0)[0]-6,450]],
      {swing:.46,lift:16,stair:true});
    const settle=Math.sin(Math.PI*ease(t,60.58,61.67));
    const low=Math.max(foot[0].p[1],foot[1].p[1]);
    const x=(foot[0].p[0]+foot[1].p[0])*.50+7;
    const baseY=low-5.5;
    const y=baseY+4.0*settle;
    const lean=.100+.245*settle;
    const scaleMan=1.16;
    const grasp=pulse(t,60.45,61.06,61.45,61.94);
    const railX=s.tread(10)[0]+15;
    const hold=[railX,s.railHeight(railX)-1.7];
    const idle=[x+4,y-112];
    const grip=point(idle,hold,grasp);
    const held=[x+25,y-107];
    const focus=0.23*ease(t,56,59.5);
    const zoom=1.0+.115*ease(t,56.2,60.8);
    const d=t-E.slip;
    const shiver=d>=0&&d<=.32?1.1*Math.sin(41*d)*Math.exp(-d*13):0.;
    const dx=mix(18,-36,ease(t,54.7,63.9));
    lens(515,303,zoom,dx,13*focus+shiver,()=>{
      stairPlate();
      s.bottle(held[0]+10,held[1]+10,.39,.075*(1+settle));
      figure("yu",{x,y,t,scale:scaleMan,dir:1,lean,drop:5.4+7.7*settle,feet:foot,
        wrist:grasp>.012?grip:null,farWrist:held,grip:grasp,handAngle:-.27,headTilt:.070*settle,
        step:.77*Math.sin(t*5.23)});
      if(grasp>.75){
        line([[grip[0]+3,grip[1]+3.1],[grip[0]+10.6,grip[1]+2.5]],"#aa8b73",1.05);
      }
      rect(-90,-90,1140,720,grad(190,110,892,512,[[0,rgba("051322",.19)],[.54,rgba("142331",0)],[1,rgba("030d17",.30)]]));
    });
    return {foot,grasp,hold,grip};
  }
  function landing(t){
    const u=ease(t,63.9,71.5);
    const open=pulse(t,67.7,68.9,70.06,71.4);
    const walk=levelWalk(t,"landing"), x=walk.x;
    const move=ease(t,66.69,67.18)*(1-ease(t,68.04,68.40));
    lens(545,311,1.02+.081*u,-10*u,-8,()=>{
      hall11();
      const door=s.door(326,164,204,279,open,false,move,false);
      const body=()=>{
        const hold=[x-17,326], w=point([x-2,323],[door.handle[0]+11,door.handle[1]+1],move);
        s.bottle(hold[0]-8,hold[1]+8,.411,.053*Math.sin(t*2));
        figure("yu",{x,y:walk.y,t,scale:1.229,dir:-1,feet:walk.foot,drop:walk.drop,lean:.067+.073*move,
          wrist:hold,farWrist:move>.01?w:null,grip:.83,handAngle:-.04});
      };
      if(x<=535&&open>.05)clip("M528 153 H1050 V544 H498 V443 H528Z",body);
      else if(x>536||t<68.82)body();
      rect(-100,-90,1200,727,grad(274,93,931,533,[[0,rgba("0b1520",.10)],[.68,rgba("061019",.11)],[1,rgba("010913",.32)]]));
    });
  }
  function table(t){
    rect(0,0,W,H,grad(142,17,891,490,[[0,"#373238"],[.5,"#222c36"],[1,"#182535"]]));
    box(83,34,199,354,3,"#292d37","#3d464a",1.3);
    poly([[30,406],[750,355],[1018,487],[138,564]],grad(236,352,623,529,[[0,"#655145"],[1,"#403837"]]),"#746454",1);
    poly([[138,546],[1018,479],[1018,527],[138,598]],"#3b3232");
    for(let i=0;i<10;i++){
      const yy=405+i*15;
      line([[50+i*9,yy],[928,yy-35+i*4]],rgba("a2836f",.18),.85);
    }
    s.lamp(182,265,1.44);
    glow(240,332,245,154,"e0b178",.174);
    const p=curve(t,[[71.5,[624,260]],[72.05,[584,268]],[73.5,[492,333]],[78.1,[492,333]]]);
    ell(505,395,52,9,rgba("151923",.45*ease(t,72.8,73.5)));
    const close=1-ease(t,73.56,74.21);
    const withdraw=ease(t,73.56,75.41);
    const wrist=[p[0]+53+470*withdraw,p[1]+8+66*withdraw];
    macroArm(-1,wrist,"place",close);
    macroPalm(wrist,-1,"yu",close,false);
    s.bottle(...p,1.77,.095*(1-ease(t,72.4,73.5)));
    macroPalm(wrist,-1,"yu",close,true);
    rect(0,0,W,H,grad(51,37,937,511,[[0,rgba("0b1321",.24)],[.55,rgba("141525",.02)],[1,rgba("07111b",.34)]]));
  }
  function listener(t){
    const u=ease(t,78.1,85.5);
    lens(504,321,1.42+.05*u,-30,-8,()=>{
      radioPlate();
      s.radio(472,366,.97,t);
      const look=pulse(t,78.76,80.05,83.26,85.2);
      figure("uncle",{x:619,y:Y,t,dir:-1,scale:1.277,lean:.041+.18*look,
        drop:.70+.20*Math.sin(t*1.8),headTilt:.12*look,step:.69*look});
      glow(495,307,181,150,"84a28b",.151);
      rect(-130,-95,1230,740,grad(187,99,949,493,[[0,rgba("06121a",.29)],[.6,rgba("09111a",0)],[1,rgba("061219",.41)]]));
    });
  }
  function finalDoor(t){
    lens(727,410,1.46+.17*ease(t,85.5,90),-243,-38,()=>{
      radioPlate();
      glow(727,439,133,30,"d6ba8b",.14+.026*Math.sin(t*1.5));
      line([[667,440],[784,440]],rgba("d3b98e",.81),1.6);
      rect(-115,-90,1200,735,grad(462,153,883,514,[[0,rgba("06101b",.32)],[.65,rgba("081119",.15)],[1,rgba("061017",.38)]]));
    });
  }

  const shots=[
    t=>corridor(t,false),t=>corridor(t,true),t=>room(t),detail,handoff,
    t=>corridor(t,true,true),t=>room(t,true),radioInsert,stair,landing,table,listener,finalDoor
  ];

  function frame(t){
    diagnostics=[];
    g.setTransform(scale,0,0,scale,0,0);
    rect(0,0,W,H,"#0b1420");
    let shot=0;
    while(shot<shots.length-1&&t>=times[shot+1])shot++;
    const extras=shots[shot](t);
    const vignette=g.createRadialGradient(482,271,133,482,271,609);
    vignette.addColorStop(0,rgba("01070e",0));
    vignette.addColorStop(.62,rgba("01070e",.091));
    vignette.addColorStop(1,rgba("01070e",.40));
    rect(0,0,W,H,vignette);
    g.save();g.globalAlpha=.20;
    const wig=Math.floor(t*10);
    at(-(wig%4)*23,-(wig%5)*12,1,1,0,()=>rect(0,0,W+110,H+70,noise));
    g.restore();
    if(t<2.19&&t>.47){
      const a=pulse(t,.47,1.11,1.74,2.16);
      text("隔门一瓶水",84,143,29,rgba("e4e4d4",a),{weight:560});
      line([[86,154],[134,154]],rgba("91a8a9",a*.71),.85);
      text("死寂公寓",85,177,13,rgba("a3b4b3",a),{weight:520});
    }
    const cue=PLAN.voice.find(d=>t>=d.at&&t<Math.min(d.until,PERF.caption_end?.[d.id]??d.until));
    if(cue){
      const end=Math.min(cue.until,PERF.caption_end?.[cue.id]??cue.until);
      const a=pulse(t,cue.at,cue.at+.072,end-.095,end);
      rect(0,470,W,70,grad(0,470,0,539,[[0,rgba("040b15",0)],[.39,rgba("040b15",a*.28)],[1,rgba("040b15",a*.61)]]));
      text(cue.text,480,501,19,rgba("eee9d9",a),{align:"center",weight:470,outline:1.9});
    }
    const fade=(1-ease(t,-.08,.81))+ease(t,88.59,90);
    if(fade>.002)rect(0,0,W,H,rgba("000309",fade));
    return {shot,diagnostics,extras};
  }
  return {frame};
}

function arg(name, fallback){
  const i=process.argv.indexOf(name);
  return i<0?fallback:process.argv[i+1];
}
function stillArgs(){
  const i=process.argv.indexOf("--stills");
  if(i<0)return [];
  const result=[];
  for(let j=i+1;j<process.argv.length&&!process.argv[j].startsWith("--");j++)result.push(Number(process.argv[j]));
  return result;
}
async function renderMovie(canvas,film,fx,start,end,out){
  const process=spawn(fx,["-nostdin","-hide_banner","-loglevel","error","-y","-f","rawvideo","-pix_fmt","rgba",
    "-video_size",canvas.width+"x"+canvas.height,"-framerate",String(FPS),"-i","pipe:0","-an",
    "-vf","scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
    "-color_range","tv","-colorspace","bt709","-color_primaries","bt709","-color_trc","bt709",
    "-c:v","libx264","-preset","veryfast","-crf","17","-threads","6","-movflags","+faststart",out],
    {stdio:["pipe","ignore","inherit"]});
  const done=once(process,"exit");
  async function* frames(){
    const first=sec(start),last=sec(end);
    for(let i=first;i<last;i++){
      film.frame(i/FPS);
      yield canvas.data();
      if((i-first+1)%180===0)console.log(i-first+1+"/"+(last-first)+" frames");
    }
  }
  try{
    await pipeline(Readable.from(frames()),process.stdin);
    const [code]=await done;
    if(code!==0)throw new Error("FFmpeg exit "+code);
  }catch(error){
    if(process.exitCode===null)process.kill();
    throw error;
  }
}

async function main(){
  installFont(arg("--font",null));
  const width=Number(arg("--width","1920"));
  const canvas=createCanvas(width,Math.round(width*9/16)), f=engine(canvas);
  const stills=stillArgs();
  if(stills.length){
    const folder=arg("--image-dir",path.join(__dirname,"stills"));
    fs.mkdirSync(folder,{recursive:true});
    for(const t of stills){
      f.frame(t);
      fs.writeFileSync(path.join(folder,t.toFixed(2)+".jpg"),canvas.toBuffer("image/jpeg",95));
    }
    console.log(stills.length+" stills complete");
  } else if(process.argv.includes("--inspect")){
    const largest={leg:[],arm:[]};
    for(let i=0;i<90*15;i++){
      const t=i/15;
      const data=f.frame(t);
      for(const k of data.diagnostics){
        if(k.error>.1)largest[k.kind].push({t,person:k.person,error:k.error,anchor:k.anchor,target:k.target});
      }
    }
    for(const k of Object.keys(largest)){
      largest[k].sort((a,b)=>b.error-a.error);
      console.log(k,largest[k].length,JSON.stringify(largest[k].slice(0,12)));
    }
  } else {
    const out=arg("--out",path.join(__dirname,"picture.mp4"));
    await renderMovie(canvas,f,arg("--ffmpeg","ffmpeg"),Number(arg("--start",0)),Number(arg("--end",PLAN.duration)),out);
    console.log("Rendered "+path.basename(out));
  }
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={engine,contacts};
