import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// Static site — builds to ./dist, deploys free to Cloudflare Pages.
// Set the production URL here once the domain is live (used for canonical/OG tags).
// Hosted on GitHub Pages at /wickie-fort-site until the custom domain is wired.
// When wickiefort.com is live, change `site` to 'https://wickiefort.com' and
// remove `base` (I'll do this in the DNS step).
export default defineConfig({
  site: 'https://charlie-phinney.github.io',
  base: '/wickie-fort-site',
  integrations: [tailwind()],
});
