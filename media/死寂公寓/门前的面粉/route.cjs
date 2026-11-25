"use strict";
const {clamp,lerp,ease,pulse}=require("../开篇九十秒/drawing.cjs");

function route(t, plan){
  const {dir,initial,lands,next,start}=plan;
  const current={left:initial.left,right:initial.right};
  const average=()=>[(current.left[0]+current.right[0])/2,(current.left[1]+current.right[1])/2];
  const rows=[[start,...average()]];
  const schedules={left:[],right:[]};
  for(let i=0;i<lands.length;i++){
    const side=i%2?"right":"left";
    schedules[side].push({origin:current[side],end:next[i],land:lands[i],off:i?lands[i-1]+.11:start});
    current[side]=next[i];
    rows.push([lands[i],...average()]);
  }
  const feet=Object.fromEntries(Object.keys(schedules).map(side=>{
    let xy=initial[side],planted=true;
    for(const k of schedules[side]){
      if(t<k.off)break;
      if(t<k.land){
        const u=clamp((t-k.off)/(k.land-k.off));
        const v=ease(0,1,u);
        xy=[lerp(k.origin[0],k.end[0],v),lerp(k.origin[1],k.end[1],u)-3.25*Math.sin(u*Math.PI)];
        planted=false;
        break;
      }
      xy=k.end;
    }
    return [side,{xy,planted}];
  }));
  const i=rows.findIndex(r=>r[0]>t);
  let root;
  if(i<0)root=rows.at(-1).slice(1);
  else if(!i)root=rows[0].slice(1);
  else{
    const a=rows[i-1], b=rows[i], u=clamp((t-a[0])/(b[0]-a[0]));
    const progress=lerp(u,ease(0,1,u),i===1||i===rows.length-1?.37:.12);
    root=[lerp(a[1],b[1],progress),lerp(a[2],b[2],progress)];
  }
  const swing=clamp((feet.right.xy[0]-feet.left.xy[0])*dir/23,-1,1)*3.5*
    pulse(start-.14,start+.20,lands.at(-1)-.20,lands.at(-1)+.22,t);
  return {root,feet,swing};
}

module.exports={route};
