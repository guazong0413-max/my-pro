"""Original Foley for the apartment. All oscillator and noise sources are generated here."""
from math import gcd
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.ndimage import uniform_filter1d
import soundfile as sf


RATE = 48000
TAU = 2 * np.pi
GASP = Path(__file__).resolve().parent / "制作素材" / "gasp.wav"


def time(seconds):
    return np.arange(round(seconds * RATE)) / RATE


def smooth(t, start, end):
    u = np.clip((t - start) / (end - start), 0, 1)
    return u * u * (3 - 2 * u)


def band(x, lo, hi):
    return signal.sosfilt(signal.butter(3, [lo, hi], btype="bandpass", fs=RATE, output="sos"), x)


def unit(x):
    return x / max(np.sqrt(np.mean(x * x)), 1.e-8)


def pan_into(bus, wave, position, at=0.0):
    first = round(at * RATE)
    n = min(len(wave), len(bus) - first)
    if n > 0:
        bus[first:first+n] += wave[:n, None] * np.sqrt([(1-position)/2, (1+position)/2])


def random_curve(t, rng, step):
    knots = np.arange(-step, t[-1] + 2*step, step)
    values = rng.uniform(-1, 1, len(knots))
    i = np.searchsorted(knots, t, side="right") - 1
    u = smooth(t, knots[i], knots[i+1])
    return values[i]*(1-u) + values[i+1]*u


def ambience_loop(bus, seconds):
    n = round(seconds * RATE)
    overlap = len(bus) - n
    angle = np.linspace(0, np.pi/2, overlap)[:, None]
    prefix = bus[n:] * np.cos(angle) + bus[:overlap] * np.sin(angle)
    return np.concatenate([prefix, bus[overlap:n]])


def colour_balance(stereo, targets):
    # Broad-band power only. These targets contain no sampled audio or phase.
    centres = np.array([40,56,80,112,160,225,315,450,630,900,1250,1800,
                        2500,3550,5000,7100,10000,14500,20000])
    freq, powers = signal.welch(stereo, fs=RATE, nperseg=4096, axis=0)
    measured = np.array([10*np.log10(powers[(freq >= c/1.19) & (freq < c*1.19)].mean()+1e-16)
                         for c in centres])
    delta = np.array(targets) - measured
    gain = np.clip(delta - np.median(delta), -13, 13)
    curve = 10 ** (gain / 20)
    kernel = signal.firwin2(2049, np.r_[0, centres, RATE/2],
                            np.r_[curve[0]*.15, curve, curve[-1]*.3], fs=RATE)
    return signal.fftconvolve(stereo, kernel[:, None], mode="same", axes=0)


def rain(seconds):
    rng = np.random.default_rng(41682)
    t = time(seconds+1)
    bus = np.zeros((len(t),2))
    showers = .9+.16*random_curve(t,rng,2.3)+.065*random_curve(t,rng,.43)
    shared = rng.normal(size=len(t))
    for ch in range(2):
        noise = .44*shared+.90*rng.normal(size=len(t))
        spray = .53*unit(band(noise,550,3400))+.35*unit(band(noise,2600,10700))
        bus[:,ch] = spray*showers

    # Independent splashes in standing water. Large drops throw secondary spray.
    k = time(.064)
    for at in rng.uniform(.015,t[-1]-.16,int(83*seconds)):
        size = min(rng.lognormal(-.05,.70),2.55)
        tail = rng.uniform(.0014,.007)*np.clip(size,.72,1.8)
        hiss = band(rng.normal(size=len(k)),rng.uniform(680,1700),rng.uniform(6300,13600))
        splash = hiss*np.exp(-k/tail)*smooth(k,0,.00075)
        f = rng.uniform(740,2980)/np.clip(size,.70,2.1)**.24
        bubble = np.sin(TAU*f*(k+2.4*k*k))*np.exp(-k/rng.uniform(.0016,.0054))
        splash += .32*bubble*smooth(k,0,.00038)
        position = rng.uniform(-.87,.87)
        level = rng.uniform(1.6,3.9)*size*showers[round(at*RATE)]
        pan_into(bus,splash*level,position,at)
        if size>1.5:
            secondary = hiss*np.exp(-k/(tail*.54))*smooth(k,0,.00044)
            pan_into(bus,secondary*level*rng.uniform(.12,.32),position,at+rng.uniform(.008,.034))

    # Drops nearest the microphone hit two fixed parts of the sill. Each strike
    # excites the same metal at a slightly different point.
    for at in rng.uniform(.03,t[-1]-.12,round(3.1*seconds)):
        pos = rng.choice([-.39,.63])+rng.uniform(-.07,.07)
        f = rng.uniform(470,790) if pos<0 else rng.uniform(315,515)
        tap = np.sin(TAU*f*k)*np.exp(-k/rng.uniform(.004,.012))
        tap += .48*np.sin(TAU*1.82*f*k)*np.exp(-k/.0045)
        tap += band(rng.normal(size=len(k)),500,7300)*np.exp(-k/.003)
        pan_into(bus,tap*smooth(k,0,.0007)*rng.uniform(.9,1.9),pos,at)
    return ambience_loop(bus,seconds)


