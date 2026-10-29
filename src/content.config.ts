import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    project: z.enum(['homebase', 'krowbar', 'ai-workflows']),
    draft: z.boolean().default(true),
  }),
});

export const collections = { notes };
