"""Assemble Qwen dry takes, room perspectives and newly synthesised Foley at picture time."""
import argparse
import json
import math
import os
from pathlib import Path
import subprocess

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parent
SR = 48000
DURATION = 90
parser = argparse.ArgumentParser()
parser.add_argument("--output", required=True, type=Path)
parser.add_argument("--performance", required=True, type=Path)
args = parser.parse_args()
args.output.parent.mkdir(parents=True, exist_ok=True)
plan = json.loads((ROOT / "story.json").read_text("utf-8"))
ffmpeg = os.environ.get("FFMPEG", "ffmpeg")
rng = np.random.default_rng(7318)
fx = np.zeros((SR*DURATION, 2), np.float32)
speech = np.zeros_like(fx)

def bp(y, lo, hi, order=3):
    return signal.sosfilt(signal.butter(order, [lo, hi], fs=SR, btype="bandpass", output="sos"), y).astype(np.float32)
def unit(y):
    return y / max(.000001, np.max(np.abs(y)))
def mono_noise(d,lo,hi):
    return bp(rng.standard_normal(round(SR*d)),lo,hi)
def time(d):
    return np.arange(round(d*SR))/SR
def feed(dst, at, y, pan=0, gain=1):
    i=round(at*SR); n=min(len(y),len(dst)-i)
    gains=[math.sqrt((1-pan)/2),math.sqrt((1+pan)/2)]
    for ch in (0,1):
        dst[i:i+n,ch] += y[:n] * (gain*gains[ch])
def rms(y): return np.sqrt(np.mean(y*y)+1.e-10)
def rub(at,d,pan,amp,lo=700,hi=4500):
    t=time(d);env=np.sin(np.pi*t/d)**1.8
    grain=1+.21*np.sin(t*2*np.pi*26+.45*np.sin(t*70))
    feed(fx,at,unit(mono_noise(d,lo,hi)*env*grain),pan,amp)
def modal(at, freqs, taus, weights, gain, pan, verb=False):
    duration=max(taus)*5.5; t=time(duration)
    y=sum(a*np.sin(2*np.pi*f*t+.04*i)*np.exp(-t/tau) for i,(f,tau,a) in enumerate(zip(freqs,taus,weights)))
    y+=.14*unit(mono_noise(duration,840,5500))*np.exp(-t/.008)
    y=unit(y*(1-np.exp(-t/.0015)))
    feed(fx,at,y,pan,gain)
    if verb:
        for delay,k,side in [(.062,.19,-.3),(.113,.11,.48),(.174,.06,-.55),(.23,.037,.42)]:
            feed(fx,at+delay,bp(y,125,2900),side,gain*k)
def air(at,d,lo,hi,amp,pan,fade=.55):
    t=time(d); e=np.minimum(1,np.minimum(t/fade,(d-t)/fade))
    feed(fx,at,mono_noise(d,lo,hi)*e*(1+.13*np.sin(t*.39)),pan,amp)
def shoe(at,pan,amp,seed):
    f=112+(seed%4)*6; modal(at,[f,201+seed%13,447],[.067,.042,.023],[.88,.44,.16],amp,pan,True)
    rub(at+.052,.13,pan,.18*amp,320,1800)
def stream(at,d,pan,amp):
    t=time(d); e=np.clip(t/.17,0,1)*np.clip((d-t)/.33,0,1)
    y=mono_noise(d,450,5000)*e*(.74+.12*np.sin(33*t)+.12*np.sin(57*t))
    feed(fx,at,unit(y),pan,amp)
def drip(at,p,amp):
    t=time(.24);y=np.sin(2*np.pi*(1050*t-620*t*t)) * np.exp(-t/.041)*(1-np.exp(-t/.0015))
    feed(fx,at,unit(y),p,amp)

# Outdoor city air, daytime plumbing, then quieter indoor and nighttime air.
air(0,16.08,88,870,.047,-.24);air(.05,15.8,190,1500,.024,.5)
air(8.35,63.7,112,695,.018,-.26,1.3);air(37,13.2,72,430,.023,.41)
air(55.75,34.24,125,680,.011,-.39)
t=time(14.81)
feed(fx,0,(np.sin(2*np.pi*51*t)+.21*np.sin(2*np.pi*103*t))*.010*np.clip(t,0,1)*np.clip((14.81-t)/.4,0,1),.5)
# Actual on-screen fixtures and objects.
stream(16.11,1.95,-.23,.094)
for at,vol in [(18.44,.056),(18.96,.038),(19.61,.024)]:drip(at,-.23,vol)
rub(22.51,.29,.32,.023,630,2700)
rub(27.98,.29,.20,.032,240,1150)
stream(30.63,1.24,-.03,.082);drip(32.02,-.04,.035)
rub(33.45,.42,.15,.035,320,1270)
modal(35.96,[735,1356,2125,3010],[.115,.20,.12,.071],[.55,.89,.48,.19],.31,.12,True)
modal(36.048,[709,1332,2047],[.060,.076,.055],[.65,.65,.25],.086,.10)
for i,(at,amp,pan) in enumerate([(37.01,.096,.56),(37.67,.114,.41),(38.37,.143,.20),(39.08,.11,.06),(40.01,.070,-.04),(46.42,.083,-.15),(48.28,.090,-.18),(48.87,.064,-.37),(49.48,.042,-.52)]):
    shoe(at,pan,amp,i)
