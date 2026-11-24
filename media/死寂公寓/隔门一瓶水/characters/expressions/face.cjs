"use strict";

const {P,E,L,layer}=require("../art.cjs");
const {SKIN}=require("../faces.cjs");
const {clamp,mix,shape}=require("./moves.cjs");

function eye(x,y,back,front,brow,weight,iris,upper=.0){
  return {x,y,back,front,brow,weight,iris,upper};
}
const keys={
  yu:{
    front:{
      replace:[5,6,7,8,10,11], jaw:[1,2], hinge:17.1,
      eyes:[eye(-5.70,13.22,2.02,1.85,10.73,.66,.72),eye(5.34,13.10,2.01,1.82,10.39,.66,.72)],
      mouth:[.23,20.61,2.90], ink:"#494441"
    },
    side:{
      replace:[6,7,8,10,11],jaw:[0,1],hinge:16.7,
      eyes:[eye(9.66,13.59,1.94,1.29,11.25,.69,.71)],mouth:[8.86,12.20,20.30],ink:"#494441"
    }
  },
  mei:{
    front:{
      replace:[8,9,10,11,13,14],jaw:[4,5],hinge:23.1,
      eyes:[eye(-5.29,19.31,1.94,1.75,16.72,.52,.64,.12),eye(5.19,18.92,1.90,1.74,16.20,.52,.64,.12)],
      mouth:[.08,26.08,2.84],ink:"#584340"
    },
    side:{
      replace:[8,9,10,12,13],jaw:[3,4],hinge:23.75,
      eyes:[eye(9.25,20.14,1.83,1.19,17.63,.55,.68,.06)],mouth:[8.86,12.06,26.44],ink:"#57413c"
    }
  },
  xu:{
    front:{
      replace:[5,6,7,9],jaw:[1,2],hinge:16.4,
      eyes:[eye(-5.30,13.47,1.69,1.56,11.26,.47,.84,.30),eye(5.24,13.33,1.71,1.63,11.21,.48,.82,.27)],
      mouth:[.05,19.07,2.11],ink:"#51453e"
    },
    side:{
      replace:[5,6,7],jaw:[0,1],hinge:15.8,
      eyes:[eye(9.34,12.98,1.66,1.22,11.23,.51,.84,.26)],mouth:[9.18,12.02,18.25],ink:"#51443e"
    }
  },
  uncle:{
    front:{
      replace:[6,7,8,9,12],jaw:[1,2,11,14],hinge:18.9,
      eyes:[eye(-6.48,14.72,2.26,2.13,11.66,.97,.76,-.10),eye(6.42,14.58,2.17,2.06,11.59,1.03,.73,-.10)],
      mouth:[.26,21.88,4.06],ink:"#514740"
    },
    side:{
      replace:[7,8,9,12],jaw:[0,1,11],hinge:18.12,
      eyes:[eye(10.12,14.77,2.05,1.52,11.77,.98,.80,-.11)],mouth:[9.00,13.03,22.08],ink:"#51453c"
    }
  }
};
const n=x=>Math.round(x*1000)/1000;
const xy=(x,y)=>n(x)+" "+n(y);
function tint(a,b,u){
  const decode=(hex,at)=>Number.parseInt(hex.slice(at,at+2),16);
  return "#"+[1,3,5].map(at=>Math.round(mix(decode(a,at),decode(b,at),clamp(u))).toString(16).padStart(2,"0")).join("");
}

function jawWarp(item,config,pose,side){
  if(pose.jaw<.003||item.tag!=="path")return item;
  const pieces=item.d.match(/[MLQCZ]|-?(?:\d+(?:\.\d*)?|\.\d+)/g);
  let nextX=true,x=0;
  const parts=pieces.map(token=>{
    if(/[MLQCZ]/.test(token)){nextX=true;return token;}
    const value=Number(token);
    if(nextX){x=value;nextX=false;return n(value);}
    nextX=true;
    const fall=clamp((value-config.hinge)/7.8,0,1.08);
    const movement=side?mix(.32,1.,clamp((x+7)/19)):1.;
    return n(value+pose.jaw*fall*movement);
  });
  return {...item,d:parts.join(" ")};
}

