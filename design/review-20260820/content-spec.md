# Full-site editorial and information-architecture specification

## Humanizer override — final mockup copy

The rendered source files now own final wording. Dave does not want Des Moines or any location used as a headline or selling point. The final pass removes location promotion, compressed proof-console language, slogan pairs, repetitive caveats, and management-speak while preserving technical facts and claim limits. Where the exact copy blocks below differ from the rendered source, follow `src/pages/` and `src/data/cases.ts`.

**Editorial direction:** employer-independent professional profile for customer-facing AI-agent / forward-deployed engineering / technical deployment roles. Lead with enterprise delivery. Use finance, assurance, regulated reporting, and healthcare as proof. Treat public agent engineering as newer, independent, and inspectable—not as client production work or employment history.

## Global information architecture

### Primary navigation

`Work` · `Experience` · `Contact`

- Logo/name returns to `/`.
- `Contact` is the single primary action and resolves to the contact section/route or `mailto:dbett4@gmail.com`.
- Remove `First 90 Days` from the primary navigation.
- Retain `/fit/` as a secondary route labeled **Field approach**. Link to it from the homepage close, Experience, and relevant Work/Contact surfaces.
- Secondary/footer routes: About, résumé PDF, GitHub, LinkedIn, Field approach.

### Shared editorial rules

- Write in first person where Dave is describing judgment or working style; use third person only for metadata, résumé, and recruiter summary.
- Say what Dave owned, what changed, and what is inspectable. Avoid “AI transformation,” “revolutionary,” “end-to-end” unless the source explicitly supports it.
- Never imply public repositories are client tenants, production deployments, employer work, Nous/Hermes Enterprise affiliation, or proof of production-software-engineering tenure.
- Never invent customer anecdotes, names, logos, testimonials, revenue, quota ownership, contract-signature authority, or unsupported performance metrics.
- Use one evidence-boundary note per relevant page, not a caveat in every card.

## Shared evidence-boundary note

Use this exact compact note once on Home, Work, and Experience (and a shortened link treatment on Field approach if needed):

> **Evidence boundary.** Customer-delivery examples describe scoped work from Dave’s implementation record; client data and private artifacts remain confidential. Public repositories are sanitized, independent engineering work published in August 2026—not client tenants, customer-production agent deployments, production-engineering tenure, or Nous/Hermes Enterprise affiliation. GitHub dates are publication dates, not original delivery dates.

For the Work page, append the case-specific honest limit under each flagship; do not repeat this global note in every card.

# Route specifications

## `/` — Home

**Purpose:** identify Dave, establish the customer-facing deployment lane, then earn attention with one concise delivery record and two proof paths.

**Order:**

1. Identity/hero
2. Concise delivery record
3. Flagship public case
4. Supporting public case
5. Human working approach
6. One evidence note
7. One close

### Hero

**Eyebrow:** `DAVE BETTNER · CUSTOMER-FACING TECHNICAL DELIVERY`

**Primary line:**

> I stay with difficult enterprise deployments—from the first ambiguous workflow to the point customers can trust what changed.

**Subordinate qualifier:**

> Ten years of customer-facing implementation across reporting, assurance, healthcare, and enterprise integrations. My hands-on public agent engineering is newer—and deliberately inspectable.

**Hero actions:** `View work` → `/work/` · `Read experience` → `/experience/`

Do not add a second hero CTA, rotating claim, product metaphor, or “available” badge without verified status.

### Delivery record

**Section label:** `THE DELIVERY RECORD`

**Heading:** `Customer work first. Public engineering makes the method visible.`

**Copy:**

> I have led solution design, integration, adoption, and go-live work since 2015—working with finance, audit, IT, executives, clinicians, and customer teams. The record is strongest in statutory reporting, GRC, assurance, and regulated workflows; the newer public labs show how I now think about agents, guarded tools, failure, recovery, and proof.

Use three quiet proof lines only:

- `10+ years` — customer-facing enterprise delivery
- `Reporting, assurance, healthcare` — regulated workflow record
- `Public agent / MCP labs` — newer independent engineering evidence

### Flagship public case

