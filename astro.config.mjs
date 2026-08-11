import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { isIndexablePath } from './src/data/seo.ts';

export default defineConfig({
  site: 'https://davebettner.com',
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) => isIndexablePath(new URL(page).pathname),
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
});
