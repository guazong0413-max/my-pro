"""Make the film's fixed print grain and its four typeset title outlines."""
import argparse
from pathlib import Path
import numpy as np
from PIL import Image
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.varLib.instancer import instantiateVariableFont

root=Path(__file__).resolve().parents[1]/"public"
root.mkdir(parents=True,exist_ok=True)
parser=argparse.ArgumentParser()
parser.add_argument("--font",default="C:/Windows/Fonts/Noto Sans SC Bold (TrueType).otf")
args=parser.parse_args()
rng=np.random.default_rng(74073)
v=rng.normal(0,1,(320,320))
img=np.zeros((320,320,4),np.uint8)
img[:,:,:3]=np.where(v[:,:,None]>0,[253,241,203],[56,57,54])
img[:,:,3]=np.minimum(23,np.abs(v)*9).astype(np.uint8)
Image.fromarray(img).save(root/"grain.png",optimize=True)
font=TTFont(args.font)
if "fvar" in font:
    font=instantiateVariableFont(font,{"wght":770},inplace=False)
glyphs=font.getGlyphSet()
cmap=font.getBestCmap()
unit=font["head"].unitsPerEm
paths=[]
for i,c in enumerate("纸鸟逆风"):
    p=SVGPathPen(glyphs)
    glyphs[cmap[ord(c)]].draw(p)
    paths.append('<path transform="translate(%g 90) scale(%g %g)" d="%s"/>' % (i*90+3,86/unit,-86/unit,p.getCommands()))
title='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 376 126"><g fill="#2d5351">'+''.join(paths)+'</g><path d="M6 109q54-4 107-1t46-.5l-2 2q-94 4-151 2Z" fill="#ba634c"/><path d="M166 108l10-1-4 3-8 1Z" fill="#ba634c"/></svg>'
(root/"title.svg").write_text(title,encoding="utf-8")
