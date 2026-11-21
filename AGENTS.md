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

## Tool evaluations (Nov 2026, same revision, same machine)

| Candidate | Result | Decision |
| --- | --- | --- |
| oxlint 1.94.0 as the linter | 0.1 s over src and scripts; found one real issue, now fixed; 18 warnings kept visible | Adopted (`npm run lint`, in CI and the hook). |
| oxfmt 0.79.0 as a formatter | There is no formatter today; it would rewrite 33 of 35 files | Not adopted. |
| TypeScript 7 native preview (`tsgo`) instead of tsc 5.9.3 | 0.67 s against 3.1 s, but both miss type errors in `.astro` frontmatter that `astro check` catches | Not adopted; `astro check` stays the typecheck for `.astro` changes. |
| Bun instead of Node for `astro check` | 10.0 to 10.6 s against 8.2 to 9.7 s | Not adopted; slower here. |
| Splitting verify-theme and verify-ramp-profile into parts | Same checks (the closing page-error check repeats per part), median job 142 s against 153 s over six runs each | Not adopted (PR #18); inside run-to-run spread. |
