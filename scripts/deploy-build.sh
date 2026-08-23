#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

./scripts/deploy-preflight.sh

RESUME_PDF="$ROOT/public/dave-bettner-resume.pdf"
mkdir -p "$ROOT/tmp"
RESUME_BACKUP="$(mktemp "$ROOT/tmp/resume-deploy.XXXXXX")"
cp "$RESUME_PDF" "$RESUME_BACKUP"
restore_resume_pdf() {
  cp "$RESUME_BACKUP" "$RESUME_PDF"
  rm -f "$RESUME_BACKUP"
}
trap restore_resume_pdf EXIT
ORIGINAL_RESUME_SHA="$(sha256sum "$RESUME_PDF" | awk '{print $1}')"
npm run generate-resume
GENERATED_RESUME_SHA="$(sha256sum "$RESUME_PDF" | awk '{print $1}')"
if [[ "$ORIGINAL_RESUME_SHA" == "$GENERATED_RESUME_SHA" ]]; then
  printf 'RESUME_PDF_SOURCE_GENERATED sha256=%s\n' "$GENERATED_RESUME_SHA"
else
  printf 'RESUME_PDF_SOURCE_PRESERVED committed=%s generated=%s\n' "$ORIGINAL_RESUME_SHA" "$GENERATED_RESUME_SHA"
fi
restore_resume_pdf
trap - EXIT
npm run generate-og
npm run build
./scripts/deploy-preflight.sh
