# Public-proof artifact map — 2026-08-20

## 1. Deployment recovery receipt

- **Artifact:** `public/mockup-artifacts/deployment-recovery-receipt.svg`
- **Source paths:** `src/data/cases.ts` (`hermes-deployment-lab`, lines 60–88); `src/data/public-proof.ts` (`agent-orchestration`, lines 15–27).
- **Public sources:**
  - Repository: https://github.com/dbett4/hermes-enterprise-deployment-lab
  - Proof: https://github.com/dbett4/hermes-enterprise-deployment-lab/blob/main/PROOF.md
- **Exact facts used:** synthetic lab; FastMCP server, mock enterprise API, workflow runner, and Compose stack; first write pauses for a separate operator grant; failure is injected after commit; resume uses the same idempotency key; release `v1.0.0`; release commit `1e68676`; public Actions run `31892965924`; public evidence attests container restart/replay, native telemetry/trace, fresh-clone, and `241` credential-free tests; cloud IaC is validate-only.
- **What it proves:** the public repository's documented recovery pattern and its named public CI/release evidence.
- **What it does not prove:** a live client tenant, model-driven production run, production deployment, or cloud apply. The visual intentionally says “Public synthetic lab” and carries the cloud/no-live-tenant limit.

## 2. Regulated Reporting MCP contract

- **Artifact:** `public/mockup-artifacts/regulated-reporting-contract.svg`
- **Source paths:** `src/data/cases.ts` (`regulated-reporting-mcp`, lines 120–147); `src/data/public-proof.ts` (`regulated-reporting-mcp`, lines 42–52).
- **Public sources:**
  - Repository: https://github.com/dbett4/regulated-reporting-mcp
  - Proof: https://github.com/dbett4/regulated-reporting-mcp/blob/main/docs/PROOF.md
- **Exact facts used:** guarded default surface exposes three tools; full registry contains `117` registered tool contracts and requires explicit unsafe opt-in; writes require confirmation; results are read back; local write receipt is not remote verification; credential-free suite has `126` tests; offline end-to-end demo runs without credentials; uncertain formula results are reported as indeterminate, not guessed.
- **What it proves:** the repository's guarded contract design and offline/credential-free proof posture.
- **What it does not prove:** remote Workiva verification, customer data access, production deployment, or safe exposure of the full registry. The artifact marks the synthetic/local boundary and redacts receipt content rather than inventing a live transaction.

## Verification

Both artifacts are standalone SVGs with only text and shapes, no scripts, external assets, logos, fake browser chrome, or decorative grids. They are authored at `1200×760` and use the site's carbon, warm-white, orange, teal, periwinkle, and graphite palette. Files were written successfully; SVG-specific linting was unavailable in the file tool, so final status is `completed_unverified` pending a render-parser pass.
