# Design

**As of:** 2026-09-28, origin/main `db648b8`. davebettner.com still serves `f17d6c2`, whose pages match this build except for two unused `.skip-link` rules in the homepage stylesheet.

davebettner.com is a light-only, type-led profile. A stylized illustration of Dave at a desk carries the homepage. Everything else is one typeface on a cool grey-blue page, separated by 1px rules and three flat tonal surfaces. There is no dark mode, theme switch, shader, canvas, gradient, shadow or rounded panel.

## Source of truth

| File | Owns |
| --- | --- |
| `src/styles/theme.css` | Color tokens, `color-scheme: light`, the focus ring and the reduced-motion CSS |
| `src/styles/profile.css` | Base type, the `.wrap` container, masthead, footer, route introductions, actions and buttons, the `.paper` band, timeline, prose grid, project lists and print styles |
| `src/styles/workstation.css` | Homepage only: hero grid, scene sizing, proof strip, sections, case and project panels |
| `src/styles/depth.css` | `/experience/connected-reporting/` only |
| `src/components/WorkstationMedia.astro` | Hero poster, video and playback script |
| `src/layouts/Profile.astro` | The layout for every route: font import, metadata, skip link, masthead and footer |
| `animation/workstation-loop/` | How the hero loop is made. `render.json` records the hashes that `npm test` checks |

