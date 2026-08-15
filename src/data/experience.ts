export type ExperienceEntry = {
  dates: string;
  title: string;
  location?: string;
  line: string;
  bullets?: readonly string[];
};

/** Canonical verified career timeline for site, résumé, and recruiter-fit prompt. */
export const experienceEntries: readonly ExperienceEntry[] = [
  {
    dates: 'Nov 2025–Present',
    title: 'Senior Manager · LSL, LLP',
    location: 'Chicago, then Des Moines',
    line: 'Municipal finance and ERP-connected reporting implementations, from the first scoping call through adoption.',
    bullets: [
      'Support proposals, SOWs, estimates, quotes, and RFP responses.',
      'Run on-site demos and pitches, then stay on the account through the handoff.',
      'Build review workflows where a person signs off before a change reaches a client.',
    ],
  },
  {
    dates: 'Dec 2024–Oct 2025',
    title: 'Manager of Digital Services · Citrin Cooperman',
    line: 'Directed finance and regulatory reporting rollouts on the Workiva platform.',
    bullets: [
      'Owned a statutory certification project for a national healthcare enterprise. The work included a bidirectional API integration with a full audit trail and sign-off from finance, IT, and executives at go-live.',
      'Led a five-person delivery team.',
    ],
  },
  {
    dates: 'Oct 2022–Oct 2024',
    title: 'Solutions Architect · Workiva',
    line: 'Led concurrent GRC and financial-reporting implementations from discovery through go-live.',
    bullets: [
      'Scoped SSO, API, and ERP integration architecture with finance, audit, IT, and executive sponsors.',
      'Built source-first reconciliation and batched writes that stopped for human sign-off before anything reached a published statement.',
    ],
  },
  {
    dates: 'Sept 2021–Oct 2022',
    title: 'Solutions Consultant · Ambra Health',
    line: 'HIPAA imaging workflows, EHR interfaces, and customer-facing portals.',
    bullets: [
      'Put four workflow types into production with billing and access controls. Each integration cleared HIPAA review before go-live.',
      'Carried cross-practice implementations through an acquisition transition.',
    ],
  },
  {
    dates: 'Sept 2015–Sept 2021',
    title: 'SEC Reporting Consultant · Workiva',
    line: 'SEC reporting and XBRL across GAAP, IFRS, and ESEF on quarterly filing deadlines.',
    bullets: [
      'Drafted disclosures and executed quarterly filings.',
    ],
  },
] as const satisfies readonly ExperienceEntry[];
