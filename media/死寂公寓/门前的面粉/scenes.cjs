"use strict";

const {clamp,lerp,ease,pulse,path,rect,round,ell,line,poly,text,grad,glow,place,rand}=require("../开篇九十秒/drawing.cjs");
const {W,H,floor,doors,events,camera,cue,expression,makeActor,draw,shadow,wristOf,facePoint,
  lock,wall,tiledFloor,nightRoom,hall,letter,clock,powder,keyring,paintCap,cat}=require("./art.cjs");

const mixes={};
function setPerformance(value){Object.assign(mixes,value);}
function lip(id,t){return mixes.lips?.[id]?.[String(Math.round(t*30))]||0;}

function familyState(t){
  const look=pulse(5.1,7.3,12.4,15.6,t);
  const little=makeActor("xu",239.6+1.4*ease(.6,2.3,t),floor,.679,1,{
    lean:.58+1.8*look,tilt:-2.7-4.1*look,
    face:expression("xu",t<5.6?"worry":t<11.72?"doubt":"neutral",t,
      {blink:[4.34,11.37,17.43],speech:lip("child",t),look:-.10*look})
  });
  const mouth=facePoint(little,[12.92,18.42]);
  const comfortable=makeActor("mei",272.5,floor,.775,-1,{
    lean:1.2+1.65*pulse(.35,1.62,6.5,12.2,t),tilt:3.7+2.1*look,
    face:expression("mei",t<11.7?"worry":"relief",t,{blink:[3.45,13.91,17.9],speech:lip("mei",t),look:.26})
  });
  const rest=wristOf(comfortable);
  const [h,y]=cue(t,[[0,mouth[0]+3.15,mouth[1]+1.25],[3.7,mouth[0]+3.15,mouth[1]+1.25],
    [5.5,rest[0]-6.0,rest[1]-3.45],[6.6,...rest],[11.72,...rest],[13.3,rest[0]-5.8,rest[1]-2.1],[16.7,...rest]]);
  const mei=makeActor("mei",comfortable.x,floor,.775,-1,{
    lean:comfortable.rig.lean*180/Math.PI,tilt:comfortable.rig.tilt*180/Math.PI-comfortable.rig.expression.tilt,
    face:comfortable.rig.expression,wrist:[h,y]
  });
  return {little,mei};
}
function roomScene(c,t,which){
  const a=familyState(t);
  const frames=[[243,138,1.07],[244,170,1.91],[270,139,1.86]];
  camera(c,...frames[which],()=>{
    nightRoom(c,t);
    shadow(c,a.little);shadow(c,a.mei);
    draw(c,a.little);draw(c,a.mei);
    if(which===0)cat(c,189,floor-.1,.43,t,{sitting:true});
  });
  return [a.little,a.mei];
}
function keyhole(c,t){
  if(t>=21.14){
    rect(c,0,0,W,H,"#101722");
    c.save();c.beginPath();c.ellipse(260,134,116,106,0,0,Math.PI*2);c.clip();
    hall(c,t,{day:false});
    rect(c,0,0,W,H,"rgba(8,18,30,.65)");
    glow(c,271,111,57,64,"rgba(129,148,155,.21)");
    c.restore();
    ell(c,260,134,117,106,null,"#414a54",1.7);
    ell(c,260,134,114,103,null,"#1a2330",2.2);
    return [];
  }
  const leaning=ease(19.15,20.58,t);
  const a=makeActor("mei",281+9*leaning,floor,.785,1,
    {lean:4.0+9.2*leaning,tilt:-1.4,face:expression("mei","alert",t,{blink:[19.73]})});
  const eye=facePoint(a,[9.25,20.12]);
  camera(c,309,134,1.63,()=>{
    nightRoom(c,t);
    rect(c,323,49,44,178,"#435465");
    rect(c,323,50,6.75,176,"#657281");
    line(c,[[322.4,49],[322.4,225]],"#819099",1.11);
    lock(c,324,154,"#ab9c82");
    ell(c,323,eye[1]+(1-leaning)*2.35,1.40,2.0,"#262d37","#a39c86",.6);
    draw(c,a);
    rect(c,326,50,6.5,176,"rgba(34,51,64,.26)");
  });
  return [a];
}
function considers(c,t){
  const a=makeActor("mei",269,floor,.775,-1,{lean:1.35,tilt:2.7+3*ease(24.12,24.9,t),
    face:expression("mei","worry",t,{blink:[26.82],look:.29})});
  camera(c,228,153,1.46+.055*ease(24,28.83,t),()=>{
    nightRoom(c,t);
    cat(c,187.3,floor,.50,t,{sitting:true});
    shadow(c,a);draw(c,a);
    glow(c,191,169,53,34,"rgba(230,177,106,.145)");
  });
  return [a];
}

