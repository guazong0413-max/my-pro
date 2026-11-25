"""Mix fresh Mandarin dialogue and procedural Foley for the 90-second scene."""
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
PLAN = json.loads((ROOT / "story.json").read_text(encoding="utf-8"))
RATE = 48000
FPS = PLAN["fps"]
TOTAL = round(PLAN["duration"] * RATE)
FOL = PLAN["events"]
RANDOM = np.random.default_rng(31917)
PRESET = {
    "narrator": (89, 6150, .107, -.02),
    "mei": (101, 4150, .080, .14),
    "child": (117, 4600, .072, -.10),
}


def time(sec):
    return np.arange(round(sec * RATE), dtype=np.float32) / RATE


def band(data, low, high):
    sos = signal.butter(2, (low, high), btype="bandpass", fs=RATE, output="sos")
    return signal.sosfilt(sos, data).astype(np.float32)


def normalize(data, peak):
    return data * (peak / max(.000001, np.max(np.abs(data))))


def add(bus, at, mono, pan):
    start = round(at * RATE)
    n = min(len(mono), len(bus) - start)
    if n <= 0:
        return
    stereo = np.array([math.sqrt((1 - pan) / 2), math.sqrt((1 + pan) / 2)])
    bus[start:start+n] += mono[:n, None] * stereo


def reflect(bus, at, mono, pan, gain=.11):
    add(bus, at, mono, pan)
    softened = band(mono, 118, 1700)
    add(bus, at+.031, softened*gain, -pan*.68)
    add(bus, at+.072, softened*(gain*.48), pan*.31)


def rustle(length, peak, low, high):
    t = time(length)
    env = np.sin(np.pi*np.clip(t/length, 0, 1))**1.31
    noise = band(RANDOM.standard_normal(len(t)).astype(np.float32), low, high)
    return normalize(noise*env, peak)


def resonant(length, tones, peak, noise_gain=0):
    t = time(length)
    output = sum(weight*np.sin(2*np.pi*freq*t)*np.exp(-decay*t)
                 for freq, decay, weight in tones)
    if noise_gain:
        noise = band(RANDOM.standard_normal(len(t)).astype(np.float32), 180, 3900)
        output += noise*noise_gain*np.exp(-t*48)
    output *= (1-np.exp(-t*380))*np.clip((length-t)/.024, 0, 1)
    return normalize(output.astype(np.float32), peak)


def make_foley():
    bus = np.zeros((TOTAL, 2), np.float32)
    t = time(PLAN["duration"])
    bed = np.interp(t, (0, 12, 22, 31, 39.5, 55, 69, 82, 90),
                    (.42, .34, .46, .48, .65, .57, .42, .47, .38))
    for side in (0, 1):
        n = RANDOM.standard_normal(TOTAL).astype(np.float32)
        r = band(n, 58, 470)*.021 + band(n, 231, 2450)*.0024
        r += .00125*np.sin(2*np.pi*(49.9+side*.098)*t)
        bus[:, side] += r*bed

    for idx, at in enumerate(FOL["distant"]):
        strike = resonant(.29, [(106+idx*5, 23, 1), (216, 33, .32), (392, 67, .12)], .024-.0018*idx, .18)
        reflect(bus, at, band(strike, 75, 830), .33, .17)
    for i, at in enumerate(FOL["paper"]):
        add(bus, at, rustle(.24+.045*i, .025, 670, 5120), -.28)
    for at in FOL["latch"]:
        latch = resonant(.16, [(278, 48, 1), (658, 43, .29), (1202, 83, .11)], .066, .28)
        reflect(bus, at, latch, .03)
    for key, strength in (("steps", .032), ("returnSteps", .025), ("stairs", .020), ("leaving", .037)):
        for i, at in enumerate(FOL[key]):
            strike = resonant(.205, [(103+i%3*8, 36, .85), (181, 57, .33), (429, 81, .15)],
                              strength*(1 if i%2 else .83), .095)
            reflect(bus, at, strike, .34 if key=="stairs" else -.13+i*.062, .070)
            add(bus, at+.051, rustle(.126, strength*.25, 260, 1910), .20)

    add(bus, FOL["flour"], rustle(.45, .023, 590, 4000), -.18)
    add(bus, FOL["wipe"], rustle(.64, .029, 330, 2180), .03)
    for i in range(8):
        at = FOL["alarm"]+i*.239
        ring = resonant(.235, [(1062, 18, .38), (1682, 22, .67), (2317, 34, .49), (3178, 49, .20)],
                         .176*(1-i*.061), .093)
        reflect(bus, at, ring, -.07, .12)
    for i in range(3):
        chink = resonant(.115, [(1037, 43, .37),(1882+i*102, 54, .63),(2910, 83, .28)],
                          .047-i*.010, .063)
        add(bus, FOL["key"]+.032*i, chink, .11)
    return bus


def rms(x):
    return float(np.sqrt(np.mean(x*x)+1.e-12))


