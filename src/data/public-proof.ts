export type PublicEngineeringCase = {
  id: string;
  name: string;
  repoUrl: string;
  proofUrl?: string;
  title: string;
  summary: string;
  evidence: string;
  limit: string;
  href: string;
};

export const publicEngineeringCases = [
  {
    id: 'agent-orchestration',
    name: 'Agent orchestration — scope, gate, and review',
    repoUrl: 'https://github.com/dbett4/hermes-enterprise-deployment-lab',
    proofUrl: 'https://github.com/dbett4/hermes-enterprise-deployment-lab/blob/main/PROOF.md',
    title: 'Scope tools, separate approval, and keep weak evidence labeled weak',
    summary:
      'Two operating-pattern labs for the hard case: an agent can touch an internal system. The Hermes Deployment Lab scopes tools, keeps operator approval separate, and resumes after a post-commit fault without double-writing. The Hermes Enterprise Evaluation Kit turns a plain-language job into a policy-bounded Hermes run with independent checks and a human review gate — without letting a green script invent approval.',
    evidence:
      'Deployment Lab: Public Actions attests container restart/replay, native telemetry/trace, fresh-clone, and a large credential-free suite; cloud IaC remains validate-only. Evaluation Kit: offline proof with no keys or network, capability map + explicit gaps, 8 negative tests, pinned preflight, and one live receipt still ending in needs_review.',
    limit:
      'Synthetic labs, not a customer tenant. Cloud apply is not attested. Not a model-driven production run claim. The live one-shot remains needs_review: no external action or human disposition, estimated rather than billed cost, and two recorded execution-time exceptions.',
    href: '/work/hermes-deployment-lab/',
  },

  {
    id: 'dedup-readback-bridge',
    name: 'Dedup Read-Back Bridge',
    repoUrl: 'https://github.com/dbett4/dedup-readback-bridge',
    title: 'Keep recurring agent work from running twice',
    summary:
      'A small Python bridge for recurring LLM and agent pipelines. It remembers what has already been sent, skips runs with no new items, handles concurrent submissions, and records each run for later review.',
    evidence: '19 tests, including a two-thread race and a crash-safety check, plus ruff, mypy, and a runnable CLI demo.',
    limit:
      'A reusable local library, not a hosted queue or claim of production-scale throughput. The caller still owns processor behavior and operational deployment.',
    href: '/work/dedup-readback-bridge/',
  },
  {
    id: 'regulated-reporting-mcp',
    name: 'Regulated Reporting MCP',
    repoUrl: 'https://github.com/dbett4/regulated-reporting-mcp',
    proofUrl: 'https://github.com/dbett4/regulated-reporting-mcp/blob/main/docs/PROOF.md',
    title: 'OAuth-backed MCP server with guarded writes and credential-free proof',
    summary:
      'MCP server for a Workiva-shaped reporting API: OAuth client credentials, token refresh, rate-limit backoff, pagination, async jobs, and controlled mutations behind a three-tool guarded default.',
    evidence: '126 credential-free tests; 117 registered tool contracts; offline end-to-end demo with no credentials required.',
    limit:
      'The full 117-tool registry requires an explicit unsafe opt-in. A local write receipt is not treated as remote verification.',
    href: '/work/regulated-reporting-mcp/',
  },
  {
    id: 'hermes-field-kit',
    name: 'Hermes Enterprise Evaluation Kit',
    repoUrl: 'https://github.com/dbett4/hermes-enterprise-evaluation-kit',
    proofUrl: 'https://github.com/dbett4/hermes-enterprise-evaluation-kit/blob/main/PROOF.md',
    title: 'Govern Hermes with policy, checks, and human review gates',
    summary:
      'Version-pinned kit that turns a plain-language job into a policy-bounded Hermes run, independent checks, and a receipt — without letting a green script invent human approval.',
    evidence:
      'Offline proof with no keys or network; capability map + explicit gaps; 8 negative tests; pinned v2026.8.3 preflight; one native-runtime S1 receipt still ending in needs_review.',
    limit:
      'Synthetic cases only. The live one-shot remains needs_review: no external action or human disposition, estimated rather than billed cost, and two recorded execution-time exceptions.',
    href: '/work/hermes-field-kit/',
  },
  {
    id: 'wingman',
    name: 'Financial reporting QA with readback',
    repoUrl: 'https://github.com/dbett4/wingman',
    title: 'Chrome extension + local service with readback and restore on mismatch',
    summary:
      'Wingman finds defects in financial-reporting workbooks—broken links, formula hardcodes, formatting drift—and applies only changes it can check, reverse, and read back.',
    evidence:
      '462 Python tests pass + 13 skip; 243 extension tests pass in CI; controlled changes are read back and restored on mismatch.',
    limit:
      'Extracted from live government reporting work; fictional demo data only; not affiliated with or endorsed by Workiva.',
    href: '/work/wingman/',
  },
] as const satisfies readonly PublicEngineeringCase[];

export const provenanceNote =
  'Public repositories are sanitized extracts published August 2026. They show methods and tests, not client tenants. Dates on GitHub are publication dates, not original delivery dates. These labs are independent engineering work, not customer-production agent deployments or a claim of production software-engineering tenure. Independent work is not a customer Hermes Enterprise deployment or Nous affiliation. Delivery outcomes describe scoped customer work under engagement; they are not claims of quota ownership, revenue credit, or final contract-signature authority. No client data or credentials appear in these repos; private client history remains confidential and public claims are limited to inspectable artifacts.';

export const homepageProvenanceNote =
  'Public GitHub dates are publication dates (August 2026). These labs and sanitized extracts are independent engineering work — not client tenants, production-engineering tenure, or Nous/Hermes Enterprise affiliation.';
