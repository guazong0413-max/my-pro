"use strict";

const {rect,line,grad,rand}=require("../开篇九十秒/drawing.cjs");
const W=960,H=540;

function camera(c,x,y,zoom,draw) {
  c.save();
  c.translate(W/2,H/2);
  c.scale(zoom,zoom);
  c.translate(-x,-y);
  draw();
  c.restore();
}

function night(c,top="#142432",bottom="#0c141e") {
  rect(c,-W,-H,W*3,H*3,grad(c,0,0,0,H,[[0,top],[1,bottom]]));
}

function rain(c,t,{x=0,y=0,w=W,h=H,count=148,strength=1,seed=1}={}) {
  c.save();
  c.beginPath();
  c.rect(x,y,w,h);
  c.clip();
  for(let i=0;i<count;i++){
    const a=rand(i*2+seed),speed=350+490*rand(i+seed*13);
    const cycle=h+78;
    const ry=y-48+(rand(i+seed+104)*cycle+t*speed)%cycle;
    const rx=x+w*a-(ry-y)*(.021+.022*a);
    const size=6+35*rand(i+98+seed);
    const opacity=(.095+.17*rand(i+213+seed))*strength;
    line(c,[[rx,ry],[rx-1.3-(size*.045),ry+size]],"rgba(128,163,184,"+opacity+")",.36+1.02*a);
  }
  c.restore();
}

function frameGrain(c,makeCanvas) {
  const tile=makeCanvas(103,113), g=tile.getContext("2d");
  for(let i=0;i<620;i++){
    g.fillStyle=i%3?"rgba(18,27,37,.125)":"rgba(205,208,192,.075)";
    const size=.40+1.25*rand(i+143);
    g.fillRect(rand(i+200)*103,rand(i+437)*113,size,size);
  }
  return c.createPattern(tile,"repeat");
}

module.exports={W,H,camera,night,rain,frameGrain};
