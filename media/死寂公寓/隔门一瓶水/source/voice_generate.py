"""Generate the original Mandarin dialogue with fixed general-purpose TTS presets."""
import argparse
import asyncio
import json
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent
ROLES = {
    "narrator": ("zh-CN-YunyangNeural", "-10%", "-9Hz"),
    "yu": ("zh-CN-YunxiNeural", "-9%", "-9Hz"),
    "mei": ("zh-CN-XiaoyiNeural", "-12%", "-5Hz"),
    "radio": ("zh-CN-YunyangNeural", "-12%", "-2Hz"),
    "uncle": ("zh-CN-YunjianNeural", "-17%", "-15Hz")
}

async def synthesize(lines, replace):
    dest=ROOT/"voice"
    dest.mkdir(exist_ok=True)
    for cue in lines:
        output=dest/(cue["id"]+".mp3")
        if output.exists() and not replace:
            continue
        voice,rate,pitch=ROLES[cue["role"]]
        for attempt in range(3):
            try:
                speech=edge_tts.Communicate(cue["text"],voice,rate=rate,pitch=pitch,volume="-4%")
                temporary=output.with_suffix(".partial")
                await speech.save(str(temporary))
                temporary.replace(output)
                print(f'{cue["id"]:10s} {voice} {output.stat().st_size} bytes',flush=True)
                break
            except Exception:
                if attempt==2: raise
                await asyncio.sleep(1+attempt)

if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--replace",action="store_true")
    parser.add_argument("--only",nargs="+")
    options=parser.parse_args()
    if sys.platform=="win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    cues=json.loads((ROOT/"timeline.json").read_text(encoding="utf-8-sig"))["voice"]
    asyncio.run(synthesize([c for c in cues if not options.only or c["id"] in options.only],options.replace))
