# CI audit

How long the Verify workflow takes and where the time goes. Regenerate the tables with `node scripts/ci-audit.mjs --runs 150` (needs `gh` signed in). Numbers are seconds, shown as p50 / p95, with linear-interpolation percentiles.

## Method

- **Runs.** The repository has 150 completed Verify runs in total (Aug 11 to Nov 10, 2026), so the audit covers all of them. A second window, the last 60 runs, matches the 60 runs used when this audit was first requested.
- **Waiting.** From the job being created to the runner starting it.
- **Setup.** Steps that only prepare the job: runner setup, checkout, `setup-node`, every `Install ...` step, and post-job cleanup.
- **Running.** Every other step: generate, check, build, test, scan.
- **PR time.** Run `created_at` to `updated_at`: queue plus wall time of the slowest job.

## Baseline, last 60 runs (57 green, 3 not green)

PR time: **384 / 454 s**.

| Job | Waiting | Setup | Running | Total |
| --- | --- | --- | --- | --- |
| verify | 3 / 4 | 64 / 94 | 306 / 375 | 382 / 453 |
| secret-scan | 3 / 3 | 5 / 8 | 1 / 1 | 11 / 15 |

## Baseline, all 150 runs (79 green, 71 not green)

PR time: **311 / 440 s**. Older runs used earlier shapes of the workflow, so the last-60 table is the one that describes today's workflow.

| Job | Waiting | Setup | Running | Total |
| --- | --- | --- | --- | --- |
| verify | 3 / 5 | 44 / 98 | 257 / 370 | 309 / 438 |
| secret-scan | 3 / 3 | 5 / 8 | 1 / 1 | 11 / 15 |

## Where the verify job spends its time (last 60 runs)

| Step | Bucket | p50 / p95 |
| --- | --- | --- |
| Set up job, checkout, setup-node | setup | 7 / 12 |
| Install ffmpeg (apt) | setup | 24 / 50 |
| Install dependencies (npm ci) | setup | 8 / 12 |
| Install Playwright browser | setup | 17 / 20 |
| Install Python browser test dependency | setup | 5 / 7 |
| Generate resume PDF | running | 0 / 1 |
| Check | running | 6 / 8 |
| Build | running | 7 / 10 |
| Test | running | 295 / 358 |

Waiting is 3 seconds, so there is no queue to fix. The biggest bucket is the Test step: 77% of the job. `npm test` regenerates the resume, runs `astro check` and `astro build` a second time, then runs nine browser suites one after another. Locally, with four cores, the suites took (seconds): verify-ramp-profile 142, verify-theme 136, verify-avatar-fade 81, verify-workstation-video 49, verify-visitor-journey 32, capture-soft-fade 29, verify-build-notes 19, verify-workflow-lesson 13, verify-soft-fade 2.

Setup is the second bucket (64 s). The workflow downloads a Playwright Chromium that no suite uses (every suite launches `/usr/bin/google-chrome`), and it runs `apt-get update` before installing ffmpeg.

## The three runs in the last 60 that were not green

| Run | Date | Cause | Status today |
| --- | --- | --- | --- |
| 93 | Sep 11 | `verify-workstation-video` called `/usr/bin/ffmpeg`, which the runner did not have (`spawnSync /usr/bin/ffmpeg ENOENT`). | Fixed by 37582a7, which installs ffmpeg. |
| 94 | Sep 11 | `verify-soft-fade` read `review/seated-animation/frame-000.png`, a file that was not committed. | Fixed by 54baf3f, which verifies the committed media instead. |
| 97 | Sep 28 | `verify-workstation-video` waited 9 s for a 10-second video to play through its loop at 5x. A software video decoder on a busy runner fell behind, so the wait timed out. | Hidden, not fixed: f17d6c2 raised the timeout to 30 s and lowered the speed to 4x. The cause is fixed in the pull request that makes the loop check seek to the end of the video. |

The other 68 non-green runs are older than the 60-run window. 60 of them are one stretch on main (runs 9 to 70, Aug 13 to Aug 22), all in the Test step or in a PDF-utilities install step. GitHub has deleted the logs for the oldest ones (HTTP 410), so their causes cannot be read.
