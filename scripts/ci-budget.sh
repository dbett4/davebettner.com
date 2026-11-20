#!/usr/bin/env bash
# Fails the job when more time has passed since it started than the budget allows.
# Usage: scripts/ci-budget.sh <name> <seconds>. JOB_START (epoch seconds) is set by the workflow's first step.
set -euo pipefail
name="$1"
budget="$2"
elapsed=$(( $(date +%s) - JOB_START ))
echo "$name: ${elapsed}s used of ${budget}s"
if [ "$elapsed" -gt "$budget" ]; then
  echo "::error::$name took ${elapsed}s and its budget is ${budget}s. Find the step that grew with 'node scripts/ci-audit.mjs --runs 20', fix it, and change the budget in .github/workflows/verify.yml only to record a measured gain, never to make a slow run pass."
  exit 1
fi
