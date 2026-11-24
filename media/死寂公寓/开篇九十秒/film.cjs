"use strict";
const fs=require("node:fs");
const path=require("node:path");
const {spawn}=require("node:child_process");
const {once}=require("node:events");
const {Readable}=require("node:stream");
const {pipeline}=require("node:stream/promises");
const {createCanvas,rect,grad,ease,rand}=require("./drawing.cjs");
const day=require("./day.cjs"),night=require("./night.cjs");
const story=require("./story.json");
function engine(canvas,performance){
  const c=canvas.getContext("2d"),scale=canvas.width/960;
  const shots=[
    [0,day.exterior],[8.12,day.windowScene],[11.82,day.street],[16.02,day.tub],
    [19.96,day.pantry],[24.54,(c,t)=>day.ledger(c,t,false)],[27.91,day.tankWide],
    [30.18,day.dipper],[33.08,day.lidHands],[36.77,night.stair],[41.84,night.mute],
    [45.70,night.section],[49.86,(c,t)=>day.ledger(c,t,true)],[55.76,night.curtain],
    [59.55,night.loneWindow],[64.05,(c,t)=>night.nearDoor(c,t,1.015+.045*ease(64.05,69.76,t))],
    [69.73,(c,t)=>night.listeningDoor(c,t,performance.knocks)],[75.00,night.listenFace],
    [83.41,(c,t)=>night.peephole(c,t,performance.neighborLip[Math.floor((t-85)*10)*3+1]||0)]
  ];
  const tex=createCanvas(137,119),tc=tex.getContext("2d");
  for(let i=0;i<1250;i++){
    const a=rand(i+14)*.18+.04;tc.fillStyle=i%2?"rgba(250,240,216,"+a+")":"rgba(36,46,52,"+a+")";
    tc.fillRect(rand(i+335)*137,rand(i+97)*119,.55+rand(i+13),.55+rand(i+7));
  }
  const grain=c.createPattern(tex,"repeat");
  function frame(index){
    const t=index/story.fps;c.setTransform(scale,0,0,scale,0,0);c.globalAlpha=1;c.lineCap="round";c.lineJoin="round";
    rect(c,0,0,960,540,"#243041");
    let ix=0;while(ix+1<shots.length&&t>=shots[ix+1][0])ix++;
    c.save();shots[ix][1](c,t);c.restore();
    if((t>=36.77&&t<49.86)||t>=55.76){
      const tint=t>=83.41?.10:t>=59.55&&t<64.05?.04:.16;
      rect(c,0,0,960,540,"rgba(16,26,43,"+tint+")");
    }
    c.save();c.globalAlpha=.21;rect(c,0,0,960,540,grain);c.restore();
    const sub=performance.subs.find(([a,b])=>t>=a&&t<b);
    if(sub){
      const [a,b,caption]=sub,k=Math.max(.52,Math.min(1,(t-a)*17,(b-t)*20));
      c.save();c.globalAlpha=k;
      rect(c,0,465,960,75,grad(c,0,465,0,540,[[0,"rgba(17,23,32,0)"],[1,"rgba(15,20,29,.43)"]]));
      c.font='bold 23px "FilmBold", "FilmSans", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
      c.textAlign="center";c.textBaseline="alphabetic";c.strokeStyle="rgba(22,28,35,.85)";c.lineWidth=3.35;
      c.strokeText(caption,480,507);c.fillStyle="#f1eedf";c.fillText(caption,480,507);c.restore();
    }
  }
  return frame;
}
function arg(k,alt){const i=process.argv.indexOf(k);return i<0?alt:process.argv[i+1];}
async function main(){
  const width=Number(arg("--width",1920)),h=Math.round(width*9/16);
  const canvas=createCanvas(width,h),performance=JSON.parse(fs.readFileSync(arg("--performance",path.join(__dirname,"performance.json")),"utf8"));
  const draw=engine(canvas,performance);
  const stills=arg("--stills","");
  if(stills){
    const dir=arg("--dir","stills");fs.mkdirSync(dir,{recursive:true});
    for(const val of stills.split(",")){const t=Number(val);draw(Math.round(t*30));fs.writeFileSync(path.join(dir,t.toFixed(2)+".jpg"),canvas.toBuffer("image/jpeg",93));}
    return;
  }
  const dest=arg("--out","opening.mp4"),audio=arg("--audio","mix.wav");
  const child=spawn(process.env.FFMPEG||"ffmpeg",["-hide_banner","-loglevel","error","-nostdin","-y","-f","rawvideo","-pixel_format","rgba","-video_size",width+"x"+h,"-framerate","30","-i","pipe:0","-i",audio,"-map","0:v:0","-map","1:a:0","-vf","scale=out_color_matrix=bt709:out_range=tv,format=yuv420p","-colorspace","bt709","-color_primaries","bt709","-color_trc","bt709","-color_range","tv","-c:v","libx264","-preset","veryfast","-crf","17","-threads","6","-c:a","aac","-b:a","192k","-ar","48000","-t","90","-movflags","+faststart",dest],{stdio:["pipe","ignore","inherit"]});
  const ex=once(child,"exit");
  async function* raw(){
    for(let i=0;i<story.duration*story.fps;i++){
      draw(i);yield canvas.data();if((i+1)%450===0)console.log((i+1)/30+"s");
    }
  }
  try{await pipeline(Readable.from(raw()),child.stdin);const [code]=await ex;if(code!==0)throw new Error("FFmpeg exit "+code);}
  catch(e){if(child.exitCode===null)child.kill();throw e;}
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={engine};