**Section label:** `PUBLIC CASE · DEPLOYMENT RECOVERY`

**Heading:** `Scope tools, separate approval, and resume safely after failure.`

**Copy:**

> The Hermes Deployment Lab is a synthetic environment for the hard case: an agent can touch an internal system. The first write stops for a separate operator grant; a post-commit fault is injected; the workflow resumes with the same idempotency key so it does not double-write.

**Proof line:**

> Public CI attests container restart/replay, native telemetry and trace, fresh-clone execution, and a credential-free test suite. Cloud IaC remains validate-only.

**Link:** `Inspect the case` → `/work/hermes-deployment-lab/` and repository/proof links.

### Supporting case

**Section label:** `SUPPORTING CASE · GUARDED INTEGRATION`

**Heading:** `Keep confirmation, readback, and honest uncertainty inside the tool contract.`

**Copy:**

> Regulated Reporting MCP is a Workiva-shaped public integration lab. Its default surface exposes three guarded tools; writes require confirmation, results are read back, and uncertain formula outcomes stay indeterminate instead of being guessed.

**Proof line:** `126 credential-free tests; 117 registered tool contracts behind explicit unsafe opt-in; offline end-to-end demo without credentials.`

**Link:** `Inspect the case` → `/work/regulated-reporting-mcp/` and GitHub.

### Human working approach

**Section label:** `HOW I WORK`

**Heading:** `Start with the workflow. Stay through the handoff.`

**Copy:**

> I start with the customer workflow, make one useful technical path work, and stay with it through failure, acceptance, and handoff. I prefer a bounded deployment that can be read back and explained over a broad promise that cannot.

### Evidence note

Place the shared **Evidence boundary** note here once. Do not repeat it below the cases.

### Close

**Heading:** `Let’s talk about the customer environment.`

**Copy:**

> I am pursuing forward-deployed engineering and technical deployment roles. Consulting is available selectively for a well-scoped implementation problem.

**Single action:** `Start a conversation` → `mailto:dbett4@gmail.com`

Cut: repeated “see the work” buttons, repeated public-proof caveats, a second closing CTA, and any “First 90 days” navigation label on Home.

## `/work/` — Work

**Purpose:** let a recruiter or technical lead inspect two representative cases immediately, then browse the rest without a wall of cards.

**Intro copy:**

**Eyebrow:** `SELECTED WORK`

**Heading:** `Evidence from customer delivery and the public systems I build around it.`

**Lead:**

> Two cases lead because they show the operating judgment most relevant to enterprise deployment: bounded authority, failure recovery, and honest readback. The index below keeps the rest available without pretending every project has the same kind of evidence.

### Flagship case 1: Hermes Deployment Lab

**Title:** `Scope tools, separate approval, and survive post-commit failure`

- **Stakes:** An agent that can touch an internal system needs bounded tools, a separate operator grant, and a recovery path that cannot duplicate a committed side effect.
- **Decision:** Build a synthetic FastMCP server, mock enterprise API, workflow runner, and Compose stack; stop the first write for operator approval; resume after an injected post-commit fault with the same idempotency key.
- **Visible proof:** Public Actions run `31892965924` for `v1.0.0` attests container restart/replay, native telemetry/trace, fresh-clone execution, and `241` credential-free tests.
- **Honest limit:** Synthetic lab, not a live client tenant. Cloud IaC is validate-only. Scripts and tests call tools; this is not a model-driven production-run claim.

**Links:** `Read the case` → `/work/hermes-deployment-lab/`; `Repository` and `Proof` → existing public URLs.

### Flagship case 2: Regulated Reporting MCP

**Title:** `Accepted is not applied; applied is not verified`

- **Stakes:** A reporting integration that can mutate remote content needs a narrow default surface, explicit confirmation, readback, and honest treatment of uncertain results.
- **Decision:** Expose three guarded tools by default; require explicit unsafe opt-in for the full registry; confirm writes, read results back, redact receipts, and report uncertain formula outcomes as indeterminate.
- **Visible proof:** `126` credential-free tests; `117` registered tool contracts; an offline end-to-end demo that runs without credentials.
- **Honest limit:** Local and synthetic proof only. A local write receipt is not remote verification; this does not prove customer data access or production deployment.

