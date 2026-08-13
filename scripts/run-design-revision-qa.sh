#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm test
node scripts/capture-design-revision-qa.mjs
