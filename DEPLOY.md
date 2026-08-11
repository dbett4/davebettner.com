# davebettner.com deploy

**Canonical checkout:** `/srv/hermes/work/davebettner.com` on `davgent`

Edit and deploy from that path only. Other copies are recovery mirrors.

## Deploy

```bash
ssh davgent 'sudo -u hermes bash -lc "cd /srv/hermes/work/davebettner.com && ./scripts/deploy.sh"'
```

`scripts/deploy.sh` enforces the `hermes` user and canonical checkout, then runs `npm run deploy`, which:

1. Regenerates `public/dave-bettner-resume.pdf` from `resume/dave-bettner-resume.html` (`npm run generate-resume`) and fails the deploy if generation fails
2. Runs `astro check && astro build`
3. Runs `wrangler deploy` to the Cloudflare Workers custom domain

## Auth

Deploy as `hermes`. Wrangler OAuth for that user must already be configured on the host. Do not commit tokens, API keys, or local Wrangler config.

## Verify (optional)

```bash
ssh davgent 'sudo -u hermes bash -lc "cd /srv/hermes/work/davebettner.com && npm run generate-resume && npm run build && npm test"'
```

`npm test` starts and tears down its own local preview server. Set `SITE_URL=https://davebettner.com` to run the same browser assertions against production.

## Agent rule

All content edits and deploys for davebettner.com happen on the VPS path above. Do not block on Mac SSH, Mac Cloudflare credentials, or Mac `wrangler`.
