"""Build the shareable, self-contained edition of the canvas animation."""
import base64
import json
import re
import subprocess
from pathlib import Path


root = Path(__file__).resolve().parents[1]
assets = root / 'art'
markup = (root / 'index.html').read_text()


def url(mime, data):
    return 'data:' + mime + ';base64,' + base64.b64encode(data).decode('ascii')


def encode(name):
    face = name == 'postman'
    settings = ['-vf', 'scale=848:-1:flags=lanczos', '-c:v', 'png'] if face else [
        '-c:v', 'mjpeg', '-pix_fmt', 'yuvj444p', '-q:v', '2']
    out = subprocess.check_output(['ffmpeg', '-hide_banner', '-loglevel', 'error',
                                   '-i', str(assets / (name + '.png')), '-frames:v', '1',
                                   *settings, '-f', 'image2pipe', 'pipe:1'])
    return url('image/png' if face else 'image/jpeg', out)


pictures = {key: encode(key) for key in ('riviera', 'canal', 'canyon', 'polar', 'postman')}
library = '<script>window.ATLAS_IMAGES=' + json.dumps(pictures, separators=(',', ':')) + ';</script>\n'
markup = markup.replace('<script src="paint.js">', library + '<script src="paint.js">')
markup = markup.replace('src="art/ride.m4a"', 'src="' + url('audio/mp4', (assets/'ride.m4a').read_bytes()) + '"')
markup = re.sub(r'<script src="([a-z]+\.js)"></script>',
                lambda m: '<script>\n'+(root/m[1]).read_text()+'\n</script>', markup)
destination = root / '风里的邮差.html'
destination.write_text(markup)
print(destination.name, destination.stat().st_size, 'bytes')
