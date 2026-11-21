#!/usr/bin/env bash
# Guarded davebettner.com deploy. Run from a clean checkout of origin/main.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WRANGLER="$ROOT/node_modules/.bin/wrangler"
cd "$ROOT"

exec 9> "${DEPLOY_LOCK_FILE:-${XDG_RUNTIME_DIR:-/tmp}/davebettner-com-deploy.lock}"
flock -n 9 || {
  printf 'DEPLOY_FAIL: another deploy holds the lock\n' >&2
  exit 1
}
export DEPLOY_LOCK_HELD=1

./scripts/deploy-preflight.sh
[[ -x "$WRANGLER" ]] || {
  printf 'DEPLOY_FAIL: project-local Wrangler is missing; run npm ci first\n' >&2
  exit 1
}
"$WRANGLER" deploy
