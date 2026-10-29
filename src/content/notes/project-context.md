---
title: Keeping context with the project
description: The handoff questions shaping Krowbar, and why a proposed change needs its source, expected result, and history nearby.
date: '2026-10-28'
project: krowbar
draft: false
---
A new work session starts with practical questions. What is the current state? What was already decided? Which change is still waiting for review? What can the next person or assistant safely do?

Krowbar is my exploration of keeping those answers with the project. The first integration supports Workiva reporting, where source records, proposed updates, and review decisions all need to stay understandable across handoffs.

## Make the next decision inspectable

A useful handoff gives the next owner a small set of concrete answers:

1. The current record and the source it depends on.
2. The proposed change and the result it is expected to produce.
3. The decision that permits the change, including what it covers.
4. The saved result, or the unresolved question if the action did not finish clearly.

Those answers help the reviewer evaluate the change and help the next work session pick it up. A conversation can explain the reasoning; the project also needs a durable record of the decision and result.

## Keep the proposal separate from the outcome

In Krowbar, an update starts as a draft. Its expected result can be inspected before it runs. The record of what happened remains available afterward, along with a way to undo the update.

Undo is part of the product experience. A reviewer should be able to understand which change is being reversed and inspect the resulting state. That matters when a person returns to the work later and needs to know which result is current.

## What the demo can show

The [public Krowbar demo](https://krowbar.app/) uses fictional reporting engagements and simulated updates. It lets visitors explore the review flow and try an undo. It is a demonstration of the interaction; the working engagement console remains private.

The same handoff questions shape my [agent-workflow approach](/ai-workflows/). I want the next owner to have a clear record to inspect before continuing the work.
