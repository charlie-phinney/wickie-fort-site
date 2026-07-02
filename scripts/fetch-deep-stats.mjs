/*
  Deep engagement metrics for the "By the numbers" band — the tier the
  profile pages don't show. Runs in the daily refresh-stats Action.

  Sources, all with keep-last-good resilience (a failed key keeps its
  previous value; a denied permission just never populates its key, and the
  site hides tiles for missing keys):

  - Instagram Graph API (IG_TOKEN, Authorization header only):
      /me                    -> media_count
      /me/media (paginated)  -> per-post like_count + comments_count (basic scope)
      /{media}/insights      -> per-reel lifetime views  (needs insights scope
                                — probed once; skipped wholesale if denied)
      /me/insights           -> account views, last 28 days (same scope)
  - TikTok profile page      -> top-video playCount (first-page items incl. pinned)
  - YouTube About page       -> video count

  Derived in src/data/site.ts, not here — this script only records raw facts.
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATS_PATH = join(__dirname, '..', 'src', 'data', 'stats.json');
const token = process.env.IG_TOKEN;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ig(path, params = '') {
  const res = await fetch(`https://graph.instagram.com/${path}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

async function instagramDeep() {
  if (!token) {
    console.log('deep: no IG_TOKEN — skipping Instagram.');
    return {};
  }
  const out = {};

  const me = await ig('me', 'fields=media_count,followers_count');
  if (me.ok && me.body?.media_count > 0) out.igMediaCount = me.body.media_count;

  // Paginate every post: likes + comments come with basic scope.
  const media = [];
  let url = 'me/media';
  let params = 'fields=id,media_type,like_count,comments_count,timestamp&limit=50';
  for (let page = 0; page < 12; page++) {
    const r = await ig(url, params);
    if (!r.ok || !Array.isArray(r.body?.data)) {
      console.log(`deep: media page ${page} failed (${r.status}) — using what we have.`);
      break;
    }
    media.push(...r.body.data);
    const next = r.body.paging?.next;
    if (!next) break;
    const u = new URL(next);
    url = u.pathname.replace(/^\/(v[\d.]+\/)?/, '');
    // The API echoes the token into paging URLs — drop it; auth already
    // travels in the Authorization header.
    u.searchParams.delete('access_token');
    params = u.searchParams.toString();
  }
  if (media.length) {
    out.igPosts = media.length;
    out.igLikes = media.reduce((s, m) => s + (m.like_count || 0), 0);
    out.igComments = media.reduce((s, m) => s + (m.comments_count || 0), 0);
    // Engagement basis: the 12 most recent posts (media arrives newest-first).
    const recent = media.slice(0, 12);
    out.igRecentEngagement = recent.reduce(
      (s, m) => s + (m.like_count || 0) + (m.comments_count || 0),
      0
    );
    out.igRecentCount = recent.length;
    console.log(`deep: ${media.length} IG posts, ${out.igLikes} likes, ${out.igComments} comments.`);
  }

  // Per-reel lifetime views — probe the first video; if the scope is
  // missing, every call fails the same way, so bail after one denial.
  const videos = media.filter((m) => m.media_type === 'VIDEO').slice(0, 150);
  if (videos.length) {
    const probe = await ig(`${videos[0].id}/insights`, 'metric=views');
    if (!probe.ok) {
      console.log(
        `deep: media insights denied (${probe.status}: ${probe.body?.error?.message || 'no detail'}) — skipping per-reel views.`
      );
    } else {
      let sum = probe.body?.data?.[0]?.values?.[0]?.value || 0;
      let counted = 1;
      for (const v of videos.slice(1)) {
        await sleep(350); // stay well inside the per-hour call budget
        const r = await ig(`${v.id}/insights`, 'metric=views');
        const val = r.ok ? r.body?.data?.[0]?.values?.[0]?.value || 0 : 0;
        sum += val;
        if (r.ok) counted++;
      }
      if (sum > 0) {
        out.igViews = sum;
        out.igViewsCounted = counted;
        console.log(`deep: IG views ${sum} across ${counted} reels.`);
      }
    }
  }

  // Account-level 28-day views (momentum).
  const acct = await ig('me/insights', 'metric=views&period=days_28&metric_type=total_value');
  const v28 = acct.ok ? acct.body?.data?.[0]?.total_value?.value : null;
  if (v28 > 0) {
    out.igViews28 = v28;
    console.log(`deep: IG 28-day views ${v28}.`);
  } else if (!acct.ok) {
    console.log(`deep: account insights denied (${acct.status}: ${acct.body?.error?.message || 'no detail'}).`);
  }

  return out;
}

async function tiktokTop() {
  try {
    const res = await fetch('https://www.tiktok.com/@wickieskitchen', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      },
    });
    if (!res.ok) return {};
    const html = await res.text();
    const plays = [...html.matchAll(/"playCount":\s*(\d+)/g)].map((m) => parseInt(m[1], 10));
    if (plays.length) {
      console.log(`deep: TikTok first-page top video ${Math.max(...plays)} plays (${plays.length} items).`);
      return { ttTopViews: Math.max(...plays) };
    }
  } catch (e) {
    console.log('deep: TikTok fetch failed —', e.message);
  }
  return {};
}

async function youtubeCount() {
  try {
    const res = await fetch('https://www.youtube.com/@wickieskitchen/about?hl=en', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      },
    });
    if (!res.ok) return {};
    const html = await res.text();
    const m = html.match(/"videoCountText":"([\d,]+)\s+videos?"/i);
    if (m) return { ytVideoCount: parseInt(m[1].replace(/,/g, ''), 10) };
  } catch {}
  return {};
}

async function main() {
  const stats = JSON.parse(readFileSync(STATS_PATH, 'utf8'));
  const prev = stats.deep || {};
  const [igd, tt, yt] = [await instagramDeep(), await tiktokTop(), await youtubeCount()];
  // keep-last-good per key: only fetched keys overwrite.
  stats.deep = { ...prev, ...igd, ...tt, ...yt, updated: new Date().toISOString().slice(0, 10) };
  // Fold IG views into today's history entry (fetch-stats wrote it just
  // before this step) so the homepage views ticker can measure real growth.
  if (stats.deep.igViews && Array.isArray(stats.history) && stats.history.length) {
    const today = stats.history[stats.history.length - 1];
    if (today.d === stats.deep.updated) today.iv = stats.deep.igViews;
  }
  writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2) + '\n');
  console.log('deep: wrote', JSON.stringify(Object.keys(stats.deep)));
}

main().catch((e) => {
  // Same contract as fetch-reels: never fail the stats run.
  console.log('fetch-deep-stats error (keeping previous deep stats):', e.message);
});
