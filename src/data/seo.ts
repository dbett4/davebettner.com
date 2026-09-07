import { githubUrl, linkedinUrl } from './site-links';

export const siteUrl = 'https://davebettner.com';

export const siteTitle = 'Dave Bettner | Senior Manager, Enterprise Deployments';

export const siteDescription =
  'Dave Bettner is a Senior Manager in Des Moines, Iowa who leads enterprise deployments from discovery through adoption, backed by customer-facing delivery since 2015 and independent public agent-engineering evidence.';

export const identitySeoLead =
  'Customer-facing technical delivery since 2015, including enterprise deployments and independent public agent and MCP engineering work.';

export const ogImagePath = '/images/dave-bettner-og.jpg';

export const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${siteUrl}/#dave-bettner`,
  name: 'Dave Bettner',
  url: `${siteUrl}/`,
  mainEntityOfPage: `${siteUrl}/`,
  image: `${siteUrl}/images/dave-bettner-headshot-20260808-square.jpg`,
  description:
    'Senior Manager who leads enterprise deployments from discovery through adoption and builds inspectable AI-agent systems as independent public evidence.',
  jobTitle: 'Senior Manager',
  knowsAbout: [
    'Enterprise deployments',
    'Forward-deployed engineering',
    'Solutions engineering',
    'Customer implementation',
    'Enterprise agent systems',
    'Model Context Protocol',
    'Financial reporting and assurance workflows',
  ],
  homeLocation: {
    '@type': 'Place',
    name: 'Des Moines, Iowa',
  },
  sameAs: [linkedinUrl, githubUrl],
} as const;

export const nonIndexPathPrefixes = [
  '/mockups',
  '/preview-dither',
  '/dither',
] as const;

export function isIndexablePath(pathname: string): boolean {
  if (pathname === '/404' || pathname === '/404/') return false;
  return !nonIndexPathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
