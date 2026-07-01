import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// Static site — builds to ./dist, deploys free to Cloudflare Pages.
// Set the production URL here once the domain is live (used for canonical/OG tags).
// Live at the custom domain wickiefort.com (GitHub Pages + public/CNAME).
export default defineConfig({
  site: 'https://wickiefort.com',
  integrations: [tailwind()],
});
