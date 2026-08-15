export type EvidenceMap = {
  signal: string;
  method: string;
  steps: readonly string[];
  boundary: string;
};

type CaseStudyContract = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  meta: string;
  size: 'large' | 'small';
  visual: 'flow' | 'rings' | 'difference';
  plateProof: string;
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
    id: 'hermes-deployment-lab',
    eyebrow: 'Failure recovery · Hermes Deployment Lab',
    title: 'An agent retries a write that already succeeded.',
    summary:
      'The lab gives an agent a narrow set of tools against a mock enterprise API. A person approves the first write. The run then fails after the commit lands, retries with the same idempotency key, and leaves one side effect instead of two.',
    meta: 'Scoped tools · operator gate · idempotent resume',
    size: 'small',
    visual: 'rings',
    plateProof: 'Container-proof CI',
    repoUrl: 'https://github.com/dbett4/hermes-enterprise-deployment-lab',
    proofUrl: 'https://github.com/dbett4/hermes-enterprise-deployment-lab/blob/main/PROOF.md',
    constraint:
      'A demo that works once says nothing about what a second operator sees when the run fails halfway through.',
    built:
      'A FastMCP server, mock enterprise API, workflow runner, and Compose stack. The first write stops until a separate operator approves it. The lab injects failure after the commit and resumes with the same idempotency key, so exactly one side effect remains.',
    role: 'I chose the failure modes worth testing, built the harness, and wrote the operator runbooks.',
    boundary:
      'This is a synthetic lab with credential-free tests, not a live client tenant. Cloud infrastructure stays no-apply. Scripts and tests call the tools; no model drives a production run.',
    evidence:
      'Public Actions attests container restart and replay, native metrics and traces, and a fresh-clone rebuild. Cloud infrastructure stays validate-only.',
    scope: 'Not a customer deployment. No client data or credentials appear in the repo.',
    evidenceMap: {
      signal: 'Approval stays with a person, and the retry leaves one side effect.',
      method:
        'Public GitHub Actions restarts the containers and replays the run, emits native metrics and linked traces, rebuilds from a fresh clone, and validates the cloud infrastructure without applying it.',
      steps: ['Scope tools', 'Operator grant', 'Post-commit fault', 'Idempotent resume', 'One side effect'],
      boundary: 'Synthetic lab evidence. Cloud apply is not attested.',
    },
  },
  {
    id: 'regulated-reporting-mcp',
    eyebrow: 'Guarded integration · Regulated Reporting MCP',
    title: 'An accepted write is not a verified write.',
    summary:
      'This MCP server targets a Workiva-shaped reporting API. Writes wait for confirmation, then get read back, and receipts omit sensitive fields. The server exposes three guarded tools by default. The full 117-tool registry requires an explicit unsafe opt-in.',
    meta: 'Confirm-before-write · readback · offline demo',
    size: 'large',
    visual: 'flow',
    plateProof: 'Credential-free proof',
    repoUrl: 'https://github.com/dbett4/regulated-reporting-mcp',
    proofUrl: 'https://github.com/dbett4/regulated-reporting-mcp/blob/main/docs/PROOF.md',
    constraint:
      'A reporting API gives an agent 117 things it can call. Expose all of them without a gate and the agent can write something nobody approved.',
    built:
      'An MCP server with OAuth client credentials, token refresh, rate-limit backoff, pagination, and async job polling. The write gate is enforced in code, not in a prompt.',
    role: 'I designed the server and chose to ship the small guarded surface as the default instead of the full catalog.',
    boundary:
      'A local write receipt is not remote verification. Uncertain formula results are reported as indeterminate, not guessed.',
    evidence:
      '126 credential-free tests, contracts for all 117 registered tools, and an offline end-to-end demo.',
    scope: 'A sanitized integration lab, not a customer tenant and not model or ML research.',
    evidenceMap: {
      signal: 'Three guarded tools by default, and every promised readback must prove itself.',
      method:
        'Lint, a contract check across all 117 registered tools, 126 credential-free tests, and an end-to-end demo that runs offline.',
      steps: ['Guarded default', 'Confirm', 'Readback', 'Redacted receipt'],
      boundary:
        'The full 117-tool registry has no shared write gate. That is why it requires an explicit unsafe opt-in. A local receipt does not prove remote state.',
    },
  },
  {
    id: 'hermes-field-kit',
    eyebrow: 'Evaluation · Hermes Enterprise Evaluation Kit',
    title: 'A green script is not a human approval.',
    summary:
      'The kit checks a plain-language job against a policy pack before Hermes runs it, grades the result with independent checks, and writes a receipt. When no person has signed off, the receipt ends at needs_review.',
    meta: 'Policy packs · human gates · offline proof',
    size: 'small',
    visual: 'rings',
    plateProof: 'Offline proof; live run needs_review',
    repoUrl: 'https://github.com/dbett4/hermes-enterprise-field-kit',
    proofUrl: 'https://github.com/dbett4/hermes-enterprise-field-kit/blob/main/PROOF.md',
    constraint:
      'Hermes provides the runtime. It does not decide which jobs are safe to hand it, which configuration was approved, or who is accountable for the answer.',
    built:
      'An evaluation layer around Hermes v0.20 with policy packs, a version-pinned capability map that names its gaps, eight negative tests, and offline proof. Receipts keep weak evidence labeled weak.',
    role: 'I decided what the kit refuses to approve on its own and wrote the public verification scripts.',
    boundary:
      'The cases and organization are fictional. One synthetic case ran through the live Hermes runtime. Native CLI evidence and an oracle check both pass, but the receipt remains needs_review. No person signed it off, no external action occurred, the cost is an estimate rather than a billed amount, and two exceptions remain on record.',
    evidence:
      'Offline proof passes without keys or a network. The repo includes a capability map with an explicit gap list, eight negative tests, a pinned v2026.8.3 preflight, and one committed native-runtime receipt that still ends in needs_review.',
    scope: 'Not a customer deployment and not an accepted customer policy.',
    evidenceMap: {
      signal: 'Offline proof passes, and the committed live run still ends at needs_review.',
      method:
        'A demo run, a check that the capability map matches the runtime, eight negative tests, a replay of the pinned v2026.8.3 suite, receipt hash checks, and a deterministic oracle that recomputes the answer.',
      steps: ['Policy pack', 'Approved config', 'Independent checks', 'Human gate', 'Receipt'],
      boundary: 'The committed live run still ends at needs_review, with two execution-time exceptions on record.',
    },
  },
  {
    id: 'wingman',
    eyebrow: 'Readback + restore · Wingman',
    title: 'It only fixes what it can put back.',
    summary:
      'Wingman scans a connected workbook for broken links, hardcoded formulas, and formatting drift. It explains each defect it finds. It fixes only what it can reverse and read back.',
    meta: 'Chrome extension · local service · confirm-before-write · restore',
    size: 'small',
    visual: 'difference',
    plateProof: 'CI test evidence',
    repoUrl: 'https://github.com/dbett4/wingman',
    constraint:
      'A statement can tie out while the mapping, formula, or source link underneath it is wrong. Nobody reviews a large workbook by hand forever.',
    built:
      'A Chrome extension and Python service that scan a connected workbook through the API and flag formula and link defects. Each fix waits for the user to confirm. The service saves the prior state before writing, reads the cell back afterward, and restores it if the result does not match.',
    role: 'I built the detectors, write gate, and restore path. The defect list came from years of reviewing the same government-reporting errors by hand.',
    boundary:
      'Findings that require accounting judgment stay in review. Activity logs contain coordinates and hashes, not cell values or formulas.',
    evidence: 'In CI, 462 Python tests pass with 13 skipped, and 243 extension tests pass.',
    scope:
      'The demo workbook is fictional. This is an extracted pattern, not a record of the private work it came from. It is not affiliated with or endorsed by Workiva.',
    evidenceMap: {
      signal: 'Every automated fix is checked, reversible, and read back.',
      method: 'The detectors self-test without credentials. The full Python and extension suites run in CI.',
      steps: ['Detect', 'Classify', 'Confirm', 'Write', 'Readback', 'Restore'],
      boundary: 'If a fix cannot be checked, reversed, and read back, Wingman does not make it.',
    },
  },
] as const satisfies readonly CaseStudyContract[];

export type CaseStudy = CaseStudyContract & (typeof cases)[number];
