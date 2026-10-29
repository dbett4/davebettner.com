---
name: Dave Bettner
updated: 2026-10-28
implementation: src/styles/theme.css, src/styles/profile.css, src/styles/workstation.css
stack: Astro, native HTML and CSS
---

# Dave Bettner design system

The current white professional profile is authoritative. The existing Profile
layout, workstation hero, project rows and case studies supply the primitives.
Use the shadcn DESIGN.md workflow to keep tokens and components aligned.

The profile leads with enterprise delivery and practical AI workflows: selected products follow
the introduction, then the AI-assisted building approach and customer-delivery
background. Projects lead the navigation. Homebase leads selected work in a full-width
feature with a dedicated case study and an explicitly fictional sandbox capture.
Passal, Leasekite, Krowbar and Lockfield follow; their existing screens and status remain.
Des Moines is the current location, with relocation open globally. Employment history
remains separate from the current product-building role.

The headline names AI tools and agent workflows. The introduction supplies concrete enterprise-delivery experience and a linked internal cash-flow review example; site-hosting details remain in the building section and notes.
Technical walkthroughs add inspectable product education to that positioning.
Reuse the existing project rows and prose for lessons. Interactive teaching
examples use labeled native controls, visible source and result tables, and
plain status text. Fictional data and local execution are stated beside the demo.
Build notes and a dated Now page make current work and the reasoning behind it
discoverable. Primary navigation is Projects, Notes, Now, About and Résumé; Approach and
Experience remain in the footer. The homepage keeps Homebase first and replaces
the repeated business-workflow summary with recent build notes. Notes use the
same light theme, neutral dividers and native links, with a 760px reading column,
17px desktop prose and 16px phone prose. Publication dates sit below article
headings, and note lists use dates with project names as useful metadata. RSS is
linked from the head, footer and Notes page. Résumé is also linked in the main
navigation so a recruiter can open it without scrolling. No counters, subscriber claims,
newsletter forms or publishing cadence are implied.

The homepage building section links the Cloudflare build note and names Cloudflare Workers and Wrangler alongside
their actual role in publishing this Astro site. Supporting copy connects AI
coding tools, product frameworks, GitHub, and browser checks to the work they
perform. Use ordinary prose and links in the existing section. Keep Homebase
first in selected work and keep each product's hosting claims scoped to evidence.
The Cloudflare build note explains the site's release workflow without exposing
private infrastructure, client records, or credentials.

The current operating stack is documented in a build note and the existing
AI workflows page, with short links from the homepage, Now, and Approach.
Explain T3 as the coding workspace with a VPS-hosted backend, Hermes as the
ongoing coordination runtime, and Cloudflare as this site's publishing host.
Use the existing prose and definition-list layouts. Describe roles and working
practices without publishing private addresses, service paths, or account details.
Keep the full technical explanation in the operating-stack note. It distinguishes
SQLite session state from Git source files, model routing from VPS tool execution,
and project memory from current application state. Use the site's actual release
process as the worked example and link related notes and the recovery lesson.

The downloadable resume uses the same AI tools and agent-workflows direction, with concrete implementation experience and an internal review example in the summary. Public teaching examples do not establish a creator audience.

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

Self-hosted Manrope is the single UI and editorial face, using the existing
approved font asset. Body is 16px/1.7; selected-project copy is 15px/1.7. The
home heading is 32–42px, with a restrained 600 weight and 1.2 line height.
Phones use 30px/36px headings and 16px/28px lead copy for an even reading rhythm
and stable scene alignment. Secondary headings are 23–28px. The main column remains 1120px
with 32px desktop gutters, changing to 16px phone gutters and a 560px reading
column. The workstation scene retains 360px maximum on desktop and 260px on
phones so its existing cutout preserves the approved foreground detail.
Passal and Leasekite have larger parallel previews; Lockfield sits in a quieter
full-width supporting row. Phones retain one project per row and the existing
approved screenshot crops. The editable résumé and its PDF use Manrope, a
compact contact block, clear section spacing, and no footer or page numbers.

Krowbar uses a full-width product row with its reviewed public-demo capture.
Its title opens /work/krowbar/ and its demo link opens krowbar.app. Keep the
fictional-data and simulated-update scope in the project description. The project
page reuses Profile, case-prose and the existing action styles.

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
