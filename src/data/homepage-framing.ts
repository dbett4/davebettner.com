/**
 * Locked home-page contract for The Working Record (seed: working-record-20260906).
 * Copy here is exact — do not paraphrase without updating the design contract.
 */

export const heroIdentity = 'Dave Bettner · Senior Manager · Des Moines, Iowa';

export const heroHeading = 'I lead enterprise deployments from discovery through adoption.';

export const heroSupport =
  'I work between customers, product, and engineering. I also build public agent and MCP projects that test bounded access, failure recovery, readback, and human review.';

export const credibilityLine =
  'Customer-facing delivery since 2015 across financial reporting, GRC, and healthcare imaging. The public engineering work is independent evidence, not a client production deployment.';

export const experienceSection = {
  eyebrow: 'Experience',
  title: 'Selected delivery record',
  lead: 'Three customer-facing roles, shown in reverse chronology.',
  rows: [
    {
      dates: 'Dec 2024–Oct 2025',
      role: 'Manager of Digital Services · Citrin Cooperman',
      body: 'Built a Workiva data-collection and reporting workflow with a bidirectional system-of-record integration. Coordinated finance, IT, and executive sign-off through go-live.',
    },
    {
      dates: 'Oct 2022–Oct 2024',
      role: 'Solutions Architect · Workiva',
      body: 'Led concurrent GRC and financial-reporting implementations from discovery through go-live and adoption. Scoped SSO, API, and ERP integration architecture with finance, audit, IT, and executive sponsors.',
    },
    {
      dates: 'Sept 2021–Oct 2022',
      role: 'Solutions Consultant · Ambra Health',
      body: 'Deployed HIPAA-controlled imaging workflows, EHR interfaces, and customer-facing portal integrations. Carried cross-practice implementation work through an acquisition transition.',
    },
  ],
  linkLabel: 'View full experience',
  href: '/experience/',
} as const;

export const workSection = {
  eyebrow: 'Selected work',
  title: 'Public engineering evidence',
  lead: 'Two independent projects show how I approach consequential agent work. Each case states what the proof covers and where it stops.',
  cases: [
    {
      id: 'hermes-deployment-lab',
      display: 'Failed-write recovery lab',
      title: 'Recover an uncertain write without creating a duplicate',
      summary:
        'A synthetic public lab keeps one tracking number across a forced post-commit failure, restarts the workflow, finds the first result, and checks that the final count is one.',
      boundary: 'Synthetic lab; cloud configuration is validated but not deployed. This is not a customer deployment.',
      href: '/work/hermes-deployment-lab/',
      label: 'Read the case',
    },
    {
      id: 'regulated-reporting-mcp',
      display: 'Regulated Reporting MCP',
      title: 'Limit an agent to the write access its job needs',
      summary:
        'A public reporting-system connector exposes three guarded tools by default, refuses unconfirmed writes, reads results back, and keeps values out of its receipts.',
      boundary:
        'Sanitized API model with offline proof. The full registry requires an explicit unsafe opt-in, and a local receipt is not remote verification.',
      href: '/work/regulated-reporting-mcp/',
      label: 'Read the case',
    },
  ],
  linkLabel: 'View all work',
  href: '/work/',
} as const;

export const howIWork = {
  eyebrow: 'How I work',
  title: 'Stay close to the workflow',
  lead: 'I start with the customer workflow, build the first useful path, and stay through adoption. Each deployment should make the next one clearer.',
  linkLabel: 'About my approach',
  href: '/about/',
} as const;

export const hiringClose = {
  eyebrow: 'Next',
  title: 'Hiring for customer-facing technical work?',
  body: 'I’m interested in forward-deployed engineering, solutions engineering, and technical deployment roles.',
  primaryLabel: 'Email Dave',
  quietLabel: 'Download résumé',
} as const;

export const aboutSection = {
  title: 'A customer-facing builder in Des Moines',
  intro:
    'I have spent my career between customer teams and the systems they depend on — turning unfamiliar requirements into integrations, approval paths, and working handoffs.',
  body: [
    'I live in Des Moines, Iowa, after working in Chicago and with distributed customer teams. I like work that puts me close to the people using the system and the engineers shaping it.',
    'My background spans financial reporting, assurance, healthcare imaging, and enterprise integrations. Outside the résumé, I keep building public tools and labs because working code is the clearest way to sharpen technical judgment.',
  ],
  method: {
    title: 'How I work',
    body: 'I start with the customer workflow, turn the first useful path into a working deployment, and stay through go-live, acceptance, and adoption. Then I turn what I learned into a clearer path for the next deployment.',
  },
} as const;

/* ---------------------------------------------------------------------------
 * Legacy exports below remain only for the isolated, non-indexed preview and
 * mockup routes (src/pages/mockups/*, src/pages/preview-dither.astro). No
 * public route reads these. Remove alongside those routes if they are ever
 * deleted.
 * ------------------------------------------------------------------------- */

import { publicEngineeringCases } from './public-proof';

export const thesis = {
  title: heroHeading,
} as const;

const mappedProjects = publicEngineeringCases.map((item) => ({
  id: item.id,
  title: item.title,
  problem: item.summary,
  built: item.evidence,
  tools: item.limit,
  learned: item.limit,
  next: `Inspect the repository and its proof guide: ${item.repoUrl}`,
  href: item.href,
  repoUrl: item.repoUrl,
}));

export const buildingNow = {
  title: 'What I build',
  lead: 'I build the parts that make agent work usable in a real business: safer retries, controlled system access, and checks that show when a result is ready for review.',
  projects: mappedProjects,
} as const;

export const selectedProof = {
  title: experienceSection.title,
  lead: experienceSection.lead,
  stories: experienceSection.rows.map((row) => ({
    id: row.role,
    label: row.role.split('·')[1]?.trim() ?? row.role,
    context: row.role,
    title: row.role,
    result: row.body,
  })),
} as const;

export const homeSynthesis = {
  title: howIWork.title,
  body: howIWork.lead,
} as const;
