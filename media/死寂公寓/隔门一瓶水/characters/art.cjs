"use strict";

const P=(d,fill,stroke,width=.46)=>({tag:"path",d,fill:fill||"none",stroke,width});
const E=(cx,cy,rx,ry,fill,stroke,width=.42)=>({tag:"ellipse",cx,cy,rx,ry,fill,stroke,width});
const L=(d,stroke,width=.50)=>P(d,null,stroke,width);
const R=(x,y,width,height,rx,fill,stroke,sw=.46)=>({tag:"rect",x,y,width,height,rx,fill,stroke,sw});
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const mul=(v,k)=>[v[0]*k,v[1]*k];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
const mix=(a,b,t)=>add(a,mul(sub(b,a),t));
const unit=([x,y])=>{const l=Math.hypot(x,y);return [x/l,y/l];};
const normal=([x,y])=>[-y,x];
const fmt=x=>Math.round(x*1000)/1000;
const pt=v=>v.map(fmt).join(" ");

function layer(id,items,parent=null,pivot=null){
  return {id,items,parent,pivot};
}
function group(items,transform){
  return {tag:"g",items,transform};
}
function outline(a,b,w0,w1,options){
  const {cap=.72,sweep=0,body,shade,light,seam,edge}=options;
  const direction=unit(sub(b,a)), side=normal(direction);
  const top=sub(a,mul(direction,cap*w0));
  const end=add(b,mul(direction,cap*w1));
  const a0=add(top,mul(side,w0)), a1=sub(top,mul(side,w0));
  const b0=add(end,mul(side,w1)), b1=sub(end,mul(side,w1));
  const center=mix(a,b,.49), bow=add(center,mul(side,sweep));
  const c0=add(bow,mul(side,.54*w0+.46*w1)), c1=sub(bow,mul(side,.54*w0+.46*w1));
  const shape="M"+pt(a0)+" Q"+pt(c0)+" "+pt(b0)+" Q"+pt(add(end,mul(direction,w1*.70)))+" "+pt(b1)+
    " Q"+pt(c1)+" "+pt(a1)+" Q"+pt(sub(top,mul(direction,w0*.65)))+" "+pt(a0)+"Z";
  const items=[P(shape,body,edge,.28)];
  if(shade){
    const start=mix(a0,a1,.67), stop=mix(b0,b1,.68);
    items.push(P("M"+pt(start)+" Q"+pt(mix(c0,c1,.59))+" "+pt(stop)+" Q"+pt(add(end,mul(direction,w1*.68)))+" "+pt(b1)+
      " Q"+pt(c1)+" "+pt(a1)+" Q"+pt(sub(top,mul(direction,w0*.64)))+" "+pt(start)+"Z",shade));
  }
  if(light){
    const topLine=mix(mix(a0,a1,.18),mix(c0,c1,.17),.42);
    const control=mix(c0,c1,.24);
    const bottom=mix(mix(b0,b1,.24),control,.25);
    items.push(L("M"+pt(topLine)+" Q"+pt(control)+" "+pt(bottom),light,.37));
  }
  if(seam){
    const start=add(b,mul(direction,-w1*.42));
    const u=add(start,mul(side,w1*.89)),v=sub(start,mul(side,w1*.86));
    items.push(L("M"+pt(u)+" Q"+pt(add(start,mul(direction,w1*.14)))+" "+pt(v),seam,.37));
  }
  return items;
}

