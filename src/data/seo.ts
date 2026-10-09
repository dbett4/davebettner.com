import { githubUrl, linkedinUrl } from './site-links';
export const siteUrl = 'https://davebettner.com';
export const siteTitle = 'Dave Bettner | Implementation Leader & Product Builder';
export const siteDescription = 'Dave Bettner leads enterprise implementations and customer engagements, and builds products informed by that delivery experience. Selected work: Passal, Lockfield, and Leasekite.';
export const identitySeoLead = siteDescription;
export const personSchema = {
 '@context':'https://schema.org','@type':'Person',name:'Dave Bettner',url:siteUrl,
 image:siteUrl+'/images/dave-bettner-headshot-20260816-cutout.png',description:siteDescription,
 jobTitle:'Senior Manager',homeLocation:{'@type':'Place',name:'Des Moines, Iowa'},
 knowsAbout:['Implementation leadership','Customer engagements','Product development','Technical implementation','Solutions consulting','API integrations','Python','AI workflows','Financial reporting','Customer training'],
 sameAs:[linkedinUrl,githubUrl]
};
export const nonIndexPathPrefixes = ['/mockups'];
export function isIndexablePath(pathname: string): boolean {
 return !pathname.startsWith('/404') && !nonIndexPathPrefixes.some(prefix => pathname.startsWith(prefix));
}
