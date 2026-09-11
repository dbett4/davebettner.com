# Independent review — Ramp-targeted private profile

**Review date:** 2026-09-10 19:07 CDT  
**Target:** private worktree `/home/dave/work/davebettner-ramp-profile`  
**Base revision:** `cabfb3ce590d8c118e0cf2cd4b18784ec6af10b5`  
**Review mode:** screenshot-first, independent, review-only. No source edits, publication, contact send, or job application.

## Verdict

**PASS — 92/100.** No mandatory visual, grounding, or AI-slop finding blocks this bounded private revision.

This is a visual judgment based on the supplied rendered captures, not a conversion claim and not Dave's aesthetic approval. Automated checks were considered as functional context only; they did not determine this verdict.

## What I inspected

I inspected all eight supplied full-page captures with actual image vision, then used native-width crops for readable text and composition review:

- `/` at 1440px and 390px
- `/experience/` at 1440px and 390px
- `/fit/` at 390px
- `/work/` at 1440px
- `/about/` at 390px
- `/work/accounting-acceptance-lab/` at 390px

The evidence is frozen under `review/ramp/after/`. Crop regions and image hashes are recorded in `vision_review_packet.json`.

## Visual judgment

### What works

- The homepage hero has a clear authored decision: the unchanged real portrait is large, asymmetrically composed against the dark field, and gives the profile an actual point of view instead of relying on a fake dashboard or generated “AI” illustration.
- The oversized `DAVE BETTNER` heading, short role statement, and two simple actions establish a clean reading order on desktop and mobile. The portrait crop remains intentional at 390px; it is not clipped into an accidental face or awkward gap.
- The paper/dark alternation creates material pacing without resorting to gradients-as-content, decorative badges, numbered series, arrows, or ornamental eyebrows.
- The homepage delivery rows, experience timeline, projects page, and case page use rules and spacing consistently. On mobile, dates, employers, role titles, headings, and body copy remain separable and readable in the inspected crops; I found no visible overlap, clipping, or broken line-wrap.
- The projects page presents two relevant projects first and keeps the remainder as a concise archive. It does not read as a generic wall of identical AI-project cards. Scope notes are visible rather than buried as marketing fine print.
- The Accounting Acceptance Lab case page has a credible narrative sequence: problem, build, inspectable evidence, and limitation. The synthetic-data disclosure is visible near the top. The mobile case crop remains readable without shrinking into a desktop table.
- The About and Approach pages give the portrait, career throughline, implementation method, and human-review boundary distinct jobs. The copy is plain and specific rather than slogan-heavy.

### Non-blocking refinement notes

1. The hero carries most of the image-led depth. The deeper pages intentionally become typographic and ruled; across the full journey, the repeated `large heading + prose/list + rules` grammar is flatter than the hero and reads closer to a very good editorial résumé than a fully developed visual identity. This is not a blocker for the scoped cleanup. If another pass is authorized, vary one deep-page composition using real evidence/content, not stock decoration or a new card system.
2. Small metadata and scope lines on mobile are appropriately subordinate but close to the minimum comfortable size. Do not reduce them further; keep the current readable contrast and line height.
3. The case scaffold repeats `The problem / What I built / What you can inspect`. It is acceptable here because each page supplies different, bounded content. Do not expand the scaffold into more generic “proof” modules.

## Editorial / AI-slop review

**No mandatory copy finding.** The rendered visitor tree avoids the previously rejected devices and language patterns:

- no decorative eyebrows, leading-zero numbered series, arrows, fake proof widgets, or synthetic outcome panels;
- no “world-class,” “transformative,” “unlock,” or similar unsupported positioning in the rendered pages;
- no invented client names, customer savings, certifications, Ramp deployments, or partner-network ownership;
- no claim that the public projects are live client work; the pages explicitly label synthetic records, mock data, local labs, fictional workbooks, or personal projects where applicable.

The copy is strongest when it names concrete work: requirements sessions, API/SSO/ERP integration needs, UAT, go-live, estimates, statements of work, customer training, consultant coaching, approvals, readback, and failed-write recovery. Repetition across case pages is functional structure, not AI slop in this artifact.

## Résumé grounding

The supplied DOCX, unchanged supplied résumé PDF, fit review, brief, and rendered text snapshots were read. The profile is grounded in those materials:

- Workiva SEC reporting/XBRL and 20+ public-company customers per quarter;
- Workiva Solutions Architect work across 6–12 concurrent reporting/GRC implementations, requirements, API/SSO/ERP needs, Sales/Customer Success handoffs, and Product/Engineering feedback;
- Citrin Cooperman leadership of a five-person Workiva implementation team, training, testing, UAT, go-live, bidirectional API, SSO, and audit trail;
- current LSL delivery for city/county finance teams, Python reporting tools, AI-assisted review with human review before client changes, estimates/SOWs/RFPs, and demonstrations;
- Ambra Health customer-facing API/SFTP/webhook/access troubleshooting;
- Iowa State accounting degrees.

The wording preserves the important qualification: the broader `since 2015` claim is financial reporting/customer delivery, not ten years of software implementation. The site also avoids turning personal AI projects into customer outcomes.

## Ramp Partner Consultant, Accounting relevance

The profile is a credible fit for the retrieved Ramp posting because it makes these transferable strengths legible: accounting education and reporting practice; accounting-firm delivery leadership; customer and consultant training; requirements and workflow discovery; technical demos and commercial scoping; API/SSO/integration validation; UAT and go-live ownership; and product feedback from recurring customer issues. The two public projects reinforce guarded API access, accounting checks, approvals, readback, and failure recovery.

The following are **fit gaps, not invented experience** and should remain explicit in any later revision:

- the supplied record does not establish ownership of an external accounting-partner network or partner certification program;
- Ramp product experience/proficiency is not established and is not claimed on the site;
- deep AP, procurement, spend-management, controllership, or named ERP-product expertise is less established than reporting/integration experience;
- quantified customer outcomes are limited, so no savings, adoption, or efficiency percentages should be added;
- the role's experience threshold should be discussed carefully: the résumé supports 10+ years of financial reporting/customer delivery, while explicitly titled solutions/implementation roles begin in 2021.

## Mandatory findings

**None.** Preserve the current truth boundary: no Ramp experience, partner-network ownership, deep AP/ERP claims, ten years of implementations, client results, or public-project deployment claims should be added without new supplied evidence.

## Verification boundary

`npm test` was run and returned build/check 0 errors, 0 warnings, 0 hints, two passing Node tests, 48 route-width checks, and no reported errors. That output supports functional context only; it did not substitute for the screenshot inspection above. No publication or external state change was performed.
