"""Mix the new rain, Foley and Qwen dialogue for the rain-night short."""
import argparse
import json
import os
from pathlib import Path
import sys

import numpy as np
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / "门前的面粉"))
from mix import (RATE, add, arrange_captions, band, normalize, reflect, resonant,
                 rms, rustle, take, time)

PLAN = json.loads((ROOT / "story.json").read_text("utf-8"))
CUES = PLAN["events"]
FPS = PLAN["fps"]
DURATION = PLAN["duration"]
PRESETS = {
    "narrator": (80, 6120, .099, -.012),
    "chen": (95, 4700, .062, .025),
    "alert": (405, 4100, .075, -.13),
}


def fade_in(t, start, end):
    v = np.clip((t - start) / (end - start), 0, 1)
    return v * v * (3 - 2 * v)


def rain_ambience():
    rng = np.random.default_rng(14093)
    t = time(DURATION)
    perspective = np.interp(t, [0, 5.23, 5.44, 18.26, 18.51, 22.54, 22.85, 27.02,
                                27.20, 56.27, 56.52, 60.92, 62.25, 81.60, 86.04, 90],
                            [.80, .82, .32, .32, .63, .66, .46, .46,
                             .96, .96, .36, .37, .69, .62, .43, .37]).astype(np.float32)
    open_air = np.clip((perspective - .31) / .64, 0, 1)
    output = np.zeros((len(t), 2), np.float32)
    street = fade_in(t, 22.9, 24.51) * (1-fade_in(t, 34.1, 41.9))
    for channel in range(2):
        n = rng.normal(size=len(t)).astype(np.float32)
        rain = band(n, 110, 1600)*.014 + band(n, 1120, 8100)*(.009+.014*open_air)
        rain += band(n, 74, 360)*.009
        output[:, channel] = rain * perspective
        output[:, channel] += .00113*np.sin(2*np.pi*(51.4+.098*channel)*t)*(.55+.42*open_air)
        output[:, channel] += band(n, 145, 292)*street*.005
    for i, at in enumerate(rng.uniform(.2, 89.22, 336)):
        level = .0049 + .0093 * float(rng.random())
        j = min(len(t)-1, int(at*RATE))
        drip = resonant(.056+.022*float(rng.random()),
                        [(470+i%13*78, 86, .30),(1080+i%7*77, 112, .11)],
                        level*float(perspective[j]), .92)
        add(output, float(at), drip, float(rng.uniform(-.90, .90)))
    return output


def foley():
    bus = rain_ambience()
    for i, (at, length) in enumerate(zip(CUES["phoneBuzz"], [.19, .22, .17])):
        t = time(length+.033)
        motor = np.sin(2*np.pi*(89+3*i)*t + .38*np.sin(2*np.pi*24*t))
        motor += .43*np.sin(2*np.pi*(176+6*i)*t) + .19*np.sin(2*np.pi*263*t)
        gate = fade_in(t, 0, .019)*(1-fade_in(t, length-.029, length+.029))
        add(bus, at, normalize((motor*gate).astype(np.float32), .085), -.20)
    for i, frequency in enumerate([643, 912]):
        ping = resonant(.17+i*.07, [(frequency, 22, .64),(frequency*2.0, 32, .19)], .040-i*.01)
        add(bus, CUES["phoneChime"]+i*.095, ping, -.12)
    for key, peak in [("firstSteps", .029), ("retreatSteps", .035), ("hideSteps", .022)]:
        for i, at in enumerate(CUES[key]):
            pad = resonant(.13, [(98+i%4*11,43,.89),(215,61,.20),(411,90,.052)], peak*(1-.14*(i%2)), .14)
            reflect(bus, at, pad, -.16+.042*i, .066)
            add(bus, at+.02, rustle(.063,.0065,310,1720), -.11)
    for key, level in [("curtainOpen", .021),("curtainRelease", .037)]:
        add(bus, CUES[key], rustle(.51,level,425,3660), -.43)
    add(bus, CUES["railRelease"]-.03, rustle(.17,.017,510,3280), .11)
    impact = resonant(.51, [(63,14,.88),(118,25,.29),(232,35,.14)], .153, .20)
    reflect(bus, CUES["impact"], impact, .18, .14)
    add(bus, CUES["impact"]+.025, rustle(.32,.065,310,4190), .15)
    add(bus, CUES["brace"]+.30, rustle(.72,.025,220,1780), .095)
    add(bus, CUES["stand"]-.33, rustle(.43,.018,410,2470), .15)
    add(bus, CUES["wallTouch"], resonant(.16, [(89,37,1),(213,56,.21)], .060, .13), -.22)
    for i, at in enumerate(CUES["knock"]):
        distance = resonant(.245,[(122,30,.88),(214,36,.19),(523,61,.05)], .063-i*.012, .17)
        reflect(bus, at, band(distance, 86, 1275), .33, .12)
    return bus


def write_mix(out, marks_out, voice_dir, ffmpeg):
    sound = foley()
    marks = {"subs": [], "voices": [], "lips": {}}
    for row in PLAN["lines"]:
        dry,pan,tempo,shortened = take(row, ffmpeg, voice_dir, PRESETS)
        if row["role"] == "narrator":
            add(sound, row["at"], dry, pan)
        else:
            reflect(sound, row["at"], dry, pan, .065 if row["role"]=="chen" else .018)
        cues = arrange_captions(row, dry)
        marks["subs"].extend(cues)
        seconds = len(dry) / RATE
        marks["voices"].append({"id": row["id"], "at": row["at"], "seconds": round(seconds,3),
                                 "tempo": round(tempo,3), "shortenedPause": round(shortened,3)})
        if row["role"]=="chen":
            for frame in range(int(np.ceil(row["at"]*FPS)), int(np.ceil((row["at"]+seconds)*FPS))):
                i = round((frame/FPS-row["at"])*RATE)
                level = rms(dry[i:i+RATE//FPS])
                marks["lips"][frame] = round(float(np.clip((level-.009)/.079,0,.81)),3)
        print(row["id"], round(seconds,2), round(tempo,3))
    sound *= min(1.04,.77/max(.001,float(np.max(np.abs(sound)))))
    n = round(.47*RATE)
    sound[:n] *= np.linspace(0,1,n)[:,None]
    n = round(.79*RATE)
    sound[-n:] *= np.linspace(1,0,n)[:,None]
    if not np.isfinite(sound).all():
        raise ValueError("Non-finite audio")
    wavfile.write(out, RATE, np.round(sound*32767).astype(np.int16))
    marks_out.write_text(json.dumps(marks, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(out)


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--out", type=Path, default=ROOT/"同步混音.wav")
    p.add_argument("--performance", type=Path, default=ROOT/"performance.json")
    p.add_argument("--voice-dir", type=Path, default=ROOT/"voice")
    p.add_argument("--ffmpeg", default=os.environ.get("FFMPEG","ffmpeg"))
    args = p.parse_args()
    write_mix(args.out, args.performance, args.voice_dir, args.ffmpeg)
