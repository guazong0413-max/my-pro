"use strict";

const {P,E,L,layer,group}=require("../art.cjs");
const {SKIN}=require("../faces.cjs");

const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function smooth(t,from,to){
  const p=clamp((t-from)/(to-from));
  return p*p*(3-2*p);
}
const f=x=>Math.round(x*1000)/1000;
const xy=(x,y)=>f(x)+" "+f(y);

const REST={eyes:1,gaze:0,lift:0,brow:0,slant:0,uneven:0,mouth:"rest",tilt:0};
const keys={
  neutral:{},
  doubt:{eyes:.98,gaze:-.26,brow:-.07,slant:.18,uneven:.23,mouth:"press",tilt:.5},
  alert:{eyes:1.05,gaze:.23,lift:-.08,brow:-.15,slant:-.02,mouth:"press",tilt:-.38},
  surprise:{eyes:1.10,gaze:.06,lift:-.07,brow:-.39,slant:-.01,mouth:"round",tilt:-.68},
  worry:{eyes:1.01,gaze:-.19,lift:.12,brow:-.05,slant:-.32,uneven:.04,mouth:"frown",tilt:.75},
  sad:{eyes:.93,gaze:.07,lift:.19,brow:.04,slant:-.13,mouth:"frown",tilt:1.06},
  anger:{eyes:.92,gaze:.09,brow:.13,slant:.34,uneven:.13,mouth:"press",tilt:.52},
  relief:{eyes:.97,gaze:.11,brow:.03,slant:-.04,uneven:.10,mouth:"smile",tilt:-.12}
};
const people={
  yu:{
    bias:{doubt:{gaze:-.33,uneven:.33,tilt:.54},alert:{gaze:.29},surprise:{brow:-.37},sad:{tilt:.87},relief:{mouth:"smile"}},
    front:{drop:[5,6,7,8,10,11],eyes:[[-5.70,13.21,1.00,10.77,1.82,.49],[5.34,13.07,.99,10.46,1.71,.50]],mouth:[.23,20.64,2.65]},
    side:{drop:[6,7,8,10,11],eyes:[[9.65,13.60,.98,11.15,1.74,.53]],mouth:[8.95,12.21,20.31]}
  },
  mei:{
    bias:{doubt:{gaze:.19,slant:.12,uneven:.12,tilt:1.02},alert:{gaze:-.20},worry:{slant:-.44,tilt:1.33},anger:{slant:.30},relief:{brow:.10}},
    front:{drop:[8,9,10,11,13,14],eyes:[[-5.29,19.25,.87,16.69,1.83,.49],[5.18,18.94,.88,16.22,1.75,.46]],mouth:[.08,26.03,2.34]},
    side:{drop:[8,9,10,12,13],eyes:[[9.25,20.12,.91,17.67,1.75,.53]],mouth:[8.92,12.03,26.54]}
  },
  xu:{
    bias:{doubt:{gaze:.27,uneven:.08,tilt:-.58,mouth:"tiny"},alert:{gaze:.20,lift:-.17},surprise:{eyes:1.14,brow:-.43,tilt:-.83},worry:{lift:-.08,slant:-.28},sad:{mouth:"frown"},relief:{gaze:.18}},
    front:{drop:[5,6,7,9],eyes:[[-5.28,13.43,1.04,11.28,1.56,.49],[5.21,13.29,1.01,11.16,1.55,.48]],mouth:[.05,19.12,2.05]},
    side:{drop:[5,6,7],eyes:[[9.30,12.98,1.01,11.23,1.58,.48]],mouth:[9.12,12.01,18.30]}
  },
  uncle:{
    bias:{doubt:{gaze:.10,brow:.05,slant:.19,uneven:.26},alert:{gaze:.16,brow:-.12,tilt:.13},surprise:{eyes:1.06,brow:-.27,mouth:"tiny",tilt:-.37},worry:{slant:-.23},sad:{lift:.13,eyes:.99,slant:-.04,tilt:.62,mouth:"rest"},anger:{brow:.14,slant:.30,eyes:.93}},
    front:{drop:[6,7,8,9,12],eyes:[[-6.47,14.75,1.02,11.60,2.03,.78],[6.40,14.64,1.01,11.56,2.01,.79]],mouth:[.25,21.86,3.62]},
    side:{drop:[7,8,9,12],eyes:[[10.13,14.80,1.03,11.64,1.86,.78]],mouth:[9.02,12.99,22.12]}
  }
};

