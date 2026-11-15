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
    line: 'Player-coach for municipal finance and ERP-connected reporting implementations, from hands-on build and UAT through adoption.',
    bullets: [
      'Lead a five-person implementation and consulting team while personally building Workiva solutions and running custom UAT plans, live user sessions, reverse demos, feedback-driven changes, and acceptance tracking.',
      'Lead bid identification through delivery handoff: shape SOWs, estimates, timelines, quotes, RFP responses, final packages, and on-site demos for municipal finance and ERP-connected reporting.',
      'Carry commercial commitments into implementation, executive status, acceptance, and customer adoption.',
      'Build controlled review workflows where a person signs off before a customer-impacting change reaches a client.',
      'Review solution designs and monitor delivery economics through budget-to-actual hours, utilization, and capacity and risk analysis.',
    ],
  },
  {
    dates: 'Dec 2024–Oct 2025',
    title: 'Manager of Digital Services · Citrin Cooperman',
    line: 'Player-coach for finance and regulatory reporting rollouts on the Workiva platform.',
    bullets: [
      'Built a custom data-collection and reporting workflow in Workiva with bidirectional integration between the reporting platform and the system of record, full audit trail, and sign-off from finance, IT, and executives at go-live.',
      'Led a five-person team while personally building Workiva spreadsheets, documents, links, formulas, tables, queries, workflows, and UAT through go-live.',
    ],
  },
  {
    dates: 'Oct 2022–Oct 2024',
    title: 'Solutions Architect · Workiva',
    line: 'Led concurrent GRC and financial-reporting implementations from discovery through go-live.',
    bullets: [
      'Scoped SSO, API, and ERP integration architecture with finance, audit, IT, and executive sponsors.',
      'Built source-first reconciliation and batched writes that stopped for human sign-off before anything reached a published statement.',
      'Served as the solutions-architecture lead across multiple concurrent enterprise engagements, aligning technical design with control and audit requirements.',
    ],
  },
  {
    dates: 'Sept 2021–Oct 2022',
    title: 'Solutions Consultant · Ambra Health',
    line: 'HIPAA imaging workflows, EHR interfaces, and customer-facing portals.',
    bullets: [
      'Deployed HIPAA-controlled imaging workflows, EHR interfaces, and customer-facing portal integrations with billing and access controls.',
      'Carried cross-practice implementations through an acquisition transition, keeping integrations in production and cleared through HIPAA review before go-live.',
    ],
  },
  {
    dates: 'Sept 2015–Sept 2021',
    title: 'SEC Reporting Consultant · Workiva',
    line: 'SEC reporting and XBRL across GAAP, IFRS, and ESEF on quarterly filing deadlines.',
    bullets: [
      'Drafted disclosures and executed quarterly SEC filings across GAAP, IFRS, and ESEF frameworks.',
      'Built and validated XBRL taxonomies and tagged financials to filing standards under quarterly deadline pressure.',
    ],
  },
] as const satisfies readonly ExperienceEntry[];
