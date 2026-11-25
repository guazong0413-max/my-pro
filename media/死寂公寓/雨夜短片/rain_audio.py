"""Build the rain, room perspective and synchronized effects from scene cues."""
import numpy as np

from mix import RATE, add, band, normalize, reflect, resonant, rustle, time


def fade(t, start, end):
    u = np.clip((t-start)/(end-start), 0, 1)
    return u*u*(3-2*u)


def envelope(t, points):
    return np.interp(t, [a for a, _ in points], [v for _, v in points]).astype(np.float32)


def rain_field(t, cues, rng):
    swell = cues["rainSwell"]
    hit = cues["impact"]
    release = cues["railRelease"]
    weather = envelope(t, [(0,.84),(5.25,.87),(5.49,.28),(14.75,.28),
        (18.33,.45),(22.66,.54),(24.20,.69),(26.99,.65),(27.11,.89),
        (release-1.85,.78),(release-.86,.32),(release-.27,.13),(hit+.16,.26),(hit+1.2,.62),
        (46,.76),(55.96,.81),(56.34,.69),(56.57,.38),(58.61,.27),
        (swell-.42,.32),(swell+.7,.62),(69.54,.51),(81.62,.37),(90,.26)])
    open_air = envelope(t, [(0,.93),(5.24,.93),(5.43,.03),(15.9,.04),
        (19.65,.23),(22.68,.31),(24.0,.49),(27.08,.92),(56.32,.92),
        (56.53,.08),(swell,.10),(swell+1.1,.28),(81.8,.045),(90,.035)])
    gust = .86+.12*np.sin(2*np.pi*.24*t+.44*np.sin(2*np.pi*.136*t))
    common = rng.normal(size=len(t)).astype(np.float32)
    bus = np.zeros((len(t),2), np.float32)
    for ch in range(2):
        independent = rng.normal(size=len(t)).astype(np.float32)
        noise = .47*common+.73*independent
        diffuse = band(noise,160,1690)*(.017+.027*open_air)
        diffuse += band(noise,1400,8100)*(.0029+.024*open_air)
        diffuse += band(noise,63,496)*(.026+.021*open_air)
        bus[:,ch] = diffuse * weather * gust
    for i,at in enumerate(rng.uniform(.12,89.8,425)):
        where=min(len(t)-1,round(at*RATE))
        ap=float(open_air[where])
        if ap<.12 and rng.random()>.26:
            continue
        level=(.008+.020*float(rng.random()))*float(weather[where])*(.28+.72*ap)
        drip=resonant(.033+.073*float(rng.random()),
            [(565+i%14*86,74,.32),(1450+i%8*106,114,.23)],level,.79)
        add(bus,float(at),drip,float(rng.uniform(-.85,.85)))
    for left,right,amount in [(18.1,27.05,1.0),(60.9,67.45,1.26),(70.0,80.4,.55)]:
        for n,at in enumerate(np.sort(rng.uniform(left,right,int((right-left)*9)))):
            gain=amount*float(rng.uniform(.008,.036))
            taps=resonant(.051,[(695+n%12*84,81,.30),(1370+n%8*94,112,.33)],gain,1.16)
            pan=float(rng.uniform(-.68,-.08))
            reflect(bus,float(at),band(taps,440,4900),pan,.045)
    return bus


def low_tone(t, cues, rng):
    release,hit=cues["railRelease"],cues["impact"]
    level=envelope(t,[(0,.24),(2.5,.73),(5.22,.63),(5.54,.17),(12.59,.20),
        (15.85,.15),(18.4,.39),(22.8,.46),(27.11,.50),(30.85,.80),
        (release-1.36,.71),(release-.79,.30),(release-.13,.057),(hit,.025),(hit+1.7,.042),
        (43.6,.10),(46.51,.35),(51.49,.64),(56.28,.58),(56.92,.17),(58.45,.23),
        (60.56,.29),(64.10,.52),(67.21,.39),(72.91,.24),(79.8,.18),
        (81.65,.28),(83.84,.62),(84.95,.45),(85.48,.16),(86.57,.045),(90,0)])
    sweep=.56*np.sin(2*np.pi*.064*t)+.28*np.sin(2*np.pi*.099*t)
    diffuse=rng.normal(size=len(t)).astype(np.float32)
    air=band(diffuse,94,374)*.036
    bus=np.zeros((len(t),2),np.float32)
    for ch in range(2):
        bass=.030*np.sin(2*np.pi*(47.5+ch*.18)*t+.5*sweep)
        bass+=.018*np.sin(2*np.pi*(72.1-ch*.24)*t+.7*sweep+1.3*ch)
        bass+=.014*np.sin(2*np.pi*(95.05+ch*.29)*t-.34*sweep)
        room=air+.0048*np.sin(2*np.pi*(143.45+ch*1.4)*t+.5*sweep)
        bus[:,ch]=level*(bass+room)
    return bus


