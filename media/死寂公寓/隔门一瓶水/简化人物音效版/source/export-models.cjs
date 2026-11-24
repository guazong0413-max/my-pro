"use strict";

const fs=require("node:fs");
const path=require("node:path");
const {cast}=require("./character.cjs");

const MODEL_VIEW={x:58,y:203,width:116,height:220};
const MODELS=[
  {id:"yu",name:"小宇",scale:1},
  {id:"mei",name:"小美",scale:.967},
  {id:"son",name:"小旭",scale:.69},
  {id:"uncle",name:"大叔",scale:1.023}
];

const format=value=>Number(value.toFixed(5));
const coordinates=values=>values.map(format).join(" ");
const escapes={"&":"&amp;",'"':"&quot;","<":"&lt;",">":"&gt;"};
const xml=value=>String(value).replace(/[&"<>]/g,char=>escapes[char]);
const attrs=values=>Object.entries(values).map(([name,value])=>name+'="'+xml(value)+'"').join(" ");

function vectorPainter(title,width,height){
  const rows=[
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg '+attrs({xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 "+width+" "+height,
      width:width*4,height:height*4,"stroke-linecap":"round","stroke-linejoin":"round",role:"img"})+'>',
    "  <title>"+xml(title)+"</title>"
  ];
  let level=1;
  const write=value=>rows.push("  ".repeat(level)+value);
  const element=(tag,attributes)=>write("<"+tag+" "+attrs(attributes)+"/>");
  function group(attributes,draw){
    write("<g "+attrs(attributes)+">");
    level++;
    draw();
    level--;
    write("</g>");
  }
  function paint(fill,stroke,width){
    return stroke?{fill:fill||"none",stroke,"stroke-width":width}:{fill:fill||"none"};
  }
  const path=(d,fill,edge,width=1)=>element("path",{d,...paint(fill,edge,width)});
  const ell=(cx,cy,rx,ry,fill)=>element("ellipse",{cx,cy,rx,ry,fill});
  const line=(points,stroke,width=1)=>element("polyline",{
    points:points.map(point=>point.map(format).join(",")).join(" "),
    ...paint(null,stroke,width)
  });
  let outline;
  const g={
    beginPath(){outline=[];},
    moveTo(...point){outline.push("M"+coordinates(point));},
    lineTo(...point){outline.push("L"+coordinates(point));},
    quadraticCurveTo(...points){outline.push("Q"+coordinates(points));},
    closePath(){outline.push("Z");},
    fill(){path(outline.join(" "),this.fillStyle);}
  };
  function at(x,y,sx,sy,angle,draw){
    const transform=["translate("+coordinates([x,y])+")"];
    if(angle)transform.push("rotate("+format(angle*180/Math.PI)+")");
    if(sx!==1||sy!==1)transform.push("scale("+coordinates([sx,sy])+")");
    group({transform:transform.join(" ")},draw);
  }
  const layer=(id,draw)=>group({id},draw);
  return {g,path,ell,line,at,layer,glow(){},finish:()=>[...rows,"</svg>",""].join("\n")};
}

function limbAnchors(parts){
  const names=["farLeg","nearLeg","farArm","nearArm"];
  return Object.fromEntries(parts.map(({kind,anchor,joint,end},i)=>{
    const [a,k,z]=kind==="arm"?["shoulder","elbow","wrist"]:["hip","knee","ankle"];
    return [names[i],{[a]:anchor.map(format),[k]:joint.map(format),[z]:end.map(format)}];
  }));
}

function main(folder=path.join(__dirname,"..","models")){
  fs.mkdirSync(folder,{recursive:true});
  const {x,y,width,height}=MODEL_VIEW;
  const metadata={
    units:"SVG viewBox units, x right, y down",
    pose:"rest",
    viewBox:[0,0,width,height],
    floorY:y,
    characters:{}
  };
  for(const {id,name,scale} of MODELS){
    const painter=vectorPainter(name+" · 侧面",width,height);
    const parts=cast(painter).body(id,{x,y,scale,pose:"rest"});
    const file=name+".svg";
    fs.writeFileSync(path.join(folder,file),painter.finish(),"utf8");
    metadata.characters[id]={name,file,scale,limbs:limbAnchors(parts)};
  }
  const front=vectorPainter("小宇 · 正脸",72,64);
  cast(front).head("yu",36,31,0,{front:true,pose:"rest"});
  fs.writeFileSync(path.join(folder,"小宇-正脸.svg"),front.finish(),"utf8");
  fs.writeFileSync(path.join(folder,"anchors.json"),JSON.stringify(metadata,null,2)+"\n","utf8");
  console.log("Exported four layered models, the front drawing and joint coordinates.");
}

if(require.main===module)main(process.argv[2]);
module.exports={MODELS,MODEL_VIEW};