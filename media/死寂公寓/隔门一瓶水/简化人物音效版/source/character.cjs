"use strict";

const {clamp,ease,mix}=require("./draw.cjs");

const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
const mul=(a,f)=>[a[0]*f,a[1]*f];
const length=a=>Math.hypot(...a);
const unit=a=>mul(a,1/Math.max(length(a),1e-6));
const left=a=>[-a[1],a[0]];
const point=(a,b,t)=>[mix(a[0],b[0],t),mix(a[1],b[1],t)];
const rotate=([x,y],a)=>[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];

const CAST={
  yu:{
    skin:"#c2a089", shade:"#a88370", hair:"#242831", coat:"#68727d", sleeve:"#5a6572",
    far:"#454e5c", collar:"#818995", pants:"#384353", shoes:"#404953", sole:"#a2a19a",
    shoulder:[-4,-53.9], otherShoulder:[5,-52.4], head:[1,-74], legs:[40,39], arms:[28,24],
    sleeveWidths:[9,7,4.8], legWidths:[8.1,5.8,4.6], hand:[4.55,4.02],
    jacket:"M-6 -61 Q-17 -60 -19 -52 Q-21 -43 -17 -32 L-15 -3 Q-14 2 -9 3 L11 3 Q16 2 16 -3 L17 -39 Q17 -54 9 -59 Q2 -56 -6 -61Z",
    face:"M-14 -5 Q-15 -16 -5 -20 Q8 -24 14 -15 Q17 -11 16 -6 L19 -1 Q20 .9 17 1 L16 5 Q14 11 8 13 Q1 15 -6 11 Q-13 7 -14 -5Z",
    crown:"M-14 3 Q-20 -9 -13 -17 Q-7 -24 4 -23 Q14 -22 17 -15 Q19 -10 16 -7 Q10 -10 6 -13 Q3 -9 -5 -8 L-8 -1 Q-11 3 -14 3Z",
    eyes:[[10.6,-3.6]], mouth:[12.9,5.8,2.3], brow:1.0
  },
  mei:{
    skin:"#caa68f", shade:"#aa8371", hair:"#302a31", coat:"#b08a4d", sleeve:"#9b7743",
    far:"#725735", collar:"#c09b63", pants:"#414553", shoes:"#555059", sole:"#aca298",
    shoulder:[-4,-53.9], otherShoulder:[4.7,-52.4], head:[.3,-74.5], legs:[40,39], arms:[28,24],
    sleeveWidths:[8.35,6.25,4.55], legWidths:[6.9,4.8,3.9], hand:[4.25,3.85],
    jacket:"M-7 -62 Q-17 -60 -18 -51 L-17 -36 Q-14 -24 -16 -12 L-19 11 Q-19 15 -14 16 H12 Q17 16 17 11 L15 -7 L15 -39 Q16 -56 7 -61 Q0 -58 -7 -62Z",
    face:"M-12 -7 Q-15 -17 -4 -21 Q7 -24 12 -16 Q15 -13 15 -7 L18 -1 Q19.6 .8 16.7 1.4 L15.2 2.1 Q14.6 7 11.7 10 Q9 14 4 14 Q-7 12 -12 -1Z",
    crown:"M-12 5 Q-20 -1 -18 -13 Q-16 -22 -6 -25 Q5 -28 11 -21 Q16 -17 15 -9 Q10 -10 6 -14 Q2 -16 -.6 -17 Q-4 -9 -8 -6 Q-7 2 -12 5Z",
    eyes:[[9.8,-3.4]], mouth:[12.7,6.55,2.1], brow:.94
  },
  son:{
    skin:"#cfaa91", shade:"#ad8a78", hair:"#292b34", coat:"#537a99", sleeve:"#436683",
    far:"#38516a", collar:"#d0d4cb", pants:"#385771", shoes:"#454f5b", sole:"#c1beb2",
    shoulder:[-3,-47], otherShoulder:[4,-46], head:[1,-66.5], legs:[34,33], arms:[22,19],
    sleeveWidths:[6.9,5.1,3.8], legWidths:[6,4.5,3.65], hand:[3.65,3.33],
    jacket:"M-7 -54 Q-14 -53 -16 -44 Q-17 -37 -14 -28 L-12 -2 Q-12 2 -7 3 H10 Q14 2 14 -1 L14 -39 Q13 -50 7 -53 Q0 -49 -7 -54Z",
    face:"M-14 -6 Q-14 -17 -4 -20 Q9 -23 14 -13 Q16 -9 15.8 -4 L18.8 .15 Q19 1.7 16 2.7 Q15 11 9 13 Q3 16 -6 12 Q-13 9 -14 -6Z",
    crown:"M-13 5 Q-18 3 -18 -9 Q-17 -20 -5 -23 Q7 -26 14 -17 Q17 -14 16 -8 Q12 -10 8 -12 Q2 -15 -3 -11 L-7 -7 L-9 0 Q-10 5 -13 5Z",
    eyes:[[10,-3.45]], mouth:[13.25,6.5,1.7], brow:.82
  },
  uncle:{
    skin:"#b89177", shade:"#98715d", hair:"#302c2c", coat:"#657052", sleeve:"#535f46",
    far:"#434d3a", collar:"#858870", pants:"#44484a", shoes:"#3b4146", sole:"#82847c",
    shoulder:[-7,-54.7], otherShoulder:[7,-54], head:[1,-74.5], legs:[40,39], arms:[28,24],
    sleeveWidths:[11,8.8,6.25], legWidths:[10.4,7.2,5.75], hand:[5.15,4.42],
    jacket:"M-9 -61 Q-24 -60 -26 -51 Q-29 -39 -22 -27 L-21 -3 Q-20 3 -15 4 L16 4 Q22 3 23 -3 L22 -39 Q23 -55 11 -60 Q2 -55 -9 -61Z",
    face:"M-16 -5 Q-17 -17 -7 -22 Q4 -26 14 -19 Q19 -15 18 -6 L22 -.7 Q23 1.8 19 2.1 L18 8 Q17 14 10 15 L-1 15 Q-13 12 -15 5Z",
    crown:"M-15 7 Q-23 -3 -19 -13 Q-15 -24 -5 -25 Q8 -29 16 -20 Q20 -17 19 -10 Q14 -12 10 -14 Q1 -14 -3 -10 Q-7 -7 -9 -.5 L-10 6Z",
    eyes:[[11.7,-3.2]], mouth:[14.8,7.65,2.7], brow:1.48
  }
};