function poseFor(id,key){
  if(!people[id]||!keys[key])throw new Error("Unknown character or pose: "+id+"/"+key);
  return {...REST,...keys[key],...people[id].bias[key],blink:0,tear:0};
}

function blend(a,b,u){
  const r={};
  for(const name of Object.keys(a)){
    const av=a[name],bv=b[name];
    r[name]=typeof av==="number"?av+(bv-av)*u:u<.64?av:bv;
  }
  return r;
}

const openScale={yu:1,mei:.86,xu:.81,uncle:.80};
const neckEase={yu:{front:3.55,side:2.75},mei:{front:2.15,side:2.45},xu:{front:1.15,side:1.45},uncle:{front:3.28,side:3.18}};
function restOffset(id,view){return neckEase[id][view];}
function mouth(r,p,id,view){
  const skin=SKIN[id];
  const tone=id==="uncle"?"#665149":"#72534e";
  const k=openScale[id];
  const mode=p.mouth;
  if(view==="front"){
    const [x,y,span]=r.mouth;
    if(mode==="round"||mode==="tiny"){
      const small=mode==="tiny";
      return [E(x,y+.11,(small?.83:1.25)*k,(small?.61:.95)*k,tone)];
    }
    const w=span*(mode==="press"?.97:1);
    const bend=mode==="smile"?.68:mode==="frown"?-.52:mode==="press"?-.055:.03;
    const skew=mode==="frown"?.11:0;
    return [L("M"+xy(x-w,y+skew)+" Q"+xy(x,y+bend)+" "+xy(x+w,y-skew),skin.mouth,mode==="press"?.61:.53)];
  }
  const [back,edge,y]=r.mouth;
  const w=edge-back;
  if(mode==="round"||mode==="tiny"){
    const small=mode==="tiny";
    const aperture=(small?.55:.82)*k;
    return [P("M"+xy(edge-w*(small?.48:.70),y+.05)+" Q"+xy(edge-w*.36,y-aperture)+" "+xy(edge-.05,y-aperture*.49)+
      " Q"+xy(edge+.02,y+.10)+" "+xy(edge-.16,y+aperture*.68)+" Q"+xy(edge-w*.38,y+aperture*.75)+" "+xy(edge-w*(small?.48:.70),y+.05)+"Z",tone)];
  }
  const begin=back+(mode==="press"?.14:0);
  const bend=mode==="frown"?-.42:mode==="smile"?.49:.015;
  const start=y+(mode==="smile"?-.14:mode==="frown"?.04:0);
  const end=y+(mode==="frown"?.33:.035);
  return [L("M"+xy(begin,start)+" Q"+xy(back+w*.51,y+bend)+" "+xy(edge,end),skin.mouth,mode==="press"?.63:.54)];
}

function faceParts(model,view,p){
  const spec=people[model.id][view];
  const neutral=model.views[view].layers.find(item=>item.id==="head").items;
  const base=neutral.filter((_,i)=>!spec.drop.includes(i));
  const brows=[],eyes=[];
  const ink=model.id==="uncle"?"#473e36":"#3b3534";
  const pupil=model.id==="uncle"?"#2d2e2a":"#28262a";
  for(const [i,[x,y,r,by,w,weight]] of spec.eyes.entries()){
    const inward=view==="side"||i===0?1:-1;
    const asymmetric=i===0?1:-.36;
    const cy=by+p.brow-p.uneven*asymmetric;
    const ox=x-w*inward, ix=x+(w-.10)*inward;
    brows.push(L("M"+xy(ox,cy+.05-p.slant*.40)+" Q"+xy(x,cy-.27)+" "+xy(ix,cy-.12+p.slant*.46),ink,weight));
    const dotX=x+p.gaze*(view==="side"?.79:1),dotY=y+p.lift;
    const blink=p.blink??0;
    if(blink>.89){
      eyes.push(L("M"+xy(x-1.11,dotY+.035)+" Q"+xy(x,dotY+.18)+" "+xy(x+1.11,dotY+.035),pupil,.43));
    }else{
      const rx=r*(1+.09*(p.eyes-1));
      const ry=r*(model.id==="xu"?1.02:.96)*p.eyes*(1-.95*blink);
      eyes.push(E(dotX,dotY,rx,Math.max(.057,ry),pupil));
    }
  }
  return {base,brows,eyes,mouth:mouth(spec,p,model.id,view)};
}

