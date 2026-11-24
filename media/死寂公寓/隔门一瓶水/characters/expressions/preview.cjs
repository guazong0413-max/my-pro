"use strict";

const fs=require("node:fs");
const path=require("node:path");
const {spawn}=require("node:child_process");
const {once}=require("node:events");
const {Readable}=require("node:stream");
const {pipeline}=require("node:stream/promises");
const {createCanvas,Path2D,GlobalFonts}=require(process.env.APARTMENT_CANVAS||"@napi-rs/canvas");
const {models}=require("../models.cjs");
const {faceParts}=require("./face.cjs");
const {FPS,chapters,totalFrames,atFrame,performance,clamp}=require("./moves.cjs");

const W=1920,H=1080;
const paper="#e0e5dc",secondary="#a5b6b6",accent="#d8bd94";
const columnWidth=437, left=82, height=394;
const rows=[["front","正面",181],["side","侧面",638]];
function fonts(preferred){
  for(const font of [preferred,"C:/Windows/Fonts/msyh.ttc","/System/Library/Fonts/PingFang.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"]){
    if(font&&fs.existsSync(font)&&GlobalFonts.registerFromPath(font,"Apartment Face Review")) return;
  }
  if(preferred)throw new Error("Could not load the requested Chinese font.");
}
function fill(c,x,y,w,h,ink){
  c.fillStyle=ink;c.fillRect(x,y,w,h);
}
function line(c,x,y,ex,ey,ink,weight=1){
  c.beginPath();c.moveTo(x,y);c.lineTo(ex,ey);c.strokeStyle=ink;c.lineWidth=weight;c.stroke();
}
function text(c,value,x,y,size,ink=paper,align="left",weight=450){
  c.font=weight+" "+size+'px "Apartment Face Review", "Microsoft YaHei", sans-serif';
  c.fillStyle=ink;c.textAlign=align;c.textBaseline="alphabetic";c.fillText(value,x,y);
}
function gel(c,x,y,rx,ry,ink){
  c.save();c.translate(x,y);c.scale(rx,ry);
  const base=c.createRadialGradient(0,0,0,0,0,1);
  base.addColorStop(0,ink);base.addColorStop(1,"rgba(10,18,26,0)");
  fill(c,-1,-1,2,2,base);c.restore();
}
function paintBackground(c,scale){
  c.setTransform(scale,0,0,scale,0,0);
  const ground=c.createLinearGradient(0,0,W,H);
  ground.addColorStop(0,"#1b2a37");ground.addColorStop(.52,"#152330");ground.addColorStop(1,"#101b27");
  fill(c,0,0,W,H,ground);
  text(c,"死寂公寓",82,64,34,paper,"left",540);
  text(c,"表情动画",83,101,19,secondary);
  line(c,82,125,1830,125,"#475d69",1.25);
  for(const [i,m] of models.entries()){
    const x=left+i*columnWidth,cx=x+columnWidth/2;
    text(c,m.name,cx,160,25,paper,"center",510);
    if(i)line(c,x,170,x,1032,"#334653",.93);
    for(const [, , top] of rows){
      gel(c,cx,top+height*.56,204,218,i===1?"#35404a":"#2b4255");
      line(c,x+41,top+height,x+columnWidth-41,top+height,"#435968",.88);
    }
  }
  for(const [, name, top] of rows){
    text(c,name,38,top+46,20,secondary);
    line(c,45,top+60,63,top+60,"#647884");
  }
  line(c,83,615,1829,615,"#475d69",1.05);
}
function makePainter(){
  const cache=new Map();
  function draw(c,s){
    if(s.tag==="g"){
      const match=/translate\(([^ ]+) ([^)]+)\)/.exec(s.transform);
      if(match){
        c.save();c.translate(Number(match[1]),Number(match[2]));
        if(s.transform.includes("scale(-1 1)"))c.scale(-1,1);
      }
      for(const item of s.items)draw(c,item);
      if(match)c.restore();
      return;
    }
    let p;
    if(s.tag==="path"){
      p=cache.get(s.d);
      if(!p){
        p=new Path2D(s.d);
        if(cache.size<1309)cache.set(s.d,p);
      }
    }else{
      p=new Path2D();
      if(s.tag==="ellipse")p.ellipse(s.cx,s.cy,s.rx,s.ry,0,0,Math.PI*2);
      else p.roundRect(s.x,s.y,s.width,s.height,s.rx||0);
    }
    if(s.fill&&s.fill!=="none"){c.fillStyle=s.fill;c.fill(p);}
    if(s.stroke){c.lineWidth=s.sw??s.width;c.strokeStyle=s.stroke;c.stroke(p);}
  }
  return function(c,items){
    c.lineCap="round";c.lineJoin="round";
    for(const item of items)draw(c,item);
  };
}
function renderer(canvas){
  const scale=canvas.width/W;
  const backdrop=createCanvas(canvas.width,canvas.height);
  paintBackground(backdrop.getContext("2d"),scale);
  const c=canvas.getContext("2d"), paint=makePainter();
  const bodies=models.map(model=>rows.map(([view])=>{
    const head=model.views[view].layers.find(layer=>layer.id==="head");
    const torso=model.views[view].layers.filter(layer=>layer.id==="torso"||layer.id.endsWith("-arm-upper"));
    return {pivot:head.pivot,torso:torso.flatMap(layer=>layer.items)};
  }));
  function portrait(i,j,time,pose){
    const model=models[i];
    const [view,,top]=rows[j],x=left+i*columnWidth,cx=x+columnWidth/2;
    const {pivot,torso}=bodies[i][j];
    const size=8.34;
    const modelY=top+66+pose.breathe*size;
    c.save();
    c.beginPath();c.rect(x+17,top,columnWidth-34,height-.3);c.clip();
    c.translate(cx-(view==="side"?12:0),modelY);
    c.scale(size,size);
    paint(c,torso);
    c.translate(pivot[0],pivot[1]);
    c.rotate(pose.tilt*Math.PI/180);
    c.translate(-pivot[0],-pivot[1]);
    const parts=faceParts(model,view,pose);
    paint(c,parts.base);paint(c,parts.brow);paint(c,parts.eyes);paint(c,parts.lips);
    c.restore();
  }
  function frame(index){
    c.setTransform(1,0,0,1,0,0);
    c.drawImage(backdrop,0,0);
    c.setTransform(scale,0,0,scale,0,0);
    const {current,t}=atFrame(index);
    const time=index/FPS;
    const titleOpacity=.72+.28*clamp(t/.21);
    c.save();c.globalAlpha=titleOpacity;
    text(c,current.label,W/2,87,44,accent,"center",530);
    c.restore();
    for(let i=0;i<models.length;i++){
      const pose=performance(models[i].id,index);
      portrait(i,0,time,pose);portrait(i,1,time,pose);
    }
    const first=1-clamp(time/.20);
    const last=1-clamp((totalFrames-index-1)/(FPS*.23));
    if(first>0||last>0){
      c.save();c.globalAlpha=.77*Math.max(first,last);fill(c,0,0,W,H,"#101b27");c.restore();
    }
  }
  return frame;
}
function option(name,defaultValue=null){
  const i=process.argv.indexOf(name);
  return i<0?defaultValue:process.argv[i+1];
}
async function encode(canvas,paint,destination,ffmpeg,first,limit){
  const audioFree=["-an"];
  const proc=spawn(ffmpeg,["-nostdin","-hide_banner","-loglevel","error","-y","-f","rawvideo",
    "-pix_fmt","rgba","-video_size",canvas.width+"x"+canvas.height,"-framerate",String(FPS),"-i","pipe:0",
    ...audioFree,"-vf","scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
    "-c:v","libx264","-preset","veryfast","-crf","17","-threads","6",
    "-color_range","tv","-colorspace","bt709","-color_primaries","bt709","-color_trc","bt709","-movflags","+faststart",destination],
    {stdio:["pipe","ignore","inherit"]});
  const complete=once(proc,"exit");
  async function* frames(){
    for(let i=first;i<limit;i++){
      paint(i);
      yield canvas.data();
      if((i-first+1)%150===0)console.log((i-first+1)+"/"+(limit-first)+" frames");
    }
  }
  try {
    await pipeline(Readable.from(frames()),proc.stdin);
    const [exit]=await complete;
    if(exit!==0)throw new Error("FFmpeg failed with code "+exit);
  } catch(error) {
    if(proc.exitCode===null)proc.kill();
    throw error;
  }
}
async function main(){
  fonts(option("--font"));
  const width=Number(option("--width","1920"));
  const canvas=createCanvas(width,Math.round(width*H/W)),paint=renderer(canvas);
  const still=option("--stills");
  if(still){
    fs.mkdirSync(still,{recursive:true});
    for(const cue of chapters){
      const at=cue.id==="neutral"?Math.round(2.50*FPS):cue.from+Math.round(1.55*FPS);
      paint(at);canvas.savePng(path.join(still,cue.id+".png"));
    }
    paint(Math.round(1.3*FPS));canvas.savePng(path.join(still,"blink.png"));
  } else {
    const first=Number(option("--from-frame","0")),end=Number(option("--to-frame",String(totalFrames)));
    if(!(lastFrameValid(first,end)))throw new Error("Invalid frame range.");
    const output=option("--out",path.resolve("expression-preview.mp4"));
    await encode(canvas,paint,output,option("--ffmpeg","ffmpeg"),first,end);
    console.log((end-first)+" frames: "+output);
  }
}
function lastFrameValid(first,end){
  return Number.isInteger(first)&&Number.isInteger(end)&&first>=0&&end>first&&end<=totalFrames;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
