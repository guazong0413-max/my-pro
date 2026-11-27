"""Original three-beat postal tune, bicycle foley and four stereo weather beds."""
from pathlib import Path
import subprocess
import numpy as np

SR = 48000
SECONDS = 32
N = SR * SECONDS
random = np.random.default_rng(817203)
clock = np.arange(N) / SR
music = np.zeros((N, 2), dtype=np.float32)
ambience = np.zeros_like(music)


def put(track, start, sound, pan, level):
    at = max(0, int(start * SR))
    length = min(len(sound), len(track) - at)
    if length <= 0:
        return
    signal = (sound[:length] * level).astype(np.float32)
    angle = np.pi / 4 * (1 + pan)
    track[at:at + length, 0] += signal * np.cos(angle)
    track[at:at + length, 1] += signal * np.sin(angle)


def smooth(lo, hi, t):
    u = np.clip((t - lo) / (hi - lo), 0, 1)
    return u * u * (3 - 2 * u)


def noise_band(low, high):
    data = random.normal(0, 1, N)
    spectrum = np.fft.rfft(data)
    f = np.fft.rfftfreq(N, 1 / SR)
    spectrum *= (1 - np.exp(-(f / low) ** 2)) * np.exp(-(f / high) ** 2)
    wave = np.fft.irfft(spectrum, N)
    return (wave / max(1e-9, wave.std())).astype(np.float32)


def note(start, pitch, seconds, instrument, strength, pan):
    t = np.arange(int(seconds * SR)) / SR
    freq = 440 * 2 ** ((pitch - 69) / 12)
    if instrument == 'bell':
        partials = [(1, 1, 1.6), (2.71, .28, 3.2), (4.16, .15, 4.8), (6.21, .06, 7.3)]
        attack = .006
    elif instrument == 'bass':
        partials = [(1, .86, 2.7), (2, .52, 3.4), (3.007, .23, 5.2), (4, .12, 7.5), (6, .06, 10)]
        attack = .016
    elif instrument == 'reed':
        phase = 2*np.pi*freq*t + .18*np.sin(2*np.pi*4.9*t)
        a = (np.sin(phase) + .19*np.sin(2*phase+.35) + .12*np.sin(3*phase+.12))
        env = (1-np.exp(-t/.095))*np.exp(-t*.66)*np.minimum(1,(seconds-t)/.19)
        put(music, start, a*env, pan, strength)
        return
    else:
        partials = [(1, .88, 2.4), (2, .42, 3.3), (3.002, .28, 4), (4.009, .15, 5.4),
                    (5.015, .13, 6.4), (6.022, .08, 7.6), (8.03, .05, 9.5)]
        attack = .0065
    a = np.zeros_like(t)
    for mul, level, damp in partials:
        phase = random.uniform(-.23, .23)
        a += level*np.sin(2*np.pi*freq*mul*t + phase) * np.exp(-damp*t)
    env = (1 - np.exp(-t / attack))*np.clip((seconds-t)/.12,0,1)
    put(music, start, a*env, pan, strength)


# Each two-second bar has a bass note and two lightly staggered offbeats.
chords = [(41,57,60,64),(46,57,62,65),(43,55,58,62),(48,55,60,64),
          (38,53,57,60),(43,55,58,62),(46,53,57,62),(48,55,62,64),
          (38,53,57,62),(39,55,58,62),(43,55,58,65),(45,52,55,61),
          (41,53,57,60),(46,53,60,62),(45,53,57,64),(41,53,57,60)]
