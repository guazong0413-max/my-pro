"use strict";

const {clamp,mix}=require("./draw.cjs");
const {solve,contour}=require("./character.cjs");

const LINK_COUNT=10;
const MOUNT_DISTANCE=15.5;
const DOOR_TRAVEL=38;
const CHAIN_LENGTH=MOUNT_DISTANCE+DOOR_TRAVEL;

function chainGeometry(a,z,length) {
  const chord=Math.hypot(z[0]-a[0],z[1]-a[1]);
  const evaluate=(q,sag)=>[mix(a[0],z[0],q),mix(a[1],z[1],q)+4*sag*q*(1-q)];
  function measure(sag){
    const samples=[{point:a,distance:0}];
    for(let i=1;i<=48;i++){
      const point=evaluate(i/48,sag);
      const previous=samples[i-1];
      samples.push({point,distance:previous.distance+Math.hypot(point[0]-previous.point[0],point[1]-previous.point[1])});
    }
    return samples;
  }
  let lower=0,upper=length*.5;
  if(chord>=length-.005)upper=0;
  for(let i=0;i<15&&upper-lower>.003;i++){
    const mid=(lower+upper)*.5;
    if(measure(mid).at(-1).distance>length)upper=mid;
    else lower=mid;
  }
  const sag=(lower+upper)*.5,samples=measure(sag),measured=samples.at(-1).distance;
  const interval=measured/LINK_COUNT;
  let j=1;
  const links=Array.from({length:LINK_COUNT},(_,i)=>{
    const distance=interval*(i+.5);
    while(samples[j].distance<distance)j++;
    const u=(distance-samples[j-1].distance)/(samples[j].distance-samples[j-1].distance);
    const q=(j-1+u)/48;
    const angle=Math.atan2(z[1]-a[1]+4*sag*(1-2*q),z[0]-a[0]);
    return {point:evaluate(q,sag),angle};
  });
  return {links,sag,interval,measured};
}

