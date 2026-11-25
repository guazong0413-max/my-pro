"""Deterministic original stereo sound design. Times in seconds, rates in Hz."""
from pathlib import Path
import json
import numpy as np
from scipy.signal import butter,sosfilt
import soundfile as sf

SR=48000
N=90*SR
ROOT=Path(__file__).resolve().parents[1]
CUES=json.loads((ROOT/"src"/"cues.json").read_text("utf-8"))
BEAT=CUES["beat"]
OUT=ROOT/"public"/"sound"
OUT.mkdir(parents=True,exist_ok=True)
r=np.random.default_rng(270317)
tau=2*np.pi
def time(d): return np.arange(round(d*SR),dtype=np.float32)/SR
def curve(t,a,b):
    k=np.clip((t-a)/(b-a),0,1)
    return k*k*(3-2*k)
def noise(n,lo,hi):
    white=r.standard_normal(n,dtype=np.float32)
    if lo<=0: filt=butter(3,hi,fs=SR,btype="lowpass",output="sos")
    else: filt=butter(3,[lo,hi],fs=SR,btype="bandpass",output="sos")
    result=sosfilt(filt,white).astype(np.float32)
    return result/(np.sqrt(np.mean(result**2))+.00001)
def amp_env(t,d,attack=.03,decay=.08):
    return curve(t,0,min(attack,d*.47))*(1-curve(t,max(0,d-decay),d))
def pos(stem,start,wave,pan=0,gain=1):
    i=int(round(start*SR))
    if i>=len(stem): return
    if i<0: wave=wave[-i:];i=0
    n=min(len(wave),len(stem)-i)
    if n==0:return
    theta=np.pi*(pan+1)/4
    stem[i:i+n,0]+=wave[:n]*(gain*np.cos(theta))
    stem[i:i+n,1]+=wave[:n]*(gain*np.sin(theta))
def space(stem,start,wave,pan=0,gain=1):
    pos(stem,start,wave,pan,gain)
    pos(stem,start+.044,wave,-pan*.48,gain*.12)
    pos(stem,start+.103,wave,pan*.25,gain*.052)
def finish(name,stem):
    t=time(90)
    stem*= (curve(t,0,.18)*(1-curve(t,89.0,89.97)))[:,None]
    if name=="foley":
        stem[:]=.65*np.tanh(stem*1.68/.65)
    else:
        stem*={"river":1.96,"ferry":1.57,"score":1.65}[name]
    print(name,round(float(np.max(abs(stem))),4),flush=True)
    sf.write(OUT/(name+".flac"),np.clip(stem,-.98,.98),SR,subtype="PCM_16")
def empty():return np.zeros((N,2),np.float32)
def burble(d,pitch):
    t=time(d)
    freq=pitch*(1+1.55*np.exp(-t/.031))*(1+.06*np.sin(t*34))
    phase=np.cumsum(tau*freq/SR)
    return (np.sin(phase)+.18*np.sin(phase*1.94))*np.exp(-t/max(.025,d*.19))*curve(t,0,.004)
def ripple(d):
    t=time(d)
    body=noise(len(t),210,1700)*(.25+.75*np.maximum(0,np.sin(t*(15+r.random()*5)))**2)
    top=noise(len(t),1650,4800)*.26
    return (body+top)*amp_env(t,d,d*.28,d*.65)
def river():
    t=time(90);stem=empty()
    close=1+.44*curve(t,16,21)*(1-curve(t,24.1,26))-.49*curve(t,37,38)*(1-curve(t,64.6,66))
    slow=.84+.12*np.sin(t*.42)+.07*np.sin(t*.96)
    common=noise(N,90,1080)
    for ch in range(2):
        air=noise(N,95,1150)*.011+noise(N,1250,5100)*.0026
        breezy=.65+.21*np.sin(t*.54+ch*.55)+.15*np.sin(t*.23)
        gust=(curve(t,10,16)*(1-curve(t,18.5,22))+.58*curve(t,67,70)*(1-curve(t,73,76)))
        stem[:,ch]+=(.009*common+.011*noise(N,140,1900))*(slow*close)+air*(breezy+gust)
    for start in np.arange(.1,90,.38):
        st=start+r.uniform(-.22,.24);d=r.uniform(.21,.85);pan=r.uniform(-.93,.98)
        close_k=close[max(0,min(len(t)-1,round(st*SR)))]
        pos(stem,st,ripple(d),pan,r.uniform(.010,.038)*close_k)
        if r.random()<.49:pos(stem,st+.12,burble(.16,r.uniform(215,570)),pan,r.uniform(.006,.019)*close_k)
    for start,pan,pitch in [(2.3,.62,1290),(3.3,.4,1170),(8.7,-.42,1470),(26.7,.31,1130),(45.6,-.63,1260),(47.2,-.51,1200),(81.3,.64,1580),(84.5,.29,1610),(85.08,.36,1490),(87.6,.53,1580)]:
        d=r.uniform(.26,.67);q=time(d);v=q/d
        phase=np.cumsum(tau*pitch*(.83+.26*np.sin(np.pi*v)+.029*np.sin(q*46))/SR)
        call=(np.sin(phase)+.39*np.sin(2*phase)+.12*np.sin(3*phase))*amp_env(q,d,d*.24,d*.68)*(.83+.17*np.sin(q*26))
        space(stem,start,call,pan,.024)
    finish("river",stem)
