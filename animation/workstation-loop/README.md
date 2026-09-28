# Workstation loop

A seamless 10-second, 30 fps, 1254 × 1254 H.264 loop for the davebettner.com hero. It replaces the 4.8-second seated clip, whose 1–4 px pixel warps barely read as motion.

The approved artwork (`art/source.png`) is the only source of pixels for Dave, the dog and the room. Nothing is regenerated. The loop opens on the artwork exactly: outside the monitor glass, the rest frame matches it to within 8 levels (at most 26 levels on 9 pixels of the hair edge).

## What moves

| Time (s) | Dave | Screens | Dog |
| --- | --- | --- | --- |
| 0.4–2.3 | Mouse travel and three clicks | The pointer moves; each click selects a cell | Blinks at 1.75 |
| 2.35–2.95 | Head turns toward the agent | | |
| 2.95–4.5 | Types a prompt, moving between keyboard positions word by word | The prompt appears in the agent | Ear flick at 3.55 |
| 4.5–7.4 | Watches the agent | The agent reads, matches and updates notes; status cells wait | Head lifts toward Dave (4.9–5.6), blinks, tail wag (6.35–7.55) |
| 7.2–8.35 | Small nod, then turns back | Status cells re-check row by row | Head settles (7.7–8.5) |
| 8.3–9.0 | Mouse returns with one click | The selection returns | Ear flick at 8.95 |

Breathing, the head sway and the dog's idle drift run throughout. All of them are periodic in 10 seconds, so the last frame flows into the first. Screen content is illustrative, with no client data, product logos or live sessions.

## How it is built

1. **Mattes** (`prepare_mattes.py`): BiRefNet segments Dave's head, right forearm, left hand and the dog. The ear is traced (`geometry.py`), because a segmenter cannot separate an ear from its dog. Closed-form matting then refines every edge, so fur and hair wisps get real partial alpha and move with their part. The script reproduces the committed mattes byte for byte.
2. **Skinning** (`render.py`): each part deforms by linear-blend skinning around a real joint: the neck, elbow and wrist, the dog's neck, ear root and tail root. A fixed-point inverse gives the backward map. Weights come from nearest-part labelling, so a part's whole silhouette moves together.
3. **Plates**: what the camera sees where a part moves away. Behind the head, the room is modelled from its geometry, and the uncovered microphone boom is continued from its real pixels. Behind the dog, rug texture is copied by shift-map. Under the typing hand, a harmonic fill continues the keyboard below its fitted far edge and the desk above it. Under the ear, a harmonic fill of the surrounding fur is used. The forearm's contact shadow is a multiplicative layer that travels with the arm.
4. **Re-matting**: each layer is matted against the rest frame beneath it. Near moving parts, alpha is raised to the minimum that keeps colours valid, so rims and contact shading travel with their part.
5. **Screens** (`screens.py`): both interfaces are drawn at 1600 × 900 for every frame. They are projected into monitor glass that was registered from the bezel edges (`art/screen-quads.json`).
6. **Encoding**: libx264 CRF 18 with one keyframe per loop and equal I/P/B quantisers, so there is no texture pop at the seam. Frames are converted to BT.709 explicitly; tagging alone would leave a BT.601 conversion.

`timeline.py` holds the choreography. Every channel is periodic.

## Rebuild

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python render.py            # public/video, public/images posters, render.json
.venv/bin/python review.py /tmp/loop-review   # contact sheet, gesture strips, seam report
```

Run these from this directory, with `ffmpeg` on `PATH`. A render takes about a minute on 16 cores. `render.json` records the output hashes and the hash of every input; `npm test` checks the committed media against it. Run `prepare_mattes.py` only if the artwork changes, because it downloads the BiRefNet model on first use.

`npm test` covers these behaviours:

- Chrome decodes the served file.
- The loop wraps without ending.
- The pause control works by keyboard and pointer, and survives scrolling.
- With reduced motion, the loop plays one pass, holds, and can be replayed.
- Without JavaScript, or when the video fails, the matching poster stays and no control is shown.
- The layout holds at four widths, the desk feet and rug stay fixed, and the loop seam is no larger than an ordinary frame step.

## Fonts

The screen fonts are Roboto (Apache 2.0) and Noto Sans Mono (SIL OFL 1.1). Their licences are in `fonts/`.

## Review boundary

The first independent visual review found no compositing defects but returned REVISE for gesture readability. The one scoped re-review of the revised loop returned SHIP (`review/workstation-loop/vision_review_packet.json`). That verdict binds only the video hash recorded in the packet. Deployment is a separate decision, made through `DEPLOY.md`.
