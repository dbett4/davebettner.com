#!/usr/bin/env bash
# Canonical davebettner.com deploy. Run on davgent as hermes only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ "$(whoami)" != "hermes" ]]; then
  echo "Run as hermes: sudo -u hermes bash -lc 'cd /srv/hermes/work/davebettner.com && ./scripts/deploy.sh'" >&2
  exit 1
fi

if [[ "$ROOT" != /srv/hermes/work/davebettner.com ]]; then
  echo "Canonical checkout is /srv/hermes/work/davebettner.com; refusing deploy from $ROOT" >&2
  exit 1
fi

# Fail closed: regenerate résumé, then check/build/deploy via npm run deploy.
npm run deploy
