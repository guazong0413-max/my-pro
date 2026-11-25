"use strict";
const canvasLib = require("./canvas-runtime.cjs");
const {Path2D} = canvasLib;
const clamp=(u,a=0,b=1)=>Math.min(b,Math.max(a,u));
const lerp=(a,b,u)=>a+(b-a)*u;
const ease=(a,b,t)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u);};
const pulse=(a,b,c,d,t)=>ease(a,b,t)*(1-ease(c,d,t));
const cache=new Map();
function fillPath(c,p,fill,stroke,width=1) {
  if(fill&&fill!=="none"){c.fillStyle=fill;c.fill(p);}
  if(stroke&&stroke!=="none"){c.lineWidth=width;c.strokeStyle=stroke;c.stroke(p);}
}
function path(c,d,fill,stroke,width=1,stable=false) {
  let p=stable?cache.get(d):null;
  if(!p){p=new Path2D(d);if(stable)cache.set(d,p);}
  fillPath(c,p,fill,stroke,width);
}
function rect(c,x,y,w,h,color){if(w<=0||h<=0)return;c.fillStyle=color;c.fillRect(x,y,w,h);}
function round(c,x,y,w,h,r,fill,stroke,width=1){const p=new Path2D();p.roundRect(x,y,w,h,Math.min(r,h/2,w/2));fillPath(c,p,fill,stroke,width);}
function ell(c,x,y,rx,ry,fill,stroke,width=1){const p=new Path2D();p.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,Math.PI*2);fillPath(c,p,fill,stroke,width);}
function line(c,pts,col,w=1){const p=new Path2D();p.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)p.lineTo(...pts[i]);fillPath(c,p,null,col,w);}
function poly(c,pts,col,stroke,w=1){const p=new Path2D();p.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)p.lineTo(...pts[i]);p.closePath();fillPath(c,p,col,stroke,w);}
function grad(c,x,y,x2,y2,stops){const g=c.createLinearGradient(x,y,x2,y2);stops.forEach(([p,col])=>g.addColorStop(p,col));return g;}
function glow(c,x,y,rx,ry,inside,end="rgba(0,0,0,0)"){c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,inside);g.addColorStop(1,end);rect(c,-1,-1,2,2,g);c.restore();}
function text(c,str,x,y,size,col,align="left",bold=false){c.save();c.font=(bold?"bold ":"")+size+'px "'+(bold?"FilmBold":"FilmSans")+'", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';c.textAlign=align;c.textBaseline="alphabetic";c.fillStyle=col;c.fillText(str,x,y);c.restore();}
function place(c,x,y,s,fn,mirror=false,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.scale(mirror?-s:s,s);fn();c.restore();}
function vignette(c,opacity=.24){const g=c.createRadialGradient(480,253,160,480,253,570);g.addColorStop(0,"rgba(8,13,24,0)");g.addColorStop(.76,"rgba(8,13,24,"+opacity*.22+")");g.addColorStop(1,"rgba(8,13,24,"+opacity+")");rect(c,0,0,960,540,g);}
const rand=i=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};
module.exports={...canvasLib,clamp,lerp,ease,pulse,path,rect,round,ell,line,poly,grad,glow,text,place,vignette,rand};
