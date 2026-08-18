import { githubUrl, linkedinUrl } from './site-links';

export const siteUrl = 'https://davebettner.com';

export const siteTitle = 'Dave Bettner | Forward-Deployed Engineering · Agent Systems';

export const siteDescription =
  'Dave Bettner brings ten years of customer implementation experience and newer, public hands-on agent engineering to forward-deployed technical work.';

export const identitySeoLead =
  'Customer-facing technical delivery since 2015, with newer public agent and MCP engineering work.';

export const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Dave Bettner',
  url: `${siteUrl}/`,
  image: `${siteUrl}/images/dave-bettner-headshot-20260808-square.jpg`,
  description:
    'Forward-deployed delivery and solutions engineering leader focused on complex workflows and inspectable AI-agent engineering work.',
  jobTitle: 'Senior Manager',
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
