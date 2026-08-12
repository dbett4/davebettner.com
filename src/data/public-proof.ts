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
    title: 'Synthetic failure lab with idempotent retry and 73 public credential-free tests',
    summary:
      'Containerized deployment lab with a FastMCP server, mock enterprise API, workflow runner, and Docker Compose. Exercises the failure path where a write succeeds remotely and then appears to fail locally.',
    evidence:
      '73 public credential-free tests covering approval, authorization, audit records, and recovery; synthetic failure/replay with idempotency-key reuse. A larger persistence/container-proof revision remains local and runtime-unverified.',
    limit: 'A synthetic lab—not a claim of customer-environment deployment or production scale.',
    href: '/work/hermes-deployment-lab/',
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
    title: '318-row capability map with pinned v2026.8.3 reference suite',
    summary:
      'Version-pinned evaluation kit for enterprise agent configuration: explicit unsupported cases, negative tests, and a one-command local check.',
    evidence:
      '318-row mapping; 8 negative tests; exact pinned v2026.8.3 suite with 214 tests; one native-runtime S1 receipt passes offline hash and oracle verification.',
    limit:
      'The synthetic live one-shot remains needs_review: no external action or human disposition, a $0.406986 estimate rather than actual billed cost, and two recorded execution-time exceptions.',
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
  'Public repositories are sanitized extracts published August 2026. Dates on GitHub are publication dates, not original delivery dates. No client data or credentials appear in these repos; private client history remains confidential and public claims are limited to inspectable artifacts.';
