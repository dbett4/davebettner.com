import { githubUrl, linkedinUrl } from './site-links';
export const siteUrl = 'https://davebettner.com';
export const siteTitle = 'Dave Bettner | Product Design & Engineering';
export const siteDescription = 'Dave Bettner designs and builds products for complex workflows, using AI coding tools from product direction through implementation. Selected work: Passal, Leasekite, and agent tools.';
export const identitySeoLead = siteDescription;
export const personSchema = {
 '@context':'https://schema.org','@type':'Person',name:'Dave Bettner',url:siteUrl,
 image:siteUrl+'/images/dave-bettner-headshot-20260816-cutout.png',description:siteDescription,
 jobTitle:'Senior Manager',homeLocation:{'@type':'Place',name:'Des Moines, Iowa'},
 knowsAbout:['Product design','Interface design','Product development','AI coding tools','AI workflows','API integrations','Python','Implementation leadership','Customer engagements','Financial reporting'],
 sameAs:[linkedinUrl,githubUrl]
};
export const nonIndexPathPrefixes = ['/mockups'];
export function isIndexablePath(pathname: string): boolean {
 return !pathname.startsWith('/404') && !nonIndexPathPrefixes.some(prefix => pathname.startsWith(prefix));
}
