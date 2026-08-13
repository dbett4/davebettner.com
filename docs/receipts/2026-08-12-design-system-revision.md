# Design system revision receipt

Date: 2026-08-12  
Worktree: `/srv/hermes/work/davebettner.com-signal-touch-release`  
Base: `25b68fce7e121ed8231f6f9240e78d2476ab6b45` (`origin/main` when the lane was created)  
Live version before release: `6ade429b-b642-40f6-a12a-c4aa90d2257e`  
Canonical checkout `/srv/hermes/work/davebettner.com`: not modified by this packet

## Status

**DEPLOYED AND VERIFIED — Git authority, Cloudflare activation, and live interaction contracts are green.**

Release commit: `8d5178abfeed46885d04df43c7259bda00198a27` on `origin/main`. Cloudflare version `6268a0a6-9d97-4a4b-bf4e-d828d5d9f51f` is active at **100%**.

The original Cursor worker could not run shell commands and correctly left this receipt as unverified. Hermes subsequently froze the worker output, corrected two false-negative browser assertions, ran the canonical suite and dedicated design QA, and visually reviewed all five required renders.

## Packet

| File | Change |
|---|---|
| `scripts/verify-site.mjs` | Touch/reduced-motion/HUD/WebGL-fallback regressions plus effective contrast, mobile IA, 44×44 targets, fold, responsive, loop, and Experience contracts |
| `src/components/SignalField.astro` | First-touch reveal without navigation, second-touch activation, reduced-motion persistence, static fallback activation, HUD/contact stacking, accurate affordance text |
| `src/data/homepage-framing.ts` | Shorter hero support and outcome framing |
| `src/data/public-proof.ts` | Clearer public-proof provenance boundary |
| `src/pages/experience/index.astro` | Shared new-industrial tokens and accessible timeline treatment |
| `src/pages/index.astro` | Proof/Experience/Fit/Contact IA, hiring-first mobile ordering, tighter hero, instrument-style operating loop, evidence chrome |
| `scripts/capture-design-revision-qa.mjs` | Five-viewport screenshots plus overflow, fold, and first-/second-touch assertions |
| `scripts/run-design-revision-qa.sh` | Canonical test + dedicated design QA runner |
| `docs/receipts/2026-08-12-design-system-revision.md` | Verification record |
| `docs/receipts/evidence/2026-08-12-signal-release/` | Six pre-release RED/GREEN artifacts plus the post-deploy live GREEN result |

Scratch prompt/probe files, a deploy-hook backup, and a duplicate screenshot-only helper were excluded.

## RED evidence — current production

Command: `SITE_URL=https://davebettner.com node scripts/verify-site.mjs`  
Artifact: `docs/receipts/evidence/2026-08-12-signal-release/live-production-red.json`  
SHA-256: `c07bfbf6daf0518119bf10213b53aa438e60aac3a2ebd532e123a07ee1fc2688`  
Result: **816 checks, 5 failures**

Confirmed failures:

1. Affordance label omitted touch.
2. Mixed mobile navigation had an inaccurate label.
3. Contact link was unlocked at touch `pointerup` (`lockedAtContactPointerup: false`).
4. HUD stacked above the resolved contact (`contactsZ: 3`, `hudZ: 4`, HUD opacity `1`).
5. Reduced-motion contact disappeared after focus left (`locked: false`, opacity `0`, pointer events `none`).

## GREEN evidence — current packet

### Canonical pipeline

Command: `scripts/run-design-revision-qa.sh`  
Log: `docs/receipts/evidence/2026-08-12-signal-release/canonical-runner.txt`  
SHA-256: `ed66c4352b9f1bb460fab604d43ee981d3fe144d89b48b4efb57d6cb096571d1`

Result:

- Résumé generation/reproducibility: pass
- OG generation/reproducibility: pass
- Astro check: **0 errors, 0 warnings, 0 hints**
- Static build: **15 pages**
- Site verifier: **938/938**
- Audit regressions: **21/21**
- Deploy-gate pre-push probes: pass, including missing session, primary checkout, and dirty worktree rejection

Focused verifier artifact: `docs/receipts/evidence/2026-08-12-signal-release/touch-lifecycle-green.json`  
SHA-256: `3bc23e5f07bd2c3fddaaa2a44dfdba1dfbdc4e466ba65e99a15a8349d928c906`

Touch proof:

- First contact activation stayed on `/`, set the lock, fired the click, prevented navigation, and settled at opacity `1` with pointer events `auto`.
- Second intentional activation navigated to `/fit/`.
- Mouse click navigated to `/fit/` after hover resolution.
- Keyboard Enter navigated to `/fit/` after a prior touch lock/unlock cycle; the click guard now binds only to the current touch pointerdown on the same contact rather than sticky prior-pointer state.
- Canceled touch gestures and touch sequences that end without a synthesized click expire their one-gesture marker before later keyboard activation.
- Reduced-motion contact remained locked, visible, and actionable after focus and touch changes.
- Resolved contacts stacked above the HUD and hid it.
- With WebGL forcibly unavailable, the static fallback was visible, locked, pointer-active, and opened `/fit/` on the first touch.
- Delivery-outcome context text rendered at **5.40:1** effective contrast at both 390px and 320px after removal of the opacity reduction.