function eyebrows(eye,pose,isSide,sideIndex,ink){
  const towards=isSide||sideIndex===0?1:-1;
  const asym=isSide?.72:sideIndex===0?1:-.52;
  const cx=eye.x+.08*towards;
  const outerX=cx-towards*(eye.back+.18);
  const innerX=cx+towards*(eye.front+.13);
  const shift=pose.uneven*asym;
  const outerY=eye.brow+.14+pose.outer-.50*shift;
  const innerY=eye.brow+.10+pose.inner-.39*shift;
  const midX=(outerX+innerX)/2-towards*.16;
  const midY=(outerY+innerY)*.5-(eye.weight>.8?.57:.82)-pose.arch;
  const w=eye.weight;
  return P("M"+xy(outerX,outerY)+" Q"+xy(midX,midY-w*.41)+" "+xy(innerX,innerY-w*.37)+
    " L"+xy(innerX,innerY+w*.25)+" Q"+xy(midX,midY+w*.57)+" "+xy(outerX,outerY+w*.31)+"Z",ink);
}

function eyes(eye,pose,isSide,index,skin,ink){
  const towards=isSide||index===0?1:-1;
  const asym=isSide?.28:index===0?.45:-.29;
  const cx=eye.x,cy=eye.y;
  const squint=pose.uneven*asym*.20;
  const blinkScale=1-.984*pose.blink;
  const aperture=clamp((pose.eye+squint)*blinkScale,.018,2.04);
  const up=aperture*(1.42+eye.upper), down=aperture*clamp(1.08-pose.lower,.44,1.60);
  const xOut=cx-towards*eye.back,xIn=cx+towards*eye.front;
  const yOut=cy-.055+.06*pose.smile;
  const yIn=cy+.08+.18*Math.max(0,pose.inner);
  const midX=cx-towards*.11, midY=(yIn+yOut)/2;
  const high="M"+xy(xOut,yOut)+" Q"+xy(midX,midY-up)+" "+xy(xIn,yIn);
  const low=" Q"+xy(midX,midY+down)+" "+xy(xOut,yOut);
  const eyeLine=tint(ink,skin.shade,.21);
  if(aperture<.13)return [L("M"+xy(xOut,yOut)+" Q"+xy(midX,midY+.24)+" "+xy(xIn,yIn),eyeLine,.43)];
  const backdrop=tint(skin.main,"#e1d6c3",.085+.57*clamp((aperture-.87)*.90));
  const color=tint(ink,"#262824",.24);
  const irisRx=Math.min(eye.iris,.58+aperture*.22);
  const irisRy=Math.min(eye.iris*Math.min(aperture,.99),up*.48,down*.66);
  const gx=clamp(pose.gaze*(isSide?.49:.61),-.51,.51);
  const by=clamp(midY+pose.down*.52,midY-up*.33+irisRy*.58,midY+down*.42-irisRy*.45);
  const out=[
    P(high+low+"Z",backdrop),
    E(cx+gx,by,irisRx,Math.max(.04,irisRy),color),
    L(high,eyeLine,.40),
    L("M"+xy(xIn,yIn)+low,tint(eyeLine,skin.main,.76-.22*clamp(aperture-1)),.20)
  ];
  if(aperture>.85)out.splice(2,0,E(cx+gx-.16,by-.13,.145,.148,tint(skin.light,"#f2e2c8",.53)));
  return out;
}

function lipsFront(config,p,skin,ink){
  const [x,y,span]=config.mouth;
  const w=span*p.width;
  const z=y+.16*p.jaw;
  const lipEdge=tint(skin.mouth,ink,.16+.14*p.press);
  const l=z-p.smile*.60+p.skew*.24, r=z-p.smile*.60-p.skew*.18;
  const mid=z+.33*p.smile;
  const from=x-w,to=x+w;
  const h=Math.max(0,p.lips-.13);
  if(h<.17){
    const lip="M"+xy(from,l)+" Q"+xy(x-w*.45,mid-.29)+" "+xy(x,mid)+
                 " Q"+xy(x+w*.43,mid+.09)+" "+xy(to,r);
    return [
      L(lip,lipEdge,.41+.19*p.press),
      L("M"+xy(x-w*.27,z+1.08)+" Q"+xy(x,z+1.31)+" "+xy(x+w*.34,z+1.04),tint(skin.light,skin.main,.44),.29)
    ];
  }
  const upper=mid-h*.40,lower=mid+h*.68;
  const curve="M"+xy(from,l)+" C"+xy(x-w*.76,l-h*.27)+" "+xy(x-w*.32,upper)+" "+xy(x,upper)+
    " C"+xy(x+w*.37,upper)+" "+xy(x+w*.84,r-h*.22)+" "+xy(to,r)+
    " C"+xy(x+w*.80,r+h*.39)+" "+xy(x+w*.40,lower)+" "+xy(x,lower)+
    " C"+xy(x-w*.45,lower)+" "+xy(x-w*.87,l+h*.39)+" "+xy(from,l)+"Z";
  const result=[P(curve,tint("#523c39",skin.mouth,.13),lipEdge,.31)];
  if(p.smile>.56&&h>.49){
    const tooth=tint("#e5d9bd",skin.main,.28);
    result.push(P("M"+xy(x-w*.56,upper+.09)+" Q"+xy(x,upper-.05)+" "+xy(x+w*.56,upper+.10)+
      " Q"+xy(x+w*.31,upper+h*.30)+" "+xy(x-w*.47,upper+h*.32)+"Z",tooth));
  }
  result.push(L("M"+xy(x-w*.35,lower+.51)+" Q"+xy(x,lower+.70)+" "+xy(x+w*.34,lower+.53),tint(skin.main,skin.light,.68),.31));
  return result;
}

