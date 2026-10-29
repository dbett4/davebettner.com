# davebettner.com

Personal site for Dave Bettner. Live at [https://davebettner.com](https://davebettner.com).

The site brings together my product work, reporting tools, and career history. Homebase is the current focus, followed by Passal, Leasekite, Krowbar, and Lockfield.

Public technical examples use fictional or mock data. Their repositories document what you can run and the limits of each example.

## Build notes and Now

`/notes/` publishes Markdown from `src/content/notes/`. Each file needs a title,
description, publication date, project (`homebase`, `krowbar`, or `ai-workflows`),
and `draft: false`. Notes default to draft and are excluded from article routes,
the homepage, index, and RSS until explicitly published. The filename becomes
the URL; preserve published filenames to keep incoming links working.

`src/content.config.ts` validates the metadata. The homepage, note index and
`/rss.xml` read the same published collection, ordered by publication date with
a stable filename order for ties. The feed uses Astro’s official RSS package.
`/now/` is a dated, manually maintained snapshot; update its displayed date and
description when changing the focus. A successful deployment does not update it
automatically. Keep private records and unsupported results out of public posts.

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

`npm test` runs five steps in order and stops at the first failure:

1. `npm run generate-resume`, the résumé hash check and copy described under Résumé PDF.
2. `npm run build`, which runs `astro check` and then `astro build` into `dist/`.
3. `node --test scripts/ramp-profile.test.mjs`, static assertions on the built files: profile copy, the robots tag, the résumé digest, and the workstation-loop media hashes recorded in `animation/workstation-loop/render.json`.
4. `node scripts/run-browser-checks.mjs`, which serves `dist/` with `/usr/bin/python3 -m http.server` on a free 127.0.0.1 port and runs each suite in the table below, in order, with `SITE_URL` set to that server.
5. `bash scripts/test-deploy-preflight.sh prepush`, the deploy-gate test. It checks that `npm run deploy` goes through `scripts/deploy.sh`, which pins the project-local Wrangler and runs `scripts/deploy-preflight.sh` first, and that the gate rejects a non-`hermes` user and a missing `ACP_SESSION_ID`. Run as `hermes`, it also checks that the gate rejects the canonical primary checkout and, from a linked release worktree, a dirty worktree. Other users and CI skip those two probes.

| Suite | Checks |
| --- | --- |
| `scripts/verify-ramp-profile.py` | Every non-lab route at four widths, axe WCAG A/AA, internal links, the résumé download's hash, the no-JavaScript fallback |
| `scripts/verify-build-notes.mjs` | Notes navigation, valid RSS matching the index, full articles and structured data, and Now-to-Homebase navigation on desktop and phone |
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

The download is the reviewed two-page `resume/dave-bettner-business-operations.pdf`, generated from `resume/dave-bettner-business-operations-candidate.md` and its HTML draft. `resume/ai-workflows-manifest.json` binds the exact source, HTML, stylesheet, font, and PDF hashes.

```bash
npm run generate-resume
```

The generator verifies the active manifest, verifies the retained previous manifest and original PDFs, then copies the reviewed PDF byte for byte to `public/dave-bettner-resume.pdf`. It stops before copying if a hash differs. It does not re-render or change the approved PDF.

`resume/ai-workflows-manifest-before-business-operations.json` retains the previous source/export binding; the previous Markdown, HTML, and PDF remain at their original paths for recovery. Restore that manifest and regenerate to recover the earlier download.

For a new draft, edit the candidate Markdown and regenerate its HTML with Pandoc and `resume/ai-workflows.css`. Set `REVIEW_OUTPUT_DIR` to a directory outside the repository and run `node scripts/render-career-review.mjs` against the local static preview on port 4322. Review the external PDF and page renders before copying the exact reviewed export into `resume/` and updating manifest hashes. No review evidence belongs in the public repository.

`resume/dave-bettner-resume.html` and the older resume renderers remain historical sources; they do not define the active download.

## Deploy

```bash
npm run deploy
```

On the production host, `npm run deploy` and `./scripts/deploy.sh` use the same guarded wrapper. The wrapper checks Git/session/lease authority before invoking the project-local Wrangler binary; Wrangler's project build hook (`scripts/deploy-build.sh`) runs the résumé hash check, builds the site, and repeats the gate before upload. The deployed résumé is the committed `public/dave-bettner-resume.pdf`. See `DEPLOY.md` for the required linked-worktree and ACP lease procedure.

## Provenance

Public repositories linked from the site are sanitized extracts published for inspection. No client data or credentials belong in those repos. Private client history stays confidential. Lab projects document synthetic failure and recovery paths; they are not presented as live customer tenants.
