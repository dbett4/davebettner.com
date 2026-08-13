#!/usr/bin/env bash
set -euo pipefail

fail() {
  printf 'DEPLOY_PREFLIGHT_FAIL: %s\n' "$*" >&2
  exit 1
}

[[ "$(id -un)" == "hermes" ]] || fail "deploys must run as the hermes user"
[[ -n "${ACP_SESSION_ID:-}" ]] || fail "ACP_SESSION_ID is required"
[[ "$ACP_SESSION_ID" =~ ^[A-Za-z0-9._:@/-]{1,200}$ ]] || fail "ACP_SESSION_ID contains unsupported characters"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "deploy must run inside a Git worktree"
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

GIT_DIR="$(realpath "$(git rev-parse --absolute-git-dir)")"
COMMON_DIR="$(realpath "$(git rev-parse --path-format=absolute --git-common-dir)")"
EXPECTED_COMMON_DIR="$(realpath /srv/hermes/work/davebettner.com/.git)"
[[ "$GIT_DIR" != "$COMMON_DIR" ]] || fail "deploy must run from a clean isolated linked worktree, not the primary checkout"
[[ "$COMMON_DIR" == "$EXPECTED_COMMON_DIR" ]] || fail "deploy worktree is not linked to the canonical repository"

[[ -z "$(git status --porcelain=v1 --untracked-files=all)" ]] || fail "working tree is not clean"

git fetch --quiet --no-tags origin refs/heads/main:refs/remotes/origin/main || fail "could not fetch origin/main"
HEAD_SHA="$(git rev-parse HEAD)"
REMOTE_SHA="$(git rev-parse refs/remotes/origin/main)"
[[ "$HEAD_SHA" == "$REMOTE_SHA" ]] || fail "HEAD does not equal origin/main (HEAD=$HEAD_SHA origin/main=$REMOTE_SHA)"

AGENT_MIRROR_ROOT="${AGENT_MIRROR_ROOT:-/srv/agentops/repos}"
LEASE_TOOL="$AGENT_MIRROR_ROOT/agent-stack/scripts/acp_lease.sh"
LEASE_DIR="$AGENT_MIRROR_ROOT/agent-stack/.acp/leases"
[[ -x "$LEASE_TOOL" ]] || fail "ACP lease tool is unavailable at $LEASE_TOOL"

lease_slug() {
  local scope="$1" safe digest
  safe="$(printf '%s' "$scope" | tr '/ *?.:' '------' | sed 's/-\{2,\}/-/g; s/^-//; s/-$//')"
  digest="$(printf '%s' "$scope" | sha256sum | cut -c1-12)"
  printf '%s-%s' "${safe:-scope}" "$digest"
}

lease_value() {
  local file="$1" key="$2" line
  while IFS= read -r line; do
    if [[ "$line" == "$key="* ]]; then
      printf '%s' "${line#*=}"
      return 0
    fi
  done < "$file"
  return 1
}

verify_owned_lease() {
  local scope="$1" file runtime host session stored_scope heartbeat ttl now age token
  file="$LEASE_DIR/$(lease_slug "$scope").lease"
  [[ -f "$file" ]] || fail "required live ACP lease is missing for '$scope'"
  runtime="$(lease_value "$file" runtime || true)"
  host="$(lease_value "$file" host || true)"
  session="$(lease_value "$file" session_id || true)"
  stored_scope="$(lease_value "$file" scope || true)"
  heartbeat="$(lease_value "$file" heartbeat_ts || true)"
  ttl="$(lease_value "$file" ttl || true)"
  token="$(lease_value "$file" token || true)"
  [[ "$runtime" == "hermes" && "$host" == "$(hostname -s)" && "$session" == "$ACP_SESSION_ID" ]] || \
    fail "ACP lease '$scope' is not owned by this session"
  [[ "$stored_scope" == "$scope" ]] || fail "ACP lease scope mismatch for '$scope'"
  [[ "$heartbeat" =~ ^[0-9]+$ && "$ttl" =~ ^[0-9]+$ && -n "$token" ]] || fail "ACP lease '$scope' is malformed"
  now="$(date +%s)"
  age=$((now - heartbeat))
  [[ "$age" -ge 0 && "$age" -le "$ttl" ]] || fail "ACP lease '$scope' is expired"

  AGENT_MIRROR_ROOT="$AGENT_MIRROR_ROOT" "$LEASE_TOOL" refresh --scope "$scope" --ttl "$ttl" hermes >/dev/null || \
    fail "could not refresh ACP lease '$scope' as this session"

  session="$(lease_value "$file" session_id || true)"
  [[ "$session" == "$ACP_SESSION_ID" ]] || fail "ACP lease '$scope' changed ownership during preflight"
}

verify_owned_lease "repo:/srv/hermes/work/davebettner.com:deploy"
verify_owned_lease "cloudflare-worker:davebettner-com"

printf 'DEPLOY_PREFLIGHT_PASS head=%s session=%s\n' "$HEAD_SHA" "$ACP_SESSION_ID"
