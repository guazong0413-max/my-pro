'use strict';

const Rider = (() => {
  const {TAU,clamp,mix,smooth,rng,surface,shape,line,ellipse,gradient,limbJoint,palettes,delivery} = Film;
  const bounds = [-259,-362,459,374], res = 1.85;
  const sheet = surface(bounds[2]*res, bounds[3]*res);
  const c = sheet.getContext('2d');
  const wheels = [], heads = [], grains = [];
  const rear = [-102,-57.5], front = [126,-57.5], hub = [2,-67];
  const tyreRadius = 57.5, crankR = 21;
  function trace(ctx, points, close = false) {
    const p = new Path2D();
    p.moveTo(points[0][0],points[0][1]);
    for (const v of points.slice(1)) p.lineTo(v[0],v[1]);
    if (close) p.closePath();
    return p;
  }
  function rod(ctx, d, width, color, ink) {
    shape(ctx,d,null,ink,width+2);
    shape(ctx,d,null,color,width);
  }
  function init(head) {
    palettes.forEach((p,k) => {
      const size = 130, s = surface(size*2,size*2), g = s.getContext('2d');
      g.scale(2,2); g.translate(size/2,size/2);
      ellipse(g,0,0,tyreRadius,tyreRadius,p.tire,p.ink,1.6);
      // Hollow out the wheel before adding its wire spokes.
      g.globalCompositeOperation = 'destination-out';
      ellipse(g,0,0,50.6,50.6,'black');
      g.globalCompositeOperation = 'source-over';
      ellipse(g,0,0,54.4,54.4,null,p.cream,2.7);
      ellipse(g,0,0,51.3,51.3,null,p.metal,1.7);
      ellipse(g,0,0,50.1,50.1,null,p.ink,.85);
      for (let j=0;j<36;j++) {
        const a=TAU*j/36, a2=a+(j%2?-.94:.94);
        line(g,[4.7*Math.cos(a2),4.7*Math.sin(a2),49.8*Math.cos(a),49.8*Math.sin(a)],
             j%2?'rgba(52,62,56,.79)':'rgba(104,118,110,.78)',j%2?.73:.58);
        line(g,[48.3*Math.cos(a),48.3*Math.sin(a),50.3*Math.cos(a),50.3*Math.sin(a)],p.metal,1.15);
      }
      for(let j=0;j<60;j++){
        const a=j*TAU/60;
        line(g,[56.7*Math.cos(a),56.7*Math.sin(a),55.6*Math.cos(a+.017),55.6*Math.sin(a+.017)],'#87918666',.68);
      }
      line(g,[0,-50,0,-45.4],p.ink,1.6);
      g.save();g.rotate(.51);
      shape(g,'M-4-38Q0-40 4-38L3-35H-3Z',p.brass,p.ink,.65);
      line(g,[-2.5,-37.9,2,-37.9],p.cream,.6);g.restore();
      ellipse(g,0,0,5.8,5.8,p.metal,p.ink,1);
      ellipse(g,0,0,2.4,2.4,p.brass,p.ink,.8);
      wheels.push(s);

      const face = surface(810,810*head.height/head.width), h=face.getContext('2d');
      h.filter=['none','saturate(.57) sepia(.11) contrast(.93)','sepia(.19) saturate(1.12) contrast(1.09)','saturate(.77) brightness(.96)'][k];
      h.drawImage(head,0,0,face.width,face.height); h.filter='none';
      if(k===1||k===3) {
        h.globalCompositeOperation='source-atop';
        h.fillStyle=k===1?'rgba(90,113,113,.13)':'rgba(60,111,174,.22)';
        h.fillRect(0,0,face.width,face.height);
      }
      if(k===2||k===3){
        h.globalCompositeOperation='source-atop';
        const cuts=rng(911);
        if(k===2){
          for(let i=0;i<440;i++){
            const x=cuts()*face.width,y=cuts()*face.height;
            const bend=2.8*Math.sin(x/face.width*3.3);
            const mark=new Path2D();mark.moveTo(x,y);mark.quadraticCurveTo(x+3,y-bend,x+4+cuts()*7,y-2-bend);
            shape(h,mark,null,i%3?'#f4d98c68':'#4e422e66',.55+cuts());
          }
        }else{
          h.scale(face.width/194,face.height/97);
          shape(h,'M73 51L117 47 170 43 147 48 89 53Z','#d2e9cb38');
          shape(h,'M88 64L122 59 167 57 142 61 91 68Z','#4d718330');
          shape(h,'M22 16L56 3 83 1 51 11Z','#b8d6ed30');
          shape(h,'M7 72L22 65 19 78 9 81Z','#69858742');
        }
      }
      heads.push(face);
      const paper=surface(136,136), ink=paper.getContext('2d'), random=rng(5618+k*113);
      const noise=ink.createImageData(136,136);
      for(let i=0;i<noise.data.length;i+=4){
        const light=random()>.49, v=light?247:42;
        noise.data[i]=v; noise.data[i+1]=light?v-6:v+3; noise.data[i+2]=light?v-20:v+10;
        noise.data[i+3]=Math.round(8+random()*47);
      }
      ink.putImageData(noise,0,0);
      if(k===2)for(let i=0;i<135;i++){
        const x=random()*136,y=random()*136;
        line(ink,[x,y,x+random()*4+1.2,y-1.3],random()>.5?'#f9d59455':'#39283140',.62);
      }
      grains.push(c.createPattern(paper,'repeat'));
    });
  }

  function wheel(which,spin,k) {
    const [x,y]=which;
    c.save(); c.translate(x,y); c.rotate(spin);
    c.drawImage(wheels[k],-65,-65,130,130); c.restore();
  }
  function pedal(a,far) {
    return [hub[0]+Math.cos(a)*crankR+(far?-3:0),hub[1]+Math.sin(a)*crankR+(far?-1:0)];
  }
  function crankArm(a,far,p) {
    const [x,y] = pedal(a,far);
    line(c,[hub[0],hub[1],x,y],p.ink,4.6);
    line(c,[hub[0],hub[1]-.4,x,y-.4],p.metal,2.2);
    c.save(); c.translate(x,y);
    shape(c,'M-10 0Q-10-2-8-2H9L11 0 10 2H-8Z',p.ink,p.ink,.9);
    line(c,[-6,-.2,7,-.2],p.brass,1);
    c.restore();
  }
  function leg(s,a,far,p) {
    const [px,py]=pedal(a,far);
    const hx=(far?-49:-45)+s.wind*3, hy=-169+s.bob*.75+(far?-2:0);
    const ax=px-6, ay=py-10, knee=limbJoint(hx,hy,ax,ay,62,65);
    const [kx,ky]=knee;
    const skin=far?p.dark:p.skin, trouser=far?p.ink:p.navy;
    const bone=(x,y,xx,yy,r1,r2,fill)=>{
      const angle=Math.atan2(yy-y,xx-x), nx=-Math.sin(angle), ny=Math.cos(angle);
      const path=new Path2D();
      path.moveTo(x+nx*r1,y+ny*r1); path.lineTo(xx+nx*r2,yy+ny*r2);
      path.quadraticCurveTo(xx+Math.cos(angle)*r2*1.5,yy+Math.sin(angle)*r2*1.5,xx-nx*r2,yy-ny*r2);
      path.lineTo(x-nx*r1,y-ny*r1); path.quadraticCurveTo(x-Math.cos(angle)*r1,y-Math.sin(angle)*r1,x+nx*r1,y+ny*r1);
      shape(c,path,fill,p.ink,1.5);
    };
    bone(kx,ky,ax,ay,7.5,4.7,skin);
    bone(hx,hy,kx,ky,13,7.3,skin);
    const shin=new Path2D();shin.moveTo(kx-1,ky+3);shin.quadraticCurveTo(mix(kx,ax,.5)-2,mix(ky,ay,.5),ax-1,ay);
    shape(c,shin,null,far?'#56664450':'#d9d19265',2.5);
    const ux=mix(hx,kx,.68),uy=mix(hy,ky,.68);
    bone(hx-1,hy-1,ux,uy,17,12,trouser);
    c.save(); c.translate(ux,uy); c.rotate(Math.atan2(ky-hy,kx-hx));
    shape(c,'M-5 -13L1 -12.8Q3 -3 2 12L-4 13Z',p.blue,p.ink,1.2);
    line(c,[-3,-9,-3,9],p.cream,.7); c.restore();
    for(let j=0;j<4;j++) {
      const v=.21+j*.105;
      line(c,[mix(kx,ax,v)-2,mix(ky,ay,v),mix(kx,ax,v)+1.8,mix(ky,ay,v)-.7],far?p.ridge:p.light,1);
    }
    c.save(); c.translate(px,py-2.3); c.rotate(.075*Math.sin(a-.4)-.025);
    shape(c,'M-15-3Q-16-7-13-13L-5-14Q-2-12 1-8L11-6Q18-5 18-1L15 1H-13Z',far?p.leatherDark:p.leather,p.ink,1.5);
    shape(c,'M-15-2Q-3 0 16-2L18-1Q18 2 15 2L-13 2Z',p.belly,p.ink,1);
    shape(c,'M-11-13Q-9-10-5-10M0-7L3-9M4-6L7-7.5',null,p.cream,1.15);
    c.restore();
  }

  function drivetrain(s,p) {
    const d='M-102-66.3L1-83.4C24-84 27-54 6-50.3L-102-49.2C-113-49-114-65-102-66.3Z';
    shape(c,d,null,p.ink,2.9); c.setLineDash([.7,2.65]); c.lineDashOffset=-s.crank*16.4;
    shape(c,d,null,p.metal,1.55); c.setLineDash([]); c.lineDashOffset=0;
    ellipse(c,...rear,8,8,p.ink,p.metal,1);
    c.save(); c.translate(...hub); c.rotate(s.crank);
    ellipse(c,0,0,16.3,16.3,null,p.ink,3.2);
    ellipse(c,0,0,15,15,null,p.brass,1.7);
    for(let i=0;i<5;i++){
      c.rotate(TAU/5);
      shape(c,'M-2 0Q-3-8 -6-12L-3-14 1-11 3-1Z',p.metal,p.ink,.9);
    }
    ellipse(c,0,0,4.6,4.6,p.brass,p.ink,1);
    c.restore();
  }
  function bicycle(s,p,stage) {
    // The front fork, mudguards and stays sit in front of the turning spokes.
    rod(c,'M-156-78C-142-119-92-137-59-100',3,p.cream,p.ink);
    rod(c,'M72-87C90-128 152-138 179-87',3,p.cream,p.ink);
    shape(c,'M-102-57.5L-153-83M-102-57.5L-68-109M126-57.5L177-91',null,p.metal,1.7);
    for(const d of ['M-102-57.5L-46-147L2-67Z','M-46-147L86-142','M2-67L96-118','M86-149L96-118','M95-118Q110-92 126-57.5']){
      rod(c,d,d.startsWith('M-102')?4.2:6.6,p.frame,p.ink);
    }
    shape(c,'M-42-145L80-141M9-70L92-117M-99-59L-48-142',null,p.cream,1.15);
    shape(c,'M23-83l17-10m2-1 6-4',null,p.navy,2.2);
    // Brass joints, pump, curved brake cable, leather grips and bell.
    rod(c,'M-45-148L-49-160',4.2,p.metal,p.ink);
    shape(c,'M-67-161Q-62-166-53-165L-30-162Q-24-162-24-159Q-31-156-46-155L-60-155Q-68-155-67-161Z',p.leatherDark,p.ink,1.6);
    line(c,[-61,-162,-43,-161,-31,-160],p.leather,1.6);
    rod(c,'M87-146L83-159Q82-164 89-164L103-164',3.6,p.metal,p.ink);
    rod(c,'M83-160Q81-155 74-155L65-156',4.1,p.metal,p.ink);
    rod(c,'M91-164L103-164',4.9,p.leatherDark,p.ink);
    rod(c,'M64-156L77-155',5.1,p.leather,p.ink);
    shape(c,'M82-158C121-170 137-139 109-113Q99-102 114-85M70-154Q64-148 60-150',null,p.ink,1);
    shape(c,'M-14-143L58-141',null,p.ink,3.1);
    shape(c,'M-12-143L45-141.8',null,p.metal,1.6);
    shape(c,'M89-164Q89-171 94-171Q100-169 100-165Z',p.brass,p.ink,1.1);
    line(c,[94,-172,94,-173.5],p.ink,1.2);
    // Rear carrier, a rolled route map and a strapped postal parcel.
    rod(c,'M-152-128H-73M-142-127L-102-57.5L-81-127',2.1,p.metal,p.ink);
    shape(c,'M-143-151L-96-153-87-146-89-130-139-129-146-135Z',p.shirt,p.ink,1.5);
    shape(c,'M-143-151L-135-144-88-146-96-153Z',p.cream,p.ink,1);
    shape(c,'M-135-144L-136-130M-120-152L-112-146-114-130M-126-152L-119-145-120-131',null,p.leather,1.35);
    shape(c,'M-150-149Q-154-156-149-159L-108-160-104-152-109-148Z',p.cream,p.ink,1.2);
    ellipse(c,-149,-154,4.1,5.4,p.shirt,p.ink,1.1,-.25);
    ellipse(c,-149,-154,1.5,2.3,null,p.leatherDark,.8,-.25);
    shape(c,'M-124-159L-121-149M-121-159L-118-150',null,p.redDark,1.5);
    // Lamp bracket and enamel housing, with a visible lens at night.
    shape(c,'M97-131Q111-125 114-137',null,p.ink,2.5);
    shape(c,'M108-138Q112-146 123-144L127-141 126-131 120-129Q110-131 108-138Z',p.brass,p.ink,1.5);
    ellipse(c,125.7,-137,3.25,6.3,stage===3?'#fff4b8':p.cream,p.ink,1);
    shape(c,'M110-138Q115-142 120-141',null,'#ffefd2',1.15);
    drivetrain(s,p);
  }

  function tail(s,p,stage) {
    const top=[],bottom=[],under=[],ridge=[];
    function at(u) {
      const w=19.5*Math.pow(1-u,.83);
      const x=-43-190*u;
      const y=-181+s.bob*.74+14*Math.sin(Math.PI*u)-35*u*u*u+
        u*(5.4*Math.sin(s.crank*.73-3.8*u)+3*Math.sin(s.t*1.45-4*u)-4*s.wind);
      return {x,y,w};
    }
    for(let j=0;j<=45;j++){
      const q=at(j/45);top.push([q.x,q.y-q.w]); bottom.push([q.x,q.y+q.w]);
      under.push([q.x,q.y+q.w*.45]); ridge.push([q.x,q.y-q.w*.56]);
    }
    for(let j=0;j<12;j++){
      const u=.1+j*.065,q=at(u),b=at(u+.067),r=at(u+.051);
      const height=(1-u)*11+1;
      shape(c,trace(c,[[q.x,q.y-q.w+2],[r.x-2,r.y-r.w-height],[b.x,b.y-b.w+3]],true),p.ridge,p.ink,1.25);
    }
    shape(c,trace(c,top.concat([...bottom].reverse()),true),gradient(c,-40,-211,-40,-151,[[0,p.dark],[.50,p.skin],[.82,p.light],[1,p.belly]]),p.ink,1.9);
    shape(c,trace(c,under.concat([...bottom].reverse()),true),p.belly);
    shape(c,trace(c,top.concat([...ridge].reverse()),true),stage===2?'#555c435f':'#526d4739');
    for(let j=0;j<22;j++){
      const u=.09+j*.039,q=at(u),l=q.w*.5;
      const mark=new Path2D();
      mark.moveTo(q.x+2,q.y-q.w*.56);mark.quadraticCurveTo(q.x-l*.45,q.y-q.w*.69,q.x-l*.83,q.y-q.w*.21);
      shape(c,mark,null,p.dark,.9+q.w*.035);
      if(j%2===0)line(c,[q.x-1,q.y+q.w*.53,q.x-4,q.y+q.w*.86],p.leatherDark,.7);
    }
  }
  function scarf(s,p) {
    const y=-249+s.bob, w=s.wind;
    for(let layer=0;layer<2;layer++){
      const top=[],btm=[],centers=[];
      for(let j=0;j<=36;j++){
        const u=j/36, x=-18-u*(layer?79+w*17:91+w*20);
        const yc=y+(layer?3:-2) + (layer?11:6)*Math.sin(u*Math.PI*.9) -
          u*(7+w*19)+(3+7*u+w*4)*Math.sin(s.t*(5+w*3)-u*9+layer*.9)*Math.min(1,u*4);
        const width=(layer?4.2:6.1)*(1-.6*u);
        top.push([x,yc-width]);btm.push([x,yc+width]); centers.push([x,yc]);
      }
      shape(c,trace(c,top.concat([...btm].reverse()),true),layer?p.red:p.redDark,p.ink,1.3);
      for(const j of [30,32])line(c,[top[j][0],top[j][1],btm[j][0]+1,btm[j][1]],p.cream,.9);
      shape(c,trace(c,centers.slice(1,22)),null,layer?'#ee8a54':p.red,1);
    }
  }
  const jersey='M-66-168C-77-175-76-191-66-211Q-56-233-37-247Q-17-262 2-251Q20-244 19-230Q17-211 1-190L-17-170Q-36-155-66-168Z';
  function torso(s,p,stage) {
    c.save(); c.clip(Film.path(jersey));
    c.fillStyle=gradient(c,-66,-245,8,-167,[[0,p.cream],[.45,p.cream],[1,p.shirt]]);
    c.fillRect(-85,-267,116,125);
    for(let i=0;i<8;i++){
      const y=-250+i*12.6;
      const d=new Path2D();d.moveTo(-81,y+10);d.bezierCurveTo(-53,y+14,-11,y+13,24,y-5);
      shape(c,d,null,p.stripe,i%3===1?5.2:3.8);
      c.save(); c.translate(0,3.6); shape(c,d,null,p.blue,.85); c.restore();
    }
    shape(c,'M-69-163Q-76-211-27-250Q-46-213-40-196Q-37-174-5-175L-10-150Z','#283f4530');
    c.restore(); shape(c,jersey,null,p.ink,2);
    shape(c,'M-74-178Q-54-165-23-174L-16-168Q-28-157-48-157Q-62-158-70-163Z',p.navy,p.ink,1.6);
    shape(c,'M-69-174Q-51-166-30-171',null,p.blue,2);
    c.setLineDash([1,2.4]);shape(c,'M-64-181Q-63-207-43-227M-57-171Q-44-168-30-171',null,p.cream,.85);c.setLineDash([]);
    // Leather strap and satchel. The flap and its strap bend together with the torso.
    rod(c,'M3-247C-8-229-30-204-59-184',7,p.leather,p.ink);
    c.setLineDash([1.3,2]); shape(c,'M2-248Q-16-215-59-186',null,p.cream,.7);c.setLineDash([]);
    shape(c,'M-18-221L-12-217-17-210-24-214Z',null,p.brass,1.8);
    c.save();c.translate(-62,-181);c.rotate(-.14+.025*Math.sin(s.crank));
    shape(c,'M-25-17Q-18-22 13-21L20-15 18 14Q18 18 13 20L-20 21Q-26 20-26 13Z',p.leatherDark,p.ink,1.8);
    shape(c,'M-19-22L10-26 15-11-16-7Z',p.cream,p.ink,1.1);
    shape(c,'M-19-22L-1-17 10-26',null,p.leatherDark,.9);
    shape(c,'M-24-13L18-16 18 12Q17 16 13 17L-18 19Q-23 19-23 14Z',p.leather,p.ink,1.3);
    shape(c,'M-25-16L17-19 18-6Q12-1-5 1Q-18 2-25-4Z',p.leather,p.ink,1.55);
    c.setLineDash([1,2]);shape(c,'M-21-12V-6Q-4 1 14-7M-19 14L12 12',null,p.cream,.85);c.setLineDash([]);
    shape(c,'M-8-6L-1-7-1 6-7 7Z',p.leatherDark,p.ink,1);
    shape(c,'M-8 0L0-1 0 4-8 5Z',null,p.brass,1.4);
    shape(c,'M3-12l7-1v5l-7 1zM3-12l3.6 2 3.4-3',null,p.cream,.62);
    c.restore();
  }
  function head(s,k) {
    const nod=.018*Math.sin(s.crank-.8)+.04*s.wind-
      .07*smooth(1.3,2.4,s.t)*(1-smooth(3.6,4.6,s.t))-
      .063*smooth(24.2,25.6,s.t)*(1-smooth(26.5,27.2,s.t));
    c.save();c.translate(-4,-247);c.rotate(nod);c.translate(4,247);
    const x=-36,y=-343,w=194,h=w*heads[k].height/heads[k].width;
    c.drawImage(heads[k],x,y,w,h);
    const phase=Film.mod(s.t+1.19,4.13);
    if(phase<.17){
      const blink=Math.sin(Math.PI*phase/.17);
      c.save();c.translate(x,y);c.scale(w/1768,h/886);
      const lid=new Path2D();
      lid.moveTo(648,357);lid.bezierCurveTo(690,306,752,292,792,321);
      lid.quadraticCurveTo(811,337,806,393);
      lid.bezierCurveTo(754,330+82*blink,695,316+80*blink,648,357);
      shape(c,lid,k===3?'#969d60':'#9e9c4e','#4d4d31',5.5);
      c.restore();
    }
    c.restore();
  }
  function handAt(s) {
    const gather=smooth(27.15,27.67,s.t);
    const send=smooth(27.80,delivery-.035,s.t);
    const back=smooth(delivery+.10,29.67,s.t);
    let x=mix(70,-42,gather),y=mix(-156,-188+s.bob,gather);
    x=mix(x,98,send); y=mix(y,-191,send)-15*Math.sin(send*Math.PI);
    return [mix(x,70,back),mix(y,-156,back)];
  }
  function arm(s,p,far,shoulder) {
    const [hx,hy]=far?[96,-164]:handAt(s);
    const [sx,sy]=shoulder;
    const [ex,ey]=limbJoint(sx,sy,hx-3,hy-3,52,61,-1);
    const path=new Path2D(); path.moveTo(sx,sy);
    path.quadraticCurveTo(mix(sx,ex,.58)-3,mix(sy,ey,.58)+3,ex,ey);
    path.quadraticCurveTo(mix(ex,hx,.45),mix(ey,hy,.45)+3,hx-4,hy-2);
    shape(c,path,null,p.ink,12.2); shape(c,path,null,far?p.dark:p.skin,9.2);
    const glint=new Path2D();glint.moveTo(ex,ey-2);glint.quadraticCurveTo(mix(ex,hx,.48),mix(ey,hy,.48)+.4,hx-5,hy-4);
    shape(c,glint,null,far?'#c9ca8b4f':'#e4d9a173',1.8);
    const u=.54,ax=mix(sx,ex,u),ay=mix(sy,ey,u);
    c.save();c.translate(sx,sy);c.rotate(Math.atan2(ay-sy,ax-sx));
    const len=Math.hypot(ax-sx,ay-sy);
    const sleeve=new Path2D();sleeve.moveTo(-7,-7);sleeve.quadraticCurveTo(2,-14,len+2,-9);sleeve.lineTo(len+4,7);sleeve.quadraticCurveTo(3,14,-7,7);sleeve.quadraticCurveTo(-12,0,-7,-7);
    shape(c,sleeve,far?p.shirt:p.cream,p.ink,1.5);
    c.save();c.clip(sleeve);for(const pos of [4,10,len-1])line(c,[pos,-13,pos+3,13],p.stripe,pos===10?2.6:3.6);c.restore();c.restore();
    for(let j=0;j<4;j++){
      const u=.32+.12*j,x=mix(ex,hx,u),y=mix(ey,hy,u);
      line(c,[x-2,y+1,x+.4,y-.9],p.dark,.85);
    }
    c.save();c.translate(hx,hy);
    if(!far&&s.t>=27.59&&s.t<delivery){
      c.save();c.rotate(-.08+.06*Math.sin(s.t*8));c.translate(0,-10);
      shape(c,'M-1-8H29V10H-1Z',p.cream,p.ink,1.15);
      shape(c,'M-1-8L14 3 29-8M-1 10L8 2M29 10L21 3',null,p.leatherDark,.8);
      shape(c,'M22-6H27V-1H22Z',p.red); c.restore();
    }
    shape(c,'M-9-4Q-7-10-2-8L3-7Q8-7 10-3L9 2Q8 4 6 2L5-2 4 3Q2 5 0 2L-1-1-3 2Q-6 3-7 0Z',far?p.dark:p.skin,p.ink,1.35);
    shape(c,'M8-1L9 1M3 0L4 2M-2 0L-3 1',null,p.cream,.85);
    c.restore();
  }
  function frame(s,k) {
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,sheet.width,sheet.height);
    c.setTransform(res,0,0,res,-bounds[0]*res,-bounds[1]*res);
    c.lineCap='round';c.lineJoin='round';
    const p=palettes[k],lean=.035+s.wind*.12;
    function shoulder(x,y){
      const dx=x+45,dy=y+169;
      return [-45+dx*Math.cos(lean)-dy*Math.sin(lean),-169+s.bob+dx*Math.sin(lean)+dy*Math.cos(lean)];
    }
    wheel(rear,s.wheel,k);wheel(front,s.wheel,k);
    crankArm(s.crank+Math.PI,true,p);leg(s,s.crank+Math.PI,true,p);
    arm(s,p,true,shoulder(4,-232));
    bicycle(s,p,k);crankArm(s.crank,false,p);
    tail(s,p,k);leg(s,s.crank,false,p);
    c.save();c.translate(-45,-169+s.bob);c.rotate(lean);c.translate(45,169);
    scarf({...s,bob:0},p);torso(s,p,k);head(s,k);c.restore();
    arm(s,p,false,shoulder(-10,-230));
    // Fixed-to-cel paper tooth; the grain never crawls across the drawing.
    c.save();c.globalCompositeOperation='source-atop';c.globalAlpha=k===2?.80:.56;
    c.fillStyle=grains[k];c.fillRect(...bounds);c.restore();
    return sheet;
  }
  function stamp(ctx,sprite) {ctx.drawImage(sprite,bounds[0],bounds[1],bounds[2],bounds[3]);}
  return {init,frame,stamp};
})();
