/*
  Pull website-visitor numbers from GoatCounter into public/site-stats.json,
  where the stats card injected into /admin (inject-admin-stats.mjs) reads
  them. Aggregates only — visit counts and page titles, nothing sensitive —
  so the JSON being publicly fetchable exposes nothing beyond what the
  GoatCounter dashboard's own numbers say about a public website.

  Same never-fail contract as the other fetchers: any error keeps the last
  committed file and exits 0. Runs daily from refresh-stats.yml with
  GOATCOUNTER_API_TOKEN (read-statistics scope only).
*/
import fs from 'node:fs';
import path from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = path.join(ROOT, 'public/site-stats.json');
const TOKEN = process.env.GOATCOUNTER_API_TOKEN;
const BASE = 'https://wickieskitchen.goatcounter.com/api/v0';

if (!TOKEN) {
  console.warn('site-stats: GOATCOUNTER_API_TOKEN not set — keeping last good file');
  process.exit(0);
}

const api = async (ep) => {
  const r = await fetch(`${BASE}/${ep}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  });
  if (!r.ok) throw new Error(`${ep} -> ${r.status}`);
  return r.json();
};

const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

try {
  const [t30, t7, hits] = await Promise.all([
    api(`stats/total?start=${iso(daysAgo(30))}`),
    api(`stats/total?start=${iso(daysAgo(7))}`),
    api(`stats/hits?start=${iso(daysAgo(30))}&limit=8`),
  ]);

  const topPages = (hits.hits || [])
    .filter((h) => !h.event)
    .slice(0, 5)
    .map((h) => ({
      path: h.path,
      // strip the site-name suffix the pages put in <title>
      title: (h.title || h.path).replace(/\s*·.*$/, '').trim(),
      count: h.count,
    }));

  fs.writeFileSync(
    OUT,
    JSON.stringify(
      { updated: iso(new Date()), days30: t30.total, days7: t7.total, topPages },
      null,
      2
    ) + '\n'
  );
  console.log(`site-stats: 30d=${t30.total} 7d=${t7.total} pages=${topPages.length}`);
} catch (err) {
  console.warn(`site-stats: keeping last good file (${err.message})`);
}