const FRONT_YU={
  face:"M-17 -8 C-17 -18 -8 -22 0 -22 Q12 -22 16 -13 Q19 -6 16 4 Q13 13 4 15 Q-5 17 -12 10 Q-17 5 -17 -8Z",
  crown:"M-17 -.5 Q-21 -8 -17 -16 Q-13 -24 -2 -24 Q9 -25 15 -19 Q20 -13 17 -5 Q14 -7 11 -11 Q8 -7 3 -8 Q-5 -8 -9 -12 Q-12 -7 -17 -7Z",
  eyes:[[-5.5,-2.35],[5.8,-2.4]], mouth:[.6,6.1,2.8]
};

const EXPRESSIONS={
  rest:{brow:0,slant:0,mouth:"line"},
  alert:{brow:-.9,slant:.19,mouth:"press"},
  wait:{brow:-.34,slant:-.57,mouth:"press"},
  worry:{brow:-.67,slant:-.93,mouth:"frown"},
  surprise:{brow:-1.35,slant:.05,mouth:"round"},
  relief:{brow:-.14,slant:-.13,mouth:"soft"},
  sad:{brow:-.35,slant:-.54,mouth:"frown"}
};
const CUES={
  yu:{poses:[[0,"rest"],[6.88,"alert"],[8.3,"wait"],[12.1,"rest"],[34.4,"wait"],[38.0,"relief"],[60.5,"surprise"],[61.37,"alert"],[62.21,"rest"]],blinks:[3.43,11.3,37.85,65.88]},
  mei:{poses:[[0,"rest"],[14.9,"worry"],[16.98,"wait"],[19.26,"alert"],[43,"wait"],[44.55,"relief"],[47.05,"wait"]],blinks:[16.53,45.29]},
  son:{poses:[[0,"rest"],[14.65,"surprise"],[15.48,"wait"],[16.9,"worry"],[19.15,"rest"],[43.1,"wait"],[47.7,"alert"]],blinks:[17.34,46.03]},
  uncle:{poses:[[0,"rest"],[78.95,"alert"],[81.07,"wait"],[83.12,"sad"]],blinks:[82.56]}
};

