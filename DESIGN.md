# The Working Record

The Working Record is the single visual system for every public route on davebettner.com. Dave is the subject. The system is a ruled, rectangular, paper-and-ink record of his role, his delivery record, and his public engineering evidence — not a product metaphor, not a spectacle, not a shader.

Seed: `working-record-20260906`

## Direction

- **Composition:** flat, ruled, rectangular. No gradients, pills, glow, glass, blur, grain, halftone/dither, canvas, WebGL, orbs, or cutout campaign treatment.
- **Ground:** paper `#F5F2EA`, with a paper-alt `#E9E4D9` band for the credibility line and contained panels.
- **Ink and accents:** ink `#171717` for type and rules, safety orange `#E85D1A` for small accent marks, accessible dark orange `#A93D12` for focus rings and any small text that must clear 4.5:1, rule `#C9C3B8` for hairlines.
- **Typography:** self-hosted Newsreader Variable carries the h1 and restrained section display headings; self-hosted Archivo Variable carries UI and body copy; self-hosted DM Mono is reserved for dates and short labels only. No network fonts.
- **Shape language:** hard rules, rectangular actions, ruled lists. Deep case pages may keep flat CSS/SVG process motifs with human-readable, `aria-hidden` decoration — the adjacent text always carries the meaning, never the shape alone.

## Shared implementation

`public/styles/working-record.css` is the only public-route theme source of truth: one `:root` token block, the grid, the masthead/nav, the ruled-list system, the action/button system, and the motion rules. Every public route — Home, Work, every Work detail, Experience, About, `/fit/`, and 404 — links this one stylesheet and nothing else. `src/components/Masthead.astro` and `src/components/Footer.astro` are the one shared masthead and footer used on every public route.

Preview and mockup routes (`src/pages/mockups/*`, `src/pages/preview-dither.astro`) remain isolated, `noindex` experimental surfaces. They do not load `working-record.css` and no public route inherits their retired Interstellar/Tide/carbon/cobalt/periwinkle language.

## Grid and rhythm

- Container max-width `1240px`.
- Desktop: 12-column grid, `32px` gutters. Hero splits `7/5` (copy/portrait). Evidence rows (experience, selected work, acceptance chains) split `4/8` (meta/body).
- Tablet gutter `20px`; mobile gutter `16px`; both breakpoints collapse the grid to a single column.
- Spacing rhythm: `8 / 16 / 24 / 40 / 64 / 96`.

## Home topology

The masthead is compact and light. The first viewport is a person-first fold: an identity line (`Dave Bettner · Senior Manager · Des Moines, Iowa`), the exact h1, support copy, one primary action to selected work, and two quiet actions (résumé, email) — with the exact source portrait at right on the `7/5` split, stacking below the copy on narrow viewports. A credibility line follows in a paper-alt band. Then, in order: a three-row selected delivery record, two ruled selected-work cases with stated boundaries, a short working-method section, and a direct hiring close. No numbered panels, no diagrams, no consulting-availability close.

The only homepage portrait carrying `data-source-portrait` is `/images/dave-bettner-headshot-20260816-cutout.png`, declared at its intrinsic `1312 × 1199`, rendered as an ordinary `<img>`, never a canvas, and never pixel-manipulated.

## Route system

Work is a full public evidence index: a text-led ruled list of every public case with its proof and its stated boundary, no numbered value panels, no consulting close. Each Work detail route keeps its full proof, limitations, evidence map, and any flat static process evidence (failure/fault/resume/receipt; confirm/write/readback; legacy-check/narrow-guard/tests). Experience is a dated ruled timeline including the current Senior Manager role, Chicago then Des Moines, with "Remote" omitted. About states the person and the working method. `/fit/` keeps the First 90 Days plan, off primary navigation but linked from the shared footer on every route. 404 shares the same masthead, footer, and stylesheet.

## Navigation

The shared masthead shows a compact "Dave Bettner" brand, primary navigation limited to exactly Work, Experience, and About with `aria-current="page"` on the active route, and quiet résumé/email utility links. At narrow widths (390–768px and below) every destination remains reachable through a native, JS-free `<details>`/`<summary>` disclosure that duplicates the same links — not a second, incomplete navigation system.

## Accessibility and motion

- Body text meets 4.5:1 contrast against its surface; small accent text uses the accessible dark orange, not the safety orange.
- Focus-visible uses a 3px accessible-dark-orange outline with a 4px offset, applied with `0ms` transition.
- Interactive targets are at least 44×44px; a skip link is present on every route; landmarks and lists are semantic; tab order follows reading order.
- Motion is static-first: all content is present in the HTML on load. The only transitions are 180ms ease-out color/background/border/underline feedback and an optional 200ms active `scale(.98)`. `prefers-reduced-motion: reduce` removes transitions and smooth scrolling. There are no entrance reveals and no motion-only meaning.
- The layout has no document-level horizontal overflow from 320px through 1440px, works with JavaScript disabled, and remains usable at 200% zoom and increased text spacing.

## Finish review

The Working Record replaces Interstellar site-wide: one shared stylesheet, one shared masthead and footer, the exact locked home contract, the exact token set, and rectangular, static-first motion everywhere a visitor can land from primary navigation. Deep-route proof, limitations, and the approved portrait cutout are preserved byte-for-byte.

**Verdict:** ready for GREEN/YELLOW local review against the locked contract — home copy and order, navigation and disclosure behavior, token usage, portrait contract, and the absence of gradients, canvases, and WebGL on every public route.

unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
