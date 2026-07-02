/*
  ONE-OFF AUDIT (temporary) — dumps the raw per-post Instagram data behind
  the "By the numbers" band so every displayed figure can be independently
  recomputed and cross-checked. Writes audit-out.json (uploaded as an
  Actions artifact). No token or secret ever appears in the output.
*/
import { writeFileSync } from 'node:fs';

const token = process.env.IG_TOKEN;
if (!token) {
  console.error('audit: no IG_TOKEN');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ig(path, params = '') {
  const res = await fetch(`https://graph.instagram.com/${path}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

const out = { fetched: new Date().toISOString() };

// Account basics
const me = await ig('me', 'fields=media_count,followers_count,username');
out.me = me.body;

// Every post with permalink so figures can be matched to public pages
const media = [];
let url = 'me/media';
let params =
  'fields=id,media_type,media_product_type,like_count,comments_count,timestamp,permalink&limit=50';
for (let page = 0; page < 12; page++) {
  const r = await ig(url, params);
  if (!r.ok || !Array.isArray(r.body?.data)) {
    out.mediaPageError = { page, status: r.status, error: r.body?.error?.message };
    break;
  }
  media.push(...r.body.data);
  const next = r.body.paging?.next;
  if (!next) break;
  const u = new URL(next);
  url = u.pathname.replace(/^\/(v[\d.]+\/)?/, '');
  u.searchParams.delete('access_token');
  params = u.searchParams.toString();
}
out.mediaCount = media.length;

// Per-video insights: views + reach + total_interactions (lifetime)
const videos = media.filter((m) => m.media_type === 'VIDEO');
for (const v of videos) {
  await sleep(250);
  const r = await ig(`${v.id}/insights`, 'metric=views,reach,total_interactions');
  if (r.ok && Array.isArray(r.body?.data)) {
    for (const metric of r.body.data) {
      v[metric.name] = metric.values?.[0]?.value ?? null;
    }
  } else {
    v.insightsError = { status: r.status, error: r.body?.error?.message };
  }
}
out.media = media;

// Account-level 28-day views
const acct = await ig('me/insights', 'metric=views&period=days_28&metric_type=total_value');
out.views28 = acct.ok ? acct.body?.data?.[0]?.total_value?.value : { status: acct.status };

writeFileSync('audit-out.json', JSON.stringify(out, null, 2));
console.log(
  `audit: ${media.length} media, ${videos.length} videos, insights ok on ${videos.filter((v) => typeof v.views === 'number').length}`
);
