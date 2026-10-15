import { githubUrl, linkedinUrl } from './site-links';
export const siteUrl = 'https://davebettner.com';
export const siteTitle = 'Dave Bettner | Enterprise Software Delivery & AI Workflows';
export const siteDescription = 'Dave Bettner leads enterprise software delivery and builds practical AI workflows, drawing on 10+ years in implementations, finance systems, and customer delivery.';
export const identitySeoLead = siteDescription;
export const personSchema = {
 '@context':'https://schema.org','@type':'Person',name:'Dave Bettner',url:siteUrl,
 image:siteUrl+'/images/dave-bettner-headshot-20260816-cutout.png',description:siteDescription,
 jobTitle:'Senior Manager',homeLocation:{'@type':'Place',name:'Des Moines, Iowa'},
 knowsAbout:['Enterprise software delivery','Implementation leadership','AI workflows','Financial reporting','Customer engagements','API integrations','Python','Product development','Interface design','AI coding tools'],
 sameAs:[linkedinUrl,githubUrl]
};
export const nonIndexPathPrefixes = ['/mockups'];
export function isIndexablePath(pathname: string): boolean {
 if (pathname.replace(/\/$/, '') === '/lab/accounting-acceptance') return false;
 return !pathname.startsWith('/404') && !nonIndexPathPrefixes.some(prefix => pathname.startsWith(prefix));
}
