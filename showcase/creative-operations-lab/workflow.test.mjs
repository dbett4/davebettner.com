import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readiness } from './workflow.mjs';
test('approval does not survive a revision change',()=>{
  const accepted={revision:1,approvedRevision:1,sampleAccepted:true,fulfillmentVerified:true};
  assert.equal(readiness(accepted).ready,true);
  assert.equal(readiness({...accepted,revision:2}).ready,false);
});
test('approval cannot substitute for sample or fulfillment evidence',()=>{
  assert.equal(readiness({revision:1,approvedRevision:1,sampleAccepted:false,fulfillmentVerified:true}).ready,false);
  assert.equal(readiness({revision:1,approvedRevision:1,sampleAccepted:true,fulfillmentVerified:false}).ready,false);
});