def hull_tap(d=.46):
    t=time(d);return curve(t,0,.002)*sum(a*np.sin(tau*f*t)*np.exp(-t/k) for f,a,k in [(113,.58,.12),(232,.36,.06),(391,.2,.05),(867,.07,.02)])
def whistle(d,freq):
    t=time(d); env=amp_env(t,d,.21,.37)
    phase=np.cumsum(tau*freq*(.95+.05*curve(t,0,.19)+.004*np.sin(t*16))/SR)
    return (np.sin(phase)+.40*np.sin(phase*1.5)+.20*np.sin(phase*2)+.056*noise(len(t),650,2700))*env
def ferry():
    t=time(90);stem=empty()
    arrival=curve(t,78.6,83)
    freq=22.8+7.7*arrival+.16*np.sin(t*2.3)+.12*np.sin(t*6.4)
    ph=np.cumsum(tau*freq.astype(np.float64)/SR)
    rev=.50*np.sin(ph)+.24*np.sin(ph*2.01)+.14*np.sin(ph*3)+.10*np.sin(ph*6)
    pulse=(.35+.65*np.maximum(0,np.cos(ph))**5)
    exhaust=(noise(N,40,330)*pulse*.34+rev).astype(np.float32)
    envelope=(.034+arrival*.064)*(1-.60*curve(t,37.2,38.2)*(1-curve(t,64.5,65.5)))
    away=curve(t,81,89.2)
    pos(stem,0,exhaust*envelope*(1-.76*away),.32)
    pos(stem,0,exhaust*envelope*.67*away,.83)
    pos(stem,.013,exhaust*envelope,.64,.30)
    for st in [1.3,6.8,10.4,18.3,24.4,27.1,30.25,35.5,43.4,48.3,65.2,72.1,79.1,80.05,80.4,82.4,86.2]:
        space(stem,st,hull_tap(),r.uniform(.0,.58),r.uniform(.028,.082))
    for st,d in [(5.1,1.1),(27.5,.8),(35.8,.9),(79.65,1.3),(80.9,.8)]:
        v=time(d);phase=np.cumsum(tau*(275+57*np.sin(np.pi*v/d)+9*np.sin(v*29))/SR)
        rub=(np.sin(phase)+.25*np.sin(phase*2.73)+.18*noise(len(v),380,1700))*amp_env(v,d,.31,.4)*(.55+.45*np.cos(v*21)**2)
        space(stem,st,rub,.31,.019)
    for st,d,f,g in [(6.5,.75,245,.044),(81.26,1.35,220,.14),(83.0,.86,277.18,.086)]:
        space(stem,st,whistle(d,f),.42,g)
    finish("ferry",stem)
def paper(d,snap=.5,wet=False):
    t=time(d);limit=4100 if wet else 10700
    w=noise(len(t),700 if wet else 980,limit)
    env=np.zeros(len(t));n=max(3,int(d*(28 if wet else 43)))
    for center in r.uniform(.008,max(.01,d-.008),n):
        env+=r.uniform(.18,.9)*np.exp(-np.abs(t-center)/r.uniform(.0014,.007))
    grit=noise(len(t),180,1700)*(.2 if wet else .10)
    return (w*env*.65+grit)*amp_env(t,d,.012,.035)*(1+snap*.35)
def splash(d=.58):
    t=time(d);v=(noise(len(t),290,3600)*.68+noise(len(t),100,950)*.36)*np.exp(-t/.12)*curve(t,0,.009)
    for off in [.028,.071,.112,.164,.24]:
        b=burble(.13,r.uniform(320,600));j=round(off*SR);n=min(len(b),len(v)-j);v[j:j+n]+=b[:n]*.32
    return v*amp_env(t,d,.004,.05)
