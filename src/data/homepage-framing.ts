import { publicEngineeringCases } from './public-proof';

export const thesis = {
  title:
    'I have spent ten years leading enterprise implementations in reporting, finance, audit, and healthcare. The agent and MCP work is newer. It is public, synthetic, and built for the customer-facing AI deployment roles I am pursuing now.',
  body: [
    'I embed from discovery through integration, debugging, sign-off, and adoption—pairing customer delivery with hands-on agent and MCP engineering.',
  ],
} as const;

export const heroRole = 'I get software live inside customer environments.';

export const whereHeading = {
  title: 'Discovery through adoption',
  lead:
    'I use the same five stages in each customer environment. Every stage leaves the customer with something they can act on.',
  items: [
    'Sit with the people doing the work and learn what they are judged on.',
    'Write the proposal or SOW and put a real number on it.',
    'Demo the working path against the criteria the customer gave me.',
    'Integrate it, debug it in the customer’s stack, and get it signed off.',
    'Hand it to the team that owns it, then watch what they use.',
  ],
  close:
    'Finance, audit, and assurance are where I know the work best. My accounting degrees help me follow the argument, but I am not the accountant in the room. I build the system for the person who is. The healthcare work shows that the delivery pattern travels.',
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
  title: 'What I build in public',
  lead:
    'Synthetic labs and open-source fixes. The labs run without client data or credentials, so anyone can check the claims.',
  projects: mappedProjects,
  featuredProjects: mappedProjects.filter((project) =>
    featuredPublicProjectIds.some((projectId) => projectId === project.id),
  ),
} as const;

export const selectedProof = {
  title: 'Customer delivery outcomes',
  lead: 'Three customer programs I carried from diagnosis to signed-off go-live.',
  stories: [
    {
      id: 'insurance-certification',
      label: 'Statutory certification handoff',
      context: 'Manager of Digital Services · Citrin Cooperman',
      title: 'A bidirectional reporting handoff signed off by finance, IT, and executives',
      summary:
        'Statutory certification needed a controlled handoff between a reporting platform and an internal system of record. I took it from diagnosis to go-live, designed the bidirectional integration and audit trail, and aligned the teams responsible for the handoff.',
      result: 'The certification workflow went live and became a repeatable operating model.',
    },
    {
      id: 'gov-reporting',
      label: 'Concurrent GRC programs',
      context: 'Solutions Architect · Workiva',
      title: 'Controlled writes with a person approving every customer-facing change',
      summary:
        'Concurrent GRC and financial-reporting programs left no room for silent errors. I scoped the SSO, API, and ERP architecture with finance, audit, and IT, then built write workflows that stopped for human sign-off before a change reached a published statement.',
      result: 'Implementations reached adoption with journaled changes, tie-out checks, and native readback.',
    },
    {
      id: 'clinical-imaging',
      label: 'Regulated work outside finance',
      context: 'Solutions Consultant · Ambra Health',
      title: 'Moving patient imaging between health systems during an acquisition',
      summary:
        'Imaging orders and results had to cross practice and health-system boundaries under HIPAA while billing and access controls stayed intact. I ran the cross-practice implementations through the acquisition transition.',
      result: 'Four workflow types reached production, and each integration cleared HIPAA review before go-live.',
    },
  ],
} as const;

export const aboutSection = {
  title: 'Who you would be hiring',
  body: [
    'I am a senior manager who runs customer delivery. I sit with the customer, learn the workflow, build the integration, and stay until the team is using it. Most of that work has been in finance and reporting. The agent and MCP work is newer and public. It uses synthetic or sanitized data, not customer tenants.',
  ],
} as const;

/** About-page throughline prose; distinct from the homepage About block lead. */
export const aboutThroughline = {
  title: 'The same habits, whether the deadline is a filing or a deploy.',
  body: [
    'Most of my work has been getting reporting and controls systems into production where a wrong number creates a real problem. That means learning the workflow, designing the integration, debugging the edge cases, and staying past go-live until the team can run it.',
    'The labs on GitHub show the engineering. They run on synthetic data in my own repos. No client tenants, client data, or credentials. They show how I narrow a tool surface, separate approval from execution, verify a write, and recover after failure.',
    'I know finance, audit, and assurance well enough to follow the argument with a controller. I have accounting degrees, but I have not worked as an accountant. The healthcare-imaging work shows that the same delivery habits hold outside finance.',
  ],
} as const;

export const closingCta = {
  title: 'Let’s talk about the rollout.',
  body:
    'I am looking for customer-facing AI deployment work where I can learn the environment, integrate the systems around it, and stay through go-live and adoption. I am also open to focused consulting work that uses the same skills.',
} as const;
