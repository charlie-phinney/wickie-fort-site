/*
  Hand-rolled RSS 2.0 feed (no extra dependency, same approach as sitemap.xml.ts).
  Lists every on-site recipe so fans can subscribe in a feed reader and the site
  is discoverable by readers/aggregators. Recipes that link out externally have
  no on-site slug and are correctly skipped. Once Wickie writes a recipe's
  ingredients + method in /admin, that full method flows into the feed item.
*/
import type { APIRoute } from 'astro';
import { site, recipes } from '../data/site';

// Minimal XML escape so titles/blurbs with & < > " ' can't break the feed.
const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Build the readable HTML body for a feed item: the blurb, plus the full
// ingredients + method when they exist. Wrapped in CDATA at the call site.
const itemHtml = (r: (typeof recipes)[number]) => {
  // Section headings ("Prep your burger:") render as bold list rows so the
  // feed keeps one continuous numbered method without nested markup.
  const parts = [`<p>${esc(r.blurb)}</p>`];
  if (r.ingredients.length) {
    parts.push('<h2>Ingredients</h2><ul>');
    parts.push(
      ...r.ingredients.map((p) =>
        p.kind === 'heading' ? `<li><strong>${esc(p.text)}</strong></li>` : `<li>${esc(p.text)}</li>`
      )
    );
    parts.push('</ul>');
  }
  if (r.steps.length) {
    // Same shape as the recipe page: each heading starts a new <ol> whose
    // `start` continues the numbering, so steps stay numbered across sections.
    parts.push('<h2>Method</h2>');
    let open = false;
    let n = 0;
    for (const p of r.steps) {
      if (p.kind === 'heading') {
        if (open) parts.push('</ol>');
        parts.push(`<h3>${esc(p.text)}</h3>`, `<ol start="${n + 1}">`);
        open = true;
      } else {
        if (!open) {
          parts.push('<ol>');
          open = true;
        }
        parts.push(`<li>${esc(p.text)}</li>`);
        n++;
      }
    }
    if (open) parts.push('</ol>');
  }
  return parts.join('');
};

export const GET: APIRoute = ({ site: astroSite }) => {
  const base = (astroSite?.href ?? 'https://wickiefort.com/').replace(/\/$/, '');
  const feedUrl = `${base}/rss.xml`;
  const buildDate = new Date().toUTCString();

  const items = recipes
    .filter((r) => r.slug)
    .map((r) => {
      const link = `${base}/recipes/${r.slug}/`;
      return `    <item>
      <title>${esc(r.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${itemHtml(r)}]]></description>
    </item>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.brand)} — Recipes</title>
    <link>${base}/</link>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <description>${esc(site.heroSub)}</description>
    <language>en</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
