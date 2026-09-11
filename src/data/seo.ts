import { githubUrl, linkedinUrl } from './site-links';
export const siteUrl = 'https://davebettner.com';
export const siteTitle = 'Dave Bettner | Financial Systems Consulting';
export const siteDescription = 'Accounting technology consultant with experience at Workiva and accounting firms. Implementations, integrations, customer training, and AI-assisted reporting tools.';
export const identitySeoLead = siteDescription;
export const personSchema = {
 '@context':'https://schema.org','@type':'Person',name:'Dave Bettner',url:siteUrl,
 image:siteUrl+'/images/dave-bettner-headshot-20260816-cutout.png',description:siteDescription,
 jobTitle:'Senior Manager',homeLocation:{'@type':'Place',name:'Des Moines, Iowa'},
 knowsAbout:['Financial reporting','Workiva','Systems implementation','Customer training','API integrations','AI-assisted reporting'],
 sameAs:[linkedinUrl,githubUrl]
};
export const nonIndexPathPrefixes = ['/mockups','/preview-dither','/dither'];
export function isIndexablePath(pathname: string): boolean {
 return !pathname.startsWith('/404') && !nonIndexPathPrefixes.some(prefix => pathname.startsWith(prefix));
}
