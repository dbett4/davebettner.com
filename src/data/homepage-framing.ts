import { publicEngineeringCases } from './public-proof';

export const thesis = {
  title: 'I carry complex customer deployments from discovery through adoption.',
  body: [
    'I scope the customer problem, integrate the systems around it, validate the path, and stay through handoff and adoption.',
    'Public repos show the same habits on inspectable agent labs and MCP integrations. Those labs are engineering proof, not customer-production agent deployments or a claim of production software-engineering tenure.',
  ],
} as const;

export const whereHeading = {
  title: 'Forward-deployed and solutions engineering roles',
  lead: 'Supported work across the presales-to-delivery path:',
  items: [
    'Workflow, stakeholders, constraints, decision criteria',
    'Scoped solution via proposals, SOWs, estimates, quotes, and RFP responses',
    'Persona-specific and on-site demos and pitch presentations against those criteria',
    'Integration, validation, issue resolution, and sign-off through go-live',
    'Handoff, controls, training and operating cadence, then iterate',
  ],
  close:
    'I support that path without claiming quota ownership, revenue credit, or final contract-signature authority. Finance, audit, and assurance are my deepest domain experience; the pattern applies wherever customer environments demand proof.',
} as const;

export const whatIBring = {
  title: 'Customer context and engineering rigor belong in the same room.',
  body: [
    'I have spent years turning complex reporting and controls workflows into systems teams can operate under deadline.',
    'I can move from executive discovery into API behavior, deployment constraints, validation, and failure recovery, then back into a demo or rollout plan without losing the thread.',
    'I care about working software, clear failure states, and enough evidence for the person accountable to decide.',
  ],
} as const;

export const featuredPublicProjectIds = [
  'hermes-deployment-lab',
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
  lead: 'Two inspectable systems that show guarded integration and failure recovery. Remaining work lives on the work index.',
  projects: mappedProjects,
  featuredProjects: mappedProjects.filter((project) =>
    (featuredPublicProjectIds as readonly string[]).includes(project.id),
  ),
} as const;

export const selectedProof = {
  title: 'Customer delivery outcomes',
  lead: 'Three client-delivery outcomes carried through integration, validation, sign-off, and adoption. Separate from the public systems below.',
  stories: [
    {
      id: 'insurance-certification',
      label: 'National healthcare enterprise',
      context: 'Manager of Digital Services · Citrin Cooperman',
      title: 'Bidirectional API workflow carried through sign-off',
      summary:
        'Statutory certification needed a controlled handoff between a reporting platform and an internal system of record. I owned diagnosis through go-live, designed bidirectional integration with audit trail, and aligned finance, IT, and executives on sign-off.',
      result: 'Production workflow delivered; handoff became a repeatable operating model.',
    },
    {
      id: 'gov-reporting',
      label: 'Concurrent GRC programs',
      context: 'Solutions Architect · Workiva',
      title: 'Controlled reporting with human review and native readback',
      summary:
        'Concurrent GRC and financial-reporting programs with no room for silent errors. I led solution design, scoped integration architecture, and built controlled-write workflows with human sign-off on customer-impacting changes.',
      result: 'Multiple concurrent implementations through adoption with journaled changesets and native readback.',
    },
    {
      id: 'clinical-imaging',
      label: 'Regulated clinical imaging',
      context: 'Solutions Consultant · Ambra Health',
      title: 'HIPAA imaging, EHR, and portal integrations through acquisition',
      summary:
        'Imaging orders and results had to move across practice and health-system boundaries under HIPAA, with billing and access controls intact through an acquisition transition.',
      result: 'Four workflow types in production; integrations cleared HIPAA review before go-live.',
    },
  ],
} as const;

export const aboutSection = {
  title: 'How I got here',
  body: [
    'I lead enterprise solution delivery for agent workflows and customer deployments: discovery, integrations, validation, sign-off, and adoption.',
    'That work taught me what survives contact with a customer: clear permissions, visible failures, reliable readback, and a recovery path. I apply those habits to agent systems and deployment labs.',
    'Finance, audit, and assurance are where my domain depth is deepest. The operating pattern applies anywhere agent software has to survive a real customer environment.',
  ],
} as const;

export const closingCta = {
  title: 'Put the system to work.',
  body:
    'I am looking for forward-deployed and solutions engineering roles where I can scope the problem with customers, integrate the systems around it, prove the deployment, and stay through iteration and adoption.',
} as const;
