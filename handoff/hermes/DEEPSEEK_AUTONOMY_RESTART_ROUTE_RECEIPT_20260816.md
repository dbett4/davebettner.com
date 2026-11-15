# DeepSeek autonomy restart route receipt — 2026-08-16

- Requested action: restart the RCTC, PGC, and Scottsdale executors.
- Intended route: Hermes-coordinated DeepSeek V4 Flash project ticks.
- Cross-agent doctor: degraded, not green. Relevant failures are control-plane permission/projection issues (`/var/lib/agent-stack/hermes-runtime/...`, missing instruction-consumer manifest, Workiva-connect skill sync); the previously proven project-local Hermes→Nous DeepSeek route remains available.
- Fallback classification: bounded existing project-local DeepSeek tick route, **not** a successful full `run-the-team` route.
- Scope: one executor per project; project-local writes only; no commit, push, delivery, or Workiva mutation in this restart.
- Callback: each project writes `handoff/hermes/deepseek-autonomy/state.json` and a timestamped JSON receipt; terminal process completion notifications return to this Hermes session.
- Return-to-primary condition: agent-stack doctor cross-agent gate green.
