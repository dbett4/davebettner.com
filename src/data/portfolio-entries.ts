import { experienceEntries } from './experience';

export type PortfolioEntry = {
  id: string;
  title: string;
  meta: string;
  situation: string;
  role: string;
  work: string;
  result: string;
  href?: string;
  flagship?: boolean;
};

export const identity = {
  name: 'Dave Bettner',
  headline: 'I turn messy customer workflows and technical constraints into deployed systems that hold up in production.',
  caption:
    'I work across discovery, integration, debugging, validation, and adoption. Public agent and MCP engineering makes the technical operating pattern inspectable.',
  location: 'Des Moines, Iowa',
  availability: '',
};

/** Homepage shows these three flagship stories only. */
export const flagshipPortfolioIds = [
  'insurance-certification',
  'gov-reporting',
  'clinical-imaging',
] as const;

export const skillPillars = [
  { label: 'Find the problem' },
  { label: 'Build the answer' },
  { label: 'Cross boundaries' },
  { label: 'Stay through implementation' },
] as const;

/** Preview mockups only — not used on production pages. */
export const proofStats = [
  { value: '10+', label: 'Years enterprise delivery' },
  { value: '6–12', label: 'Concurrent implementations (peak)' },
  { value: '970+', label: 'Logged formatting ops (gov fund statements)' },
] as const;

export const portfolioEntries = [
  {
    id: 'insurance-certification',
    title: 'Turning a certification handoff into an operating model',
    meta: 'Statutory certification · controls · executive sign-off',
    situation:
      'Statutory reporting certification required a controlled handoff between the reporting platform and an internal system of record, with audit trail and executive sign-off — not email attachments.',
    role: 'Owned the special project from diagnosis through go-live; coordinated finance, IT, and executive stakeholders.',
    work:
      'Designed bidirectional integration between reporting technology and an in-house archival system with full audit trail; aligned finance, IT, and executive sponsors on ownership, controls, and sign-off sequence.',
    result:
      'Production certification workflow delivered; stakeholders signed off through go-live; handoff became a repeatable operating model.',
    flagship: true,
  },
  {
    id: 'hermes-deployment-lab',
    title: 'Hermes Deployment Lab — scope tools, separate approval, safe resume',
    meta: 'Operator gate · post-commit fault · one side effect',
    situation:
      'When an agent can touch an internal system, the hard failures are operational: too many tools, self-approval, and retries after a commit that already happened.',
    role: 'Owned the deployment shape, test harness, and operating runbooks for the public lab.',
    work:
      'Synthetic Compose lab with FastMCP server, mock enterprise API, and workflow runner. First write stops for a separate operator grant; post-commit failure resumes with the same idempotency key. Public CI attests container restart/replay and native telemetry/trace; cloud IaC remains no-apply.',
    result:
      'Credential-free suite and container-proof CI on the public lab; synthetic evidence only, not a customer deployment.',
    href: '/work/hermes-deployment-lab/',
  },
  {
    id: 'table-formatter',
    title: 'Turning manual close work into a scalable system',
    meta: 'Deterministic pipeline · public-sector reporting',
    situation:
      'Eleven fund statements with inconsistent table geometry and hundreds of manual formatting operations per close: error-prone, slow, and hard to audit.',
    role: 'Owned the formatter pipeline and batch operating procedure.',
    work:
      'Built deterministic pipeline applying 970+ formatting operations across 11 government fund statements with journaled changesets and tie-out checks.',
    result:
      '970+ logged operations; repeatable batch runs with readback verification. Manual close work replaced by a scalable system.',
  },
  {
    id: 'agent-stack',
    title: 'Regulated Reporting MCP — guarded writes with offline proof',
    meta: '126 tests · 117 contracts · offline demo',
    situation:
      'Agent tools against reporting APIs need policy-safe defaults, contract coverage, and proof that does not require live credentials.',
    role: 'Designed the guarded default surface, contract manifest, and credential-free proof harness.',
    work:
      'MCP server with OAuth, pagination, async jobs, and controlled mutations. Default three-tool guarded server; full 117-tool registry behind explicit unsafe opt-in.',
    result:
      '126 credential-free tests; 117 tool contracts; offline end-to-end demo documented in the public repository.',
    href: '/work/regulated-reporting-mcp/',
  },
  {
    id: 'wingman',
    title: 'Confirm-before-write spreadsheet quality (Wingman)',
    meta: '462 Python pass + 13 skip · 243 extension pass',
    situation:
      'Statements could tie out while underlying source links, mappings, or formatting remained wrong. Manual review did not scale across large workbooks.',
    role: 'Designed and built the quality workflow and operated it across enterprise implementations.',
    work:
      'Chrome extension and Python service that scans live sheets via API, flags defects, explains each issue, and applies narrow fixes only after explicit user confirmation, readback, and restore on mismatch.',
    result:
      '462 Python tests pass + 13 skip; 243 extension tests pass in CI; fictional demo workbook only.',
    href: '/work/wingman/',
  },
  {
    id: 'hermes-field-kit',
    title: 'Hermes Enterprise Evaluation Kit — policy, checks, and human review gates',
    meta: 'Policy packs · offline proof · needs_review gate',
    situation:
      'Hermes primitives alone are not enough for enterprise use. Organizations still need job qualification, approved configs, independent checks, and accountable human judgment.',
    role: 'Designed the operating model, mapping contract, adjudication workflow, and public verification scripts.',
    work:
      'Version-pinned evaluation layer for Hermes v0.20: policy packs, capability map with explicit gaps, eight negative tests, offline proof, and receipts that keep weak evidence labeled weak.',
    result:
      'Offline proof passes without keys or network; synthetic live one-shot remains needs_review with no external action and two recorded exceptions.',
    href: '/work/hermes-field-kit/',
  },
  {
    id: 'clinical-imaging',
    title: 'Connecting regulated workflows across health-system boundaries',
    meta: 'HIPAA · EHR integration · go-live',
    situation:
      'Imaging orders and results had to move across practice and health-system boundaries under HIPAA, with billing and access controls intact through an acquisition transition.',
    role: 'Led cross-practice implementations through an acquisition transition.',
    work:
      'Deployed HIPAA-controlled imaging workflows, EHR interfaces, and customer-facing portal integrations with billing and access controls.',
    result:
      'Four workflow types in production; integrations cleared HIPAA review before go-live.',
    flagship: true,
  },
  {
    id: 'gov-reporting',
    title: 'Running enterprise reporting and GRC under audit pressure',
    meta: 'GRC · financial reporting · concurrent implementations',
    situation:
      'Finance and audit teams were running many concurrent GRC and financial-reporting programs. Changes had to tie out, leave an audit trail, and win human sign-off before reaching a published statement.',
    role: 'Led solution design and adoption as Solutions Architect; owned reconciliation and controlled-write workflows on active engagements.',
    work:
      'Scoped SSO, API, and ERP integration architecture with finance, audit, IT, and executive sponsors. Built source-first reconciliation, controlled write batches, and validators with human sign-off on customer-impacting workbook changes.',
    result:
      'Concurrent implementations through adoption; journaled changesets, tie-out checks, and native readback on active ACFR, GRC, and municipal finance engagements.',
    flagship: true,
  },
] as const satisfies readonly PortfolioEntry[];

export const homepagePortfolioEntries = flagshipPortfolioIds
  .map((id) => portfolioEntries.find((e) => e.id === id))
  .filter((e): e is (typeof portfolioEntries)[number] => Boolean(e));

export const cvEntries = experienceEntries;
