"use strict";
const {clamp,ease,mix,rgba}=require("./draw.cjs");

const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
const mul=(a,f)=>[a[0]*f,a[1]*f];
const length=(a)=>Math.hypot(...a);
const unit=(a)=>mul(a,1/Math.max(length(a),1e-6));
const left=(a)=>[-a[1],a[0]];
function point(a,b,t){ return [mix(a[0],b[0],t),mix(a[1],b[1],t)]; }
function rotate([x,y],a){return [x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];}

const COLORS = {
  yu:{coat:"#4c5b6b", sleeve:"#465568", far:"#303d4b", seam:"#697789", pants:"#2d3947",
      farPants:"#232e3b", skin:"#a78470", shadow:"#80675b", hair:"#202a34", rim:"#64788b", h:.84},
  mei:{coat:"#8b704d", sleeve:"#806346", far:"#62513c", seam:"#ad8c63", pants:"#3b3f49",
      farPants:"#2f3440", skin:"#b18c76", shadow:"#876a5d", hair:"#2a2932", rim:"#b49670", h:.84},
  son:{coat:"#506b7c", sleeve:"#4d6072", far:"#374951", seam:"#6c8590", pants:"#39475a",
      farPants:"#2b3948", skin:"#b08a77", shadow:"#8f7365", hair:"#27313b", rim:"#8294a0", h:.98},
  uncle:{coat:"#556356", sleeve:"#4d5a4f", far:"#39453c", seam:"#738175", pants:"#343939",
      farPants:"#2a3031", skin:"#a17d67", shadow:"#795e53", hair:"#2e3030", rim:"#879083", h:.84}
};

function solve(a,target,l1,l2,side) {
  const delta=sub(target,a);
  const reach=length(delta);
  const direction=reach>1e-5?mul(delta,1/reach):[0,1];
  const d=clamp(reach,Math.abs(l1-l2)+.15,l1+l2-.06);
  const along=(l1*l1+d*d-l2*l2)/(2*d);
  const bend=Math.sqrt(Math.max(0,l1*l1-along*along))*side;
  return {joint:add(add(a,mul(direction,along)),mul(left(direction),bend)),end:add(a,mul(direction,d)),error:Math.abs(reach-d)};
}

