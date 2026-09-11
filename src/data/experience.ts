export type ExperienceEntry = {
  dates: string;
  title: string;
  location?: string;
  line: string;
  bullets?: readonly string[];
};

/** Current resume supplied by Dave; statements are not independently verified employment records. */
export const experienceEntries: readonly ExperienceEntry[] = [
  {
    "dates": "Nov 2025 - Present",
    "title": "Senior Manager \u00b7 LSL, LLP",
    "line": "Lead Workiva delivery for city and county finance teams. Map source-ledger data into financial reports and budget books, and run user sessions and testing through client sign-off.",
    "bullets": [
      "Lead Workiva delivery for city and county finance teams. Map source-ledger data into financial reports and budget books, and run user sessions and testing through client sign-off.",
      "Develop Python tools that generate Workiva data links, formulas, and validation checks from client ledgers, reused across financial-reporting and budgeting engagements.",
      "Build AI-assisted workflows to check reports against source records and flag accounting discrepancies for review. Use Claude, Codex, and Cursor for build and review tasks, with human review before client changes.",
      "Scope consulting engagements, prepare estimates and statements of work, respond to RFPs, and demonstrate proposed solutions to customers."
    ]
  },
  {
    "dates": "Dec 2024 - Oct 2025",
    "title": "Manager of Digital Services, Workiva \u00b7 Citrin Cooperman",
    "line": "Managed a five-person Workiva implementation team. Coached consultants, resolved customer escalations, and led testing and training through go-live.",
    "bullets": [
      "Managed a five-person Workiva implementation team. Coached consultants, resolved customer escalations, and led testing and training through go-live.",
      "Led a data-collection and reporting implementation with bidirectional API integration to the customer's system of record, SSO, and an audit trail. Led user acceptance testing through go-live and executive sign-off."
    ]
  },
  {
    "dates": "Oct 2022 - Oct 2024",
    "title": "Solutions Architect \u00b7 Workiva",
    "line": "Led 6-12 concurrent financial-reporting and governance, risk, and compliance implementations from customer onboarding through production use.",
    "bullets": [
      "Led 6-12 concurrent financial-reporting and governance, risk, and compliance implementations from customer onboarding through production use.",
      "Ran requirements workshops and translated reporting, data, and access needs into implementation designs and test plans, including API, SSO, and ERP integration requirements.",
      "Worked with Sales and Customer Success on technical evaluations and delivery handoffs. Brought recurring customer issues to Product and Engineering and developed repeatable delivery guidance."
    ]
  },
  {
    "dates": "Sep 2021 - Oct 2022",
    "title": "Solutions Consultant \u00b7 Ambra Health",
    "line": "Implemented medical-imaging and EHR workflows in HIPAA-controlled environments. Worked with customer IT teams to resolve API, SFTP, webhook, and access issues through go-live.",
    "bullets": [
      "Implemented medical-imaging and EHR workflows in HIPAA-controlled environments. Worked with customer IT teams to resolve API, SFTP, webhook, and access issues through go-live."
    ]
  },
  {
    "dates": "Sep 2015 - Sep 2021",
    "title": "SEC Reporting Consultant \u00b7 Workiva",
    "line": "Delivered SEC reporting and XBRL services for 20+ public-company customers each quarter. Managed review cycles, resolved reporting issues, and helped customers meet filing deadlines.",
    "bullets": [
      "Delivered SEC reporting and XBRL services for 20+ public-company customers each quarter. Managed review cycles, resolved reporting issues, and helped customers meet filing deadlines."
    ]
  }
];
