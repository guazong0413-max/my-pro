"use strict";
const {path,rect,round,line,ell,poly,place,ease,pulse,clamp,lerp}=require("./drawing.cjs");
const {models}=require("../隔门一瓶水/characters/models.cjs");
const {SKIN}=require("../隔门一瓶水/characters/faces.cjs");
const {faceParts,poseFor,restOffset}=require("../隔门一瓶水/characters/reference-style/face.cjs");
const cast=Object.fromEntries(models.map(m=>[m.id,m]));
function shapes(c,items){
  for(const z of items){
    if(z.tag==="path")path(c,z.d,z.fill,z.stroke,z.width,true);
    if(z.tag==="ellipse")ell(c,z.cx,z.cy,z.rx,z.ry,z.fill,z.stroke,z.width);
    if(z.tag==="rect")round(c,z.x,z.y,z.width,z.height,z.rx??0,z.fill,z.stroke,z.sw);
    if(z.tag==="g"){
      c.save();
      for(const hit of z.transform.matchAll(/(translate|scale|rotate)\(([^)]+)\)/g)){
        const args=hit[2].trim().split(/[ ,]+/).map(Number);
        if(hit[1]==="translate")c.translate(args[0],args[1]||0);
        if(hit[1]==="scale")c.scale(args[0],args[1]??args[0]);
        if(hit[1]==="rotate")c.rotate(args[0]*Math.PI/180);
      }
      shapes(c,z.items);c.restore();
    }
  }
}
function dir(a,b){const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return [(b[0]-a[0])/d,(b[1]-a[1])/d];}
function ribbon(c,a,b,c0,w0,w1,w2,fill) {
  const n=(v)=>[-v[1],v[0]], v=dir(a,b),u=dir(b,c0),v0=n(v),v2=n(u);
  const mid=n(dir([0,0],[v[0]+u[0],v[1]+u[1]]));
  const pt=(p,k,s)=>[p[0]+k[0]*s,p[1]+k[1]*s];
  const left=pt(b,mid,w1),right=pt(b,mid,-w1);
  const p0=pt(a,v0,w0),p1=pt(c0,v2,w2),p2=pt(c0,v2,-w2),p3=pt(a,v0,-w0);
  const tucked=[a[0]-v[0]*w0*.64,a[1]-v[1]*w0*.64];
  const joint=(p,q,r)=>[p[0]+(q[0]-p[0])*r,p[1]+(q[1]-p[1])*r];
  const d="M"+p0+" L"+joint(left,p0,.17)+" Q"+left+" "+joint(left,p1,.15)+" L"+p1+" L"+p2+" L"+joint(right,p2,.15)+" Q"+right+" "+joint(right,p3,.17)+" L"+p3+" Q"+tucked+" "+p0+"Z";
  path(c,d,fill);
}
function arm(c,m,v,which,target){
  const parts=m.views[v].layers, get=s=>parts.find(p=>p.id===which+"-arm-"+s).pivot;
  const a=get("upper"), b0=get("fore"), w0=get("hand"), plus=which==="right", palette=m.outfit;
  const wr=target||w0, ab=Math.hypot(a[0]-b0[0],a[1]-b0[1]),bw=Math.hypot(w0[0]-b0[0],w0[1]-b0[1]);
  const u=dir(a,wr),d=clamp(Math.hypot(wr[0]-a[0],wr[1]-a[1]),Math.abs(ab-bw)+.01,ab+bw-.015);
  const base=(ab*ab-bw*bw+d*d)/(2*d), height=Math.sqrt(Math.max(0,ab*ab-base*base));
  const bend=target?(v==="front"&&!plus?-1:1):Math.sign((w0[0]-a[0])*(b0[1]-a[1])-(w0[1]-a[1])*(b0[0]-a[0]))||1;
  const b=[a[0]+base*u[0]-bend*height*u[1],a[1]+base*u[1]+bend*height*u[0]];
  const w=[a[0]+u[0]*d,a[1]+u[1]*d],tow=dir(b,w),n=[-tow[1],tow[0]];
  const size=m.id==="xu"?.81:1, r=(plus?5.45:4.8)*size;
  ribbon(c,a,b,w,r,r*.74,r*.52,plus?palette.near:palette.far);
  const at=[w[0]-1.7*tow[0],w[1]-1.7*tow[1]];
  line(c,[[at[0]+n[0]*r*.5,at[1]+n[1]*r*.5],[at[0]-n[0]*r*.5,at[1]-n[1]*r*.5]],palette.cuff,1.9*size);
  const h=[w[0]+tow[0]*2*size,w[1]+tow[1]*2*size];
  ell(c,...h,3.15*size,3.2*size,plus?SKIN[m.id].main:SKIN[m.id].shade);
}
function walkLeg(c,m,v,side,walk,hipDown){
  const parts=m.views[v].layers,part=suffix=>parts.find(z=>z.id===side+"-leg-"+suffix);
  const hip=part("thigh").pivot,knee=part("shin").pivot,ankle=part("shoe").pivot;
  const front=side==="right",p=walk.progress;
  const stages=front?[[.17,.47,.54],[.63,.95,1]]:[[0,.24,.32],[.43,.73,.82],[.86,1,1]];
  let fraction=0,lift=0;
  for(const [a,b,end] of stages){
    if(p>=b){fraction=end;continue;}
    if(p>a){const u=clamp((p-a)/(b-a));fraction=lerp(fraction,end,ease(0,1,u));lift=4.6*Math.sin(Math.PI*u);}
    break;
  }
  const a=[hip[0],hip[1]+hipDown],w=[ankle[0]+walk.distance*(fraction-p),ankle[1]-lift];
  const u=dir(a,w),d=Math.hypot(w[0]-a[0],w[1]-a[1]);
  const ab=Math.hypot(knee[0]-hip[0],knee[1]-hip[1]),bc=Math.hypot(ankle[0]-knee[0],ankle[1]-knee[1]);
  const mid=clamp((d*d+ab*ab-bc*bc)/(2*d),0,ab),swing=Math.sqrt(Math.max(0,ab*ab-mid*mid));
  const b=[a[0]+mid*u[0]+swing*u[1],a[1]+mid*u[1]-swing*u[0]];
  ribbon(c,a,b,w,front?5.1:4.5,front?4.5:3.9,3.1,front?m.outfit.pants:m.outfit.pantsShade);
  c.save();c.translate(w[0]-ankle[0],w[1]-ankle[1]);shapes(c,part("shoe").items);c.restore();
}
function actor(c,id,x,ground,s,o={}){
  const m=cast[id],v=o.view||"side",parts=m.views[v].layers, time=o.t||0;
  place(c,x,ground-m.height*s,s,()=>{
    const legs=parts.filter(a=>a.id.includes("-leg-"));
    const walking=o.walk&&o.walk.progress>0&&o.walk.progress<1;
    const down=walking?3.4*Math.sin(Math.PI*o.walk.progress)**.7:0;
    if(walking){walkLeg(c,m,v,"left",o.walk,down);walkLeg(c,m,v,"right",o.walk,down);}
    else for(const a of legs)shapes(c,a.items);
    c.save();c.translate(0,down);const hip=id==="xu"?69:97;
    c.translate(0,hip);c.rotate((o.lean||0)*Math.PI/180);c.translate(0,-hip);
    const breath=(.13*Math.sin(time*1.75))*(o.freeze?0:1);
    c.translate(0,breath);
    arm(c,m,v,"left",o.far);
    shapes(c,parts.find(z=>z.id==="torso").items);
    arm(c,m,v,"right",o.near);
    const p=poseFor(id,o.expression||"neutral");
    p.blink=o.blink||0;p.gaze+=o.gaze||0;
    if(o.mouth)p.mouth=o.mouth;
    const row=parts.find(z=>z.id==="head"),[px,py]=row.pivot,dy=restOffset(id,v);
    c.translate(px,py+dy);c.rotate((p.tilt+(o.tilt||0))*Math.PI/180);c.translate(-px,-py);
    const f=faceParts(m,v,p);for(const items of [f.base,f.brows,f.eyes,f.mouth])shapes(c,items);
    c.restore();
  },o.mirror);
}
function blink(t,at){return Math.max(0,...at.map(a=>pulse(a,a+.048,a+.077,a+.158,t)));}
function cat(c,x,y,s,t,o={}) {
  const watch=o.watch??0, tail=o.tail??0, turn=o.turn??0;
  const black="#282933", glint="#505263",belly="#d9d4be";
  place(c,x,y,s,()=>{
    const k=Math.sin(t*1.35)*2.3*(1-watch);
    path(c,"M-15 -8 C"+(-34-tail*5)+" -5 "+(-45+tail*8)+" "+(-21-tail*9)+" "+(-39+tail*7)+" "+(-37-tail*23)+" Q"+(-39+tail*6)+" "+(-43-tail*23+k)+" "+(-33+tail*8)+" "+(-40-tail*23+k),null,black,4.7);
    path(c,"M-25 -4 C-29 -10 -27 -26 -19 -31 Q-14 -37 -4 -35 Q3 -34 5 -27 Q11 -32 12 -38 L22 -37 Q28 -31 27 -21 L25 -3 Q9 1 -6 -2Z",black);
    path(c,"M8 -31 Q17 -36 22 -29 Q28 -23 23 -13 Q20 -8 15 -9 Q8 -12 8 -22Z",belly);
    path(c,"M-23 -7 Q-21 -23 -11 -25",null,"#45454e",1);
    ell(c,4,-2.7,6.3,2.8,black);ell(c,19,-2.9,6.5,3,black);
    ell(c,7,-2,3.5,2,belly);ell(c,22,-2,3.6,2.1,belly);
    c.save();c.translate(15,-40);c.rotate((-.06-watch*.067+turn*.09));c.translate(-15,40);
    c.translate(turn*2,-turn);
    path(c,"M1 -40 L-1 "+(-61-watch*2)+" Q0 -65 4 -60 L11 -54 Q15 -55 21 -53 L30 "+(-63-watch)+" Q32 -63 31 -55 L30 -43 Q31 -33 20 -31 Q7 -29 1 -40Z",black);
    poly(c,[[2,-58],[5,-50],[9,-52]],"#a17f7e");poly(c,[[25,-52],[29,-58],[28,-49]],"#997778");
    if(turn>.01){
      path(c,"M20 -46 Q"+(29+3*turn)+" -45 "+(29+6*turn)+" -39 Q"+(29+7*turn)+" -35 "+(22+3*turn)+" -33 L17 -34Z",black);
    }
    const close=blink(t,o.blinks||[]);
    for(const [ex,ey,rx] of [[10+turn*7.6,-44,4.12-turn*.5],[23+4.2*turn,-44.2,4.12-2.45*turn]]){
      ell(c,ex,ey,rx,4.55*(1-.93*close),"#d0b870");
      if(close<.75){ell(c,ex+1+turn*.45,ey,.83,3.50,"#272932");ell(c,ex-.88,ey-1.5,.65,.78,"#fff2bd");}
    }
    poly(c,[[14+turn*14,-38],[18+turn*14,-38],[16+turn*14,-35.8]],"#ac8e86");
    for(const [a,b] of [[-1.4,-2],[0,.4],[1.5,2.4]]){line(c,[[9+turn*12,-36+a],[-2+turn*14,-35+b]],glint,.65);line(c,[[21+turn*9,-36+a],[33+turn*8,-35+b]],glint,.65);}
    c.restore();
  },o.mirror);
}
// The eighth-floor visitor has her own hairline, face proportions and wine-red coat.
function visitor(c,x,y,s,t,mouth=0){
  place(c,x,y,s,()=>{
    const dark="#302b32", hair="#40343a", skin="#ba9585",wine="#774956";
    path(c,"M-13 87 L-1 87 L-2 147 L-11 147Z M1 88 L13 87 L12 147 L4 147Z","#424652");
    path(c,"M-12 145 L-2 145 L-2 149 L-16 149 Q-17 146 -12 145Z M4 145 L12 145 Q16 146 16 149 L4 149Z","#696462");
    path(c,"M-12 27 Q-17 13 -14 0 Q-12 -14 0 -15 Q15 -15 16 1 L18 30Z",dark);
    path(c,"M-6 20 L6 19 L8 30 L0 37 L-7 29Z",skin);
    path(c,"M-6 26 Q-13 23 -19 31 L-21 49 L-16 91 Q-11 96 0 95 Q11 96 16 92 L18 42 Q17 31 9 26 L3 32Z",wine);
    path(c,"M-15 38 Q-13 53 -14 78 L-13 92 L-17 91 L-19 50Z","#613c4a");
    path(c,"M-19 34 Q-24 48 -21 71 L-20 78 L-14 78 L-13 60 L-12 40Z","#704551");
    path(c,"M15 34 Q22 40 21 55 L18 77 L12 77 L13 59Z","#85535e");
    c.save();c.translate(-17.2,80);c.rotate(.15);
    round(c,-2.5,-5.4,5,11.3,1.0,"#343941");round(c,-3.5,4,7.2,3.6,.8,"#555d62");
    line(c,[[-2.6,7.4],[2.5,7.4]],"#dcc499",.8);c.restore();
    ell(c,-17.2,80,3.1,2.8,skin);ell(c,15,79,3.3,3.5,skin);
    path(c,"M-11 27 Q-9 32 -5 36 L0 31 L6 36 L12 27",null,"#aa7a80",1.05);
    line(c,[[-3,35],[-4,43]],"#c0a99c",.7);line(c,[[4,35],[4,43]],"#c0a99c",.7);
    path(c,"M-10 73 L-7 66 L7 66 L10 73",null,"#573842",.72);
    path(c,"M-10 -3 Q-2 -8 8 -5 Q14 -3 12 7 Q12 16 6 21 Q2 25 -4 21 Q-11 17 -12 8Z",skin);
    path(c,"M-13 10 Q-17 -5 -8 -12 Q1 -18 10 -11 Q15 -8 14 3 Q9 2 6 -5 Q0 -1 -7 2 L-10 12 L-10 21 L-14 18Z",hair);
    path(c,"M-12 -2 Q-9 -11 -1 -12 M7 -7 Q12 -3 13 1",null,"#645059",.63);
    path(c,"M-8 5 Q-6 5.3 -3 3.7 M2 3.8 Q4 4.3 7 5.3",null,"#493a3b",.79);
    const b=blink(t,[84.85,88.45]);
    ell(c,-5,8.2,.98,1.05*(1-.9*b),"#322e32");ell(c,5,8.3,1.0,1.04*(1-.9*b),"#322e32");
    path(c,"M.4 10.1 L-.1 12 L1 12.3",null,"#9d796c",.48);
    if(mouth>.16)ell(c,.4,16.65,1.48,.55+.53*mouth,"#6b494d");
    else path(c,"M-1.9 16.7 Q.2 15.7 2.5 16.7",null,"#795458",.65);
  });
}
module.exports={actor,cat,visitor,blink};
