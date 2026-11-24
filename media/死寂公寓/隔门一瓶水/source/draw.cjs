"use strict";

const { createCanvas, Path2D, GlobalFonts } = require("@napi-rs/canvas");
const fs = require("node:fs");

const W = 960;
const H = 540;
const clamp = (x, low = 0, high = 1) => Math.max(low, Math.min(high, x));
const mix = (a, b, u) => a + (b - a) * u;
function ease(t, a = 0, b = 1) {
  const u = clamp((t - a) / (b - a));
  return u * u * (3 - 2 * u);
}
function rgba(hex, alpha) {
  return "rgba(" + [0, 2, 4].map(i => parseInt(hex.slice(i, i+2), 16)).join(",") + "," + clamp(alpha) + ")";
}
function seeded(seed) {
  let state = seed >>> 0;
  return () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
}
function installFont(custom) {
  const candidates = [custom, "C:/Windows/Fonts/msyh.ttc", "C:/Windows/Fonts/msyh.ttf",
    "/System/Library/Fonts/PingFang.ttc", "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"];
  for (const path of candidates) {
    if (path && fs.existsSync(path) && GlobalFonts.registerFromPath(path, "Film Chinese")) return path;
  }
  if (custom) throw new Error("Could not load the specified Chinese font.");
  return null;
}
function points(points, ctx) {
  ctx.moveTo(points[0][0], points[0][1]);
  for (const [x,y] of points.slice(1)) ctx.lineTo(x,y);
}
function painter(canvas) {
  const g = canvas.getContext("2d");
  g.lineJoin = "round";
  g.lineCap = "round";
  const paths = new Map();
  function path(d, fill, edge, width=1) {
    let p = paths.get(d);
    if (!p) {
      p = new Path2D(d);
      if (paths.size < 2000 && typeof d === "string") paths.set(d,p);
    }
    if (fill) { g.fillStyle=fill; g.fill(p); }
    if (edge) { g.strokeStyle=edge; g.lineWidth=width; g.stroke(p); }
  }
  function rect(x,y,w,h,col) { if (w<=0 || h<=0) return; g.fillStyle=col; g.fillRect(x,y,w,h); }
  function box(x,y,w,h,r,fill,edge,width=1) {
    if (w<=0 || h<=0) return;
    g.beginPath(); g.roundRect(x,y,w,h,Math.min(r,h/2,w/2));
    if (fill) { g.fillStyle=fill;g.fill(); }
    if (edge) { g.strokeStyle=edge;g.lineWidth=width;g.stroke(); }
  }
  function poly(p,fill,edge,width=1) {
    g.beginPath(); points(p,g); g.closePath();
    if (fill) {g.fillStyle=fill;g.fill();}
    if (edge) {g.strokeStyle=edge;g.lineWidth=width;g.stroke();}
  }
  function line(p,color,width=1) {
    g.beginPath();points(p,g);g.strokeStyle=color;g.lineWidth=width;g.stroke();
  }
  function ell(x,y,rx,ry,fill,edge,width=1,angle=0) {
    g.beginPath();g.ellipse(x,y,rx,ry,angle,0,Math.PI*2);
    if (fill) {g.fillStyle=fill;g.fill();}
    if (edge) {g.strokeStyle=edge;g.lineWidth=width;g.stroke();}
  }
  function grad(x,y,x2,y2,stops) {
    const fill=g.createLinearGradient(x,y,x2,y2);
    for (const [p,c] of stops) fill.addColorStop(p,c);
    return fill;
  }
  function glow(x,y,rx,ry,color,alpha) {
    if (alpha<.003) return;
    g.save();g.translate(x,y);g.scale(rx,ry);
    const fill=g.createRadialGradient(0,0,0,0,0,1);
    fill.addColorStop(0,rgba(color,alpha));
    fill.addColorStop(.40,rgba(color,alpha*.53));
    fill.addColorStop(1,rgba(color,0));
    rect(-1,-1,2,2,fill);g.restore();
  }
  function text(value,x,y,px,col,opt={}) {
    g.font=(opt.weight||400)+" "+px+'px "Film Chinese", "Microsoft YaHei", sans-serif';
    g.textAlign=opt.align||"left";
    g.textBaseline="alphabetic";
    if (opt.outline) {g.strokeStyle="#070e14";g.lineWidth=opt.outline;g.strokeText(value,x,y);}
    g.fillStyle=col;g.fillText(value,x,y);
  }
  function at(x,y,sx,sy,angle,draw) {
    g.save();g.translate(x,y);if (angle) g.rotate(angle);
    g.scale(sx,sy);draw();g.restore();
  }
  function lens(cx,cy,zoom,dx,dy,draw) {
    g.save();g.translate(cx+dx,cy+dy);g.scale(zoom,zoom);g.translate(-cx,-cy);draw();g.restore();
  }
  function clip(shape,draw) {
    g.save();g.clip(new Path2D(shape));draw();g.restore();
  }
  return {g,path,rect,box,poly,line,ell,grad,glow,text,at,lens,clip};
}

module.exports={W,H,createCanvas,clamp,mix,ease,rgba,seeded,installFont,painter};