def wind(seconds):
    rng = np.random.default_rng(56924)
    t = time(seconds+1)
    gust = .16 + .05*random_curve(t,rng,1.8)
    for centre, rise, fall, strength in [(2.7,.97,.62,.22),(8.4,1.90,.92,.78),
                                         (10.2,.52,1.14,.31),(16.7,1.70,2.45,.61),(20.2,.65,1.1,.24)]:
        width = np.where(t<centre,rise,fall)
        gust += strength*np.exp(-.5*((t-centre)/width)**2)
    gust *= 1 + .21*random_curve(t,rng,.66)
    common = rng.normal(size=len(t))
    bus = np.zeros((len(t),2))
    for ch, lag in enumerate([.12, .38]):
        noise = .46*common + .89*rng.normal(size=len(t))
        leaves = np.interp(t-lag,t,gust)
        flutter = .80 + .26*random_curve(t,rng,.09) + .20*random_curve(t,rng,.037)
        canopy = .61*unit(band(noise,54,690))*(.22 + .88*gust)
        mid = .40*unit(band(noise,440,2170))*(.14 + leaves**1.18)*flutter
        fine = .27*unit(band(noise,1950,10400))*(.065 + leaves**1.55)*flutter
        # A branch has many leaves moving together, with shorter rustles nested inside.
        flecks = np.zeros(len(t))
        for start in rng.integers(0,len(t),int(19*t[-1])):
            k = time(rng.uniform(.038,.13))
            envelope = smooth(k,0,.009)*np.exp(-k/rng.uniform(.013,.035))
            leaf = band(rng.normal(size=len(k)), rng.uniform(1400,2900), rng.uniform(5400,10100))
            n = min(len(k),len(t)-start)
            flecks[start:start+n] += leaf[:n]*envelope[:n]*leaves[start]**1.4*rng.uniform(.35,1.05)
        # Turbulent air slipping past the window edge has a broad moving
        # resonance. It rises with each gust and vanishes in the lulls.
        edge_pitch = 205+235*leaves+24*random_curve(t,rng,.26)
        angle = TAU*np.cumsum(edge_pitch)/RATE
        edge = (np.cos(angle)*unit(band(noise,8,57)) +
                np.sin(angle)*unit(band(rng.normal(size=len(t)),8,57)))
        edge *= .24*smooth(leaves,.32,.9)
        bus[:,ch] = canopy + mid + fine + flecks + edge
    target = [-6,-2,0,-1,-3,-4,-4,-5,-6,-8,-10,-12,-13,-14,-15,-16,-23,-29,-40]
    return ambience_loop(colour_balance(bus,target), seconds)


