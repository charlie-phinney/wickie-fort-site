/*
  Pulls Wickie's latest Instagram posts for the homepage "Fresh from my
  Instagram" wall. Runs in the daily refresh-stats Action (free) using the
  same IG_TOKEN the follower count uses.

  IG's CDN thumbnail URLs expire after a few days, so thumbnails are
  downloaded into the repo (public/images/reels/) and served from the site —
  the wall can never rot into broken images.

  Resilience contract (same as fetch-stats): on ANY failure, change nothing
  and exit 0 — the site keeps yesterday's wall. Only a fully successful pull
  replaces reels.json + thumbnails.
*/
import { readdirSync, writeFileSync, mkdirSync, unlinkSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REELS_JSON = join(__dirname, '..', 'src', 'data', 'reels.json');
const THUMB_DIR = join(__dirname, '..', 'public', 'images', 'reels');
const WANT = 6;

const token = process.env.IG_TOKEN;
if (!token) {
  console.log('No IG_TOKEN — leaving the existing reel wall untouched.');
  process.exit(0);
}

async function main() {
  // Token goes in the Authorization header, never the URL — query strings
  // leak into logs and error messages (same pattern as fetch-stats.mjs).
  const url =
    'https://graph.instagram.com/me/media' +
    '?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp' +
    '&limit=24';
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    console.log(`IG media request failed (${res.status}) — keeping existing wall.`);
    return;
  }
  const j = await res.json();
  const media = Array.isArray(j?.data) ? j.data : [];

  // Prefer videos (reels); top up with photos if she has fewer than WANT.
  const videos = media.filter((m) => m.media_type === 'VIDEO' && m.thumbnail_url);
  const photos = media.filter((m) => m.media_type === 'IMAGE' && m.media_url);
  const picked = [...videos, ...photos].slice(0, WANT);
  if (picked.length < 3) {
    console.log(`Only ${picked.length} usable posts — keeping existing wall.`);
    return;
  }

  // Download every thumbnail first; abort wholesale if any fails so we never
  // half-replace the wall. IG media ids are numeric — enforce it since the id
  // becomes a filename.
  const out = [];
  for (const m of picked) {
    if (!/^\d+$/.test(String(m.id))) {
      console.log(`Skipping non-numeric media id: ${m.id}`);
      continue;
    }
    const src = m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url;
    const r = await fetch(src);
    if (!r.ok) {
      console.log(`Thumbnail fetch failed (${r.status}) for ${m.id} — keeping existing wall.`);
      return;
    }
    out.push({
      id: String(m.id),
      permalink: m.permalink,
      caption: (m.caption || '').split('\n')[0].slice(0, 90),
      image: `/images/reels/${m.id}.jpg`,
      isVideo: m.media_type === 'VIDEO',
      bytes: Buffer.from(await r.arrayBuffer()),
    });
  }
  if (out.length < 3) {
    console.log('Too few valid posts after filtering — keeping existing wall.');
    return;
  }

  mkdirSync(THUMB_DIR, { recursive: true });
  const keep = new Set(out.map((m) => `${m.id}.jpg`));
  for (const m of out) writeFileSync(join(THUMB_DIR, `${m.id}.jpg`), m.bytes);
  if (existsSync(THUMB_DIR)) {
    for (const f of readdirSync(THUMB_DIR)) {
      if (!keep.has(f)) unlinkSync(join(THUMB_DIR, f));
    }
  }
  writeFileSync(
    REELS_JSON,
    JSON.stringify(
      {
        updated: new Date().toISOString().slice(0, 10),
        reels: out.map(({ bytes: _bytes, ...rest }) => rest),
      },
      null,
      2
    ) + '\n'
  );
  console.log(`Reel wall refreshed: ${out.length} posts (${out.filter((m) => m.isVideo).length} videos).`);
}

main().catch((e) => {
  // Never fail the workflow over the wall — stats still need to commit.
  console.log('fetch-reels error (keeping existing wall):', e.message);
});
