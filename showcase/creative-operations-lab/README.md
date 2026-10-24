# Creative operations lab

Try a creative-review and supplier-qualification workflow. Approve a concept, add sample and fulfillment evidence, then change the revision to see which decisions need review again.

Synthetic demo with invented records and no live integrations. The workflow runs deterministically in your browser.

Run the behavior checks with `node --test workflow.test.mjs`.

Serve this directory with `python3 -m http.server 8080`, then open `http://localhost:8080`. Approve revision 1 and accept both evidence fields. The status becomes ready for a human release decision. Revise the concept; approval becomes stale and both simulated evidence fields clear. Reset restores the initial state.
