#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
GATE="$ROOT/scripts/deploy-preflight.sh"
DEPLOY_WRAPPER="$ROOT/scripts/deploy.sh"
MODE="${1:-prepush}"
cd "$ROOT"

fail() {
  printf 'DEPLOY_GATE_TEST_FAIL: %s\n' "$*" >&2
  exit 1
}

expect_failure() {
  local label="$1" expected="$2"
  shift 2
  local output status
  set +e
  output="$("$@" 2>&1)"
  status=$?
  set -e
  [[ "$status" -ne 0 ]] || fail "$label unexpectedly passed"
  [[ "$output" == *"$expected"* ]] || fail "$label did not report '$expected': $output"
  printf 'PASS %s\n' "$label"
}

[[ -f "$GATE" ]] || fail "missing gate: $GATE"
[[ -f "$DEPLOY_WRAPPER" ]] || fail "missing deploy wrapper: $DEPLOY_WRAPPER"
[[ "$(node -p "require('./package.json').scripts.deploy")" == "./scripts/deploy.sh" ]] || \
  fail "package deploy script does not use the guarded wrapper"
[[ "$(node -p "require('./package.json').scripts['deploy:wrangler'] || ''")" == "" ]] || \
  fail "package exposes an unguarded Wrangler deploy script"
grep -Fq 'WRANGLER="$ROOT/node_modules/.bin/wrangler"' "$DEPLOY_WRAPPER" || \
  fail "deploy wrapper does not pin the project-local Wrangler binary"
! grep -Eq '(^|[[:space:]])npx([[:space:]]|$)' "$DEPLOY_WRAPPER" || \
  fail "deploy wrapper uses version-sensitive npx dispatch"

expect_failure \
  "preflight refuses to run without the deploy lock" \
  "takes the single-deployer lock first" \
  env -u DEPLOY_LOCK_HELD bash "$GATE"

lock="$(mktemp)"
fake_root="$(mktemp -d)"
trap 'rm -rf "$lock" "$fake_root"' EXIT
mkdir -p "$fake_root/scripts" "$fake_root/node_modules/.bin"
cp "$DEPLOY_WRAPPER" "$fake_root/scripts/deploy.sh"
cat > "$fake_root/scripts/deploy-preflight.sh" <<'EOF'
#!/usr/bin/env bash
printf 'preflight reached\n'
exit 1
EOF
printf '#!/usr/bin/env bash\nprintf invoked > "$DEPLOY_RUNNER_MARKER"\n' > "$fake_root/node_modules/.bin/wrangler"
chmod 755 "$fake_root/scripts/"*.sh "$fake_root/node_modules/.bin/wrangler"
expect_failure \
  "deploy wrapper runs preflight before Wrangler" \
  "preflight reached" \
  env DEPLOY_LOCK_FILE="$lock" DEPLOY_RUNNER_MARKER="$fake_root/marker" bash "$fake_root/scripts/deploy.sh"
[[ ! -e "$fake_root/marker" ]] || fail "deploy wrapper invoked Wrangler before preflight"
expect_failure \
  "a second deployer cannot take the lock" \
  "another deploy holds the lock" \
  bash -c 'exec 8> "$1"; flock -n 8; DEPLOY_LOCK_FILE="$1" bash "$2"' _ "$lock" "$fake_root/scripts/deploy.sh"

if [[ -n "$(git status --porcelain=v1 --untracked-files=all)" ]]; then
  printf 'SKIP dirty-tree probe (tree already dirty)\n'
else
  probe="$ROOT/.deploy-gate-dirty-probe-$$"
  trap 'rm -f "$probe"; rm -rf "$lock" "$fake_root"' EXIT
  printf 'dirty\n' > "$probe"
  expect_failure "dirty tree cannot deploy" "working tree is not clean" env DEPLOY_LOCK_HELD=1 bash "$GATE"
  rm -f "$probe"
fi

if [[ "$MODE" == "ahead" ]]; then
  expect_failure "unpushed HEAD cannot deploy" "HEAD does not equal origin/main" env DEPLOY_LOCK_HELD=1 bash "$GATE"
fi

printf 'DEPLOY_GATE_TEST_PASS mode=%s\n' "$MODE"
