---
target: live davebettner.com
total_score: 18
max_score: 24
na_heuristics: 5,7,9,10
p0_count: 0
p1_count: 3
timestamp: 2026-08-20T14-27-14Z
slug: davebettner-com
---
Method: dual-agent (A: sa-0-6a7a2c1a · B: sa-1-9be6d446)

# Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of system status | 3/4 | Clear route context and link behavior; homepage has no strong current-location cue. |
| 2 | Match system / real world | 3/4 | The top-level language is plain, but the case surfaces lean on insider terms such as MCP, policy-bounded, native readback, and mutation gate. |
| 3 | User control and freedom | 3/4 | Navigation, home/back paths, résumé, contact, and case links are clear and non-modal. |
| 4 | Consistency and standards | 3/4 | The Interstellar system is coherent across routes, but repeated route-intro and evidence-plate grammars make distinct pages feel mechanically generated from one template. |
| 5 | Error prevention | n/a | Static portfolio; no data-entry or destructive flow. |
| 6 | Recognition rather than recall | 3/4 | Main routes are visible, but the difference between delivery experience, public labs, and the speculative 90-day plan takes careful reading. |
| 7 | Flexibility and efficiency | n/a | Not meaningful for a portfolio/experience surface. |
| 8 | Aesthetic and minimalist design | 3/4 | The hero is focused and distinctive; below the fold, dense caveats and repeated proof grammar add friction. |
| 9 | Error recovery | n/a | No substantive transactional error flow. |
| 10 | Help and documentation | n/a | Not meaningful for this portfolio surface. |
| **Total** |  | **18/24** | **Good foundation; the visual identity is ahead of the editorial experience.** |

# Design Specificity Verdict

**Authored visual world; templated proof language.** The live site does not look like a generic AI landing page. The carbon ground, warm-white Archivo, DM Mono labels, tide/signal field, large real portrait, hard rules, and orange/teal/periwinkle accents form a coherent and memorable world. It avoids the usual AI-site clichés of glass cards, floating gradient blobs, pills, and dashboard chrome.

The AI-generated feeling arrives after the first viewport. Repeated phrases and structures—“scope · gate · review,” “confirm / write / readback,” “evidence,” “boundary,” “bounded,” “human review,” and a grid of similarly weighted proof cards—make the site read like a polished system prompt or assurance packet rather than one person’s edited point of view.

The deterministic scan found four advisory/warning signatures in `src`, but none are on current public-route files: one decorative grid in the unreferenced `SignalField.astro`, plus overused-font/marquee warnings confined to mockup/preview routes. The public live pages are therefore mechanically clean against this detector. Browser evidence confirmed a 390px mobile layout with zero overflow candidates, proper landmarks, one H1, alt text on the portrait, labeled navigation, and generally 44px link targets. No reliable user-visible detector overlay was available; the critique uses live Playwright captures and the source scan instead.

# Overall Impression

The hero has taste. It is bold, recognizably yours, and materially better than a generic recruiter portfolio. The rest of the site is trying too hard to prove rigor through repeated control vocabulary. The single biggest opportunity is to keep the Interstellar identity while replacing the proof-console rhythm with a more human editorial narrative: judgment in context, real artifacts, and fewer words.

# What’s Working

1. **The opening composition is memorable.** Monumental name, real portrait, and the Tide field create a first impression that is specific enough to remember after the tab closes.
2. **The visual system is coherent.** Carbon, warm white, orange, teal, periwinkle, hard edges, mono labels, and editorial rules are consistently applied without drifting into sci-fi HUD cosplay.
3. **The honesty is unusually strong.** Publication dates, evidence limits, and the separation between client delivery and public labs build trust. The problem is repetition, not the presence of boundaries.

# Cognitive Load and Emotional Journey

**Cognitive load: moderate (2–3 checklist failures).** The homepage’s first task is clear, but after the hero the visitor must switch categories repeatedly: delivery outcomes → agent labs → operating philosophy → recruiting/consulting CTA. The Work page presents five similarly weighted cases, each with evidence and boundary text, so the visitor must compare too much before knowing where to begin.

**Journey:** intrigue → confidence → verification fatigue → credible close. The entrance is strong and human. The delivery section adds legitimacy. The evidence section then becomes dense and defensive. “How I work” recovers the human voice, but the final CTA repeats actions already offered above.

# Priority Issues

