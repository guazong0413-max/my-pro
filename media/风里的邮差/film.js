'use strict';

window.Atlas = (() => {
  const {W,H,duration,shot,wipe,clamp,smooth,motion}=Film;
  const canvas=document.querySelector('canvas'), ctx=canvas.getContext('2d',{alpha:false});
  const byId=id=>document.getElementById(id);
  const scrub=byId('scrub'),play=byId('play'),sound=byId('sound'),music=byId('score');
  const chapters=[...document.querySelectorAll('[data-scene]')], status=byId('status');
  const capture=new URLSearchParams(location.search).has('capture');
  let time=0, playing=false, audible=false, frameId=0, previous=null, visibleChapter=-1;
  function loadImage(name){
    return new Promise((ok,fail)=>{
      const i=new Image();
      i.onload=()=>ok(i);i.onerror=()=>fail(Error('无法载入 '+name));
      i.src=window.ATLAS_IMAGES?.[name] || 'art/'+name+'.png';
    });
  }
  // The two sides of the paper edge sample the very same instant of the pedal cycle.
  function edge(u,y) {
    const actual=smooth(0,1,u);
    return W+170-(W+340)*actual+(y/H-.5)*78+14*Math.sin(y*.007+1.6)+
      5.15*Math.sin(y*.035+.5)+2.1*Math.sin(y*.139)+1.6*Math.sin(.47*y+.8);
  }
  function paperPath(u,offset=0) {
    const d=new Path2D();d.moveTo(edge(u,0)+offset,-2);
    for(let y=0;y<=H;y+=3)d.lineTo(edge(u,y)+offset,y);
    d.lineTo(W+240,H+2);d.lineTo(W+240,-2);d.closePath();
    return d;
  }
  function draw(t) {
    time=clamp(t,0,duration);
    const k=Math.min(3,Math.floor(time/shot)),s=motion(time);
    ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    const lens=1+.049*Math.sin(Math.PI*clamp(time/8))**2+
      .105*Math.sin(Math.PI*clamp((time-8)/8))**2+
      .065*Math.sin(Math.PI*clamp((time-16)/8))**2+
      .092*smooth(25.5,28.55,time)*(1-smooth(29.1,31.6,time));
    const focalX=clamp(s.x+65,540,960),focalY=565;
    ctx.translate(focalX,focalY);ctx.scale(lens,lens);ctx.translate(-focalX,-focalY);
    Scenery.draw(ctx,s,k);
    let active=k;
    if(k<3&&time>(k+1)*shot-wipe){
      const u=(time-((k+1)*shot-wipe))/wipe;
      ctx.save();
      for(const [offset,color] of [[-13,'#29282d13'],[-8,'#352c3224'],[-4.2,'#887a6266'],[-2.8,'#f4e2be']]){
        ctx.fillStyle=color;ctx.fill(paperPath(u,offset));
      }
      ctx.clip(paperPath(u));Scenery.draw(ctx,s,k+1);ctx.restore();
      if(edge(u,s.y-200)<s.x)active=k+1;
    }
    if(!capture){
      if(visibleChapter!==active){
        chapters.forEach((b,i)=>b.setAttribute('aria-current',String(active===i)));visibleChapter=active;
      }
      scrub.value=String(time);
      byId('counter').textContent='00:'+String(Math.floor(time)).padStart(2,'0')+' / 00:32';
    }
    return time;
  }
  function soundIcon() {
    sound.setAttribute('aria-pressed',String(audible));
    sound.title=sound.ariaLabel=audible?'关闭原声':'开启原声';
    byId('soundmark').setAttribute('d',audible?'M15 7q4 3 0 6m3-9q7 6 0 12':'m15 7 5 6m0-6-5 6');
  }
  function playAudio(){
    if(!audible||!playing||document.hidden) return;
    music.currentTime=time;
    music.play().catch(()=>{audible=false;soundIcon();});
  }
  function tick(stamp){
    if(!playing||document.hidden)return;
    if(previous===null)previous=stamp;
    const next=time+(stamp-previous)/1000;previous=stamp;
    draw(audible&&!music.paused&&!music.seeking?music.currentTime:next);
    if(next>=duration||music.ended&&audible){draw(duration);setPlaying(false);return;}
    frameId=requestAnimationFrame(tick);
  }
  function setPlaying(value) {
    cancelAnimationFrame(frameId);previous=null;playing=value;
    if(playing&&time>=duration-.01)draw(0);
    play.title=play.ariaLabel=playing?'暂停':time>=duration-.01?'重播':'播放';
    byId('playmark').setAttribute('d',playing?'M5 3h3v14H5zm7 0h3v14h-3z':'M5 2.5 17 10 5 17.5z');
    if(playing){playAudio();frameId=requestAnimationFrame(tick);}else music.pause();
  }
  function seek(t){draw(t);previous=null;if(audible)music.currentTime=time;}
  const ready=Promise.all(['riviera','canal','canyon','polar','postman'].map(loadImage)).then(imgs=>{
    Rider.init(imgs[4]);Scenery.init(imgs.slice(0,4));draw(0);status.hidden=true;
    play.addEventListener('click',()=>setPlaying(!playing));
    sound.addEventListener('click',()=>{audible=!audible;soundIcon();if(audible){if(!playing)setPlaying(true);else playAudio();}else music.pause();});
    scrub.addEventListener('input',()=>seek(Number(scrub.value)));
    chapters.forEach(b=>b.addEventListener('click',()=>seek(Number(b.dataset.scene)*shot)));
    document.addEventListener('visibilitychange',()=>{previous=null;cancelAnimationFrame(frameId);if(document.hidden)music.pause();else if(playing){playAudio();frameId=requestAnimationFrame(tick);}});
    if(!capture)setPlaying(!matchMedia('(prefers-reduced-motion: reduce)').matches);
    return true;
  }).catch(e=>{status.textContent=e.message;throw e;});
  return {ready,draw,seek,canvas,setPlaying};
})();
