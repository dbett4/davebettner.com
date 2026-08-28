import { githubUrl, linkedinUrl } from './site-links';

export const siteUrl = 'https://davebettner.com';

export const siteTitle = 'Dave Bettner | Forward-Deployed Engineering · Agent Systems';

export const siteDescription =
  'Dave Bettner leads 0-to-1 enterprise deployments from discovery through go-live and adoption, backed by ten years of customer implementation and public agent engineering.';

export const identitySeoLead =
  'Customer-facing technical delivery since 2015, including 0-to-1 enterprise deployments and newer public agent and MCP engineering work.';

export const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${siteUrl}/#dave-bettner`,
  name: 'Dave Bettner',
  url: `${siteUrl}/`,
  mainEntityOfPage: `${siteUrl}/`,
  image: `${siteUrl}/images/dave-bettner-headshot-20260808-square.jpg`,
  description:
    'Forward-deployed delivery and solutions engineering leader who owns enterprise deployments from discovery through go-live and adoption and builds inspectable AI-agent systems.',
  jobTitle: 'Senior Manager',
  knowsAbout: [
    'Forward-deployed engineering',
    '0-to-1 enterprise deployments',
    'Enterprise agent systems',
    'Solutions engineering',
    'Customer implementation',
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
