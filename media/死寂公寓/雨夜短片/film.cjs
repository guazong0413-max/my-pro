"use strict";

const fs=require("node:fs");
const path=require("node:path");
const {createCanvas,rect,line,text,grad,ease,pulse}=require("../开篇九十秒/drawing.cjs");
const {renderMovie}=require("../门前的面粉/film.cjs");
const {W,H,frameGrain}=require("./art.cjs");
const room=require("./room.cjs");
const street=require("./street.cjs");
const story=require("./story.json");

function createRenderer(canvas,performance={}){
  const c=canvas.getContext("2d");
  const scale=canvas.width/W;
  const grain=frameGrain(c,createCanvas);
  function lip(t){
    return performance.lips?.[Math.round(t*story.fps)]??0;
  }
  const scenes={
    skyline:(g,t)=>street.skyline(g,t),
    bed:room.bed,
    phone:room.phone,
    wake:(g,t)=>room.portrait(g,t,{lip:lip(t)}),
    feet:room.firstSteps,
    rule:(g,t)=>street.skyline(g,t,true),
    window:street.windowPOV,
    balcony:street.fallScene,
    planter:street.planterScene,
    retreat:room.pullAway,
    listen:(g,t)=>room.portrait(g,t,{after:true,lip:lip(t)}),
    hide:room.hide,
    door:room.door,
    end:g=>rect(g,0,0,W,H,"#070d13")
  };
  return t=>{
    const shot=story.shots.findLast(row=>row.at<=t);
    c.setTransform(scale,0,0,scale,0,0);
    c.globalAlpha=1;
    c.lineCap="round";
    c.lineJoin="round";
    const state=scenes[shot.id](c,t);
    const shade=c.createRadialGradient(484,267,148,481,262,550);
    shade.addColorStop(0,"rgba(8,15,21,0)");
    shade.addColorStop(.65,"rgba(8,15,21,.10)");
    shade.addColorStop(1,"rgba(8,15,21,.41)");
    rect(c,0,0,W,H,shade);
    c.globalAlpha=.31;
    rect(c,0,0,W,H,grain);
    c.globalAlpha=1;

    if(shot.id==="skyline"){
      c.globalAlpha=pulse(.57,1.53,4.62,5.31,t);
      line(c,[[66,56],[96,56]],"#ac8e73",1.1);
      text(c,"死寂公寓",65,98,29,"#d5d5cc","left",true);
      text(c,"第一夜",67,126,13,"#abb7b7");
      text(c,"02:17",883,92,17,"#b5bfbd","right");
      c.globalAlpha=1;
    }
    if(shot.id==="hide"){
      c.globalAlpha=pulse(69.32,70.23,78.60,80.94,t);
      rect(c,38,226,470,142,grad(c,37,241,508,241,[[0,"rgba(13,23,31,.83)"],[1,"rgba(13,23,31,0)"]]));
      line(c,[[61,244],[61,340]],"#ad7d69",2.1);
      text(c,"先藏好自己",78,294,34,"#deded2","left",true);
      c.globalAlpha=1;
    }
    if(shot.id==="end"){
      c.globalAlpha=pulse(88.30,88.79,89.50,89.98,t);
      text(c,"第一夜",W/2,272,21,"#afb7b4","center");
      c.globalAlpha=1;
    }
    const subtitle=performance.subs?.find(([a,b])=>t>=a&&t<b);
    if(subtitle){
      const [a,b,words]=subtitle;
      c.globalAlpha=pulse(a,a+.067,b-.087,b,t);
      rect(c,0,464,W,76,grad(c,0,464,0,H,[[0,"rgba(8,15,21,0)"],[1,"rgba(8,15,21,.63)"]]));
      c.font='19.5px "FilmSans", "Microsoft YaHei", sans-serif';
      c.textAlign="center";
      c.textBaseline="alphabetic";
      c.strokeStyle="#141c24";
      c.lineWidth=3.25;
      c.strokeText(words,W/2,511);
      c.fillStyle="#e0ded7";
      c.fillText(words,W/2,511);
      c.globalAlpha=1;
    }
    const fade=1-ease(0,.64,t);
    if(fade>0)rect(c,0,0,W,H,"rgba(6,11,16,"+fade+")");
    return {id:shot.id,state};
  };
}

function argument(name,fallback){
  const i=process.argv.indexOf(name);
  return i<0?fallback:process.argv[i+1];
}

async function main(){
  const width=Number(argument("--width","1920"));
  const canvas=createCanvas(width,Math.round(width*H/W));
  const marks=argument("--performance",path.join(__dirname,"performance.json"));
  const samples=argument("--stills",null);
  const performance=samples && !fs.existsSync(marks)?{}:JSON.parse(fs.readFileSync(marks,"utf8"));
  const draw=createRenderer(canvas,performance);
  if(samples){
    const output=argument("--still-dir",path.join(__dirname,"stills"));
    fs.mkdirSync(output,{recursive:true});
    for(const t of samples.split(",").map(Number)){
      draw(t);
      fs.writeFileSync(path.join(output,t.toFixed(2)+".jpg"),canvas.toBuffer("image/jpeg",94));
    }
    return;
  }
  const audio=argument("--audio",path.join(__dirname,"同步混音.wav"));
  const output=argument("--out",path.join(__dirname,"死寂公寓-雨夜短片.mp4"));
  await renderMovie(canvas,draw,audio,output,story);
}

if(require.main===module)main().catch(err=>{console.error(err);process.exitCode=1;});
module.exports={createRenderer};
