# Interstellar — Tide Sphere

Interstellar is the single visual system for davebettner.com. Dave is the subject; the moving field is atmosphere, not a product metaphor. The system leads with enterprise-agent deployment and uses finance, assurance, healthcare, and public engineering as bounded proof.

## Direction

- **Composition:** a tightly cropped, sculptural sphere field using the approved Tide / Signal palette.
- **Ground:** carbon `#08090b` and lifted carbon `#101114`.
- **Type:** warm white `#f2eadf`, with muted copy `#b9b2aa`.
- **Signals:** tide teal `#73bfc4`, signal orange `#ff810a`, periwinkle `#8da0ce`, graphite rules `#34353a`.
- **Typography:** self-hosted Archivo Variable for display and body; DM Mono only for labels and data.
- **Shape language:** hard rules, rectangular actions, large condensed headings, asymmetric fields. No pills, glass cards, dashboard chrome, stars, planets, or literal science-fiction interface elements.

## Shared implementation

`public/styles/interstellar-system.css` is the site-wide source of truth. It overrides the former paper theme on every public route, supplies browser theming, focus states, grain, responsive geometry, and the designed no-WebGL fallback.

`src/scripts/sphere-gradient.ts` mounts the homepage ShaderGradient sphere with the approved Tide / Signal palette and authored camera, surface, reflection, and motion settings. It uses a DPR of 1, disables camera controls, freezes at the authored frame under reduced motion, and keeps the canvas `aria-hidden` and pointer-inert. If WebGL cannot initialize, the carbon field remains. `public/interstellar.js` continues the restrained site-wide field on secondary routes.

The homepage owns the full field. Secondary route introductions receive the same field at restrained opacity. Reading regions remain solid or near-solid carbon rather than translucent glass.

## Homepage topology

The masthead is thin and dark. The opening field fills the first viewport. Monumental stacked DAVE BETTNER sits left, with the customer-facing implementation role, exact existing support copy, and rectangular conversation/résumé actions. The exact source portrait sits large at right and overlaps the field. Delivery evidence begins at or below the fold.

The only visible homepage portrait carrying `data-source-portrait` is `/images/dave-bettner-headshot-20260816-cutout.png`, declared at its intrinsic `1312 × 1199`. It is the user-supplied RGBA image byte-for-byte, rendered as an ordinary image, never a canvas, and receives no pixel manipulation.

## Route system

Home, Work, each Work detail, Experience, First 90 Days, About, and 404 share the carbon palette, rules, typography, focus treatment, and event-horizon field. Existing semantic landmarks, headings, links, provenance, evidence boundaries, data-backed copy, and route behavior remain intact. Lists are ruled editorial sequences rather than card walls.

## Accessibility and performance

- Body text is warm white or muted warm gray on carbon, meeting 4.5:1 contrast.
- Focus-visible uses a three-pixel ember outline with offset.
- Interactive targets are at least 44px tall.
- The layout clips decorative overflow and remains usable from 320px through 1440px.
- Content and the CSS field render before JavaScript and survive JavaScript/WebGL failure.
- Reduced motion removes transitions and fixes the shader at one frame.
- Selection, scrollbars, link underlines, and browser theme surfaces are explicitly themed.

## Finish review

The implementation matches the approved Tide Sphere topology while using Dave’s exact supplied cutout. The system is profile-first, avoids the prohibited literal space/HUD vocabulary, and carries one shader-led world across every public route.

**Verdict:** ready for GREEN/YELLOW local visual review. Browser captures should confirm portrait overlap, mobile crop, shader band character, and long-page reading rhythm before any release decision.