def take(row, ffmpeg):
    rate, raw = wavfile.read(ROOT/"voice"/(row["id"]+".wav"))
    assert raw.ndim == 1 and raw.dtype == np.int16, row["id"]
    data = raw.astype(np.float32)/32768
    width = rate//100
    power = np.pad(data*data, (0, (-len(data))%width)).reshape(-1,width)
    blocks = np.sqrt(np.mean(power, axis=1))
    active = np.flatnonzero(blocks>max(.0018, blocks.max()*.025))
    if not len(active):
        raise RuntimeError(row["id"]+" contains no clear speech")
    lo = max(0, active[0]*width-round(rate*.055))
    hi = min(len(data), (active[-1]+1)*width+round(rate*.08))
    data = data[lo:hi]
    allowed = row["until"]-row["at"]-.025
    tempo = max(1.0, (len(data)/rate)/allowed)
    if tempo>1.24:
        raise RuntimeError(f'{row["id"]} needs a shorter take ({tempo:.3f}x).')
    proc = subprocess.run([ffmpeg, "-v","error", "-f","f32le", "-ar",str(rate), "-ac","1","-i","pipe:0",
                           "-af",f"atempo={tempo:.8f}","-ar",str(RATE),"-f","f32le","pipe:1"],
                          input=data.astype("<f4").tobytes(),stdout=subprocess.PIPE,check=True)
    data = np.frombuffer(proc.stdout,dtype="<f4").copy()
    low,high,target,pan = PRESET[row["role"]]
    data = band(data,low,high)
    if len(data)>round(allowed*RATE):
        data=data[:round(allowed*RATE)]
    frame = RATE//100
    levels = np.sqrt(np.mean(np.pad(data*data,(0,(-len(data))%frame)).reshape(-1,frame),axis=1)+1.e-12)
    level = np.sqrt(np.mean(levels[levels>levels.max()*.12]**2))
    data *= min(target/max(.003,level), .55/max(.001,np.max(np.abs(data))))
    data[:460] *= np.linspace(0,1,460)
    data[-880:] *= np.linspace(1,0,880)
    return data,pan,tempo


def arrange_captions(row, data):
    duration=len(data)/RATE
    parts=row["subs"]
    weights=[len([c for c in phrase if c.isalnum()]) for phrase in parts]
    windows = [0.0]
    advance=0
    for weight in weights[:-1]:
        advance+=weight
        expect=duration*advance/sum(weights)
        lower=max(windows[-1]+.29,expect-.38)
        upper=min(duration-.29,expect+.39)
        candidates=np.arange(lower,upper,.01)
        if len(candidates):
            scores=[rms(data[int((x-.024)*RATE):int((x+.024)*RATE)])+.022*abs(x-expect) for x in candidates]
            expect=float(candidates[np.argmin(scores)])
        windows.append(expect)
    windows.append(duration)
    return [[round(row["at"]+windows[i],3),
             round(min(row["until"],row["at"]+windows[i+1]+(.10 if i==len(parts)-1 else 0)),3),
             phrase] for i,phrase in enumerate(parts)]


def render(out, perf, ffmpeg):
    fx=make_foley()
    spoken=np.zeros_like(fx)
    marks={"subs":[], "lips":{"mei":{}, "child":{}}, "voices":[]}
    for row in PLAN["lines"]:
        snd,pan,tempo=take(row,ffmpeg)
        if row["role"]=="narrator":
            add(spoken,row["at"],snd,pan)
        else:
            reflect(spoken,row["at"],snd,pan,.12)
            begin=math.ceil(row["at"]*FPS)
            for frame in range(begin,math.ceil((row["at"]+len(snd)/RATE)*FPS),2):
                i=round((frame/FPS-row["at"])*RATE)
                sample=snd[i:i+2*RATE//FPS]
                amplitude=round(float(np.clip((rms(sample)-.010)/.081,0,.86)),3)
                for k in (frame,frame+1):
                    marks["lips"][row["role"]][k]=amplitude
        marks["subs"].extend(arrange_captions(row,snd))
        marks["voices"].append({"id":row["id"],"time":row["at"],"duration":round(len(snd)/RATE,3),"tempo":round(tempo,3)})
        print(row["id"], round(len(snd)/RATE,2), round(tempo,2))
    result=fx+spoken
    limit=.738
    peak=float(np.max(np.abs(result)))
    result*=min(1.08,limit/max(.00001,peak))
    result[:round(RATE*.24)]*=np.linspace(0,1,round(RATE*.24))[:,None]
    result[-round(RATE*.45):]*=np.linspace(1,0,round(RATE*.45))[:,None]
    assert result.shape==(TOTAL,2) and np.isfinite(result).all()
    wavfile.write(out,RATE,(np.clip(result,-.99,.99)*32767).astype(np.int16))
    perf.write_text(json.dumps(marks,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(out)


if __name__ == "__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out",type=Path,default=ROOT/"同步混音.wav")
    parser.add_argument("--performance",type=Path,default=ROOT/"performance.json")
    parser.add_argument("--ffmpeg",default=os.environ.get("FFMPEG","ffmpeg"))
    args=parser.parse_args()
    render(args.out,args.performance,args.ffmpeg)