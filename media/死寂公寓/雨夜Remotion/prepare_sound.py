"""Build the independent tracks used by the Remotion composition."""
import json
from pathlib import Path
import sys

import numpy as np
from scipy import ndimage, signal
import soundfile as sf

HERE = Path(__file__).resolve().parent
RAIN = HERE.parent / "雨夜短片"
LIB = HERE.parent / "独立音效库" / "A-制作音效"
OUT = HERE / "public" / "sound"
sys.path[:0] = [str(RAIN), str(HERE.parent / "门前的面粉")]
from mix import RATE, reflect, resonant, time
from rain_audio import fade, low_tone, footfall, fall_contact, interior_details

story = json.loads((RAIN/"story.json").read_text("utf-8"))
performance = json.loads((RAIN/"performance.json").read_text("utf-8"))
cues = story["events"]


def read(path):
    data, sr = sf.read(path, dtype="float32", always_2d=True)
    if sr != RATE or data.shape[1] != 2:
        raise ValueError(f"Unexpected format in {path}")
    return data


def save(name, data):
    if not np.isfinite(data).all() or np.abs(data).max() >= 1:
        raise ValueError(f"Invalid level in {name}")
    sf.write(OUT/(name+".flac"), data, RATE, subtype="PCM_16")


def lowpass(audio, hz):
    sos = signal.butter(3, hz, fs=RATE, output="sos")
    return signal.sosfilt(sos, audio, axis=0).astype(np.float32)


def curve(t, knots):
    return np.interp(t, [k[0] for k in knots], [k[1] for k in knots]).astype(np.float32)


def prepare():
    OUT.mkdir(parents=True,exist_ok=True)
    narration = read(RAIN/"旁白分轨.wav")
    speech = read(RAIN/"同步混音.wav") - read(RAIN/"音效分轨.wav")
    t = time(story["duration"])
    dialogue = np.zeros_like(speech)
    dialogue_ids = {line["id"] for line in story["lines"] if line["role"] != "narrator"}
    for line in performance["voices"]:
        if line["id"] in dialogue_ids:
            start = round(line["at"]*RATE)
            end = round((line["at"]+line["seconds"]+.18)*RATE)
            dialogue[start:end] = speech[start:end]-narration[start:end]
    save("narration",narration)
    save("dialogue",dialogue)

    rain = read(LIB/"01-雨打窗台.wav")
    gust = read(LIB/"02-风过树梢.wav")
    index = np.arange(len(t))
    rain = rain[(index+round(6.3*RATE))%len(rain)]
    gust = gust[(index+round(14.8*RATE))%len(gust)]
    openness = curve(t,[(0,.04),(2.19,.04),(2.76,.82),(5.16,.78),(5.55,.04),
                         (16,.04),(21.9,.23),(23.8,.60),(27,.83),(55.8,.82),
                         (56.81,.12),(60.85,.09),(61.76,.38),(63.83,.13),(70,.07),(90,.03)])
    room = lowpass(rain,1060)
    patio = room + openness[:,None]*(rain-room)
    weather_level = curve(t,[(0,.26),(2.2,.27),(2.78,.79),(5.18,.75),(5.55,.28),
                            (15.4,.29),(22.76,.63),(28,.87),(32.68,.79),(34.04,.17),
                            (35.5,.19),(36.31,.72),(53,.85),(56.35,.77),(57,.28),
                            (60.6,.29),(61.81,.82),(63.88,.55),(70,.35),(81,.24),(85,.13),(90,.08)])
    wind_level = .028 + .24*openness
    weather = patio*weather_level[:,None] + lowpass(gust,3200)*wind_level[:,None]
    weather += .39*low_tone(t,cues,np.random.default_rng(1475))
    voice_energy = np.sqrt(np.maximum(0,ndimage.uniform_filter1d(np.mean(speech**2,axis=1),RATE//5)))
    duck = 1-.23*np.clip((voice_energy-.018)/.072,0,1)
    weather *= (duck*fade(t,0,.22)*(1-fade(t,88.75,90)))[:,None]
    save("weather",weather)

    action = np.zeros_like(narration)
    footfall(action,cues)
    fall_contact(action,cues)
    interior_details(action,cues)
    for i,hz in enumerate([668,1002]):
        tone = resonant(.17+i*.04,[(hz,21,.77),(hz*2,65,.12)],.071-i*.013,.027)
        reflect(action,cues["phoneChime"]+.095*i,tone,.18,.05)
    # A fitted latch gives a short higher answer to the second, duller knock.
    tick = resonant(.13,[(436,53,.49),(1122,88,.21)],.030,.08)
    reflect(action,cues["knock"][1]+.033,tick,.28,.08)
    save("actions",action*1.19)

    motor = read(LIB/"07-手机贴木桌震动.wav")
    for name,start,length in [("motor-short",.270,.226),("motor-long",2.09,.49)]:
        piece = motor[round(start*RATE):round((start+length)*RATE)].copy()
        local = time(length)
        piece *= (fade(local,0,.008)*(1-fade(local,length-.040,length)))[:,None]
        save(name,piece)
    siren = read(LIB/"03-警车驶过.wav")
    save("police",.72*lowpass(siren,1800)+.28*lowpass(siren,3750))
    save("breath",read(LIB/"05-受惊短呼.wav"))


if __name__ == "__main__":
    prepare()
