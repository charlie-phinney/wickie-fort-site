/*
  Refreshes Wickie's real, cross-platform numbers for the "By the numbers"
  band. Runs free on GitHub Actions (daily) — no paid APIs, no accounts.

  It reads follower counts from each platform's free public endpoints and
  writes src/data/stats.json. Resilience is the point: if any platform
  blocks or changes shape, that field KEEPS its last good value instead of
  going to zero, so the site never shows a broken number. Whatever can be
  refreshed, is; the rest holds steady until it can.

  Sources:
    - Instagram: public web_profile_info + feed (followers, 1M+ count, top views)
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
const IG_USER_ID = '80213314569';
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
  // Followers: the public profile page's og:description carries the count,
  // but ONLY for a mobile UA. e.g. "30K Followers, 104 Following, 100 Posts"
  const html = await getText(`https://www.instagram.com/${IG_USER}/`, {}, 3, MOBILE_UA);
  const m = html && html.match(/([\d,.]+[KMB]?)\s+Followers/i);
  if (m) {
    const n = parseAbbrev(m[1]);
    if (n && n > 0) out.followers = n;
  }
  // Feed: 1M+ count + top views (best-effort; often blocked without a session)
  const plays = [];
  let max = '';
  for (let i = 0; i < 4; i++) {
    const feed = await getText(
      `https://www.instagram.com/api/v1/feed/user/${IG_USER_ID}/?count=33${max ? `&max_id=${max}` : ''}`,
      { 'X-IG-App-ID': '936619743392459' }
    );
    if (!feed) break;
    let j;
    try {
      j = JSON.parse(feed);
    } catch {
      break;
    }
    (j.items || []).forEach((it) => plays.push(it.play_count || it.view_count || 0));
    if (j.more_available) max = j.next_max_id;
    else break;
  }
  if (plays.length) {
    out.viralOver1M = plays.filter((v) => v >= 1e6).length;
    out.topVideoViews = Math.max(...plays);
  }
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
  if (ig.viralOver1M != null) next.viralOver1M = ig.viralOver1M;
  if (ig.topVideoViews) next.topVideoViews = ig.topVideoViews;

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
  console.error('fetch-stats failed (keeping previous values):', e.message);
  process.exit(0); // never fail the build; last-good stays
});