function fittings(b) {
  const {g,path,poly,rect,box,ell,grad,glow,line,at}=b;

  function doorChain(frameMount,leafMount,scale=1) {
    const [ax,ay]=frameMount,[zx,zy]=leafMount;
    at(ax,ay,scale,scale,0,()=>{
      box(-9,-5.5,12.5,11,1.7,"#736e61","#98927d",.57);
      ell(-6.05,0,1.16,1.16,"#484740");
      ell(-.12,.0,2.8,2.45,"#484943","#b5a78d",.85);
    });
    at(zx,zy,scale,scale,0,()=>{
      box(-3,-4.9,22.5,9.8,1.6,"#726f62","#958e7b",.56);
      box(-.9,-1.7,14.2,3.4,1.7,"#3b3e3a");
      line([[2,1.6],[12.85,1.6]],"#a9a089",.52);
      ell(15.8,0,1.18,1.18,"#474641");
      ell(.25,0,2.2,2.2,"#a69b84","#454640",.56);
    });
    const chain=chainGeometry(frameMount,leafMount,CHAIN_LENGTH*scale);
    for(const [i,{point:[x,y],angle}] of chain.links.entries()){
      const ry=(i%2===0?1.55:.94)*scale;
      ell(x,y,chain.interval*.66,ry,null,"#22292d",1.56*scale,angle);
      ell(x,y,chain.interval*.66,ry,null,i%2===0?"#c2b396":"#a79c85",.77*scale,angle);
    }
    return chain;
  }

  function doorGap(open,cy,light=.1) {
    const mount=3.57;
    const x=397;
    const gap=DOOR_TRAVEL*clamp(open)*mount;
    const start=x+16;
    const leaf=x+MOUNT_DISTANCE*mount+gap-22;
    const slope=.096;
    const edge=(xx,y)=>xx+(y-cy)*slope;
    rect(-80,-120,1130,780,"#17232e");
    poly([[-80,-100],[edge(start,-100),-100],[edge(start,660),660],[-80,660]],
      grad(-25,0,380,560,[[0,"#344451"],[.67,"#263845"],[1,"#24323e"]]));
    poly([[edge(start-13,-100),-100],[edge(start,-100),-100],[edge(start,660),660],[edge(start-13,660),660]],"#46505a");
    poly([[edge(leaf,-100),-100],[1050,-100],[1050,660],[edge(leaf,660),660]],
      grad(leaf,50,930,485,[[0,"#374452"],[.52,"#2d3b4b"],[1,"#273645"]]));
    line([[edge(leaf,-100),-100],[edge(leaf,660),660]],"#617076",2.5);
    line([[edge(leaf+17,-100),-100],[edge(leaf+17,660),660]],"#455762",1.6);
    path("M"+edge(leaf+33,80)+" 80 H1020 M"+edge(leaf+56,314)+" 314 H1020",null,"#465662",2);
    glow(478,cy+90,215,206,"adac91",light);
    const a=[x,cy],z=[x+(MOUNT_DISTANCE+DOOR_TRAVEL*clamp(open))*mount,cy];
    return {a,z,...doorChain(a,z,mount)};
  }

  function sleeve(wrist,side,role,scale=1) {
    const warm=role==="mei";
    const coat=warm?"#96734c":"#5e6a77";
    at(wrist[0],wrist[1],side*scale,scale,0,()=>{
      const shoulder=[-235,-29];
      const {joint:k}=solve(shoulder,[0,0],116,146,1);
      const armStart=[-354,-62];
      contour(g,armStart,k,[0,0],[41,26,15],coat);
      path("M-12 -15 Q-5 -15 .5 -14.7 L.5 14.7 L-11 17Z",warm?"#a38259":"#687581");
    });
  }

  function closeHand(wrist,side,role,grip,top=false,scale=1) {
    const skin=role==="mei"?"#c7a08a":"#b89983";
    const shadow=role==="mei"?"#876757":"#806658";
    const K=1-clamp(grip);
    at(wrist[0],wrist[1],side*scale,scale,0,()=>{
      if(!top){
        path("M-2 -12 Q9 -15 19 -13 Q25 -11 31 -6 L34 5 Q27 14 17 15 L-2 10Z",skin);
        path("M-2 7 Q10 7 19 11 L28 9 Q25 15 17 15 L-2 10Z",shadow);
        return;
      }
      // The four fingertips share the palm silhouette. The thumb closes from above.
      const first=53+7*K, middle=55+9*K, ring=49+8*K, small=43+7*K;
      const spread=6*K;
      path("M15 -8 Q23 -12 33 -10 L"+(first-4)+" "+(-10-spread)+" Q"+(first+3)+" "+(-10-spread)+" "+first+" "+(-4-spread)+" L"+(middle-1)+" "+(-3-spread*.51)+" Q"+(middle+4)+" "+(-2-spread*.51)+" "+middle+" "+(3-spread*.51)+" L"+ring+" 5 Q"+(ring+5)+" 6 "+ring+" 10 L"+small+" 12 Q"+(small+3)+" 16 "+(small-3)+" 17 Q26 21 16 14 Q11 7 15 -8Z",skin,shadow,.82);
      path("M38 -3 Q"+(first-7)+" "+(-3-spread)+" "+first+" "+(-4-spread)+
        " M36 5 Q45 4 "+middle+" "+(3-spread*.51)+" M31 10 Q42 10 "+ring+" 10",null,shadow,.88);
      const tuck=11*K;
      path("M3 -10 Q10 -22 21 -21 Q27 -21 "+(39-tuck)+" "+(-15-tuck*.20)+" Q44 -12 40 -8 Q38 -6 33 -8 L23 -12 Q18 -10 13 -7 Q7 -5 3 -10Z",skin,shadow,.90);
    });
  }
  return {doorChain,doorGap,sleeve,closeHand};
}

module.exports={fittings,chainGeometry,MOUNT_DISTANCE,CHAIN_LENGTH,LINK_COUNT};