for bar, (bass, *chord) in enumerate(chords):
    accent = [1,.73,.83,.67][bar//4]
    t = bar*2 + .05
    note(t,bass,1.37,'bass',.14*accent,-.16)
    for beat in range(2):
        for j,pitch in enumerate(chord):
            if bar == 15 and beat == 1:
                continue
            note(t+(beat+1)*2/3+j*.018+random.uniform(-.011,.011),pitch,1.05,'string',
                 (.045 if beat==0 else .037)*accent, -.4+j*.19)

melodies = [
    [(0.38,69),(.95,72),(1.39,74),(2.30,72),(3.15,69),(4.14,67),(4.85,69),(5.48,65),(6.62,67)],
    [(.36,65),(1.21,69),(2.47,67),(3.14,62),(4.27,65),(5.38,69),(6.55,67)],
    [(.31,69),(.92,72),(1.45,74),(2.26,75),(3.12,70),(4.39,67),(5.09,65),(6.45,69)],
    [(.34,69),(.95,72),(1.42,74),(2.35,77),(3.25,74),(4.12,72),(5.4,69),(6.36,65)]
]
for section, melody in enumerate(melodies):
    for i,(offset,pitch) in enumerate(melody):
        instrument=['string','bell','string','bell'][section]
        note(section*8+offset,pitch,1.55,instrument,[.114,.071,.102,.073][section],.19)
        if section==0 and i in (1,3,6):
            note(offset+.018,pitch-12,1.2,'reed',.031,-.08)
        if section==2 and i in (0,3,6):
            note(16+offset+.03,pitch-12,1.18,'reed',.043,-.16)

dry = music.copy()
for lag,gain in ((.045,.17),(.079,.11),(.141,.077),(.239,.045),(.341,.027)):
    n=int(lag*SR)
    music[n:] += gain*dry[:-n, ::-1]
del dry

sun = 1-smooth(6.60,8.14,clock)
rain = smooth(6.65,8.05,clock)*(1-smooth(14.95,16.20,clock))
dust = smooth(14.8,16.25,clock)*(1-smooth(22.60,24.15,clock))
ice = smooth(22.65,24.21,clock)
for side in range(2):
    breeze = noise_band(65,1080)
    spray = noise_band(1200,6500)
    wash = noise_band(240,2700)
    surf = .57+.43*np.sin(clock*1.30+np.sin(clock*.58)+side*.23)
    ambience[:,side] += (.018*sun*(.47+surf*.53)*wash +
                          rain*(.025*spray+.029*wash)*(1+.11*np.sin(clock*.97+side*.3))+
                          dust*breeze*(.058+.021*np.sin(clock*2.19+side*.25))+
                          ice*(.010*breeze+.007*spray))
    ambience[:,side] += .003*breeze

# Drips off eaves: different pitches and positions within the stereo image.
for start in random.uniform(6.95,16.0,170):
    t=np.arange(int(.058*SR))/SR
    f=random.uniform(970,2880)
    a=np.sin(2*np.pi*f*t+3*(1-np.exp(-t*75)))*np.exp(-83*t)*(1-np.exp(-t*2500))
    put(ambience,start,a,random.uniform(-.92,.92),random.uniform(.013,.048)*rain[int(start*SR)])

# Sparse distant seabirds. A little pitch inflection avoids a fixed whistle.
for start,length,freq,pan in [(1.35,.36,1030,-.61),(1.89,.25,1120,-.57),(4.22,.43,850,.45),(5.08,.26,966,.39)]:
    t=np.arange(int(length*SR))/SR
    phase=2*np.pi*np.cumsum(freq*(1+.22*np.sin(t/length*np.pi*1.6)))/SR
    env=np.sin(np.pi*t/length)**1.7
    put(ambience,start,env*(np.sin(phase)+.18*np.sin(2*phase)),pan,.026)

# Little chain and hub sounds follow the same wheel travel as the drawn bicycle.
distance = 368*clock + 47*np.sin(.62*clock) + 19*np.sin(1.17*clock)
ticks = np.flatnonzero(np.diff(np.floor(distance/21.7)))
for n,i in enumerate(ticks):
    t=np.arange(int(.014*SR))/SR
    click=(random.normal(0, .29, len(t))+.5*np.sin(2*np.pi*(1520+n%3*117)*t))*np.exp(-t*370)
    strength=(.012+.009*(n%4==0))*(1-.94*smooth(29.6,31.65,i/SR))
    put(ambience,i/SR,click,-.07,strength)
for start in [1.03,1.19,28.99,29.19]:
    t=np.arange(int(1.28*SR))/SR
    bell=sum(amp*np.cos(2*np.pi*freq*t)*np.exp(-t*decay) for amp,freq,decay in
             [(1,1791,3.9),(.33,2441,4.5),(.21,3667,6.9),(.11,4958,9.2)])
    put(ambience,start,bell*(1-np.exp(-t*900)),.28,.084 if start>28 else .055)
for start in [28.914,29.035]:
    t=np.arange(int(.085*SR))/SR
    flutter=(random.normal(0,.24,len(t))+.5*np.sin(2*np.pi*225*t))*np.exp(-t*65)
    put(ambience,start,flutter,.31,.099)

mix=(music+ambience)*smooth(0,.14,clock)[:,None]*(1-smooth(31.43,32,clock))[:,None]
mix *= .86/max(.01,np.max(np.abs(mix)))
out=Path(__file__).resolve().parents[1]/'art'/'ride.m4a'
args=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-channel_layout','stereo','-i','pipe:0',
      '-af','loudnorm=I=-18:TP=-1.6:LRA=9,aformat=sample_rates=48000:channel_layouts=stereo','-ac','2','-c:a','aac','-b:a','192k','-movflags','+faststart',str(out)]
subprocess.run(args,input=mix.astype('<f4').tobytes(),check=True)
print(out)
