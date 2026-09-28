"""Decode the committed loop the way a browser does (BT.709) and write review sheets.

  python review.py OUT_DIR

Writes a contact sheet of the whole frame every second and zoomed strips of each
gesture (head turn, mouse, typing, dog head, ear flick, blink, tail), plus a
loop-seam report comparing the last frame with the first.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
VIDEO = HERE.parent.parent / 'public/video/workstation-loop.mp4'
SIZE, FPS = 1254, 30
STRIPS = {  # name: (crop box, start s, end s, step s, zoom)
    'head-turn': ((432, 292, 552, 425), 2.2, 3.1, .1, 2.2),
    'mouse': ((640, 440, 790, 570), .4, 2.4, 1 / 6, 2.0),
    'typing': ((528, 418, 600, 468), 2.95, 3.35, 1 / 30, 4.0),
    'dog-head': ((860, 770, 1010, 890), 5.0, 5.7, .1, 2.4),
    'ear-flick': ((860, 780, 930, 870), 3.53, 3.93, 1 / 30, 3.0),
    'blink': ((915, 800, 990, 845), 6.15, 6.45, 1 / 30, 5.0),
    'tail': ((755, 770, 835, 845), 6.35, 7.55, .1, 2.6),
    'screens': ((470, 200, 965, 450), 2.5, 8.5, 1.0, 1.0),
}


def decode():
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(VIDEO), '-vf',
                          'scale=in_color_matrix=bt709:in_range=tv:out_range=full:flags=accurate_rnd+full_chroma_int',
                          '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, SIZE, SIZE, 3)


def sheet(tiles, cols):
    w, h = tiles[0].size
    out = Image.new('RGB', (w * cols, h * ((len(tiles) + cols - 1) // cols)), 'white')
    for i, t in enumerate(tiles):
        out.paste(t, ((i % cols) * w, (i // cols) * h))
    return out


def main():
    out = Path(sys.argv[1] if len(sys.argv) > 1 else 'workstation-loop-review')
    out.mkdir(parents=True, exist_ok=True)
    frames = decode()
    label = lambda im, t: (ImageDraw.Draw(im).text((4, 4), f'{t:.2f}s', fill=(200, 0, 0)), im)[1]
    whole = [label(Image.fromarray(frames[i * FPS]).resize((418, 418), Image.LANCZOS), i) for i in range(10)]
    sheet(whole, 5).save(out / 'contact-sheet.png')
    for name, (box, t0, t1, step, zoom) in STRIPS.items():
        tiles, t = [], t0
        while t <= t1 + 1e-6:
            im = Image.fromarray(frames[int(round(t * FPS)) % len(frames)]).crop(box)
            tiles.append(label(im.resize((int(im.width * zoom), int(im.height * zoom)), Image.LANCZOS), t))
            t += step
        sheet(tiles, min(len(tiles), 6)).save(out / f'strip-{name}.png')
    f = frames.astype(np.int16)
    steps = [int((np.abs(f[(i + 1) % len(f)] - f[i]).max(2) > 12).sum()) for i in range(len(f))]
    report = {'frames': len(f), 'seamChangedPixels': steps[-1], 'medianStepChangedPixels': int(np.median(steps)),
              'p95StepChangedPixels': int(np.percentile(steps, 95))}
    (out / 'seam.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