**Links:** `Read the case` → `/work/regulated-reporting-mcp/`; `Repository` and `Proof` → existing public URLs.

### Quiet ruled index

After the two flagships, render every remaining public case from `src/data/cases.ts` as a simple ruled list (title · category · proof marker · inspect link), not equal-weight cards. Preserve the current data order after filtering out the two flagships:

1. `Design the system around the agent` — architecture map; living snapshot/current practice.
2. `Keep recurring agent work from running twice` — 19 tests; local reusable library; no hosted-queue or throughput claim.
3. `Govern Hermes with policy, checks, and human review gates` — offline proof; live S1 remains `needs_review`.
4. `Chrome extension + local service with readback and restore on mismatch` — CI test evidence; fictional demo workbook only.

Use the shared evidence-boundary note once below the index. Each index row may have only its source-backed proof marker and link; do not place full caveat paragraphs in rows.

Cut: a six-card “everything is a flagship” grid, invented outcomes, claims that public code was deployed for customers, and repeated “synthetic” language in every row.

## `/experience/` — Experience

**Purpose:** recruiter-first scan of role, time, domain, and result; public engineering is a separate newer thread, not mixed into employment chronology.

**Intro:**

**Eyebrow:** `EXPERIENCE`

**Heading:** `Ten years of customer-facing implementation, from reporting deadlines to regulated integrations.`

**Lead:**

> I lead technical delivery across discovery, solution design, integration, adoption, and go-live. Finance and assurance are the deepest record; healthcare and public agent engineering show the range and the direction.

### Result-led summary (before timeline)

- `Own the path from ambiguous workflow to adopted system` — discovery, architecture, stakeholder alignment, controlled deployment, and handoff.
- `Work across the customer boundary` — finance, audit, IT, executives, clinicians, product, and engineering.
- `Make consequential changes inspectable` — human sign-off, tie-out checks, readback, journaled changesets, and explicit limits.

### Timeline order and exact copy

1. **Nov 2025–Present · Senior Manager · LSL, LLP · Chicago, then Des Moines**
   > Municipal finance and ERP-connected reporting implementations; scoped delivery from diagnosis through adoption. Support proposals, SOW scoping and negotiation, estimates, quotes, and RFP responses; run customer demos and pitch presentations; carry handoffs through adoption; build controlled review workflows with human sign-off.
2. **Dec 2024–Oct 2025 · Manager of Digital Services · Citrin Cooperman**
   > Directed finance and regulatory reporting rollouts on Workiva across a five-person team. Built a bidirectional data-collection/reporting workflow between the reporting platform and system of record with finance, IT, and executive sign-off.
3. **Oct 2022–Oct 2024 · Solutions Architect · Workiva**
   > Led concurrent GRC and financial-reporting implementations from discovery through go-live. Scoped SSO, API, and ERP integration architecture and built controlled-write workflows with human sign-off on customer-impacting changes.
4. **Sept 2021–Oct 2022 · Solutions Consultant · Ambra Health**
   > Delivered HIPAA-controlled imaging workflows, EHR interfaces, and customer-facing portal integrations with billing and access controls; carried cross-practice implementations through an acquisition transition.
5. **Sept 2015–Sept 2021 · SEC Reporting Consultant · Workiva**
   > SEC reporting and XBRL across GAAP, IFRS, and ESEF, including disclosure drafting and quarterly filing execution under deadline pressure.

### Newer public engineering bridge

**Heading:** `A newer public engineering practice`

**Copy:**

> Since 2026, I have published independent labs and reusable tools around agent orchestration, guarded integrations, failure recovery, evaluation, and readback. They make the method inspectable; they are not customer deployments or a substitute for the delivery record.

**Links:** `View public work` → `/work/`; `View field approach` → `/fit/`.

Place the shared evidence-boundary note once after this bridge. Cut a second duplicate “how I work” essay and any inflated seniority or production-engineering language.

## `/fit/` — Field approach (secondary route)

**Route title:** `Field approach | Dave Bettner`

