# Product

<!-- impeccable:product-schema 1 -->

**As of:** 2026-09-28, origin/main `db648b8`. davebettner.com still serves `f17d6c2`, whose pages match this build except for two unused `.skip-link` rules in the homepage stylesheet.

## Platform

web

## Users

Primary users are hiring managers, recruiters and technical leaders evaluating Dave Bettner for customer-facing technical roles: forward-deployed, solutions and implementation work, where software, including AI-enabled software, has to be put to use inside a customer's environment. Within seconds they need to know who Dave is, what Dave owns with customers, and what evidence backs it.

## Product Purpose

This site is Dave Bettner's personal, employer-independent profile. It makes Dave's lane legible: customer-facing technical implementation, from requirements through go-live, backed by hands-on Python and AI-assisted tools. It connects that lane to a customer-delivery record that starts in 2015, and it gives visitors direct paths to the projects, the experience timeline, the résumé and email.

Success means a qualified visitor can quickly identify Dave, understand the roles Dave is after, tell customer-delivery experience apart from personal engineering projects, and take the next step without decoding a product narrative.

## Positioning

The site leads with customer-facing technical delivery. The homepage line is "I help customers put complex software to work." Financial reporting is the deepest domain and healthcare integrations show range; both are proof, not the identity. Accounting is Dave's education and domain knowledge. The site presents Dave's career as software implementation and customer delivery, and never describes Dave as an accountant or CPA. Personal AI projects appear as what Dave is building, alongside the delivery record, not as client deployments. The site keeps honest boundaries around production-software depth, client environments, affiliations and lab evidence.

## Operating Context

The profile is evaluated during recruiting, role-fit review, professional networking and technical diligence. On desktop and mobile, visitors read the homepage, the Experience timeline, the connected-reporting engagement summary, the Approach page, the project pages and their GitHub repositories, and the résumé PDF.

## Capabilities and Constraints

- The homepage leads with Dave's name, the positioning line, a short lede and three actions (Explore my work, Download résumé, Get in touch) beside the workstation illustration. A proof strip, the experience summary, the connected-reporting engagement and the two featured projects follow.
- Routes: Experience (`/experience/`), Projects (`/work/` and `/work/<slug>/`), the engagement summary (`/experience/connected-reporting/`), Approach (`/fit/`), About (`/about/`) and a 404 page. `/lab/accounting-acceptance/` redirects to `/work/accounting-acceptance-lab/`. Contact is by email, GitHub and LinkedIn links. The site has no forms, accounts, API, hosted model or checkout.
- Projects come from `src/data/profile-projects.ts`. The two featured projects are the Accounting Acceptance Lab and the Regulated Reporting MCP. Five more follow: the failed-write recovery lab, repeat-work prevention, the agent evaluation kit, the spreadsheet review tools, and a note on how the projects fit together. Each carries a scope line that states its limits.
- The customer-delivery record, from `src/data/experience.ts`: SEC reporting and XBRL services at Workiva (2015–2021); medical-imaging and EHR integrations in HIPAA-controlled environments at Ambra Health; financial-reporting and GRC implementations as a Workiva Solutions Architect; a connected-reporting implementation and a five-person implementation team at Citrin Cooperman; and, currently, Workiva delivery for city and county finance teams at LSL.
- The résumé download is Dave's supplied PDF, served byte for byte. `npm run generate-resume` copies `resume/dave-bettner-current.pdf` to `public/` only if its SHA-256 matches the recorded hash, and the tests check the file visitors download. Replacing it requires a new file from Dave and an update to the recorded hash in `scripts/generate-resume-pdf.mjs` and the tests.
- The site is live but kept out of search. Every page carries `noindex, nofollow`, `robots.txt` disallows all crawlers, and `llms.txt` calls it a private revision not yet approved for publication. Tests enforce the meta tag. Opening the site to search engines is Dave's decision.
- Photographs of Dave (the masthead headshot, the About portrait and the social card) must use the supplied source pixels. Do not regenerate or alter Dave's face, head, neck, body, suit, pose or crop, and do not add synthetic content to them.
- The homepage illustration is a stylized image, not a photograph, and is never presented as one. Dave, the room and the dog's resting pose come from the approved artwork. The dog's motion is a disclosed image-to-video generation, and Dave's pixels are never regenerated. Changes to the artwork or its motion are Dave's decision; see `DESIGN.md`.
- Do not imply that public labs or personal projects are client tenants, client deployments, production-engineering tenure, or an affiliation with Nous or Hermes.
- Do not build the identity on a product, cable, rack, routing, workflow or infrastructure metaphor. Dave is the subject; the hero shows Dave at work.