def woodstep():
    t=time(.26)
    return hull_tap(.26)*.62+noise(len(t),200,1940)*.26*np.exp(-t/.030)*curve(t,0,.004)
def foley():
    stem=empty()
    for st in [.55,1.6,2.47,3.37,10.9,11.51,12.63,BEAT['launch'],14.31,16.7,17.4,18.15,19.12,20.7]:
        gain=.075 if st<12 else (.23 if st==BEAT['launch'] else .102)
        pan=-.21 if st<14 else -.18+(st-14)*.07
        space(stem,st,paper(r.uniform(.12,.33)),pan,gain)
    def walk(t):
        w=CUES['walk'];x=np.clip((t-w['start'])/round(w['end']-w['start'],5),0,1);return w['steps']*x*x*(3-2*x)
    feet=np.arange(0,10,.001)
    for s in range(1,7):
        st=feet[np.argmax(walk(feet)>=s)]
        space(stem,st,woodstep(),-.43+s*.025,.11)
    for st,pan,g,d in [(BEAT['splash'],.33,.31,.62),(BEAT['netDip'],.18,.24,.50),(BEAT['lift'],.15,.19,.5)]:
        space(stem,st,splash(d),pan,g)
    for st in [34.56,34.91,35.24,35.72,36.13,36.73,37.24,38.15]:
        space(stem,st,burble(.16,r.uniform(370,710)),.1,.076)
    for st,d,g in [(28.9,.35,.11),(30.07,.19,.09),(32.52,.24,.08),(35.62,.38,.12)]:
        space(stem,st,woodstep(),.15,g)
    for st,d in [(37.67,.54),(38.37,.86),(39.62,.57),(40.49,.63),(41.61,.61),(42.2,.37)]:
        space(stem,st,paper(d,.35,True),-.07,.19)
    for st,en in CUES['penTimes']:
        d=en-st;t=time(d);fric=noise(len(t),920,7200)*(.43+.57*np.sin(t*(79+r.uniform(3,32)))**2)*amp_env(t,d,.055,.065)
        space(stem,st,fric,.04+(st-50)*.023,.101)
    for st,d,g in [(49.27,.3,.12),(58.87,.38,.11),(59.12,1.16,.19),(60.65,1.13,.18),(62.02,.62,.15),(62.94,.55,.12),(63.7,.65,.15),(64.38,.25,.18),(66.7,.33,.12),(68.74,.26,.10),(BEAT['reply'],.26,.24),(71.45,.29,.09),(73.74,.2,.08),(BEAT['catch'],.23,.25),(75.85,.28,.14),(77.3,.41,.1),(78.56,.28,.11),(82.55,.21,.08)]:
        space(stem,st,paper(d),.24 if st<=73 else -.36,g)
    finish("foley",stem)
def pluck(d,midi):
    f=440*2**((midi-69)/12);t=time(d);phase=tau*f*t
    v=np.zeros(len(t))
    for h,g in [(1,1),(2,.42),(3,.26),(4,.09),(5,.11),(7,.035)]:
        v+=g*np.sin(phase*h*(1+.00022*h*h)+.06*h)*np.exp(-t/(.99/(1+.43*(h-1))))
    return (v+.1*noise(len(t),800,4600)*np.exp(-t/.019))*amp_env(t,d,.009,.3)
def score():
    stem=empty()
    notes=[(3.55,62,.080),(4.2,69,.072),(5.02,74,.055),(11.17,66,.062),(12.65,69,.047),
           (24.05,64,.047),(26.38,59,.044),(36.85,62,.076),(38.07,66,.057),
           (44.65,59,.054),(46.03,64,.048),(53.7,66,.069),(55.14,69,.053),(57.38,74,.08),
           (62.0,62,.07),(63.15,69,.062),(65.42,66,.095),(67.03,71,.072),
           (69.55,62,.105),(70.19,69,.095),(71.22,74,.096),(72.5,76,.079),(74.09,71,.075),
           (76.16,69,.069),(77.45,66,.071),(79.37,62,.082),(81.51,66,.061),
           (83.5,67,.073),(84.71,69,.089),(86.05,74,.09),(87.65,62,.07),(87.68,69,.044)]
    for i,(st,n,g) in enumerate(notes):
        v=pluck(2.7,n)
        space(stem,st,v,-.26+.12*(i%5),g)
        pos(stem,st+.182,v,.33,g*.13)
    finish("score",stem)
if __name__=="__main__":
    river();ferry();foley();score()
