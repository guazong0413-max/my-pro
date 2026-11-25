"""Render the recorded line directions with Qwen3-TTS CustomVoice."""
import argparse
import json
import os
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

base = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument("--model", default="Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice")
parser.add_argument("--plan", type=Path, default=base / "story.json")
parser.add_argument("--voice-dir", type=Path, default=base / "voice")
parser.add_argument("--only", nargs="*")
parser.add_argument("--seed", type=int, help="override the per-line production seeds")
args = parser.parse_args()
plan = json.loads(args.plan.read_text("utf-8"))
device = "cuda:0" if torch.cuda.is_available() else "cpu"
model = Qwen3TTSModel.from_pretrained(args.model, device_map=device,
    dtype=torch.bfloat16 if device != "cpu" else torch.float32, attn_implementation="sdpa")
output = args.voice_dir
output.mkdir(parents=True, exist_ok=True)
# Each line has an independent seed and a reusable dry take.
pending = [(i,line) for i,line in enumerate(plan["lines"]) if
           (not args.only or line["id"] in args.only) and
           (args.only or not (output / (line["id"] + ".wav")).exists())]
for i,line in pending:
    torch.manual_seed(args.seed + i if args.seed is not None else line.get("seed", 9211 + i))
    role = plan["roles"][line["role"]]
    waves, sr = model.generate_custom_voice(text=line["text"], language="Chinese",
        speaker=role["speaker"], instruct=line["instruct"], max_new_tokens=200,
        non_streaming_mode=True, temperature=.5, top_p=.85)
    samples = np.asarray(waves[0], dtype=np.float32)
    if len(samples) < .35*sr or not np.isfinite(samples).all() or np.max(np.abs(samples)) < .01:
        raise RuntimeError("Invalid take " + line["id"])
    dest = output / (line["id"] + ".wav")
    sf.write(dest.with_suffix(".tmp.wav"), samples, sr, subtype="PCM_16")
    os.replace(dest.with_suffix(".tmp.wav"), dest)
    print(line["id"], round(len(samples)/sr, 2), flush=True)
