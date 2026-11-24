"use strict";
const fs=require("node:fs");
const path=require("node:path");
const {spawn}=require("node:child_process");
const {once}=require("node:events");
const {Readable}=require("node:stream");
const {pipeline}=require("node:stream/promises");
const {W,H,createCanvas,painter,clamp,ease,mix,rgba,seeded,installFont}=require("./draw.cjs");
const {rooms}=require("./sets.cjs");
const {cast,point}=require("./character.cjs");
const {fittings}=require("./props.cjs");

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
    if(stair&&last===E.slip) p[0]-=8.6*ease(t,last,last+.19);
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
  const b=painter(canvas), s=rooms(b), c=cast(b), props=fittings(b);
  const {g,path:svg,rect,box,poly,line,ell,grad,glow,text,at,lens,clip}=b;
  const hall9=s.plate(p=>p.hall("09")), inner=s.plate(p=>p.inside()), hall11=s.plate(p=>p.hall("11"));
  const stairPlate=s.plate(p=>p.stairs()), radioPlate=s.plate(p=>p.radioRoom());
  const scale=canvas.width/W;
  const Y=444;
  const mouth=(name,t)=>{
    const marks=PERF.mouth?.[name];
    if(!marks)return 0;
    const f=Math.floor(sec(t)/3)*3;
    return Math.max(marks[f]||0,marks[f+1]||0,marks[f+2]||0);
  };
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
  const openAt=t=>pulse(t,E.chain[0],E.chainTaut,46.83,E.doorClose);
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
      const bottlePos=[w[0]-8,w[1]+6];
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
  function yuFace(t){
    const u=ease(t,9.24,14.3);
    lens(579,258,2.17+.075*u,18,22,()=>{
      hall9();
      s.door(342,162,174,281,0,false,0);
      const walk=levelWalk(t,"arrival");
      figure("yu",{x:579,y:Y,t,front:true,dir:1,scale:1.275,drop:.35,feet:walk.foot,
        lean:-.02,headTilt:-.028+.058*pulse(t,10.9,11.43,12.8,13.6)});
      rect(-95,-90,1160,730,grad(231,134,800,384,[[0,rgba("0a1420",.24)],[.55,rgba("0b1321",.035)],[1,rgba("091321",.24)]]));
    });
  }
  function room(t,closing=false){
    const u=closing?ease(t,43,49.5):ease(t,14.3,20.8);
    lens(497,297,(closing?1.41:1.26)+.044*u,closing?38:0,closing?-21:0,()=>{
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
      figure("son",{x:421,y:Y,t,scale:.858,dir:1,lean:.023,drop:.37,headTilt:-.08-.103*pulse(t,14.7,15.17,16.28,17.12)});
      const footLift=4.5*Math.sin(forward*Math.PI)+5.2*Math.sin(back*Math.PI);
      const feet=[{p:[503,Y],ground:Y},{p:[521+37*shift,Y-footLift],ground:Y}];
      if(!closing&&t<20.8)s.bottle(parentX-2,339,.432,-.055);
      figure("mei",{x:parentX,y:Y,t,scale:1.19,dir:1,lean:.038+.18*wristWeight,headTilt:look,
        feet,drop:.49,wrist:wristWeight>.01?near:null,grip:wristWeight*.83,handAngle:.23,
        farWrist:!closing?[parentX-7,331]:null});
      rect(-130,-90,1250,740,grad(202,328,867,309,[[0,rgba("26211f",.14)],[.68,rgba("121c25",0)],[1,rgba("081320",.18)]]));
    });
  }
  function detail(t){
    const u=ease(t,20.8,26.8);
    let hardware;
    lens(484,264,1.36+.033*u,-10*u,0,()=>{
      hardware=props.doorGap(openAt(t),184,.13);
      const [x,y]=curve(t,[[20.8,[224,423]],[23.6,[243,414]],[26.8,[351,346]]]);
      const wrist=[x-40,y-14];
      props.sleeve(wrist,1,"mei",.71);
      props.closeHand(wrist,1,"mei",1,false,.71);
      s.bottle(x,y,1.35,0);
      props.closeHand(wrist,1,"mei",1,true,.71);
    });
    return {hardware};
  }

  function handoff(t){
    let hardware;
    const gripStart=E.plastic[0],releaseStart=E.handOff;
    const planted=[478,292];
    const bottle=curve(t,[[26.8,[351,346]],[28.47,planted],[32.43,planted],[34.4,[558,321]]]);
    const [x,y]=bottle;
    const take=ease(t,gripStart-.13,gripStart+.13);
    const reach=ease(t,28.84,gripStart);
    const give=1-ease(t,releaseStart,releaseStart+.42);
    const back=ease(t,releaseStart+.10,33.6);
    const left=[Math.min(x,planted[0])-56-232*back,y-26+76*back];
    const right=[x+56+367*(1-reach),y+26+52*(1-reach)];
    const push=ease(t,26.8,29.75);
    lens(480,264,1.32+.30*push,0,12,()=>{
      hardware=props.doorGap(1,136,.17);
      props.sleeve(left,1,"mei");
      props.sleeve(right,-1,"yu");
      props.closeHand(left,1,"mei",give);
      props.closeHand(right,-1,"yu",take);
      s.bottle(x,y,1.94,0);
      props.closeHand(left,1,"mei",give,true);
      props.closeHand(right,-1,"yu",take,true);
      rect(0,0,W,H,grad(0,0,890,540,[[0,rgba("07111c",.27)],[.45,rgba("07101c",0)],[1,rgba("080f1a",.19)]]));
    });
    return {bottle, give, take, leftHand:left, rightHand:right, hardware};
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
    const settle=Math.sin(Math.PI*ease(t,E.slip-.025,61.7));
    const low=Math.max(foot[0].p[1],foot[1].p[1]);
    const x=(foot[0].p[0]+foot[1].p[0])*.50+7-3.7*pulse(t,E.slip,60.88,61.18,61.57);
    const baseY=low-5.5;
    const y=baseY+4.0*settle;
    const lean=.095+.302*settle;
    const scaleMan=1.16;
    const grasp=pulse(t,E.slip-.07,E.rail,61.36,61.67);
    const railX=s.tread(10)[0]+31;
    const hold=[railX-2.6,s.railHeight(railX)-.4];
    const held=[x+25,y-107];
    const focus=0.23*ease(t,56,59.5);
    const catchShot=pulse(t,59.83,60.63,61.52,62.32);
    const zoom=1+.115*ease(t,56.2,60.8)+.166*catchShot;
    const d=t-E.slip;
    const shiver=d>=0&&d<=.32?1.1*Math.sin(41*d)*Math.exp(-d*13):0.;
    const dx=mix(18,-36,ease(t,54.7,63.9));
    lens(mix(515,620,catchShot),mix(303,273,catchShot),zoom,dx-42*catchShot,13*focus+shiver,()=>{
      stairPlate();
      s.bottle(held[0]+5.5,held[1]+9,.39,.075*(1+settle));
      figure("yu",{x,y,t,scale:scaleMan,dir:1,lean,drop:4.2+9.75*settle,feet:foot,
        wrist:hold,wristBlend:grasp,farWrist:held,handAngle:-.27,headTilt:.070*settle,
        step:.77*Math.sin(t*5.23)});
      rect(-90,-90,1140,720,grad(190,110,892,512,[[0,rgba("051322",.19)],[.54,rgba("142331",0)],[1,rgba("030d17",.30)]]));
    });
    return {foot,grasp,hold};
  }
  function landing(t){
    const u=ease(t,63.9,71.5);
    const open=pulse(t,E.latch[1],69.26,70.06,71.4);
    const walk=levelWalk(t,"landing"), x=walk.x;
    const move=pulse(t,67.6,68.76,68.98,69.33);
    lens(545,311,1.02+.081*u,-10*u,-8,()=>{
      hall11();
      const door=s.door(326,164,204,279,open,false,move,false);
      const body=()=>{
        const hold=[x-17,326], w=point([x-2,323],[door.handle[0]+11,door.handle[1]+1],move);
        s.bottle(hold[0]-6.4,hold[1]+8,.411,.053*Math.sin(t*2));
        figure("yu",{x,y:walk.y,t,scale:1.229,dir:-1,feet:walk.foot,drop:walk.drop,lean:.067+.073*move,
          wrist:hold,farWrist:move>.01?w:null,grip:.83,handAngle:-.04});
      };
      if(x<=535&&open>.05)clip("M528 153 H1050 V544 H498 V443 H528Z",body);
      else if(x>536||t<68.82)body();
      rect(-100,-90,1200,727,grad(274,93,931,533,[[0,rgba("0b1520",.10)],[.68,rgba("061019",.11)],[1,rgba("010913",.32)]]));
    });
  }
  function table(t){
    lens(499,301,1.42,0,3,()=>{
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
      const seat=E.table;
      const p=curve(t,[[71.5,[624,246]],[72.06,[581,269]],[seat,[492,333]]]);
      ell(495,396,44,8,rgba("151923",.46*ease(t,72.7,seat)));
      const closed=1-ease(t,seat+.08,seat+.51);
      const withdraw=ease(t,seat+.19,75.1);
      const wrist=[p[0]+51+466*withdraw,p[1]+9+52*withdraw];
      props.sleeve(wrist,-1,"yu",.91);
      props.closeHand(wrist,-1,"yu",closed,false,.91);
      s.bottle(...p,1.77,0);
      props.closeHand(wrist,-1,"yu",closed,true,.91);
      rect(-100,-110,1200,780,grad(51,37,937,511,[[0,rgba("0b1321",.24)],[.55,rgba("141525",.02)],[1,rgba("07111b",.34)]]));
    });
  }
  function listener(t){
    const u=ease(t,78.1,85.5);
    lens(504,321,1.66+.05*u,-26,-4,()=>{
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
    t=>corridor(t,false),t=>corridor(t,true),yuFace,t=>room(t),detail,handoff,
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
    g.save();g.globalAlpha=.095;
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
      text(cue.text,480,501,21,rgba("eee9d9",a),{align:"center",weight:550,outline:2.0});
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
