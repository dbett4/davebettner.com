# davebettner.com credibility rebuild receipt

Date: 2026-08-11

## Implemented

- Repositioned the public identity toward AI implementation, solutions architecture, and forward-deployed enterprise delivery.
- Added GitHub identity links to primary navigation, content surfaces, contact actions, and JSON-LD.
- Replaced disconnected project storytelling with four repository-backed engineering cases and direct proof links.
- Centralized and corrected the public career timeline, including Chicago then Des Moines for the current LSL, LLP role.
- Anonymized the named healthcare client and removed unsupported practice-lead positioning.
- Added publication provenance and explicit public/private evidence boundaries.
- Rebuilt Fit prompt evidence around inspectable repositories and exact verified counts.
- Added maintainable one-column HTML résumé source and deterministic generation/verification script.
- Generated a one-page tagged PDF with GitHub, no phone number, no persona/version labels, and ordered ATS text extraction.
- Normalized fixed-width PDF creation/modification dates and added a two-generation SHA-256 reproducibility gate.
- Removed the duplicate `/fit` route.
- Fixed 320px/390px public-engineering-card overflow and added an H1 to `/fit/`.
- Changed project detail H1s from marketing headlines to actual project identities.
- Replaced the obsolete modal-site browser suite with a self-contained production-build audit.
- Repaired Fit-provider serialization and added click-level provider/copy interaction proof.
- Removed a dead mobile fragment link and added route-wide fragment-target assertions.
- Restored keyboard-visible skip links on Experience and Work and added route-wide focus assertions.
- Added a read-only GitHub Actions verification workflow for résumé generation, checks, build, and browser tests.
- Made Fit require a non-empty job description, enforce a 12,000-character limit, copy every valid prompt, and use provider pre-fill only when the launch URL is at most 7,500 characters.
- Added actionable `aria-invalid` and live-status behavior for invalid Fit input.
- Repaired the hero Experience CTA so it opens the career timeline rather than presenting a PDF download as an in-page action.
- Replaced two dead mockup links with the existing Rig-inspired route.
- Removed obsolete dither route files and added permanent redirects for `/dither` and `/mockups/dither`, with and without trailing slashes.
- Added an independent final-audit regression suite covering Fit boundaries, safe URL fallback, CTA semantics, redirect declarations/statuses, and mockup-link health.

## Verification

```text
npm run generate-resume
RESUME_PDF_PASS
first_line=Dave Bettner
pages=1

npm run check
0 errors, 0 warnings, 0 hints

npm run build
15 pages built
build complete

npm test
RESUME_REPRODUCIBILITY_PASS
sha256=e4c67657a8f1460b458a5fa9d73740a0e7c772920cb6960aca6bbb6ddc11c500
171/171 route/browser assertions passed
19/19 local final-audit assertions passed
190 total local assertions passed

SITE_URL=https://davebettner.com npm test
171/171 live route/browser assertions passed
27/27 live final-audit assertions passed
198 total live assertions passed
```

Browser assertions cover:

- desktop, tablet, 390px, and 320px layouts;
- no horizontal overflow;
- every same-page fragment link resolves to an element ID;
- every audited route has one skip link that enters the viewport on focus;
- one H1 per public route;
- no broken images or console errors;
- four public repository-backed engineering cards;
- direct repository links and exact proof markers;
- canonical metadata and GitHub JSON-LD identity;
- corrected career timeline and client anonymization;
- recruiter Fit payload evidence;
- Fit-provider JSON parsing, copied-prompt content, launch URL, window count, and status readback;
- empty and oversized Fit inputs open no provider and expose accessible invalid state;
- long valid Fit prompts copy successfully and open the provider base URL rather than an oversized pre-fill URL;
- the hero Experience CTA opens `/experience/` and is not marked as a download;
- all public mockup-index links resolve;
- all four legacy dither path variants return HTTP 301 to `/preview-dither/`;
- public PDF response and content type;
- sitemap inclusion for indexed routes;
- custom 404 behavior.

PDF verification covers:

- one Letter page;
- tagged PDF with no JavaScript or suspicious objects;
- two generations across a timestamp boundary produce identical SHA-256;
- downloaded production PDF SHA-256 matches the local generated artifact;
- first extracted line is `Dave Bettner`;
- contact, career, engineering, skills, and education markers appear in order;
- public phone number is absent.

Visual proof images retained outside the public source snapshot:

- `research/production-qa/desktop-1440.png`
- `research/production-qa/mobile-320.png`
- `tmp/resume-pdf/rendered/resume-page.png`

Visual review found no release-blocking clipping, overlap, broken grid, or PDF truncation. Secondary copy is intentionally dense and remains a non-blocking polish opportunity.

## Publication state

Deployed to Cloudflare Workers custom domain `https://davebettner.com` on 2026-08-11.
Public source repository: `https://github.com/dbett4/davebettner.com`.

```text
Current Version ID: ba1d5ac6-81e2-4d26-a053-ee717191b5ef
Custom domain: davebettner.com
Live verification: 171/171 route assertions + 27/27 final-audit assertions passed
Live PDF SHA-256: e4c67657a8f1460b458a5fa9d73740a0e7c772920cb6960aca6bbb6ddc11c500
```

The first post-deploy run of an earlier repaired version reached the prior edge snapshot;
a complete immediate rerun reached the new version and passed. During final-audit
publication, production verification then found that the retained legacy dither route
directory caused Cloudflare to canonicalize `/dither` with HTTP 307 before `_redirects`
could apply. The obsolete route files were removed and a new version deployed. Final
live readback confirmed HTTP 301 for all four slash/no-slash legacy paths. Both transient
observations are preserved rather than omitted.