function contour(b,a,k,z,w0,w1,w2,fill,edge,highlight) {
  const {g,line}=b;
  const n0=left(unit(sub(k,a)));
  const n1=left(unit(sub(z,k)));
  const med=unit(add(n0,n1));
  const topL=add(a,mul(n0,w0)), topR=sub(a,mul(n0,w0));
  const endL=add(z,mul(n1,w2)), endR=sub(z,mul(n1,w2));
  const jointL=add(k,mul(med,w1)), jointR=sub(k,mul(med,w1));
  const mid0=point(a,k,.73), mid1=point(k,z,.24);
  g.beginPath();g.moveTo(...topL);
  g.lineTo(...add(mid0,mul(n0,w1)));
  g.quadraticCurveTo(...jointL,...add(mid1,mul(n1,w1)));
  g.lineTo(...endL);g.quadraticCurveTo(...add(z,mul(unit(sub(z,k)),.6)),...endR);
  g.lineTo(...sub(mid1,mul(n1,w1)));
  g.quadraticCurveTo(...jointR,...sub(mid0,mul(n0,w1)));
  g.lineTo(...topR);g.quadraticCurveTo(...sub(a,mul(unit(sub(k,a)),1)),...topL);
  g.closePath();g.fillStyle=fill;g.fill();
  if(edge){g.strokeStyle=edge;g.lineWidth=.51;g.stroke();}
  if(highlight){
    const edge0=sub(point(a,k,.32),mul(n0,w0*.58));
    const edge1=sub(point(a,k,.78),mul(n0,w1*.63));
    line([edge0,edge1],highlight,.57);
  }
}
function cuff(b,z,a,w,fill) {
  const along=unit(sub(z,a)),n=left(along),c=sub(z,mul(along,3.3));
  b.poly([add(z,mul(n,w)),sub(z,mul(n,w)),sub(c,mul(n,w+.32)),add(c,mul(n,w+.32))],fill);
}
function cast(b) {
  const {g,path,line,ell,at,glow,grad,poly}=b;

  function head(style,x,y,angle=0,mouth=0,t=0,light=1) {
    const c=COLORS[style], s=c.h;
    const fast=(t+({yu:1.10,mei:.5,son:2.81,uncle:3.65}[style]))%5.3;
    const eye=1-.96*ease(fast,5.00,5.066)*(1-ease(fast,5.07,5.16));
    at(x,y,s,s,angle,()=>{
      path("M-6 8 L7 9 L7 23 Q0 27 -8 21 L-7 17Z",c.shadow);
      path("M-12 -8 C-12 -15 -7 -20 .2 -20.1 C8 -20.4 13.2 -16.4 13.5 -10.4 L13.3 -6.9 Q13.8 -4.4 16.6 -.3 Q17.4 1.1 15.1 1.6 L13.4 1.6 L13.3 6.0 Q12.8 10.6 8.1 12.5 Q2.8 14.2 -3.5 10.3 Q-9.8 8.1 -11.9 1.4Z",c.skin);
      path("M-11.4 -4.1 C-9.8 4.6 -5.8 7.6 -.9 10.7 Q2.7 12.5 7.8 12.55 Q2.8 14.2 -3.5 10.3 Q-9.8 8.1 -11.9 1.4Z",c.shadow);
      if (style==="mei") {
        path("M-10.7 -13.8 C-13.8 -16.5 -18.7 -14.5 -20.0 -9.9 Q-22.5 -2.8 -15.2 -.64 L-9.8 -3.4Z",c.hair);
        path("M-12 5 C-16.4 2.6 -16.9 -6.0 -15.7 -11.8 C-14 -20.7 3.2 -25.4 10.5 -17.1 Q14.7 -12.9 13.3 -10.4 C9.6 -9.9 3.8 -11.5 .6 -13.2 C-2.7 -8.2 -6 -5.6 -7.7 -2.4 L-8.6 4.2Z",c.hair);
        line([[-12,-5],[-8.7,-11.5],[-3.7,-16.0]],rgba("a09293",.25),.67);
      } else {
        const crown=style==="son"?"M-12.3 1.4 Q-17.7 -3.6 -15.3 -12.6 C-12.2 -24.5 9.6 -23.9 13.2 -15 Q14 -12 13.2 -8.8 Q8 -10 4 -10.4 Q-1 -10.5 -5.8 -8.4 L-8.5 -1.4Z":
        "M-12.3 2.3 Q-16.5 -2.3 -14.4 -11.8 C-12 -21.4 -2.5 -23.6 5.4 -20.8 Q10.7 -20.3 13.8 -15.4 Q16.1 -11.8 13.2 -9.3 L9.1 -10.7 L6.9 -9.1 Q1.9 -10.0 -2.2 -12.7 Q-5.1 -11.7 -7.7 -4.5 L-8.9 -1.4 L-9.2 3.0Z";
        path(crown,c.hair);
        path("M-12.1 -9.9 Q-7.7 -17.0 -1.8 -17.6 Q3.4 -18.4 8.5 -15.8",null,rgba("8394a0",.29),.67);
      }
      path("M-7 -3.3 Q-8.8 -5.4 -9.6 -2.3 Q-10.0 1.5 -7.6 3.4 Q-6.2 3.2 -5.8 .8Z",c.shadow);
      line([[-8.1,-1.45],[-6.9,-1.9],[-6.6,-.42]],rgba("bfa390",.5),.53);
      path("M7.0 -4.7 Q9.5 -5.7 11.8 -4.7",null,c.hair,.82);
      ell(10.0,-2.5,1.39,.90*eye,c.hair);
      if(eye>.55)ell(10.5,-2.8,.32,.32,rgba("e4ddc9",.64));
      path("M13.25 2.36 Q12.5 2.5 12.2 2.0",null,rgba("533f39",.58),.5);
      const gape=clamp(mouth,0,.8);
      if (gape>.075) {
        path("M9.1 5.75 Q11.8 "+(5.49+gape*.32)+" 13.2 5.7 Q12.78 "+(6.7+gape*1.62)+" 10.85 "+(6.45+gape*1.14)+" Q9.7 "+(6.18+gape*.66)+" 9.1 5.75Z","#684a45");
      } else path("M9.5 6.1 Q11.73 6.0 13.2 5.78",null,"#76534b",.64);
      if(style==="uncle"){
        path("M6 7 Q9.5 8 13.0 7.45 Q12.0 11.7 7.9 12.15 Q6.5 10.4 6 7Z",rgba("544946",.35));
      }
      path("M11.1 -9.7 Q13.1 -7.3 13.45 -5.2",null,rgba("e4b296",.25*light),.54);
    });
  }

  function hand(c,wrist,elbow,hold=0,angle=null) {
    const a=angle==null?Math.atan2(wrist[1]-elbow[1],wrist[0]-elbow[0]):angle;
    at(wrist[0],wrist[1],1,1,a,()=>{
      path("M-1 -3.2 Q3.1 -4.0 5.65 -2.42 Q8.0 -2.25 9.35 -.6 L9.3 2.0 Q8.85 4.75 6.75 4.57 L4.9 4.7 Q2.9 3.8 1.76 2.55 L-1.3 2.66Z",c.skin,c.shadow,.48);
      const n=clamp(hold);
      path("M2.45 -1.5 Q5.2 "+(-3.8+n*.98)+" 7.9 "+(-2.95+n*1.58)+" Q9 -2.0 7.7 -1.2 L6.3 -.7",c.skin,c.shadow,.42);
      line([[7.85,.65],[8.85,.45]],rgba("6a5147",.74),.39);
      line([[7.60,1.75],[8.55,1.64]],rgba("6a5147",.71),.36);
      line([[7.24,2.91],[8.18,2.83]],rgba("6a5147",.67),.35);
    });
  }

  function shoe(a,tilt,colors){
    at(a[0],a[1]+6.0,1,1,tilt,()=>{
      path("M-5.95 0.7 L-5.72 -6.85 Q-2 -8.4 4.2 -6.9 L7.75 -3.8 Q11 -2.77 13.9 -2.69 Q16.22 -2.35 16.45 -.62 L16.53 .8 Q5.20 1.69 -5.95 .7Z",colors.pants,"#18232d",.45);
      path("M-5.9 .35 Q3.7 1.27 16.35 .54 L16.12 1.86 Q6.0 2.48 -5.95 1.80Z","#73808a");
      line([[2.35,-5.43],[7.03,-3.62]],rgba("9ba6ab",.37),.52);
    });
  }

  function body(style,opts) {
    const {x,y,scale:s=1,dir=1,t=0,lean=0,drop=0,mouth=0,headTilt=0,feet=null,wrist=null,handAngle=null,
      grip=0,farWrist=null,suppressHand=false,depth=1,step=0}=opts;
    const col=COLORS[style];
    const nearLen=[40,39],armLen=[28,24];
    const world=v=>[x+v[0]*s*dir,y+v[1]*s];
    const local=v=>[(v[0]-x)/s*dir,(v[1]-y)/s];
    const contact=feet||[[x-6*s*dir,y],[x+5*s*dir,y]];
    const contactData=contact.map(entry=>Array.isArray(entry)?{p:entry,ground:y,roll:0}:entry);
    // Lower the pelvis only as far as a fixed-length leg needs for its furthest contact.
    const required=contactData.map((foot,i)=>{
      const p=local(foot.p), hipX=i===0?-4:1.5, hipBias=i===0?1.4:0;
      const xDistance=p[0]-3.0-hipX;
      const allowance=Math.sqrt(Math.max(0,78.62*78.62-xDistance*xDistance));
      return 86.4+p[1]-7.85-hipBias-allowance;
    });
    const pelvis=[0,-86.4+Math.max(drop,...required)];
    const bodyPoint=v=>add(pelvis,rotate(v,lean));
    const tests=[];
    g.save();g.globalAlpha*=depth;
    for(const [i,f] of contactData.entries()){
      const d=Math.max(0,f.ground-f.p[1]);
      if(d<22*s){
        glow(f.p[0]+3.8*s*dir,f.ground+1.2*s,20*s+d*.43,4.3*s+d*.16,"060d15",.51*(1-d/(24*s)));
      }
    }
    at(x,y,s*dir,s,0,()=>{
      for (let i=0;i<2;i++){
        const far=i===0,f=contactData[i];
        const p=local(f.p);
        const ankle=add(p,[-3.0,-7.85]);
        const hip=add(pelvis,[far?-4:1.5,far?1.4:0.]);
        const sol=solve(hip,ankle,nearLen[0],nearLen[1],-1);
        const c=far?col.farPants:col.pants;
        contour(b,hip,sol.joint,sol.end,far?9.2:10.1,far?5.0:5.9,4.2,c,rgba("141e2b",.67),far?null:rgba("9daac4",.24));
        shoe(sol.end,f.roll||0,{pants:c});
        tests.push({kind:"leg",anchor:world(hip),joint:world(sol.joint),end:world(sol.end),target:world(ankle),contact:f.p,ground:f.ground,error:sol.error,scale:s});
      }
      const shoulder=bodyPoint([-2.8,-53.9]), farShoulder=bodyPoint([4.2,-52.4]);
      function sleeve(shoulder,target,far,pinch,angle){
        const sol=solve(shoulder,target,armLen[0],armLen[1],1);
        const from=add(shoulder,mul(unit(sub(shoulder,sol.joint)),2.2));
        contour(b,from,sol.joint,sol.end,far?6.9:8.8,far?4.7:5.7,far?3.9:4.5,far?col.far:col.sleeve,rgba("192632",.59),far?null:rgba("b5b6b2",.28));
        cuff(b,sol.end,sol.joint,far?3.9:4.5,far?col.far:col.coat);
        if (!(suppressHand&&!far)) hand(col,sol.end,sol.joint,pinch,angle);
        tests.push({kind:"arm",anchor:world(shoulder),joint:world(sol.joint),end:world(sol.end),target:world(target),error:sol.error,scale:s});
      }
      sleeve(farShoulder,farWrist?local(farWrist):add(farShoulder,[5+step*3,48]),true,.05,null);
      at(pelvis[0],pelvis[1],1,1,lean,()=>{
        path("M-7 -60 Q-9 -63 -5 -66 L7 -66 Q10 -64 9 -58 L5 -55Z",col.shadow);
        path("M-8.2 -61 Q-16.4 -58.8 -17.0 -51.3 Q-19.0 -36.4 -16.6 -20.8 L-14.4 -1.1 Q-8.0 4.8 12.6 1.5 L14.6 -9.4 Q14.5 -20.8 15.4 -30.0 Q16.3 -44.7 11.4 -55.0 L7.75 -59.0 Q1.9 -55.9 -8.2 -61Z",col.coat,rgba("17222a",.63),.69);
        path("M-15.6 -51.7 Q-12.8 -58.8 -7.7 -59.9 Q-1.1 -56.1 7.9 -58.3",null,rgba(col.rim.slice(1),.74),.74);
        path("M7.6 -58.9 Q12.8 -52.6 12.0 -41.0 L11.2 -7 Q8.9 -3.4 9.2 .48",null,rgba("27333e",.62),.92);
        path("M-12.6 -2.1 Q-5.6 1.0 10.7 -.55",null,rgba(col.seam.slice(1),.56),.62);
        if(style==="yu"){
          path("M-10 -57.2 Q-12 -59 -10.5 -62.2 Q-5.9 -62.5 -1.0 -57.3 Q1.6 -55.2 6.5 -56.8 L5.0 -52.1 Q-1.9 -51.1 -8.2 -53.3Z",col.far);
          line([[7.1,-54.3],[8,-46.1],[7.7,-43.2]],rgba("bac0ba",.54),.58);
        }
        if(style==="mei"){
          line([[11.0,-28.8],[5.0,-26.9],[4.5,-22.4]],rgba("5a4839",.65),.64);
        }
      });
      const target=wrist?local(wrist):add(shoulder,[1.4+step*5.3,50.4]);
      sleeve(shoulder,target,false,grip,handAngle);
      const h=bodyPoint([1.95,-73]);
      head(style,h[0],h[1],lean*.42+headTilt,mouth,t,depth);
    });
    g.restore();
    return tests;
  }
  return {head,body};
}
module.exports={cast,solve,point,length,COLORS};
