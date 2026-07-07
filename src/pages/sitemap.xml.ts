/*
  Hand-rolled sitemap (no extra dependency). Lists the homepage and every
  on-site recipe page so search engines can discover them. Recipe cards that
  link out externally have no on-site slug and are correctly skipped.
*/
import type { APIRoute } from 'astro';
import { recipes, howtos } from '../data/site';

export const GET: APIRoute = ({ site }) => {
  const base = (site?.href ?? 'https://wickiefort.com/').replace(/\/$/, '');
  const entries = [
    { loc: `${base}/`, priority: '1.0' },
    // the how-to library joins the map once it has content
    ...(howtos.length ? [{ loc: `${base}/how-to/`, priority: '0.7' }] : []),
    ...recipes
      .filter((r) => r.slug)
      .map((r) => ({ loc: `${base}/recipes/${r.slug}/`, priority: '0.7' })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((e) => `  <url><loc>${e.loc}</loc><priority>${e.priority}</priority></url>`)
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
