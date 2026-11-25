"""Perspective mix of the street, glass, municipal alert and inner voice, at 48 kHz."""
from pathlib import Path
import json
import os
import sys
import numpy as np
import soundfile as sf
from scipy import signal, ndimage

HERE = Path(__file__).resolve().parent
LIB = HERE.parent / "独立音效库"
sys.dont_write_bytecode = True
sys.path.insert(0, str(LIB))
from build import measure
from synth import RATE

plan = json.loads((HERE / "story.json").read_text(encoding="utf-8"))
event = plan["events"]
length = plan["duration"] * RATE
time = np.arange(length) / RATE
rng = np.random.default_rng(941)
effects = np.zeros((length, 2), dtype=np.float32)
speech = np.zeros_like(effects)

def audio(path):
    wave, rate = sf.read(str(path), dtype="float32", always_2d=True)
    if rate != RATE:
        wave = signal.resample_poly(wave, RATE, rate, axis=0)
    return wave

def level(wave, target):
    return wave * (target / max(.0001, np.sqrt(np.mean(wave**2))))

def filt(wave, freq, kind="low", order=3):
    return signal.sosfilt(signal.butter(order, freq, kind, fs=RATE, output="sos"), wave, axis=0)

def smooth(a, b, t=time):
    n = np.clip((t-a)/(b-a), 0, 1)
    return n*n*(3-2*n)

def place(bus, at, wave, pan=0):
    wave = np.asarray(wave)
    if wave.ndim == 1:
        wave = wave[:,None]*np.sqrt([1-pan, 1+pan])
    start = round(at*RATE)
    n = min(len(wave), len(bus)-start)
    bus[start:start+n] += wave[:n]

def library(side, n):
    return audio(next((LIB / side).glob(n + "-*.wav")))

def loop(wave, offset):
    cross = int(RATE*1.3)
    period = len(wave)-cross
    segment = wave.copy()
    q = smooth(0, 1, np.arange(cross)/cross)[:,None]
    segment[:cross] = wave[-cross:]*(1-q) + wave[:cross]*q
    return segment[(np.arange(length)+round(offset*RATE)) % period]

def perspective(wave, outside, muffled, level_out):
    low = filt(wave, muffled)
    return (low*.80 + (wave-low)*(.13+.87*outside[:,None]))*level_out[:,None]

def weather():
    # Exterior -> behind the closed glass -> near the pane -> close to the phone.
    front = 1-smooth(8.90,9.16)
    pane = smooth(13.6,16.6)*(1-smooth(25.9,26.64)) + .53*smooth(48.7,50.1)
    presence = front + .32*pane
    street_dip = 1 - .20*smooth(9.91,10.22)*(1-smooth(10.81,11.62))
    gain = (.39+.63*front+.23*pane)*street_dip
    rain_a = loop(level(library("A-制作音效","01"),.032),0)
    rain_b = loop(level(library("B-实录对照","01"),.065),4.7)
    wind = loop(level(library("B-实录对照","02"),.041),7.3)
    wind_gust= .71+.28*np.sin(.66*time+.8*np.sin(.26*time))+.17*smooth(2.2,4.2)*(1-smooth(6.5,8.1))
    effects[:] += perspective(rain_a+rain_b,presence,1620,gain)
    effects[:] += perspective(wind,presence,830,gain*wind_gust)
    police=level(library("A-制作音效","03"),.102)
    place(effects,1.28,police)
    # Glass knocks and distant metal drain in quiet gaps.
    for at in [11.88,15.74,19.35,25.56,43.94,50.78,51.50]:
        wet(at,.009,-.60,1.4)
    t=np.arange(round(.88*RATE))/RATE
    noise=filt(rng.normal(size=len(t)),[160,4100],"band")
    splash=level(noise * np.sin(np.pi*np.clip(t/.88,0,1))**2,.025)
    place(effects,5.84,splash,.23)

def wet(at,amp,pan,pitch=1.):
    t=np.arange(round(.19*RATE))/RATE
    n=filt(rng.normal(size=len(t)),[280,3200],"band")
    wave=(.5*n*np.exp(-t/.023) + .34*np.sin(2*np.pi*(430-120*t)*pitch*t)*np.exp(-t/.032))*smooth(0,.003,t)
    place(effects,at,level(wave,amp),pan)

def knock(at,amp,pan,hardness):
    t=np.arange(round(.145*RATE))/RATE
    n=filt(rng.normal(size=len(t)),[190,hardness],"band")
    attack=smooth(0,.0025,t)
    wave=attack*(n*np.exp(-t/.011)+.38*np.sin(2*np.pi*125*t)*np.exp(-t/.038))
    place(effects,at,level(wave,amp),pan)