function chain(prefix,data,styles,rest,kind){
  const [a,b,c]=data.points;
  const [w0,w1,w2]=data.widths;
  const [first,second,out]=kind==="arm"?["upper","fore","hand"]:["thigh","shin","shoe"];
  const firstId=prefix+"-"+first,secondId=prefix+"-"+second, endId=prefix+"-"+out;
  const high=outline(a,b,w0,w1,{
    body:styles.high,shade:styles.highShade,light:styles.rim,edge:styles.edge,cap:.52,sweep:data.sweep??.2
  });
  const low=outline(b,c,w1*.97,w2,{
    body:styles.low,shade:styles.lowShade,light:styles.rim,edge:null,
    seam:styles.hem,cap:.57,sweep:data.sweep2??-.16
  });
  if(data.trim){
    for(const [items,s,e,rad] of [[high,a,b,w0],[low,b,c,w1]]){
      const d=unit(sub(e,s)), n=normal(d);
      const p=add(mix(s,e,.13),mul(n,-rad*.64));
      const q=add(mix(s,e,.88),mul(n,-rad*.58));
      items.push(L("M"+pt(p)+" L"+pt(q),data.trim,data.trimWidth??.57));
    }
  }
  if(data.cuff){
    const d=unit(sub(c,b)),n=normal(d),m=add(c,mul(d,-2.45));
    const d0=add(m,mul(n,w2*.99)),d1=add(c,mul(n,w2*.97)),d2=sub(c,mul(n,w2*.97)),d3=sub(m,mul(n,w2*.99));
    low.push(P("M"+[d0,d1,d2,d3].map(pt).join(" L")+"Z",data.cuff));
    low.push(L("M"+pt(mix(d0,d1,.49))+" Q"+pt(mix(m,c,.63))+" "+pt(mix(d3,d2,.49)),styles.hem,.35));
  }
  return [
    layer(firstId,high,null,a),
    layer(secondId,low,firstId,b),
    layer(endId,[group(rest,"translate("+pt(c)+")"+(data.mirror?" scale(-1 1)":""))],secondId,c)
  ];
}
function escape(value) {
  return String(value).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function svgShape(shape){
  if(shape.tag==="g")return "<g transform=\""+escape(shape.transform)+"\">"+shape.items.map(svgShape).join("")+"</g>";
  const {tag,stroke,width,sw,...attributes}=shape;
  if(tag==="rect")attributes.width=width;
  if(stroke){attributes.stroke=stroke;attributes["stroke-width"]=sw??width;}
  const attr=Object.entries(attributes).map(([k,v])=>k+'="'+escape(v)+'"').join(" ");
  return "<"+tag+" "+attr+"/>";
}
function transforms(view,angles,shift=false){
  const table=new Map(view.layers.map(l=>[l.id,l]));
  const active=new Map();
  function angleChain(id){
    if(active.has(id))return active.get(id);
    const row=table.get(id);
    const previous=row.parent?angleChain(row.parent):"";
    let result=previous;
    if(row.pivot&&angles[row.id]){
      const [x,y]=row.pivot;
      result+=(result?" ":"")+"rotate("+fmt(angles[row.id])+" "+fmt(x)+" "+fmt(y)+")";
    }
    if(shift&&row.id==="gear"&&angles.gear===false)result+=" scale(0)";
    active.set(id,result);return result;
  }
  for(const row of view.layers)angleChain(row.id);
  return active;
}
function svg(model,direction,opts={}){
  const view=model.views[direction];
  const angles=opts.angles||{};
  const all=transforms(view,angles,true);
  const [x,y,w,h]=opts.bounds||[-35,-10,70,model.height+19];
  const k=opts.pixels||5;
  const attributes="' width='"+Math.round(w*k)+"' height='"+Math.round(h*k)+"' viewBox='"+[x,y,w,h].join(" ")+"'";
  let body="";
  for(const part of view.layers){
    if(opts.keep&&!opts.keep(part))continue;
    if(opts.gear===false&&part.id==="gear")continue;
    const transform=all.get(part.id);
    const pieces=part.items.map(svgShape).join("");
    body+="\n<g id=\""+part.id+"\""+(transform?' transform="'+transform+'"':"")+">"+pieces+"</g>";
  }
  return "<svg xmlns='http://www.w3.org/2000/svg"+attributes+" stroke-linecap='round' stroke-linejoin='round' role='img'>"+
    "<title>"+escape(model.name+" "+(direction==="front"?"正面":"侧面"))+"</title>"+body+"\n</svg>";
}
function sketch(items,bounds,pixels=7){
  const [x,y,w,h]=bounds;
  return "<svg xmlns='http://www.w3.org/2000/svg' width='"+Math.round(w*pixels)+"' height='"+Math.round(h*pixels)+"' viewBox='"+[x,y,w,h].join(" ")+"' stroke-linecap='round' stroke-linejoin='round'>"+
    items.map(svgShape).join("")+"</svg>";
}
module.exports={P,E,L,R,group,layer,chain,svg,sketch};