function posedModel(model,view,p){
  const set=faceParts(model,view,p);
  const dy=restOffset(model.id,view);
  const fitted=parts=>[group(parts,"translate(0 "+dy+")")];
  const layers=model.views[view].layers.flatMap(row=>{
    if(row.id==="gear")return [{...row,items:fitted(row.items)}];
    if(row.id!=="head")return [row];
    return [
      {...row,pivot:[row.pivot[0],row.pivot[1]+dy],items:fitted(set.base)},
      layer("pose-brows",fitted(set.brows),"head"),
      layer("pose-eyes",fitted(set.eyes),"head"),
      layer("pose-mouth",fitted(set.mouth),"head")
    ];
  });
  return {...model,views:{...model.views,[view]:{layers}}};
}

const FPS=30;
const films=[
  {id:"yu",view:"front",mirror:false,length:6.35,label:"隔门问话",
    poses:[[0,"neutral"],[1.94,"alert"],[4.44,"doubt"],[5.48,"neutral"]],
    blinks:[2.91],speech:[[1.75,3.06,"round"],[3.14,3.76,"round"]]},
  {id:"mei",view:"side",mirror:false,length:6.83,label:"门后犹豫",
    poses:[[0,"neutral"],[.76,"worry"],[3.40,"doubt"],[4.10,"worry"],[5.71,"neutral"]],
    blinks:[3.12],speech:[[4.60,5.28,"tiny"]]},
  {id:"xu",view:"side",mirror:true,length:5.87,label:"抬眼找小美",
    poses:[[0,"neutral"],[.70,"surprise"],[1.06,"alert"],[1.97,"worry"],[4.10,"relief"]],
    blinks:[3.08],speech:[[1.09,1.42,"tiny"]]},
  {id:"uncle",view:"side",mirror:false,length:7.12,label:"听完消息",
    poses:[[0,"neutral"],[.74,"alert"],[2.05,"doubt"],[3.44,"sad"]],
    blinks:[1.58],speech:[[2.53,3.08,"tiny"]],tear:true}
];
let frames=0;
const shots=films.map(cue=>{
  const from=frames;
  frames+=Math.round(cue.length*FPS);
  return {...cue,from,to:frames,length:(frames-from)/FPS};
});

function stage(frame){
  const shot=shots.find(cue=>frame>=cue.from&&frame<cue.to)||shots.at(-1);
  return {shot,t:clamp((frame-shot.from)/FPS,0,shot.length)};
}

function move(shot,t){
  let index=0;
  while(index+1<shot.poses.length&&t>=shot.poses[index+1][0])index++;
  const [begin,now]=shot.poses[index];
  const last=index>0?shot.poses[index-1][1]:now;
  const ramp=index===0?1:smooth(t,begin,begin+(now==="surprise"?.13:.28));
  const p=blend(poseFor(shot.id,last),poseFor(shot.id,now),ramp);
  for(const at of shot.blinks){
    const q=smooth(t,at,at+.047)*(1-smooth(t,at+.062,at+.151));
    p.blink=Math.max(p.blink,q);
  }
  const speech=shot.speech.find(([from,to])=>t>=from&&t<to);
  if(speech)p.mouth=speech[2];
  if(shot.id==="xu"){
    p.lift-=.19*smooth(t,.73,1.09)*(1-smooth(t,3.60,4.10));
  }
  if(shot.tear&&t>=4.04&&t<=6.80)p.tear=clamp((t-4.04)/2.76,.0001);
  return p;
}

module.exports={FPS,keys,poseFor,faceParts,posedModel,shots,stage,move,frames,smooth,clamp,restOffset};