def moving_vehicle(seconds, ambulance):
    rng = np.random.default_rng(3662 if ambulance else 4833)
    t = time(seconds)
    padding = 1.5
    e = time(seconds + 2*padding) - padding
    speed, setback = (14.2, 13.0) if ambulance else (19.8, 10.5)
    nearest = seconds*(.54 if ambulance else .52)
    if ambulance:
        cycle = np.mod(e+.34, 1.44)
        high = smooth(cycle,.696,.730) * (1-smooth(cycle,1.409,1.438))
        low = (1-smooth(cycle,.692,.723))*smooth(cycle,0,.025)
        low += smooth(cycle,1.415,1.44)*.12
        siren = np.zeros(len(e))
        # Two reeds per note. The neighbouring fundamentals beat against one
        # another, while the horn bell emphasises upper harmonics and valve air.
        partials = [.73,.92,1.0,.68,.51,.29,.25,.24,.30,.39,.25,.18,.10,.09,.07]
        for base, gate, shift in [(438,low,.4),(580,high,1.5)]:
            for ratio, gain in [(1.0,1.0),(1.039,.84)]:
                pressure = (.0023*np.sin(TAU*4.4*e+shift) + .0041*random_curve(e+padding,rng,.062))
                phase = TAU*np.cumsum(base*ratio*(1+pressure))/RATE
                horn = np.zeros(len(e))
                for number, level in enumerate(partials,1):
                    horn += level*np.sin(number*phase+rng.uniform(0,TAU))
                siren += gate*gain*horn*(.92+.08*random_curve(e+padding,rng,.095))
            siren += gate*.055*unit(band(rng.normal(size=len(e)),970,10800))
    else:
        cycle = np.mod(e+.70,4.70)
        sweep = np.interp(cycle,[0,.38,1.23,1.82,2.19,2.56,3.33,4.32,4.70],
                          [0,.12,.74,.96,1,.93,.47,.06,0])
        freq = 785*(1+1.02*sweep)*(1+.0015*np.sin(TAU*5.3*e))
        phase = TAU*np.cumsum(freq)/RATE
        siren = np.sin(phase)+.32*np.sin(2*phase+.28)+.26*np.sin(3*phase+.76)
        siren += .15*np.sin(4*phase+.11) + .10*np.sin(5*phase+.5)
    siren = band(siren,290,11400 if ambulance else 6200)
    rev = 77 + 9*smooth(e,nearest-1.8,nearest+2.5) + 1.5*np.sin(.83*e)
    engine = TAU*np.cumsum(rev)/RATE
    drive = np.sin(engine)+.62*np.sin(2*engine+.2)+.28*np.sin(3*engine+.5)
    tires = unit(band(rng.normal(size=len(e)),150,3800))
    axle = .28*unit(band(rng.normal(size=len(e)),48,560))
    rolling = (.14*drive + .17*tires + .12*axle) * (1+.08*random_curve(e+padding,rng,.26))
    horn_body = signal.sosfilt(signal.butter(2,1700,fs=RATE,output="sos"),siren)
    road = np.zeros((len(t),2))
    direction = -1 if ambulance else 1
    for ch, ear in enumerate([-.09,.09]):
        ear_sign = -1 if ch==0 else 1
        for lateral, strength, mirror in [(setback,1,1),(setback+20,.23,-1),(setback+39,.10,1)]:
            # Solve reception time = emission time + travelled distance / sound speed.
            tau = t.copy()
            for _ in range(4):
                horizontal = direction*speed*(tau-nearest)-ear
                distance = np.hypot(horizontal,lateral)
                tau = t-distance/343
            azimuth = horizontal/distance*mirror
            gain = strength*(setback/distance)**1.12
            head = np.sqrt((1+(.61 if mirror==1 else .32)*ear_sign*azimuth)/2)
            body = np.interp(tau,e,horn_body)
            direct = np.interp(tau,e,siren)
            clarity = (.91 if strength==1 else .46)*np.exp(-.0047*np.maximum(0,distance-setback))
            # The forward-facing horn carries farther before the vehicle passes.
            aim = 1-.30*smooth(tau,nearest-.25,nearest+.95)
            road[:,ch] += gain*head*aim*(body + clarity*(direct-body))
            if strength==1:
                road[:,ch] += gain**1.2*head*np.interp(tau,e,rolling)
        road[:,ch] += .0042*unit(band(rng.normal(size=len(t)),90,1600))
    edges = smooth(t,0,.44)*(1-smooth(t,seconds-.74,seconds))
    return road*edges[:,None]


def small_room(dry, position):
    bus = np.zeros((len(dry),2))
    pan_into(bus,dry,position)
    for delay, gain, pan in [(.0063,.100,-.34),(.0117,.065,.42),(.0214,.037,-.15),(.034,.019,.10)]:
        pan_into(bus,band(dry,155,4400)*gain,pan,delay)
    return bus


