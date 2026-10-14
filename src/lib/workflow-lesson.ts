export type FixtureId = 'valid' | 'stale-source' | 'wrong-calculation' | 'lost-response';

type ApplicationRecord = Readonly<{ stockBalance: number; revision: number }>;
type CheckResult = Readonly<{ passes: boolean; explanation: string }>;

type WorkflowData = Readonly<{
  fixture: FixtureId;
  source: Readonly<{ revision: string; openingStock: number; received: number; shipped: number }>;
  inspectedSourceRevision: string;
  candidateStockBalance: number;
  expectedApplicationRevision: number;
  application: ApplicationRecord;
  lastReadApplication: ApplicationRecord;
  writeCount: number;
  checks: readonly CheckResult[];
  log: readonly string[];
  message: string;
}>;

export type WorkflowState = WorkflowData & (
  | { phase: 'proposal' | 'blocked' | 'checked'; receiptStatus: 'not-requested' }
  | { phase: 'applied'; receiptStatus: 'accepted' }
  | { phase: 'response-lost'; receiptStatus: 'response-lost' }
  | { phase: 'verified'; receiptStatus: 'accepted' | 'response-lost' }
);

export type WorkflowAction = 'check' | 'apply' | 'read';

export const fixtures: readonly Readonly<{ id: FixtureId; label: string }>[] = [
  { id: 'valid', label: 'Valid update' },
  { id: 'stale-source', label: 'Source changed' },
  { id: 'wrong-calculation', label: 'Wrong calculation' },
  { id: 'lost-response', label: 'Response lost after write' },
];

export function createWorkflow(fixture: FixtureId): WorkflowState {
  const application = { stockBalance: 100, revision: 3 };
  return {
    fixture,
    source: { revision: 'inventory-7', openingStock: 100, received: 30, shipped: 20 },
    inspectedSourceRevision: fixture === 'stale-source' ? 'inventory-6' : 'inventory-7',
    candidateStockBalance: fixture === 'wrong-calculation' ? 115 : 110,
    expectedApplicationRevision: 3,
    application,
    lastReadApplication: application,
    writeCount: 0,
    checks: [],
    phase: 'proposal',
    receiptStatus: 'not-requested',
    log: ['Example loaded. Application starts with 100 units at revision 3.'],
    message: 'No changes made. Check the proposal before applying.',
  };
}

function proposalChecks(state: WorkflowState): readonly CheckResult[] {
  const { source, inspectedSourceRevision, candidateStockBalance, application, expectedApplicationRevision } = state;
  const expected = source.openingStock + source.received - source.shipped;
  return [
    {
      passes: inspectedSourceRevision === source.revision,
      explanation: `Proposal inspected ${inspectedSourceRevision}; current source is ${source.revision}.`,
    },
    {
      passes: candidateStockBalance === expected,
      explanation: `${source.openingStock} + ${source.received} − ${source.shipped} = ${expected}. Proposal is ${candidateStockBalance} units.`,
    },
    {
      passes: application.revision === expectedApplicationRevision,
      explanation: `Application revision is ${application.revision}; proposal expects revision ${expectedApplicationRevision}.`,
    },
  ];
}

export function advanceWorkflow(state: WorkflowState, action: WorkflowAction): WorkflowState {
  if (action === 'check') {
    if (state.phase !== 'proposal' && state.phase !== 'blocked') return state;
    const checks = proposalChecks(state);
    const passes = checks.every(check => check.passes);
    const message = passes
      ? `Checks passed. You can approve the ${state.candidateStockBalance}-unit update. No write has occurred.`
      : 'Checks failed. Apply is blocked. The application has not changed.';
    return { ...state, checks, phase: passes ? 'checked' : 'blocked', message, log: [...state.log, message] };
  }

  if (action === 'apply') {
    if (state.phase !== 'checked' || state.writeCount !== 0) return state;
    const checks = proposalChecks(state);
    if (checks.some(check => !check.passes)) {
      const message = 'Checks failed before the write. Apply is blocked. The application has not changed.';
      return { ...state, phase: 'blocked', checks, message, log: [...state.log, message] };
    }
    const application = { stockBalance: state.candidateStockBalance, revision: state.application.revision + 1 };
    const updated = { ...state, application, writeCount: 1 };
    if (state.fixture === 'lost-response') {
      const message = 'The write response was lost. Read the application to find out what happened before attempting any retry.';
      return { ...updated, phase: 'response-lost', receiptStatus: 'response-lost', message, log: [...state.log, message] };
    }
    const message = 'Write accepted. The final application state has not been checked. Read the application next.';
    return { ...updated, phase: 'applied', receiptStatus: 'accepted', message, log: [...state.log, message] };
  }

  const lastReadApplication = { ...state.application };
  if (state.receiptStatus === 'not-requested') {
    const message = `Read application. ${lastReadApplication.stockBalance} units at revision ${lastReadApplication.revision}. No write has occurred.`;
    return { ...state, lastReadApplication, message, log: [...state.log, message] };
  }
  const matches = lastReadApplication.stockBalance === state.candidateStockBalance
    && lastReadApplication.revision === state.expectedApplicationRevision + 1
    && state.writeCount === 1;
  if (!matches) {
    const message = 'Readback does not match the approved update. Stop and investigate before any further write.';
    return { ...state, lastReadApplication, message, log: [...state.log, message] };
  }
  const message = state.receiptStatus === 'response-lost'
    ? `Readback confirms ${lastReadApplication.stockBalance} units at revision ${lastReadApplication.revision}. The write succeeded despite the lost response. One write; no retry needed.`
    : `Readback confirms ${lastReadApplication.stockBalance} units at revision ${lastReadApplication.revision}. The approved update is verified. One write made.`;
  return { ...state, phase: 'verified', lastReadApplication, message, log: [...state.log, message] };
}
