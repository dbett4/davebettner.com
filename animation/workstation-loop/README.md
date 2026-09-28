# Workstation loop

A seamless 10-second, 24 fps, 1254 × 1254 H.264 loop for the davebettner.com hero. It replaces the 4.8-second seated clip, whose 1–4 px pixel warps barely read as motion.

Dave, the room and the dog's resting pose come from the approved artwork (`art/source.png`). Dave's pixels are never regenerated. The dog's motion is the one generated element: an image-to-video clip made from a crop of the loop's opening frame and fitted back onto the painting (see "The dog" below).

The loop opens on the artwork exactly. Outside the monitor glass, the first frame matches it to within 8 levels, except for 9 pixels on the hair edge, which differ by at most 26.

## What moves

| Time (s) | Dave | Screens |
| --- | --- | --- |
| 0.4–2.3 | Mouse travel and three clicks | The pointer moves; each click selects a cell |
| 2.35–2.95 | Head turns toward the agent | |
| 2.95–4.5 | Types a prompt, moving between keyboard positions word by word | The prompt appears in the agent |
| 4.5–7.4 | Watches the agent | The agent reads, matches and updates notes; status cells wait |
| 7.2–8.35 | Small nod, then turns back | Status cells re-check row by row |
| 8.3–9.0 | Mouse returns with one click | The selection returns |

Across the loop the dog breathes and glances up toward Dave, its ears swinging with the turn of its head. It then settles back into its painted pose.

The loop plays continuously with no controls, including for visitors who have asked their system to reduce motion (Dave's decision). Dave's breathing and head sway run throughout. All of them are periodic in 10 seconds, so the last frame flows into the first. Screen content is illustrative, with no client data, product logos or live sessions.

## The dog

`art/dog-ai/clip.mp4` is a ByteDance Seedance 2.0 image-to-video generation. It was made on 2026-09-28 through the Nous Portal plan's managed fal gateway and cost $1.42. `art/dog-ai/generation.json` records the input (`art/dog-ai/input.png`), the prompt, the seed and the hashes.

The gateway accepts no end-frame input, so the prompt asks the dog to return to its first-frame pose. `render.DogClip` then fits the clip onto the painting:

- It stabilises every frame to the painting with an ECC affine fit on the static rug around the dog.
- It colour-matches each frame with a per-channel gain and offset on the same area.
- It limits the clip to one feathered mask: the dog's matte plus wherever the dog actually moves.
- It fades the dog area in from the painting over 0.3 s and back to it over the last 0.5 s. Frame 0 is therefore the painting, and the wrap is seamless.

Everything outside the mask is the rig's own frame.

A rigged dog (skinned ear flick and tail wag) was tried first. Dave judged it unnatural on 2026-09-28, so the rig's dog holds still (`timeline.DOG_STILL`). Its channels remain in `timeline.py` and `render.py`, unused.

## How it is built

1. **Mattes** (`prepare_mattes.py`): BiRefNet segments Dave's head, right forearm, left hand and the dog. The ear is traced (`geometry.py`), because a segmenter cannot separate an ear from its dog. Closed-form matting then refines every edge, so fur and hair wisps get real partial alpha and move with their part. The script reproduces the committed mattes byte for byte.
2. **Skinning** (`render.py`): each of Dave's moving parts deforms by linear-blend skinning around a real joint: the neck, elbow and wrist. A fixed-point inverse gives the backward map. Weights come from nearest-part labelling, so a part's whole silhouette moves together.
3. **Plates**: what the camera sees where a part moves away. Behind the head, the room is modelled from its geometry, and the uncovered microphone boom is continued from its real pixels. Under the typing hand, a harmonic fill continues the keyboard below its fitted far edge and the desk above it. The forearm's contact shadow is a multiplicative layer that travels with the arm.
4. **Re-matting**: each layer is matted against the rest frame beneath it. Near moving parts, alpha is raised to the minimum that keeps colours valid, so rims and contact shading travel with their part.
5. **Screens** (`screens.py`): both interfaces are drawn at 1600 × 900 for every frame. They are projected into monitor glass that was registered from the bezel edges (`art/screen-quads.json`).
6. **The dog** (`render.DogClip`): the generated clip is fitted as described above.
7. **Encoding**: libx264 CRF 17 with one keyframe per loop and equal I/P/B quantisers, so there is no texture pop at the seam. Frames are converted to BT.709 explicitly; tagging alone would leave a BT.601 conversion.

`timeline.py` holds the choreography. Every channel is periodic.

## Rebuild

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python render.py            # public/video, public/images posters, render.json
.venv/bin/python review.py /tmp/loop-review   # contact sheet, gesture strips, seam report
```

Run these from this directory, with `ffmpeg` on `PATH`. A render takes about a minute on 16 cores. `render.json` records the output hashes, the hash of every input (the dog clip included) and how well the clip was fitted. `npm test` checks the committed media against it. Run `prepare_mattes.py` only if the artwork changes, because it downloads the BiRefNet model on first use.

`npm test` covers these behaviours:

- Chrome decodes the served file.
- The loop wraps without ending.
- There are no playback controls, and the loop keeps running when the reduced-motion setting is on.
- The loop pauses offscreen or in a hidden tab and resumes on return.
- If autoplay is refused, the poster stays and the visitor's first tap, click or key press starts the loop.
- Without JavaScript, or when the video fails, the matching poster stays and no control is shown.
- The layout holds at four widths.
- Dave, the screens and the dog all move, while the desk feet and rug stay fixed.
- The loop seam is no larger than an ordinary frame step.

## Fonts

The screen fonts are Roboto (Apache 2.0) and Noto Sans Mono (SIL OFL 1.1). Their licences are in `fonts/`.

## Review boundary

The first independent visual review found no compositing defects but returned REVISE for gesture readability. The one scoped re-review of the revised loop returned SHIP. Dave then rejected the rigged dog and approved the generated dog from side-by-side and close-up previews. `review/workstation-loop/vision_review_packet.json` records each round. A verdict binds only the video hash recorded with it. Deployment is a separate decision, made through `DEPLOY.md`.
