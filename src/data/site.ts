/* ==================================================================== */
/*  WICKIE'S KITCHEN — SITE CONTENT (reads from site.json)               */
/*  Wickie edits the content through the TinaCMS editor (see /admin),    */
/*  which saves to `site.json` in this folder. You can also edit that    */
/*  JSON file directly. This file just shapes that data for the site —   */
/*  you normally don't need to touch it.                                 */
/* ==================================================================== */
import data from './site.json';
import statsData from './stats.json';
import reelsData from './reels.json';

/* Media-kit numbers for the "By the numbers" band. Everything auto-refreshes
   daily (refresh-stats Action -> stats.json); the two hand-kept /admin fields
   (statVideosOver1M / statTopViews) act as FLOORS under the live-computed
   composites, never as the display value itself. */
// Real growth per day, measured from the daily history (fetch-stats appends
// one entry per run). Compared against the newest entry that's at least a
// day old — up to a week back — so the homepage tickers extrapolate from
// actual momentum, never a made-up rate. 0 until two days of history exist.
type Hist = { d: string; f: number; yv: number; tl: number; iv?: number };
const history: Hist[] = (statsData as { history?: Hist[] }).history || [];
const perDay = (key: 'f' | 'yv' | 'tl' | 'iv'): number => {
  if (history.length < 2) return 0;
  const last = history[history.length - 1];
  const days = (a: Hist, b: Hist) =>
    (new Date(b.d).getTime() - new Date(a.d).getTime()) / 86400e3;
  const base = history
    .slice(0, -1)
    .reverse()
    .find((h) => days(h, last) >= 1 && days(h, last) <= 7)
    ?? history[history.length - 2];
  if (typeof last[key] !== 'number' || typeof base[key] !== 'number') return 0;
  const span = days(base, last);
  return span >= 1 ? Math.max(0, ((last[key] as number) - (base[key] as number)) / span) : 0;
};

const views = (statsData as { views?: { youtube?: number } }).views || {};
const likes = (statsData as { likes?: { tiktok?: number } }).likes || {};

// Deep engagement metrics recorded daily by scripts/fetch-deep-stats.mjs.
type Deep = {
  igLikes?: number;
  igViews?: number;
  igViewsCounted?: number;
  igMaxReelViews?: number;
  igReels1M?: number;
  igRecentEngagement?: number;
  igRecentCount?: number;
  ttTopViews?: number;
  ttOver1M?: number;
  ytVideoCount?: number;
};
const deep: Deep = (statsData as { deep?: Deep }).deep || {};

// Parse a hand-kept figure like "24M" / "1.5m" / "900K" into a number, so
// Wickie's /admin entries act as FLOORS under the live-computed values —
// the displayed number is whichever is higher, and only ever grows.
const parseHand = (s: string): number => {
  const m = (s || '').replace(/,/g, '').match(/([\d.]+)\s*([KMB])?/i);
  if (!m) return 0;
  const mult = { K: 1e3, M: 1e6, B: 1e9 }[(m[2] || '').toUpperCase() as 'K' | 'M' | 'B'] || 1;
  return parseFloat(m[1]) * mult;
};

// Average engagement rate: likes+comments per recent post vs Instagram
// followers — the number brands ask for. Shown only when it's computed from
// enough posts and is genuinely strong; otherwise the tile hides.
const igFollowers = statsData.followers.instagram || 0;
const erValue =
  deep.igRecentEngagement && deep.igRecentCount && deep.igRecentCount >= 6 && igFollowers > 0
    ? (deep.igRecentEngagement / deep.igRecentCount / igFollowers) * 100
    : 0;

export const stats = {
  updated: statsData.updated,
  // Raw values + measured growth for the animated band. A zero value hides
  // its tile, so a platform going unfetchable can never show a broken 0.
  // `views` = measured Instagram views (per-reel insights) + YouTube's
  // lifetime count, stated as an honest FLOOR of her true all-platform
  // total (TikTok doesn't expose lifetime views; the "+" carries it).
  live: {
    views: {
      value: (views.youtube || 0) + (deep.igViews || 0),
      perDay: perDay('yv') + perDay('iv'),
    },
  },
  // Lifetime likes: every IG post + TikTok hearts.
  totalLikes: (deep.igLikes || 0) + (likes.tiktok || 0),
  // e.g. "15.6" — null hides the tile.
  engagementRate: erValue >= 1.5 && erValue < 1000 ? erValue.toFixed(1) : null,
  // Average views per Instagram reel — single-platform on purpose. A blended
  // IG+YT average silently excluded TikTok/Facebook (the platforms that would
  // drag it down), which overclaimed under a bare label. Scope rule for the
  // band: FLOOR stats (views, likes, 1M+ count, top video) can stay
  // unqualified because more platforms only raise them; non-floor stats like
  // this one must name their platform.
  avgViews:
    deep.igViews && deep.igViewsCounted
      ? Math.floor(deep.igViews / deep.igViewsCounted)
      : 0,
  // Live composites floored at Wickie's hand-kept /admin numbers, so they
  // only ever grow and are never below what she knows to be true.
  videos1M: Math.max(
    parseInt(String(data.statVideosOver1M ?? '0'), 10) || 0,
    (deep.igReels1M || 0) + (deep.ttOver1M || 0)
  ),
  topVideoViews: Math.max(
    parseHand(data.statTopViews || ''),
    deep.igMaxReelViews || 0,
    deep.ttTopViews || 0
  ),
};

