"use strict";
const fs=require("node:fs");
const p=require("node:path");
const {createCanvas,rect,round,text,grad,ease,vignette}=require("./visual.cjs");
const {street,court}=require("./street.cjs");
const {roomScene}=require("./room.cjs");
const {phone}=require("./phone.cjs");
const {renderMovie}=require("../门前的面粉/film.cjs");
const story=require("./story.json");
function renderer(canvas){
  const c=canvas.getContext("2d"),scale=canvas.width/960;
  const marks=fs.existsSync(p.join(__dirname,"performance.json"))?require("./performance.json"):null;
  return t=>{
    c.setTransform(scale,0,0,scale,0,0);c.globalAlpha=1;c.lineCap="round";c.lineJoin="round";
    rect(c,0,0,960,540,"#24333d");
    const shot=story.shots.filter(s=>t>=s.at).at(-1).id;
    if(shot==="block"||shot==="patrol")street(c,t,shot);
    else if(shot==="office"||shot==="cross"||shot==="reaction")roomScene(c,t,shot);
    else if(shot==="look"||shot==="entry"||shot==="endwindow")court(c,t,shot);
    else phone(c,t,shot);
    vignette(c,shot==="message"||shot==="warning"?.16:.29);
    const row=story.lines.find(r=>r.role==="hero"&&t>=r.at&&t<(marks?.ends[r.id]??r.at+1.6)+.09);
    if(row){
      const width=38+row.text.length*19;round(c,480-width/2,472,width,38,6,"rgba(27,35,38,.73)");
      text(c,row.text,480,498,19,"#f3ede0","center");
    }
    const fade=Math.max(1-ease(0,.43,t),ease(52.28,52.98,t));
    if(fade>0)rect(c,0,0,960,540,"rgba(15,25,33,"+fade+")");
  };
}
function arg(name,fallback){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:fallback;}
async function main(){
  const width=Number(arg("--width","1920")),canvas=createCanvas(width,Math.round(width*9/16)),draw=renderer(canvas);
  if(process.argv.includes("--stills")){
    const dir=arg("--dir",__dirname);fs.mkdirSync(dir,{recursive:true});
    for(const t of arg("--stills","1").split(",").map(Number)){draw(t);fs.writeFileSync(p.join(dir,t.toFixed(2)+".jpg"),canvas.toBuffer("image/jpeg",92));}
  }else await renderMovie(canvas,draw,p.join(__dirname,"同步混音.wav"),arg("--out",p.join(__dirname,"今晚发我.mp4")),story);
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={renderer};