Some images from retired designs are still deployed, but no page uses them. See [Retired images](#retired-images).

## Color

The tokens are declared on `:root` in `theme.css`. `html` and `body` paint `--page`, the root declares `color-scheme: light`, and `<meta name="theme-color">` is `#e6ebf0`.

| Token | Value | Use | Contrast |
| --- | --- | --- | --- |
| `--page` | `#e6ebf0` | Page background, and the color baked into the edges of the hero poster and video | |
| `--surface` | `#f0f3f6` | `.paper` reading band on secondary routes; homepage case panel | |
| `--surface-raised` | `#f5f7f9` | Homepage project panels; About portrait frame | |
| `--text` | `#18212b` | Body copy and headings; hover fill of the primary button | 13.6:1 on page |
| `--secondary` | `#465667` | Ledes, leads, supporting copy, dates, proof strip, footer links | 6.3:1 on page |
| `--border` | `#becbd7` | 1px rules and panel outlines | 1.4:1, decorative only |
| `--accent` | `#334f75` | Primary button, link hover, focus ring, 2px and 3px accent rules | 7.0:1 on page |
| `--accent-contrast` | `#ffffff` | Text on accent: primary button and skip link | 8.3:1 on accent |

- The site is light-only. Pages render the light palette under an OS dark preference and ignore a `db-theme` value stored by the retired theme toggle. There is no theme control. `npm test` checks every route at four widths under both OS schemes.
- Use the tokens. The only other colors in live CSS are the print styles (`#fff`, `#111`).
- `--border` separates regions only. At 1.4:1 it is too faint to be the sole indicator of a control or a state.
- Do not change `--page` without re-rendering the hero. The loop and its posters bake `#e6ebf0` into their edges and the rug's feathered fringe, and `scripts/verify-soft-fade.mjs` requires the edges to match within 2 levels per channel.

## Typography

- One family: Archivo Variable, self-hosted from `@fontsource-variable/archivo` 5.3.0. `Profile.astro` imports `wdth.css` once, and Astro bundles its three WOFF2 subsets (Latin, Latin Extended, Vietnamese) into `/_astro/` with `font-display: swap`.
- The font declares weights 100–900 and widths 62–125%. The site varies weight only. `font-stretch` is never set, so text renders at normal width.
- Stack: `'Archivo Variable', Arial, sans-serif`, with `font-synthesis: none`.
- There is no mono, serif or second display face, and no uppercase label style.

Sizes are desktop first. A second value applies at 700px and below.

| Role | Selector | Size | Weight | Line height | Tracking |
| --- | --- | --- | --- | --- | --- |
| Name | `.hero h1` | `clamp(42px, 5vw, 66px)`; 40px | 700 | 1 | −0.065em |
| Positioning line | `.hero h2` | `clamp(27px, 3vw, 38px)`; 29px | 450 | 1.08 | −0.045em |
| Homepage section heading | `.section h2` in `workstation.css` | `clamp(32px, 4vw, 52px)` | 650 | 1.04 | −0.06em |
| Route title | `.page-intro h1` | `clamp(42px, 5vw, 72px)`; `clamp(43px, 10vw, 65px)` | 550 | 1.06 | −0.035em |
| Default `h2` | homepage footer message, project-page sections | `clamp(34px, 4vw, 57px)`; project sections 27px | 550 | 1.06 | −0.035em |
| Component headings | timeline, prose, project, archive, story, case | 23–36px, set per component | 550 | 1.06; case title 1.1, definition terms 1.2 | −0.02em to −0.05em |
| Homepage lede | `.lede` | 19px; 17px | 400 | 1.55 | |
| Route lead | `.page-intro .lead` | 23px; 20px | 400 | 1.5 | |
| Body | `body` | 17px; 16px | 400 | 1.6, prose 1.75 | |
| Wordmark | `.brand` | 19px | 650 | | −0.03em |
| Interface text | masthead, buttons, text actions, proof strip, footer links, scope notes | 14px; masthead and proof strip 13px, nav 12px at 340px and below | 400, buttons 650 | | |

- Weight carries the hierarchy: 700 for the name only, 650 for homepage section headings, section links, the wordmark and the primary button, 550 for other headings, 450 for the positioning line, and 400 for reading text.
- Every heading has negative tracking, from −0.02em to −0.065em, tightest on the homepage name and section headings. Reading text is never tracked.
- Links inherit the text color and turn `--accent` on hover. Inline, action and footer links are underlined at 1px with a 5px offset. Masthead links and the wordmark are not underlined, except the current nav item, which has a 2px underline.

## Layout

### Shared frame

- Container: `.wrap` is `min(100% - 48px, 1180px)`, centered. At 700px and below it is `min(100% - 32px, 560px)`, which gives 16px gutters.
- Masthead, on every route: an 88px row above a 1px rule. On the left, a 44 × 44 home link holds Dave's square headshot as a 32px circle (`alt=""`, labelled "Dave Bettner home"). In the center is the nav: Experience, Projects, Approach and About, with `aria-current="page"` on the current item. On the right is "Email Dave", a `mailto:` link.
- Footer, on every route: the wordmark and "Des Moines, Iowa", with About, Résumé, GitHub, LinkedIn and Email links on the right. The homepage adds a closing message, "Let’s talk about the work.", above the wordmark.
- The skip link is the first focus stop. It sits above the viewport until focused and moves focus to `main#main`.

### Homepage

1. Hero: two columns (`.9fr` text, `1.1fr` scene), at least 650px tall, vertically centered, with a 1px rule below. The text column (up to 570px) holds the name, the positioning line "I help customers put complex software to work.", a lede, and three actions. The primary button, "Explore my work", jumps to `#selected-work`. Two text links follow: "Download résumé", with `download`, and "Get in touch", a `mailto:` link. The scene column centers the illustration in a 660px-tall frame.
2. Proof strip: three facts in 14px `--secondary`, spread across the width: "Workiva · Citrin Cooperman · LSL", "Customer-facing software delivery since 2015." and "Des Moines, Iowa".
3. Experience: a two-column section with the heading on the left and the copy and "Explore my experience" on the right.
4. Selected work (`#selected-work`): the connected-reporting engagement as a two-column section, followed by a `--surface` case panel with a title, one line and two ruled facts.
5. "What I’m building.": an introduction and two `--surface-raised` project panels. Each panel has the project name, two sentences, a scope line, and "About the project · View repository". "More technical work" follows the panels.

Sections are separated by 1px rules and use `clamp(62px, 8vw, 94px)` vertical padding.

### Secondary routes

Experience, Projects (`/work/`), each project page, the connected-reporting summary, Approach (`/fit/`), About and 404 share one grammar. A `.page-intro` on the page color holds the route title, a 23px lead and optional actions. Below it, a `.paper` band on `--surface`, with a 1px top rule, holds the content. The 404 page has no band.

- Experience: a timeline with dates in a `.7fr` column and the employer, title and bullets in a `1.5fr` column, then Education.
- Approach and About: a `.65fr` / `1.25fr` prose grid. Approach puts a 20px aside on the left. About puts the portrait there.
- Projects: two featured projects under 2px accent rules, then a two-column "Further technical work" list.
- Project pages: a scope line, then "The problem", "What I built" and "What you can inspect", then links.
- Connected reporting (`depth.css`): a scope brief under a 3px accent rule, beside the story and a definition list of the three scope areas.

### Surfaces, rules and shape

- Depth comes from tone only: `--page`, `--surface` and `--surface-raised`. There are no shadows, gradients, blurs or translucent layers.
- Corners are square. The circular masthead avatar is the only exception.
- Rules are 1px `--border`. Accent rules sit only on top edges: 2px above each featured project on `/work/` and 3px above the engagement brief.
- Bordered panels appear only on the homepage (the case panel and two project panels) and as the About portrait frame. Secondary routes use ruled lists and prose.
- Buttons have one style, `.button`: an `--accent` fill, white 14px text at weight 650, a minimum height of 49px, 12px × 22px padding and square corners. On hover the fill becomes `--text` and the label `--page`. Every other action is an underlined text link.

## Hero illustration

The hero is a stylized 3D illustration of Dave, seen from behind at a black standing desk. A light spreadsheet fills the left monitor and a dark coding-agent workspace the right. Dave sits in a mesh office chair on a patterned rug, and Dave's dog lies on the rug. The image is square. Its edges and the rug's fringe fade into `--page`, so it sits on the page without a frame or box.

### Media

| Asset (under `public/`) | Details |
| --- | --- |
| `video/workstation-loop.mp4` | H.264 High, 1254 × 1254, 24 fps, 10.0 s (240 frames), BT.709, no audio track, about 609 KB |
| `images/workstation-loop-poster.webp` | 1254px poster: the loop's first frame |
| `images/workstation-loop-poster-760.webp` | 760px version of the same frame |

`animation/workstation-loop/README.md` explains how the loop is rigged and rendered, and `render.json` is authoritative for these numbers. Update this table when either changes.

In the current loop, Dave moves the mouse and clicks spreadsheet cells, turns toward the coding agent, types a prompt, watches the agent run, nods and turns back. The screens are drawn in code every frame with illustrative content: no client data, product logos or live sessions. Breathing and a slight head sway run throughout. The dog breathes, glances up toward Dave with its ears swinging, and settles back into its painted pose. Every channel repeats within 10 seconds, so the last frame flows into the first.

Dave, the room and the dog's resting pose come from the approved artwork, and Dave's pixels are never regenerated. The dog's motion is the one generated element: a Seedance 2.0 image-to-video clip made from a crop of the loop's opening frame. `animation/workstation-loop/art/dog-ai/generation.json` records its prompt, seed, hashes and cost. The renderer stabilizes the clip to the painting, color-matches it, limits it to a feathered mask around the dog, and fades the dog area in from the painting and back to it, so frame 0 is the artwork and the wrap is seamless. Dave rejected an earlier rigged dog on 2026-09-28; its channels remain in the code, unused.

### Markup

`WorkstationMedia.astro` renders two layers:

- `<img class="scene-render">` is the poster. It has `srcset` at 760w and 1254w, `sizes="(max-width: 700px) calc(100vw - 32px), 720px"`, intrinsic size 1254 × 1254 and `fetchpriority="high"`. Its alt text describes the scene and is the illustration's accessible name, so keep it true to the picture.
- `<video class="workstation-video">` sits over the poster with `muted loop playsinline preload="none"`. It has no `src` until playback is allowed; the URL waits in `data-src`. It is `aria-hidden="true"` with `tabindex="-1"`, disables picture-in-picture and remote playback, and ignores pointer events. It stays `visibility: hidden` until its first `playing` event, so a visitor sees either the poster or a playing frame.

### Motion behavior

- There are no controls: no play or pause button and no `controls` attribute. This is Dave's decision (2026-09-28), and the tests enforce it.
- Reduced motion does not stop the loop. It plays whether or not the visitor's system asks to reduce motion, including when the setting changes during a visit. This is also Dave's decision (2026-09-11, reaffirmed 2026-09-28), and the tests enforce it. The `prefers-reduced-motion` rules in `theme.css` turn off smooth scrolling and would collapse CSS transitions and animations, but the site currently has none.
- This departs from WCAG 2.2.2 (Pause, Stop, Hide), which asks for a way to pause, stop or hide motion that starts automatically, lasts more than five seconds and plays alongside other content. The axe checks in `npm test` do not cover this criterion for video. Do not add a control or a reduced-motion fallback unless Dave decides to.
- The video is requested only once at least 5% of the scene is on screen and the tab is visible.
- Playback pauses when the scene leaves the viewport or the tab is hidden, and resumes when both are visible again.
- If the browser refuses autoplay, for example in a power-saving mode, the poster stays and the visitor's first tap, click or key press anywhere on the page starts the loop.
- A network or decoding error hides the video for the rest of the visit and leaves the poster.
- Without JavaScript, the poster is shown and the video is never requested.
- Because the poster is the loop's first frame, the switch from poster to video is not noticeable.
- The root element carries `data-video-visible`, which drives the video's visibility, and `data-motion-active`, which is true while the loop is actually playing.

### Constraints

- Keep the scene unmasked. The rug's soft edge is baked into the frames, and `.scene-wrap` and `.workstation-media` must keep `mask-image: none`. The verifiers compare masked and unmasked captures.
- Keep the whole dog and rug in frame, with no horizontal scrolling, at 1440, 768, 390 and 320px.
- Keep the poster rendered from the loop's first frame, and keep the loop seam no larger than an ordinary frame step. The render uses one keyframe per loop for this; see the animation README.
- Keep media on the same origin. The Content Security Policy in `public/_headers` (`default-src 'self'`) blocks off-site media, fonts and scripts.
- Keep the committed media equal to `render.json`. `npm test` hashes them, including the copies in `dist/`.
- Changes to the illustration or its motion are Dave's decision. Never regenerate Dave, and disclose any generated pixels in the animation README, as the dog clip is.
- Review boundary: `review/workstation-loop/vision_review_packet.json` records each round. An independent reviewer returned SHIP on the earlier rigged-dog render (sha256 `6f771bdf…`); Dave and the screens are unchanged since, apart from the move from 30 to 24 fps. Dave approved the current render (`ae209fa0…`), with the generated dog, from side-by-side and close-up previews. The independent reviewer has not reviewed the generated dog.

## Responsive rules

Breakpoints are `max-width` queries at 900px, 700px and 340px.

| Width | Behavior |
| --- | --- |
| Above 900px | Two-column hero. The scene frame is 660px tall, and the illustration fills the scene column up to 720px wide; inside the 1180px container that column peaks at about 617px. |
| 900px and below | The hero stacks: text, then the scene, pulled up 55px into a 640px frame with the illustration centered at up to 660px. Masthead, timeline, prose and project-list gaps tighten. |
| 700px and below | 16px gutters in a 560px container and 16px body text. The masthead becomes two rows: the avatar and "Email Dave", then all four nav links across the full width at 13px. Every grid becomes one column, and the proof strip, case panel and project panels stack. The scene frame is `clamp(320px, 100vw, 550px)` tall, pulled up 40px, and the illustration takes the full column width. |
| 340px and below | Nav links drop to 12px so all four fit at 320px. |

- The poster's `sizes` is `calc(100vw - 32px)` up to 700px and 720px above that. Standard-density desktop screens load the 760px poster, and high-density screens load the 1254px one.
- The hero clips its own overflow (`overflow: clip`). No route may scroll horizontally at 1440, 768, 390 or 320px.
- Print hides the masthead, footer and actions and prints near-black on white.

## Accessibility

- Every interactive element gets a 3px `--accent` outline at a 3px offset on `:focus-visible`.
- Masthead links, the avatar link and text links in `.actions` rows are at least 44px tall, footer links at least 32px, and the primary button 49px. Other inline links pass axe's WCAG 2.2 target-size check.
- Each page has one `h1` and one `main`. Project lists place their `h2` headings directly under the page `h1`.
- Every text pair in the token table exceeds 4.5:1.
- `npm test` runs axe (WCAG 2.0 A and AA, 2.1 AA, 2.2 AA) on every route at 1440px, and on every route except the 404 page at 390px, and fails on any violation.
- The site's only script is the hero's playback script, and every other route works identically without JavaScript. In production, Cloudflare also injects its bot-detection script (`/cdn-cgi/challenge-platform/`) into every page.
- For the hero's departure from WCAG 2.2.2, see [Motion behavior](#motion-behavior).

## Retired images

Of the files in `public/images/`, live pages use only the two loop posters, the square headshot (`dave-bettner-headshot-20260808-square.webp`), the About cutout (`dave-bettner-headshot-20260816-cutout.png`) and the social card (`dave-bettner-profile-social.jpg`). The rest come from earlier designs and stay deployed because pages outside the site may link to them. They are the older Open Graph cards (`dave-bettner-og.jpg` and `dave-bettner-og-interstellar.jpg`), 13 older headshot crops, `linkedin-banner.png`, `linkedin-profile.png` and `accounting-acceptance-lab-demo.png`. `public/media/accounting-acceptance-lab-walkthrough.mp4` stays for the same reason. Do not read any of them as the current design.

## Known gaps

These are listed so that nobody mistakes them for the current direction. Neither is fixed yet.

- The favicon (`public/favicon.svg`) is a dark "D" monogram with an orange dot from an earlier system.
- The social card behind `og:image` and `twitter:image` is dark and says "Financial systems consulting." Its alt text says the same. It matches neither the light theme nor the current positioning.
