import { githubUrl, linkedinUrl } from './site-links';
export const siteUrl = 'https://davebettner.com';
export const siteTitle = 'Dave Bettner | AI Tools & Agent Workflows';
export const siteDescription = 'Dave Bettner builds AI tools and agent workflows, drawing on 10+ years in enterprise software and customer delivery, including Workiva implementation and team leadership.';
export const identitySeoLead = siteDescription;
export const personSchema = {
 '@type': 'Person',
 '@id': siteUrl + '/#person',
 name: 'Dave Bettner',
 givenName: 'Dave',
 familyName: 'Bettner',
 url: siteUrl,
 image: [siteUrl + '/images/dave-bettner-headshot-square.webp', siteUrl + '/images/dave-bettner-headshot-portrait-640.webp', siteUrl + '/images/dave-bettner-profile-social.jpg'],
 description: siteDescription,
 jobTitle: 'AI tools and agent-workflow builder',
 homeLocation: { '@type': 'Place', name: 'Des Moines, Iowa' },
 knowsAbout: ['Enterprise software delivery', 'Implementation leadership', 'AI workflows', 'Financial reporting', 'Customer engagements', 'API integrations', 'Python', 'Product development', 'Interface design', 'AI coding tools'],
 sameAs: [linkedinUrl, githubUrl],
};
export const websiteSchema = {
 '@type': 'WebSite',
 '@id': siteUrl + '/#website',
 name: 'Dave Bettner',
 url: siteUrl + '/',
 inLanguage: 'en-US',
 publisher: { '@id': siteUrl + '/#person' },
};

export function createPageSchema({ title, description, url, isProfile = false }: {
 title: string; description: string; url: string; isProfile?: boolean;
}) {
 return {
  '@type': isProfile ? 'ProfilePage' : 'WebPage',
  '@id': url + '#webpage',
  name: title, description, url, inLanguage: 'en-US',
  isPartOf: { '@id': siteUrl + '/#website' },
  ...(isProfile ? { mainEntity: { '@id': siteUrl + '/#person' } } : { about: { '@id': siteUrl + '/#person' } }),
 };
}
export const nonIndexPathPrefixes = ['/mockups'];
export function isIndexablePath(pathname: string): boolean {
 if (pathname.replace(/\/$/, '') === '/lab/accounting-acceptance') return false;
 return !pathname.startsWith('/404') && !nonIndexPathPrefixes.some(prefix => pathname.startsWith(prefix));
}
