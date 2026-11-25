"""Combine the still-aligned narration, dialogue and independently rendered soundscape."""
import argparse
import json
import os
from pathlib import Path
import sys

import numpy as np
from scipy import ndimage
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parent
sys.path[:0] = [str(ROOT), str(ROOT.parent / "门前的面粉")]
from mix import RATE, add, arrange_captions, reflect, rms, take
from rain_audio import soundscape

PLAN = json.loads((ROOT / "story.json").read_text("utf-8"))
FPS = PLAN["fps"]
DURATION = PLAN["duration"]
PRESETS = {
    "narrator": (73, 7200, .131, 0),
    "chen": (95, 4700, .073, .025),
    "alert": (405, 4100, .078, -.13),
}


def write_track(path, data, master_gain):
    beginning, ending = round(.18*RATE), round(.92*RATE)
    data *= master_gain
    data[:beginning] *= np.linspace(0,1,beginning)[:,None]
    data[-ending:] *= np.linspace(1,0,ending)[:,None]
    if not np.isfinite(data).all():
        raise ValueError("Non-finite audio in " + str(path))
    wavfile.write(path,RATE,np.round(np.clip(data,-1,32767/32768)*32768).astype(np.int16))


def write_mix(out, marks_out, voice_dir, ffmpeg, narration_out, effects_out):
    effects = soundscape(PLAN["events"],DURATION)
    narration = np.zeros_like(effects)
    dialogue = np.zeros_like(effects)
    marks = {"subs": [], "voices": [], "lips": {}}
    for row in PLAN["lines"]:
        dry,pan,tempo,shortened = take(row,ffmpeg,voice_dir,PRESETS)
        if row["role"] == "narrator":
            add(narration,row["at"],dry,pan)
        else:
            reflect(dialogue,row["at"],dry,pan,.065 if row["role"]=="chen" else .018)
        marks["subs"].extend(arrange_captions(row,dry))
        seconds = len(dry)/RATE
        marks["voices"].append({"id":row["id"],"at":row["at"],"seconds":round(seconds,3),
                                "tempo":round(tempo,3),"shortenedPause":round(shortened,3)})
        if row["role"]=="chen":
            for frame in range(int(np.ceil(row["at"]*FPS)),int(np.ceil((row["at"]+seconds)*FPS))):
                i=round((frame/FPS-row["at"])*RATE)
                level=rms(dry[i:i+RATE//FPS])
                marks["lips"][frame]=round(float(np.clip((level-.009)/.079,0,.81)),3)
        print(row["id"],round(seconds,2),round(tempo,3))

    speech=narration+dialogue
    energy=np.sqrt(ndimage.uniform_filter1d(np.mean(speech*speech,axis=1),size=RATE//5).clip(min=0))
    effects*=1-.24*np.clip((energy-.009)/.051,0,1)[:,None]
    master=speech+effects
    gain=min(1.42,.87/max(.001,float(np.max(np.abs(master)))))
    write_track(out,master,gain)
    if narration_out:
        write_track(narration_out,narration,gain)
    if effects_out:
        write_track(effects_out,effects,gain)
    marks_out.write_text(json.dumps(marks,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(out)


if __name__ == "__main__":
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--out",type=Path,default=ROOT/"同步混音.wav")
    p.add_argument("--performance",type=Path,default=ROOT/"performance.json")
    p.add_argument("--voice-dir",type=Path,default=ROOT/"voice")
    p.add_argument("--narration-stem",type=Path)
    p.add_argument("--effects-stem",type=Path)
    p.add_argument("--ffmpeg",default=os.environ.get("FFMPEG","ffmpeg"))
    args=p.parse_args()
    write_mix(args.out,args.performance,args.voice_dir,args.ffmpeg,args.narration_stem,args.effects_stem)
