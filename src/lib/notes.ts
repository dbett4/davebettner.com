import { getCollection } from 'astro:content';

export const noteProjects = {
  homebase: { name: 'Homebase', href: '/work/homebase/' },
  krowbar: { name: 'Krowbar', href: '/work/krowbar/' },
  'ai-workflows': { name: 'AI workflows', href: '/ai-workflows/' },
} as const;

export const formatNoteDate = (date: Date) => new Intl.DateTimeFormat('en-US', {
  month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
}).format(date);

export async function getPublishedNotes() {
  const notes = await getCollection('notes', ({ data }) => !data.draft);
  return notes.sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id));
}
