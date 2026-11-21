# davebettner.com

Static Astro site. Merging to main does not deploy; deploys follow DEPLOY.md.

| Rule | Check that enforces it |
| --- | --- |
| A CI speed claim cites real run times, split into waiting, setup and running at p50 and p95, and keeps [docs/ci-audit.md](docs/ci-audit.md) current. | `scripts/ci-audit.mjs` prints the tables from the GitHub runs; whether a claim is honest is judgment, reviewed on the pull request. |
| A tool switch (linter, formatter, runner, package manager) lands only after an old-versus-new run on this repository that lists what the new one misses, and gets its own row here. | None; judgment, reviewed on the pull request. |
| A check never gets faster by retrying, skipping or widening a timeout; fix the cause. | None; judgment, reviewed on the pull request. |
| A job's setup stays under 30 s and the whole Verify job under 210 s; the job fails when either passes, and says which step was slow. | `scripts/ci-budget.sh` (steps "Setup budget, 30 s" and "Job budget, 210 s" in `.github/workflows/verify.yml`). |
| Lint and typecheck what you push before it leaves the machine. | `.githooks/pre-push` runs `scripts/pre-push.mjs` (set up by `npm install`); CI runs `npm run lint` too, so the hook is a convenience, not the gate. |
| `main` only takes a change whose Verify and secret-scan checks passed on a branch up to date with main. | GitHub ruleset "Require Verify before main" (merge queue is not available on this plan). |
| A deploy runs from a clean clone of origin/main under one lock, through `scripts/deploy.sh`. | `scripts/deploy-preflight.sh`, repeated by the build hook; `scripts/test-deploy-preflight.sh` is the last step of `npm test`. |

## Tool evaluations (Nov 2026)

Evidence: the oxfmt line comes from `tools-eval.sh` run Nov 21 on the `ci/no-rebuild` tree (log `~/.capy/work/fastci/tools-eval.log` on davgent); the other conclusions come from a Nov 19 run on the same tree whose raw output was not kept, so they carry no numbers here and should be re-measured before anyone relies on them.

| Candidate | Result | Decision |
| --- | --- | --- |
| oxlint as the linter | Finishes in well under a second on this repository; reports its findings as warnings, which stay visible | Adopted, pinned in devDependencies (`npm run lint`, in CI and the hook). |
| oxfmt as a formatter | There is no formatter today; `oxfmt --check` flags 33 of 35 files, so adopting it means rewriting nearly every file | Not adopted. |
| TypeScript 7 native preview (`tsgo`) instead of tsc | Faster in the Nov 19 run, but neither tsc nor tsgo reads type errors inside `.astro` frontmatter, which `astro check` catches | Not adopted; `astro check` stays the typecheck for `.astro` changes. |
| Bun instead of Node for `astro check` | No gain in the Nov 19 run | Not adopted. |
| Splitting verify-theme and verify-ramp-profile into parts | Same checks (the closing page-error check repeats per part); five reruns each: job wall time median 142 s against 151 s | Not adopted (PR #18); the difference is inside the run-to-run spread. |
