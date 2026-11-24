"use strict";

const fs=require("node:fs");
const path=require("node:path");
const {spawn}=require("node:child_process");
const {once}=require("node:events");
const {Readable}=require("node:stream");
const {pipeline}=require("node:stream/promises");
const {createCanvas,GlobalFonts,loadImage}=require(process.env.APARTMENT_CANVAS||"@napi-rs/canvas");
const {svg}=require("../art.cjs");
const {models}=require("../models.cjs");
const {FPS,posedModel,shots,stage,move,frames,smooth,restOffset}=require("./face.cjs");

const W=960,H=540;
const positions=[
  [514,119,5.94],
  [560,110,6.07],
  [619,131,6.04],
  [402,137,6.22]
];
const bounds=[-34,-9,68,94];
const lines=[
  [1.74,4.14,"我刚才说的时间，你记住了吗？"],
  [4.59,5.43,"我记住了。"],
  [1.04,1.55,"妈妈？"],
  [2.51,3.17,"三天后。"]
];

function font(){
  for(const file of ["C:/Windows/Fonts/msyh.ttc","/System/Library/Fonts/PingFang.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"]){
    if(fs.existsSync(file)&&GlobalFonts.registerFromPath(file,"Reference Film"))return;
  }
}
function box(c,x,y,w,h,fill){
  c.fillStyle=fill;
  c.fillRect(x,y,w,h);
}
function line(c,points,color,width=1){
  c.beginPath(); c.moveTo(...points[0]);
  for(const p of points.slice(1))c.lineTo(...p);
  c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function text(c,value,x,y,size,color,align="left",weight=460){
  c.font=weight+" "+size+'px "Reference Film", "Microsoft YaHei", sans-serif';
  c.fillStyle=color;c.textAlign=align;c.textBaseline="alphabetic";c.fillText(value,x,y);
}
function glow(c,x,y,rx,ry,center){
  c.save();c.translate(x,y);c.scale(rx,ry);
  const g=c.createRadialGradient(0,0,0,0,0,1);
  g.addColorStop(0,center);g.addColorStop(1,"rgba(13,24,39,0)");
  box(c,-1,-1,2,2,g);c.restore();
}
function circle(c,x,y,rx,ry,color){
  c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();
}
function poly(c,points,tone){
  c.beginPath();c.moveTo(...points[0]);
  for(const p of points.slice(1))c.lineTo(...p);
  c.closePath();c.fillStyle=tone;c.fill();
}
function doorway(c,x,y,w,h,gap){
  box(c,x-7,y-7,w+14,h+7,"#2b3a49");
  box(c,x,y,w,h,"#111b28");
  if(gap){
    box(c,x+w-gap,y,gap,h,"#182534");
    box(c,x+w-2,y,2,h,"#637174");
  }
  const leaf=w-gap;
  box(c,x,y,leaf,h,"#253747");
  box(c,x+10,y+14,leaf-21,h*.40,"#223342");
  box(c,x+10,y+h*.59,leaf-21,h*.35,"#223342");
  line(c,[[x+8,y+8],[x+leaf-5,y+8],[x+leaf-5,y+h]],"#3a4e5b",1.1);
  line(c,[[x+13,y+h*.55],[x+leaf-12,y+h*.55]],"#3a4d59",1.1);
  circle(c,x+leaf*.5,y+h*.24,2.7,2.7,"#6e6b5c");
  circle(c,x+leaf*.5,y+h*.24,1.53,1.53,"#19242b");
  const hx=x+leaf-21,hy=y+h*.54;
  box(c,hx,hy-8,6,15,"#635f50");box(c,hx-10,hy,13,3,"#91856b");
}
function backdrop(c,index){
  const shade=c.createLinearGradient(50,0,910,540);
  shade.addColorStop(0,"#162232");
  shade.addColorStop(.61,index===3?"#192832":"#182739");
  shade.addColorStop(1,"#0e1724");
  box(c,0,0,W,H,shade);
  box(c,0,390,960,67,index===3?"#24373a":"#22343e");
  line(c,[[0,391],[960,391]],"#30434d",1.1);
  box(c,0,443,960,97,"#172333");
  line(c,[[0,444],[960,444]],"#3b4d56",1.05);
  glow(c,index===3?591:552,221,397,280,index===3?"rgba(88,122,113,.25)":"rgba(89,113,137,.28)");
  if(index===0){
    doorway(c,379,97,205,348,15);
    box(c,315,134,39,26,"#263744");
    text(c,"09",336,153,13,"#849894","center");
  } else if(index===1||index===2) {
    doorway(c,index===1?294:435,109,index===1?191:151,335,index===1?26:15);
    const x=index===1?175:256;
    glow(c,x,304,198,125,"rgba(187,140,85,.17)");
    poly(c,[[x-19,313],[x-12,288],[x+11,288],[x+22,313]],"#9a825f");
    circle(c,x+1,313,19,2.7,"#b0956a");
    box(c,x,314,2,43,"#65706b");
    box(c,x-22,356,47,4,"#695f53");
    box(c,x-43,359,86,7,"#514943");
    box(c,x-35,366,4,77,"#3d3b39");
    box(c,x+30,366,4,77,"#3d3b39");
  } else {
    box(c,604,174,187,111,"#253a3b");
    box(c,612,181,172,95,"#35534e");
    const wash=c.createLinearGradient(627,182,751,277);
    wash.addColorStop(0,"#405d52");wash.addColorStop(1,"#2c423e");
    box(c,618,187,160,84,wash);
    for(let j=0;j<10;j++)line(c,[[623,194+7*j],[774,194+7*j]],"rgba(147,171,142,.15)",.62);
    glow(c,698,219,183,123,"rgba(116,157,127,.14)");
    box(c,650,284,95,7,"#293d3d");box(c,529,306,344,11,"#463f39");
    box(c,815,250,27,55,"#293941");box(c,819,260,19,7,"#485a54");
    line(c,[[834,251],[838,222]],"#52655c",2.3);
  }
  const edge=c.createRadialGradient(487,265,112,485,278,530);
  edge.addColorStop(0,"rgba(4,9,15,0)");
  edge.addColorStop(1,"rgba(4,9,15,.47)");
  box(c,0,0,W,H,edge);
}
function portraitOnly(part){
  return part.id==="torso"||part.id==="head"||part.id.startsWith("pose-")||
        part.id.endsWith("-arm-upper")||part.id.endsWith("-arm-fore")||part.id.endsWith("-arm-hand");
}

function performer(canvas){
  const scale=canvas.width/W;
  const c=canvas.getContext("2d");
  const plates=shots.map((_,index)=>{
    const image=createCanvas(canvas.width,canvas.height);
    const stage=image.getContext("2d");
    stage.setTransform(scale,0,0,scale,0,0);
    backdrop(stage,index);
    return image;
  });
  const renders=new Map();
  function load(model,view,p){
    const art=posedModel(model,view,p);
    const asset=svg(art,view,{bounds,angles:{head:p.tilt},gear:false,
      pixels:13,keep:portraitOnly});
    if(!renders.has(asset)){
      const img=loadImage(Buffer.from(asset,"utf8"));
      if(renders.size>=250)renders.delete(renders.keys().next().value);
      renders.set(asset,img);
    }
    return renders.get(asset);
  }
  async function paint(frame){
    const {shot,t}=stage(frame);
    const index=shots.indexOf(shot);
    const model=models.find(m=>m.id===shot.id);
    const [x,y,s]=positions[index];
    c.setTransform(1,0,0,1,0,0);
    c.drawImage(plates[index],0,0);
    c.setTransform(scale,0,0,scale,0,0);

    const pose=move(shot,t), img=await load(model,shot.view,pose);
    c.save();c.translate(x,y);c.scale(shot.mirror?-s:s,s);
    c.drawImage(img,...bounds);
    if(pose.tear){
      const p=smooth(pose.tear,0,1),r=smooth(pose.tear,0,.23)*(1-smooth(pose.tear,.84,1));
      const dy=restOffset(model.id,shot.view);
      c.translate(.5,28.7+dy);c.rotate(pose.tilt*Math.PI/180);c.translate(-.5,-28.7);
      c.save();c.globalAlpha=.82*r;
      circle(c,10.44+p*.45,16.40+p*7.2,.28+.08*r,.49+.11*r,"#c2cdca");
      c.restore();
    }
    c.restore();

    box(c,0,0,W,H,"rgba(12,23,37,.075)");
    const shade=c.createLinearGradient(0,458,0,540);
    shade.addColorStop(0,"rgba(3,9,16,0)");shade.addColorStop(1,"rgba(3,9,16,.56)");
    box(c,0,458,W,82,shade);
    text(c,model.name,61,73,23,"#dde0d5","left",540);
    line(c,[[62,84],[91,84]],"#759294",.82);
    text(c,shot.label,62,104,13,"#adc1bd");
    const [on,off,sentence]=lines[index];
    if(t>=on&&t<off)text(c,sentence,480,507,18,"#eae7d8","center",470);
    let fade=0;
    if(index===0)fade=.78*(1-smooth(t,0,.31));
    if(index===3)fade=.74*smooth(t,shot.length-.46,shot.length);
    if(fade>0)box(c,0,0,W,H,"rgba(3,9,15,"+fade+")");
  }
  return paint;
}

function option(name,base=null){
  const i=process.argv.indexOf(name);
  return i===-1?base:process.argv[i+1];
}
async function encode(canvas,paint,ffmpeg,destination){
  const proc=spawn(ffmpeg,["-nostdin","-hide_banner","-loglevel","error","-y","-f","rawvideo",
    "-pix_fmt","rgba","-video_size",canvas.width+"x"+canvas.height,"-framerate",String(FPS),"-i","pipe:0",
    "-an","-vf","scale=out_color_matrix=bt709:out_range=tv,format=yuv420p","-c:v","libx264","-preset","veryfast",
    "-crf","17","-threads","6","-color_range","tv","-colorspace","bt709","-color_primaries","bt709","-color_trc","bt709",
    "-movflags","+faststart",destination],{stdio:["pipe","ignore","inherit"]});
  const done=once(proc,"exit");
  async function* stream(){
    for(let index=0;index<frames;index++){
      await paint(index);yield canvas.data();
      if((index+1)%150===0)console.log((index+1)+"/"+frames+" frames");
    }
  }
  try{
    await pipeline(Readable.from(stream()),proc.stdin);
    const [exit]=await done;
    if(exit!==0)throw new Error("FFmpeg exited "+exit);
  }catch(err){
    if(proc.exitCode===null)proc.kill();
    throw err;
  }
}
async function main(){
  font();
  const width=Number(option("--width","1920"));
  const canvas=createCanvas(width,Math.round(H*width/W)),paint=performer(canvas);
  const still=option("--stills");
  if(still){
    fs.mkdirSync(still,{recursive:true});
    for(const cue of shots){
      for(const [j,t] of [1.06,2.85,5.3].entries()){
        await paint(cue.from+Math.round(t*FPS));
        canvas.savePng(path.join(still,cue.id+"-"+j+".png"));
      }
    }
  }else{
    await encode(canvas,paint,option("--ffmpeg","ffmpeg"),option("--out","reference-expression-preview.mp4"));
    console.log(frames+" frames · "+(frames/FPS).toFixed(2)+"s");
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
