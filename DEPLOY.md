# davebettner.com deploy

**Deploys run as the user `dave` on `davgent`** from a clean clone of `origin/main`. The earlier hermes user, its ACP leases and `/srv/hermes` no longer exist.

Merging to main does not deploy. A deploy is a separate manual step.

## Deploy

1. Merge the reviewed change to `origin/main`.
2. Use a release checkout that is not your editing checkout. Make one if it is missing:

   ```bash
   git clone git@github.com:dbett4/davebettner.com.git /home/dave/work/davebettner.com-release
   ```

   Later deploys: `git -C /home/dave/work/davebettner.com-release pull --ff-only origin main`.
3. From that checkout:

   ```bash
   cd /home/dave/work/davebettner.com-release
   npm ci
   ./scripts/deploy.sh
   ```

`./scripts/deploy.sh` and `npm run deploy` take one deployer lock (`flock` on `$XDG_RUNTIME_DIR/davebettner-com-deploy.lock`, or `/tmp`), then run `scripts/deploy-preflight.sh`, then the project-local Wrangler. Wrangler's build hook runs `scripts/deploy-build.sh`, which repeats the preflight before and after generating the résumé and building. The preflight fails unless the lock is held, the working tree is clean, and `HEAD` equals a freshly fetched `origin/main`. Do not call Wrangler directly with another config: the build hook refuses to run without the lock.

4. Verify production, then leave the release checkout clean.

## Auth

Wrangler uses the Cloudflare login already on the machine for the user `dave`. Do not commit tokens, API keys or local Wrangler config.

## Verify (optional)

```bash
cd /home/dave/work/davebettner.com-release && npm test
```

`npm test` builds the site, serves `dist/` from a Node server on a free 127.0.0.1 port, and stops that server when the browser suites finish. Because `scripts/run-browser-checks.mjs` sets `SITE_URL` to that server for every suite, `npm test` always checks the local build; a `SITE_URL` you set beforehand has no effect. To check production, run a suite that reads `SITE_URL` directly, for example:

```bash
SITE_URL=https://davebettner.com node scripts/verify-theme.mjs
```

`scripts/verify-avatar-fade.mjs` ignores `SITE_URL` and always serves `dist/`, so it cannot check production.

`npm test` ends with the deploy-gate test, `bash scripts/test-deploy-preflight.sh prepush`. It checks that the wrapper runs the preflight before Wrangler, that the preflight refuses to run without the lock, that a second deployer cannot take the lock, and that a dirty tree is refused. It does not replace the real preflight, which freshly fetches `origin/main`.

## Agent rule

Deploy only from a clean clone of `origin/main` through `./scripts/deploy.sh`, as the user `dave` on `davgent`. Never from your editing checkout, a dirty tree, or an unpushed commit.
