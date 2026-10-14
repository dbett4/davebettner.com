# Recording the workflow lesson

Use the live lesson at https://davebettner.com/learn/verify-an-ai-update/.
Record Dave speaking alongside the actual browser. This script is ready to record;
it does not establish an on-camera portfolio until the recording exists.

## Audience and purpose

For a technical buyer, implementation lead, or developer working on an AI tool.
Explain one decision they can use immediately: check application state before
declaring an automated update complete or retrying an uncertain write.

## Opening on camera

An AI assistant says it updated your system. What would convince you that it worked?

I work on enterprise implementations and AI workflows. Here is a small example
you can try yourself. It uses fictional inventory data and local checks, so you
can see every decision without connecting a real system.

## Valid update in the browser

We start with 100 units, receive 30, and ship 20. The proposed balance is 110.
First we check the calculation and the source revision. Then we approve the
change and read the application record.

The proposal, the write response, and the final application state answer different
questions. The final record is what tells us the application has the result we expected.

## Rejected proposal in the browser

Now the calculation is wrong. The proposal says 115. The source still supports 110.
The check rejects it before any write.

The same principle applies when a proposal uses an older source revision.
Correct arithmetic on out-of-date inputs can still produce the wrong update.

## Lost response in the browser

Here the application accepted the write, but the response was lost. That leaves
the caller uncertain. Retrying the write immediately could apply the action twice.

We read the record and reconcile it with the intended change. In this example,
the update happened once. The readback resolves the uncertainty without another write.

## Closing on camera

This is a teaching model, not a live AI agent or an enterprise integration.
The checks run in the browser. In a real application, I would connect the same
decisions to its source revisions, write identifiers, and readback API.

You can try all four cases on my website. The related workflow guide explains
how I apply these decisions in larger reporting and agent workflows.

## Recording check

- Show each control and its real result. Keep the pointer away from the text.
- Keep Dave's face visible for the opening and closing. Use his own voice.
- Check that the viewer can read the source values and rejected result.
- Add captions from the finished recording. Do not add outcome claims the demo cannot prove.
- Link the recording beside the lesson after it is reviewed and available.
