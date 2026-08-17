import { publicEngineeringCases } from './public-proof';

export const thesis = {
  title: 'I deploy AI systems with customers—from discovery through adoption.',
  body: [
    'I embed from discovery through integration, debugging, sign-off, and adoption—pairing customer delivery with hands-on agent and MCP engineering.',
  ],
} as const;

export const whereHeading = {
  title: 'Forward-deployed delivery and solutions engineering',
  lead: 'The operating loop I bring into an unfamiliar customer environment:',
  items: [
    'Map the workflow, stakeholders, constraints, and decision criteria',
    'Shape a scoped solution through proposals, SOWs, estimates, quotes, and RFP responses',
    'Demonstrate the path against buyer and operator criteria',
    'Integrate, debug, validate, and secure sign-off through go-live',
    'Hand off a controlled operating cadence, measure adoption, and iterate',
  ],
  close:
    'Finance, audit, and assurance are my deepest domain experience; the pattern applies wherever customer environments demand proof.',
} as const;

export const whatIBring = {
  title: 'Customer context and engineering proof belong in the same room.',
  body: [
    'I have spent years turning complex reporting and controls workflows into systems teams can operate under deadline.',
    'I can move from executive discovery into API behavior, deployment constraints, debugging, validation, and failure recovery, then back into a demo or rollout plan without losing the thread.',
    'I care about working software, clear failure states, and enough evidence for the person accountable to decide.',
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
  lead: 'Three inspectable signals: deployment recovery, an open Hermes Agent Desktop fix, and guarded API integration. Remaining work lives on the work index.',
  projects: mappedProjects,
  featuredProjects: mappedProjects.filter((project) =>
    (featuredPublicProjectIds as readonly string[]).includes(project.id),
  ),
} as const;

export const selectedProof = {
  title: 'Customer delivery outcomes',
  lead: 'Regulated delivery is the vertical proof. The public systems below show the controls I bring into new environments.',
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
    'I am strongest in the messy middle: when the workflow is real, the constraints are incomplete, and the path to a dependable release still has to be found.',
    'The public labs show permissions, visible failures, readback, and recovery. They are synthetic, sanitized, and inspectable. They are not customer tenants.',
    'Finance, audit, and assurance are my deepest domain proof; the operating pattern travels to other regulated customer environments.',
  ],
} as const;

export const closingCta = {
  title: 'Bring AI into the workflow, not just the demo.',
  body:
    'I am targeting forward-deployed and solutions engineering roles where I can learn the customer environment, integrate the systems around it, ship a working path, and stay through debugging, adoption, and iteration.',
} as const;
