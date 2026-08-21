import { publicEngineeringCases } from './public-proof';

export const thesis = {
  title: 'I lead enterprise implementations and build agent systems for work where mistakes are expensive and people still need to stay in control.',
} as const;

export const featuredPublicProjectIds = [
  'agent-orchestration',
  'dedup-readback-bridge',
] as const;

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
  featuredProjects: featuredPublicProjectIds
    .map((projectId) => mappedProjects.find((project) => project.id === projectId))
    .filter((project): project is (typeof mappedProjects)[number] => Boolean(project)),
} as const;

export const selectedProof = {
  title: 'Customer delivery outcomes',
  lead: 'Three examples from ten years of implementation work. Finance and assurance are the deepest record; healthcare shows the pattern beyond them.',
  stories: [
    { id: 'insurance-certification', label: 'Custom solutioning', context: 'Manager of Digital Services · Citrin Cooperman', title: 'A controlled system-of-record handoff', result: 'Built a custom data-collection and reporting workflow in Workiva with bidirectional integration between the reporting platform and the system of record, delivered with audit trail and finance, IT, and executive sign-off.' },
    { id: 'gov-reporting', label: 'Enterprise GRC and reporting', context: 'Solutions Architect · Workiva', title: 'Scoped integrations and controlled customer-impacting writes', result: 'Led concurrent implementations through adoption across SSO, API, and ERP boundaries, with human review and native readback.' },
    { id: 'clinical-imaging', label: 'Clinical imaging', context: 'Solutions Consultant · Ambra Health', title: 'Connected imaging workflows across health-system boundaries', result: 'Carried EHR, portal, billing, and access-control integrations through review, go-live, and an acquisition transition.' },
  ],
} as const;

export const homeSynthesis = {
  title: 'From customer problem to working system',
  body: 'I start with the customer workflow, make one useful path work, and stay with it through failure, acceptance, and adoption. I care less about making an agent look autonomous than making the workflow safe enough to use and clear enough for the next team to improve.',
} as const;

export const businessTranslations = {
  title: 'The business translation',
  lead: 'Here is what those controls mean to the people running the work.',
  rows: [
    ['Safe recovery', 'A failed retry does not create a second order, payment, or update.'],
    ['Deduplication', 'The pipeline skips work it has already sent, saving processing and review time.'],
    ['Guarded integrations', 'An agent can prepare a change without getting an open-ended write path.'],
    ['Independent evaluation', 'Teams get a clearer answer about what passed, what failed, and what still needs a person.'],
    ['Readback and restore', 'A change can be checked after it is made and put back if the check fails.'],
    ['Human review gates', 'The system stops when the decision calls for business judgment.'],
  ],
} as const;

export const workingToward = {
  title: 'What I am working toward',
  body: 'I am building toward forward-deployed engineering work. I want to own a real customer problem, make the technical path work in that environment, stay with it when the hard failure appears, and turn what I learn into a better product and a better next deployment.',
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
  body: 'I am pursuing forward-deployed engineering and technical deployment roles. Consulting is available selectively for a well-scoped implementation problem.',
} as const;