export const site = {
  name: data.name,
  brand: data.brand,
  domain: 'wickiefort.com',
  tagline: data.tagline,
  heroKicker: data.heroKicker,
  heroSub: data.heroSub,
  heroImage: data.heroImage || undefined,
};

// One address for everything — the contact button, work-with-me, and footer.
export const emails = {
  general: data.emailGeneral,
};

export const socials = data.socials.filter((s) => s.href);

export const about = {
  heading: data.aboutHeading,
  image: data.aboutImage || undefined,
  // One textarea in /admin; blank lines separate paragraphs.
  paragraphs: (data.aboutText || '')
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.replace(/\s*\r?\n\s*/g, ' ').trim())
    .filter(Boolean),
};

// Ingredients and the method are each ONE textarea in /admin: one entry per
// line, and a line ending with ":" is a section heading ("Prep your burger:").
// Parsed here into typed parts so the pages can render headings differently.
export type RecipePart = { kind: 'heading' | 'item'; text: string };

export type Recipe = {
  title: string;
  blurb: string;
  tag?: string;
  image?: string;
  href?: string; // where the card links: its on-site recipe page, or an external URL override
  slug?: string; // on-site detail-page slug (absent only when the card links out externally)
  ingredients: RecipePart[];
  steps: RecipePart[];
  serves?: string;
  time?: string;
};

// The full-recipe fields (ingredientsText/methodText/serves/time) are filled in
// later through the /admin editor — a recipe starts as a title + blurb and
// gains its method when Wickie writes it up.
type RawRecipe = {
  title: string;
  blurb: string;
  tag?: string;
  image?: string;
  href?: string;
  slug?: string;
  serves?: string;
  time?: string;
  ingredientsText?: string;
  methodText?: string;
};

// One line = one entry. "Heading:" lines become section titles. Leading
// "1." / "2)" / "-" / "•" markers she types or pastes are stripped, because
// the page numbers and bullets everything itself.
const parseParts = (raw?: string): RecipePart[] =>
  (raw || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) =>
      l.endsWith(':')
      ? { kind: 'heading' as const, text: l.slice(0, -1).trim() }
      : { kind: 'item' as const, text: l.replace(/^(\d+[.)]|[-•*])\s+/, '') }
    );

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const recipes: Recipe[] = (data.recipes as RawRecipe[]).map((r) => {
  // An explicit http(s) link means the card opens that instead of an on-site page.
  const external = r.href && /^https?:\/\//i.test(r.href) ? r.href : '';
  const slug = external ? undefined : r.slug || slugify(r.title);
  return {
    // Tina doesn't trim inputs; stray trailing spaces otherwise leak into
    // <title>, og:title and JSON-LD ("Burgers  · Wickie's Kitchen").
    title: r.title.trim(),
    blurb: r.blurb.trim(),
    tag: r.tag?.trim() || undefined,
    image: r.image || undefined,
    ingredients: parseParts(r.ingredientsText),
    steps: parseParts(r.methodText),
    serves: r.serves?.trim() || undefined,
    time: r.time?.trim() || undefined,
    slug,
    href: external || `/recipes/${slug}`,
  };
});

export const workWithMe = {
  heading: data.workHeading,
  intro: data.workIntro,
  cta: data.workCta,
  // One textarea in /admin; one offering per line.
  offerings: (data.workOfferingsText || '')
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-•*]\s+/, '').trim())
    .filter(Boolean),
};

// Shop section. Wickie pastes ShopMy's embed HTML in /admin (collection →
// Settings & Sharing → Embeddable Components). SECURITY: that paste is raw
// HTML from a CMS textarea — never render it as-is. Only the ShopMy iframe
// URL is extracted here and the page rebuilds the tag itself, so nothing
// else in the paste (e.g. a script, if her editor login were ever
// compromised) can reach visitors. Until a valid embed is set, the section
// shows a button linking out to her ShopMy shop instead.
const embedPaste = (data as { shopEmbed?: string }).shopEmbed || '';
const embedMatch = embedPaste.match(/src\s*=\s*["']?(https:\/\/(?:www\.)?shopmy\.us\/[^"'\s>]+)/i);

export const shop = {
  heading: (data as { shopHeading?: string }).shopHeading || 'Shop my kitchen',
  intro: (data as { shopIntro?: string }).shopIntro || '',
  embedSrc: embedMatch ? embedMatch[1] : '',
  url: data.socials.find((s) => /shopmy/i.test(s.label))?.href || '',
};

// Latest Instagram posts for the homepage wall — refreshed daily by
// scripts/fetch-reels.mjs (thumbnails live in public/images/reels/ so the
// wall never rots when IG's CDN links expire). Empty until the first
// successful pull; the section hides itself below 3 posts.
export type Reel = { id: string; permalink: string; caption: string; image: string; isVideo: boolean };
export const reels: Reel[] = ((reelsData as { reels?: Reel[] }).reels || []).filter(
  (r) => r.permalink && r.image
);

/* Navigation anchors — structural, kept in code (not editable in the CMS
   so the on-page links can't break). */
export const nav = [
  { label: 'About', href: '#about' },
  { label: 'Recipes', href: '#recipes' },
  { label: 'Work With Me', href: '#work' },
  { label: 'Contact', href: '#contact' },
];
