"""Synchronize generated voice and synthesized physical Foley to the shot plan."""
import argparse
import json
import math
import subprocess
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt, sosfiltfilt

ROOT=Path(__file__).resolve().parent
PLAN=json.loads((ROOT/"timeline.json").read_text(encoding="utf-8-sig"))
CUES=PLAN["events"]
RATE=48000
FRAMES=round(RATE*PLAN["duration"])

VOICE={
    # High pass, low pass, active RMS, pan and early reflections.
    "narrator":(92,5120,-24.8,0.,(.027,.061),(.067,.032)),
    "yu":(105,3900,-26.5,.073,(.033,.067,.093),(.108,.065,.030)),
    "mei":(107,3700,-26.8,-.09,(.020,.041,.072),(.085,.047,.021)),
    "radio":(338,2690,-29.2,-.23,(.028,.052),(.071,.041)),
    "uncle":(109,2990,-29.7,.13,(.019,.042),(.064,.031)),
}


def rms(x):
    return float(np.sqrt(np.mean(x*x)+1e-13))


def gain(db):
    return math.pow(10,db/20)


def level(data,db,peak=-8):
    return data*min(gain(db)/max(rms(data),1e-8),gain(peak)/max(float(np.max(np.abs(data))),1e-8))


def transient(data,db):
    return data*(gain(db)/max(float(np.max(np.abs(data))),1e-8))


def band(data,lo,hi):
    output=sosfiltfilt(butter(2,(lo,hi),btype="bandpass",fs=RATE,output="sos"),data)
    return output.astype(np.float32)


def time(seconds):
    return np.arange(round(seconds*RATE),dtype=np.float32)/RATE


