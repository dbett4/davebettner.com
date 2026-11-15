Working Record claim-boundary rework handoff

Revision: 5baf033f1bcd99ad565155a14342330189856f03
State: local, committed, unpublished. No deploy, push, publication, external send, credential change, or portrait pixel change performed.

Changes
- Résumé summary now says “leading 0-to-1 enterprise deployments,” preserving a leadership claim without implying ownership of production systems or tenants.
- Résumé removes the universal “every generated link and formula” wording and bounds generated-output review to human review before delivery.
- Résumé removes client source-ledger implementation detail and uses bounded municipal reporting language.
- public/llms.txt now addresses hiring, recruiting, technical diligence, forward-deployed engineering, solutions engineering, and technical implementation; it does not offer a consulting engagement.
- scripts/verify-audit-regressions.mjs asserts all four claim boundaries and the supported audience wording.

Verification
- npm run test: PASS (includes résumé and OG reproducibility, 2-page résumé check, portrait gate, Astro build, 894 audit checks, responsive checks, and deploy preflight tests).
- npm run check: PASS (0 errors, 0 warnings, 0 hints).
- npm run build: PASS (17 page(s) built).
- capture-working-record-review.mjs: PASS; desktop/mobile deterministic capture packet generated with 11 responsive/accessibility configurations and no failures.
- Résumé PDF: 2 pages; RESUME_REPRODUCIBILITY_PASS.
- OG image: 1200x630; OG_REPRODUCIBILITY_PASS.
- Portrait: approved exact SHA-256 and declared 1312x1199 dimensions; portrait gate passed.
- Working tree: clean after local commit.

Visual judgment boundary
- Approved Claude visual route was attempted freshly with `claude auth status --text`.
- BLOCKED: Claude reports “Login: Expired — log in again” and exit code 1. No alternate model was substituted or counted as visual judgment.
- Screenshots and vision_review_packet.json are capture evidence only, not a Claude visual verdict.

Artifacts
- vision_review_packet.json
- desktop-fold-1440x900.png
- desktop-full-1440x900.png
- mobile-fold-390x844.png
- mobile-full-390x844.png