### Dedicated design QA

Command: `node scripts/capture-design-revision-qa.mjs`  
Log: `docs/receipts/evidence/2026-08-12-signal-release/design-qa-9-of-9.txt`  
SHA-256: `ae76abd39c7787a07d2a8a694a6914f557208fdbf2f9bf7d0d2d3f0816e536fd`  
Result: **9/9**

Verified:

- No horizontal overflow at 1440×900, 1280×720, or 390×844 homepage widths.
- No horizontal overflow on desktop/mobile Experience.
- Primary hiring CTA is fully in the first viewport at 1280×720 and 390×844.
- First touch reveals without leaving; second touch opens `/fit/`.

## Visual evidence

| Render | SHA-256 |
|---|---|
| `research/production-qa/homepage-desktop-1440x900.png` | `9aafb4e50e03146429e825203c02fe3956c4b3e23d1257bf19bc17c430985c71` |
| `research/production-qa/homepage-laptop-1280x720.png` | `5e0ecfc44a53011e934c3e11a7f247c5bc2c1d05f16ffd94ca18a5f43d92a1b9` |
| `research/production-qa/homepage-mobile-390x844.png` | `deb365761c2b7d22de2803fbab5e4f4aaad297748a5560dfee30d4f23022f4f9` |
| `research/production-qa/experience-desktop-1440x900.png` | `e914a3aacedfbb310e0f372e7f48518c5d92b320ec73a46b5cfbe260322e8aef` |
| `research/production-qa/experience-mobile-390x844.png` | `0ce8d53a0a245555caeb8e8875d69fb4c9fe6c095cc144b4ebcd0752a430d04b` |

Visual disposition: **PASS**. Hero/CTA hierarchy is clear on desktop, short laptop, and mobile; mobile navigation is readable; the CTA remains above the fold; Signal Field and Experience have no clipping or release-blocking overlap; the Experience dot field does not impair readability.

The five PNGs are gitignored, worktree-local visual evidence. Their current digests are recorded above; the durable committed proof bundle contains the machine-readable RED/GREEN outputs and logs, not the image binaries.

## Review state

The focused three-file touch repair received an independent **APPROVE** with no P0–P3 findings after its test-harness correction. Combined-packet review then found four concrete residual classes: 3.94:1 effective proof-context contrast, inaccessible early-return behavior when WebGL initialization fails, stale touch modality blocking later keyboard activation, and an unexpired marker after canceled/abandoned touch gestures. Each now has RED/GREEN browser coverage: 5.40:1 contrast, one-touch static-fallback navigation, successful mouse/keyboard navigation alongside first-/second-touch behavior, and marker cleanup after `pointercancel` or a touch sequence without click. Keyboard RED artifact: `docs/receipts/evidence/2026-08-12-signal-release/hybrid-keyboard-red.json` (`875440e3f0e370f781d2897c36f3c39e9668216ace6182f662c5fae02dbd34d2`). Touch-lifecycle RED artifact: `docs/receipts/evidence/2026-08-12-signal-release/touch-lifecycle-red.json` (`3ef5adf9ac86e1e7a4db36db7b03a7c3433fdb21e128744ce9bb84972ece26d0`). The definitive source review found no further product-code finding; it identified only stale evidence citations in this receipt after the final QA recapture. Those citations now point to durable, hash-matched files. Independent receipt-integrity review approved the exact 15-path packet with zero P0–P3 findings; the reviewed pre-correction receipt SHA-256 was `83a183151137d87a1541f3ef44608ca9a10a04c15cfdd2f29782a2e1ae6d11cc`.

## Release gate — completed

The release followed the required order:

1. Final source and receipt-integrity reviews approved with zero P0–P3 findings.
2. Exactly nine implementation/receipt files plus six durable pre-release evidence files were staged.
3. Commit `8d5178abfeed46885d04df43c7259bda00198a27` was pushed by non-force fast-forward; `HEAD == origin/main == remote main`.
4. Session `hermes-davebettner-signal-release-20260813` acquired the repository-deploy and `cloudflare-worker:davebettner-com` ACP leases.
5. Wrangler ran the native preflight before and after generation/build from the clean linked worktree; both passed at the release commit.
6. Cloudflare deployment `bb8f7f82-4199-457a-ad37-07e80cad12c1` activated version `6268a0a6-9d97-4a4b-bf4e-d828d5d9f51f` at **100%** on `davebettner.com`.

## Post-deploy live proof

Command: `SITE_URL=https://davebettner.com node scripts/verify-site.mjs`

Artifact: `docs/receipts/evidence/2026-08-12-signal-release/live-production-green.json`

SHA-256: `3bc23e5f07bd2c3fddaaa2a44dfdba1dfbdc4e466ba65e99a15a8349d928c906`

Result: **938/938, zero failures**

The live result is byte-identical to the approved candidate GREEN artifact. It confirms first-touch reveal, second-touch `/fit/` navigation, mouse and keyboard activation after touch, cleanup after `pointercancel` and touch-without-click, sticky reduced-motion actionability, resolved-contact/HUD stacking, WebGL-unavailable static fallback, responsive layout, and 5.40:1 effective proof-context contrast. Direct requests to `/`, `/fit/`, and `/experience/` also returned HTTP 200 after activation.
