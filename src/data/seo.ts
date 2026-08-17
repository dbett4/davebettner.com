import { githubUrl, linkedinUrl } from './site-links';

export const siteUrl = 'https://davebettner.com';

export const siteTitle = 'Dave Bettner | Forward-Deployed Engineering · Agent Systems';

export const siteDescription =
  'Dave Bettner works between product, engineering, and the customer, bringing ten years of implementation delivery and hands-on agent and MCP proof.';

export const identitySeoLead =
  'I work between product, engineering, and the customer across discovery, integration, debugging, validation, and adoption, with hands-on agent and MCP engineering.';

export const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Dave Bettner',
  url: `${siteUrl}/`,
  image: `${siteUrl}/images/dave-bettner-headshot-20260808-square.jpg`,
  description:
    'Forward-deployed engineering and customer delivery leader with hands-on agent and MCP engineering proof.',
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
