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
    line: 'Senior manager on municipal finance and ERP-connected reporting implementations; scoped delivery from diagnosis through adoption.',
    bullets: [
      'Support proposals, SOW scoping and negotiation, estimates, quotes, and RFP responses for municipal finance and ERP-connected reporting work.',
      'Run on-site demos and pitch presentations against customer decision criteria, then carry delivery handoffs through adoption.',
      'Build controlled review workflows with human sign-off on customer-impacting changes.',
    ],
  },
  {
    dates: 'Dec 2024–Oct 2025',
    title: 'Manager of Digital Services · Citrin Cooperman',
    line: 'Directed finance and regulatory reporting rollouts on the Workiva platform.',
    bullets: [
      'Owned a national healthcare enterprise certification special project: bidirectional API integration and executive stakeholder sign-off through go-live.',
      'Directed reporting rollouts across a five-person team.',
    ],
  },
  {
    dates: 'Oct 2022–Oct 2024',
    title: 'Solutions Architect · Workiva',
    line: 'Led concurrent GRC and financial-reporting implementations from discovery through go-live.',
    bullets: [
      'Scoped SSO, API, and ERP integration architecture with finance, audit, IT, and executive sponsors.',
      'Built controlled-write workflows with human sign-off on customer-impacting changes.',
    ],
  },
  {
    dates: 'Sept 2021–Oct 2022',
    title: 'Solutions Consultant · Ambra Health',
    line: 'Regulated clinical delivery outside finance: HIPAA imaging, EHR interfaces, and customer-facing portals.',
    bullets: [
      'Deployed HIPAA-controlled imaging workflows, EHR interfaces, and customer-facing portal integrations with billing and access controls.',
      'Carried cross-practice implementations through an acquisition transition.',
    ],
  },
  {
    dates: 'Sept 2015–Sept 2021',
    title: 'SEC Reporting Consultant · Workiva',
    line: 'SEC reporting and XBRL across GAAP, IFRS, and ESEF under quarterly filing deadline pressure.',
    bullets: [
      'SEC reporting and XBRL (GAAP, IFRS, and ESEF), disclosure drafting, and quarterly filing execution.',
    ],
  },
] as const satisfies readonly ExperienceEntry[];
