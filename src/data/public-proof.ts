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
    id: 'hermes-deployment-lab',
    name: 'Hermes Deployment Lab',
    repoUrl: 'https://github.com/dbett4/hermes-enterprise-deployment-lab',
    proofUrl: 'https://github.com/dbett4/hermes-enterprise-deployment-lab/blob/main/PROOF.md',
    title: 'Scope tools, separate approval, survive post-commit failure',
    summary:
      'Synthetic lab for agent-touching-internal-system failure modes: scoped MCP tools, separate operator approval, forced post-commit error, and resume without double-writing.',
    evidence:
      'Public Actions attests container restart/replay, native telemetry/trace, fresh-clone, and a large credential-free suite; cloud IaC remains validate-only.',
    limit: 'Synthetic lab, not a customer tenant. Cloud apply is not attested. Not a model-driven production run claim.',
    href: '/work/hermes-deployment-lab/',
  },
  {
    id: 'hermes-agent-pr-84621',
    name: 'Hermes Agent Desktop PR #84621',
    repoUrl: 'https://github.com/NousResearch/hermes-agent/pull/84621',
    proofUrl: 'https://github.com/NousResearch/hermes-agent/pull/84621',
    title: 'Open Desktop session-recovery fix in Hermes Agent',
    summary:
      'TypeScript/Electron fix that narrows legacy profile-shadow detection so stale empty shadows do not hide materialized sessions while legitimate zero-message drafts remain visible.',
    evidence:
      'Focused Vitest regression cases cover cross-profile materialized twins, known-source zero-message drafts, omitted message counts, and the exact legacy empty-shadow shape.',
    limit:
      'Open and unreviewed. Not merged, accepted, shipped, or endorsed by Nous Research.',
    href: 'https://github.com/NousResearch/hermes-agent/pull/84621',
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
    repoUrl: 'https://github.com/dbett4/hermes-enterprise-field-kit',
    proofUrl: 'https://github.com/dbett4/hermes-enterprise-field-kit/blob/main/PROOF.md',
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
  'Public repositories are sanitized extracts published August 2026. They show methods and tests, not client tenants. Dates on GitHub are publication dates, not original delivery dates. These labs are engineering proof, not customer-production agent deployments or a claim of production software-engineering tenure. Independent work is not a customer Hermes Enterprise deployment or Nous affiliation. Delivery outcomes describe scoped customer work under engagement; they are not claims of quota ownership, revenue credit, or final contract-signature authority. No client data or credentials appear in these repos; private client history remains confidential and public claims are limited to inspectable artifacts.';

export const homepageProvenanceNote =
  'Public GitHub dates are publication dates (August 2026). Labs and sanitized extracts — not client tenants, production-engineering tenure, or Nous/Hermes Enterprise affiliation.';