def edge(data,on=.014,off=.039):
    a=min(round(on*RATE),len(data)//3)
    b=min(round(off*RATE),len(data)//3)
    if a:
        data[:a]*=np.linspace(0,1,a)
    if b:
        data[-b:]*=np.linspace(1,0,b)
    return data


def pan(data,position):
    angle=(np.asarray(position)+1)*math.pi/4
    return np.stack([data*np.cos(angle),data*np.sin(angle)],axis=-1)


def place(bus,data,at,position=0.):
    i=max(0,round(at*RATE))
    n=min(len(bus)-i,len(data))
    if n>0:
        stereo=pan(data[:n],position if np.isscalar(position) else position[:n]) if data.ndim==1 else data[:n]
        bus[i:i+n]+=stereo


def sound(bus,data,at,position,room="hall"):
    place(bus,data,at,position)
    taps={"hall":((.032,.066),(.107,.064)),
          "stairs":((.036,.075,.122),(.16,.093,.041)),
          "inside":((.017,.041),(.083,.041))}
    for d,g in zip(*taps[room]):
        place(bus,data*g,at+d,np.clip(position*.53+.09,-.95,.95))


def ffread(ffmpeg,path):
    args=[ffmpeg,"-v","error","-nostdin","-i",str(path),"-f","f32le","-ar",str(RATE),"-ac","1","pipe:1"]
    return np.frombuffer(subprocess.check_output(args),dtype="<f4").copy()


def trim_voice(audio):
    width=RATE//100
    rms_curve=np.sqrt(np.mean(audio[:len(audio)//width*width].reshape(-1,width)**2,axis=1))
    audible=np.flatnonzero(rms_curve>max(.0018,.033*float(np.max(rms_curve))))
    if not len(audible):
        raise ValueError("empty dialogue clip")
    return audio[max(0,(int(audible[0])-4)*width):min(len(audio),(int(audible[-1])+10)*width)]


def fit_voice(ffmpeg,clip,window,preferred):
    factor=max(preferred,len(clip)/(RATE*window))
    if factor>1.25:
        raise ValueError(f"Dialogue needs a new take at this edit length ({factor:.3f}x)")
    if abs(factor-1)>0.002:
        command=[ffmpeg,"-v","error","-nostdin","-f","f32le","-ar",str(RATE),"-ac","1","-i","pipe:0",
                 "-af",f"atempo={factor:.7f}","-f","f32le","pipe:1"]
        clip=np.frombuffer(subprocess.check_output(command,input=clip.tobytes()),dtype="<f4").copy()
    return clip,factor


def put_voice(bus,ffmpeg):
    mouth={"yu":{},"mei":{},"uncle":{}}
    ends={}
    lines=[]
    fps=PLAN["fps"]
    for cue in PLAN["voice"]:
        voice=trim_voice(ffread(ffmpeg,ROOT/"voice"/(cue["id"]+".mp3")))
        role=cue["role"]
        lo,hi,db,p,taps,decays=VOICE[role]
        preferred={"yu":.935,"mei":.94,"uncle":.89,"radio":.97}.get(role,1.)
        voice,factor=fit_voice(ffmpeg,voice,cue["until"]-cue["at"]-.06,preferred)
        voice=band(voice,lo,hi)
        if role=="radio":
            voice=np.tanh(voice*2.9)*.32
            t=time(len(voice)/RATE)
            voice*=.985+.015*np.sin(2*math.pi*56*t)
        voice=edge(level(voice,db,-9.3))
        place(bus,voice,cue["at"],p)
        for d,g in zip(taps,decays):
            delayed=sosfilt(butter(2,min(2100,hi),fs=RATE,output="sos"),voice).astype(np.float32)
            place(bus,delayed*g,cue["at"]+d,-p*.48)
        stop=cue["at"]+len(voice)/RATE
        ends[cue["id"]]=round(stop+.11,3)
        if role in mouth:
            start=math.ceil(cue["at"]*fps)
            for k in range(start,math.ceil(stop*fps)):
                i=round((k/fps-cue["at"])*RATE)
                p2=voice[i:min(len(voice),i+round(RATE/fps))]
                if len(p2):
                    amount=np.clip((rms(p2)-.008)/.073,0.,.76)
                    if amount>.02:
                        mouth[role][str(k)]=round(float(amount),3)
        lines.append({"cue":cue["id"],"start":cue["at"],"seconds":round(len(voice)/RATE,3),"tempo":round(factor,4)})
    meta={"mouth":mouth,"caption_end":ends,"voice":lines}
    (ROOT/"performance.json").write_text(json.dumps(meta,indent=2,ensure_ascii=False),encoding="utf-8")
    return lines


class Foley:
    def __init__(self):
        self.rng=np.random.default_rng(90413)

    def noise(self,n,lo,hi):
        return band(self.rng.standard_normal(n).astype(np.float32),lo,hi)

    def floor(self,style,tweak):
        t=time(.27)
        low,high=(47,1350) if style=="inside" else (52,2090)
        a=self.noise(len(t),low,high)*np.exp(-t*18)
        b=self.noise(len(t),115,4200)*np.exp(-np.maximum(t-.021,0)*32)*np.clip(t/.021,0,1)
        pitch=62+tweak*9
        heel=np.sin(2*math.pi*(pitch*t-21*t**2))*np.exp(-t*43)
        return edge(.31*a+.078*b+.22*heel,.004,.04)

    def knock(self,weight):
        t=time(.247)
        a=sum(g*np.sin(2*math.pi*f*t)*np.exp(-d*t) for g,f,d in (
            (.52,121,29),(.27,201,37),(.12,392,47),(.052,681,130),(.021,1220,146)))
        a+=self.noise(len(t),160,3200)*np.exp(-t*46)*.18
        return edge(a*weight,.0011,.044)

    def metal(self,seconds=.17,light=1.):
        t=time(seconds)
        tones=(809,1147,2131,2969,4221,5669)
        signal=sum((.39/(1+i*.63))*np.sin(2*np.pi*(f+.9*(i+1)*light)*t)*np.exp(-t*(24+i*9)) for i,f in enumerate(tones))
        signal+=self.noise(len(t),1300,10500)*np.exp(-t*71)*.123
        return edge(signal,.001,.034)

    def plastic(self):
        t=time(.38)
        env=np.zeros(len(t),dtype=np.float32)
        for start,amount in ((.016,.5),(.038,.81),(.067,.57),(.102,1),(.146,.37),(.222,.46),(.282,.19)):
            x=np.maximum(0.,t-start)
            env+=amount*np.exp(-x*153)*np.minimum(1.,x*975)
        signal=(self.noise(len(t),630,6000)*.55+self.noise(len(t),200,1560)*.43)*env
        return edge(signal,.007,.022)

    def slide(self):
        t=time(.37)
        env=np.clip(np.sin(np.pi*np.minimum(t/.36,1.)),0.,1.)**1.9
        scr=self.noise(len(t),208,4300)*env*(.59+.41*np.sin(2*np.pi*40*t)**2)
        return edge(scr,.016,.038)

    def latch(self):
        t=time(.405)
        n=self.noise(len(t),120,3550)
        k=self.knock(.63)
        m=self.metal(.23)
        n*=np.exp(-t*28)*.16
        n[:len(k)]+=k*.62
        i=round(.053*RATE)
        n[i:i+len(m)]+=m*.19
        return edge(n,.004,.051)

    def squelch(self):
        t=time(.24)
        b=self.noise(len(t),340,2910)
        tone=np.sin(2*np.pi*(940*t-451*t*t))*.11*np.exp(-t*40)
        return edge((b*np.exp(-t*20)+tone),.004,.033)

    def put(self,bus):
        for i,t in enumerate(CUES["knock"]):
            sound(bus,transient(self.knock(1.-.1*i),-19.8-1.1*i),t,.19)
        for t in CUES["latch"]:
            sound(bus,transient(self.latch(),-24.3),t,.14,"inside" if t>45 else "hall")
        for j,t in enumerate(CUES["chain"]):
            for k in range(4):
                sound(bus,transient(self.metal(.119,1+.42*k),-33.0-k*.7),t+.036*k,-.1+j*.06,"inside")
        sound(bus,transient(self.latch(),-20.6),CUES["doorClose"],-.22,"inside")
        for j,t in enumerate(CUES["plastic"]):
            sound(bus,transient(self.plastic(),-27.9-j*.7),t,.08-.08*j,"inside")
        step_sequences=[
            ("hallSteps","hall",-.35,.15,-25.3),
            ("stairSteps","stairs",-.41,.26,-23.5),
            ("landingSteps","hall",-.27,.10,-25.8)
        ]
        for name,room,left,right,db in step_sequences:
            for i,t in enumerate(CUES[name]):
                position=left+(right-left)*i/max(1,len(CUES[name])-1)
                sound(bus,transient(self.floor(room,float(self.rng.random())),db+float(self.rng.normal(0,.9))),t,position,room)
        sound(bus,transient(self.slide(),-22.6),CUES["slip"]+.025,.21,"stairs")
        sound(bus,transient(self.metal(.30,.071),-25.5),CUES["rail"],.34,"stairs")
        sound(bus,transient(self.floor("inside",.42),-25.7),CUES["table"],-.13,"inside")
        for t in CUES["radioGate"]:
            sound(bus,transient(self.squelch(),-27.8 if t<78 else -25.9),t,-.20,"inside")
        for i,t in enumerate((76.82,77.69,78.88)):
            sound(bus,transient(self.floor("hall",.15),-34-i*1.8),t,-.29,"stairs")


def ambience(speech):
    f=Foley()
    t=time(PLAN["duration"])
    x=f.noise(len(t),48,208)
    drift=f.noise(len(t),212,2100)
    lower=f.noise(len(t),48,260)
    hum=np.sin(2*np.pi*50*t)*.0021+np.sin(2*np.pi*99.98*t+.41)*.00083
    windows=np.array([0,4,13.7,14.3,27.6,34.4,43,48,49.5,54.7,63.9,71.5,78.1,85.5,90])
    levels=np.array([.70,1.,1.,.72,.76,.87,.68,.55,.77,1.08,.90,.49,.76,.72,.03])
    bed=np.interp(t,windows,levels).astype(np.float32)
    tracks=np.stack([level(x,-45.0)+level(drift,-52)+hum,level(lower,-45.3)+level(drift,-53)+hum*.8],axis=-1)
    chunk=2400
    occupancy=np.sqrt(np.mean(speech.reshape(-1,chunk,2)**2,axis=(1,2)))
    duct=np.convolve(np.clip((occupancy-.012)/.04,0,1),[.1,.2,.4,.2,.1],mode="same")
    bed*=np.interp(t,np.arange(len(duct))*chunk/RATE,1-duct*.16)
    return tracks*bed[:,None]


def render(ffmpeg,out):
    voice=np.zeros((FRAMES,2),np.float32)
    lines=put_voice(voice,ffmpeg)
    soundscape=ambience(voice)
    Foley().put(soundscape)
    mix=voice+soundscape
    if not np.isfinite(mix).all():
        raise ValueError("The audio mix has non-finite samples.")
    tail=np.linspace(1,0,round(1.25*RATE),dtype=np.float32)
    mix[-len(tail):]*=tail[:,None]
    mix[:round(.26*RATE)]*=np.linspace(0,1,round(.26*RATE),dtype=np.float32)[:,None]
    args=[ffmpeg,"-nostdin","-v","error","-y","-f","f32le","-ar",str(RATE),"-ac","2","-i","pipe:0",
          "-af","loudnorm=I=-20.5:LRA=13:TP=-2.3,volume=2.2dB,alimiter=limit=0.78:attack=4:release=58:level=false","-ar",str(RATE),"-c:a","pcm_s24le",str(out)]
    subprocess.run(args,input=mix.tobytes(),check=True)
    print(json.dumps(lines,ensure_ascii=False),flush=True)
    print(f"Original stereo mix: {out.name}",flush=True)


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffmpeg",default="ffmpeg")
    parser.add_argument("--out",type=Path,default=ROOT/"sound.wav")
    args=parser.parse_args()
    render(args.ffmpeg,args.out)
