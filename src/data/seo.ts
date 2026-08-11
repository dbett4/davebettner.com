import { githubUrl, linkedinUrl } from './site-links';

export const siteUrl = 'https://davebettner.com';

export const siteTitle = 'Dave Bettner | AI Implementation and Strategic Operations';

export const siteDescription =
  'Dave Bettner leads AI implementation and forward-deployed enterprise delivery, with public proof in MCP integrations, agent deployment, and controlled-write systems.';

export const identitySeoLead =
  'My background is in enterprise implementation, reporting technology, and the operational work required to get complicated systems into use.';

export const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Dave Bettner',
  url: `${siteUrl}/`,
  image: `${siteUrl}/images/dave-bettner-headshot-20260808-square.jpg`,
  description:
    'AI implementation and solutions leader focused on forward-deployed enterprise delivery.',
  jobTitle: 'AI implementation and solutions leader',
  homeLocation: {
    '@type': 'Place',
    name: 'Des Moines, Iowa',
  },
  sameAs: [linkedinUrl, githubUrl],
} as const;

export const nonIndexPathPrefixes = [
  '/fit',
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
