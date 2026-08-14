import { githubUrl, linkedinUrl } from './site-links';

export const siteUrl = 'https://davebettner.com';

export const siteTitle = 'Dave Bettner | Forward-Deployed Delivery · AI-Agent Systems';

export const siteDescription =
  'Dave Bettner turns complex customer workflows and technical constraints into deployed systems, backed by 10+ years of customer delivery and public AI-agent engineering proof.';

export const identitySeoLead =
  'I work with customer teams across discovery, solution design, integration, debugging, validation, and adoption, pairing enterprise delivery with hands-on AI-agent engineering.';

export const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Dave Bettner',
  url: `${siteUrl}/`,
  image: `${siteUrl}/images/dave-bettner-headshot-20260808-square.jpg`,
  description:
    'Forward-deployed delivery and solutions engineering leader focused on complex workflows and inspectable AI-agent engineering proof.',
  jobTitle: 'Senior Manager',
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
