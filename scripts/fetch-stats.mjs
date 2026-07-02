/*
  Refreshes Wickie's real, cross-platform numbers for the "By the numbers"
  band. Runs free on GitHub Actions (daily) — no paid APIs, no accounts.

  It reads follower counts from each platform's free public endpoints and
  writes src/data/stats.json. Resilience is the point: if any platform
  blocks or changes shape, that field KEEPS its last good value instead of
  going to zero, so the site never shows a broken number. Whatever can be
  refreshed, is; the rest holds steady until it can.

  Sources:
    - Instagram: official Graph API (followers), with a public og:description fallback
    - TikTok:    public profile page JSON (followers)
    - YouTube:   public channel page (subscribers)
    - Facebook:  not fetchable without auth -> seeded, held steady
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATS_PATH = join(__dirname, '..', 'src', 'data', 'stats.json');

const IG_USER = 'wickieskitchen';
const TT_USER = 'wickieskitchen';
const YT_HANDLE = 'wickieskitchen';

// Desktop UA works for TikTok/YouTube. Meta sites (Instagram/Facebook)
// only expose the follower count in og:description to a MOBILE UA.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

async function getText(url, headers = {}, tries = 3, ua = UA) {
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(url, {
        headers: { 'User-Agent': ua, 'Accept-Language': 'en-US,en;q=0.9', ...headers },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (res.ok) return await res.text();
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  return null;
}

function parseAbbrev(s) {
  if (!s) return null;
  const m = String(s).replace(/,/g, '').match(/([\d.]+)\s*([KMB])?/i);
  if (!m) return null;
  let n = parseFloat(m[1]);
  const u = (m[2] || '').toUpperCase();
  if (u === 'K') n *= 1e3;
  else if (u === 'M') n *= 1e6;
  else if (u === 'B') n *= 1e9;
  return Math.round(n);
}

async function instagram() {
  const out = {};
  // Preferred: official Graph API (exact count, works from ANY IP incl. CI).
  // Enabled once IG_TOKEN + IG_USER_ID secrets exist.
  const token = process.env.IG_TOKEN;
  const igId = process.env.IG_USER_ID;
  if (token && igId) {
    try {
      const r = await fetch(
        `https://graph.instagram.com/v21.0/${igId}?fields=followers_count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const j = await r.json();
      if (j?.followers_count > 0) out.followers = j.followers_count;
    } catch {}
  }
  // Fallback: public profile page og:description, mobile UA only. e.g.
  // "30K Followers, 104 Following, 100 Posts" (rounded; residential IPs only).
  if (!out.followers) {
    const html = await getText(`https://www.instagram.com/${IG_USER}/`, {}, 3, MOBILE_UA);
    const m = html && html.match(/([\d,.]+[KMB]?)\s+Followers/i);
    if (m) {
      const n = parseAbbrev(m[1]);
      if (n && n > 0) out.followers = n;
    }
  }
  // Note: "videos over 1M" and "most-viewed video" are NOT computed here.
  // They span Instagram + TikTok + YouTube, which can't be tallied for free,
  // so they're kept by hand in site.json (statVideosOver1M / statTopViews).
  return out;
}

async function tiktok() {
  const html = await getText(`https://www.tiktok.com/@${TT_USER}`);
  if (!html) return {};
  // followerCount lives in the embedded rehydration JSON
  const m = html.match(/"followerCount":\s*(\d+)/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n > 0) return { followers: n };
  }
  return {};
}

async function youtube() {
  const html = await getText(`https://www.youtube.com/@${YT_HANDLE}?hl=en`);
  if (!html) return {};
  // e.g. "subscriberCountText" ... "20.2K subscribers", or plain "20.2K subscribers"
  const m =
    html.match(/"([\d.,]+[KMB]?)\s+subscribers"/i) ||
    html.match(/([\d.,]+[KMB]?)\s+subscribers/i);
  if (m) {
    const n = parseAbbrev(m[1]);
    if (n && n > 0) return { followers: n };
  }
  return {};
}

async function facebook() {
  // A Page's og:description carries "... 378 likes ...". Mobile UA required.
  const html = await getText(
    'https://www.facebook.com/profile.php?id=61572108161965',
    {},
    3,
    MOBILE_UA
  );
  if (!html) return {};
  const m = html.match(/([\d,.]+[KMB]?)\s+(?:followers|likes)/i);
  if (m) {
    const n = parseAbbrev(m[1]);
    if (n && n > 0) return { followers: n };
  }
  return {};
}

async function main() {
  const prev = JSON.parse(readFileSync(STATS_PATH, 'utf8'));
  const next = structuredClone(prev);
  const ok = {};

  const [ig, tt, yt, fb] = await Promise.all([
    instagram(),
    tiktok(),
    youtube(),
    facebook(),
  ]);

  if (ig.followers) {
    next.followers.instagram = ig.followers;
    ok.instagram = true;
  }

  if (tt.followers) {
    next.followers.tiktok = tt.followers;
    ok.tiktok = true;
  }
  if (yt.followers) {
    next.followers.youtube = yt.followers;
    ok.youtube = true;
  }
  if (fb.followers) {
    next.followers.facebook = fb.followers;
    ok.facebook = true;
  }

  next.totalFollowers =
    (next.followers.instagram || 0) +
    (next.followers.tiktok || 0) +
    (next.followers.youtube || 0) +
    (next.followers.facebook || 0);

  next.sources = {
    instagram: !!ok.instagram,
    tiktok: !!ok.tiktok,
    youtube: !!ok.youtube,
    facebook: !!ok.facebook,
  };
  next.updated = new Date().toISOString().slice(0, 10);

  writeFileSync(STATS_PATH, JSON.stringify(next, null, 2) + '\n');
  console.log('Refreshed stats:', JSON.stringify({ total: next.totalFollowers, ok }));
}

main().catch((e) => {
  // Platform fetch failures are already absorbed inside main() (each source
  // just keeps its last good value). Reaching here means something real —
  // e.g. a corrupted stats.json — so fail the run visibly instead of
  // freezing the numbers forever behind a green check.
  console.error('fetch-stats failed:', e.message);
  process.exit(1);
});
