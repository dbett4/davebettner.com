"""Rebuild the part mattes in art/mattes/ from the approved artwork.

Head, right forearm, left hand and dog: BiRefNet (rembg "birefnet-general")
segments each crop. The ear: the traced outline in geometry.EAR_OUTLINE, because
a segmenter cannot separate an ear from the dog it belongs to. Every edge is then
refined with closed-form matting on a thin unknown band, so fur and hair wisps
get real partial alpha and travel with the part.

The committed PNGs are the renderer's inputs; run this only if the artwork
changes. `--out DIR` writes elsewhere, for example to check reproducibility.
"""
import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from pymatting import estimate_alpha_cf

import geometry

HERE = Path(__file__).resolve().parent
ART = HERE / 'art'


def refine(rgb, coarse, fg_erode, bg_erode):
    """Closed-form matting on the band between a confident core and background."""
    fg = cv2.erode((coarse > .97).astype(np.uint8), np.ones((fg_erode, fg_erode), np.uint8)) > 0
    bg = cv2.erode((coarse < .03).astype(np.uint8), np.ones((bg_erode, bg_erode), np.uint8)) > 0
    trimap = np.full(coarse.shape, .5)
    trimap[fg], trimap[bg] = 1, 0
    return np.clip(estimate_alpha_cf(rgb, trimap), 0, 1), int((trimap == .5).sum())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=str(ART / 'mattes'))
    out = Path(ap.parse_args().out)
    out.mkdir(parents=True, exist_ok=True)
    src = Image.open(ART / 'source.png').convert('RGB')
    rgb = np.asarray(src, np.float64) / 255
    from rembg import new_session, remove   # heavy import, only needed here
    session = new_session('birefnet-general')
    for name in ('head', 'rarm', 'lhand', 'dog'):
        x0, y0, x1, y1 = geometry.CROPS[name]
        coarse = np.asarray(remove(src.crop((x0, y0, x1, y1)), session=session, only_mask=True), np.float64) / 255
        alpha, band = refine(rgb[y0:y1, x0:x1], coarse, 3, 9)
        Image.fromarray((alpha * 255 + .5).astype(np.uint8)).save(out / f'{name}.png')
        print(name, 'refined', band, 'edge pixels')
    x0, y0, x1, y1 = geometry.CROPS['ear']
    traced = np.zeros(rgb.shape[:2], np.uint8)
    cv2.fillPoly(traced, [np.array(geometry.EAR_OUTLINE, np.int32)], 1)
    # The outline is drawn on the edge: 2 px inside is ear, 3 px outside is not.
    coarse = np.full(traced.shape, .5)
    coarse[cv2.erode(traced, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))) > 0] = 1
    coarse[cv2.dilate(traced, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))) == 0] = 0
    alpha, band = refine(rgb[y0:y1, x0:x1], coarse[y0:y1, x0:x1], 1, 1)
    Image.fromarray((alpha * 255 + .5).astype(np.uint8)).save(out / 'ear.png')
    print('ear refined', band, 'edge pixels')


if __name__ == '__main__':
    main()
