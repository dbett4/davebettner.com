#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

./scripts/deploy-preflight.sh
npm run generate-resume
npm run generate-og
npm run build
./scripts/deploy-preflight.sh
