import { publicEngineeringCases } from './public-proof';

export const thesis = {
  title: 'I work between product, engineering, and the customer to make agent systems useful in real workflows.',
  body: [
    'I bring ten years of customer implementation work and newer hands-on agent and MCP engineering. I learn the workflow, make the integration work, debug what breaks, and stay close to adoption.',
  ],
} as const;

export const whereHeading = {
  title: 'Where product meets the customer',
  lead: 'I work between product, engineering, and the customer:',
  items: [
    'Learn the workflow, the people, and the constraints.',
    'Turn the problem into a small path the product can support.',
    'Connect the APIs, tools, and systems around it.',
    'Debug the path in the real environment and make the limits clear.',
    'Stay through adoption and bring the useful feedback back to the team.',
  ],
  close:
    'Finance, audit, and assurance are where I have the deepest experience. The same habits carry into other complex customer environments.',
} as const;

export const whatIBring = {
  title: 'I work at the seam between product, engineering, and the customer.',
  body: [
    'I have spent ten years turning complex reporting and controls workflows into systems teams can use under deadline.',
    'I can move from customer context to API behavior, integration details, debugging, and validation without losing the reason the work matters.',
    'My public agent and MCP work shows how I think about tools, failure, recovery, and proof. It is synthetic or sanitized, not client production work.',
  ],
} as const;

export const featuredPublicProjectIds = [
  'hermes-deployment-lab',
  'hermes-agent-pr-84621',
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
  title: 'Public engineering proof',
  lead: 'Public labs and fixes show how I handle agent tools, failure, recovery, and integration. Each page states what the evidence does and does not prove.',
  projects: mappedProjects,
  featuredProjects: mappedProjects.filter((project) =>
    (featuredPublicProjectIds as readonly string[]).includes(project.id),
  ),
} as const;

export const selectedProof = {
  title: 'Customer delivery outcomes',
  lead: 'Ten years of customer deployment across finance, audit, and assurance show the field work. The public systems show how I approach agent tools, failure, and proof.',
  stories: [
    {
      id: 'insurance-certification',
      label: 'Statutory certification handoff',
      context: 'Manager of Digital Services · Citrin Cooperman',
      title: 'Bidirectional API workflow carried through sign-off',
      summary:
        'Statutory certification needed a controlled handoff between a reporting platform and an internal system of record. I owned diagnosis through go-live, designed bidirectional integration with audit trail, and aligned finance, IT, and executives on sign-off.',
      result: 'Bidirectional reporting ↔ system-of-record handoff with audit trail and finance, IT, and executive sign-off at go-live.',
    },
    {
      id: 'gov-reporting',
      label: 'GRC reporting with human review',
      context: 'Solutions Architect · Workiva',
      title: 'Controlled reporting with human review and native readback',
      summary:
        'Concurrent GRC and financial-reporting programs with no room for silent errors. I led solution design, scoped integration architecture, and built controlled-write workflows with human sign-off on customer-impacting changes.',
      result: 'SSO, API, and ERP-scoped GRC and reporting implementations with controlled writes, human sign-off, and native readback.',
    },
    {
      id: 'clinical-imaging',
      label: 'HIPAA imaging integration',
      context: 'Solutions Consultant · Ambra Health',
      title: 'HIPAA imaging, EHR, and portal integrations through acquisition',
      summary:
        'Imaging orders and results had to move across practice and health-system boundaries under HIPAA, with billing and access controls intact through an acquisition transition.',
      result: 'HIPAA imaging, EHR, portal, and billing workflows through acquisition; integrations cleared review before go-live.',
    },
  ],
} as const;

export const aboutSection = {
  title: 'How I work',
  body: [
    'I am strongest in the messy middle: the workflow is real, the constraints are incomplete, and someone still has to make the path work.',
    'I work between product, engineering, and the customer. I learn the workflow, connect the systems, debug the hard parts, and stay close to adoption.',
    'The public labs show how I think about permissions, failure, readback, and recovery. They are synthetic, sanitized, and inspectable. They are not customer tenants.',
    'Finance, audit, and assurance are my deepest domain proof. The work has also taken me through healthcare and other regulated environments.',
  ],
} as const;

export const closingCta = {
  title: 'Make the product work where the work happens.',
  body:
    'I am looking for forward-deployed work at the seam between product, engineering, and the customer. I want to learn the environment, make a useful path work, stay through debugging and adoption, and bring the field lessons back to the team.',
} as const;
