Working Record candidate handoff

Exact candidate

Worktree: /srv/hermes/work/davebettner.com/.worktrees/t_a81b80f3
Branch: davebettner-com/t_a81b80f3-canonical-implement-person-first-portfol
Commit: b5d8954566a72f4d4693d322bbbda8b6e324c231
Merge base with origin/main: 632ae5aaab9323422a02c5c242e58ebfe280bb6b
Release state: local, committed, unpublished. Nothing was pushed or deployed.

Preview

From the worktree, run:

    npm run dev -- --host 127.0.0.1 --port 4325

Open http://127.0.0.1:4325/ and review Home, Work, Experience, About, Fit, deep case routes, the résumé link, and the 404 route.

Before and after

Before: the portfolio mixed Interstellar/Tide/carbon SaaS styling, shader and canvas effects, multiple theme stylesheets, campaign portrait treatment, and a product-like homepage.

After: one site-wide Working Record system uses warm ivory paper, charcoal ink, safety orange primary actions, an editorial type/grid system, one unchanged supplied portrait, a compact person-first homepage, deep evidence routes, a recruiter-facing close, and a balanced generated résumé.

Scope

The exact diff from the merge base contains 44 files, 2,851 insertions, and 6,343 deletions. It:

- replaces the old public theme files with public/styles/working-record.css;
- rebuilds Home, Work, Experience, About, Fit, deep case, and 404 surfaces;
- adds shared Masthead and Footer components;
- removes shader, canvas, dither, sphere, signal-field, and campaign-presentation components;
- updates metadata, JSON-LD, OG source/output, portrait assertions, resume source/output, and verification contracts;
- adds scripts/capture-working-record-review.mjs for exact-revision responsive evidence.

Verification

- npm run test: PASS
- npm run check: PASS
- npm run build: PASS
- Responsive proof: PASS at 320, 360, 390, 414, 768, 1024, and 1440 px
- Reduced motion, JavaScript disabled, text-spacing override, and 200 percent zoom checks: PASS
- Desktop/mobile fold and full-page capture set: complete
- Visual rounds: two. The first found a partially visible hidden skip link; the second confirms the repair with no material coordinator-observed defects.
- Portrait SHA-256: b34ff1a55c4025f92593a8e2c6685f64dc2ba117604aaa0b1efbb52abb2fd102
- Portrait diff against the origin/main merge base: none
- Impeccable detector: run exactly once. Its colored side-border findings were fixed; its remaining flat-type-hierarchy warning was reviewed as non-material and is recorded in impeccable_detector_receipt.json.

Exact-revision artifacts

- desktop-fold-1440x900.png
- desktop-full-1440x900.png
- mobile-fold-390x844.png
- mobile-full-390x844.png
- vision_review_packet.json
- verification_receipt.json
- impeccable_detector_receipt.json
- claude_visual_review_prompt.md
- claude_route_receipt.json
- sol_advisory.json

Risks and review gate

Claude Sonnet 4.6 was attempted through the approved read-only Claude Code route, but that account's login was expired. No other model was silently substituted as the independent judge. sol_advisory.json is therefore explicitly marked NEEDS_REVIEW even though the bounded coordinator confirmation found no material defects. The pre-created brand-verifier child must inspect the actual diff, exact-revision screenshots, responsive behavior, claims, generated résumé, and receipts before this candidate can advance. Dave still owns adoption and any public release.
