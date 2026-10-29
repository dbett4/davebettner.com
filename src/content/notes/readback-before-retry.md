---
title: A successful write still needs a readback
description: A lost response makes retries risky. A small inventory example shows how to check whether an automated change already happened.
date: '2026-10-28'
project: ai-workflows
draft: false
---
When an application accepts an update but its response gets lost, the caller has an ambiguous result. The change may have succeeded even though the assistant did not receive confirmation. Repeating it immediately can apply the same action twice.

I built a small [interactive walkthrough](/learn/verify-an-ai-update/) to make that failure easier to inspect. It uses fictional inventory data and deterministic checks in the browser.

## Start with a result you can check

The example starts with 100 units, receives 30, and ships 20. The proposed ending stock is 110 units. Before applying that proposal, the workflow checks whether the source revision is current and whether the calculation is correct.

Those checks answer whether the proposal is acceptable. After the write, the next question is what the application actually saved.

A write receipt reports something about the request. A fresh read provides the saved value and revision. Comparing those with the approved proposal gives the person responsible a way to check the outcome.

## Recover from the saved state

The walkthrough includes a lost-response case. After the uncertain write, read the application and inspect the result before deciding to retry. The example also shows the number of writes, making a duplicate action visible.

For a real integration, the recovery method depends on the application’s contract. A stable request identifier, a status endpoint, or a transaction record may help establish whether the original operation completed. The integration needs to preserve enough information to use that method after an interruption.

## Put the evidence in the interface

I want the operator to be able to answer three questions without reconstructing the session. Which source was used? What change was approved? What is saved now?

The walkthrough exposes the source, proposal, receipt, and last application read together. You can try a valid update, a stale source, a wrong calculation, and the lost response. The controls run locally, and the static explanation remains readable without JavaScript.

[Try the walkthrough](/learn/verify-an-ai-update/) or read how these checks fit into my [AI workflows](/ai-workflows/).