def passing_siren(bus, t):
    envelope=fade(t,22.74,23.54)*(1-fade(t,25.12,26.55))
    p=2*np.pi*(431*t+45/(2*np.pi*.58)*np.sin(2*np.pi*.58*t))
    voice=.021*np.sin(p)+.006*np.sin(2*p+.12)
    smooth=band(voice.astype(np.float32),290,1110)
    pan=np.clip(-.76+.34*(t-22.75),-.78,.45)
    bus[:,0]+=smooth*envelope*np.sqrt((1-pan)/2)
    bus[:,1]+=smooth*envelope*np.sqrt((1+pan)/2)


def bedside(bus, cues):
    for i,(at,length) in enumerate(zip(cues["phoneBuzz"],[.19,.22,.17])):
        t=time(length+.105)
        f=91+3.8*i
        buzz=np.sin(2*np.pi*f*t+.49*np.sin(2*np.pi*23*t))
        buzz+=.42*np.sin(2*np.pi*2.01*f*t)+.14*np.sin(2*np.pi*3.80*f*t)
        wood=.23*np.sin(2*np.pi*136*t)*np.exp(-11*t)
        shut=fade(t,0,.014)*(1-fade(t,length-.028,length+.025))
        motor=normalize(band(((buzz+wood)*shut).astype(np.float32),69,1400),.131-i*.009)
        reflect(bus,at,motor,.26,.076)
        add(bus,at+length-.012,resonant(.072,[(178,61,.7),(437,98,.11)],.017,.12),.26)
    for i,frequency in enumerate([668,1002]):
        note=resonant(.19+i*.044,[(frequency,21,.78),(frequency*2,58,.13)],.066-i*.015,.028)
        start=cues["phoneChime"]+i*.098
        reflect(bus,start,band(note,478,4630),.12,.054)


def footfall(bus, cues):
    plans=[("firstSteps",.022,.10,-.39),("retreatSteps",.032,-.38,.11),("hideSteps",.021,-.07,.37)]
    for key,peak,a,b in plans:
        count=len(cues[key])
        for i,at in enumerate(cues[key]):
            pan=a+(b-a)*i/max(1,count-1)
            pad=resonant(.145,[(87+i%4*13,38,.82),(174+i%5*6,62,.24),(361,86,.048)],
                peak*(1-.15*(i%2)),.21)
            reflect(bus,at,pad,pan,.075)
            add(bus,at+.022,rustle(.072,.0073,255,1680),pan)


def fall_contact(bus, cues):
    release,hit=cues["railRelease"],cues["impact"]
    give=resonant(.16,[(187,61,.83),(484,79,.30),(1154,94,.074)],.036,.15)
    add(bus,release-.012,give,.13)
    length=hit-release
    t=time(length)
    plunge=fade(t,0,.27)*((.30+.70*(t/length))**2)
    plunge*=1-.80*fade(t,length-.038,length)
    noise=rustle(length,.10,128,1090)*plunge
    add(bus,release,noise,.05)
    wet=resonant(.45,[(66,16,1),(116,25,.55),(215,51,.26),(397,65,.083)],.259,.39)
    reflect(bus,hit,wet,.20,.13)
    slap=rustle(.25,.106,480,3900)
    reflect(bus,hit+.012,slap,.27,.19)
    land_echo=band(wet,71,418)*.13
    add(bus,hit+.181,land_echo,-.28)
    for at,length,peak in [(48.70,.220,.030),(50.17,.265,.045),(51.54,.248,.036),(cues["stand"]-.25,.325,.024)]:
        add(bus,at,rustle(length,peak,275,2600),.17)


def interior_details(bus,cues):
    for key,peak,length in [("curtainOpen",.065,.57),("curtainRelease",.092,.49)]:
        move=rustle(length,peak,340,4590)
        reflect(bus,cues[key],move,-.48,.13)
    for at,length,peak,pan in [(13.25,.33,.018,.06),(56.82,.36,.041,-.35),
        (57.8,.36,.023,-.10),(58.66,.54,.031,.14),(63.63,.39,.019,-.13)]:
        add(bus,at,rustle(length,peak,280,2095),pan)
    wall=resonant(.22,[(76,26,.94),(154,55,.49),(315,83,.06)],.101,.19)
    reflect(bus,cues["wallTouch"],wall,.16,.11)
    add(bus,cues["wallTouch"]+.04,rustle(.20,.025,245,1940),.17)
    for i,(at,pan) in enumerate([(82.91,.64),(83.46,.48),(84.41,.29)]):
        scuff=rustle(.28,.026-i*.003,115,580)
        reflect(bus,at,scuff,pan,.12)
    for i,at in enumerate(cues["knock"]):
        hollow=resonant(.36,[(81,21,.74),(142,27,.70),(215,52,.25),(371,64,.13)],.130-i*.032,.22)
        reflect(bus,at,hollow,.29,.21)
        add(bus,at+.075,band(hollow,58,370)*.12,-.22)


def soundscape(cues,duration):
    rng=np.random.default_rng(19225)
    t=time(duration)
    bus=rain_field(t,cues,rng)
    bus+=low_tone(t,cues,rng)
    bedside(bus,cues)
    passing_siren(bus,t)
    footfall(bus,cues)
    fall_contact(bus,cues)
    interior_details(bus,cues)
    return bus
