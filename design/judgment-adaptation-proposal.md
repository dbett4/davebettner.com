# Judgment-inspired case presentation — proposal

Status: proposal only. No production or canonical site change.

## The change in one sentence

Move the Work detail pages from **project description → evidence map → technical notes** to **recognizable failure → observed behavior → consequence → intervention → proof → boundary**.

This borrows Judgment Labs' explanatory sequence and instrument-like presentation without borrowing its copy, product claims, branding, or UI.

## Before

### Visitor sees

> Hermes Deployment Lab
>
> Scope tools, separate approval, and keep weak evidence labeled weak.
>
> Two operating-pattern labs for the hard case: an agent can touch an internal system...
>
> [View repository] [Résumé] [Technical notes]
>
> Evidence map
> Method → proof → boundary
>
> The system scopes tools, keeps operator approval separate, and resumes after a post-commit fault without double-writing.
>
> 01 ... 02 ... 03 ...
>
> Boundary: synthetic labs, not a customer tenant...

### Strengths

- Honest and technically specific
- Strong evidence and boundary discipline
- Direct repository access

### Problem

The visitor has to synthesize the story. The page tells them what exists, but not quickly enough:

1. What went wrong?
2. Why did it matter?
3. What behavior was dangerous or ambiguous?
4. What did Dave change?
5. How was the change tested?

The page reads like a technically good project README rather than an investigation someone can understand in seconds.

## After — proposed Hermes Deployment Lab detail page

### Opening panel

**A recovery problem, not a framework demo**

> The agent completed the external action, then the run failed before it received confirmation. Retrying could have written the change twice.

Primary actions:

- **Inspect the recovery path**
- View repository
- Read proof guide

A small visual timeline sits beside the opening copy:

`request → bounded tool → external action → missing confirmation → safe recovery`

### Section 1 — What happened

A short, concrete incident narrative:

> The hard case is not only whether an agent can call a tool. It is what happens when the tool succeeds and the coordinator does not know it succeeded.
>
> A naïve retry treats uncertainty as failure. In a customer workflow, that can create a duplicate write.

The page shows the failure state as a visible step in the timeline—not as an abstract architecture diagram.

### Section 2 — What the system observed

Three compact evidence rows:

| Observed behavior | Why it matters |
|---|---|
| External action may have completed | A retry can duplicate the write |
| Coordinator lacks a native confirmation | The run cannot be marked complete honestly |
| Recovery must distinguish unknown from failed | The next action needs a bounded decision |

### Section 3 — What changed

Show the intervention as a sequence:

1. Scope the available action
2. Separate operator approval from execution
3. Persist the intended operation
4. Recover by checking for the first result
5. Only then continue or stop for review

The visual should look like a working investigation surface: one dominant path, one red/amber uncertainty point, and one confirmed readback state. Not a dashboard and not a decorative network diagram.

### Section 4 — Sanity check before ship

Use the existing proof as the answer to “how do I know?”:

- fresh-clone test suite
- native telemetry/trace
- restart/replay coverage
- credential-free tests
- explicit negative cases
- cloud infrastructure remains validate-only

The evidence appears adjacent to the behavior it proves, rather than in a separate generic evidence block.

### Section 5 — What remains open

Keep the existing boundary, but make it a first-class final state:

> Synthetic lab, not a customer tenant. Cloud apply is not attested. The live one-shot remains `needs_review`; no external action or human disposition is being claimed.

This turns the boundary into trust-building product behavior—the same way Judgment makes uncertainty and recurring behavior visible—instead of a disclaimer at the bottom.

## Visual adaptation

### Borrow

- Concrete incident first
- Conversation-like or sequential explanation
- Visible behavior states
- Consequence attached to the behavior
- Evidence placed next to the claim it supports
- Strong “ask a question / inspect the trace / run the test” actions
- Research and method shown as working machinery

### Do not borrow

- Judgment Labs' exact wording
- Their Slack conversation, customer examples, or visual identity
- Their product UI or screenshots
- Their claims about production customers or agent scale
- Their orange/black product treatment as a replacement for Dave's Interstellar system

### Dave-specific visual language

- Keep the existing carbon / Tide Sphere world
- Use a ruled, asymmetric evidence timeline
- Use orange only for the uncertain/failure state
- Use teal/blue for confirmed proof states
- Use the existing evidence motifs, but make them carry a sequence rather than sit as decoration
- Keep repositories and proof guides one click away

## Homepage change

Do **not** add a generic “continuous improvement” section to the homepage.

Instead, update the homepage's selected-work teaser so each item has one sharp incident line:

### Before

> Deployment recovery, deduplication, and policy-bounded evaluation. Each item links to inspectable code and its limits.

### After

> When an agent is uncertain whether a write completed, a retry can be more dangerous than a failure. These cases show how I bound the action, recover safely, and prove what happened.

Then use the case detail page for the full incident → intervention → proof sequence.

## Recommended implementation order

1. Rebuild only `/work/hermes-deployment-lab/` as the reference case.
2. Capture desktop and mobile screenshots.
3. Compare the visitor's first 30 seconds against the current page.
4. If the pattern works, apply it to Dedup Read-Back Bridge and Wingman.
5. Leave the regulated-reporting and evaluation cases with their own domain-specific incident stories; do not force every project into identical copy.

## Acceptance condition

A recruiter or technical leader should be able to answer, without opening the repository:

- What failed or was at risk?
- Why was it consequential?
- What did Dave change?
- What evidence supports the claim?
- What does Dave explicitly not claim?

The page passes only if all five are visible within the first scroll and the visual sequence makes the answer easier to understand than the current README-like layout.
