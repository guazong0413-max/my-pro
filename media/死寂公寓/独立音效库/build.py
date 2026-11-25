"""Render individual WAVs and a chaptered, loudness-matched A/B listening reel."""
import argparse
from hashlib import sha256
import json
import os
from pathlib import Path
import subprocess
import tempfile
import urllib.request

import numpy as np
import soundfile as sf

from synth import RATE, render


HERE = Path(__file__).resolve().parent
A_DIR = "A-制作音效"
B_DIR = "B-实录对照"
REEL = "七组音效-制作与实录对听.mp3"


def checked_cache(ref, key, cache):
    path = cache / (key + ".mp3")
    if path.exists() and sha256(path.read_bytes()).hexdigest() == ref["sha256"]:
        return path
    request = urllib.request.Request(ref["preview"], headers={"User-Agent": "ApartmentSoundLibrary/1.0"})
    with urllib.request.urlopen(request, timeout=90) as response:
        data = response.read()
    if sha256(data).hexdigest() != ref["sha256"]:
        raise ValueError(f"Public preview changed for {key}: {ref['page']}")
    path.write_bytes(data)
    return path


def excerpt(audio, at, seconds):
    start = round(at*RATE)
    length = round(seconds*RATE)
    take = audio[start:start+length].copy()
    if len(take) != length:
        raise ValueError(f"Excerpt beyond recording at {at:.2f}s")
    return take


def softened_edges(audio, seconds):
    n = min(round(seconds*RATE), len(audio)//2)
    window = np.sin(np.linspace(0, np.pi/2, n))[:,None]**2
    audio[:n] *= window
    audio[-n:] *= window[::-1]
    return audio


def get_recording(song, ffmpeg, cache):
    ref = song["reference"]
    path = checked_cache(ref,song["id"],cache)
    cmd = [ffmpeg,"-nostdin","-v","error","-i",str(path),"-ss",str(ref["from"]),
           "-t",str(song["seconds"]),"-ar",str(RATE),"-ac","2","-f","f32le","pipe:1"]
    raw = subprocess.check_output(cmd)
    audio = np.frombuffer(raw,dtype="<f4").reshape(-1,2).copy()
    if len(audio) != round(song["seconds"]*RATE):
        raise ValueError(f"Reference duration differs for {song['id']}")
    return softened_edges(audio,.015)


def measure(audio, ffmpeg):
    cmd = [ffmpeg,"-nostdin","-hide_banner","-f","f32le","-ar",str(RATE),"-ac","2",
           "-i","pipe:0","-af","loudnorm=print_format=json","-f","null","-"]
    p = subprocess.run(cmd,input=np.asarray(audio,dtype="<f4").tobytes(),capture_output=True,check=True)
    log = p.stderr.decode("utf-8",errors="replace")
    info = json.loads(log[log.rindex("{"):log.rindex("}")+1])
    return float(info["input_i"]), float(info["input_tp"])


def match_pair(a, b, target, ffmpeg):
    stats = [measure(x,ffmpeg) for x in (a,b)]
    if not np.all(np.isfinite(stats)):
        raise ValueError("Silent or unmeasurable clip")
    # Identical target per pair, with at least 2.5 dB of true-peak headroom on each.
    common = min(target, *(lufs-peak-2.5 for lufs,peak in stats))
    return [x*10**((common-lufs)/20) for x,(lufs,peak) in zip((a,b),stats)]


def write_reel(audio, songs, output, ffmpeg):
    # ID3 chapters let compatible players jump straight to a new sound.
    metadata = [";FFMETADATA1", "title=七组音效 · 制作与实录对听", "artist=死寂公寓"]
    credits = []
    for song in songs:
        ref = song["reference"]
        credits.append(f"{ref['title']} by {ref['author']} ({ref['page']}, {ref['license_url']})")
    article = "Field recordings, excerpted and level-adjusted. " + " / ".join(credits)
    escaped = str.maketrans({c:"\\"+c for c in "\\#;="})
    metadata.append("comment="+article.translate(escaped))
    for i, song in enumerate(songs):
        start = song["audition"]["a_at"]
        end = songs[i+1]["audition"]["a_at"] if i+1 < len(songs) else len(audio)/RATE
        metadata.extend(["[CHAPTER]","TIMEBASE=1/1000",f"START={round(1000*start)}",
                         f"END={round(1000*end)}","title="+song["name"].split("-",1)[1]])
    with tempfile.TemporaryDirectory() as temp:
        meta = Path(temp)/"chapters.txt"
        meta.write_text("\n".join(metadata)+"\n",encoding="utf-8")
        cmd = [ffmpeg,"-nostdin","-v","error","-y","-f","f32le","-ar",str(RATE),"-ac","2","-i","pipe:0",
               "-f","ffmetadata","-i",str(meta),"-map","0:a","-map_metadata","1","-map_chapters","1",
               "-c:a","libmp3lame","-b:a","192k","-id3v2_version","3",str(output)]
        subprocess.run(cmd,input=np.asarray(audio,dtype="<f4").tobytes(),check=True)


def render_files(songs, ffmpeg, cache, dest):
    for name in (A_DIR,B_DIR):
        (dest/name).mkdir(parents=True,exist_ok=True)
    last = songs[-1]["audition"]
    reel = np.zeros((round((last["b_at"]+last["seconds"]+.5)*RATE),2),np.float32)
    for song in songs:
        original = render(song["id"],song["seconds"])
        ref = get_recording(song,ffmpeg,cache)
        a,b = match_pair(original,ref,song["lufs"],ffmpeg)
        filename = song["name"]+".wav"
        sf.write(dest/A_DIR/filename,a,RATE,subtype="PCM_24")
        source = song["reference"]
        with sf.SoundFile(dest/B_DIR/filename, "w", RATE, 2, subtype="PCM_24") as wav:
            wav.title = source["title"]
            wav.artist = source["author"]
            wav.copyright = source["license"]+" "+source["license_url"]
            wav.comment = "Excerpted and level-adjusted from "+source["page"]
            wav.write(b)
        cue = song["audition"]
        cuts = [softened_edges(excerpt(wave,cue[at],cue["seconds"]),.045)
                for wave,at in [(a,"a_from"),(b,"b_from")]]
        for cut,where in zip(match_pair(*cuts,song["lufs"],ffmpeg),("a_at","b_at")):
            start = round(cue[where]*RATE)
            reel[start:start+len(cut)] = cut
        print(song["name"], flush=True)
    write_reel(reel,songs,dest/REEL,ffmpeg)


def build(ffmpeg, cache, dest):
    songs = json.loads((HERE/"sounds.json").read_text(encoding="utf-8"))["sounds"]
    cache.mkdir(parents=True,exist_ok=True)
    dest.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".sfx-",dir=dest) as temp:
        staging = Path(temp)
        render_files(songs,ffmpeg,cache,staging)
        for name in (A_DIR,B_DIR):
            (dest/name).mkdir(exist_ok=True)
            for song in songs:
                path = Path(name)/(song["name"]+".wav")
                os.replace(staging/path,dest/path)
        os.replace(staging/REEL,dest/REEL)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffmpeg",default=os.getenv("FFMPEG","ffmpeg"))
    parser.add_argument("--cache",type=Path,default=Path(tempfile.gettempdir())/"my-pro-sfx-references")
    parser.add_argument("--out",type=Path,default=HERE)
    args = parser.parse_args()
    build(args.ffmpeg,args.cache,args.out)
