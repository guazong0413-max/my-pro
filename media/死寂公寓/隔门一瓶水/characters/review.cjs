"use strict";

const fs=require("node:fs");
const path=require("node:path");
const {createCanvas,loadImage,GlobalFonts}=require(process.env.APARTMENT_CANVAS||"@napi-rs/canvas");
const {svg,sketch}=require("./art.cjs");
const {models}=require("./models.cjs");
const {hands}=require("./faces.cjs");

for(const font of [
  "C:/Windows/Fonts/msyh.ttc","/System/Library/Fonts/PingFang.ttc",
  "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
]){
  if(fs.existsSync(font)&&GlobalFonts.registerFromPath(font,"Apartment Review"))break;
}

const palette={
  background:"#101b26",night:"#14212e",strong:"#e3e5da",muted:"#a6b7b5",
  line:"#354956",lite:"#3c515e",accent:"#bdac8a"
};
function box(ctx,x,y,w,h,fill){
  ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);
}
function line(ctx,x,y,ex,ey,color,width=1){
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
}
function text(ctx,value,x,y,size,color=palette.strong,align="left",weight=450){
  ctx.font=weight+" "+size+'px "Apartment Review", "Microsoft YaHei", sans-serif';
  ctx.textAlign=align;ctx.textBaseline="alphabetic";ctx.fillStyle=color;ctx.fillText(value,x,y);
}
function gel(ctx,x,y,rx,ry,color,alpha){
  ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);
  const fill=ctx.createRadialGradient(0,0,0,0,0,1);fill.addColorStop(0,color);fill.addColorStop(1,"rgba(0,0,0,0)");
  ctx.globalAlpha*=alpha;box(ctx,-1,-1,2,2,fill);ctx.restore();
}
const image=async data=>loadImage(Buffer.from(data,"utf8"));
async function full(ctx,model,direction,x,base,s,pose=null){
  const bounds=pose?[-36,-9,100,model.height+16]:[-35,-9,70,model.height+16];
  const angles=pose?{"right-arm-upper":pose[0],"right-arm-fore":pose[1],"right-arm-hand":pose[2]}:{};
  const [bx,by,w,h]=bounds;
  const im=await image(svg(model,direction,{bounds,gear:false,angles,pixels:7}));
  const scan=createCanvas(im.width,im.height), brush=scan.getContext("2d");
  brush.drawImage(im,0,0);
  const pixels=brush.getImageData(0,0,im.width,im.height).data;
  let bottom=im.height-1;
  found: for(;bottom>0;bottom--){
    for(let j=0;j<im.width;j++) {
      if(pixels[(bottom*im.width+j)*4+3]>=70)break found;
    }
  }
  ctx.drawImage(im,x+bx*s,base-(bottom+1)*h/im.height*s,w*s,h*s);
}
async function head(ctx,model,dir,cx,top,s,gear=false){
  const bounds=[-22,-8,44,44], [, , w,h]=bounds;
  const im=await image(svg(model,dir,{bounds,pixels:8,gear,keep:part=>part.id==="head"||(gear&&part.id==="gear")}));
  ctx.drawImage(im,cx-w*s/2,top,w*s,h*s);
}
async function hand(ctx,model,cx,top,s){
  const bounds=[-8,-3,16,16];
  const im=await image(sketch(hands[model.id],bounds,10));
  ctx.drawImage(im,cx-8*s,top,16*s,16*s);
}
async function overview(out){
  const c=createCanvas(1920,1110),g=c.getContext("2d");
  const background=g.createLinearGradient(0,0,1920,1110);
  background.addColorStop(0,"#192735");background.addColorStop(.6,"#14212e");background.addColorStop(1,"#101b26");
  box(g,0,0,1920,1110,background);
  text(g,"死寂公寓",66,91,47,palette.strong,"left",590);
  text(g,"二维人物模型",69,134,24,palette.muted,"left",470);
  text(g,"同一地线 · 正侧对照",1848,94,23,palette.muted,"right",470);
  line(g,68,164,1851,164,palette.lite);
  const margin=68,w=446;
  const ground=686;
  line(g,68,ground+2,1851,ground+2,"#55707d",1.15);
  for(let i=0;i<models.length;i++){
    const model=models[i], x=margin+w*i;
    if(i)line(g,x,183,x,1048,palette.line);
    gel(g,x+w/2,450,204,255,"#2d4051",.52);
    text(g,model.name,x+24,227,33,palette.strong,"left",540);
    text(g,model.caption,x+24,265,18,palette.muted,"left",450);
    await full(g,model,"front",x+125,ground,2.22);
    await full(g,model,"side",x+316,ground,2.22);
    text(g,"正面",x+125,723,18,palette.muted,"center");
    text(g,"侧面",x+316,723,18,palette.muted,"center");
    line(g,x+22,757,x+w-22,757,palette.line);
    gel(g,x+w/2,898,208,135,"#283747",.46);
    await head(g,model,"front",x+125,790,4.95);
    await head(g,model,"side",x+316,790,4.95);
    box(g,x+23,1046,w-46,2,model.outfit.coat);
  }
  c.savePng(out);
}
async function sheet(model,out) {
  const c=createCanvas(1480,900),g=c.getContext("2d");
  const background=g.createLinearGradient(0,0,1430,900);
  background.addColorStop(0,"#1a2835");background.addColorStop(1,"#101b26");
  box(g,0,0,1480,900,background);
  text(g,model.name,60,89,49,palette.strong,"left",580);
  text(g,model.caption,63,131,24,palette.muted,"left",470);
  line(g,62,164,1415,164,palette.lite);
  line(g,64,759,1088,759,"#536d79",1.13);
  line(g,1118,190,1118,819,palette.line);
  const cols=[219,536,853];
  for(const cx of cols)gel(g,cx,492,155,270,"#2a3d4e",.52);
  await full(g,model,"front",cols[0],759,2.87);
  await full(g,model,"side",cols[1],759,2.87);
  await full(g,model,"side",cols[2]-18,759,2.87,model.pose);
  for(const [i,label] of ["正面","侧面","侧面屈肘"].entries())text(g,label,cols[i],805,23,palette.muted,"center",470);
  text(g,model.id==="uncle"?"耳麦部件":"头部",1160,225,22,palette.muted);
  await head(g,model,"side",1263,245,6.2,model.id==="uncle");
  line(g,1157,511,1417,511,palette.line);
  text(g,"手部",1160,570,22,palette.muted);
  await hand(g,model,1262,587,13.4);
  c.savePng(out);
}
function exportModel(model,dir){
  const dest=path.join(dir,model.id);
  fs.mkdirSync(dest,{recursive:true});
  for(const direction of ["front","side"]){
    fs.writeFileSync(path.join(dest,direction+".svg"),svg(model,direction,{gear:false,pixels:5}));
  }
  const [upper,fore,palm]=model.pose;
  fs.writeFileSync(path.join(dest,"side-arm-bend.svg"),svg(model,"side",{
    bounds:[-35,-9,100,model.height+19],gear:false,pixels:5,
    angles:{"right-arm-upper":upper,"right-arm-fore":fore,"right-arm-hand":palm}
  }));
  if(model.id==="uncle"){
    for(const direction of ["front","side"]){
      fs.writeFileSync(path.join(dest,direction+"-headset.svg"),svg(model,direction,{gear:true,pixels:5}));
    }
  }
  const anchors={headPivotRule:"The head rotates around its neck anchor. Angles are in degrees in the SVG x-right/y-down space.",
    name:model.name,height:model.height,viewport:[-35,-10,70,model.height+19],views:{}};
  for(const [view,value] of Object.entries(model.views)){
    anchors.views[view]=Object.fromEntries(value.layers.filter(p=>p.pivot||p.parent).map(p=>[p.id,{pivot:p.pivot,parent:p.parent,...(p.id==="gear"?{optional:true}:{})}]));
  }
  fs.writeFileSync(path.join(dest,"anchors.json"),JSON.stringify(anchors,null,2)+"\n");
}
async function main(){
  const out=path.resolve(process.argv[2]||"review");
  fs.mkdirSync(out,{recursive:true});
  await overview(path.join(out,"overview.png"));
  if(process.argv.includes("--overview-only"))return;
  const review=path.join(out,"sheets"),art=path.join(out,"models");
  fs.mkdirSync(review,{recursive:true});
  for(const model of models){
    exportModel(model,art);
    await sheet(model,path.join(review,model.id+"-sheet.png"));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