def gasp(seconds):
    rng = np.random.default_rng(634)
    voice, sr = sf.read(GASP, dtype="float64")
    if voice.ndim != 1:
        raise ValueError("Expected a mono dry vocal take")
    kernel = gcd(sr, RATE)
    voice = signal.resample_poly(voice, RATE//kernel, sr//kernel)
    active = np.flatnonzero(uniform_filter1d(voice**2,int(.007*RATE)) > voice.max()**2*.00055)
    voice = voice[max(0,active[0]-int(.018*RATE)):active[-1]+int(.036*RATE)]
    t = time(seconds)
    inhale = (.48*unit(band(rng.normal(size=len(t)),410,830)) +
              .72*unit(band(rng.normal(size=len(t)),1120,2750)) +
              .28*unit(band(rng.normal(size=len(t)),2500,7700)))
    breath = smooth(t,.215,.305)*(1-smooth(t,.314,.390))
    dry = .044 * inhale * breath
    i = round(.349*RATE)
    vocal_t = np.arange(len(voice))/RATE
    envelope = np.sqrt(np.maximum(uniform_filter1d(voice**2,int(.012*RATE)),0))
    throat_air = unit(band(rng.normal(size=len(voice)),720,3700))*envelope
    dry[i:i+len(voice)] += voice*(1-.19*smooth(vocal_t,.17,.33)) + .24*throat_air
    return small_room(dry,-.09)


def alarm(seconds):
    t = time(seconds)
    wave = np.zeros(len(t))
    rng = np.random.default_rng(279)
    harmonics = [.27,.11,1,.38,.35,.21,.16,.52,.16,.56,.53,.24]
    for start in np.arange(.15,seconds-.27,.52):
        local = np.maximum(0,t-start)
        # A vibrating piezo disc and its case favour the third harmonic.
        active = smooth(t,start,start+.004)*(1-smooth(t,start+.279,start+.284))
        phase = TAU*(902*local + .075*(1-np.exp(-local/.010))) + .074*np.sin(TAU*57*local)
        reed = sum(gain*np.sin(n*phase+.19*n**2) for n,gain in enumerate(harmonics,1))
        wave += active*reed
        after = np.maximum(0,t-(start+.281))
        wave += .12*np.sin(TAU*2714*after)*np.exp(-after/.008)
    room = .014*unit(band(rng.normal(size=len(t)),55,560)) + .006*unit(band(rng.normal(size=len(t)),460,4400))
    return small_room(wave+room,.19)


def buzz(seconds):
    rng = np.random.default_rng(1427)
    bus = np.zeros(len(time(seconds)))
    for start, hold, strength in [(.27,.46,.89),(1.16,.49,.97),(2.09,.83,1.0)]:
        t = time(hold+.22)
        spin = 164 - 42*np.exp(-t/.043) - 35*smooth(t,hold,hold+.088)
        spin += .84*np.sin(TAU*14*t) + .55*random_curve(t,rng,.026)
        phase = TAU*np.cumsum(spin)/RATE
        env = smooth(t,0,.032)*np.exp(-np.maximum(0,t-hold)/.018)
        motor = .11*np.sin(phase)+.84*np.sin(2*phase+.6)+.061*np.sin(3*phase+.63)
        # The casing meets the desk at both extrema of a drive cycle. Its ribs
        # and cover add narrow upper partials, audible on phone-size speakers.
        for n, level in [(2,.20),(3,.052),(5,.071),(6,.16),(7,.062),(10,.037),
                         (15,.032),(18,.056),(19,.041),(22,.032),(23,.048),(24,.055)]:
            motor += level*np.sin(2*n*phase+.18*n**2)
        gaps = np.maximum(0,np.sin(2*phase+.6)-(.52+.11*random_curve(t,rng,.04)))**2
        knocks = np.diff(gaps,prepend=0)*31
        body = np.zeros(len(t))
        for hz, q, amp in [(155,3,.35),(343,4,.58),(539,6,.23),(925,5,.23),(1408,5,.10)]:
            b,a = signal.iirpeak(hz,q,fs=RATE)
            body += amp*signal.lfilter(b,a,knocks*env)
        rattle = band(rng.normal(size=len(t)),380,6800)*gaps*env*.90
        tap = (.11*np.sin(TAU*161*t)+.035*np.sin(TAU*570*t))*np.exp(-t/.022)
        signal_out = strength*(env*motor+3.0*body+rattle+tap)
        idx = round(start*RATE)
        n = min(len(bus)-idx,len(t))
        bus[idx:idx+n] += signal_out[:n]
    return small_room(bus,.23)


def render(key, seconds):
    if key in ("police","ambulance"):
        return moving_vehicle(seconds,key=="ambulance")
    return {"rain":rain, "wind":wind, "gasp":gasp, "alarm":alarm, "buzz":buzz}[key](seconds)