**Context label:** `FIELD APPROACH · PROSPECTIVE PLAN`

**Heading:** `How I would enter a new customer environment.`

**Lead:**

> This is a prospective working plan, not a claim about a current employer or customer. I would learn the product and customer environment, choose one measurable workflow, lead its first deployment, and turn the failures and decisions into useful product feedback.

Retain the existing timeline, with these labels and copy:

1. **Weeks 1–2 · Choose the first problem.** Learn the product, deployment model, customer workflow, and current constraints. Pair with product, engineering, and customer-facing teammates. Leave the first two weeks with a named owner, a success measure, launch criteria, and the tradeoffs we will accept.
2. **Weeks 3–6 · Own the first deployment.** Lead one bounded workflow from technical approach through working integration. Coordinate the customer, product, and engineering sides. Instrument the path, test failure modes, and decide what must be fixed before launch.
3. **Weeks 6–10 · Lead through failure.** Separate configuration issues, product gaps, and infrastructure problems. State customer impact and decide whether to fix, narrow scope, work around, or stop the launch.
4. **Weeks 10–13 · Make the next deployment easier.** Convert what deployment teaches into tests, telemetry, integration guidance, tooling, or runbooks. Give product and engineering a prioritized record of recurring gaps and the customer context behind them.

Use `Field approach` everywhere visible. Do not use “First 90 days” in primary navigation, masthead context, or page headline; it may remain in metadata/SEO only if needed for discoverability.

## `/about/` — About

**Purpose:** add human warmth without inventing personality facts.

**Eyebrow:** `ABOUT DAVE BETTNER`

**Heading:** `A customer-facing builder in Des Moines.`

**Lead:**

> I have spent my career close to customer teams, translating unfamiliar workflows into systems people can run and trust.

**Body:**

> I live in Des Moines, Iowa, after working in Chicago and with distributed customer teams. I like work that puts me close to the people using the system and the engineers shaping it.
>
> My background spans financial reporting, assurance, healthcare imaging, and enterprise integrations. Outside the résumé, I keep building public tools and labs because working code is the clearest way to sharpen technical judgment.

**Close:** `Follow the evidence.` Links: Work · Experience · Field approach · Contact.

No hobbies, testimonials, personal anecdotes, employer-independent claims beyond the repository, or invented “why I’m different” paragraph.

## Contact behavior

Contact is a navigation destination, not a repeated CTA block. Use one concise heading wherever the route lands:

> If the problem sits between a customer workflow, a technical system, and the people accountable for the result, I’d like to hear about it.

Action: `Email Dave` → `mailto:dbett4@gmail.com`. Secondary external links: GitHub and LinkedIn. Do not promise response times or availability not present in the data.

# Acceptance checklist

- [ ] Primary nav is exactly `Work · Experience · Contact`; no First 90 Days item.
- [ ] `/fit/` is visibly labeled `Field approach` and remains a secondary route.
- [ ] Hero uses the exact outcome-led primary line and the ten-year/newer-public qualifier.
- [ ] Home order is identity → delivery record → one flagship public case → supporting case → human approach → one evidence note → one close.
- [ ] Home has no repeated CTA clusters or repeated caveats.
- [ ] Work leads with exactly two flagship editorial cases.
- [ ] Each flagship includes Stakes, Decision, Visible proof, and Honest limit, with values traceable to `src/data`/public repositories.
- [ ] Remaining Work cases are a quiet ruled index, not equal-weight flagships.
- [ ] Experience is recruiter-first, result-led, chronological, and does not exaggerate.
- [ ] Public engineering is explicitly newer, public, independent, and separate from employment history.
- [ ] About warmth uses only repository facts; no invented hobbies, testimonials, or anecdotes.
- [ ] Shared evidence-boundary note appears once per relevant page, not in every card.
- [ ] No client names, private artifacts, production metrics, affiliation claims, or unsupported customer anecdotes are introduced.
- [ ] Every external proof link points to the existing repository/proof URL; no placeholder links.

status completed_unverified

Output path: `/srv/hermes/work/davebettner.com-mockup-20260820/design/review-20260820/content-spec.md`