rub(39.61,.79,.38,.065,260,1820);rub(40.67,.76,.28,.056,210,1740)
rub(42.45,.17,-.16,.037,520,3400);modal(42.76,[560,1190],[.008,.007],[.65,.22],.035,-.16)
for at,d,p in [(56.4,.72,-.13),(57.55,.89,.29)]:
    rub(at,d,p,.084,330,3450)
    for i in range(4):modal(at+.08+.13*i,[833,1374],[.016,.01],[.7,.3],.025,p)
rub(66.12,.20,-.25,.019,650,2300);shoe(67.54,.37,.055,3)
# Three separate knuckle strikes from the other side of the door. No fourth tap.
for at,k,seed in [(69.86,1,0),(70.59,.78,1),(71.50,.92,2)]:
    modal(at,[124+seed*2,229-seed*4,410+seed*7,641],[.095,.067,.047,.026],[1,.75,.34,.17],.35*k,.29,True)
rub(80.47,.38,-.37,.032,350,2100)
# Narration is dry and stable. The woman outside has mild door filtering and a short corridor tail.
cues=[]; lip=np.zeros(DURATION*30,np.float32)
for row in plan["lines"]:
    rate, raw=wavfile.read(ROOT/"voice"/(row["id"]+".wav"))
    y=raw.astype(np.float32)/32768
    win=max(1,rate//100)
    power=np.sqrt(np.mean(np.pad(y*y,(0,(-len(y))%win)).reshape(-1,win),axis=1)+1e-13)
    active=np.flatnonzero(power>max(.0018,power.max()*.024))
    first=max(0,active[0]*win-round(rate*.055)); end=min(len(y),(active[-1]+1)*win+round(rate*.095))
    y=y[first:end]
    max_d=row["until"]-row["at"]
    ratio=max(1.,(len(y)/rate)/max_d)
    cmd=[ffmpeg,"-v","error","-f","f32le","-ar",str(rate),"-ac","1","-i","pipe:0",
         "-af","atempo=%.6f"%ratio,"-ar",str(SR),"-f","f32le","pipe:1"]
    y=np.frombuffer(subprocess.run(cmd,input=y.astype("<f4").tobytes(),stdout=subprocess.PIPE,check=True).stdout,dtype="<f4").copy()
    y=y[:round(max_d*SR)]
    y[:350]*=np.linspace(0,1,350);y[-550:]*=np.linspace(1,0,550)
    neighbor=row["role"]=="neighbor"
    y=bp(y,140 if neighbor else 76,3400 if neighbor else 11200,2)
    frame=480; blocks=np.sqrt(np.mean(np.pad(y*y,(0,(-len(y))%frame)).reshape(-1,frame),axis=1)+1e-11)
    level=np.sqrt(np.mean(blocks[blocks>blocks.max()*.115]**2))
    target={"calm":.118,"quiet":.104,"neighbor":.087}[row["role"]]
    y*=target/max(level,.004)
    if neighbor:
        for delay,k,pan in [(.029,.14,.33),(.073,.067,-.26)]:feed(speech,row["at"]+delay,bp(y,230,2120),pan,k)
    feed(speech,row["at"],y,.19 if neighbor else -.012)
    length=len(y)/SR
    # Put each subtitle break in a nearby genuine gap in the spoken audio.
    pieces=row["subs"]; sizes=[sum(u.isalnum() for u in p) for p in pieces]
    splits=[0.]; acc=0
    for sz in sizes[:-1]:
        acc+=sz; expect=length*acc/sum(sizes); sl=max(splits[-1]+.24,expect-.34);sr=min(length-.21,expect+.34)
        if sr>sl:
            start,end0=int(sl*100),max(int(sl*100)+1,int(sr*100))
            part=blocks[start:end0]
            if len(part):expect=(start+np.argmin(part+.045*np.abs(np.arange(start,start+len(part))/100-expect)))/100
        splits.append(expect)
    splits.append(length)
    for i,sub in enumerate(pieces):
        cues.append([round(row["at"]+splits[i],3),round(min(row["until"],row["at"]+splits[i+1]+(.12 if i==len(pieces)-1 else 0)),3),sub])
    if neighbor:
        for f in range(math.floor(row["at"]*30),math.ceil((row["at"]+length)*30)):
            i=max(0,int((f/30-row["at"])*SR));seg=y[i:i+1600]
            if len(seg):lip[f]=min(1,max(0,(rms(seg)-.012)*8.2))
    print(row["id"],round(length,2),"speed",round(ratio,2))
mix=fx+speech
peak=float(np.max(np.abs(mix)));mix*=min(1.8,.81/max(.01,peak))
# Bring the programme close to the reference playback level, retaining the quieter door voice.
master_filter = "volume=4.0dB,alimiter=limit=0.81:attack=4:release=64:level=0:latency=1"
master = subprocess.run([ffmpeg,"-v","error","-f","f32le","-ar",str(SR),"-ac","2","-i","pipe:0",
    "-af",master_filter,"-f","f32le","pipe:1"],input=mix.astype("<f4").tobytes(),stdout=subprocess.PIPE,check=True)
stereo=np.frombuffer(master.stdout,dtype="<f4").reshape(-1,2)
if len(stereo)!=len(mix):
    raise RuntimeError("The mastering step changed the 90-second timeline.")
wavfile.write(args.output,SR,(np.clip(stereo,-.99,.99)*32767).astype(np.int16))
args.performance.write_text(json.dumps({"subs":cues,"neighborLip":np.round(lip[85*30:],3).tolist(),
    "knocks":[69.86,70.59,71.50],"ceramic":35.96},ensure_ascii=False,indent=2),encoding="utf-8")
