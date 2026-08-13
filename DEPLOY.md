# davebettner.com deploy

**Canonical repository:** `/srv/hermes/work/davebettner.com` on `davgent`

Edit in the canonical checkout, but deploy only from a clean linked release worktree created from pushed `origin/main`.

## Deploy

1. Push the reviewed commit to `origin/main`.
2. Fetch it and create a linked release worktree:

   ```bash
   git -C /srv/hermes/work/davebettner.com fetch origin main
   git -C /srv/hermes/work/davebettner.com worktree add --detach /srv/hermes/work/davebettner.com-release origin/main
   cd /srv/hermes/work/davebettner.com-release
   npm ci
   ```

3. Set one durable ACP session ID and claim both required scopes:

   ```bash
   export AGENT_MIRROR_ROOT=/srv/agentops/repos
   export ACP_SESSION_ID="<durable-session-id>"
   /srv/agentops/repos/agent-stack/scripts/acp_lease.sh claim --scope 'repo:/srv/hermes/work/davebettner.com:deploy' --ttl 3600 hermes
   /srv/agentops/repos/agent-stack/scripts/acp_lease.sh claim --scope 'cloudflare-worker:davebettner-com' --ttl 3600 hermes
   ```

4. Run `./scripts/deploy.sh`.

Both supported entrypoints—`./scripts/deploy.sh` and `npm run deploy`—run `scripts/deploy-preflight.sh` before invoking the project-local Wrangler binary. Wrangler's project build hook then runs `scripts/deploy-build.sh`, which repeats the gate before and after generation/build. The supported path fails closed unless the process is `hermes`, `ACP_SESSION_ID` is explicit, the worktree is a clean linked worktree, `HEAD` equals freshly fetched `origin/main`, and both leases are live and owned by that session.

Do not invoke Wrangler with an alternate config. Repository scripts cannot police an arbitrary external Wrangler configuration that omits this project's guarded build hook; that is an unsupported out-of-band deployment path, not an approved bypass.

5. Verify production, release both scopes, and remove the release worktree.

## Auth

Deploy as `hermes`. Wrangler OAuth for that user must already be configured on the host. Do not commit tokens, API keys, or local Wrangler config.

## Verify (optional)

```bash
ssh davgent 'sudo -u hermes bash -lc "cd /srv/hermes/work/davebettner.com && npm test"'
```

`npm test` starts and tears down its own local preview server. Set `SITE_URL=https://davebettner.com` to run the same browser assertions against production.

The pre-push harness verifies wrapper ordering and fail-closed rejection for a non-`hermes` user, missing session identity, the primary checkout, and a dirty linked worktree. It does not substitute for release-time authority: the real deploy preflight freshly fetches `origin/main` and verifies the current session's two live ACP leases before Wrangler runs.

## Agent rule

All content edits and deploys for davebettner.com happen on the VPS. Do not deploy from the primary checkout, a dirty worktree, an unpushed commit, or without both ACP leases. Do not block on Mac SSH, Mac Cloudflare credentials, or Mac `wrangler`.
