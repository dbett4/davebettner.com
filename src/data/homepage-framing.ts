import { publicEngineeringCases } from './public-proof';

export const thesis = {
  title: 'I lead customer-facing technical delivery, with ten years of enterprise implementation. My hands-on agent engineering is newer and public.',
} as const;

export const featuredPublicProjectIds = [
  'hermes-deployment-lab',
  'hermes-field-kit',
  'regulated-reporting-mcp',
] as const;

const mappedProjects = publicEngineeringCases.map((item) => ({
  id: item.id,
  title: item.name,
  problem: item.summary,
  built: item.evidence,
  tools: item.limit,
  learned: item.limit,
  next: `Inspect the repository and its proof guide: ${item.repoUrl}`,
  href: item.href,
  repoUrl: item.repoUrl,
}));

export const buildingNow = {
  title: 'Selected engineering work',
  lead: 'Deployment recovery, policy-bounded evaluation, and a guarded API integration. Each item links to inspectable code and its limits.',
  projects: mappedProjects,
  featuredProjects: featuredPublicProjectIds
    .map((projectId) => mappedProjects.find((project) => project.id === projectId))
    .filter((project): project is (typeof mappedProjects)[number] => Boolean(project)),
} as const;

export const selectedProof = {
  title: 'Customer delivery outcomes',
  lead: 'Three examples from ten years of implementation work. Finance and assurance are the deepest record; healthcare shows the pattern beyond them.',
  stories: [
    {
      id: 'insurance-certification',
      label: 'Custom solutioning',
      context: 'Manager of Digital Services · Citrin Cooperman',
      title: 'A controlled system-of-record handoff',
      result: 'Built a custom data-collection and reporting workflow in Workiva with bidirectional integration between the reporting platform and the system of record, delivered with audit trail and finance, IT, and executive sign-off.',
    },
    {
      id: 'gov-reporting',
      label: 'Enterprise GRC and reporting',
      context: 'Solutions Architect · Workiva',
      title: 'Scoped integrations and controlled customer-impacting writes',
      result: 'Led concurrent implementations through adoption across SSO, API, and ERP boundaries, with human review and native readback.',
    },
    {
      id: 'clinical-imaging',
      label: 'Clinical imaging',
      context: 'Solutions Consultant · Ambra Health',
      title: 'Connected imaging workflows across health-system boundaries',
      result: 'Carried EHR, portal, billing, and access-control integrations through review, go-live, and an acquisition transition.',
    },
  ],
} as const;

export const homeSynthesis = {
  title: 'How I work',
  body:
    'I start with the customer workflow, make one useful technical path work, and stay with it through failure, acceptance, and handoff.',
} as const;

export const aboutSection = {
  title: 'A customer-facing builder in Des Moines',
  body: [
    'I live in Des Moines, Iowa, after working in Chicago and with distributed customer teams. I like work that puts me close to the people using the system and the engineers shaping it.',
    'My background spans financial reporting, assurance, healthcare imaging, and enterprise integrations. Outside the résumé, I keep building public tools and labs because working code is the clearest way to sharpen technical judgment.',
  ],
} as const;

export const closingCta = {
  title: 'Let’s talk about the customer environment.',
  body:
    'I am pursuing forward-deployed engineering and technical deployment roles. Consulting is available selectively for a well-scoped implementation problem.',
} as const;