function lipsSide(config,p,skin,ink){
  const [base,edge,y]=config.mouth;
  const z=y+.20*p.jaw;
  const x=base+(edge-base)*(.98-p.width);
  const lipEdge=tint(skin.mouth,ink,.18+.13*p.press);
  const start=z-.66*p.smile+.15*p.skew;
  const end=z-.03+.12*p.jaw;
  const mid=mix(x,edge,.61), h=Math.max(0,p.lips-.13);
  if(h<.17){
    return [
      L("M"+xy(x,start)+" Q"+xy(mid,z+.37*p.smile)+" "+xy(edge,end),lipEdge,.43+.17*p.press),
      L("M"+xy(x+.61,z+1.41)+" Q"+xy(mid,z+1.46)+" "+xy(edge-.48,z+1.21),tint(skin.light,skin.main,.40),.29)
    ];
  }
  const upper=z-h*.38,lower=z+h*.65;
  const curve="M"+xy(x,start)+" Q"+xy(mid-.19,upper)+" "+xy(edge-.10,upper+.08)+
    " Q"+xy(edge+.10,z)+" "+xy(edge-.24,z+h*.37)+
    " Q"+xy(mid-.38,lower)+" "+xy(x,start)+"Z";
  const result=[P(curve,tint("#503a37",skin.mouth,.15),lipEdge,.30)];
  if(p.smile>.57&&h>.52){
    result.push(L("M"+xy(x+.69,upper+.22)+" Q"+xy(mid,upper+.25)+" "+xy(edge-.40,upper+.29),tint("#e5d9bd",skin.main,.34),.26));
  }
  result.push(L("M"+xy(x+.57,lower+.57)+" Q"+xy(mid,lower+.67)+" "+xy(edge-.55,lower+.39),tint(skin.main,skin.light,.59),.27));
  return result;
}

function cheeks(config,p,skin,side){
  const amount=clamp(p.cheek);
  if(amount<.055)return [];
  const tone=tint(skin.main,skin.mouth,amount*.34);
  const items=[];
  for(const [i,e] of config.eyes.entries()){
    const outer=side||i===0?-1:1;
    const x=e.x+outer*(e.back-.36), y=e.y+1.96-.23*amount;
    items.push(L("M"+xy(x-outer*.41,y+.20)+" Q"+xy(x,y-.14)+" "+xy(x+outer*.65,y-.38),tone,.27+amount*.20));
  }
  return items;
}

function faceParts(model,view,pose){
  const config=keys[model.id][view],skin=SKIN[model.id],side=view==="side";
  const neutral=model.views[view].layers.find(row=>row.id==="head").items;
  const keep=neutral.map((item,i)=>{
    if(config.replace.includes(i))return null;
    return config.jaw.includes(i)?jawWarp(item,config,pose,side):item;
  }).filter(Boolean);
  const brow=config.eyes.map((e,i)=>eyebrows(e,pose,side,i,config.ink));
  const lids=config.eyes.flatMap((e,i)=>eyes(e,pose,side,i,skin,config.ink));
  const lips=side?lipsSide(config,pose,skin,config.ink):lipsFront(config,pose,skin,config.ink);
  return {base:keep,brow,eyes:lids,lips:[...cheeks(config,pose,skin,side),...lips]};
}

function expressionModel(model,view,pose){
  const set=faceParts(model,view,pose);
  const layers=model.views[view].layers.flatMap(row=>{
    if(row.id!=="head")return [row];
    return [
      {...row,items:set.base},
      layer("expression-brows",set.brow,"head"),
      layer("expression-eyes",set.eyes,"head"),
      layer("expression-mouth",set.lips,"head")
    ];
  });
  return {...model,views:{...model.views,[view]:{layers}}};
}

module.exports={faceParts,expressionModel,standPose:shape};
