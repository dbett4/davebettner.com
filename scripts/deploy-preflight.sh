#!/usr/bin/env bash
set -euo pipefail

fail() {
  printf 'DEPLOY_PREFLIGHT_FAIL: %s\n' "$*" >&2
  exit 1
}

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "deploy must run inside a Git checkout"
cd "$(git rev-parse --show-toplevel)"

[[ "${DEPLOY_LOCK_HELD:-}" == "1" ]] || fail "run ./scripts/deploy.sh (or npm run deploy); it takes the single-deployer lock first"

[[ -z "$(git status --porcelain=v1 --untracked-files=all)" ]] || fail "working tree is not clean"

git fetch --quiet --no-tags origin refs/heads/main:refs/remotes/origin/main || fail "could not fetch origin/main"
HEAD_SHA="$(git rev-parse HEAD)"
REMOTE_SHA="$(git rev-parse refs/remotes/origin/main)"
[[ "$HEAD_SHA" == "$REMOTE_SHA" ]] || fail "HEAD does not equal origin/main (HEAD=$HEAD_SHA origin/main=$REMOTE_SHA)"

printf 'DEPLOY_PREFLIGHT_PASS head=%s\n' "$HEAD_SHA"