function expression(name,t,pose) {
  if(pose)return {...EXPRESSIONS[pose],blink:0};
  const {poses,blinks}=CUES[name];
  let i=poses.length-1;
  while(i>0&&t<poses[i][0])i--;
  const [begin,key]=poses[i];
  const a=EXPRESSIONS[poses[Math.max(0,i-1)][1]],z=EXPRESSIONS[key];
  const q=ease(t,begin,begin+(key==="surprise"?.14:.31));
  return {
    brow:mix(a.brow,z.brow,q),slant:mix(a.slant,z.slant,q),mouth:q<.54?a.mouth:z.mouth,
    blink:blinks.some(x=>t>=x&&t<x+.103)
  };
}

function solve(a,target,l1,l2,side) {
  const delta=sub(target,a);
  const reach=length(delta);
  const direction=reach>1e-5?mul(delta,1/reach):[0,1];
  const d=clamp(reach,Math.abs(l1-l2)+.15,l1+l2-.06);
  const along=(l1*l1+d*d-l2*l2)/(2*d);
  const bend=Math.sqrt(Math.max(0,l1*l1-along*along))*side;
  return {joint:add(add(a,mul(direction,along)),mul(left(direction),bend)),end:add(a,mul(direction,d)),error:Math.abs(reach-d)};
}

// Each moving limb is drawn as one closed outline, including at the bend.
function contour(g,a,k,z,widths,fill){
  const [w0,w1,w2]=widths;
  const n0=left(unit(sub(k,a))),n1=left(unit(sub(z,k)));
  const middle=unit(add(n0,n1));
  const a0=point(a,k,.77),z0=point(k,z,.24);
  g.beginPath();
  g.moveTo(...add(a,mul(n0,w0)));
  g.lineTo(...add(a0,mul(n0,w1)));
  g.quadraticCurveTo(...add(k,mul(middle,w1)),...add(z0,mul(n1,w1)));
  g.lineTo(...add(z,mul(n1,w2)));
  g.lineTo(...sub(z,mul(n1,w2)));
  g.lineTo(...sub(z0,mul(n1,w1)));
  g.quadraticCurveTo(...sub(k,mul(middle,w1)),...sub(a0,mul(n0,w1)));
  g.lineTo(...sub(a,mul(n0,w0)));
  g.closePath();
  g.fillStyle=fill;
  g.fill();
}

