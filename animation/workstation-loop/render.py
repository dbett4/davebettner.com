"""Render the davebettner.com workstation loop from the approved still.

The approved artwork stays the only source of pixels for Dave, the dog and the
room. Moving parts are separated with soft mattes, articulated with linear-blend
skinning around real joints (neck, elbow, wrist, ear and tail roots), and
composited over a plate whose hidden areas are inpainted. Monitor interfaces are
drawn fresh for every frame and projected into the registered glass.

Usage (from this directory, with requirements.txt installed and ffmpeg on PATH):
  python render.py                              # render the loop, posters and manifest
  python render.py --stills 0,1.2,5.8 --out-dir /tmp/stills   # individual frames
"""
import argparse
import hashlib
import json
import math
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from pymatting import estimate_foreground_ml

import geometry
import screens
import timeline as tl

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
ART = HERE / 'art'
VIDEO = ROOT / 'public/video/workstation-loop.mp4'
POSTER = ROOT / 'public/images/workstation-loop-poster.webp'
POSTER_SMALL = ROOT / 'public/images/workstation-loop-poster-760.webp'
MANIFEST = HERE / 'render.json'
SIZE = 1254
BG = np.array([230, 235, 240], np.float32)

# Registered monitor glass (pixel-centre coordinates in the 1254 px artwork).
QUADS = json.loads((ART / 'screen-quads.json').read_text())


# ------------------------------------------------------------------ helpers
def load_rgb(path):
    return np.asarray(Image.open(path).convert('RGB'), np.float32)


def load_matte(name):
    """Place a crop-sized matte into a full-canvas alpha map (0..1)."""
    m = np.asarray(Image.open(ART / 'mattes' / f'{name}.png').convert('L'), np.float32) / 255
    full = np.zeros((SIZE, SIZE), np.float32)
    x0, y0, x1, y1 = geometry.CROPS[name]
    full[y0:y1, x0:x1] = m
    return full


def poly_mask(points, blur=0.0):
    m = np.zeros((SIZE, SIZE), np.float32)
    cv2.fillPoly(m, [np.round(np.array(points) * 16).astype(np.int32)], 1.0, lineType=cv2.LINE_AA, shift=4)
    if blur:
        m = cv2.GaussianBlur(m, (0, 0), blur)
    return np.clip(m, 0, 1)


def ellipse_mask(cx, cy, rx, ry, blur=0.0):
    m = np.zeros((SIZE, SIZE), np.float32)
    cv2.ellipse(m, (int(cx * 16), int(cy * 16)), (int(rx * 16), int(ry * 16)), 0, 0, 360, 1.0, -1, cv2.LINE_AA, 4)
    if blur:
        m = cv2.GaussianBlur(m, (0, 0), blur)
    return np.clip(m, 0, 1)


def chain_weight(points, values, sigma=3.0):
    """Weight that varies along a polyline (joint chain), by nearest-segment projection."""
    ys, xs = np.mgrid[0:SIZE, 0:SIZE].astype(np.float32)
    best = np.full((SIZE, SIZE), np.inf, np.float32)
    out = np.zeros((SIZE, SIZE), np.float32)
    for (a, va), (b, vb) in zip(zip(points, values), zip(points[1:], values[1:])):
        a, b = np.array(a, np.float32), np.array(b, np.float32)
        ab = b - a
        u = np.clip(((xs - a[0]) * ab[0] + (ys - a[1]) * ab[1]) / float(ab @ ab), 0, 1)
        px, py = a[0] + u * ab[0], a[1] + u * ab[1]
        dist = (xs - px) ** 2 + (ys - py) ** 2
        take = dist < best
        best[take] = dist[take]
        out[take] = (va + (vb - va) * u)[take]
    return cv2.GaussianBlur(out, (0, 0), sigma) if sigma else out


def smoothstep(e0, e1, x):
    u = np.clip((x - e0) / (e1 - e0), 0, 1)
    return u * u * (3 - 2 * u)


def harmonic_fill(img, unknown, known, iters=1500):
    """Fill `unknown` pixels with the smooth (harmonic) interpolation of `known` ones.

    Pixels in neither set are ignored, so they neither feed the fill nor pin it.
    Jacobi relaxation from a normalised-convolution start; seamless at the border.
    """
    out = img.astype(np.float32).copy()
    kn = known.astype(np.float32)
    den = cv2.GaussianBlur(kn, (0, 0), 8)
    start = cv2.GaussianBlur(out * kn[..., None], (0, 0), 8) / np.maximum(den, 1e-6)[..., None]
    out[unknown] = start[unknown]
    valid = (known | unknown).astype(np.float32)
    cross = np.array([[0, 1, 0], [1, 0, 1], [0, 1, 0]], np.float32)
    count = np.maximum(cv2.filter2D(valid, -1, cross, borderType=cv2.BORDER_CONSTANT), 1)[..., None]
    for _ in range(iters):
        avg = cv2.filter2D(out * valid[..., None], -1, cross, borderType=cv2.BORDER_CONSTANT) / count
        out[unknown] = avg[unknown]
    return out


def split_edge(src, alpha, box):
    """Foreground and background colours under a matte's soft edge.

    Multilevel foreground estimation solves image = a * F + (1 - a) * B; B keeps
    the real texture seen through fur and hair, F keeps only the fur or hair.
    """
    x0, y0, x1, y1 = box
    f, b = estimate_foreground_ml(src[y0:y1, x0:x1].astype(np.float64) / 255, alpha[y0:y1, x0:x1].astype(np.float64),
                                  return_background=True)
    return (np.clip(f, 0, 1) * 255).astype(np.float32), (np.clip(b, 0, 1) * 255).astype(np.float32)


def rot(deg):
    a = math.radians(deg)
    return np.array([[math.cos(a), -math.sin(a)], [math.sin(a), math.cos(a)]], np.float32)