def foley():
    for at in [9.15,9.33,9.68,9.87,10.08]:
        knock(at,.008,.28,2550)
    cry=audio(HERE/"voice/street.wav")[:,0]
    cry=level(filt(cry,[330,3350],"band"),.105)
    at=event["scream"];place(effects,at,cry,-.50)
    for delay,amp,pan in [(.071,.21,.25),(.142,.16,-.31),(.225,.075,.45)]:
        place(effects,at+delay,filt(cry,1620)*amp,pan)
    for i,at in enumerate([13.18,13.68,14.15,14.58,15.08,15.65]):
        knock(at,.008+(i%2)*.001,-.08-.055*i,1080)
    for base,period,amount in [(16.95,.26,.006),(17.17,.288,.0065),(20.75,.30,.010)]:
        for i,at in enumerate(np.arange(base,min(base+4.38,24.81),period)):
            wet(float(at),amount*(.68+.3*np.sin(i*1.3)**2),np.clip((at-base)*.17-.50,-1,1),.70+.1*(i%2))
    # Door drive, then the two separate sounds of the door meeting its latch.
    t=np.arange(round(.78*RATE))/RATE
    drive=smooth(0,.16,t)*(1-smooth(.47,.77,t))
    motor=(np.sin(2*np.pi*(147+12*t)*t)+.13*np.sin(2*np.pi*433*t))*drive
    place(effects,event["doorOpen"],level(motor,.008),.40)
    knock(event["doorLatch"],.027,.41,1850);knock(event["doorLatch"]+.073,.011,.42,2450)
    # The source model starts its three vibration bursts at .27, 1.16 and 2.09 s.
    buzz=level(library("A-制作音效","07"),.078)
    place(effects,event["buzz"][0]-.27,buzz)
    for at,amp in [(event["boss1"],.052),(event["boss2"],.038)]:
        for off,hz,strength in [(0,860,.64),(.105,1150,1)]:
            t=np.arange(round(.25*RATE))/RATE
            chime=(np.sin(2*np.pi*hz*t)+.11*np.sin(2*np.pi*hz*2*t))*smooth(0,.007,t)*np.exp(-t/.059)
            place(effects,at+off,level(chime,amp*strength),.10)
    knock(event["tap"],.004,.12,1700)

def voices():
    ends={}
    for row in plan["lines"]:
        wave=audio(HERE/"voice"/(row["id"]+".wav"))[:,0]
        if row["id"]=="outside":
            # Keep a hesitant beat after 不过, shorten only the silent middle of that beat.
            i,j=round(.74*RATE),round(1.14*RATE)
            wave=np.concatenate((wave[:i],wave[j:]))
        env=ndimage.maximum_filter1d(abs(wave),size=960)
        use=np.flatnonzero(env>.008)
        wave=wave[max(0,use[0]-int(.025*RATE)):min(len(wave),use[-1]+int(.055*RATE))]
        t=np.arange(len(wave))/RATE
        wave*=smooth(0,.009,t)*(1-smooth(t[-1]-.023,t[-1],t))
        radio=row["role"]=="announcer"
        wave=filt(wave,[320,4500] if radio else [82,8800],"band")
        # A gentle soft knee tames sharp syllables without flattening the pauses.
        wave=level(wave,.155 if radio else .132)
        wave=.47*np.tanh(wave/.47)
        at=row["at"]; place(speech,at,wave,.11 if radio else 0)
        if radio:
            place(speech,at+.032,wave*.075,-.34)
            place(speech,at+.061,filt(wave,2100)*.035,.42)
        ends[row["id"]]=round(at+len(wave)/RATE,3)
    return ends

weather();foley();ends=voices()
power=ndimage.uniform_filter1d(np.mean(speech**2,axis=1),size=int(.20*RATE))
duck=1-.26*np.clip((np.sqrt(np.maximum(power,0))-.009)/.06,0,1)
master=(effects*duck[:,None]+speech)*(smooth(0,.13)*(1-smooth(52.47,53)))[:,None]
ffmpeg=os.environ.get("FFMPEG","ffmpeg")
lufs,peak=measure(master,ffmpeg)
gain=10**(min(-18.5-lufs,-1.9-peak)/20)
master*=gain
sf.write(str(HERE/"同步混音.wav"),master,RATE,subtype="PCM_16")
lufs,peak=measure(master,ffmpeg)
marks={"ends":ends,"integratedLUFS":lufs,"truePeakDBTP":peak}
(HERE/"performance.json").write_text(json.dumps(marks,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(marks,ensure_ascii=False))
