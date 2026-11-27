'use strict';

const Scenery = (() => {
  const {W,H,TAU,scale,roadY,contactY,delivery,shot,clamp,mix,mod,smooth,rng,surface,
         shape,line,ellipse,gradient,dotGlow,camera,distance} = Film;
  const groundCuts=[.852,.858,.806,.806], plates=[], roadTiles=[], sprigs=[];
  const seed=rng(674043), specks=Array.from({length:205},()=>({
    x:seed(),y:seed(),z:seed(),a:seed()*TAU,b:seed(),c:seed(),d:seed()}));
  const reflection=surface(810,175), mirror=reflection.getContext('2d');
  let wallTile, cast, castCtx, weed;
  function band(image,y0,y1) {
    const srcY=Math.round(image.height*y0), end=Math.round(image.height*y1);
    const w=image.width,h=Math.max(1,end-srcY),tile=surface(w*2,h),g=tile.getContext('2d');
    g.drawImage(image,0,srcY,w,h,0,0,w,h);
    g.translate(w*2,0);g.scale(-1,1);g.drawImage(image,0,srcY,w,h,0,0,w,h);
    return tile;
  }
  function tileAcross(c,tile,xOffset,top,height,halfWidth) {
    const width=halfWidth*2, start=-mod(xOffset,width);
    for(let x=start;x<W;x+=width)c.drawImage(tile,x,top,width+.28,height);
  }
  function blade(c,x,y,dx,dy,width,fill,edge) {
    const len=Math.max(1,Math.hypot(dx,dy)),nx=-dy/len*width,ny=dx/len*width;
    const brush=new Path2D();
    brush.moveTo(x,y);brush.quadraticCurveTo(x+dx*.52+nx,y+dy*.52+ny,x+dx,y+dy);
    brush.quadraticCurveTo(x+dx*.50-nx,y+dy*.48-ny,x,y);
    shape(c,brush,fill,edge,.85);
    line(c,[x,y,x+dx*.89,y+dy*.89],edge,.75);
  }
  function plant(stage,variant) {
    const s=surface(238,160),g=s.getContext('2d'),r=rng(483+stage*134+variant*125);
    g.translate(116,152);g.lineCap='round';g.lineJoin='round';
    if(stage===2){
      const cols=['#454b3d','#576954','#867b46','#b49250','#343c3c'];
      for(let i=0;i<26;i++){
        const a=-Math.PI+.15+r()*(Math.PI-.25),l=28+59*r();
        const dx=Math.cos(a)*l,dy=Math.sin(a)*l;
        blade(g,(r()-.5)*21,0,dx,dy,3+r()*4,cols[i%5],'#343c39');
        line(g,[dx*.22,dy*.22,dx*.89+1,dy*.86],'#e9ae5d',.9);
      }
    }else if(stage===3){
      for(let j=0;j<5;j++){
        const x=(r()-.5)*80,y=-17-r()*53;
        line(g,[x*.52,4,x*.8,y*.6,x,y],'#233e56',2);
        for(let i=0;i<6;i++){
          const v=.14+i*.13,w=(1-v)*15+5;
          const xx=x*(.55+.45*v),yy=y*v;
          for(const flip of [-1,1]){
            shape(g,new Path2D('M'+xx+' '+yy+'q'+(flip*w*.7)+' 3 '+(flip*w)+' 10q'+(-flip*w*.25)+' 1 '+(-flip*w*.37)+' -3l'+(flip*w*.08)+' 3z'),'#29516b');
            line(g,[xx,yy+1,xx+flip*w*.77,yy+7],'#e0e8e7',1.5);
          }
        }
      }
    }else{
      const colors=stage===0?['#4b6d55','#557956','#769267','#334f4a']:['#415550','#697567','#4d6259','#88917b'];
      for(let j=0;j<13;j++){
        const dx=(r()-.5)*154,dy=-20-r()*67,sx=(r()-.5)*40;
        const stem=new Path2D();stem.moveTo(sx,0);stem.quadraticCurveTo(sx+dx*.34,dy*.73,sx+dx,dy);
        shape(g,stem,null,colors[j%4],1.5+r()*1.1);
        for(let i=1;i<=6;i++){
          const v=i/7, x=sx+dx*v*v*.43+dx*v*.57,y=dy*(v*1.25-v*v*.25);
          const dir=(j+i)%2?1:-1;
          blade(g,x,y,dir*(5+r()*10),-3-r()*8,1.7+r()*1.6,colors[(i+j)%4],colors[(i+j+1)%4]);
        }
        if(stage===0&&j%3===0)for(let i=0;i<5;i++)ellipse(g,sx+dx+(r()-.5)*7,dy+(r()-.5)*9,1.3,1.9,'#b392a8');
      }
    }
    return s;
  }
  function tumbleweed() {
    const tw=surface(92,92),g=tw.getContext('2d'),r=rng(881);
    g.translate(47,46);g.lineCap='round';
    for(let i=0;i<62;i++){
      const a=r()*TAU,rr=17+21*r(),x=rr*Math.cos(a),y=rr*Math.sin(a);
      const d=new Path2D();d.moveTo(-x*.28,-y*.23);d.quadraticCurveTo(-y*.3,x*.3,x,y);
      shape(g,d,null,i%3?'#6a482d':'#e6a855',.7+r()*1);
      line(g,[x*.67,y*.67,x*.76-y*.14,y*.71+x*.14],i%3?'#825039':'#e7b573',.95);
    }
    return tw;
  }
  function init(images) {
    images.forEach((img,k)=>{plates.push(img);roadTiles.push(band(img,groundCuts[k],1));
      sprigs.push([plant(k,0),plant(k,1),plant(k,2)]);});
    wallTile=band(images[0],.735,.854);
    weed=tumbleweed();
  }
  function world(c,s,k) {
    const img=plates[k],top=groundCuts[k],pw=1870,ph=roadY/top;
    const shotBase=camera(k*shot), shotEnd=camera((k+1)*shot);
    const u=clamp((s.cam-shotBase+350)/(shotEnd-shotBase+510));
    const x=-17-(pw-W-34)*u;
    c.drawImage(img,x,0,pw,ph);
    if(k===3) {
      // Move the tissue-paper ribbons as one soft sheet; the mountains stay on their registration.
      const limit=ph*.36,step=3;
      for(let y=0;y<limit;y+=step){
        const w=1-smooth(limit*.42,limit,y);
        const dx=w*(4.5*Math.sin(s.t*1.08+y*.018)+2*Math.sin(s.t*.7+y*.028));
        const sy=y*img.height/ph, h=(step+.22)*img.height/ph;
        c.drawImage(img,0,sy,img.width,h,x+dx,y,pw,step+.22);
      }
    }
    if(k===1||k===3) {
      // Subpixel drift in reflected roof lines and in the snow station's windows.
      const lo=k===1?.751:.678, hi=k===1?.849:.731;
      for(let yy=lo*ph;yy<hi*ph;yy+=3){
        const amp=Math.sin(Math.PI*(yy-lo*ph)/((hi-lo)*ph));
        const offset=amp*(1.35*Math.sin(yy*.26+s.t*3)+.65*Math.sin(yy*.47-s.t*2));
        c.drawImage(img,0,yy/ph*img.height,img.width,3.15/ph*img.height,x+offset,yy,pw,3.15);
      }
    }
    const wash=['rgba(255,235,199,.105)','rgba(244,240,221,.075)','rgba(255,209,156,.065)','rgba(174,202,225,.065)'][k];
    c.fillStyle=gradient(c,0,40,0,roadY,[[0,'rgba(250,242,220,0)'],[.59,wash],[1,wash]]);
    c.fillRect(0,0,W,roadY);
    if(k===0) {
      const ledge=ph*.735;
      tileAcross(c,wallTile,s.cam*.46+138,ledge,roadY-ledge+.9,1540);
    }
    tileAcross(c,roadTiles[k],s.cam+[80,631,849,170][k],roadY,H-roadY+.3,1570);
    if(k===0) seaGlitter(c,s,x,pw,ph);
    if(k===1) rainRings(c,s);
    if(k===2) grit(c,s,true);
    if(k===3) skyLight(c,s,x,pw,ph);
  }
  function seaGlitter(c,s,x,pw,ph) {
    for(let i=0;i<48;i++){
      const h=specks[i],v=.578+h.y*.143, u=.012+h.x*.25;
      const a=Math.max(0,Math.sin(s.t*(1.1+h.b*2.7)+h.a));
      if(a<.28)continue;
      const px=x+u*pw,py=ph*v+Math.sin(s.t+h.a)*1.1;
      c.globalAlpha=a*.48;line(c,[px,py,px+1.4+h.z*6,py-.35],'#fff6be',.7+h.z);
    }c.globalAlpha=1;
  }
  function gull(c,x,y,size,t) {
    c.save();c.translate(x,y);c.scale(size,size);c.rotate(-.06+Math.sin(t*.7)*.04);
    const flap=Math.sin(t*4.1), a=-8-11*flap,b=-3-6*flap;
    const p=new Path2D();p.moveTo(-2,0);p.quadraticCurveTo(-8,a*.83,-26,a-1);
    p.quadraticCurveTo(-16,b+1,-7,1);p.quadraticCurveTo(-2,4,7,1);
    p.lineTo(11,.3);p.lineTo(7,-1.6);p.quadraticCurveTo(4,-3,2,-1);
    p.quadraticCurveTo(11,a*.82+2,18,a+2);p.quadraticCurveTo(9,b+4,1,2);p.closePath();
    shape(c,p,'#f4ead0','#4c6264',1.1);
    line(c,[-24,a,-18,a+1.4],'#455a62',1.45);c.restore();
  }
  function farLife(c,s,k) {
    if(k===0){
      for(let j=0;j<4;j++){
        const x=mod(115+173*j+s.t*(40+j*4),W+260)-75,
          y=138+34*j+19*Math.sin(s.t*.63+j*1.52);
        gull(c,x,y,.43+.12*(j%3),s.t+j*1.7);
      }
      gull(c,68+111*s.t,254-27*Math.sin(.63*s.t),1.02,s.t+.4);
    }
    if(k===1)rain(c,s,false);
    if(k===3)snow(c,s,false);
  }
  function rain(c,s,near) {
    const n=near?74:123,start=near?126:0;
    for(let i=start;i<start+n;i++) {
      const e=specks[i],z=e.z,spd=(near?695:413)+(near?335:240)*z;
      const x=mod(e.x*(W+190)-s.t*(spd*.27+12)-s.cam*(near?.095:.028),W+190)-45;
      const y=mod(e.y*(H+100)+s.t*spd,H+100)-50;
      const l=(near?12:6)+z*(near?21:10);
      c.globalAlpha=(near?.29:.15)+.12*e.b;
      line(c,[x,y,x-l*.28,y+l],i%4===0?'#5a6864':'#e9f4ed',near?.95+z*.55:.8);
    }c.globalAlpha=1;
  }
  function rainRings(c,s) {
    for(let i=0;i<30;i++){
      const z=specks[i],u=mod(s.t*(.62+z.b*.42)+z.a,1);
      const x=mod(z.x*(W+140)-s.cam*(.38+z.y*.62),W+140)-60;
      const y=roadY+5+z.y*(H-roadY-8);
      c.globalAlpha=(1-u)*.45;
      ellipse(c,x,y,1+u*(7+z.z*13),.5+u*(1.5+z.z*2.7),null,'#e5e9dd',.85);
    }c.globalAlpha=1;
  }
  function grit(c,s,far) {
    const n=far?56:47;
    for(let i=0;i<n;i++){
      const q=specks[(far?0:81)+i],v=(far?240:530)+(180+210*s.wind)*q.z;
      const x=mod(q.x*(W+180)-v*s.t-s.cam*(far?.02:.17),W+180)-80;
      const y=(far?H*.24:H*.50)+q.y*(far?H*.57:H*.49)+Math.sin(x*.005+s.t*2+q.a)*8;
      c.globalAlpha=(far?.12:.25)+q.z*.17;
      const d=new Path2D();d.moveTo(x,y);d.quadraticCurveTo(x-7-q.b*7,y+1,x-(far?7:10)-q.b*(far?15:36),y+2+q.c);
      shape(c,d,null,i%4===0?'#862e21':'#ffd083',.7+q.z*1.1);
    }c.globalAlpha=1;
  }
  function snow(c,s,near) {
    const start=near?127:0,n=near?76:125;
    for(let i=start;i<start+n;i++){
      const q=specks[i],v=near?50+q.z*61:20+q.z*46;
      const x=mod(q.x*(W+160)-s.cam*(near?.29+q.b*.27:.07)-s.t*(24+q.z*35)+
          Math.sin(s.t*(.7+q.b*.5)+q.a)*18,W+160)-70;
      const y=mod(q.y*(H+80)+s.t*v,H+80)-36;
      const radius=(near?1.4:.65)+q.z*(near?2.6:1.2);
      c.globalAlpha=(near?.45:.37)+q.y*.4;
      ellipse(c,x,y,radius,radius*(.67+.23*q.b),(near&&x>s.x&&y>s.y-238&&y<s.y)?'#fff0c9':'#edf5fb',null,1,-.7+q.a);
      if(near&&i%19===0) {
        line(c,[x-radius*1.5,y,x+radius*1.5,y],'#f4ffff',.8);
        line(c,[x,y-radius*1.5,x,y+radius*1.5],'#f4ffff',.75);
      }
    }c.globalAlpha=1;
  }
  function skyLight(c,s,x,pw,ph) {
    c.save();c.globalCompositeOperation='screen';
    c.globalAlpha=.32+.18*Math.sin(s.t*1.35);
    dotGlow(c,x+pw*.50,40,186,'rgba(83,226,165,.28)','rgba(54,160,168,0)');
    for(let i=0;i<11;i++){
      const q=specks[14+i],xx=x+pw*(.20+.52*q.x),yy=(.065+.19*q.y)*ph;
      const a=Math.max(0,Math.sin(s.t*(1.1+q.z)+q.a));
      if(a<.4)continue;
      c.globalAlpha=a*.67;
      line(c,[xx-2.5,yy,xx+2.5,yy],'#fff0d3',.8);
      line(c,[xx,yy-2.9,xx,yy+2.9],'#fff0d3',.8);
    }c.restore();
  }
  function airbornePetals(c,s) {
    for(let i=0;i<12;i++){
      const q=specks[45+i],x=mod(q.x*(W+160)-s.cam*.25-s.t*(34+q.z*43),W+160)-70;
      const y=mod(q.y*H+s.t*(12+q.c*9)+21*Math.sin(s.t+q.a),H+50)-20;
      c.save();c.translate(x,y);c.rotate(s.t*(.62+q.z)+q.a);
      c.scale(.35+.65*Math.abs(Math.sin(s.t*1.35+q.a)),1);
      shape(c,'M-4 0Q-1-3.5 4-1Q2 2.5-4 0Z',i%4?'#fff0c0':'#b0b665','#b49e6755',.65);c.restore();
    }
  }
  function tyreWake(c,s,k) {
    if(k===0)return;
    for(let j=0;j<(k===3?29:23);j++){
      const q=specks[60+j],u=mod(s.t*(1.5+q.b*1.9)+q.a,1);
      const wx=s.x+(j%4===0?126:-102)*scale;
      const x=wx-2-u*(14+q.c*75),y=s.y-4*u*(1-u)*(6+q.z*(k===1?20:13))+2.5;
      c.globalAlpha=(1-u)*(k===1?.76:.65);
      if(k===1)line(c,[x,y,x-(1-u)*2,y+(1-u)*3.5],'#e2ede7',1+q.z);
      else ellipse(c,x,y,1+q.z*2,.8+q.z*1.2,k===2?'#e9a054':'#f9fbfb');
    }c.globalAlpha=1;
  }
  function shadow(c,s,picture,k) {
    c.save();c.translate(s.x+7,s.y+2);c.scale(1,.084);
    dotGlow(c,0,0,247,['#5443355c','#34474752','#381e286b','#2f57756b'][k],'rgba(35,40,45,0)');
    c.restore();
    if(k===0||k===2){
      if(!cast){cast=surface(picture.width,picture.height);castCtx=cast.getContext('2d');}
      castCtx.clearRect(0,0,cast.width,cast.height);castCtx.drawImage(picture,0,0);
      castCtx.globalCompositeOperation='source-in';castCtx.fillStyle=k===0?'#4f5360':'#401e2d';
      castCtx.fillRect(0,0,cast.width,cast.height);castCtx.globalCompositeOperation='source-over';
      c.save();c.globalAlpha=k===0?.17:.21;
      c.transform(scale,0,k===0?-.32:-.74,-scale*(k===0?.13:.17),s.x,s.y+1);
      Rider.stamp(c,cast);c.restore();
    }
    for(const x of [-102,126]){
      c.save();c.translate(s.x+x*scale,s.y+1);c.scale(1,.105);
      dotGlow(c,0,0,36,'rgba(30,39,38,.50)','rgba(30,39,38,0)');c.restore();
    }
    if(k===1) {
      mirror.setTransform(1,0,0,1,0,0);mirror.clearRect(0,0,810,175);
      mirror.save();mirror.translate(395,0);mirror.scale(scale,-scale*.36);Rider.stamp(mirror,picture);mirror.restore();
      mirror.globalCompositeOperation='destination-in';
      mirror.fillStyle=gradient(mirror,0,0,0,170,[[0,'#fff'],[.53,'#ffffffa8'],[1,'#ffffff00']]);
      mirror.fillRect(0,0,810,175);mirror.globalCompositeOperation='source-over';
      c.globalAlpha=.29;
      for(let y=0;y<155;y+=4){
        const dx=(.6+y*.012)*Math.sin(y*.18+s.t*4.3);
        c.drawImage(reflection,0,y,810,3.5,s.x-395+dx,s.y+y,810,3.6);
      }c.globalAlpha=1;
    }
  }
  function headlamp(c,s) {
    const x=s.x+126*scale,y=s.y-137*scale;
    c.save();c.translate(x,y);
    c.rotate(.19+.004*Math.sin(s.crank*2));
    const g=gradient(c,0,0,451,0,[[0,'rgba(255,220,138,.36)'],[.43,'rgba(255,226,152,.17)'],[1,'rgba(255,224,154,0)']]);
    const p=new Path2D();p.moveTo(0,-3);p.quadraticCurveTo(208,-23,442,-39);
    p.lineTo(450,104);p.quadraticCurveTo(250,50,0,3);p.closePath();shape(c,p,g);
    dotGlow(c,0,0,20,'rgba(255,224,145,.75)','rgba(255,233,188,0)');c.restore();
    c.save();c.translate(x+350,s.y+4);c.scale(1,.095);
    dotGlow(c,0,0,166,'rgba(255,228,166,.27)','rgba(255,238,180,0)');c.restore();
  }
  function mailbox(c,s) {
    const at=Film.motion(delivery);
    const x=at.x+127*scale-(s.cam-at.cam),y=contactY-7;
    if(x>W+140||x< -160)return;
    c.save();c.translate(x,y);c.scale(scale,scale);c.lineJoin='round';c.lineCap='round';
    ellipse(c,9,1,61,4.3,'#7287a76b');
    shape(c,'M-27 0L-28-9-23-14-24-175Q-28-178-29-184L-29-193Q-29-206-21-215Q-13-224 0-226Q16-227 28-216Q35-209 35-197V-185L30-180 29-14 35-9 35 0Z','#963a40','#293b51',2);
    shape(c,'M11-222Q29-217 32-196L30-15 34-8H16Z','#763742');
    shape(c,'M-25-191L-22-179-20-20-13-17-15-182Z','#c3574e');
    shape(c,'M-27-185H32M-24-177L30-177M-24-16L29-16M-26-10H32',null,'#e78a66',1.5);
    shape(c,'M-30-197Q-30-216-14-224Q-5-228 5-228Q25-228 34-210L38-200Q36-193 30-198Q27-202 23-196Q20-191 16-198Q11-203 8-198Q6-193 3-197Q-4-201-11-198Q-17-196-23-198Q-28-195-30-197Z','#e4e9ed','#54758c',1.1);
    shape(c,'M-20-190H22L23-181H-20Z','#4c3941','#edbb83',1.5);
    shape(c,'M-20-190L-16-194H20L24-189Z','#d67a56','#613b40',.9);
    shape(c,'M-17-165Q1-170 20-165L19-125Q2-121-17-125Z','#ad4a49','#d88c6b',1);
    c.save();c.translate(1,-146);
    shape(c,'M-8-5H8V5H-8Z','#ebc589','#513842',.8);
    shape(c,'M-8-5L0 1 8-5',null,'#835446',1.0);
    shape(c,'M-9-2Q-13-8-18-7L-16-4-10 0M9-2Q14-8 17-7L15-4 10 0',null,'#ecc18c',1.4);
    c.restore();
    shape(c,'M-17-111H19V-29H-17Z',null,'#713d44',1.4);
    ellipse(c,11,-102,2.5,2.5,'#e5b474','#533b43',.8);
    if(s.t>=delivery){
      const lift=7*(1-smooth(delivery,delivery+.39,s.t));
      if(lift>.01)shape(c,new Path2D('M-14-183H13L10 '+(-183-lift)+'H-12Z'),'#e9d9b6');
      const flutter=2.8*Math.exp(-Math.max(0,s.t-delivery)*6)*Math.sin((s.t-delivery)*30);
      line(c,[-19,-184+flutter,20,-184+flutter],'#e6a871',1.6);
    }
    shape(c,'M-42 1Q-35-5-29-3Q-23-10-16-6Q-3-10 6-6Q17-10 23-5Q33-6 42-2L48 2Z','#e4eaf1','#acbed3',.8);
    c.restore();
  }
  function foreground(c,s,k) {
    const offset=s.cam*1.17;
    const period=1980;
    for(let j=0;j<4;j++){
      const x=mod([190,684,1084,1663][j]+k*231-offset,period)-170;
      const size=[.88,.44,1.06,.53][(j+k)%4];
      c.drawImage(sprigs[k][j%3],x-116*size,H-148*size+19+(j%2)*7,238*size,160*size);
    }
    if(k===0)airbornePetals(c,s);
    if(k===1)rain(c,s,true);
    if(k===2) {
      grit(c,s,false);
      const tt=s.t-16,xx=1800-(tt+.42)*331;
      const yy=roadY+56-15*Math.abs(Math.sin(tt*2.1));
      c.save();c.translate(xx,yy);c.rotate(-tt*4);c.drawImage(weed,-36,-36,72,72);c.restore();
    }
    if(k===3)snow(c,s,true);
  }
  function draw(c,s,k) {
    c.save();c.lineJoin='round';c.lineCap='round';
    world(c,s,k);farLife(c,s,k);
    if(k===3)mailbox(c,s);
    const picture=Rider.frame(s,k);
    shadow(c,s,picture,k);
    if(k===3)headlamp(c,s);
    c.save();c.translate(s.x,s.y);c.scale(scale,scale);Rider.stamp(c,picture);c.restore();
    tyreWake(c,s,k);foreground(c,s,k);
    c.restore();
  }
  return {init,draw};
})();
