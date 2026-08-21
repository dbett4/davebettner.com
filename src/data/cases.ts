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
  motif: 'failure-retry' | 'guarded-readback' | 'code-fix';
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
    id: 'agent-operating-system',
    eyebrow: 'Architecture · Agent operating system',
    title: 'Design the system around the agent',
    summary:
      'A plain-language view of the system around AI-assisted enterprise work: context, coordination, bounded tools, recovery, proof, and accountable human judgment.',
    meta: 'Context · tools · authority · proof',
    size: 'large',
    visual: 'flow',
    motif: 'guarded-readback',
    plateProof: 'Living snapshot · current practice',
    repoUrl: 'https://github.com/dbett4',
    constraint:
      'A model can generate a useful answer while the surrounding workflow still lacks context, authority boundaries, failure recovery, or proof of what actually happened.',
    built:
      'I design the reusable layers around agent work: context and capability routing, role-based orchestration, bounded tools, authority controls, readback, rollback, independent verification, receipts, and operator review surfaces.',
    role: 'I own the system design and the boundary between reusable agent infrastructure and the enterprise workflows that run on it.',
    boundary:
      'Independent engineering system and living snapshot. Public repositories are sanitized or synthetic artifacts, not customer tenants. The architecture distinguishes adopted capabilities from target doctrine.',
    evidence:
      'Architecture map plus public deployment, MCP, evaluation, and spreadsheet-quality cases. The verifier is never the builder; applied work is not described as verified without independent proof.',
    scope: 'Personal operating system and reusable engineering patterns; client engagements remain confidential.',
    evidenceMap: {
      signal: 'Agents move quickly while tools stay bounded and consequential results remain verifiable',
      method: 'Trace the loop from request and context through execution, readback, independent verification, human decision, and reusable improvement.',
      steps: ['Context', 'Plan', 'Execute', 'Verify', 'Decide', 'Improve'],
      boundary: 'Current practice and adoption spine—not a claim that every target autonomy control is fully production-wired.',
    },
  },
  {
    id: 'hermes-deployment-lab',
    eyebrow: 'Duplicate-action prevention · Hermes Deployment Lab',
    title: 'Prevent a second business action after a failed retry',
    summary:
      'Most demos stop after a successful action. This lab tests the failure that can create direct costs and manual reconciliation: the system saves a payment, order, access grant, or customer update, but the agent never receives confirmation. The recovery finds the first result instead of creating a second.',
    meta: 'Forced failure · restart recovery · one final result',
    size: 'small',
    visual: 'rings',
    motif: 'failure-retry',
    plateProof: 'v1.0.0 · CI 31892965924',
    repoUrl: 'https://github.com/dbett4/hermes-enterprise-deployment-lab',
    proofUrl: 'https://github.com/dbett4/hermes-enterprise-deployment-lab/blob/main/PROOF.md',
    constraint:
      'The dangerous failure is a change that succeeds while the agent thinks it failed. The team must either retry and risk a duplicate or stop the workflow and investigate by hand. Both choices consume money or staff time.',
    built:
      'I built the approval and recovery path around that failure. The lab keeps one tracking number through the restart, finds the first result instead of repeating the action, and checks the final count. The public test forces the failure rather than assuming recovery would work.',
    role: 'I designed the controls, failure test, recovery behavior, and proof needed before an agent can safely make changes in an enterprise system.',
    boundary:
      'This is a synthetic lab, not a live client environment. The cloud configuration is checked but not deployed. Scripts and tests drive the run; a model is not running the workflow in production.',
    evidence:
      'Public GitHub Actions run 31892965924 forces the failure, restarts the containers, replays the original request, and verifies the final count is one. The suite includes 241 credential-free tests.',
    scope: 'The lab design and recovery process are public. Client data and credentials are not part of it.',
    evidenceMap: {
      signal: 'The workflow fails at the worst moment and still leaves one approved result',
      method:
        'A public GitHub Actions run starts from a fresh copy, saves one change, drops the confirmation, restarts the workflow, and verifies that the result was not duplicated.',
      steps: ['Limit access', 'Approve the change', 'Lose the reply', 'Find the first result', 'Verify one result'],
      boundary: 'Synthetic data only. The cloud configuration is checked, not deployed.',
    },
  },
  {
    id: 'dedup-readback-bridge',
    eyebrow: 'Pipeline economics · Dedup Read-Back Bridge',
    title: 'Stop recurring agent pipelines from repeating work',
    summary:
      'A small Python bridge for recurring LLM and agent pipelines. It remembers what has already been sent, skips runs with no new items, handles concurrent submissions, and records each run for later review.',
    meta: 'Deduplication · atomic reservation · readback',
    size: 'large',
    visual: 'difference',
    motif: 'guarded-readback',
    plateProof: '19 tests · stdlib only',
    repoUrl: 'https://github.com/dbett4/dedup-readback-bridge',
    constraint:
      'Recurring agent pipelines waste money when they send the same items again, and they become hard to debug when nobody can tell what a run actually processed.',
    built:
      'I pulled the useful mechanics into a small library: stable item identity, a durable ledger, an atomic reservation step, an empty-run check, processor handoff, and a JSON/Markdown record of the result.',
    role: 'I designed the library around a practical question: which items did this run send, and can another run safely try again?',
    boundary:
      'A reusable local library, not a hosted queue or production-scale throughput claim. The caller owns processor behavior and operational deployment.',
    evidence:
      '19 tests, including a two-thread race and a crash-safety check, plus ruff, mypy, and a runnable CLI demo.',
    scope: 'General-purpose agent/LLM pipeline pattern; the original personal research workflow and private integrations are excluded.',
    evidenceMap: {
      signal: 'A run skips items it has already sent and leaves a record of what it did',
      method: 'Stable keys, a durable ledger, atomic reservation, an empty-run short circuit, and a structured read-back.',
      steps: ['Parse', 'Dedup', 'Reserve', 'Process', 'Record', 'Read back'],
      boundary: 'Local library proof; no claim of hosted queue durability or service-level guarantees.',
    },
  },
  {
    id: 'regulated-reporting-mcp',
    eyebrow: 'Guarded integration · Regulated Reporting MCP',
    title: 'Let agents work with business systems without an open write path',
    summary:
      'Guarded reporting MCP where writes need confirmation, results are read back, and receipts stay redacted. Default surface is three safe tools; the full catalog stays behind an explicit unsafe opt-in.',
    meta: 'Confirm-before-write · readback · offline demo',
    size: 'large',
    visual: 'flow',
    motif: 'guarded-readback',
    plateProof: 'Credential-free proof',
    repoUrl: 'https://github.com/dbett4/regulated-reporting-mcp',
    proofUrl: 'https://github.com/dbett4/regulated-reporting-mcp/blob/main/docs/PROOF.md',
    constraint:
      'Reporting APIs need structured reads and writes, but exposing a full tool catalog without policy gates is unsafe for agent use.',
    built:
      'I built an MCP server with OAuth, retries, pagination, async polling, and a write gate enforced in code. The default server exposes three guarded tools; the full registry requires an explicit unsafe opt-in.',
    role: 'I designed the transport layer, contract manifest, guarded default surface, and credential-free proof harness.',
    boundary:
      'A local write receipt is not treated as remote verification. Uncertain formula results are reported as indeterminate, not guessed.',
    evidence:
      'Credential-free test suite, full tool-contract coverage, and an offline end-to-end demo that runs without credentials.',
    scope: 'Sanitized API integration lab—not foundation-model or ML-research work.',
    evidenceMap: {
      signal: 'Confirm-before-write default surface with offline demo',
      method: 'Lint, contract-manifest check, pytest suite, and offline demo run without credentials.',
      steps: ['Guarded default', 'Confirm write', 'Readback', 'Redacted receipt', 'Offline demo'],
      boundary: 'Full tool registry is not policy-safe when served directly.',
    },
  },
  {
    id: 'hermes-field-kit',
    eyebrow: 'Evaluation · Hermes Enterprise Evaluation Kit',
    title: 'Find out whether an agent is ready for business use',
    summary:
      'Version-pinned kit that turns a plain-language job into a policy-bounded Hermes run, independent checks, and a receipt — without letting a green script invent human approval.',
    meta: 'Policy packs · human gates · offline proof',
    size: 'small',
    visual: 'rings',
    motif: 'guarded-readback',
    plateProof: 'Offline proof; live S1 needs_review',
    repoUrl: 'https://github.com/dbett4/hermes-enterprise-evaluation-kit',
    proofUrl: 'https://github.com/dbett4/hermes-enterprise-evaluation-kit/blob/main/PROOF.md',
    constraint:
      'Hermes primitives alone are not enough for enterprise use. Organizations still need job qualification, approved configs, independent checks, and accountable human judgment.',
    built:
      'I built the surrounding evaluation layer for Hermes v0.20: policy packs, a version-pinned capability map with explicit gaps, eight negative tests, offline proof, and receipts that keep weak evidence labeled weak.',
    role: 'I designed the operating model, mapping contract, adjudication workflow, and public verification scripts.',
    boundary:
      'Synthetic cases only. One live one-shot has native CLI attestation and an oracle pass, but remains needs_review with no external action, no human disposition, an estimated rather than billed cost, and two recorded exceptions.',
    evidence:
      'Offline FIELD_KIT_PROOF_PASS; capability map + gap list; 8 negative tests; pinned v2026.8.3 preflight; one committed native-runtime S1 receipt still ending in needs_review.',
    scope: 'Synthetic configuration and evaluation artifacts only; not a customer deployment or accepted policy decision.',
    evidenceMap: {
      signal: 'Policy-bounded mission flow with offline proof and one attested needs_review receipt',
      method: 'Demo mission, mapping verification, negative tests, pinned-suite replay, receipt hash checks, and deterministic-oracle recomputation.',
      steps: ['Policy pack', 'Approved config', 'Independent checks', 'Human gate', 'Receipt'],
      boundary: 'Live one-shot remains needs_review with two recorded execution-time exceptions.',
    },
  },
  {
    id: 'wingman',
    eyebrow: 'Readback + restore · Confirm-before-write quality',
    title: 'Find and fix spreadsheet defects without hiding judgment',
    summary:
      'Wingman finds spreadsheet defects that survive export, explains each issue, and applies only changes it can check, reverse, and read back.',
    meta: 'Chrome extension · local service · confirm-before-write · restore',
    size: 'small',
    visual: 'difference',
    motif: 'guarded-readback',
    plateProof: 'CI test evidence',
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
