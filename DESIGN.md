# DESIGN.md

## 1. Direction & Feel

**Tailored Monograph + Evidence Ledger** is a profile-first editorial system for Dave Bettner. Dave—not a framework, product, or metaphor—is the subject. The opening establishes his name, customer-facing enterprise-agent deployment lane, concise claim, cleaned source portrait, and direct contact actions before presenting proof.

The visual character is tailored rather than SaaS: narrow uppercase type, silk-black and warm-ivory material fields, muted-gold seam lines, exact graphite rules, and restrained technical labels. The result should feel composed, personal, exact, and human. It must never require a visitor to decode a governing visual narrative before understanding who Dave is.

The portrait is source-bound. The production matte removes only semi-transparent edge contamination; every originally opaque RGB and alpha pixel remains unchanged. Never regenerate or composite Dave's face, head, neck, body, suit, pose, or crop.

## 2. Colors

| Token | Value | Use |
| --- | --- | --- |
| `--tm-silk` | `#090b0d` | Primary ground, dark sections, dark type on light surfaces |
| `--tm-black` | `#030405` | Deepest inset fields and strong actions |
| `--tm-ivory` | `#eee8d9` | Primary light surface and type on dark surfaces |
| `--tm-gold` | `#bd9250` | Seam lines, primary actions, state marks, closing field |
| `--tm-graphite` | `#33383d` | Rules and technical borders on dark surfaces |
| `--tm-slate` | `#939ca2` | Secondary copy on dark surfaces |

Muted gold is a seam and action signal, not decoration. Silk black and warm ivory carry most of the page. Graphite separates technical evidence without introducing dashboard chrome. Avoid decorative gradients, saturated signal colors, and generic neon-on-black AI palettes.

## 3. Typography

- **Display and body:** Archivo Variable with its width axis enabled. Display settings use `font-stretch` around 66–72%, moderate weights around 520–600, tight tracking, and uppercase composition. Body settings use readable sentence case at normal width.
- **Technical labels:** DM Mono at 0.66–0.72rem, uppercase, with approximately `0.06em–0.08em` tracking.
- The homepage name is two warm-ivory lines: `DAVE` and `BETTNER`. It is the dominant identity mark without relying on an accent color.
- Section titles are large, compact, and left aligned. Do not introduce serif display faces, generic geometric UI faces, centered marketing headlines, or unnecessary type families.

## 4. Components

### Masthead
A dark sticky bar with the compact name mark, three profile routes, and an outlined email action. Desktop is one row. Mobile intentionally becomes a compact identity row followed by the three-route row.

### Source Portrait
`src/components/KineticPortrait.astro` keeps the original WebP source as the visible image and retains its established source-pixel contract. The Tailored Monograph stylesheet suppresses the prior dither and scan overlays, so the cleaned source cutout is shown directly inside an authored gold seam field.

### Primary actions
Rectangular, bordered controls use DM Mono. The primary action is muted gold on dark surfaces and silk black on the final gold field. Do not convert actions into pill shapes.

### Proof ledger
Outcome stories use ruled rows rather than floating cards. Each row includes a small geometric mark, customer-delivery context, intervention summary, and result. Regulated delivery is vertical proof, not the full identity.

### Operating loop
A silk-black technical field preserves the existing Discover → Shape → Demonstrate → Deliver → Adopt content. Gold handoff rails clarify causality. It is supporting evidence below the identity and must not become the site's governing metaphor.

### Public engineering plates
Inspectable public projects use hard-edged plates with a dark visual register and a light evidence body. Synthetic and sanitized scope boundaries remain visible.

### Closing field
A full-width muted-gold field contains the final role-fit statement and contact actions. It is the strongest color moment on the page.

## 5. Layout & Spacing

- Maximum content width: `1440px` with a 24px desktop inset and 16px mobile inset.
- Opening desktop grid: three columns for name/role, source portrait, and claim/actions.
- Opening height: at least the viewport minus the 70px masthead.
- Section padding is based on the existing 4/8/16/24/32/48/64px scale, with large section openings using responsive `clamp()` values.
- Proof and work headings use a three-part desktop grid: small index, monumental title, supporting lead.
- Mobile collapses to one column. Metadata that delays the portrait is omitted at 720px and below.
- Horizontal evidence plates may scroll inside their own region on mobile; the document itself must never scroll horizontally.

## 6. Reusable Visual & Interaction Grammar

- Use exact 1px or 2px rules to structure information.
- Use gold seam lines only to frame the portrait or clarify a causal handoff. Do not apply decorative line textures to every surface.
- Hover and focus can reveal gold, underline a text route, or tint a ruled evidence row. Avoid generalized scale and lift animations.
- Motion must clarify state; the homepage portrait itself is static.
- `prefers-reduced-motion` disables animated transitions and keeps a static, readable portrait treatment.
- Focus states use a visible muted-gold outline with offset.
- Public proof must preserve repository links, claim limits, and provenance notes.

## 7. Responsive Behavior

- **Above 960px:** three-column hero, full navigation row, multi-column proof ledger, horizontal operating-loop stages.
- **721–960px:** hero stacks; portrait remains large; heading grids collapse; proof rows simplify.
- **720px and below:** two-row masthead, one-column hero, smaller but still monumental name, a wide primary action beside a compact résumé action, portrait immediately after actions, single-column proof, vertical operating loop, and horizontally scrollable evidence plates.
- Long uppercase headings must fit a 390px viewport without clipping. The root clips accidental horizontal paint while nested evidence scrolling remains available.
- The portrait uses a 4:5 mobile frame and contains no artificial blank tail.

## 8. What to Avoid

- No cable, rack, patch-panel, routing-map, workflow-transformation, flight-recorder, or other governing product metaphor.
- No product-style narrative that makes a visitor understand a system before understanding Dave.
- No regenerated portrait pixels, swapped backgrounds, composited heads, or altered clothing/body geometry.
- No generic SaaS hero, dashboard chrome, card wall, glowing AI orb, or excessive rounded containers.
- No overused display fonts or serif fallback on the homepage identity.
- No decorative line-field backgrounds that imitate generated UI texture without carrying information.
- No unsupported production claims, hidden provenance boundaries, or implications that public labs are client tenants.
- No duplicate primary actions in the same viewport.
