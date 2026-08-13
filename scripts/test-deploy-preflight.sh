#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
GATE="$ROOT/scripts/deploy-preflight.sh"
DEPLOY_WRAPPER="$ROOT/scripts/deploy.sh"
CANONICAL_ROOT="/srv/hermes/work/davebettner.com"
MODE="${1:-prepush}"
CURRENT_SESSION="${ACP_SESSION_ID:-}"
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

fake_identity_bin="$(mktemp -d)"
trap 'rm -rf "$fake_identity_bin"' EXIT
cat > "$fake_identity_bin/id" <<'EOF'
#!/usr/bin/env bash
printf 'not-hermes\n'
EOF
chmod 755 "$fake_identity_bin/id"
expect_failure \
  "non-hermes user cannot deploy" \
  "deploys must run as the hermes user" \
  env PATH="$fake_identity_bin:$PATH" ACP_SESSION_ID="deploy-gate-test" bash "$GATE"
rm -rf "$fake_identity_bin"
trap - EXIT

fake_root="$(mktemp -d)"
fake_runner_marker="$fake_root/wrangler-invoked"
trap 'rm -rf "$fake_root"' EXIT
mkdir -p "$fake_root/scripts" "$fake_root/node_modules/.bin"
cp "$DEPLOY_WRAPPER" "$fake_root/scripts/deploy.sh"
cp "$GATE" "$fake_root/scripts/deploy-preflight.sh"
cat > "$fake_root/node_modules/.bin/wrangler" <<'EOF'
#!/usr/bin/env bash
printf 'invoked\n' > "$DEPLOY_RUNNER_MARKER"
exit 0
EOF
chmod 755 "$fake_root/scripts/deploy.sh" "$fake_root/scripts/deploy-preflight.sh" "$fake_root/node_modules/.bin/wrangler"
expect_failure \
  "deploy wrapper checks preflight before Wrangler" \
  "ACP_SESSION_ID is required" \
  env -u ACP_SESSION_ID DEPLOY_RUNNER_MARKER="$fake_runner_marker" bash "$fake_root/scripts/deploy.sh"
[[ ! -e "$fake_runner_marker" ]] || fail "deploy wrapper invoked Wrangler before preflight"
rm -rf "$fake_root"
trap - EXIT

expect_failure \
  "missing session identity" \
  "ACP_SESSION_ID is required" \
  env -u ACP_SESSION_ID bash "$GATE"

expect_failure \
  "primary checkout is not an isolated worktree" \
  "isolated linked worktree" \
  env ACP_SESSION_ID="${CURRENT_SESSION:-deploy-gate-test}" bash -c "cd '$CANONICAL_ROOT' && '$GATE'"

GIT_DIR="$(realpath "$(git rev-parse --absolute-git-dir)")"
COMMON_DIR="$(realpath "$(git rev-parse --path-format=absolute --git-common-dir)")"
if [[ "$GIT_DIR" != "$COMMON_DIR" ]]; then
  dirty_probe="$ROOT/.deploy-gate-dirty-probe-$$"
  trap 'rm -f "$dirty_probe"' EXIT
  printf 'dirty\n' > "$dirty_probe"
  expect_failure \
    "dirty release worktree" \
    "working tree is not clean" \
    env ACP_SESSION_ID="${CURRENT_SESSION:-deploy-gate-test}" bash "$GATE"
  rm -f "$dirty_probe"
  trap - EXIT
else
  printf 'SKIP dirty release worktree (primary checkout)\n'
fi

if [[ "$MODE" == "postpush" ]]; then
  [[ -n "$CURRENT_SESSION" ]] || fail "postpush mode requires ACP_SESSION_ID"
  "$GATE"
  printf 'PASS current session owns both deployment leases\n'

  fake_mirror="$(mktemp -d)"
  mkdir -p "$fake_mirror/agent-stack/scripts"
  printf '#!/usr/bin/env bash\nexit 1\n' > "$fake_mirror/agent-stack/scripts/acp_lease.sh"
  chmod 755 "$fake_mirror/agent-stack/scripts/acp_lease.sh"
  expect_failure \
    "missing deployment leases" \
    "required live ACP lease is missing" \
    env AGENT_MIRROR_ROOT="$fake_mirror" ACP_SESSION_ID="$CURRENT_SESSION" bash "$GATE"
  rm -rf "$fake_mirror"

  expect_failure \
    "foreign session cannot use leases" \
    "is not owned by this session" \
    env ACP_SESSION_ID="foreign-deploy-gate-test" bash "$GATE"
fi

if [[ "$MODE" == "ahead" ]]; then
  expect_failure \
    "unpushed HEAD cannot deploy" \
    "HEAD does not equal origin/main" \
    env ACP_SESSION_ID="${CURRENT_SESSION:-deploy-gate-test}" bash "$GATE"
fi

printf 'DEPLOY_GATE_TEST_PASS mode=%s\n' "$MODE"
