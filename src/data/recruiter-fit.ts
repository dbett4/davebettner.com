import { siteUrl } from './seo';

export const recruiterFitHeading = 'Role fit';
export const recruiterFitSubhead =
  'Paste your job description, then open a pre-filled evaluation prompt in your preferred AI assistant, or copy the prompt to paste manually.';

/** Public profile context embedded in the recruiter evaluation prompt. */
export const profileContext = `Dave Bettner — enterprise agent deployment and solutions engineering.

**Headline:** Forward-deployed solutions engineering, AI implementation, and deployment strategy for complex customer environments.

**Summary:** Solutions and implementation leader with 10+ years of regulated enterprise delivery who carries customer work from discovery through adoption. Supports proposals, SOW scoping and negotiation, estimates, quotes, RFP responses, persona-specific and on-site demos, pitch presentations, and delivery handoffs. Does not claim quota ownership, revenue credit, or final contract-signature authority. Recent hands-on Python work covers agent integration, failure recovery, and deployment-proof labs; Rust evidence is a bounded, open upstream work sample. Public agent and MCP work is inspectable and synthetic or sanitized. Not a claim of production software-engineering tenure or customer-production agent deployments.

**Current:** Senior Manager, LSL, LLP (Nov 2025–present, Chicago then Des Moines). Municipal finance and ERP-connected reporting delivery; proposals, SOW support, estimates, quotes, RFP responses, on-site demos, pitch presentations, and delivery handoffs through adoption.

**Recent roles:**
- Manager of Digital Services, Citrin Cooperman (Dec 2024–Oct 2025): Workiva-platform rollouts; national healthcare enterprise certification with bidirectional API integration and executive sign-off through go-live.
- Solutions Architect, Workiva (Oct 2022–Oct 2024): concurrent GRC and financial-reporting implementations; SSO, API, and ERP integration architecture.
- Solutions Consultant, Ambra Health (Sept 2021–Oct 2022): HIPAA imaging deployments, EHR interfaces, and portal integrations through an acquisition transition.
- SEC Reporting Consultant, Workiva (Sept 2015–Sept 2021): XBRL, technical accounting, quarterly filing execution.

**Public engineering proof (inspectable GitHub repos):**
- Regulated Reporting MCP — 126 credential-free tests; 117 tool contracts; offline demo without credentials. https://github.com/dbett4/regulated-reporting-mcp
- Hermes Deployment Lab — 73 public credential-free tests; synthetic failure/replay with idempotent recovery. A larger local revision adds independently reviewed observability evidence and validate-only cloud IaC, but remains unpublished; container runtime and cloud operation remain unverified. Synthetic lab, not a customer deployment claim. https://github.com/dbett4/hermes-enterprise-deployment-lab
- Hermes Enterprise Evaluation Kit — 318-row mapping; 8 negative tests; pinned v2026.8.3 suite with 214 tests; one synthetic native-runtime S1 receipt with oracle pass. It remains needs_review with no external action, no human disposition, a $0.406986 estimate rather than actual billed cost, and two recorded exceptions. https://github.com/dbett4/hermes-enterprise-field-kit
- Wingman (confirm-before-write spreadsheet quality) — 462 Python pass + 13 skip; 243 extension pass. Fictional demo data only. https://github.com/dbett4/wingman

**Proof limits:** Public repos are sanitized extracts published August 2026. They show methods and tests, not client tenants. GitHub dates are publication dates. Independent work is not a customer Hermes Enterprise deployment or Nous affiliation. No client data or credentials.

**Role targets:** Forward-deployed engineer, solutions engineer, AI implementation lead, deployment strategist. Especially where customer deployment and adoption matter as much as the demo.

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
    '(No job description pasted. Evaluate general fit for forward-deployed, solutions engineering, AI implementation, or deployment strategy roles.)';
  return fitPromptTemplate.replace('{{JOB_DESCRIPTION}}', jd);
}