class Bone:
    """Affine bone: p -> pivot + S R (p - pivot) + t, optionally after a parent."""

    def __init__(self, pivot, parent=None):
        self.pivot = np.array(pivot, np.float32)
        self.parent = parent
        self.set()

    def set(self, deg=0.0, t=(0.0, 0.0), scale=(1.0, 1.0)):
        self.m = rot(deg) @ np.diag(np.array(scale, np.float32))
        self.t = np.array(t, np.float32)

    def apply(self, x, y):
        dx, dy = x - self.pivot[0], y - self.pivot[1]
        nx = self.pivot[0] + self.m[0, 0] * dx + self.m[0, 1] * dy + self.t[0]
        ny = self.pivot[1] + self.m[1, 0] * dx + self.m[1, 1] * dy + self.t[1]
        if self.parent is not None:
            return self.parent.apply(nx, ny)
        return nx, ny


class Layer:
    """A skinned, soft-edged cut-out of the artwork."""

    def __init__(self, name, alpha, weights, src, margin=14):
        self.name = name
        self.bones = list(weights)
        ys, xs = np.nonzero(alpha > .004)
        x0, x1 = max(xs.min() - margin, 0), min(xs.max() + margin + 1, SIZE)
        y0, y1 = max(ys.min() - margin, 0), min(ys.max() + margin + 1, SIZE)
        self.box = tuple(int(v) for v in (x0, y0, x1, y1))
        x0, y0, x1, y1 = self.box
        self.alpha = alpha[y0:y1, x0:x1].copy()
        self.premul = src[y0:y1, x0:x1] * self.alpha[..., None]
        self.orig = src[y0:y1, x0:x1]
        self.weights = {b: w[y0:y1, x0:x1].astype(np.float32).copy() for b, w in weights.items()}
        self.stacked = False   # True: sits on an earlier layer that stays opaque beneath it

    def warp(self, bones, rgba_override=None, iterations=4):
        """Backward map: solve f(p) = x with fixed-point iterations on the skinning field."""
        x0, y0, x1, y1 = self.box
        h, w = y1 - y0, x1 - x0
        gy, gx = np.mgrid[0:h, 0:w].astype(np.float32)
        X, Y = gx + x0, gy + y0
        px, py = X.copy(), Y.copy()
        for _ in range(iterations):
            dx = np.zeros_like(px)
            dy = np.zeros_like(py)
            mx, my = (px - x0).astype(np.float32), (py - y0).astype(np.float32)
            for name in self.bones:
                wmap = cv2.remap(self.weights[name], mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
                tx, ty = bones[name].apply(px, py)
                dx += wmap * (tx - px)
                dy += wmap * (ty - py)
            px, py = X - dx, Y - dy
        mx, my = (px - x0).astype(np.float32), (py - y0).astype(np.float32)
        premul, alpha = (self.premul, self.alpha) if rgba_override is None else rgba_override
        rgb = cv2.remap(premul, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        a = cv2.remap(alpha, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        a = np.clip(a, 0, 1)
        rgb = np.clip(rgb, 0, 255 * a[..., None] + 1e-3)
        return rgb, a

    def composite(self, canvas, bones, rgba_override=None):
        x0, y0, x1, y1 = self.box
        rgb, a = self.warp(bones, rgba_override)
        region = canvas[y0:y1, x0:x1]
        canvas[y0:y1, x0:x1] = rgb + region * (1 - a[..., None])


# ------------------------------------------------------------------ rig
class Rig:
    def __init__(self):
        src = load_rgb(ART / 'source.png')
        assert src.shape[:2] == (SIZE, SIZE), src.shape
        self.src = src
        self.layers = []
        self.bones = {}

        # --- Dave's head: pivots at the base of the neck; the collar stays put.
        head_a = load_matte('head')
        ys = np.mgrid[0:SIZE, 0:SIZE][0].astype(np.float32)
        w_head = (1 - smoothstep(398, 417, ys)) * poly_mask([(420, 280), (560, 280), (560, 430), (420, 430)])
        self.bones['head'] = Bone((503, 415))
        self.head = Layer('head', head_a, {'head': w_head}, src)

        # --- Right forearm, hand and mouse: shoulder fixed, elbow partly, hand fully.
        arm_a = load_matte('rarm')
        # The mouse and its contact shadow travel with the hand.
        mouse = ellipse_mask(751.5, 489, 17.5, 16, blur=2.0)
        arm_region = poly_mask([(610, 492), (640, 478), (700, 470), (712, 455), (774, 452), (778, 514),
                                (724, 532), (694, 562), (660, 588), (630, 574), (606, 540)])
        arm_a = np.maximum(arm_a, mouse) * arm_region
        # Contact shadows of the forearm, hand and mouse on the plain desk top
        # (never the keyboard or the desk's front edge) travel with the arm.
        ys, xs = np.mgrid[0:SIZE, 0:SIZE].astype(np.float32)
        keyboard = (xs < 713) & (ys < 506)
        desk_top = ys < 535.5 + 0.292 * (xs - 722) - 1.5
        reach = cv2.dilate((arm_a > .3).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (27, 27))) > 0
        self.shadow_region = reach & desk_top & ~keyboard
        chain = [(612, 498), (656, 558), (712, 502), (742, 484)]
        w_lat = chain_weight(chain, [0, 0, .85, 1], sigma=2.5) * arm_region
        w_fwd = chain_weight(chain, [0, .12, .9, 1], sigma=2.5) * arm_region
        w_lat = np.maximum(w_lat, mouse)
        w_fwd = np.maximum(w_fwd, mouse)
        self.bones['arm_lat'] = Bone((656, 558))
        self.bones['arm_fwd'] = Bone((656, 558))
        self.arm = Layer('arm', arm_a, {'arm_lat': w_lat, 'arm_fwd': w_fwd}, src)

        # --- Left hand: pivots from a planted wrist tucked behind the shoulder, so
        # the fingers can tap keys and reach between keyboard positions.
        lh_a = load_matte('lhand')
        hand_region = poly_mask([(534, 441), (546, 429), (562, 426), (578, 430), (590, 441), (593, 453),
                                 (586, 461), (570, 461), (556, 455), (540, 452)], blur=.8)
        lh_a = lh_a * hand_region
        xs = np.mgrid[0:SIZE, 0:SIZE][1].astype(np.float32)
        w_tap = smoothstep(550, 574, xs) * hand_region
        self.bones['tap'] = Bone((550, 448))
        self.lhand = Layer('lhand', lh_a, {'tap': w_tap}, src)

        # --- Dog: head on the neck, tail on the rump, breathing ribs. The ear is a
        # layer of its own, so it can flick over the cheek without dragging the fur.
        dog_a = load_matte('dog')
        head_poly = [(866, 806), (878, 790), (900, 780), (930, 777), (960, 782), (984, 796), (996, 818),
                     (996, 842), (986, 862), (966, 874), (940, 874), (912, 868), (888, 866), (872, 856), (864, 836)]
        tail_poly = [(764, 832), (762, 814), (767, 797), (779, 785), (796, 778), (812, 780), (826, 790),
                     (827, 801), (816, 808), (805, 803), (796, 803), (790, 810), (788, 822), (786, 834), (774, 838)]
        # Every dog pixel belongs to its nearest part, so a part's whole silhouette
        # (fur tips included) moves together; weights blend across the neck and,
        # widely enough that the wag shears rather than folds, the tail root.
        seeds = {'head': poly_mask(head_poly) > .5, 'tail': poly_mask(tail_poly) > .5}
        grown = cv2.dilate((seeds['head'] | seeds['tail']).astype(np.uint8), np.ones((7, 7), np.uint8))
        seeds['body'] = (dog_a > .5) & (grown == 0)
        dist = {k: cv2.distanceTransform((~v).astype(np.uint8), cv2.DIST_L2, 5) for k, v in seeds.items()}
        order = list(dist)
        label = np.argmin(np.stack([dist[k] for k in order]), axis=0)
        onehot = {k: (label == i).astype(np.float32) for i, k in enumerate(order)}
        w_dhead = cv2.GaussianBlur(onehot['head'], (0, 0), 4.5)
        w_tail = cv2.GaussianBlur(onehot['tail'], (0, 0), 4.0)
        w_ribs = ellipse_mask(842, 862, 62, 40, blur=12) * (1 - w_dhead) * (1 - w_tail)
        self.bones['dog_head'] = Bone((916, 870))
        self.bones['dog_ear'] = Bone((905, 802), parent=self.bones['dog_head'])
        self.bones['dog_tail'] = Bone((779, 830))
        self.bones['dog_ribs'] = Bone((842, 900))
        # Under the ear the dog layer shows cheek and neck fur, continued smoothly
        # from around the ear, so a flick reveals fur rather than a copy of the ear.
        # The fur there is smooth, so a harmonic fill from the surrounding fur is
        # used: texture-copying fills left specks along the old edge, and Telea
        # streaked a small dark mark on the cheek across the gap. Rug pixels and
        # isolated dark marks are not used as fill data.
        ear_a = load_matte('ear')
        x0, y0, x1, y1 = geometry.CROPS['ear']
        pad = 24
        box = (x0 - pad, y0 - pad, x1 + pad, y1 + pad)
        under = cv2.dilate((ear_a[box[1]:box[3], box[0]:box[2]] > .004).astype(np.uint8),
                           cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))) > 0
        crop = src[box[1]:box[3], box[0]:box[2]]
        lum = crop @ np.array([.2126, .7152, .0722], np.float32)
        med = cv2.medianBlur(np.clip(lum, 0, 255).astype(np.uint8), 7).astype(np.float32)
        known = ~under & (dog_a[box[1]:box[3], box[0]:box[2]] > .5) & (lum > med - 25)
        fur = harmonic_fill(crop, under, known)
        dog_src = src.copy()
        dog_src[box[1]:box[3], box[0]:box[2]][under] = fur[under]
        self.dog = Layer('dog', dog_a, {'dog_head': w_dhead, 'dog_tail': w_tail, 'dog_ribs': w_ribs}, dog_src)
        self.ear = Layer('ear', ear_a, {'dog_ear': np.ones((SIZE, SIZE), np.float32)}, src)
        self.ear.stacked = True
        self.eye_setup()

        self.layers = [self.head, self.arm, self.lhand, self.dog, self.ear]
        self.plate = self.build_plate()
        # Re-matte the layers, in compositing order, against the rest frame beneath
        # each one: original = premul + (1 - a) * behind. A later, more specific
        # layer owns any pixel it covers (the head matte also caught the top of the
        # left hand). Near moving parts, where the plate differs from the original
        # (rims, contact shading), alpha is raised to the minimum that keeps the
        # layer's colour inside 0..255: the rest frame then reproduces the artwork
        # exactly and the rim travels with its part. Glass is repainted every
        # frame, so no rim is claimed there.
        glass = self.glass_mask(dilate=1)
        rest = self.plate.copy()
        alphas = [self.full_alpha(layer) for layer in self.layers]
        ring = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
        for k, layer in enumerate(self.layers):
            x0, y0, x1, y1 = layer.box
            later = 0
            above = [alphas[j] for j in range(k + 1, len(self.layers)) if not self.layers[j].stacked]
            if above:
                foot = cv2.dilate((np.max(above, axis=0) > .004).astype(np.uint8), np.ones((5, 5), np.uint8))
                later = cv2.GaussianBlur(foot.astype(np.float32), (0, 0), 1.0)[y0:y1, x0:x1] * foot[y0:y1, x0:x1]
            layer.alpha = (layer.alpha * (1 - later)).astype(np.float32)
            if layer is self.arm:
                rest[y0:y1, x0:x1] *= self.shade_map[y0:y1, x0:x1]
            behind = rest[y0:y1, x0:x1]
            orig = layer.orig
            # An 8-level tolerance keeps tiny plate mismatches (dark areas make the
            # ratio touchy) from claiming background; those stay within 8 levels.
            tol = 8.0
            need = np.maximum(1 - (orig + tol) / np.maximum(behind, 1e-3),
                              (orig - tol - behind) / np.maximum(255 - behind, 1e-3)).max(2)
            moving = sum(layer.weights.values()) > .01
            owned = cv2.dilate(((layer.alpha > .004) & moving).astype(np.uint8), ring) > 0
            owned &= (glass[y0:y1, x0:x1] == 0) & (np.asarray(later) < .02)
            if layer is self.head:
                owned &= self.head_rim_ok[y0:y1, x0:x1]
            layer.alpha = np.where(owned, np.maximum(layer.alpha, np.clip(need, 0, 1)), layer.alpha).astype(np.float32)
            a = layer.alpha[..., None]
            layer.premul = np.clip(orig - (1 - a) * behind, 0, 255 * a)
            rest[y0:y1, x0:x1] = layer.premul + (1 - a) * behind
        self.breath_field = self.build_breath()
        self.periphery = self.build_periphery()

    # --- plate: what the camera would see where a moving part leaves
    def moving_mask(self, layer, bones, dilate=5):
        x0, y0, x1, y1 = layer.box
        wsum = sum(layer.weights[b] for b in bones)
        m = np.zeros((SIZE, SIZE), np.uint8)
        m[y0:y1, x0:x1] = ((layer.alpha > .02) & (wsum > .02)).astype(np.uint8)
        return cv2.dilate(m, np.ones((dilate, dilate), np.uint8))

    def full_alpha(self, layer):
        x0, y0, x1, y1 = layer.box
        a = np.zeros((SIZE, SIZE), np.float32)
        a[y0:y1, x0:x1] = layer.alpha
        return a

    def build_plate(self):
        """Fill each moving part's footprint with what lies behind it.

        Each fill is computed with its part hidden from the source and applied
        under the part's footprint only where the part moves; everything else
        keeps the artwork. The layers are then re-matted against this plate (see
        __init__), so the resting frame still reproduces the artwork.
        """
        src8 = np.clip(self.src, 0, 255).astype(np.uint8)
        plate = src8.astype(np.float32)

        def apply(fill, layer, bones, lo, hi, trusted=None):
            # Replace the plate under the part's footprint; where the fill is only
            # approximate (trusted is False), keep the artwork under faint fringe.
            moving = self.moving_mask(layer, bones, dilate=3).astype(np.float32)
            alpha = self.full_alpha(layer)
            cover = smoothstep(lo, hi, alpha)
            if trusted is not None:
                cover = np.where(trusted, cover, smoothstep(.2, .45, alpha))
            cover = (moving * cover)[..., None]
            plate[:] = plate * (1 - cover) + fill * cover

        # Right forearm: a smooth fill of the dark desk, with the desk's front edge
        # carried under the forearm. Around the arm the desk is also cleaned of its
        # contact shadow, which becomes a multiplicative layer that moves with it.
        region = self.shadow_region.astype(np.uint8)
        arm_hide = cv2.dilate((self.full_alpha(self.arm) > .01).astype(np.uint8), np.ones((5, 5), np.uint8)) | region
        hand_hide = cv2.dilate((self.full_alpha(self.lhand) > .01).astype(np.uint8), np.ones((5, 5), np.uint8))
        filled = cv2.inpaint(src8, (arm_hide | hand_hide) * 255, 5, cv2.INPAINT_TELEA).astype(np.float32)
        ys, xs = np.mgrid[0:SIZE, 0:SIZE].astype(np.float32)
        top = 535.5 + 0.292 * (xs - 722)
        face = np.clip(ys - top + .5, 0, 1) * np.clip(top + 11.2 - ys + .5, 0, 1)
        face *= np.clip((xs - 640) / 6, 0, 1) * np.clip((728 - xs) / 6, 0, 1)
        filled = filled * (1 - face[..., None]) + np.array([31, 30, 29], np.float32) * face[..., None]
        feather = cv2.GaussianBlur(region.astype(np.float32), (0, 0), 2.5) * region
        cover = np.maximum(smoothstep(0, .1, self.full_alpha(self.arm)), feather)[..., None]
        plate = plate * (1 - cover) + filled * cover
        # Only where the hand actually moves (the wrist stays planted): elsewhere the
        # artwork itself is the plate, so the resting frame needs no re-matting there.
        x0, y0, x1, y1 = self.lhand.box
        tap = np.zeros((SIZE, SIZE), np.float32)
        tap[y0:y1, x0:x1] = self.lhand.weights['tap']
        hand = (smoothstep(0, .1, self.full_alpha(self.lhand)) * smoothstep(0, .05, tap))[..., None]
        plate = plate * (1 - hand) + self.fill_under_left_hand(src8, hand_hide) * hand
        # Exact per-channel ratio of the original to the cleaned desk (1 where
        # nothing was cleaned), stored at half scale so it may also brighten.
        ratio = np.clip(src8.astype(np.float32) / np.maximum(plate, 1), 0, 2)
        arm_cover = np.maximum(smoothstep(0, .1, self.full_alpha(self.arm)), feather)[..., None]
        ratio = np.where(arm_cover > 0, ratio, 1.0).astype(np.float32)
        self.shade_map = ratio
        x0, y0, x1, y1 = self.arm.box
        self.shade = Layer('shade', np.ones((SIZE, SIZE), np.float32) * poly_mask([(x0, y0), (x1, y0), (x1, y1), (x0, y1)]),
                           {k: np.pad(w, ((y0, SIZE - y1), (x0, SIZE - x1))) for k, w in self.arm.weights.items()},
                           ratio * 127.5, margin=0)
        # Dog: rug continues under the dog. Hide the dog and the nearby desk
        # foot from the texture search so only rug is copied into the gap.
        dog_a = self.full_alpha(self.dog)
        dog = cv2.dilate((dog_a > .02).astype(np.uint8), np.ones((7, 7), np.uint8))
        lum = src8[..., 0] * .2126 + src8[..., 1] * .7152 + src8[..., 2] * .0722
        foot = np.zeros((SIZE, SIZE), np.uint8)
        foot[690:808, 780:935] = (lum[690:808, 780:935] < 50) & (dog_a[690:808, 780:935] < .5)
        foot = cv2.dilate(foot, np.ones((7, 7), np.uint8))
        cx0, cy0, cx1, cy1 = 700, 690, 1070, 1040
        unknown = (dog | foot)[cy0:cy1, cx0:cx1]
        out = np.zeros((cy1 - cy0, cx1 - cx0, 3), np.uint8)
        cv2.xphoto.inpaint(src8[cy0:cy1, cx0:cx1].copy(), ((1 - unknown) * 255).astype(np.uint8), out, cv2.xphoto.INPAINT_SHIFTMAP)
        rug = plate.copy()
        rug[cy0:cy1, cx0:cx1] = out
        apply(rug, self.dog, ['dog_head', 'dog_tail'], .03, .2)
        self.use_edge_background(plate, self.dog, ['dog_head', 'dog_tail'])
        # Dave's head: rebuild the room behind it from its known geometry, in a
        # band just beyond the hair as well, because the artwork has a light rim
        # there that belongs to the head. The glass is excluded: it is repainted.
        model, exact, wall = self.room_behind_head()
        # The wall and the uncovered stretch of boom are exact; the bezel and the
        # boom deeper behind the head are close approximations.
        no_glass = self.glass_mask(dilate=3) == 0
        apply(model, self.head, ['head'], 0, .08, trusted=exact & no_glass)
        hx0, hy0, hx1, hy1 = self.head.box
        near = np.zeros((SIZE, SIZE), np.uint8)
        near[hy0:hy1, hx0:hx1] = (self.head.alpha > .02) & (self.head.weights['head'] > .02)
        band = cv2.dilate(near, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))).astype(np.float32)
        # The light rim the artwork draws around the hair only shows on the wall;
        # replace only pixels that are light in both the model and the artwork.
        lum = np.array([.2126, .7152, .0722], np.float32)
        band *= wall & no_glass & ((self.src @ lum) > 200)
        band = cv2.GaussianBlur(band, (0, 0), .8) * band
        plate[:] = plate * (1 - band[..., None]) + model * band[..., None]
        # Hair may claim edge pixels only against a light background (wall, boom
        # highlights): against the dark bars, bezel or desk a darker pixel is as
        # likely a sliver of that object as hair, and would travel with the head.
        self.head_rim_ok = ((plate @ lum) > 150) & exact & no_glass
        return plate

    def fill_under_left_hand(self, src8, hide):
        """The keyboard continues under the typing hand below its far edge; desk above.

        The far edge is the line y = 437.5 + 0.2727 (x - 590), fitted where it is
        visible (x 590..700). Each side is a harmonic fill from its own visible
        pixels only, so the keyboard never bleeds onto the desk or the reverse.
        """
        x0, y0, x1, y1 = 505, 400, 640, 490
        crop = src8[y0:y1, x0:x1].astype(np.float32)
        ys, xs = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        edge = 437.5 + .2727 * (xs - 590)
        # Left of the fingertips the hand's own top edge lies on that line, and the
        # artwork shows desk just beyond it, so desk is kept under its soft edge.
        edge += 4 * (1 - smoothstep(574, 584, xs))
        below = np.clip(ys - edge + .5, 0, 1)
        unknown = hide[y0:y1, x0:x1] > 0
        lum = crop @ np.array([.2126, .7152, .0722], np.float32)
        keys = ~unknown & (below > .99) & (xs >= 588) & (ys <= edge + 26)
        desk = ~unknown & (below < .01) & (lum > 85)
        fill = harmonic_fill(crop, unknown, desk, iters=800) * (1 - below[..., None]) \
            + harmonic_fill(crop, unknown, keys, iters=800) * below[..., None]
        out = src8.astype(np.float32).copy()
        out[y0:y1, x0:x1] = np.where(unknown[..., None], fill, crop)
        return out

    def use_edge_background(self, plate, layer, bones):
        """Under a moving part's soft edge, the plate is the background seen through it.

        Right for fur over the rug. Not for Dave's hair: the artwork draws a light
        rim there that belongs to the hair and must travel with it."""
        x0, y0, x1, y1 = layer.box
        alpha = self.full_alpha(layer)
        _, b = split_edge(self.src, alpha, layer.box)
        a = alpha[y0:y1, x0:x1]
        moving = self.moving_mask(layer, bones, dilate=3)[y0:y1, x0:x1].astype(np.float32)
        w = (moving * (a > .004) * (1 - smoothstep(.55, .9, a)))[..., None]
        plate[y0:y1, x0:x1] = plate[y0:y1, x0:x1] * (1 - w) + b * w

    def glass_mask(self, dilate=0):
        m = np.zeros((SIZE, SIZE), np.uint8)
        for q in QUADS.values():
            cv2.fillPoly(m, [np.round(np.array(q) * 16).astype(np.int32)], 1, cv2.LINE_AA, 4)
        if dilate:
            m = cv2.dilate(m, np.ones((2 * dilate + 1, 2 * dilate + 1), np.uint8))
        return m.astype(np.float32)

    def room_behind_head(self):
        """Wall, desk, monitor bezel and microphone boom behind Dave's head.

        Returns the image, a mask of where it is exact rather than approximate,
        and a mask of the plain wall."""
        ys, xs = np.mgrid[0:SIZE, 0:SIZE].astype(np.float32)
        wall = np.array([229.5, 237.0, 243.0], np.float32)
        desk = np.array([101.0, 101.0, 101.0], np.float32)
        edge = np.interp(xs, [380, 420, 438, 540, 600], [383.5, 380.5, 374.8, 371.0, 369.0])
        below = np.clip(ys - edge + .5, 0, 1)[..., None]
        img = wall * (1 - below) + desk * below
        q = np.array(QUADS['left'], np.float32)
        slope = (q[2, 1] - q[3, 1]) / (q[2, 0] - q[3, 0])
        glass_bottom = q[3, 1] + (xs - q[3, 0]) * slope
        bezel = np.array([16.0, 17.0, 18.0], np.float32)
        inside_x = np.clip(xs - 475.0, 0, 1) * np.clip(q[2, 0] + 6 - xs, 0, 1)
        above_bottom = np.clip(glass_bottom + 8.5 - ys, 0, 1)
        below_top = np.clip(ys - (q[0, 1] - 8), 0, 1)
        monitor = (inside_x * above_bottom * below_top)[..., None]
        img = img * (1 - monitor) + bezel * monitor
        highlight = np.exp(-((xs - 474.3) / .6) ** 2) * above_bottom * below_top * np.clip((475.5 - xs) * 2, 0, 1)
        img = img + (254 - img) * highlight[..., None] * .8
        glass = np.zeros((SIZE, SIZE), np.float32)
        cv2.fillPoly(glass, [np.round(q * 16).astype(np.int32)], 1.0, cv2.LINE_AA, 4)
        img = img * (1 - glass[..., None]) + np.array([214, 222, 218], np.float32) * glass[..., None]
        boom = np.zeros((SIZE, SIZE), np.uint8)
        cv2.line(boom, (420 * 16, int(336.8 * 16)), (545 * 16, int(351.5 * 16)), 255, 7, cv2.LINE_AA, 4)
        cv2.line(boom, (420 * 16, int(346.8 * 16)), (545 * 16, int(353.0 * 16)), 255, 5, cv2.LINE_AA, 4)
        b = (boom.astype(np.float32) / 255)[..., None]
        img = img * (1 - b) + np.array([15.0, 15.0, 16.0], np.float32) * b
        # Where the turning head uncovers the boom, continue the real boom: its
        # bars run straight at 0.17 px per px (fitted on x 400..436), and column
        # 430 is clear of hair on every boom row.
        x0, x1, y0, y1 = 431, 472, 322, 366
        gy, gx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        img[y0:y1, x0:x1] = cv2.remap(self.src, np.full_like(gx, 430.0), gy - .17 * (gx - 430), cv2.INTER_LINEAR)
        wall = (img @ np.array([.2126, .7152, .0722], np.float32)) > 200
        wall[y0:y1, x0:x1] = False
        exact = wall.copy()
        exact[y0:y1, x0:x1] = True
        return img, exact, wall

    def build_breath(self):
        """Shoulders and head rise slightly with each breath; hands stay planted."""
        body = poly_mask([(392, 470), (420, 425), (470, 412), (530, 410), (585, 425), (626, 470),
                          (640, 505), (600, 520), (450, 520), (395, 505)], blur=9)
        ys = np.mgrid[0:SIZE, 0:SIZE][0].astype(np.float32)
        body *= 1 - smoothstep(470, 515, ys)
        head = poly_mask([(436, 300), (540, 300), (545, 420), (430, 420)], blur=6)
        hands = poly_mask([(530, 425), (598, 425), (598, 468), (530, 468)], blur=4)
        field = np.clip(np.maximum(body, head) * (1 - hands), 0, 1)
        return field

    def build_periphery(self):
        """The approved rug-following fade (peripheral-mask.svg) at 1254 px."""
        k = SIZE / 1000
        m = np.zeros((SIZE, SIZE), np.float32)
        a = np.zeros((SIZE, SIZE), np.float32)
        cv2.fillPoly(a, [np.round(np.array([(0, 575), (286, 390), (1000, 576), (685, 962)]) * k * 16).astype(np.int32)], 1.0, cv2.LINE_AA, 4)
        m = np.maximum(m, cv2.GaussianBlur(a, (0, 0), 8 * k))
        b = np.zeros((SIZE, SIZE), np.float32)
        x, y, w, h, r = [v * k for v in (215, 125, 615, 535, 40)]
        cv2.rectangle(b, (int(x + r), int(y)), (int(x + w - r), int(y + h)), 1.0, -1)
        cv2.rectangle(b, (int(x), int(y + r)), (int(x + w), int(y + h - r)), 1.0, -1)
        for cx, cy in [(x + r, y + r), (x + w - r, y + r), (x + r, y + h - r), (x + w - r, y + h - r)]:
            cv2.circle(b, (int(cx), int(cy)), int(r), 1.0, -1, cv2.LINE_AA)
        m = np.maximum(m, cv2.GaussianBlur(b, (0, 0), 24 * k))
        c = np.zeros((SIZE, SIZE), np.float32)
        cv2.fillPoly(c, [np.round(np.array([(232, 145), (808, 145), (808, 652), (225, 652)]) * k * 16).astype(np.int32)], 1.0, cv2.LINE_AA, 4)
        cv2.ellipse(c, (int(711 * k), int(718 * k)), (int(124 * k), int(103 * k)), 0, 0, 360, 1.0, -1, cv2.LINE_AA)
        cv2.fillPoly(c, [np.round(np.array([(622, 631), (783, 631), (829, 816), (686, 816), (595, 738)]) * k * 16).astype(np.int32)], 1.0, cv2.LINE_AA, 4)
        return np.clip(np.maximum(m, c), 0, 1)

    # --- dog eyes
    def eye_setup(self):
        def rim(cx, cy, rx, ry, tilt, k):
            """Median colour of the dark skin just outside the eye opening."""
            t = math.radians(tilt)
            samples = []
            for ang in range(0, 360, 10):
                a = math.radians(ang)
                u, v = k * rx * math.cos(a), k * ry * math.sin(a)
                x, y = cx + u * math.cos(t) - v * math.sin(t), cy + u * math.sin(t) + v * math.cos(t)
                samples.append(self.src[int(round(y)), int(round(x))])
            samples = np.array(samples)
            dark = samples[np.argsort(samples.sum(1))[: len(samples) * 2 // 3]]
            return np.median(dark, axis=0)

        self.eyes = []
        for c, r, tilt, k in [((936.6, 823.4), (6.6, 5.4), -12, 1.3), ((969.6, 815.2), (3.9, 4.6), -20, 1.35)]:
            self.eyes.append(dict(c=c, r=r, tilt=tilt, lid=rim(*c, *r, tilt, k)))

    def blink_rgba(self, closure):
        """Lower the upper lids over both eyes (closure 0..1) in the dog layer's own pixels."""
        if closure <= 0.001:
            return None
        x0, y0, x1, y1 = self.dog.box
        premul = self.dog.premul.copy()
        alpha = self.dog.alpha
        h, w = alpha.shape
        gy, gx = np.mgrid[0:h, 0:w].astype(np.float32)
        gx += x0
        gy += y0
        for e in self.eyes:
            cx, cy = e['c']
            rx, ry = e['r']
            t = math.radians(e['tilt'])
            u = ((gx - cx) * math.cos(t) + (gy - cy) * math.sin(t)) / rx
            v = (-(gx - cx) * math.sin(t) + (gy - cy) * math.cos(t)) / ry
            inside = np.clip((1.2 - np.sqrt(u * u + v * v)) / .26, 0, 1)
            lid_edge = -1.1 + 2.5 * closure            # the lid sweeps from top (v=-1) past the bottom
            covered = np.clip((lid_edge - v) * ry / 1.1, 0, 1) * inside
            lid = np.array(e['lid'], np.float32)
            shade = lid * (0.88 + 0.12 * np.clip(-v, 0, 1))[..., None]
            crease = np.exp(-((v - (lid_edge - .08)) * ry / 0.9) ** 2) * inside * min(1, closure * 1.4)
            col = shade * (1 - .45 * crease[..., None])
            a = alpha[..., None]
            premul = premul * (1 - covered[..., None]) + col * a * covered[..., None]
        return premul, alpha

    # --- pose for time t
    def pose(self, t):
        t = tl.wrap(t)
        b = self.bones
        h = tl.keyed(tl.HEAD_KEYS, t)
        breath = math.sin(2 * math.pi * t / (tl.PERIOD / 3))
        sway = 0.4 * math.sin(2 * math.pi * t / 5.0)          # two slow sways per loop
        nod = tl.pulse(t, 7.2, .25, .55)                       # a small nod as the agent reports back
        b['head'].set(deg=2.9 * h + sway, t=(2.7 * h, -0.7 * h + 1.2 * nod))
        # Mouse: hand offset follows the on-screen pointer (relative mouse motion).
        c, r = screens.pointer_cell(t)
        c0, r0 = screens.POINTER[0][1]
        col_px = (c - c0) * 230
        row_px = (r - r0) * screens.ROW_H
        # Rows need less hand travel than columns: most of the motion is a
        # rotation about the planted elbow, as it is when mousing from the wrist.
        lateral, forward = col_px / 32.0, -row_px / 60.0
        u = np.array([0.668, 0.744], np.float32)     # Dave's right, projected
        f = np.array([0.744, -0.668], np.float32)    # away from Dave, projected
        # Each click presses the hand toward the desk for a moment.
        click = min(1.0, sum(tl.pulse(t, k - .07, .05, .1) for k in tl.CLICKS))
        b['arm_lat'].set(t=tuple(u * lateral + np.array([0.3, 1.4], np.float32) * click))
        b['arm_fwd'].set(t=tuple(f * forward))
        # Left hand taps for each keystroke, alternating fingers.
        tap = 0.0
        for i, k in enumerate(tl.KEY_TIMES):
            tap = max(tap, tl.pulse(t, k - .02, .035, .075) * (0.8 + 0.35 * ((i * 7) % 3) / 2))
        tap = min(tap, 1.15)
        # Between words the hand moves to another part of the keyboard.
        zx, zy = tl.hand_zone(t)
        b['tap'].set(t=(2.4 * zx + 0.3 * zy + 0.8 * tap, -0.9 * zx + 1.3 * zy + 3.2 * tap))
        # Dog.
        if tl.DOG_STILL:
            for name in ('dog_head', 'dog_ear', 'dog_tail', 'dog_ribs'):
                b[name].set()
            return dict(breath=breath, blink=0.0)
        g = tl.keyed(tl.DOG_HEAD_KEYS, t)
        idle = 0.35 * math.sin(2 * math.pi * t / 5.0)
        b['dog_head'].set(deg=-7.0 * g + idle, t=(-1.8 * g, -3.0 * g))
        ear = 0.0
        for k in tl.EAR_FLICKS:
            d = (t - k) % tl.PERIOD
            if d < 1.0:
                ear += 14.0 * math.sin(2 * math.pi * 4.6 * d) * math.exp(-5.5 * d) * (1 - tl.smooth((d - .7) / .3))
        ear += 2.5 * (g - tl.keyed(tl.DOG_HEAD_KEYS, t - .12))  # ear lags the head a touch
        b['dog_ear'].set(deg=ear)
        tail = 0.0
        a0, a1 = tl.TAIL
        if a0 <= t < a1:
            d = t - a0
            env = tl.smooth(d / .18) * (1 - tl.smooth((d - (a1 - a0 - .45)) / .45))
            tail = 7.0 * math.sin(2 * math.pi * 2.7 * d) * env
        b['dog_tail'].set(deg=tail)
        rib = math.sin(2 * math.pi * t / 2.5)
        b['dog_ribs'].set(scale=(1.0 + .004 * rib, 1.0 + .012 * rib))
        blink = 0.0
        for k in tl.BLINKS:
            d = (t - k) % tl.PERIOD
            if d < .07:
                blink = max(blink, tl.smooth(d / .07))
            elif d < .135:
                blink = max(blink, 1.0)
            elif d < .28:
                blink = max(blink, 1 - tl.smooth((d - .135) / .145))
        return dict(breath=breath, blink=blink)

    # --- screens
    def paint_screen(self, canvas, tex, quad):
        quad = np.array(quad, np.float32)
        x0, y0 = np.floor(quad.min(0)).astype(int) - 2
        x1, y1 = np.ceil(quad.max(0)).astype(int) + 3
        bw, bh = x1 - x0, y1 - y0
        ss = 3
        tw, th = int(bw * ss * 1.1), int(bh * ss * 1.1)
        small = cv2.resize(np.asarray(tex, np.float32), (tw, th), interpolation=cv2.INTER_AREA)
        dst = (quad - [x0, y0]) * ss + (ss - 1) / 2
        srcq = np.array([[0, 0], [tw, 0], [tw, th], [0, th]], np.float32) - .5
        H = cv2.getPerspectiveTransform(srcq, dst.astype(np.float32))
        warped = cv2.warpPerspective(small, H, (bw * ss, bh * ss), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        cover = cv2.warpPerspective(np.ones((th, tw), np.float32), H, (bw * ss, bh * ss), flags=cv2.INTER_LINEAR)
        warped = cv2.resize(warped, (bw, bh), interpolation=cv2.INTER_AREA)
        cover = cv2.resize(cover, (bw, bh), interpolation=cv2.INTER_AREA)
        # Glass: faint sheen from the upper left and a hairline shadow under the bezel.
        gy, gx = np.mgrid[0:bh, 0:bw].astype(np.float32)
        sheen = np.clip(1 - (gx / bw * .7 + gy / bh * .6), 0, 1) ** 2 * 9.0
        edge = cv2.GaussianBlur(cover, (0, 0), 1.2)
        inner_shadow = np.clip(1 - edge, 0, 1) * cover * 38
        warped = warped + sheen[..., None] - inner_shadow[..., None]
        region = canvas[y0:y1, x0:x1]
        canvas[y0:y1, x0:x1] = warped * cover[..., None] + region * (1 - cover[..., None])

    # --- full frame
    def frame(self, t):
        info = self.pose(t)
        canvas = self.plate.copy()
        self.paint_screen(canvas, screens.spreadsheet(t), QUADS['left'])
        self.paint_screen(canvas, screens.agent(t), QUADS['right'])
        self.head.composite(canvas, self.bones)
        shade, a = self.shade.warp(self.bones)
        x0, y0, x1, y1 = self.shade.box
        canvas[y0:y1, x0:x1] *= (shade + (1 - a[..., None]) * 127.5) / 127.5   # ratio 1 beyond the layer
        self.arm.composite(canvas, self.bones)
        self.lhand.composite(canvas, self.bones)
        self.dog.composite(canvas, self.bones, self.blink_rgba(info['blink']))
        self.ear.composite(canvas, self.bones)
        # Breathing: a sub-pixel rise of the shoulders and head.
        amp = 0.75 * info['breath']
        if abs(amp) > 1e-3:
            ys, xs = np.nonzero(self.breath_field > 0.002)
            y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            gy, gx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
            dy = self.breath_field[y0:y1, x0:x1] * amp
            canvas[y0:y1, x0:x1] = cv2.remap(canvas, gx, gy + dy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        m = self.periphery[..., None]
        canvas = canvas * m + BG * (1 - m)
        return np.clip(canvas + .5, 0, 255).astype(np.uint8)


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def encode(rig, fps=tl.FPS):
    n = int(round(tl.PERIOD * fps))
    tmp = VIDEO.with_suffix('.pending.mp4')
    cmd = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
           '-s', f'{SIZE}x{SIZE}', '-r', str(fps), '-i', 'pipe:0', '-an',
           # Tagging alone leaves a BT.601 conversion; convert to BT.709 explicitly.
           '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int',
           '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'veryslow', '-crf', '18', '-tune', 'film',
           # One keyframe per loop and equal I/P/B quantisers: no texture pop at the seam.
           '-x264-params', 'keyint=%d:min-keyint=%d:scenecut=0:ipratio=1.0:pbratio=1.0' % (n, n), '-pix_fmt', 'yuv420p',
           '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
           '-movflags', '+faststart', str(tmp)]
    enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    digest = hashlib.sha256()
    for i in range(n):
        f = rig.frame(i / fps)
        if i == 0:
            # The poster is the loop's opening frame, so the swap to video is invisible.
            still = Image.fromarray(f)
            still.save(POSTER, quality=86, method=6)
            still.resize((760, 760), Image.LANCZOS).save(POSTER_SMALL, quality=86, method=6)
        digest.update(f.tobytes())
        enc.stdin.write(f.tobytes())
        if i % 30 == 0:
            print(f'frame {i}/{n}', file=sys.stderr, flush=True)
    enc.stdin.close()
    if enc.wait() != 0:
        raise SystemExit('ffmpeg failed')
    tmp.replace(VIDEO)
    return digest.hexdigest(), n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--stills', help='comma-separated times in seconds; writes PNG frames instead of the loop')
    ap.add_argument('--out-dir', default='.')
    args = ap.parse_args()
    rig = Rig()
    if args.stills:
        od = Path(args.out_dir)
        od.mkdir(parents=True, exist_ok=True)
        for s in args.stills.split(','):
            t = float(s)
            Image.fromarray(rig.frame(t)).save(od / f'frame-{t:05.2f}.png')
        Image.fromarray(np.clip(rig.plate, 0, 255).astype(np.uint8)).save(od / 'plate.png')
        return
    digest, n = encode(rig)
    inputs = sorted([*ART.rglob('*.png'), *ART.rglob('*.json'), *(HERE / 'fonts').glob('*.ttf'),
                     *(HERE / f for f in ('render.py', 'screens.py', 'timeline.py'))])
    manifest = {
        'video': {'path': str(VIDEO.relative_to(ROOT)), 'sha256': sha256(VIDEO), 'bytes': VIDEO.stat().st_size},
        'posters': [{'path': str(p.relative_to(ROOT)), 'sha256': sha256(p)} for p in (POSTER, POSTER_SMALL)],
        'size': SIZE, 'fps': tl.FPS, 'period': tl.PERIOD, 'frames': n, 'rawFramesSha256': digest,
        'inputs': {str(p.relative_to(HERE)): sha256(p) for p in inputs},
        'tools': {'python': sys.version.split()[0], 'numpy': np.__version__, 'opencv': cv2.__version__,
                  'pillow': Image.__version__},
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps({k: manifest[k] for k in ('video', 'posters', 'frames', 'rawFramesSha256')}, indent=2))


if __name__ == '__main__':
    main()
