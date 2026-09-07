# Candidate vision review packet

- candidate_commit: a2456f6f2d53b07ba2ee6968ca54d35d9a71e853
- effective_route: openai-codex:gpt-5.6-luna
- status: reviewable local candidate; unpublished; not VERIFIED or ADOPTED
- source_scope: exact four-file correction copied read-only from t_3a62a7f3
- changed_files:
  - src/pages/index.astro
  - public/styles/editorial-paper-system.css
  - public/styles/premium-profile-correction.css
  - public/styles/tailored-monograph.css
- correction: no rendered `.cover-support`; dead `.cover-support` CSS removed; verifier zero-count assertion preserved
- historical_note: earlier third-line complaint is stale/misbound historical evidence; current candidate has support_count=0

## Fresh capture evidence

| viewport | path | sha256 |
|---|---|---|
| 1440x1000 | research/vision_review_packet/captures/desktop-1440x1000.png | e8cf4d94111cb57c3e953fbfa398da2f3bfb26525843f5247b463a57b4fa4e87 |
| 1280x720 | research/vision_review_packet/captures/desktop-1280x720.png | ce2ed575769672f2b404a0b9e56be80d4f3547ea5d18f18724caff67cf79286b |
| 390x844 | research/vision_review_packet/captures/mobile-390x844.png | 48fbdb6bc2e8a142e5600853486f7d53ba42a3d61d0ebf036b4c82815b6a1f54 |
| 320x844 | research/vision_review_packet/captures/mobile-320x844.png | 668e59f417cd48a9974d36c7cc32a47eba8c7db949c1a0ee463af6f850bd9f91 |

## DOM/layout readback

- support element count: 0 at all four viewports
- horizontal overflow: none; scrollWidth equals clientWidth at all four viewports
- desktop 1440 portrait: x=548.156, y=259.359, width=840, height=767.641; h1 x=80, y=334.719, width=716.797, height=248.813
- desktop 1280 portrait: x=489.5, y=16.797, width=793.594, height=725.234; h1 x=24, y=203.016, width=689.906, height=221.156
- mobile 390 portrait: x=14, y=766.359, width=362, height=330.813; h1 x=14, y=332.531, width=362, height=140.375
- mobile 320 portrait: x=14, y=815.438, width=292, height=266.844; h1 x=14, y=373.891, width=292, height=92.156

## Gates

- npm run test: PASS; 888 checks; DEPLOY_GATE_TEST_PASS
- npm run check: PASS; 0 errors, 0 warnings, 0 hints (included in test/build)
- npm run build: PASS; 17 pages; existing Vite chunk-size warning retained separately
- git diff --check: PASS
- portrait gate: PASS; approved exact SHA-256 and declared intrinsic dimensions
- responsive/accessibility/reduced-motion/design QA: PASS through bundled test harness and fresh capture DOM checks
- publication/deploy: not run; candidate remains local and unpublished

The packet is bound to this committed revision and these newly generated captures, not the prior `/tmp` evidence.
