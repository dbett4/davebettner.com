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
      'An agent writes to a mock enterprise API. The run fails after the commit lands, then retries without writing twice. Approval stays with a separate operator.',
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
      'A bug in Hermes Agent Desktop hid real sessions behind stale profile records. My fix narrows the check so the stale record gives way to the saved conversation without hiding legitimate empty drafts. The pull request is open and unreviewed.',
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
      'An MCP server for a Workiva-shaped reporting API. It exposes three guarded tools by default. The other 114 require an explicit unsafe opt-in.',
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
    name: 'Wingman',
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
  'These repositories are sanitized extracts published in August 2026. Their GitHub dates are publication dates, not delivery dates. They show methods and tests on synthetic data. No client tenants, client data, or credentials appear here. This is engineering evidence, not customer production-agent work or production software-engineering tenure. The work is independent and has no Nous or Hermes Enterprise affiliation.';

export const homepageProvenanceNote =
  'These repos went public in August 2026, so the GitHub dates are publication dates, not delivery dates. They are synthetic labs and sanitized extracts. They contain no client tenants, client data, or credentials, and they do not represent customer production-agent work or an affiliation with Nous or Hermes Enterprise.';

/**
 * Engagement boundary for the customer-outcomes surface. Moved off the /work/ lab
 * disclaimer, which describes public repositories rather than client engagements.
 */
export const deliveryOutcomesNote =
  'These outcomes describe scoped customer work under engagement. They are not claims of quota ownership, revenue credit, or final contract-signature authority. Private client history remains confidential.';