## Evidence Boundaries

- Personal projects are labeled as personal projects. Each carries a scope line stating what it is and what it is not, such as synthetic records, mock data or a fictional workbook. None is presented as a client deployment, a live customer tenant, or evidence of autonomous correctness.
- Public repositories linked from the site are sanitized extracts published for inspection. They hold no client data or credentials. GitHub dates are publication dates, not original delivery dates.
- Client work appears only as engagement summaries. The connected-reporting page states that the client identity and implementation materials are not public and that it is not a live demonstration.
- Experience statements mirror Dave's supplied résumé. Do not embellish them or add metrics.
- AI-assisted work on client reporting is described with human review before any client change.
- No testimonials, client logos, private client artifacts, production usage metrics or unsupported performance claims may be fabricated.

## Brand Commitments

- Name: Dave Bettner.
- Identity: a personal, employer-independent profile of a customer-facing technical implementation lead.
- Voice: first person, direct, plain, technically specific, concise, and honest about evidence boundaries.
- Positioning priority: customer-facing technical delivery first; financial reporting and healthcare as the domains where it was done; personal AI projects as current building work.
- Title and location: the current title is Senior Manager, which is also the `jobTitle` in the site's structured data. Location and employment history preserve Chicago followed by the current Des Moines, Iowa. Omit "Remote" from job locations. The site currently shows only Des Moines, and job entries carry no locations.
- Visual identity: the light workstation profile described in `DESIGN.md`. There is no other public theme.

## Evidence on Hand

- Page copy: `src/pages/index.astro` for the homepage, and the other files in `src/pages/`.
- Identity metadata: `src/data/seo.ts`, which holds the site title and description and the schema.org `Person` (job title Senior Manager, home location Des Moines, Iowa).
- Employment history: `src/data/experience.ts`, taken from Dave's supplied résumé.
- Projects and their scope lines: `src/data/profile-projects.ts`.
- Résumé: `resume/dave-bettner-current.pdf`, served as `public/dave-bettner-resume.pdf`. `resume/dave-bettner-resume.html` is an older source that no longer produces the download.
- Photographs: `public/images/dave-bettner-headshot-20260808-square.webp` (masthead) and `public/images/dave-bettner-headshot-20260816-cutout.png` (About portrait and structured-data image).
- Illustration: `public/images/workstation-loop-poster.webp`, its 760px version and `public/video/workstation-loop.mp4`, built from `animation/workstation-loop/`. The generated dog clip's provenance is in `animation/workstation-loop/art/dog-ai/generation.json`.
- Tests that encode the positioning and boundaries: `scripts/ramp-profile.test.mjs`, `scripts/verify-ramp-profile.py` and `scripts/verify-visitor-journey.mjs`.
- `public/llms.txt`, the social card (`public/images/dave-bettner-profile-social.jpg`) and the headline of the supplied résumé still describe Dave as an accounting technology or financial systems consultant. The résumé is Dave's document and a source for employment facts; `llms.txt` and the social card lag the current positioning. None of them is a source for positioning copy.

## Product Principles

1. Identity before framework: visitors meet Dave before any method or proof system.
2. Delivery before domain: customer-facing technical delivery leads; financial reporting and healthcare substantiate it; accounting is education, not identity.
3. Proof with boundaries: every technical or customer-delivery claim remains inspectable and honestly scoped.
4. Judgment stays visible: the Approach page and the project pages show how Dave works (scope, approvals, evidence and recovery) without turning a process diagram into the identity.
5. Short path to action: projects, experience, the résumé and email are one click from the homepage.

## Public Route System

One layout (`src/layouts/Profile.astro`) and one light theme serve every route. Home is the only route with the illustration and adds `workstation.css`; the engagement summary adds `depth.css`. Experience, Projects, each project page, the engagement summary, Approach, About and 404 share one route-introduction grammar. There are no preview or mockup routes, and `/mockups/` returns 404.

## Accessibility & Inclusion

The site must stay keyboard navigable, with a skip link first and a visible focus ring. It must stay responsive from 320px to 1440px without horizontal scrolling, keep all text above 4.5:1 contrast, pass axe at WCAG 2.2 AA on every route, and work without JavaScript, where the hero falls back to its poster. CSS motion honors `prefers-reduced-motion`. The hero loop does not: by Dave's decision it plays for everyone and has no pause control, which departs from WCAG 2.2.2 (Pause, Stop, Hide). Do not change that without Dave's decision.
