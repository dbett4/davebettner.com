import { siteUrl } from './seo';

export const recruiterFitHeading = 'Role fit';
export const recruiterFitSubhead =
  'Paste your job description, then open a pre-filled evaluation prompt in your preferred AI assistant, or copy the prompt to paste manually.';

/** Public profile context embedded in the recruiter evaluation prompt. */
export const profileContext = `Dave Bettner — AI implementation and forward-deployed solutions work.

**Headline:** AI implementation, solutions architecture, and forward-deployed delivery in regulated enterprise environments.

**Summary:** More than ten years taking complex reporting, systems, and control work from an unclear starting point to a working result. Strongest when the problem matters, the path is not fully defined, and someone needs to own both the answer and its implementation. Background in financial reporting, technical accounting, controls, and reporting technology—not career software engineering or ML research.

**Current:** Senior Manager, LSL, LLP (Nov 2025–present, Chicago then Des Moines). Scoped municipal finance and ERP-connected reporting delivery from diagnosis through adoption.

**Recent roles:**
- Manager of Digital Services, Citrin Cooperman (Dec 2024–Oct 2025): Workiva-platform rollouts; national healthcare enterprise certification with bidirectional API integration and executive sign-off through go-live.
- Solutions Architect, Workiva (Oct 2022–Oct 2024): concurrent GRC and financial-reporting implementations; SSO, API, and ERP integration architecture.
- Solutions Consultant, Ambra Health (Sept 2021–Oct 2022): HIPAA imaging deployments and EHR integrations through an acquisition transition.
- SEC Reporting Consultant, Workiva (Sept 2015–Sept 2021): XBRL, technical accounting, quarterly filing execution.

**Public engineering proof (inspectable GitHub repos):**
- Regulated Reporting MCP — 126 credential-free tests; 117 tool contracts; offline demo without credentials. https://github.com/dbett4/regulated-reporting-mcp
- Hermes Deployment Lab — 73 credential-free tests; synthetic failure/replay with idempotent retry. Synthetic lab, not a customer deployment claim. https://github.com/dbett4/hermes-enterprise-deployment-lab
- Hermes Enterprise Evaluation Kit — 318-row mapping; 8 negative tests; pinned v2026.8.3 suite with 214 tests; one synthetic native-runtime S1 receipt with oracle pass. It remains needs_review with no external action, no human disposition, a $0.406986 estimate rather than actual billed cost, and two recorded exceptions. https://github.com/dbett4/hermes-enterprise-field-kit
- Wingman (confirm-before-write spreadsheet quality) — 462 Python pass + 13 skip; 243 extension pass. Fictional demo data only. https://github.com/dbett4/wingman

**Proof limits:** Public repos are sanitized extracts published August 2026. GitHub dates are publication dates. No client data or credentials. Private client history remains confidential; public claims are limited to inspectable artifacts.

**Role targets:** Forward-deployed engineer, AI implementation lead, solutions architect, deployment strategist, operator / strategic operations—especially where implementation matters as much as strategy.

**Logistics:** Des Moines, Iowa. Remote-friendly. Available for travel for deployment and executive-facing work.`;

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
    '(No job description pasted. Evaluate general fit for forward-deployed, AI implementation, solutions, or strategic operations roles at a scaling company.)';
  return fitPromptTemplate.replace('{{JOB_DESCRIPTION}}', jd);
}
