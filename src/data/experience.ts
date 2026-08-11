export type ExperienceEntry = {
  dates: string;
  title: string;
  line: string;
};

/** Canonical verified career timeline for site, résumé, and recruiter-fit prompt. */
export const experienceEntries = [
  {
    dates: 'Nov 2025–Present',
    title: 'Senior Manager · LSL, LLP',
    line: 'Chicago, then Des Moines. Senior manager on municipal finance and ERP-connected reporting implementations; scoped delivery from diagnosis through adoption and built controlled review workflows with human sign-off on customer-impacting changes.',
  },
  {
    dates: 'Dec 2024–Oct 2025',
    title: 'Manager of Digital Services · Citrin Cooperman',
    line: 'Directed finance and regulatory reporting rollouts on the Workiva platform. Owned a national healthcare enterprise certification special project: bidirectional API integration and executive stakeholder sign-off through go-live.',
  },
  {
    dates: 'Oct 2022–Oct 2024',
    title: 'Solutions Architect · Workiva',
    line: 'Led concurrent GRC and financial-reporting implementations from discovery through go-live. Scoped SSO, API, and ERP integration architecture with finance, audit, IT, and executive sponsors.',
  },
  {
    dates: 'Sept 2021–Oct 2022',
    title: 'Solutions Consultant · Ambra Health',
    line: 'Deployed HIPAA-controlled imaging workflows, EHR interfaces, and customer-facing portal integrations with billing and access controls through an acquisition transition.',
  },
  {
    dates: 'Sept 2015–Sept 2021',
    title: 'SEC Reporting Consultant · Workiva',
    line: 'SEC reporting and XBRL across GAAP, IFRS, and ESEF: technical accounting judgment, disclosure drafting, and quarterly filing execution under deadline pressure.',
  },
] as const satisfies readonly ExperienceEntry[];
