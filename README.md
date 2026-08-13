# davebettner.com

Personal site for Dave Bettner. Live at [https://davebettner.com](https://davebettner.com).

It presents AI implementation and forward-deployed delivery work, with selected public engineering cases linked to inspectable GitHub repositories. Claims on the site are limited to what those public artifacts support. Several demos are synthetic labs or sanitized extracts, not customer-environment deployment claims. GitHub dates are publication dates, not original delivery dates.

## Stack

- [Astro](https://astro.build/) static site
- TypeScript
- [Cloudflare Workers](https://workers.cloudflare.com/) assets deploy via Wrangler (`wrangler.jsonc`)
- Playwright + system Chrome for résumé PDF generation and browser verification

## Local commands

```bash
npm install
npm run dev
npm run check
npm run build
npm test
```

`npm test` runs `scripts/verify-site.mjs` against a local preview (default `http://127.0.0.1:4321`). Set `SITE_URL` to point at another origin.

## Résumé PDF

Canonical source: `resume/dave-bettner-resume.html`.

```bash
npm run generate-resume
```

This writes a deterministic one-page Letter PDF to `public/dave-bettner-resume.pdf`, checks reading order with `pdftotext`/`pdfinfo`, and fails if the page count is not 1 or required markers are missing. Requires system Chrome/Chromium plus `pdftotext` and `pdfinfo`.

## Deploy

```bash
npm run deploy
```

On the production host, `npm run deploy` and `./scripts/deploy.sh` use the same guarded wrapper. The wrapper checks Git/session/lease authority before invoking the project-local Wrangler binary; Wrangler's project build hook regenerates the résumé and OG image, builds the site, and repeats the gate before upload. See `DEPLOY.md` for the required linked-worktree and ACP lease procedure.

## Provenance

Public repositories linked from the site are sanitized extracts published for inspection. No client data or credentials belong in those repos. Private client history stays confidential. Lab projects document synthetic failure and recovery paths; they are not presented as live customer tenants.
