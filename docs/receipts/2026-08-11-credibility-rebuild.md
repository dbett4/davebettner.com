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
- Removed the duplicate `/fit` route.
- Fixed 320px/390px public-engineering-card overflow and added an H1 to `/fit/`.
- Changed project detail H1s from marketing headlines to actual project identities.
- Replaced the obsolete modal-site browser suite with a self-contained production-build audit.
- Repaired Fit-provider serialization and added click-level provider/copy interaction proof.
- Removed a dead mobile fragment link and added route-wide fragment-target assertions.
- Restored keyboard-visible skip links on Experience and Work and added route-wide focus assertions.
- Added a read-only GitHub Actions verification workflow for résumé generation, checks, build, and browser tests.

## Verification

```text
npm run generate-resume
RESUME_PDF_PASS
first_line=Dave Bettner
pages=1

npm run check
0 errors, 0 warnings, 0 hints

npm run build
17 pages built
build complete

npm test
171/171 browser assertions passed

SITE_URL=https://davebettner.com npm test
171/171 live browser assertions passed
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
- public PDF response and content type;
- sitemap inclusion for indexed routes;
- custom 404 behavior.

PDF verification covers:

- one Letter page;
- tagged PDF with no JavaScript or suspicious objects;
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
Current Version ID: 331aa1b6-f781-4bcb-aada-0b7b7730b9e3
Custom domain: davebettner.com
Live verification: 171/171 assertions passed
```

The first post-deploy run reached the prior edge version and correctly failed the new
fragment-target and skip-link-focus assertions. A complete immediate rerun reached the
new version and passed 171/171. The transient rollout observation is preserved rather
than omitted.