## [P1] The person disappears behind the operating system
**Why it matters:** The hero promises Dave; the middle of the site delivers a vocabulary system. Repetition of gates, readbacks, boundaries, and proof mechanics feels optimized by an AI for defensibility rather than edited by a person for meaning.

**Fix:** Keep one concise proof-boundary statement site-wide. Rewrite each case around one consequential situation: what was at stake, what you decided, what changed, and what the artifact proves. Let “How I work” be demonstrated by the cases rather than repeated as labels.

**Suggested command:** `/impeccable distill`

## [P1] Mobile delays the human first impression
**Why it matters:** At 390×844, the first viewport is dominated by navigation, title, positioning copy, and two full-width CTAs; the portrait’s face begins near the bottom edge. The claimed profile-first experience becomes copy-first on the device most recruiters will open from email or LinkedIn.

**Fix:** Recompose—not regenerate—the mobile hero so the eyes and face appear in the first viewport. Use layout crop/overlap only; preserve the supplied portrait pixels. Reduce vertical gaps and let the portrait interact with the title instead of sitting as a separate block below two buttons.

**Suggested command:** `/impeccable adapt`

## [P1] The Work page shows diagrams of proof instead of the work
**Why it matters:** Five near-identical evidence plates with tiny flow boxes are technically coherent but visually interchangeable. The cards say artifacts exist without showing the code, architecture, test receipt, failure trace, or recovered state that would make each case memorable. This is the strongest “AI portfolio template” signal.

**Fix:** Feature the best two cases at editorial scale with real, sanitized artifacts from the repositories. Give each a distinct composition based on its actual evidence. Move the remaining cases into a quieter ruled index rather than another equal-weight card grid.

**Suggested command:** `/impeccable shape`

## [P2] “First 90 days” feels like an application artifact, not a durable identity
**Why it matters:** A speculative 90-day plan in the primary navigation makes the site feel tailored to a current job search and resembles common AI career-coach output. It weakens the employer-independent promise.

**Fix:** Demote it from primary navigation or reframe it as a durable “Field approach” anchored in real delivery decisions. Work, Experience, and Contact should remain the obvious top-level path.

**Suggested command:** `/impeccable clarify`

## [P2] Premium finish drops at transitions and small type
**Why it matters:** The portrait’s lower edge dissolves into a visible foggy band, secondary mastheads reuse an interchangeable blurred field, and 0.68rem mono labels become decorative texture rather than readable information. These are small defects, but taste is judged in small defects.

**Fix:** Hide the portrait’s lower-edge artifact through composition/crop, never pixel regeneration. Raise critical label sizes, reduce decorative mono text, and give each secondary route one distinct compositional move while retaining the shared palette and type system.

**Suggested command:** `/impeccable polish`

# Persona Red Flags

**Recruiting/hiring leader:** The first viewport communicates confidence, but the visitor must work to distinguish ten years of customer delivery from newer public agent engineering. Dense caveats and five equal-weight technical cases obscure the one project they should inspect first.

**Jordan, first-time visitor:** Terms such as MCP, mutation gate, policy-bounded, native readback, and post-commit fault are not explained in outcome language. The site assumes technical context before earning it.

**Casey, distracted mobile visitor:** The face is mostly below the first viewport, the homepage is 4,636px tall, and long case cards create a heavy scroll. Touch targets are generally sound and there is no horizontal overflow, but the reading path is longer than the likely attention window.

**Riley, deliberate stress tester:** Explicit boundaries and publication notes improve trust. However, abstract motifs are not evidence; Riley has to leave the site to validate the claims. Real sanitized artifact crops would convert stated rigor into visible rigor.

# Minor Observations

- The desktop hero is the strongest surface; protect it rather than redesigning from zero.
- The Experience page is legible and restrained, but the alternating square/diamond timeline marks feel decorative and generic. The content could use stronger result-led editing.
- The same eyebrow + giant heading + blurred-field introduction appears across secondary routes; consistency has crossed into sameness.
- “Start a conversation” and résumé actions recur several times. One strong close is enough.
- The portfolio’s originality should come from actual decisions and artifacts, not additional visual effects.

# Questions to Consider

- Can a recruiter name your one strongest public proof within ten seconds?
- If the words “gate,” “boundary,” and “readback” disappeared, would your judgment still be visible through the stories?
- What is the one visual artifact from each project that only you could credibly show?
