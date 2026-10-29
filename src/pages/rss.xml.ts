import rss from '@astrojs/rss';
import { getPublishedNotes } from '../lib/notes';
import { siteUrl } from '../data/seo';

export async function GET() {
  const notes = await getPublishedNotes();
  return rss({
    title: 'Dave Bettner’s build notes',
    description: 'Notes from building Homebase, Krowbar, and AI workflows.',
    site: siteUrl,
    items: notes.map(note => ({
      title: note.data.title,
      description: note.data.description,
      pubDate: note.data.date,
      link: `/notes/${note.id}/`,
    })),
    customData: '<language>en-US</language>',
  });
}
