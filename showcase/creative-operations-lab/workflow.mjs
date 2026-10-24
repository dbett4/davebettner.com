export function readiness(record) {
  if (record.approvedRevision !== record.revision) return { ready: false, reason: 'The owner must approve this exact revision.' };
  if (!record.sampleAccepted) return { ready: false, reason: 'A physical sample still needs acceptance.' };
  if (!record.fulfillmentVerified) return { ready: false, reason: 'Fulfillment evidence is still missing.' };
  return { ready: true, reason: 'Ready for a human release decision. No action has been sent.' };
}
