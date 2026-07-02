/*
  Deep engagement metrics for the "By the numbers" band — the tier the
  profile pages don't show. Runs in the daily refresh-stats Action.

  Sources, all with keep-last-good resilience (a failed key keeps its
  previous value; a denied permission just never populates its key, and the
  site hides tiles for missing keys):

  - Instagram Graph API (IG_TOKEN, Authorization header only):
      /me                    -> media_count
      /me/media (paginated)  -> per-post like_count + comments_count (basic scope)
      /{media}/insights      -> per-reel lifetime views + reach  (needs insights
                                scope — probed once; skipped wholesale if denied)
      /me/insights           -> account views, last 28 days (same scope)
  - TikTok, per video        -> yt-dlp (all videos: plays, top video, 1M+ count),
                                falling back to the profile page's first-page JSON
  - YouTube, per video       -> yt-dlp over /videos + /shorts (top video, 1M+
                                count); About page for the official video count

  Derived in src/data/site.ts, not here — this script only records raw facts.
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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

  // Per-reel lifetime views + reach — probe the first video; if the scope
  // is missing, every call fails the same way, so bail after one denial.
  const videos = media.filter((m) => m.media_type === 'VIDEO').slice(0, 150);
  if (videos.length) {
    const parse = (r) => {
      const vals = {};
      if (r.ok && Array.isArray(r.body?.data))
        for (const m of r.body.data) vals[m.name] = m.values?.[0]?.value || 0;
      return vals;
    };
    const probe = await ig(`${videos[0].id}/insights`, 'metric=views,reach');
    if (!probe.ok) {
      console.log(
        `deep: media insights denied (${probe.status}: ${probe.body?.error?.message || 'no detail'}) — skipping per-reel views.`
      );
    } else {
      let sum = 0, counted = 0, maxViews = 0, over1M = 0, reachSum = 0, maxReach = 0, engagement = 0;
      for (let i = 0; i < videos.length; i++) {
        let vals;
        if (i === 0) {
          vals = parse(probe);
        } else {
          await sleep(350); // stay well inside the per-hour call budget
          const r = await ig(`${videos[i].id}/insights`, 'metric=views,reach');
          if (!r.ok) continue; // failed reel contributes nothing anywhere
          vals = parse(r);
        }
        counted++;
        sum += vals.views || 0;
        if ((vals.views || 0) > maxViews) maxViews = vals.views;
        if ((vals.views || 0) >= 1e6) over1M++;
        reachSum += vals.reach || 0;
        if ((vals.reach || 0) > maxReach) maxReach = vals.reach;
        engagement += (videos[i].like_count || 0) + (videos[i].comments_count || 0);
      }
      if (sum > 0) {
        out.igViews = sum;
        out.igViewsCounted = counted;
        out.igMaxReelViews = maxViews;
        out.igReels1M = over1M;
        // Engagement-rate-by-reach inputs (likes+comments vs people reached,
        // lifetime, all reels) — robust to a single viral outlier, unlike a
        // per-post average against followers.
        out.igReelEngagement = engagement;
        out.igReelReach = reachSum;
        out.igTopReelReach = maxReach;
        console.log(
          `deep: IG views ${sum} across ${counted} reels (top ${maxViews}, ${over1M} over 1M, reach ${reachSum}).`
        );
      }
    }
  }

  // Audience spread (collected for a possible "fans in N countries" tile).
  const geo = await ig(
    'me/insights',
    'metric=follower_demographics&period=lifetime&breakdown=country&metric_type=total_value'
  );
  const results = geo.ok
    ? geo.body?.data?.[0]?.total_value?.breakdowns?.[0]?.results
    : null;
  if (Array.isArray(results) && results.length) {
    out.igCountries = results.length;
    console.log(`deep: followers in ${results.length} countries.`);
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

// Per-video view counts via yt-dlp's flat playlist (no download, one call
// per channel/tab). Returns a number array; [] on any failure so every
// consumer keeps its last good value.
function ytDlpViews(url) {
  try {
    const stdout = execFileSync('yt-dlp', ['--flat-playlist', '--print', '%(view_count)s', url], {
      encoding: 'utf8',
      timeout: 240000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return stdout
      .split('\n')
      .map((l) => parseInt(l, 10))
      .filter((n) => Number.isFinite(n) && n >= 0);
  } catch (e) {
    console.log(`deep: yt-dlp failed for ${url} — ${e.message.slice(0, 120)}`);
    return [];
  }
}

async function tiktokDeep() {
  // Preferred: every video's play count. TikTok sometimes blocks datacenter
  // IPs — keep-last-good covers the misses.
  const plays = ytDlpViews('https://www.tiktok.com/@wickieskitchen');
  if (plays.length) {
    const out = {
      ttViews: plays.reduce((s, p) => s + p, 0),
      ttTopViews: Math.max(...plays),
      ttOver1M: plays.filter((p) => p >= 1e6).length,
      ttVideoCount: plays.length,
    };
    console.log(
      `deep: TikTok ${out.ttViews} plays across ${plays.length} videos (top ${out.ttTopViews}, ${out.ttOver1M} over 1M).`
    );
    return out;
  }
  // Fallback: first-page items from the profile page's rehydration JSON
  // (top/1M-count only — no lifetime total, and only when TikTok serves it).
  try {
    const res = await fetch('https://www.tiktok.com/@wickieskitchen', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      },
    });
    if (!res.ok) return {};
    const html = await res.text();
    const first = [...html.matchAll(/"playCount":\s*(\d+)/g)].map((m) => parseInt(m[1], 10));
    if (first.length) {
      console.log(`deep: TikTok first-page top video ${Math.max(...first)} plays (${first.length} items).`);
      return {
        ttTopViews: Math.max(...first),
        ttOver1M: first.filter((p) => p >= 1e6).length,
      };
    }
  } catch (e) {
    console.log('deep: TikTok fetch failed —', e.message);
  }
  return {};
}

// Per-video YouTube view counts (longform + Shorts tabs) for the top-video
// and 1M+ composites. The lifetime channel total still comes from the About
// page in fetch-stats.mjs — this is per-video only.
function youtubeDeep() {
  // url+views pairs so the top video can be re-fetched for its exact count
  // (the flat playlist rounds: 24445740 arrives as 24000000).
  const pairs = [];
  for (const tab of ['videos', 'shorts']) {
    try {
      const stdout = execFileSync(
        'yt-dlp',
        ['--flat-playlist', '--print', '%(url)s %(view_count)s', `https://www.youtube.com/@wickieskitchen/${tab}`],
        { encoding: 'utf8', timeout: 240000, stdio: ['ignore', 'pipe', 'ignore'] }
      );
      for (const line of stdout.split('\n')) {
        const [url, v] = line.trim().split(/\s+/);
        const n = parseInt(v, 10);
        if (url && Number.isFinite(n) && n >= 0) pairs.push({ url, views: n });
      }
    } catch (e) {
      console.log(`deep: yt-dlp failed for YouTube /${tab} — ${e.message.slice(0, 120)}`);
    }
  }
  if (!pairs.length) return {};
  const top = pairs.reduce((a, b) => (b.views > a.views ? b : a));
  let topExact = top.views;
  try {
    const exact = parseInt(
      execFileSync('yt-dlp', ['--print', 'view_count', top.url], {
        encoding: 'utf8',
        timeout: 60000,
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
      10
    );
    if (Number.isFinite(exact) && exact > topExact) topExact = exact;
  } catch {}
  const out = {
    ytTopViews: topExact,
    ytOver1M: pairs.filter((p) => p.views >= 1e6).length,
  };
  console.log(`deep: YouTube top video ${out.ytTopViews}, ${out.ytOver1M} over 1M (${pairs.length} videos).`);
  return out;
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
  const [igd, tt, yt, ytc] = [await instagramDeep(), await tiktokDeep(), youtubeDeep(), await youtubeCount()];
  // keep-last-good per key: only fetched keys overwrite.
  stats.deep = { ...prev, ...igd, ...tt, ...yt, ...ytc, updated: new Date().toISOString().slice(0, 10) };
  // Fold IG + TikTok views into today's history entry (fetch-stats wrote it
  // just before this step) so the homepage views ticker measures real growth.
  if (Array.isArray(stats.history) && stats.history.length) {
    const today = stats.history[stats.history.length - 1];
    if (today.d === stats.deep.updated) {
      if (stats.deep.igViews) today.iv = stats.deep.igViews;
      if (stats.deep.ttViews) today.tv = stats.deep.ttViews;
    }
  }
  writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2) + '\n');
  console.log('deep: wrote', JSON.stringify(Object.keys(stats.deep)));
}

main().catch((e) => {
  // Same contract as fetch-reels: never fail the stats run.
  console.log('fetch-deep-stats error (keeping previous deep stats):', e.message);
});
