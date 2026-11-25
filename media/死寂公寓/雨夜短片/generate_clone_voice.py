"""Synthesize the rain short's narration from a local reference recording."""
import argparse
import json
import os
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel


def reference_wave(path, reference):
    samples, rate = sf.read(path, dtype="float32", always_2d=True)
    start = round(reference["at"] * rate)
    end = round(reference["until"] * rate)
    if start < 0 or end <= start or end > len(samples):
        raise ValueError("The reference WAV must cover the source timeline in story.json.")
    mono = samples[start:end].mean(axis=1)
    if not np.isfinite(mono).all() or np.max(np.abs(mono)) < .015:
        raise ValueError("The reference time range has no usable narration.")
    return mono, rate


def render(args):
    plan = json.loads(args.plan.read_text(encoding="utf-8"))
    settings = plan["narrationClone"]
    reference = settings["reference"]
    rows = [r for r in plan["lines"] if r["role"] == "narrator" and
            (args.only is None or r["id"] in args.only)]
    if not rows:
        raise ValueError("No narration lines matched.")
    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    model = Qwen3TTSModel.from_pretrained(args.model or settings["model"], device_map=device,
        dtype=torch.bfloat16 if device != "cpu" else torch.float32, attn_implementation="sdpa")
    prompt = model.create_voice_clone_prompt(
        ref_audio=reference_wave(args.reference, reference),
        ref_text=reference["text"])
    args.voice_dir.mkdir(parents=True, exist_ok=True)
    for row in rows:
        out = args.voice_dir / (row["id"] + ".wav")
        if out.exists() and args.only is None:
            continue
        torch.manual_seed(args.seed if args.seed is not None else row["seed"])
        waves, rate = model.generate_voice_clone(
            text=row["text"], language="Chinese", voice_clone_prompt=prompt,
            non_streaming_mode=True, max_new_tokens=200, temperature=.52, top_p=.87)
        speech = np.asarray(waves[0], dtype=np.float32)
        if speech.ndim != 1 or len(speech) < .32*rate or not np.isfinite(speech).all() or np.max(np.abs(speech)) < .014:
            raise RuntimeError("Invalid narration take " + row["id"])
        temporary = out.with_suffix(".tmp.wav")
        sf.write(temporary, speech, rate, subtype="PCM_16")
        os.replace(temporary, out)
        print(row["id"], round(len(speech)/rate, 2), flush=True)


if __name__ == "__main__":
    here = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reference", type=Path, required=True, help="the isolated original narration WAV on its 90s timeline")
    parser.add_argument("--plan", type=Path, default=here/"story.json")
    parser.add_argument("--voice-dir", type=Path, default=here/"voice")
    parser.add_argument("--model", help="model directory or model identifier")
    parser.add_argument("--only", nargs="+")
    parser.add_argument("--seed", type=int)
    render(parser.parse_args())
