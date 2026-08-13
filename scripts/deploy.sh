#!/usr/bin/env bash
# Guarded davebettner.com deploy. Run from a clean linked release worktree.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

exec npm run deploy
