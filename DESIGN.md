---
name: Dave Bettner
updated: 2026-10-09
implementation: src/styles/theme.css, src/styles/profile.css, src/styles/workstation.css
stack: Astro, native HTML and CSS
---

# Dave Bettner design system

The current white professional profile is authoritative. The existing Profile
layout, workstation hero, project rows and case studies supply the primitives.
Use the shadcn DESIGN.md workflow to keep tokens and components aligned.

## Colors

| Role | Token | Value |
| --- | --- | --- |
| Page | `--page` | `#FFFFFF` |
| Secondary / raised surface | `--surface`, `--surface-raised` | `#F8F9FB`, `#F4F6F8` |
| Text and action | `--text`, `--accent` | `#181B20` |
| Secondary text | `--secondary` | `#5D626C` |
| Decorative divider | `--border` | `#E3E6EB` |
| Action text | `--accent-contrast` | `#FFFFFF` |
| Pointer hover | `--accent-hover` | `#33373E` |

The site has one light theme. Focus uses a 3px ink outline with 3px separation.
Text and controls retain meaningful contrast; decorative dividers define rows,
not the only boundary of an interactive control.

## Typography and layout

Self-hosted Archivo Variable is the UI and editorial face. Body is 17px/1.6,
16px on phones; secondary text is 14–19px according to its role. Profile headings
use the existing responsive scale; the workstation stylesheet intentionally
narrows the home hero. Do not replace that hierarchy with the former Interstellar
sphere layout. The main column is 1120px with 32px desktop gutters, changing to
16px phone gutters and a 560px reading column.

## Primitives and elevation

Reuse Profile.astro, .wrap, .masthead, .actions, .button, .project, .timeline,
.prose, .paper and native details/summary. Buttons use --radius-control: 7px;
the primary button is 49px minimum and the compact hero action is 46px.
Text actions and summaries retain 44px targets. Elevation comes from neutral
surfaces and complete rules; no floating card system is needed.

Preserve the current portrait assets and fade, substantive project evidence,
case-study disclosure, résumé download, heading order, skip link and page
navigation. Never regenerate or stylize Dave's portrait.

## Motion and states

--duration-ui is 180ms and --ease-out is cubic-bezier(.23, 1, .32, 1).
Button hover runs only with a fine pointer. Press scales to .97; reduced motion
removes that transform and preserves the site's reduced animation policy.
Keep visible keyboard focus independent of button text. The hero's existing
video and avatar behavior remain separate, with their native verification.

## Do's and Don'ts

Use current approved assets and source-backed professional claims. Keep plain
headings, restrained photography and content-led sections. Avoid eyebrows,
status pills, one-sided accent bars, decorative mascots, italic accent words,
new dashboard tiles, helper slogans and blanket preset replacement.

## Verification

Run the project's build, profile tests, deployment preflight tests and native
browser suite. Inspect desktop and phone routes, focus, overflow, font/image
loading, contact/résumé navigation and reduced motion. Keep this file synchronized
with the imported styles; this site does not need React, Tailwind or a new kit.
