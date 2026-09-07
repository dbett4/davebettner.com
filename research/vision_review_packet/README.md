# Candidate vision review packet

- source_commit: 915fc4e (deployable site correction revision)
- evidence_commit: this commit (exact hash is supplied in the handoff; packet deliberately avoids impossible self-hash claims)
- binding: evidence_commit^1 == source_commit; source_tree_hash: 2c2089e05e9d383112d084721b858659677ffc6a (reproduce with `git rev-parse 915fc4e^{tree}`)
- effective_route: openai-codex:gpt-5.6-luna
- status: reviewable local candidate; unpublished; candidate only; not VERIFIED or ADOPTED
- deployable_revision: source_commit (site correction only)
- evidence_revision: evidence_commit (this packet and captures; not a deployable site change)
- source_scope: exact four-file correction preserved from the prior durable candidate
- changed_source_files:
  - src/pages/index.astro
  - public/styles/editorial-paper-system.css
  - public/styles/premium-profile-correction.css
  - public/styles/tailored-monograph.css
- correction: no rendered `.cover-support`; dead `.cover-support` CSS removed; verifier zero-count assertion preserved
- historical_note: earlier third-line complaint is stale/misbound historical evidence; current candidate has support_count=0

## Capture evidence

The `*-fullpage.png` files retain the prior full-page evidence with truthful names. The viewport-named files are exact top-of-viewport crops.

| viewport | path | dimensions | sha256 |
|---|---|---:|---|
| 1440x1000 | research/vision_review_packet/captures/desktop-1440x1000.png | 1440x1000 | 0023240680b19bf49746c7d8dbad89ff623593490386b7d42330450945d216bc |
| 1280x720 | research/vision_review_packet/captures/desktop-1280x720.png | 1280x720 | a66c2f52c0aa11a07e6106e060f078fd97e8702ee8d8409593e3047ee7c5f23c |
| 390x844 | research/vision_review_packet/captures/mobile-390x844.png | 390x844 | d0c23fbe6e8a2c549df01767ed5031751545a3b6e1fa40e403b92ab54b9a9109 |
| 320x844 | research/vision_review_packet/captures/mobile-320x844.png | 320x844 | db4bbc4d6d534d386e5fd546cffc281c4712bb0ea46d2d7f2d1408be868b9044 |

## DOM/layout readback

- support element count: 0 at all four viewports
- horizontal overflow: none; scrollWidth equals clientWidth at all four viewports
- desktop 1440 portrait: x=548.156, y=259.359, width=840, height=767.641; h1 x=80, y=334.719, width=716.797, height=248.813
- desktop 1280 portrait: x=489.5, y=16.797, width=793.594, height=725.234; h1 x=24, y=203.016, width=689.906, height=221.156
- mobile 390 portrait: x=14, y=766.359, width=362, height=330.813; h1 x=14, y=332.531, width=362, height=140.375
- mobile 320 portrait: x=14, y=815.438, width=292, height=266.844; h1 x=14, y=373.891, width=292, height=92.156

## Gates

- canonical gates required before downstream verification: npm run test, npm run check, npm run build, design QA, responsive/accessibility/reduced-motion/portrait/deploy-preflight, and git diff --check
- publication/deploy: not run; candidate remains local and unpublished
- claim boundary: candidate only; not VERIFIED or ADOPTED
