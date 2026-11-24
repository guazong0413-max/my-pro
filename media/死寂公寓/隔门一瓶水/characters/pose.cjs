"use strict";

const fs=require("node:fs");
const {svg}=require("./art.cjs");
const {models}=require("./models.cjs");

function main(){
  const [id,view,out,...options]=process.argv.slice(2);
  const model=models.find(item=>item.id===id);
  if(!model||!model.views[view]||!out){
    console.error("Usage: node pose.cjs <yu|mei|xu|uncle> <front|side> <output.svg> [part-id=angle] [--headset]");
    process.exitCode=1;
    return;
  }
  const allowed=new Set(model.views[view].layers.filter(part=>part.pivot).map(part=>part.id));
  const angles={};
  for(const option of options){
    if(option==="--headset")continue;
    const match=/^([a-z-]+)=(-?(?:\d+(?:\.\d*)?|\.\d+))$/.exec(option);
    if(!match||!allowed.has(match[1])||Math.abs(Number(match[2]))>180){
      throw new Error("Expected a model pivot and angle between -180 and 180 degrees: "+option);
    }
    angles[match[1]]=Number(match[2]);
  }
  fs.writeFileSync(out,svg(model,view,{
    bounds:[-106,-35,212,model.height+80],angles,gear:options.includes("--headset"),pixels:4
  }));
}
try{main();}
catch(error){console.error(error.message);process.exitCode=1;}
