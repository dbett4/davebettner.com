import { githubUrl, linkedinUrl } from './site-links';

export const siteUrl = 'https://davebettner.com';

export const siteTitle = 'Dave Bettner | Enterprise Agent Deployment · Solutions Engineering';

export const siteDescription =
  'Dave Bettner carries complex customer deployments from discovery through adoption, with public engineering proof for agent workflows and enterprise solutions engineering.';

export const identitySeoLead =
  'I lead enterprise solution delivery for agent workflows and customer deployments: discovery, integrations, validation, sign-off, and adoption.';

export const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Dave Bettner',
  url: `${siteUrl}/`,
  image: `${siteUrl}/images/dave-bettner-headshot-20260808-square.jpg`,
  description:
    'Enterprise agent deployment and solutions engineering leader focused on customer-facing workflows, regulated delivery, and inspectable proof.',
  jobTitle: 'Enterprise agent deployment and solutions engineering',
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