function screen(c,x,y,s,t){
  place(c,x,y,s,()=>{
    round(c,-66,-40,132,80,3,"#394444","#70807a",1);
    round(c,-62,-36,124,72,1.7,"#516456");
    c.save();c.beginPath();c.rect(-60,-33,120,64);c.clip();
    rect(c,-60,-33,120,66,grad(c,-40,-30,62,30,[[0,"#526758"],[1,"#303d36"]]));
    poly(c,[[-61,25],[47,-23],[62,-12],[62,30],[-60,30]],"#45564b");
    for(let i=0;i<8;i++){
      const x=-42+i*12, y=25-i*5.2;
      line(c,[[x,y],[x+17,y],[x+17,y-5]],"#788774",1);
    }
    line(c,[[-63,13],[58,-32]],"#8c9980",.8);
    for(const [j,base] of [[0,9],[1,28]]){
      const travel=ease(32.25+j*.49,34.95+j*.31,t);
      const x=base+17*travel,y=3-.4*x+7;
      ell(c,x-1.7,y-23.6,3.6,4.4,"#303934");
      path(c,"M"+(x-5.7)+" "+(y-18.5)+" q4 -3 8.7 0 l4 11 -2 3 -2 -5 -1 1 1.2 9 h-4 l-3 -6 -4.3 6 h-3.8 l2.2 -15Z","#303a33");
    }
    for(let j=-33;j<34;j+=2.1)line(c,[[-60,j],[60,j]],"rgba(203,211,180,.075)",.45);
    c.restore();
    ell(c,-54,25,1.15,1.15,"#ae6553");
    text(c,"监控 02",-51,-24,5.2,"#c1cbb2","left",true);
    text(c,"03:41",51,-24,5.2,"#c1cbb2","right",true);
  });
}
function watch(c,t){
  const a=makeActor("uncle",160,floor,.789,1,{lean:4.6,tilt:2.5*ease(35.9,36.9,t),headset:true,
    face:expression("uncle",t>=36.1?"doubt":"alert",t,{blink:[35.5],look:.19})});
  camera(c,t<35.05?236:297,t<35.05?137:143,t<35.05?1.20:1.79,()=>{
    wall(c,226,["#364144","#2b333a","#202b33"]);tiledFloor(c,226,false,true);
    rect(c,311,38,78,123,"#343c41");
    line(c,[[350,39],[350,161]],"#4d5551",1.2);
    round(c,200,177,211,6,1.03,"#57483e","#7e6753",.55);
    rect(c,206,184,5.0,42,"#453e38");rect(c,400,184,5,42,"#443d37");
    rect(c,283,158,4.1,18,"#343a37");
    ell(c,286,175,18.5,2.2,"#303833");
    screen(c,284,143,.77,t);
    glow(c,250,148,92,77,"rgba(157,181,140,.145)");
    draw(c,a);
    round(c,354,173,18,3.4,1.1,"#76644f");
    line(c,[[364,173],[371,127],[385,112]],"#a99a79",2);
    path(c,"M376 110 Q385 103 394 112 L397 119 L376 121Z","#958667");
    glow(c,387,118,71,45,"rgba(213,174,118,.116)");
  });
  return [a];
}

