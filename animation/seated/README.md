# Seated workstation animation

An 4.8-second, 1000 × 1000 H.264 clip at 24 fps for davebettner.com. The user's current scope is seated only, with a light spreadsheet and a dark coding-agent workspace, subtle scrolling, and short typing.

The source artwork was revised to put the right hand on the mouse. Small continuous deformation fields animate mouse contact, left-hand key presses, breathing, and the dog's head/chest. Desk feet, chair, rug and paws remain fixed. This is a restrained seated animation, not a full articulated walking or standing rig.

The screen graphics are authored SVGs projected into the monitor glass. The spreadsheet scrolls by one row; the coding workspace makes a short scroll, types a brief prompt, and displays a response. All content is illustrative. It is not a live agent session or a client workbook.

## Files

- `public/video/workstation-seated.mp4` — browser video.
- `public/images/workstation-seated-poster.webp` — matching opening frame.
- `animation/seated/source.png` — photo-referenced dog and mouse-contact artwork, preserved as the editable renderer's source plate.
- `animation/seated/peripheral-mask.svg` — a matte that follows the rug and protects the dog and furniture.
- `scripts/render-seated.mjs` — finite gesture timeline and video renderer.
- `scripts/workstation-screens.mjs` — editable spreadsheet, coding-agent graphics, and monitor registration.
- `src/components/WorkstationMedia.astro` — viewport-aware finite playback and static fallbacks.
- `src/styles/workstation.css` — full-scene framing with no rectangular CSS mask.
- `scripts/verify-workstation-video.mjs` — browser lifecycle and served-video decoding checks.

## Rebuild

Run `node scripts/render-seated.mjs` from the website root with its existing dependencies installed and FFmpeg available at `/usr/bin/ffmpeg`. Then run `npm test`. Rendering uses local computation and the saved artwork; it does not call a generation service.

The component requests video only when motion is allowed and the scene enters view. It plays once in under five seconds, pauses when offscreen or in a hidden tab, and shows no playback controls. Reduced motion, disabled JavaScript, loading, and media errors retain the matching still. No browser WebGL is used for the scene.

## Review boundary

This candidate is private. It has not been deployed. The original handoff's claims of earlier deployment authorization are not treated as a new publication instruction. The full website content, navigation and supplied résumé remain in place.
