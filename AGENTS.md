# davebettner.com

Static Astro site. Merging to main does not deploy; deploys follow DEPLOY.md.

| Rule | Check that enforces it |
| --- | --- |
| A CI speed claim cites real run times, split into waiting, setup and running at p50 and p95, and keeps [docs/ci-audit.md](docs/ci-audit.md) current. | `scripts/ci-audit.mjs` prints the tables from the GitHub runs; whether a claim is honest is judgment, reviewed on the pull request. |
| A tool switch (linter, formatter, runner, package manager) lands only after an old-versus-new run on this repository that lists what the new one misses, and gets its own row here. | None; judgment, reviewed on the pull request. |
| A check never gets faster by retrying, skipping or widening a timeout; fix the cause. | None; judgment, reviewed on the pull request. |