const firstWalk={dir:1,initial:{left:[241,floor],right:[253,floor]}, lands:events.steps,
  next:[[266,floor],[282,floor],[298,floor],[315,floor],[334,floor],[343,floor]],start:63.77};
const secondWalk={dir:-1,initial:{left:[334,floor],right:[343,floor]},lands:events.returnSteps,
  next:[[313,floor],[291,floor],[270,floor]],start:71.73};
const stairWalk={dir:1,initial:{left:[244,186],right:[253,186]},lands:events.leaving,
  next:[[271,196],[293,207],[316,218]],start:87.81};
function route(t, plan){
  const {dir,initial,lands,next,start}=plan;
  const current={left:initial.left,right:initial.right};
  const average=()=>[(current.left[0]+current.right[0])/2,(current.left[1]+current.right[1])/2];
  const rows=[[start,...average()]];
  const schedules={left:[],right:[]};
  for(let i=0;i<lands.length;i++){
    const side=i%2?"right":"left";
    schedules[side].push({origin:current[side],end:next[i],land:lands[i],off:i?lands[i-1]+.11:start});
    current[side]=next[i];
    rows.push([lands[i],...average()]);
  }
  const feet=Object.fromEntries(Object.keys(schedules).map(side=>{
    let xy=initial[side],planted=true;
    for(const k of schedules[side]){
      if(t<k.off)break;
      if(t<k.land){
        const u=clamp((t-k.off)/(k.land-k.off));
        const v=ease(0,1,u);
        xy=[lerp(k.origin[0],k.end[0],v),lerp(k.origin[1],k.end[1],u)-3.25*Math.sin(u*Math.PI)];
        planted=false;
        break;
      }
      xy=k.end;
    }
    return [side,{xy,planted}];
  }));
  const i=rows.findIndex(r=>r[0]>t);
  let root;
  if(i<0)root=rows.at(-1).slice(1);
  else if(!i)root=rows[0].slice(1);
  else{
    const a=rows[i-1], b=rows[i], u=clamp((t-a[0])/(b[0]-a[0]));
    const progress=lerp(u,ease(0,1,u),i===1||i===rows.length-1?.37:.12);
    root=[lerp(a[1],b[1],progress),lerp(a[2],b[2],progress)];
  }
  const swing=clamp((feet.right.xy[0]-feet.left.xy[0])*dir/23,-1,1)*3.5*
    pulse(start-.14,start+.20,lands.at(-1)-.20,lands.at(-1)+.22,t);
  return {root,feet,swing};
}
function yuWalking(t,plan=firstWalk,small=.745,state="alert"){
  const move=route(t,plan);
  const [x,y]=move.root;
  return makeActor("yu",x,y,small,plan.dir,{lean:1.98,tilt:state==="worry"?4.81:-1.46,
    face:expression("yu",state,t,{blink:[66.71,72.74,88.63],look:state==="worry"?.19:.015}),
    feet:move.feet,fit:true,weight:move.swing});
}
function peekOut(c,t,which){
  const open=.78*ease(40.82,42.14,t);
  const a=makeActor("yu",244+4.2*ease(41.12,43.62,t),floor,.756,1,{
    lean:2+.81*pulse(41.69,42.30,47.8,49.28,t),tilt:1.7-.71*ease(49.0,52.0,t),
    face:expression("yu",which?"doubt":"alert",t,{blink:[43.91,50.75],look:which?.05:.26})
  });
  camera(c,which?281:244,which?138:145,which?1.48:1.43,()=>{
    hall(c,t,{open,inside:()=>{
      const [x,y,w,h]=doors.yu;
      c.save();c.beginPath();c.rect(x,y,w,h+1);c.clip();
      draw(c,a);
      c.restore();
    }});
    powder(c,245,floor+4.3,91);
  });
  return [a];
}
function checksHall(c,t){
  if(t<57.36){
    camera(c,355,132,1.35,()=>{
      hall(c,t,{open:.78});
      powder(c,245,floor+4.3,91);
    });
  }else{
    camera(c,158,150,1.21,()=>{
      hall(c,t,{open:.78});
      powder(c,245,floor+4.3,91);
    });
  }
  return [];
}
function walkAndLook(c,t,back=false){
  const a=yuWalking(t,back?secondWalk:firstWalk,.755,back?"worry":"alert");
  const look=back?cue(t,[[69.65,284,158],[74.69,241,159]]):cue(t,[[62.95,245,147],[69.65,302,146]]);
  camera(c,...look,back?1.24:1.09,()=>{
    hall(c,t,{open:.78});powder(c,245,floor+4.3,91);
    shadow(c,a);draw(c,a);
    if(back)glow(c,246,230,43,22,"rgba(216,211,178,.10)");
  });
  return [a];
}
function closeFloor(c,t,wipe=false){
  const x=wipe?244:117;
  const p=wipe?pulse(78.69,79.39,80.46,81.34,t):pulse(74.79,76.38,77.29,78.44,t);
  const u=wipe?ease(79.42,80.47,t):ease(events.flour,77.44,t);
  const hand=[x+lerp(-22,17,u),wipe?209.8:191.8];
  camera(c,x+2,210,2.96,()=>{
    hall(c,t,{open:wipe?.63:.78});
    const threshold=floor+4.25;
    if(wipe){
      for(let i=0;i<91;i++){
        const a=rand(i+51);
        if(a<=u)continue;
        ell(c,x+(a-.5)*39,threshold+(rand(i+209)-.5)*4.9,.29+.38*rand(i+210),.14+.19*rand(i+91),"#e1d8bd");
      }
    }else powder(c,x,threshold,86,u,151);
    if(p>.01){
      const [hx,hy]=hand;
      const root=hx-42-65*(1-p), sy=hy-37-15*(1-p);
      const ex=hx-26, ey=hy-8;
      path(c,"M"+(root-47)+" "+(sy-37)+" Q"+(root-8)+" "+(sy-17)+" "+(root+10)+" "+(sy+7)+
        " Q"+(root+9)+" "+(sy+35)+" "+(root+14)+" "+(hy+12)+" L"+(root-47)+" "+(hy+25)+"Z","#4e5c6a");
      path(c,"M"+(root-5)+" "+(sy+5)+" Q"+(ex-9)+" "+(ey-8)+" "+ex+" "+(ey-4.7)+
        " Q"+(hx-12)+" "+(hy-5.1)+" "+(hx-.7)+" "+(hy-4.15)+" L"+(hx-.5)+" "+(hy+4.2)+
        " Q"+(ex+2)+" "+(ey+7)+" "+(ex-7)+" "+(ey+5.4)+" Q"+(root-5)+" "+(sy+28)+" "+(root-10)+" "+(sy+13)+"Z","#48596b");
      if(wipe){
        place(c,hx+1.7,hy+9.9,1,()=>{
          path(c,"M-10 4 Q-5 -6 4.1 -5 L11 3 Q15 8 7 10 L-8 10Z","#7b8582");
          path(c,"M-7 4 Q-1 2 8 5",null,"#a2aaa0",.65);
        },false,-.068);
      }else{
        const sackX=hx+5.7,sackY=hy;
        place(c,sackX,sackY,.88,()=>{
          path(c,"M-6 -12 Q.8 -10 8.6 -11 L7.3 10 L-8.5 8Z","#c5b18f","#8e7f67",.55);
          path(c,"M-6.1 -10.4 L7.2 -9.7 M5.4 8 L6.1 -6.7",null,"#e0ccaa",.62);
        },false,lerp(0,-.84,p));
        const d=t-events.flour;
        if(d>0&&d<1.25){
          for(let j=0;j<44;j++){
            const local=d-j*.019;
            if(local<0||local>.41)continue;
            ell(c,sackX+6.3+local*3.4+(rand(j+71)-.5)*3,
              sackY+3+local*local*160,.32+.42*rand(j+133),.28,"#dacfb3");
          }
        }
      }
      paintCap(c,hx,hy,1.55);
    }
  });
  return [];
}
function leave(c,t){
  const open=.61*(1-ease(85.26,events.latch.at(-1),t));
  const x=259.85;
  const loose=makeActor("yu",x,floor,.764,-1,{lean:3.1,tilt:-1.08,face:expression("yu","alert",t,{blink:[85.32]})});
  const base=wristOf(loose);
  const take=pulse(84.78,85.17,85.97,86.48,t);
  const edge=doors.yu[0]+doors.yu[2]-open*doors.yu[2]*.295;
  const hand=[lerp(base[0],edge-6.1,take),lerp(base[1],doors.yu[1]+94.13,take)];
  const a=makeActor("yu",x,floor,.764,-1,{lean:3.1,tilt:-1.08,face:loose.rig.expression,wrist:hand});
  camera(c,254,142,1.36,()=>{
    hall(c,t,{open});powder(c,116,floor+4.3,86,1,151);
    draw(c,a);
  });
  return [a];
}
function keys(c,t){
  const hold=ease(86.65,events.key+.14,t), x=252-16*hold, y=158-4.2*hold;
  rect(c,0,0,W,H,grad(c,14,50,461,269,[[0,"#273647"],[.58,"#1f2e3a"],[1,"#212c36"]]));
  path(c,"M0 0 H156 Q196 57 178 91 L194 221 Q182 245 0 249Z","#55616d");
  path(c,"M83 59 Q121 69 143 110 L"+(x-5)+" "+(y-10)+" Q"+(x+1)+" "+y+" "+(x-5)+" "+(y+10)+" Q164 174 136 145 L68 98Z","#4b5868");
  const swing=.39*(1-hold)+.09*Math.sin(24*(t-events.key))*Math.max(0,1-3*(t-events.key));
  keyring(c,x+4.4,y+5.2,2.45,swing);
  paintCap(c,x,y,4.4);
  return [];
}
function descent(c,t){
  const a=yuWalking(t,stairWalk,.675,"alert");
  camera(c,273,142,1.18,()=>{
    wall(c,219,["#42515b","#34444f","#263742"]);
    rect(c,23,25,70,106,"#3c5361");
    rect(c,27,30,62,97,"#576d73");
    line(c,[[58,30],[58,127]],"#64787a",1.2);
    poly(c,[[39,131],[83,131],[245,186],[245,216],[45,201]],"rgba(174,183,166,.10)");
    const points=[[-80,186],[261,186],[261,196],[282,196],[282,207],[305,207],[305,218],
      [326,218],[326,229],[348,229],[348,239],[371,239],[371,249],[492,249],[492,330],[-80,330]];
    poly(c,points,"#475760");
    line(c,points.slice(0,-2),"#657780",1);
    line(c,[[147,130],[422,232]],"#637977",2.05);
    for(let i=0;i<5;i++){const x=163+i*52, y=136+i*19;line(c,[[x,y],[x,y+43]],"#455b61",1);}
    if(t>=87.75){shadow(c,a);draw(c,a);}
  });
  return t>=87.75?[a]:[];
}

const scenes=[
  (c,t)=>roomScene(c,t,0),
  (c,t)=>roomScene(c,t,1),
  (c,t)=>roomScene(c,t,2),
  keyhole, considers, (c,t)=>(letter(c,t),[]), watch,
  (c,t)=>peekOut(c,t,0), (c,t)=>(clock(c,t),[]), (c,t)=>peekOut(c,t,1),
  checksHall, (c,t)=>walkAndLook(c,t), (c,t)=>walkAndLook(c,t,true),
  (c,t)=>closeFloor(c,t), (c,t)=>closeFloor(c,t,true),
  (c,t)=>(clock(c,t,true),[]),
  leave,
  (c,t)=>t<87.75?keys(c,t):descent(c,t)
];
module.exports={scenes,setPerformance};