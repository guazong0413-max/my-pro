'use strict';

const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {once}=require('node:events');
const root=path.resolve(__dirname,'..');
const work=path.join(root,'..','target','crocodile-weather-ride');
fs.mkdirSync(work,{recursive:true});
const mode=process.argv[2]||'proof';
const chrome=process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser=spawn(chrome,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
  '--incognito','--disable-background-networking','--disable-component-update','--disable-sync',
  '--disable-breakpad','--disable-extensions','--disable-background-timer-throttling',
  '--disable-renderer-backgrounding','--allow-file-access-from-files','--remote-debugging-pipe',
  '--user-data-dir='+path.join(work,'chrome-'+mode),'about:blank'],{stdio:['ignore','ignore','ignore','pipe','pipe']});
let buffer=Buffer.alloc(0),id=0,session;
const pending=new Map();
browser.stdio[4].on('data',data=>{
  buffer=Buffer.concat([buffer,data]);let split;
  while((split=buffer.indexOf(0))!==-1){
    const message=JSON.parse(buffer.subarray(0,split));buffer=buffer.subarray(split+1);
    if(message.id&&pending.has(message.id)){
      const {yes,no}=pending.get(message.id);pending.delete(message.id);
      if(message.error)no(Error(message.error.message));else yes(message.result);
    }
    if(message.method==='Runtime.exceptionThrown')console.error(message.params.exceptionDetails.exception?.description||message.params.exceptionDetails.text);
  }
});
browser.on('exit',()=>{for(const p of pending.values())p.no(Error('Chrome exited'));pending.clear();});
function CDP(method,params={},s){
  const n=++id;
  return new Promise((yes,no)=>{
    pending.set(n,{yes,no});
    browser.stdio[3].write(JSON.stringify({id:n,method,params,...s&&{sessionId:s}})+'\0');
  });
}
async function evaluate(expression){
  const r=await CDP('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},session);
  if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
  return r.result.value;
}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function start(){
  const {targetId}=await CDP('Target.createTarget',{url:'about:blank'});
  session=(await CDP('Target.attachToTarget',{targetId,flatten:true})).sessionId;
  await CDP('Page.enable',{},session);await CDP('Runtime.enable',{},session);
  const source=mode==='controls'?'风里的邮差.html':'index.html';
  await CDP('Page.navigate',{url:pathToFileURL(path.join(root,source)).href+(mode==='controls'?'':'?capture')},session);
  await CDP('Page.bringToFront',{},session);
  for(let i=0;i<100;i++){if(await evaluate('Boolean(window.Atlas)'))break;await delay(75);}
  await evaluate('Atlas.ready');
}
async function jpeg(t,quality=.96){
  const b64=await evaluate('Atlas.draw('+t+');Atlas.canvas.toDataURL("image/jpeg",'+quality+').slice(23)');
  return Buffer.from(b64,'base64');
}
async function main(){
  await start();
  if(mode==='proof'){
    const times=[2.7,7.27,10.8,14.1,18.6,23.3,25.2,27.75,28.86,29.35,31.93];
    for(const [i,t] of times.entries())fs.writeFileSync(path.join(work,'shot-'+String(i).padStart(2,'0')+'.jpg'),await jpeg(t));
    console.log('Rendered '+times.length+' proof frames');return;
  }
  if(mode==='controls'){
    await evaluate('Atlas.setPlaying(false); document.querySelector("[data-scene=\'2\']").click()');
    const position=await evaluate('Number(document.querySelector("#scrub").value)');
    if(position!==16)throw Error('Chapter selection failed: '+position);
    await evaluate('document.querySelector("#scrub").value=13.17;document.querySelector("#scrub").dispatchEvent(new Event("input"))');
    const label=await evaluate('document.querySelector("[aria-current=true]").textContent');
    if(label!=='江南雨巷')throw Error('Seek failed: '+label);
    await evaluate('document.querySelector("#play").click()');
    await delay(450);
    await evaluate('document.querySelector("#play").click()');
    const a=await evaluate('Number(document.querySelector("#scrub").value)');
    await delay(240);
    const b=await evaluate('Number(document.querySelector("#scrub").value)');
    if(a<=13.17 || a!==b) throw Error('Play/pause failed: '+a+' '+b);
    await CDP('Runtime.evaluate',{expression:'document.querySelector("#sound").click()',userGesture:true},session);
    let audio;
    for(let attempt=0;attempt<40;attempt++){
      await delay(250);
      audio=await evaluate('(()=>{const m=document.querySelector("audio");return {paused:m.paused,t:m.currentTime,ready:m.readyState,error:m.error?.message}})()');
      if(audio.error||(!audio.paused&&audio.t>a+.15))break;
    }
    if(audio.paused||audio.error||audio.t<=a+.15)throw Error('Sound failed: '+JSON.stringify({audio,pausedAt:a}));
    console.log('Portable HTML verified. Chapter at '+position+', scrub to '+label+', play/pause at '+a+', audio at '+audio.t.toFixed(2));
    return;
  }
  if(mode!=='movie')throw Error('Unknown render mode');
  const fps=30, count=32*fps;
  await evaluate('Atlas.canvas.width=1920;Atlas.canvas.height=1080');
  const output=path.join(root,'风里的邮差.mp4');
  const ff=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','pipe:0',
    '-i',path.join(root,'art','ride.m4a'),'-map','0:v:0','-map','1:a:0','-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v','libx264','-preset','fast','-crf','17','-threads','6','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',
    '-c:a','copy','-t','32','-movflags','+faststart','-metadata','title=风里的邮差',output],
    {stdio:['pipe','ignore','inherit']});
  const done=once(ff,'close');ff.stdin.on('error',e=>console.error(e.message));
  for(let i=0;i<count;i++){
    const data=await jpeg(i/fps,.95);
    if(!ff.stdin.write(data))await once(ff.stdin,'drain');
    if(i%120===0)console.log('Frame '+i+' / '+count);
  }
  ff.stdin.end();const [code]=await done;
  if(code!==0)throw Error('ffmpeg exit '+code);
  console.log(output);
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>browser.kill());
