"use strict";

const fs=require("node:fs");
const nodePath=require("node:path");
const {spawn}=require("node:child_process");
const {once}=require("node:events");
const {Readable}=require("node:stream");
const {pipeline}=require("node:stream/promises");
const {createCanvas,rect,round,line,text,grad,ease,pulse,rand}=require("../开篇九十秒/drawing.cjs");
const {W,H,story}=require("./art.cjs");
const {scenes,setPerformance}=require("./scenes.cjs");
const {verifyDirection}=require("./blocking.cjs");

function optionalJSON(file){
  return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,"utf8")):{};
}
function createRenderer(canvas,performance=optionalJSON(nodePath.join(__dirname,"performance.json"))){
  const c=canvas.getContext("2d");
  const scale=canvas.width/W;
  setPerformance(performance);
  const tile=createCanvas(113,111), grain=tile.getContext("2d");
  for(let i=0;i<365;i++){
    grain.fillStyle=i%3?"rgba(25,32,39,.067)":"rgba(222,214,194,.071)";
    const q=.23+.77*rand(i+217);
    grain.fillRect(rand(i+471)*113,rand(i+210)*111,q,q);
  }
  const texture=c.createPattern(tile,"repeat");
  return t=>{
    c.setTransform(scale,0,0,scale,0,0);
    c.globalAlpha=1;
    c.lineCap="round";c.lineJoin="round";
    rect(c,0,0,W,H,"#18232d");
    let index=0;
    while(index+1<scenes.length && t>=story.cuts[index+1])index++;
    const scene=scenes[index](c,t);
    const {actors,blocking}=Array.isArray(scene)?{actors:scene}:scene;
    verifyDirection(index,t,blocking);
    c.globalAlpha=.29;rect(c,0,0,W,H,texture);c.globalAlpha=1;
    const vignette=c.createRadialGradient(243,134,83,243,134,316);
    vignette.addColorStop(0,"rgba(9,16,25,0)");
    vignette.addColorStop(.68,"rgba(9,16,25,.055)");
    vignette.addColorStop(1,"rgba(9,16,25,.33)");
    rect(c,0,0,W,H,vignette);

    const title=pulse(.24,.84,3.95,4.82,t);
    if(title>0){
      c.globalAlpha=title;
      rect(c,0,0,226,96,grad(c,0,17,210,79,[[0,"rgba(11,20,29,.81)"],[1,"rgba(11,20,29,0)"]]));
      text(c,"死寂公寓",30,31,7.7,"#b2bdba","left",true);
      text(c,story.title,29,53,17.6,"#eee6d4","left",true);
      line(c,[[31,62],[59,62]],"#b5a48a",.9);
      c.globalAlpha=1;
    }

    const timestamp=t>=39.55&&t<43.75?"07:30":t>=81.92&&t<84.37?"07:38":"";
    if(timestamp){
      const morning=timestamp==="07:30";
      const q=morning?pulse(39.58,39.94,43.24,43.75,t):pulse(81.94,82.11,83.92,84.37,t);
      const x=morning?298:24;
      c.globalAlpha=q;
      round(c,x,20,55,21,2.1,morning?"#344b52":"#603c3b");
      text(c,timestamp,x+27.5,35,11.4,"#e6dbc8","center",true);
      c.globalAlpha=1;
    }

    const active=(performance.subs??[]).find(row=>t>=row[0]&&t<row[1]);
    if(active){
      const [at,end,words]=active;
      const q=pulse(at,at+.07,end-.082,end,t);
      c.globalAlpha=q;
      rect(c,0,223,W,47,grad(c,0,227,0,H,[[0,"rgba(9,17,24,0)"],[.57,"rgba(9,17,24,.41)"],[1,"rgba(9,17,24,.65)"]]));
      c.font='bold 10.5px "FilmBold", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
      c.textAlign="center";
      c.textBaseline="alphabetic";
      c.lineWidth=1.55;c.strokeStyle="#1c262c";
      c.strokeText(words,W/2,251.5);
      c.fillStyle="#f4ebd8";c.fillText(words,W/2,251.5);
      c.globalAlpha=1;
    }
    const fade=Math.max(1-ease(0,.56,t),ease(89.53,90,t));
    if(fade>0)rect(c,0,0,W,H,"rgba(10,16,24,"+fade+")");
    return {index,actors,blocking};
  };
}
function argument(name,fallback){
  const i=process.argv.indexOf(name);
  return i<0?fallback:process.argv[i+1];
}
async function renderMovie(canvas,draw,audio,dest,{fps=story.fps,duration=story.duration}={}){
  const tool=process.env.FFMPEG||"ffmpeg";
  const child=spawn(tool,[
    "-hide_banner","-loglevel","error","-nostdin","-y","-f","rawvideo","-pixel_format","rgba",
    "-video_size",canvas.width+"x"+canvas.height,"-framerate",String(fps),"-i","pipe:0","-i",audio,
    "-map","0:v:0","-map","1:a:0","-vf","scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
    "-colorspace","bt709","-color_primaries","bt709","-color_trc","bt709","-color_range","tv",
    "-c:v","libx264","-preset","veryfast","-crf","17","-threads","6","-c:a","aac","-b:a","192k",
    "-ar","48000","-t",String(duration),"-movflags","+faststart",dest
  ],{stdio:["pipe","ignore","inherit"]});
  const stream=once(child,"exit");
  const last=Math.round(duration*fps);
  async function* images(){
    for(let i=0;i<last;i++){
      draw(i/fps);
      yield canvas.data();
      if((i+1)%300===0)console.log((i+1)+"/"+last+" frames");
    }
  }
  try{
    const [[code]]=await Promise.all([stream,pipeline(Readable.from(images()),child.stdin)]);
    if(code!==0)throw Error("FFmpeg exit "+code);
  }catch(error){
    if(child.exitCode===null)child.kill();
    throw error;
  }
  console.log(dest);
}
async function main(){
  const width=Number(argument("--width","1920"));
  const canvas=createCanvas(width,Math.round(width*9/16));
  const performance=argument("--performance",nodePath.join(__dirname,"performance.json"));
  const draw=createRenderer(canvas,optionalJSON(performance));
  const stills=argument("--stills",null);
  if(stills){
    const dest=argument("--still-dir",nodePath.join(__dirname,"stills"));
    fs.mkdirSync(dest,{recursive:true});
    for(const t of stills.split(",").map(Number)){
      draw(t);
      fs.writeFileSync(nodePath.join(dest,t.toFixed(2)+".jpg"),canvas.toBuffer("image/jpeg",94));
    }
    console.log("Stills complete");
    return;
  }
  const audio=argument("--audio",nodePath.join(__dirname,"同步混音.wav"));
  const dest=argument("--out",nodePath.join(__dirname,"死寂公寓-门前的面粉.mp4"));
  await renderMovie(canvas,draw,audio,dest);
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={createRenderer,renderMovie};