function cast(b) {
  const {g,path,line,ell,at,glow}=b;

  function head(name,x,y,angle,{t=0,mouth=0,front=false,pose=null}={}){
    const c=CAST[name];
    const drawing=front&&name==="yu"?FRONT_YU:c;
    const e=expression(name,t,pose);
    const ink="#2c272a";
    at(x,y,1,1,angle,()=>{
      path("M-6 6 H6 L7 15 Q1 18 -7 14Z",c.shade);
      if(name==="mei"){
        ell(-13.7,-25,8.6,9.0,c.hair);
        path("M-20 -24 Q-15 -29 -9 -27",null,"#4a3a3e",1.35);
      }
      path(drawing.face,c.skin);
      path(drawing.crown,c.hair);
      if(name==="yu"){
        path(front?"M-12 -17 Q-4 -23 7 -20":"M-12 -14 Q-7 -20 3 -19",null,"#3d424b",1.64);
      }
      if(name==="son")ell(10.0,3.2,2.05,1.14,"#c69983");
      if(name==="uncle"){
        path("M-9 -1 Q-5 6 2 7 Q8 6 12 6 L18.5 5.75 Q18 12 14 15 L2 16 Q-7 14 -11 5Z","#4f443d");
        path("M-5 7 Q.5 12 6 12",null,"#806e5c",1.75);
        path("M-16 -4 Q-22 -23 -7 -27 Q3 -30 11 -23",null,"#434449",2.8);
        ell(-12.4,-1.5,5.3,7.1,"#3f484e");
        ell(-13,-2,2.7,4.65,"#596068");
        path("M-10 3 Q-6 10 8 11",null,"#303237",1.85);
        ell(8.4,11,2,1.2,"#343438");
      }
      for(let i=0;i<drawing.eyes.length;i++){
        const [ex,ey]=drawing.eyes[i];
        const side=drawing.eyes.length===2&&i===1?-1:1;
        const by=ey-4.1+e.brow;
        const w=name==="uncle"?2.9:2.4;
        path("M"+(ex-w*side)+" "+(by-e.slant*.45)+" Q"+ex+" "+(by-.4)+" "+(ex+w*side)+" "+(by+e.slant*.53),null,ink,c.brow);
        const size=name==="son"?1.43:name==="yu"?1.53:1.44;
        if(e.blink)line([[ex-1.45,ey],[ex+1.45,ey]],ink,.84);
        else ell(ex,ey,size,size,ink);
      }
      const [mx,my,width]=drawing.mouth;
      const open=mouth>.20||e.mouth==="round";
      const lips=name==="uncle"?"#c1967b":"#705046";
      if(open){
        const strong=mouth>.56&&name==="yu";
        ell(mx,my,(strong?.76:.59)*width,strong?1.33:.94,lips);
      } else {
        const bend=e.mouth==="frown"?-.69:e.mouth==="soft"?.77:0;
        path("M"+(mx-width)+" "+my+" Q"+mx+" "+(my+bend)+" "+(mx+width)+" "+(my-.11),null,lips,e.mouth==="press"?.99:.79);
      }
    });
  }

  function hand(c,wrist,elbow,angle){
    const direction=angle??Math.atan2(wrist[1]-elbow[1],wrist[0]-elbow[0]);
    at(wrist[0],wrist[1],1,1,direction,()=>ell(c.hand[0]*.50,0,...c.hand,c.skin));
  }

  function shoe(c,a,tilt,far){
    at(a[0],a[1]+6,1,1,tilt,()=>{
      path("M-5.9 .8 L-5.7 -5.6 Q-3 -7.8 3.9 -6.25 L7 -3.85 Q11 -2.4 13.6 -2.35 Q16 -2 16 .4 L15.8 1.85 H-5.9Z",far?c.far:c.shoes);
      path("M-5.9 .25 H16 L15.8 1.85 H-5.9Z",c.sole);
    });
  }

  function jacket(name,c){
    path(c.jacket,c.coat);
    if(name==="yu"){
      path("M-10 -58 Q-13 -58 -12 -62 Q-8 -65 -4 -60 Q1 -57 7 -60 Q13 -61 13 -57 Q7 -51 -1 -52Z",c.far);
      path("M0 -53 L1 .4",null,"#515d69",1.15);
      path("M-4.5 -55 L-3.7 -45 M4.7 -55 L5.7 -46.9",null,"#b5b8b3",1.4);
      path("M3 -12 L12 -15 L12 -4 L3 -4Z","#596672");
    } else if(name==="mei"){
      path("M-7 -61 Q-.8 -57 7 -61 L10 -52 Q1 -52 -4 -55Z",c.collar);
      path("M4 -14 L13 -16 L13 -7 Q10 -2 4 -5Z","#937041");
    } else if(name==="son"){
      path("M-10 -50 L-7 -56 Q0 -53 6 -55 L10 -50 L7 -46 L0 -48 L-7 -45Z",c.collar);
      line([[2,-47],[3,1]],c.collar,1.25);
    } else {
      path("M-11 -60 Q-4 -62 0 -57 Q8 -61 13 -59 L15 -54 Q8 -50 0 -50 Q-8 -51 -13 -54Z",c.collar);
      path("M8 -28 H18 V-14 Q12 -12 8 -15Z","#535e47");
    }
  }

  function body(name,opts) {
    const {x,y,scale:s=1,dir=1,t=0,lean=0,drop=0,mouth=0,headTilt=0,feet=null,wrist=null,handAngle=null,
      farWrist=null,step=0,front=false,pose=null,wristBlend=1}=opts;
    const c=CAST[name];
    const world=v=>[x+v[0]*s*dir,y+v[1]*s];
    const local=v=>[(v[0]-x)/s*dir,(v[1]-y)/s];
    const footData=(feet||[[x-6*s*dir,y],[x+5*s*dir,y]])
      .map(entry=>Array.isArray(entry)?{p:entry,ground:y,roll:0}:entry);
    const legLength=c.legs[0]+c.legs[1]-(feet ? .38 : .09);
    const base=legLength+7.78;
    const hips=[[-4,feet ? 1.4 : .55],[1.5,0]];
    const ankle=foot=>add(local(foot.p),[-3,-7.85]);
    const required=footData.map((foot,i)=>{
      const p=ankle(foot),a=hips[i];
      return base+p[1]-a[1]-Math.sqrt(Math.max(0,legLength**2-(p[0]-a[0])**2));
    });
    const pelvis=[0,-base+Math.max(drop,...required)];
    const bodyPoint=v=>add(pelvis,rotate(v,lean));
    const tests=[];
    for(const f of footData){
      const d=Math.max(0,f.ground-f.p[1]);
      if(d<22*s)glow(f.p[0]+3.8*s*dir,f.ground+1.2*s,17*s+d*.42,3.6*s+d*.16,"060d15",.47*(1-d/(24*s)));
    }
    at(x,y,s*dir,s,0,()=>{
      for(const [i,f] of footData.entries()){
        const a=add(pelvis,hips[i]),z=ankle(f);
        const sol=solve(a,z,...c.legs,-1),far=i===0;
        contour(g,a,sol.joint,sol.end,c.legWidths,far?"#2d3743":c.pants);
        if(name==="son"&&!far)line([point(a,sol.joint,.46),sol.joint,point(sol.joint,sol.end,.82)],c.collar,1.05);
        shoe(c,sol.end,f.roll||0,far);
        tests.push({kind:"leg",anchor:world(a),joint:world(sol.joint),end:world(sol.end),target:world(z),contact:f.p,ground:f.ground,error:sol.error,scale:s,lengths:c.legs});
      }
      function sleeve(a,target,far,angle){
        const sol=solve(a,target,...c.arms,1);
        const shoulder=add(a,mul(unit(sub(a,sol.joint)),2.0));
        const widths=far?c.sleeveWidths.map(w=>w*.9):c.sleeveWidths;
        contour(g,shoulder,sol.joint,sol.end,widths,far?c.far:c.sleeve);
        if(name==="son"&&!far)line([point(a,sol.joint,.17),sol.joint,point(sol.joint,sol.end,.82)],c.collar,1.20);
        hand(c,sol.end,sol.joint,angle);
        tests.push({kind:"arm",anchor:world(a),joint:world(sol.joint),end:world(sol.end),target:world(target),error:sol.error,scale:s,lengths:c.arms});
      }
      const shoulder=bodyPoint(c.shoulder),farShoulder=bodyPoint(c.otherShoulder);
      const hang=c.arms[0]+c.arms[1]-1.7;
      sleeve(farShoulder,farWrist?local(farWrist):add(farShoulder,[4+step*3,hang-2.4]),true,null);
      const h=bodyPoint(c.head);
      head(name,...h,lean*.42+headTilt,{t,mouth,front,pose});
      at(...pelvis,1,1,lean,()=>jacket(name,c));
      const nearWrist=front&&!wrist?add(shoulder,[-13.6,hang-3]):add(shoulder,[1.4+step*5.3,hang]);
      sleeve(shoulder,wrist?point(nearWrist,local(wrist),wristBlend):nearWrist,false,handAngle);
    });
    return tests;
  }
  return {head,body};
}

module.exports={cast,point,length,solve,contour};