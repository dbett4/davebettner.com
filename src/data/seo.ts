import { githubUrl, linkedinUrl } from './site-links';
export const siteUrl = 'https://davebettner.com';
export const siteTitle = 'Dave Bettner | Technical Implementation & AI Workflows';
export const siteDescription = 'Customer-facing technical implementation and solutions consulting across financial reporting and healthcare. Dave Bettner leads software delivery and builds Python and AI-assisted tools.';
export const identitySeoLead = siteDescription;
export const personSchema = {
 '@context':'https://schema.org','@type':'Person',name:'Dave Bettner',url:siteUrl,
 image:siteUrl+'/images/dave-bettner-headshot-20260816-cutout.png',description:siteDescription,
 jobTitle:'Senior Manager',homeLocation:{'@type':'Place',name:'Des Moines, Iowa'},
 knowsAbout:['Technical implementation','Solutions consulting','API integrations','Python','AI workflows','Financial reporting','Customer training'],
 sameAs:[linkedinUrl,githubUrl]
};
export const nonIndexPathPrefixes = ['/mockups','/preview-dither','/dither'];
export function isIndexablePath(pathname: string): boolean {
 return !pathname.startsWith('/404') && !nonIndexPathPrefixes.some(prefix => pathname.startsWith(prefix));
}
