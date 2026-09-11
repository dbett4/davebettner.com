# Accounting Acceptance Lab evidence

## Scope

This is a real offline run of the existing Accounting Acceptance Lab from an isolated copy at `review/depth/lab-run/`. The copied source is byte-identical to the selected files at source revision `1fccee73cb37b8bf132aef8707cd44130be07653` (`git archive` SHA-256 `2a7b5a37bacd77ab9810795772b293f2f478acde21a71e796e724a60d8144ff2`). It used `/usr/bin/python3` 3.12.3, recorded synthetic fixtures, and local SQLite only. The source repository's tracked worktree remained clean; run state was written only under `lab-run/.state/`.

## Reproduce

From `review/depth/lab-run/`:

```bash
env PYTHONPATH=src AAL_STATE_DIR=.state /usr/bin/python3 -m aal.cli demo
env PYTHONPATH=src AAL_STATE_DIR=.state /usr/bin/python3 -m aal.cli inspect C03
env PYTHONPATH=src AAL_STATE_DIR=.state /usr/bin/python3 -m aal.cli approve C03 --actor offline-reviewer --reason "reviewed synthetic evidence and policy"
env PYTHONPATH=src AAL_STATE_DIR=.state /usr/bin/python3 -m aal.cli inspect C03
env PYTHONPATH=src AAL_STATE_DIR=.state /usr/bin/python3 -m aal.cli inspect C12
# Read .state/lab.db attempts/effects for C12; see raw/C12.attempts.command.txt
env PYTHONPATH=src AAL_STATE_DIR=.state /usr/bin/python3 -m aal.cli replay C12:timing:v1
env PYTHONPATH=src AAL_STATE_DIR=.state /usr/bin/python3 -m aal.cli inspect C12
env PYTHONPATH=src AAL_STATE_DIR=.state /usr/bin/python3 -m aal.cli benchmark
env PYTHONPATH=src AAL_STATE_DIR=.state /usr/bin/python3 -m unittest discover -s tests -v
```

The exact commands and raw outputs are saved in `lab-run/raw/`. The structured walkthrough artifact is `visitor-evidence.json`.

## Walkthrough-safe findings

- **C03 — synthetic duplicate discrepancy:** GL record `g3`, `100.00` USD, `2026-01-04`, reference `INV-003`, fixture `duplicate_count=2`. Deterministic reconciliation is unresolved because no exact bank match is present. Retrieved citation `policy:p-duplicate@v2` says: “A duplicate invoice paid twice may be reversed only after invoice and amount confirmation.” The recorded proposal recommends `reverse_duplicate` for `-100.00` USD, low risk, confidence `0.98`, provenance `recorded_model`; the demo verdict is `blocked_pending_human_approval`.
- **Approval boundary:** the isolated CLI approval recorded `approved` by actor string `offline-reviewer`, advanced C03 from generation `1` to `2`, and kept effect count at `0`. Approval is not a ledger effect; the CLI reports a separately constructed bounded action as the next step.
- **C12 — separate lost-write-response recovery:** GL record `g12`, `25.00` USD, `2026-01-12`, reference `TIM-012`. The stored attempt is `effect_unknown`; replay of `C12:timing:v1` returned `accepted_existing_effect`, with effect `eff-58a0a12b0147ed2f`. The final observed effect count is exactly `1`, state `accepted_recovered`, verdict `accepted_after_read_before_retry`.
- The demo covered `12` cases: `0` false accepts, `0` unsupported accepts, and recovery success `1`. The selected unit tests ran `23` tests and passed.

## Limits

All records, policies, proposals, approvals, and effects are synthetic. `recorded_model` is fixture provenance, not live inference; the live backend was unexercised. C12 simulates an unknown response after a local SQLite commit, not a real external ledger/network failure. The C03 actor is a local test string, not evidence of human or production authorization. The benchmark verifier is executable rule-based logic, not third-party verification.
