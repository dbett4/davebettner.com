export type EvidenceMap = {
  signal: string;
  method: string;
  steps: readonly string[];
  boundary: string;
};

export type CaseStudy = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  meta: string;
  size: 'large' | 'small';
  visual: 'flow' | 'rings' | 'difference';
  repoUrl: string;
  proofUrl?: string;
  constraint: string;
  built: string;
  role: string;
  boundary: string;
  evidence: string;
  scope: string;
  evidenceMap: EvidenceMap;
};

export const cases = [
  {
    id: 'regulated-reporting-mcp',
    eyebrow: '01 · Regulated Reporting MCP',
    title: 'OAuth-backed MCP server with guarded writes and credential-free proof',
    summary:
      'MCP server for a Workiva-shaped reporting API with OAuth, pagination, async jobs, and controlled mutations behind a three-tool guarded default.',
    meta: 'MCP · OAuth · contract manifest · offline demo',
    size: 'large',
    visual: 'flow',
    repoUrl: 'https://github.com/dbett4/regulated-reporting-mcp',
    proofUrl: 'https://github.com/dbett4/regulated-reporting-mcp/blob/main/docs/PROOF.md',
    constraint:
      'Reporting APIs need structured reads and writes, but exposing a full tool catalog without policy gates is unsafe for agent use.',
    built:
      'I built an MCP server with OAuth client credentials, token refresh after 401, rate-limit backoff, pagination, async operation polling, and a write gate enforced in code. The default server exposes three guarded tools; the full 117-tool registry requires an explicit unsafe opt-in.',
    role: 'I designed the transport layer, contract manifest, guarded default surface, and credential-free proof harness.',
    boundary:
      'A local write receipt is not treated as remote verification. Uncertain formula results are reported as indeterminate, not guessed.',
    evidence:
      '126 credential-free tests; 117 registered tool contracts with exact manifest coverage; offline end-to-end demo runs without credentials.',
    scope: 'Sanitized API integration lab—not foundation-model or ML-research work.',
    evidenceMap: {
      signal: '126 credential-free tests and 117 tool contracts',
      method: 'Lint, contract-manifest check, pytest suite, and offline demo run without credentials.',
      steps: ['Guarded default', 'Contract manifest', 'Transport fakes', 'Offline demo', 'Proof script'],
      boundary: 'Full 117-tool registry is not policy-safe when served directly.',
    },
  },
  {
    id: 'hermes-deployment-lab',
    eyebrow: '02 · Hermes Deployment Lab',
    title: 'Synthetic failure lab with idempotent retry and 73 credential-free tests',
    summary:
      'Containerized lab that exercises remote-write/local-failure mismatch, operator approval separation, and idempotent recovery.',
    meta: 'FastMCP · Docker Compose · failure replay · audit trail',
    size: 'small',
    visual: 'rings',
    repoUrl: 'https://github.com/dbett4/hermes-enterprise-deployment-lab',
    proofUrl: 'https://github.com/dbett4/hermes-enterprise-deployment-lab/blob/main/PROOF.md',
    constraint:
      'A demo that answers once is not evidence that a second operator can deploy, observe failures, and recover without duplicating side effects.',
    built:
      'I built a FastMCP server, mock enterprise API, workflow runner, and Docker Compose stack. The lab reproduces a write that succeeds remotely but appears to fail locally, then retries with the same idempotency key so the side effect happens once. Operator approval is stored separately from workflow state; capabilities expire.',
    role: 'I owned the deployment shape, failure taxonomy, test harness, and operating runbooks.',
    boundary:
      'This is a synthetic lab with credential-free tests—not a live client tenant or production deployment claim.',
    evidence:
      '73 credential-free tests; synthetic failure/replay path; MCP inspect, compose parse, and demo checks in ./scripts/proof.sh.',
    scope: 'Lab architecture and recovery discipline are public; client data and credentials are not.',
    evidenceMap: {
      signal: '73 credential-free tests with synthetic failure replay',
      method: 'Proof script runs pytest, MCP inspect, compose parse, and an offline demo without provider credentials.',
      steps: ['Compose parse', 'MCP inspect', 'Approval gate', 'Idempotent retry', 'Audit record'],
      boundary: 'Synthetic lab evidence—not customer-environment deployment.',
    },
  },
  {
    id: 'hermes-field-kit',
    eyebrow: '03 · Hermes Field Kit',
    title: '318-row capability map with pinned v2026.8.3 reference suite',
    summary:
      'Version-pinned field kit for evaluating enterprise agent configuration with explicit unsupported cases and negative tests.',
    meta: 'Capability map · negative tests · pinned reference suite',
    size: 'small',
    visual: 'rings',
    repoUrl: 'https://github.com/dbett4/hermes-enterprise-field-kit',
    proofUrl: 'https://github.com/dbett4/hermes-enterprise-field-kit/blob/main/PROOF.md',
    constraint:
      'Enterprise agent rollouts need a traceable map from requirements to supported behavior, explicit gaps, and reproducible checks—not a slide-deck promise.',
    built:
      'I built a 318-row capability map with schema validation, eight negative tests, a pinned v2026.8.3 reference suite, an older explicitly unattested record, and one native-runtime S1 receipt.',
    role: 'I designed the mapping contract, adjudication workflow, and public verification scripts.',
    boundary:
      'One synthetic live one-shot has native CLI attestation and an oracle pass, but remains needs_review with no external action, no human disposition, a $0.406986 estimate rather than actual billed cost, and two recorded exceptions.',
    evidence:
      '318-row mapping; 8 negative tests; exact pinned v2026.8.3 suite with 214 tests; one committed native-runtime S1 receipt; PUBLIC_MAPPING_PASS and FIELD_KIT_PROOF_PASS.',
    scope: 'Synthetic configuration and evaluation artifacts only; not a customer deployment or accepted policy decision.',
    evidenceMap: {
      signal: '318-row map, 214-test pinned suite, and one native-runtime S1 receipt',
      method: 'Mapping verification, negative tests, pinned-suite replay, receipt hash checks, and deterministic-oracle recomputation.',
      steps: ['Row manifest', 'Gap ledger', 'Negative tests', 'Pinned suite', 'Live receipt'],
      boundary: 'Live one-shot remains needs_review with two recorded execution-time exceptions.',
    },
  },
  {
    id: 'wingman',
    eyebrow: '04 · Confirm-before-write quality',
    title: 'Chrome extension + local service with readback and restore on mismatch',
    summary:
      'Wingman finds spreadsheet defects that survive export, explains each issue, and applies only changes it can check, reverse, and read back.',
    meta: 'Chrome extension · local service · confirm-before-write · restore',
    size: 'small',
    visual: 'difference',
    repoUrl: 'https://github.com/dbett4/wingman',
    constraint:
      'Statements can tie out while mappings, formulas, links, or presentation remain wrong—and manual review does not scale across large workbooks.',
    built:
      'I built a Chrome extension and Python service that scan live sheets through the API, flag formula and link defects, explain each issue, and apply narrow fixes only after user confirmation. Before writing, the service saves prior state; after writing, it reads the cell back and restores on mismatch.',
    role: 'I designed and built the detectors, write gate, and restore path from repeated government reporting review patterns.',
    boundary:
      'Findings that require accounting judgment stay in review. Activity logs contain coordinates and hashes, not cell values or formulas.',
    evidence: '462 Python tests pass + 13 skip; 243 extension tests pass in CI.',
    scope: 'Fictional demo workbook only; extracted tooling pattern, not a full private delivery history.',
    evidenceMap: {
      signal: '462 Python pass + 13 skip; 243 extension pass',
      method: 'Detector self-test without credentials; full pytest and extension test suites in CI.',
      steps: ['Detect', 'Classify', 'Confirm', 'Write', 'Readback', 'Restore'],
      boundary: 'Automated fixes only when check, reverse, and readback are all possible.',
    },
  },
] as const satisfies readonly CaseStudy[];
