const fps=30, length=90;
const shots=[
  [0,'red','红纸在手里响'],[4,'harbor','清晨的渡口'],[10,'launch','逆风试投'],
  [15,'glide','追随红翼'],[20.4,'surface','碰水'],[25,'notice','船尾的人听见了'],
  [29.4,'scoop','抄起纸鸟'],[37.6,'wet','湿纸上的画'],[43.8,'wait','岸上的等待'],
  [49.2,'draw','在船票上回信'],[58.8,'fold','折一道新翼'],[65,'ready','从船尾起飞'],
  [69.8,'return','回航'],[74,'catch','岸上的接应'],[78.4,'answer','两只燕子'],
  [83.4,'leave','摆渡人开船']
].map(([at,id,name],i)=>({from:Math.round(at*fps),at,id,name}));
const {beat,walk,penTimes}=require('./cues.json');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,u)=>a+(b-a)*u;
function u(a,b,t) {const x=clamp((t-a)/(b-a));return x*x*(3-2*x);}
function at(t,keys) {
  if(t<=keys[0][0])return keys[0][1];
  for(let i=1;i<keys.length;i++)if(t<keys[i][0])return mix(keys[i-1][1],keys[i][1],u(keys[i-1][0],keys[i][0],t));
  return keys[keys.length-1][1];
}
function sample(t,keys){return {x:at(t,keys.map(k=>[k[0],k[1]])),y:at(t,keys.map(k=>[k[0],k[2]]))};}
function bezier(a,b,c,d,k) {
  const h=1-k;return {x:h*h*h*a.x+3*h*h*k*b.x+3*h*k*k*c.x+k*k*k*d.x,y:h*h*h*a.y+3*h*h*k*b.y+3*h*k*k*c.y+k*k*k*d.y};
}
function onCurve(t,start,end,a,b,c,d) {return bezier(a,b,c,d,clamp((t-start)/(end-start)));}
const pt=(x,y)=>({x,y});
function solve(a,b,l1,l2,side=1) {
  const dx=b.x-a.x,dy=b.y-a.y,raw=Math.hypot(dx,dy)||.0001,d=clamp(raw,Math.abs(l1-l2)+.001,l1+l2-.001);
  const vx=dx/raw,vy=dy/raw,along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along));
  return {joint:pt(a.x+vx*along-side*vy*height,a.y+vy*along+side*vx*height),end:pt(a.x+vx*d,a.y+vy*d)};
}
const waves=t=>Math.sin(t*.82)+.4*Math.sin(1.7*t);
const hull=t=>({x:196*u(beat.depart,92,t),y:1.65*waves(t)});
function ankle(phase,stride) {
  const h=((phase%2)+2)%2;
  if(h<=1)return pt(stride*(.5-h),-4);
  const v=h-1;return pt(stride*(-.5-v+2*u(0,1,v)),-4-8*Math.sin(v*Math.PI));
}
function walkingPhase(t) {return walk.steps*u(walk.start,walk.end,t);}
function child(t) {
  const phase=walkingPhase(t),moving=Math.sin(Math.PI*clamp((t-4.8)/5.1));
  const h=2.3*Math.sin(phase*Math.PI)**2+(1.3*Math.sin(t*2.2))*.32;
  const lean=at(t,[[0,0],[10,0],[12.76,-3],[13.55,5],[15.5,2],[21,4],[23,6],[26,3],[43.8,0],[63,0],[70,3],[74.7,6],[75.5,2],[78,0],[90,0]]);
  const shoulder=pt(3+lean,-72+h),farShoulder=pt(-3+lean,-71+h),hip=pt(-1,-41.7+h);
  const near=sample(t,[[0,35,-58],[10.55,35,-58],[11.8,22,-57],[12.72,13,-52],[13.55,45,-91],[14.15,48,-85],[16.1,25,-60],[20,23,-56],[22.55,32,-58],[25,27,-58],[32,14,-52],[43.8,16,-49],[47,23,-55],[52,19,-54],[66,15,-53],[71.4,24,-61],[74,39,-69],[75.45,44,-65],[76.3,39,-51],[78.4,38,-50],[82.7,38,-50],[90,36,-51]]);
  const far=sample(t,[[0,-1,-40],[10,-1,-40],[12.6,13,-61],[13.7,-15,-48],[17,-4,-42],[22.3,1,-43],[26,14,-57],[40,7,-47],[45,16,-49],[52,14,-49],[69,1,-45],[74.8,20,-61],[76.65,27,-64],[80,19,-61],[83.4,12,-67],[84.5,9,-103],[90,9,-103]]);
  far.x-=7*Math.sin(phase*Math.PI)*moving;
  const waving=u(83.4,84.6,t);far.x+=7*waving*Math.sin(5.7*(t-84.4));
  const arm=solve(shoulder,near,27,25,1),backArm=solve(farShoulder,far,25,24,1);
  return {x:283+18*phase,y:420,facing:1,h,lean,hip,shoulder,farShoulder,arm,backArm,
    feet:[ankle(phase+1,18),ankle(phase,18)],phase};
}
const netAngle=t=>at(t,[[0,13],[28.6,13],[30,33],[32.95,68],[33.8,68],[35.6,5],[37.6,-5]]);
function adult(t) {
  const boat=hull(t),crouch=at(t,[[0,0],[26,0],[30,3],[32.95,16],[33.85,16],[35.8,3],[38,0],[90,0]]);
  const h=crouch+.5*Math.sin(1.7*t),lean=2+.45*crouch+at(t,[[0,0],[67,0],[68.8,-5],[69.5,3],[72,0]]);
  const shoulder=pt(5+lean,-92+h),farShoulder=pt(-2+lean,-92+h),hip=pt(-2,-54.5+crouch*.74);
  const near=sample(t,[[0,13,-37],[25,13,-37],[28.4,24,-63],[30,29,-65],[32.95,36,-45],[33.8,36,-45],[35.7,36,-68],[37.6,27,-79],[45,22,-71],[64,22,-71],[66.2,37,-72],[68.7,15,-77],[69.45,48,-103],[70.6,45,-93],[72.4,17,-42],[80,14,-40],[83,15,-49],[84.4,17,-102],[90,20,-105]]);
  near.x+=u(83,85,t)*6*Math.sin(t*4.8);
  const ang=netAngle(t)*Math.PI/180;
  const handle=pt(near.x-17*Math.cos(ang),near.y-17*Math.sin(ang));
  const other=sample(t,[[0,0,-40],[26,0,-40],[30,5,-68],[37.6,10,-76],[40,10,-67],[66,7,-64],[69.8,-10,-52],[72,0,-40]]);
  const useNet=u(28.2,30,t)*(1-u(37.1,38.1,t));
  const far=pt(mix(other.x,handle.x,useNet),mix(other.y,handle.y,useNet));
  return {x:665+boat.x,y:426+boat.y,facing:-1,h,lean,hip,shoulder,farShoulder,
    arm:solve(shoulder,near,32,31,1),backArm:solve(farShoulder,far,31,30,1),
    feet:[pt(-13,-4),pt(13,-4)],angle:ang};
}
function toWorld(actor,p) {return pt(actor.x+actor.facing*p.x,actor.y+p.y);}
function wrist(actor) {return toWorld(actor,actor.arm.end);}
function grip(actor) {const w=wrist(actor);return pt(w.x+actor.facing*2,w.y-3);}
function rim(t) {
  const a=adult(t),w=wrist(a);return pt(w.x-96*Math.cos(a.angle),w.y+96*Math.sin(a.angle));
}
function red(t) {
  const {launch,splash}=beat;
  if(t<=launch) {const p=grip(child(t));return {...p,angle:at(t,[[0,-12],[10,-12],[12.72,5],[launch,-20]])};}
  const tipAt=(deg,wet=0)=>{const r=deg*Math.PI/180,x=35-8*wet,y=(-12+10*wet)*(1-.48*wet);return pt(x*Math.cos(r)-y*Math.sin(r),x*Math.sin(r)+y*Math.cos(r));};
  const hit=tipAt(61),a=grip(child(launch)),b=pt(548,282),c=pt(589,375),d=pt(619-hit.x,467-hit.y);
  let pos,angle;
  if(t<16.7) {pos=onCurve(t,launch,16.7,a,pt(475,307),pt(522,278),b);angle=mix(-20,9,u(launch,16.7,t));}
  else if(t<19.05) {pos=onCurve(t,16.7,19.05,b,pt(592,288),pt(614,333),c);angle=mix(9,73,u(16.7,19.05,t));}
  else if(t<splash) {pos=onCurve(t,19.05,splash,c,pt(575,402),pt(583,450),d);angle=mix(73,61,u(19.05,splash,t));}
  else if(t<33.28) {angle=mix(61,3,u(splash,splash+.34,t));const tip=tipAt(angle,u(splash,splash+.52,t)),settle=u(splash+.34,32.9,t);pos=pt(619-tip.x+3*settle,467-tip.y+1.45*Math.sin(1.7*(t-splash))*u(splash,splash+.8,t));}
  else {const n=rim(t);pos=pt(n.x+1,n.y-2);angle=mix(3,-9,u(33.28,35.9,t));}
  return {...pos,angle};
}
function white(t) {
  const {reply,catch:receive}=beat;
  if(t<=reply){const p=grip(adult(t));return {...p,angle:at(t,[[65,-8],[68.7,-22],[reply,-19]]),dir:-1};}
  if(t<receive){const a=grip(adult(reply)),b=grip(child(receive));const c=onCurve(t,reply,receive,a,pt(574,241),pt(491,270),b);
    const angle=at(t,[[reply,-19],[71,-14],[73,9],[receive,30]]);return {...c,angle,dir:-1};}
  const p=grip(child(t));return {...p,angle:at(t,[[receive,30],[76.3,1],[78.4,-6],[90,-7]]),dir:-1};
}
function camera(id,t) {
  const kid=child(t),woman=adult(t),r=red(t),paper=white(t),n=rim(t);
  const keyed=(a,b,start,end)=>mix(a,b,u(start,end,t));
  switch(id) {
    case 'red': return {x:kid.x+23+keyed(-3,3,0,4),y:345,w:keyed(162,190,0,4)};
    case 'harbor':return {x:keyed(549,559,4,10),y:308,w:keyed(1070,1000,4,10)};
    case 'launch':return {x:keyed(398,413,10,15),y:352,w:keyed(245,274,10,15)};
    case 'glide':return {x:r.x+13,y:r.y+13,w:keyed(275,242,15,20.4)};
    case 'surface':return {x:594,y:451,w:keyed(170,186,20.4,25)};
    case 'notice':return {x:woman.x-12,y:woman.y-107+keyed(0,3,25,29.4),w:keyed(207,193,25,29.4)};
    case 'scoop':return {x:623,y:mix(woman.y-65,n.y-33,.39),w:keyed(371,397,29.4,37.6)};
    case 'wait':return {x:kid.x+19,y:337,w:keyed(190,156,43.8,49.2)};
    case 'ready':return {x:woman.x-21,y:woman.y-85,w:keyed(218,258,65,69.8)};
    case 'return':return {x:paper.x-21,y:paper.y+16,w:keyed(299,250,69.8,74)};
    case 'catch':return {x:kid.x+26,y:343,w:keyed(230,177,74,78.4)};
    case 'leave':return {x:keyed(588,647,83.4,90),y:keyed(312,294,83.4,90),w:keyed(842,1020,83.4,90)};
    default:return {x:550,y:315,w:1000};
  }
}
const drawing=[
 [[542,250],[527,229],[506,230],[490,224]],[[542,250],[531,225],[532,213],[528,204]],
 [[542,250],[553,240],[565,240],[573,240]],[[542,250],[533,248],[535,255],[528,262]],
 [[614,270],[606,257],[595,252],[584,253]],[[614,270],[611,250],[613,244],[612,239]],
 [[614,270],[624,263],[630,265],[634,267]],[[614,270],[610,271],[609,277],[605,278]]
];

module.exports={fps,length,shots,beat,pt,mix,clamp,u,at,sample,bezier,onCurve,solve,waves,hull,walkingPhase,ankle,child,adult,toWorld,wrist,grip,rim,red,white,camera,drawing,penTimes};
