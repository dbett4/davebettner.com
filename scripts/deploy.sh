#!/usr/bin/env bash
# Guarded davebettner.com deploy. Run from a clean linked release worktree.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WRANGLER="$ROOT/node_modules/.bin/wrangler"
cd "$ROOT"

./scripts/deploy-preflight.sh
[[ -x "$WRANGLER" ]] || {
  printf 'DEPLOY_FAIL: project-local Wrangler is missing; run npm ci first\n' >&2
  exit 1
}
exec "$WRANGLER" deploy
