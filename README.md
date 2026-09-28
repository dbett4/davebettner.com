# davebettner.com

Personal site for Dave Bettner. Live at [https://davebettner.com](https://davebettner.com).

It presents AI implementation and forward-deployed delivery work, with selected public engineering cases linked to inspectable GitHub repositories. Claims on the site are limited to what those public artifacts support. Several demos are synthetic labs or sanitized extracts, not customer-environment deployment claims. GitHub dates are publication dates, not original delivery dates.

## Stack

- [Astro](https://astro.build/) static site
- TypeScript
- [Cloudflare Workers](https://workers.cloudflare.com/) assets deploy via Wrangler (`wrangler.jsonc`)
- Playwright (Node and Python) driving system Google Chrome, with axe-core, sharp and ffmpeg, for browser and media verification

## Local commands

```bash
npm install
npm run dev
npm run check
npm run build
npm test
```

## Tests

`npm test` runs four steps in order and stops at the first failure:

1. `npm run generate-resume`, the résumé hash check and copy described under Résumé PDF.
2. `npm run build`, which runs `astro check` and then `astro build` into `dist/`.
3. `node --test scripts/ramp-profile.test.mjs`, static assertions on the built files: profile copy, the robots tag, the résumé digest, and the workstation-loop media hashes recorded in `animation/workstation-loop/render.json`.
4. `node scripts/run-browser-checks.mjs`, which serves `dist/` with `/usr/bin/python3 -m http.server` on a free 127.0.0.1 port and runs each suite below, in order, with `SITE_URL` set to that server.

| Suite | Checks |
| --- | --- |
| `scripts/verify-ramp-profile.py` | Every non-lab route at four widths, axe WCAG A/AA, internal links, the résumé download's hash, the no-JavaScript fallback |
| `scripts/verify-avatar-fade.mjs` | Light-only rendering under light and dark OS settings, the avatar home link, no theme or pause controls; serves `dist/` itself |
| `scripts/verify-workstation-video.mjs` | Hero loop playback and fallbacks; decodes the served MP4 with `ffmpeg` to check motion and the loop seam |
| `scripts/verify-theme.mjs` | Light-only rendering under a dark OS setting, a saved dark preference, blocked storage and no JavaScript |
| `scripts/verify-visitor-journey.mjs` | The primary action, skip link, project link names, 320 px masthead and reduced motion |
| `scripts/capture-soft-fade.mjs` | Captures the no-JavaScript homepage scene at four widths |
| `scripts/verify-soft-fade.mjs` | Compares the committed video's first frame (decoded with `ffmpeg`) and poster with the source art, and checks those captures for CSS masks |

Because `run-browser-checks.mjs` sets `SITE_URL` itself, `npm test` always checks the local build. To check another origin, run a suite that reads `SITE_URL` directly, for example `SITE_URL=https://davebettner.com node scripts/verify-theme.mjs`.

Suites write screenshots and JSON results under `node_modules/.cache/`, `review/workstation-loop/browser/` and `review/light-soft-fade/fade/`, all gitignored, so a run leaves `git status` clean.

### Prerequisites

Beyond `npm install`, `npm test` needs:

- Google Chrome at `/usr/bin/google-chrome`. Every browser suite launches that exact path; a Playwright-downloaded Chromium is not used.
- `ffmpeg` on `PATH`, for the video and soft-fade checks.
- `/usr/bin/python3`, which serves `dist/`.
- A Python with the `playwright` package, for `verify-ramp-profile.py`. Set `SITE_TEST_PYTHON` to its absolute path; the default is `/usr/bin/python3`.

CI (`.github/workflows/verify.yml`) runs `npm test` on pushes to `main` and on pull requests, using `ubuntu-latest` and Node 22. It installs `ffmpeg` with apt, runs `npx --no-install playwright-core install --with-deps chromium`, and installs `playwright==1.62.0` into a venv that it passes as `SITE_TEST_PYTHON`. Chrome comes from the runner image.

## Résumé PDF

The download is the supplied PDF, `resume/dave-bettner-current.pdf`, published unchanged.

```bash
npm run generate-resume
```

`scripts/generate-resume-pdf.mjs` checks the file's SHA-256 against the digest pinned in the script and copies it byte for byte to `public/dave-bettner-resume.pdf`. If the hash differs, it stops with `Supplied resume changed; review before replacing the download.` and copies nothing. It needs only Node.

To replace the résumé, update the PDF and the pinned digest in both `scripts/generate-resume-pdf.mjs` and `scripts/ramp-profile.test.mjs`, rerun `npm run generate-resume`, and commit the refreshed `public/dave-bettner-resume.pdf`.

`resume/dave-bettner-resume.html` is no longer the source. Only the archived HTML-to-PDF renderer, `review/ramp/archived-resume-generator.mjs`, reads it.

## Deploy

```bash
npm run deploy
```

On the production host, `npm run deploy` and `./scripts/deploy.sh` use the same guarded wrapper. The wrapper checks Git/session/lease authority before invoking the project-local Wrangler binary; Wrangler's project build hook (`scripts/deploy-build.sh`) runs the résumé hash check, builds the site, and repeats the gate before upload. The deployed résumé is the committed `public/dave-bettner-resume.pdf`. See `DEPLOY.md` for the required linked-worktree and ACP lease procedure.

## Provenance

Public repositories linked from the site are sanitized extracts published for inspection. No client data or credentials belong in those repos. Private client history stays confidential. Lab projects document synthetic failure and recovery paths; they are not presented as live customer tenants.
