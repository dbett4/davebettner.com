import { siteUrl } from './seo';

export const recruiterFitHeading = 'Role fit';
export const recruiterFitSubhead =
  'Paste a job description and get a direct read on whether I fit it, including the gaps. Open the prompt in your preferred assistant or copy it and paste it anywhere.';

/** Public profile context embedded in the recruiter evaluation prompt. */
export const profileContext = `Dave Bettner — forward-deployed delivery and solutions engineering for complex enterprise environments.

**Headline:** Ten-plus years of enterprise delivery, discovery through adoption, paired with hands-on, inspectable AI-agent engineering.

**Summary:** Customer-facing solutions and implementation leader with 10+ years turning unfamiliar enterprise workflows and technical constraints into signed-off deployments. Supports proposals, SOW scoping and negotiation, estimates, quotes, RFP responses, persona-specific and on-site demos, pitch presentations, integration design, debugging, validation, and delivery handoffs. Hands-on Python work covers MCP integrations, guarded agent tools, failure injection, idempotent recovery, and deployment-proof labs. Hermes Agent Desktop PR #84621 is an open, unreviewed TypeScript/Electron work sample, not Nous acceptance. A separate open Rust work sample is block/buzz PR #5620, also unreviewed. Public agent and MCP work is inspectable and synthetic or sanitized. It is engineering evidence, not multi-year production software engineering or a customer Hermes Enterprise deployment. Does not claim quota ownership, revenue credit, or final contract-signature authority.

**Current:** Senior Manager, LSL, LLP (Nov 2025–present, Chicago then Des Moines). Municipal finance and ERP-connected reporting delivery; proposals, SOW support, estimates, quotes, RFP responses, on-site demos, pitch presentations, and delivery handoffs through adoption. Has led a five-person delivery team. Accounting degrees give finance and audit fluency, not a career as an accountant; he has never worked as one.

**Recent roles:**
- Manager of Digital Services, Citrin Cooperman (Dec 2024–Oct 2025): Workiva-platform rollouts; national healthcare enterprise certification with bidirectional API integration and executive sign-off through go-live; led a five-person delivery team.
- Solutions Architect, Workiva (Oct 2022–Oct 2024): concurrent GRC and financial-reporting implementations; SSO, API, and ERP integration architecture.
- Solutions Consultant, Ambra Health (Sept 2021–Oct 2022): HIPAA imaging deployments, EHR interfaces, and portal integrations through an acquisition transition.
- SEC Reporting Consultant, Workiva (Sept 2015–Sept 2021): SEC reporting and XBRL across GAAP, IFRS, and ESEF under quarterly filing deadlines.

**Public engineering proof (inspectable GitHub repos):**
- Hermes Deployment Lab — when an agent can touch an internal system: scope tools, separate operator approval, force post-commit failure, resume without double-writing. Public CI attests container restart/replay and native telemetry/trace; cloud remains no-apply. Synthetic lab, not a customer deployment. https://github.com/dbett4/hermes-enterprise-deployment-lab
- Hermes Agent Desktop PR #84621 — open, unreviewed TypeScript/Electron fix for sessions hidden by stale legacy profile shadows; not merged, accepted, shipped, or Nous-endorsed. https://github.com/NousResearch/hermes-agent/pull/84621
- Regulated Reporting MCP — 126 credential-free tests; 117 tool contracts; offline demo without credentials. https://github.com/dbett4/regulated-reporting-mcp
- Hermes Enterprise Evaluation Kit — surrounding layer for enterprise-shaped Hermes use: policy packs, approved configs, independent checks, and human review gates. Offline proof needs no keys or network. One synthetic native-runtime S1 receipt still ends needs_review (no external action, no human disposition, estimated rather than billed cost, two recorded exceptions). https://github.com/dbett4/hermes-enterprise-field-kit
- Wingman (confirm-before-write spreadsheet quality) — 462 Python pass + 13 skip; 243 extension pass. Fictional demo data only. https://github.com/dbett4/wingman

**Proof limits:** Public repos are sanitized extracts published August 2026. They show methods and tests, not client tenants. GitHub dates are publication dates. Independent work is not a customer Hermes Enterprise deployment or Nous affiliation. No client data or credentials.

**Role targets (ranked):** Primary — customer-facing AI deployment and forward-deployed roles: forward-deployed engineer, customer engineer, AI implementation lead, deployment strategist. Secondary or bridge — solutions engineering and focused consulting. Best fit where learning an unfamiliar customer environment, integrating real systems, debugging deployed workflows, and iterating through adoption matter as much as the demo. Do not infer deep production-SWE or customer-production agent tenure from the public labs.

**Logistics:** Des Moines, Iowa. Available for travel for deployment and executive-facing work.`;

export const fitPromptTemplate = `You are helping a hiring manager or recruiter evaluate whether Dave Bettner is a strong fit for an open role. Be direct, evidence-based, and honest about gaps. Use only the job description and candidate profile below. Do not invent experience.

Deliver:
1. **Fit score** (0–100) with a one-sentence headline
2. **Strong alignment:** 3 bullets tied to specific JD requirements
3. **Gaps or risks:** honest, with severity (minor / moderate / blocker)
4. **Interview focus:** 3 questions to validate fit
5. **Recommendation:** pass / phone screen / advance / strong advance

---

## Job description
{{JOB_DESCRIPTION}}

---

## Candidate profile
${profileContext}

Résumé PDF: ${siteUrl}/dave-bettner-resume.pdf
Portfolio work: ${siteUrl}/#work
GitHub: https://github.com/dbett4
LinkedIn: https://www.linkedin.com/in/dave-bettner/
`;

export type AiProvider = {
  id: string;
  label: string;
  baseUrl: string;
  /** URL param name varies by platform; builder returns full launch URL. */
  buildUrl: (encodedPrompt: string) => string;
};

export const aiProviders: readonly AiProvider[] = [
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    baseUrl: 'https://chatgpt.com/',
    buildUrl: (p) => `https://chatgpt.com/?q=${p}`,
  },
  {
    id: 'claude',
    label: 'Claude',
    baseUrl: 'https://claude.ai/new',
    buildUrl: (p) => `https://claude.ai/new?q=${p}`,
  },
  {
    id: 'gemini',
    label: 'Gemini',
    baseUrl: 'https://gemini.google.com/app',
    buildUrl: (p) => `https://gemini.google.com/app?q=${p}`,
  },
  {
    id: 'copilot',
    label: 'Copilot',
    baseUrl: 'https://copilot.microsoft.com/',
    buildUrl: (p) => `https://copilot.microsoft.com/?q=${p}`,
  },
  {
    id: 'perplexity',
    label: 'Perplexity',
    baseUrl: 'https://www.perplexity.ai/',
    buildUrl: (p) => `https://www.perplexity.ai/search?q=${p}`,
  },
  {
    id: 'grok',
    label: 'Grok',
    baseUrl: 'https://grok.com/',
    buildUrl: (p) => `https://grok.com/?q=${p}`,
  },
] as const;

export function buildFitPrompt(jobDescription: string): string {
  const jd =
    jobDescription.trim() ||
    '(No job description pasted. Evaluate general fit for forward-deployed engineering, customer engineering, solutions engineering, AI implementation, or deployment strategy roles.)';
  return fitPromptTemplate.replace('{{JOB_DESCRIPTION}}', jd);
}
