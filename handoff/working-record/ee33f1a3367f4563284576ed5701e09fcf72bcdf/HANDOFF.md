The Working Record claim-boundary rework

Exact local revision: ee33f1a3367f4563284576ed5701e09fcf72bcdf
Branch: wt/t_a66fb16f
State: local committed candidate; unpublished; not pushed or deployed

Corrections
- Résumé summary now says “10+ years leading 0-to-1 enterprise deployments,” framing the work as leadership rather than ownership of production systems or tenants.
- Résumé delivery language now says generated links and formulas go through human review before delivery. It removes the universal “every” wording and omits client source-ledger implementation detail.
- public/llms.txt now limits evaluation guidance to forward-deployed engineering, solutions engineering, technical implementation, recruiting, and technical diligence. The consulting-engagement invitation is removed.
- scripts/verify-site.mjs now asserts these claim boundaries and forbidden phrases without weakening existing visual, accessibility, responsive, portrait, or design-system checks.

Verification
- npm run test: PASS. Resume PDF generated reproducibly; 2 pages; OG reproducibility passed; portrait cutout passed; 894 browser checks passed; responsive case checks passed; audit regressions passed; deploy preflight passed.
- npm run check: PASS, 0 errors, 0 warnings, 0 hints.
- npm run build: PASS, 17 static pages built.
- git diff --check: PASS before commit.
- Exact revision capture packet: vision_review_packet.json at this revision.
- Mechanical capture: PASS across widths 320, 360, 390, 414, 768, 1024, 1440, reduced-motion 390, JavaScript-disabled 390, text-spacing 390, and 200%-zoom 768. All had one h1, one source portrait, zero canvases, no horizontal overflow, and complete readiness.
- Desktop/mobile captures are in this directory: desktop-fold-1440x900.png, desktop-full-1440x900.png, mobile-fold-390x844.png, mobile-full-390x844.png.

Visual judgment boundary
- Fresh approved Claude route attempted with `claude auth status --text`.
- Result: blocked because login is expired; Claude reports “Not logged in. Run claude auth login to authenticate.” No alternate model was substituted or counted.

No deploy, push, publication, external send, credential change, portrait pixel change, or test relaxation was performed.
