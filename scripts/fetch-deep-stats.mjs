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
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATS_PATH = join(__dirname, '..', 'src', 'data', 'stats.json');
const PROFILES_DIR = join(__dirname, '..', 'public', 'images', 'profiles');
const token = process.env.IG_TOKEN;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Profile-card assets (avatars + each platform's three latest video
// thumbnails), saved locally so the cards never rot when a CDN link
// expires. A failed download keeps the previous file on disk and the
// previous metadata in stats.json (keep-last-good per platform).
const profiles = {};
async function saveImage(url, name) {
  if (!url) return null;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 2000) return null; // error page, not an image
    mkdirSync(PROFILES_DIR, { recursive: true });
    writeFileSync(join(PROFILES_DIR, name), buf);
    return `/images/profiles/${name}`;
  } catch {
    return null;
  }
}

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

  const me = await ig('me', 'fields=media_count,followers_count,profile_picture_url');
  if (me.ok && me.body?.media_count > 0) out.igMediaCount = me.body.media_count;
  const igAvatar = await saveImage(me.body?.profile_picture_url, 'instagram-avatar.jpg');
  if (igAvatar) profiles.instagram = { avatar: igAvatar };

  // Paginate every post: likes + comments come with basic scope.
  const media = [];
  let complete = false;
  let url = 'me/media';
  let params = 'fields=id,media_type,like_count,comments_count,timestamp&limit=50';
  for (let page = 0; page < 12; page++) {
    const r = await ig(url, params);
    if (!r.ok || !Array.isArray(r.body?.data)) {
      console.log(`deep: media page ${page} failed (${r.status}) — keeping yesterday's totals.`);
      break;
    }
    media.push(...r.body.data);
    const next = r.body.paging?.next;
    if (!next) {
      complete = true;
      break;
    }
    const u = new URL(next);
    url = u.pathname.replace(/^\/(v[\d.]+\/)?/, '');
    // The API echoes the token into paging URLs — drop it; auth already
    // travels in the Authorization header.
    u.searchParams.delete('access_token');
    params = u.searchParams.toString();
  }
  // A partial pagination would write UNDERCOUNTS (wrong, not just stale) —
  // sums only overwrite when every page arrived. Keep-last-good otherwise.
  if (media.length && complete) {
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
      // Same wrong-vs-stale rule as the pagination above: reels that failed
      // their insights call contribute nothing, so a flaky day would write
      // the views headline tens of millions LOW. Only overwrite on a full
      // sweep (media list complete + every reel answered).
      if (sum > 0 && complete && counted === videos.length) {
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
      } else if (sum > 0) {
        console.log(
          `deep: per-reel sweep incomplete (${counted}/${videos.length}) — keeping yesterday's view totals.`
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

// Per-video url + view-count pairs via yt-dlp's flat playlist (no download,
// one call per channel/tab). Returns []; on any failure every consumer keeps
// its last good value.
function ytDlpPairs(url) {
  try {
    const stdout = execFileSync('yt-dlp', ['--flat-playlist', '--print', '%(url)s %(view_count)s', url], {
      encoding: 'utf8',
      timeout: 240000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return stdout
      .split('\n')
      .map((line) => {
        const [u, v] = line.trim().split(/\s+/);
        return { url: u, views: parseInt(v, 10) };
      })
      .filter((p) => p.url && Number.isFinite(p.views) && p.views >= 0);
  } catch (e) {
    console.log(`deep: yt-dlp failed for ${url} — ${e.message.slice(0, 120)}`);
    return [];
  }
}

// One extra yt-dlp call for a single video's exact stats/thumbnail (flat
// playlists round counts: 24,445,834 arrives as 24000000).
function ytDlpVideo(url, field) {
  try {
    return execFileSync('yt-dlp', ['--print', field, url], {
      encoding: 'utf8',
      timeout: 60000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

async function tiktokDeep() {
  // Preferred: every video's play count. TikTok sometimes blocks datacenter
  // IPs — keep-last-good covers the misses.
  const pairs = ytDlpPairs('https://www.tiktok.com/@wickieskitchen');
  if (pairs.length) {
    const plays = pairs.map((p) => p.views);
    const top = pairs.reduce((a, b) => (b.views > a.views ? b : a));
    const out = {
      ttViews: plays.reduce((s, p) => s + p, 0),
      ttTopViews: top.views,
      ttOver1M: plays.filter((p) => p >= 1e6).length,
      ttVideoCount: plays.length,
    };
    const exact = parseInt(ytDlpVideo(top.url, 'view_count'), 10);
    if (Number.isFinite(exact) && exact > out.ttTopViews) out.ttTopViews = exact;
    // Profile-card strip: the first three videos as her profile shows them
    // (pinned first), plus her avatar from the profile page.
    const recent = [];
    for (const [i, p] of pairs.slice(0, 3).entries()) {
      const image = await saveImage(ytDlpVideo(p.url, 'thumbnail'), `tiktok-${i + 1}.jpg`);
      if (image) recent.push({ url: p.url, image });
    }
    const avatar = await tiktokAvatar();
    if (avatar || recent.length === 3)
      profiles.tiktok = {
        ...(avatar ? { avatar } : {}),
        ...(recent.length === 3 ? { recent } : {}),
      };
    console.log(
      `deep: TikTok ${out.ttViews} plays across ${pairs.length} videos (top ${out.ttTopViews}, ${out.ttOver1M} over 1M).`
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

// Her TikTok avatar lives in the profile page's rehydration JSON.
async function tiktokAvatar() {
  try {
    const res = await fetch('https://www.tiktok.com/@wickieskitchen', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      },
    });
    if (!res.ok) return null;
    const m = (await res.text()).match(/"avatarLarger":\s*"([^"]+)"/);
    return m ? saveImage(JSON.parse(`"${m[1]}"`), 'tiktok-avatar.jpg') : null;
  } catch {
    return null;
  }
}

// Per-video YouTube view counts (longform + Shorts tabs) for the top-video
// and 1M+ composites. The lifetime channel total still comes from the About
// page in fetch-stats.mjs — this is per-video only.
async function youtubeDeep() {
  const shorts = ytDlpPairs('https://www.youtube.com/@wickieskitchen/shorts');
  const pairs = [...ytDlpPairs('https://www.youtube.com/@wickieskitchen/videos'), ...shorts];
  if (!pairs.length) return {};
  const top = pairs.reduce((a, b) => (b.views > a.views ? b : a));
  let topExact = top.views;
  const exact = parseInt(ytDlpVideo(top.url, 'view_count'), 10);
  if (Number.isFinite(exact) && exact > topExact) topExact = exact;
  const out = {
    ytTopViews: topExact,
    ytOver1M: pairs.filter((p) => p.views >= 1e6).length,
  };
  // Profile-card strip: the three newest Shorts. i.ytimg's oar2 variant is
  // the vertical Shorts thumbnail; hqdefault covers videos that lack it.
  const recent = [];
  for (const [i, p] of shorts.slice(0, 3).entries()) {
    const id = p.url.match(/(?:shorts\/|v=|youtu\.be\/)([\w-]{6,})/)?.[1];
    if (!id) continue;
    const image =
      (await saveImage(`https://i.ytimg.com/vi/${id}/oar2.jpg`, `youtube-${i + 1}.jpg`)) ||
      (await saveImage(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, `youtube-${i + 1}.jpg`));
    if (image) recent.push({ url: p.url, image });
  }
  if (recent.length === 3) profiles.youtube = { recent };
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
    // Channel avatar for the profile card (bump the size hint the page uses).
    const av = html.match(/"avatar":\{"thumbnails":\[\{"url":"([^"]+)"/);
    if (av) {
      const avatar = await saveImage(av[1].replace(/=s\d+-/, '=s176-'), 'youtube-avatar.jpg');
      if (avatar) profiles.youtube = { ...(profiles.youtube || {}), avatar };
    }
    const m = html.match(/"videoCountText":"([\d,]+)\s+videos?"/i);
    if (m) return { ytVideoCount: parseInt(m[1].replace(/,/g, ''), 10) };
  } catch {}
  return {};
}

async function main() {
  const stats = JSON.parse(readFileSync(STATS_PATH, 'utf8'));
  const prev = stats.deep || {};
  const [igd, tt, yt, ytc] = [await instagramDeep(), await tiktokDeep(), await youtubeDeep(), await youtubeCount()];
  // keep-last-good per key: only fetched keys overwrite.
  stats.deep = { ...prev, ...igd, ...tt, ...yt, ...ytc, updated: new Date().toISOString().slice(0, 10) };
  // Profile-card assets, keep-last-good per platform (and per key within a
  // platform, so a fetched avatar never erases yesterday's recent strip).
  const prevProfiles = stats.profiles || {};
  stats.profiles = { ...prevProfiles };
  for (const [k, v] of Object.entries(profiles)) {
    stats.profiles[k] = { ...(prevProfiles[k] || {}), ...v };
  }
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
