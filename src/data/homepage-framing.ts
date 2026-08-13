import { publicEngineeringCases } from './public-proof';

export const thesis = {
  title: 'Agents earn their place in the workflow.',
  body: [
    'An agent earns its place when it can carry real work inside a customer environment, not just produce an impressive answer.',
    'That means connecting private systems, respecting permissions, handling failures, and leaving evidence a person can review.',
    'My background is in enterprise integrations, financial reporting technology, and the delivery work required to turn promising software into a system people trust and use.',
  ],
} as const;

export const whereHeading = {
  title: 'I want to work where agent systems meet real operations.',
  lead: 'The roles that fit me best involve:',
  items: [
    'Scoping the customer problem, decision criteria, data, deployment constraints, and review points',
    'Connecting internal APIs, data systems, documents, and enterprise tools into agent workflows',
    'Proving the solution through demos, technical validation, deterministic checks, and failure testing',
    'Carrying deployments through onboarding, observability, recovery, and adoption, then turning what we learn into product improvements',
  ],
  close:
    'My deepest domain experience is in finance, audit, and assurance, but the operating pattern applies anywhere agent software has to survive a real customer environment.',
} as const;

export const whatIBring = {
  title: 'Customer context and engineering rigor belong in the same room.',
  body: [
    'I have spent years turning complex reporting and controls workflows into systems teams can operate under deadline.',
    'I can move from executive discovery into API behavior, deployment constraints, validation, and failure recovery, then back into a demo or rollout plan without losing the thread.',
    'I care about working software, clear failure states, and enough evidence for the person accountable to decide.',
  ],
} as const;

export const buildingNow = {
  title: 'Inspectable deployment proof',
  lead: 'Four public systems that connect enterprise data, guard actions, test failure paths, and leave evidence another person can inspect.',
  projects: publicEngineeringCases.map((item) => ({
    id: item.id,
    title: item.name,
    problem: item.summary,
    built: item.evidence,
    tools: item.limit,
    learned: item.limit,
    next: `Inspect the repository and its proof guide: ${item.repoUrl}`,
    href: item.href,
    repoUrl: item.repoUrl,
  })),
} as const;

export const selectedProof = {
  title: 'Domain proof from regulated work',
  lead: 'Three client-delivery outcomes carried through integration, validation, sign-off, and adoption. Separate from the public systems above.',
  stories: [
    {
      id: 'insurance-certification',
      label: 'National healthcare enterprise',
      title: 'Bidirectional API workflow carried through sign-off',
      summary:
        'Statutory certification needed a controlled handoff between a reporting platform and an internal system of record. I owned diagnosis through go-live, designed bidirectional integration with audit trail, and aligned finance, IT, and executives on sign-off.',
      result: 'Production workflow delivered; handoff became a repeatable operating model.',
    },
    {
      id: 'table-formatter',
      label: 'Public-sector close',
      title: 'Deterministic financial-statement QA replacing hundreds of manual operations',
      summary:
        'Eleven fund statements required hundreds of manual formatting operations per close. I built a deterministic pipeline with journaled changesets and tie-out checks instead of patching symptoms each quarter.',
      result: '970+ logged operations; repeatable batch runs with readback verification.',
    },
    {
      id: 'gov-reporting',
      label: 'Concurrent GRC programs',
      title: 'Controlled reporting with human review and native readback',
      summary:
        'Concurrent GRC and financial-reporting programs with no room for silent errors. I led solution design, scoped integration architecture, and built controlled-write workflows with human sign-off on customer-impacting changes.',
      result: 'Multiple concurrent implementations through adoption with journaled changesets and native readback.',
    },
  ],
} as const;

export const aboutSection = {
  title: 'How I got here',
  body: [
    'My background is in enterprise solution delivery and financial reporting technology. I have spent years leading discovery, integrations, validation, sign-off, and adoption in regulated environments.',
    'That work taught me what survives contact with a customer: clear permissions, visible failures, reliable readback, and a recovery path. I now apply those habits to agent workflows and deployment labs.',
    'I want to help teams adapt agent products to complex customer environments, while bringing unusual depth in finance, audit, and assurance.',
  ],
} as const;

export const closingCta = {
  title: 'Put the system to work.',
  body:
    'I am looking for forward-deployed and solutions engineering roles where I can scope the problem with customers, integrate the systems around it, prove the deployment, and stay through iteration and adoption.',
} as const;
