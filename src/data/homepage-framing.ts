import { publicEngineeringCases } from './public-proof';

export const thesis = {
  title: 'The hard part starts after the demo.',
  body: [
    'An agent is only useful when it can work inside a real environment without creating new problems.',
    'That means connecting to existing systems, respecting controls, earning sign-off, and recovering when authentication, orchestration, or the model fails.',
    'I have spent much of my career doing that kind of work in enterprise integrations and regulated operations. I am now bringing the same discipline to agent deployment.',
  ],
} as const;

export const whereHeading = {
  title: 'I want to work where product meets the customer.',
  lead: 'The roles that fit me best involve:',
  items: [
    'Putting agents into complex enterprise environments and adapting them to the way teams already work',
    'Connecting internal APIs, data systems, and tools',
    'Tracing production failures across infrastructure, orchestration, and application layers',
    'Scoping with customers, shipping in stages, and improving reliability as people start using the system',
    'Running pilots that end with a working system and a team ready to operate it',
  ],
  close: 'I am especially interested in regulated industries and organizations built around knowledge work.',
} as const;

export const whatIBring = {
  title: 'The technology is new. The delivery problems are familiar.',
  body: [
    'I have spent years implementing business systems in regulated environments, where authentication fails, APIs change, and deadlines stay put.',
    'I can move from a sponsor conversation into the technical details, then back again without losing the thread. I have debugged integrations with production on the line and stayed through sign-off.',
    'Agent deployment gives me a new set of tools for work I already know well.',
  ],
} as const;

export const buildingNow = {
  title: 'Public engineering proof',
  lead: 'Four inspectable repositories with credential-free or offline checks. Each link goes to the exact public repo.',
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
  title: 'Selected delivery experience',
  lead: 'Enterprise implementations I carried from a messy starting point through go-live—separate from the public repos above.',
  stories: [
    {
      id: 'insurance-certification',
      label: 'National healthcare enterprise',
      title: 'Certification handoff with bidirectional API integration',
      summary:
        'Statutory certification needed a controlled handoff between a reporting platform and an internal system of record. I owned diagnosis through go-live, designed bidirectional integration with audit trail, and aligned finance, IT, and executives on sign-off.',
      result: 'Production workflow delivered; handoff became a repeatable operating model.',
    },
    {
      id: 'table-formatter',
      label: 'Public-sector close',
      title: 'Deterministic formatter replacing hundreds of manual operations per close',
      summary:
        'Eleven fund statements required hundreds of manual formatting operations per close. I built a deterministic pipeline with journaled changesets and tie-out checks instead of patching symptoms each quarter.',
      result: '970+ logged operations; repeatable batch runs with readback verification.',
    },
    {
      id: 'gov-reporting',
      label: 'Concurrent GRC programs',
      title: 'Controlled-write reporting under audit pressure',
      summary:
        'Concurrent GRC and financial-reporting programs with no room for silent errors. I led solution design, scoped integration architecture, and built controlled-write workflows with human sign-off on customer-impacting changes.',
      result: 'Multiple concurrent implementations through adoption with journaled changesets and native readback.',
    },
  ],
} as const;

export const aboutSection = {
  title: 'How I got here',
  body: [
    'My career has moved from accounting to reporting technology, implementation, and automation. The common thread is that I like taking ownership of problems that are hard to define and harder to finish.',
    'Agents give me a new set of tools for that same work. I care less about the novelty than whether the system works, can be trusted, and can be handed to the next operator.',
    'I want to help teams put agent products to work inside real enterprise environments.',
  ],
} as const;

export const closingCta = {
  title: "Let's get the hard thing working.",
  body:
    'I am looking for forward-deployed roles where I can help put agent systems into production, connect them to existing tools and data, and improve them alongside the teams who use them.',
} as const;
