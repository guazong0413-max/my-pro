"use strict";
const d=require("../开篇九十秒/drawing.cjs");
const {rect,round,ell,line,poly,path,grad,glow,rand,lerp,ease,clamp}=d;
const {camera}=require("../雨夜短片/art.cjs");
const W=960,H=540;
const tau=Math.PI*2;
const mod=(n,m)=>(n%m+m)%m;
function alpha(r,g,b,a){return "rgba("+[r,g,b,clamp(a)].join(",")+")";}
function rain(c,t,x,y,w,h,n=130,power=1,seed=0){
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
  const gust=.13+.19*(.5+.5*Math.sin(t*.66+.8*Math.sin(t*.26)));
  for(let i=0;i<n;i++){
    const z=rand(i+seed+3),v=370+490*z,cycle=h+70;
    const fall=mod(rand(i+seed+107)*cycle+t*v,cycle)-40;
    const xx=x+mod(rand(i+seed+53)*(w+100)-gust*fall-t*(37+z*22),w+100)-35;
    const len=(8+z*z*22)*power;
    line(c,[[xx,y+fall],[xx-gust*len,y+fall+len]],alpha(174,208,218,(.13+.16*z)*power),.45+.68*z);
  }
  c.restore();
}
function ripples(c,t,x,y,w,h,n,seed=0){
  for(let i=0;i<n;i++){
    const a=mod(t*(.7+rand(i+133)*.72)+rand(i+seed+30),1);
    const px=x+w*rand(i+seed+7),py=y+h*rand(i+seed+54);
    ell(c,px,py,1+a*7,.23+a*1.65,null,alpha(172,211,220,.28*(1-a)),.65);
  }
}
function streamGlass(c,t,x,y,w,h,n){
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
  for(let i=0;i<n;i++){
    const px=x+w*rand(i+102),cy=h+60;
    const phase=t*(10+rand(i+338)*27)+cy*rand(i+403);
    const v=y-35+mod(phase,cy),dr=.8+rand(i+176)*1.45,run=7+rand(i+625)*21;
    const dx=1.5*Math.sin(phase*.026+i),a=.12+rand(i+814)*.25;
    line(c,[[px+dx-.7,v-run],[px+dx+1.1,v-run*.45],[px+dx,v]],alpha(157,200,213,a*.56),.65);
    ell(c,px+dx,v,dr*.65,dr*1.14,alpha(141,175,184,a));
    ell(c,px+dx-.25,v-.7,dr*.25,dr*.43,alpha(222,239,231,a));
  }
  c.restore();
}
function wood(c,x,y,w,h){
  rect(c,x,y,w,h,grad(c,x,y,x+w*.35,y+h,[[0,"#65504a"],[.45,"#4d3c39"],[1,"#342e32"]]));
  for(let i=0;i<27;i++){
    const yy=y+rand(i+423)*h, xx=x+rand(i+324)*w;
    line(c,[[xx,yy],[Math.min(x+w,xx+25+rand(i+232)*150),yy+1.7]],alpha(173,133,99,.12),.68);
  }
}
function shrub(c,x,y,s,t){
  c.save();c.translate(x,y);c.scale(s,s);
  const q=Math.sin(t*2+.5*Math.sin(t*3))*.045+.033;
  c.rotate(q);path(c,"M-2 4 Q-4 -20 1 -42 M0 -8 Q12 -25 24 -31 M-1 -18 Q-8 -30 -18 -34",null,"#324b47",2);
  for(let i=0;i<13;i++){
    const k=rand(i+343),yy=-12-i*2.4,side=i%2?1:-1;
    const xx=side*(5+14*k);path(c,"M0 "+(yy+7)+" Q"+(xx*.8)+" "+(yy-9)+" "+(xx*1.65)+" "+(yy-8)+" Q"+(xx*1.3)+" "+(yy+2)+" 0 "+(yy+7)+"Z",i%3?"#39554f":"#496259");
  }
  c.restore();
}
module.exports={...d,W,H,tau,mod,alpha,rain,ripples,streamGlass,wood,shrub,camera};
