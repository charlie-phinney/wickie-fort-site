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
   daily (refresh-stats Action -> stats.json); the one hand-kept /admin field
   (statVideosOver1M) acts as a FLOOR under the live-computed composite,
   never as the display value itself. */
// Real growth per day, measured from the daily history (fetch-stats appends
// one entry per run). Compared against the newest entry that's at least a
// day old — up to a week back — so the homepage tickers extrapolate from
// actual momentum, never a made-up rate. 0 until two days of history exist.
type Hist = { d: string; f: number; yv: number; tl: number; iv?: number; tv?: number };
const history: Hist[] = (statsData as { history?: Hist[] }).history || [];
const perDay = (key: 'f' | 'yv' | 'tl' | 'iv' | 'tv'): number => {
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

// Deep engagement metrics recorded daily by scripts/fetch-deep-stats.mjs.
type Deep = {
  igLikes?: number;
  igViews?: number;
  igViewsCounted?: number;
  igMaxReelViews?: number;
  igReels1M?: number;
  igReelEngagement?: number;
  igReelReach?: number;
  igTopReelReach?: number;
  igRecentEngagement?: number;
  igRecentCount?: number;
  ttViews?: number;
  ttTopViews?: number;
  ttOver1M?: number;
  ytTopViews?: number;
  ytOver1M?: number;
  ytVideoCount?: number;
  igCountries?: number;
};
const deep: Deep = (statsData as { deep?: Deep }).deep || {};

// Profile cards for the band: link + handle from Wickie's socials in /admin,
// avatar + latest-video strip refreshed daily by fetch-deep-stats (Instagram's
// strip reuses the reel wall's local thumbnails). The numbers link straight to
// the real accounts, so anyone can verify them in one tap.
type ProfileMedia = { avatar?: string; recent?: { url: string; image: string }[] };
const profileMedia = (statsData as { profiles?: Record<string, ProfileMedia> }).profiles || {};
const igRecent = (reelsData as { reels?: { permalink: string; image: string }[] }).reels
  ?.slice(0, 3)
  .map((r) => ({ url: r.permalink, image: r.image }));
const profileFor = (label: string) => {
  const social = data.socials.find((s) => s.label === label && s.href);
  if (!social) return undefined;
  const media = profileMedia[label.toLowerCase()] || {};
  const recent = label === 'Instagram' && igRecent?.length === 3 ? igRecent : media.recent;
  return { href: social.href, handle: social.handle, avatar: media.avatar, recent };
};

// Scoreboard: one row per platform, every number explicitly scoped to its
// home. A platform whose numbers all go unfetchable simply drops its row
// rather than showing broken zeros.
const platforms = [
    {
      name: 'Instagram',
      followers: statsData.followers.instagram || 0,
      views: deep.igViews || 0,
      over1M: deep.igReels1M || 0,
      profile: profileFor('Instagram'),
    },
    {
      name: 'TikTok',
      followers: statsData.followers.tiktok || 0,
      views: deep.ttViews || 0,
      over1M: deep.ttOver1M || 0,
      profile: profileFor('TikTok'),
    },
    {
      name: 'YouTube',
      followers: statsData.followers.youtube || 0,
      views: views.youtube || 0,
      over1M: deep.ytOver1M || 0,
      profile: profileFor('YouTube'),
    },
].filter((p) => p.followers > 0 && p.views > 0);

export const stats = {
  updated: statsData.updated,
  platforms,
  // Combined line under the columns. `views` = the three platforms' measured
  // totals, an honest FLOOR of her true total (Facebook isn't measurable
  // without auth; the "+" carries it), ticking with real measured growth.
  live: {
    views: {
      value: (views.youtube || 0) + (deep.igViews || 0) + (deep.ttViews || 0),
      perDay: perDay('yv') + perDay('iv') + perDay('tv'),
    },
  },
  // Sum of the rows actually shown (Facebook never has a row — 378
  // followers, nothing to show — and a dropped platform drops out of the
  // headline too, so it always matches what the table adds up to).
  followersShown: platforms.reduce((s, p) => s + p.followers, 0),
  // Floored at Wickie's hand-kept /admin number so it never undercounts what
  // she knows to be true.
  videos1M: Math.max(
    parseInt(String(data.statVideosOver1M ?? '0'), 10) || 0,
    (deep.igReels1M || 0) + (deep.ttOver1M || 0) + (deep.ytOver1M || 0)
  ),
  // Countries her Instagram followers live in (media kit only — the band's
  // tile budget is spent).
  countries: deep.igCountries || 0,
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

// Two recipes with the same title would slugify identically and collide in
// getStaticPaths — suffix repeats so Wickie can never break the build from
// the editor ("Pasta", "Pasta" -> pasta, pasta-2).
const seenSlugs = new Map<string, number>();
const uniqueSlug = (s: string) => {
  const n = (seenSlugs.get(s) || 0) + 1;
  seenSlugs.set(s, n);
  return n === 1 ? s : `${s}-${n}`;
};

export const recipes: Recipe[] = (data.recipes as RawRecipe[]).map((r) => {
  // An explicit http(s) link means the card opens that instead of an on-site page.
  const external = r.href && /^https?:\/\//i.test(r.href) ? r.href : '';
  const slug = external ? undefined : uniqueSlug(r.slug || slugify(r.title));
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

/* ------------------------- How-to technique videos ------------------------- */
// Wickie's culinary-school basics series. Each entry gets an anchor on the
// /how-to page, and recipes that mention the technique link to it
// automatically (see linkTechniques below).
export type HowTo = {
  title: string; // stored without a "How to" prefix; pages add their own
  slug: string;
  blurb?: string;
  image?: string;
  videoUrl?: string;
  embed?: { kind: 'instagram' | 'youtube' | 'tiktok'; src: string };
  terms: string[]; // phrases that auto-link from recipe text
};

type RawHowTo = {
  title?: string;
  videoUrl?: string;
  blurb?: string;
  image?: string;
  matchText?: string;
};

// Turn whatever video link Wickie pastes into an embeddable player URL.
// SECURITY: same posture as the shop embed — the iframe src is REBUILT from
// the parsed video id, never her raw paste. An unrecognized link is never
// embedded; the page falls back to a "watch" button instead.
const videoEmbed = (url?: string): HowTo['embed'] | undefined => {
  if (!url) return undefined;
  let m = url.match(/instagram\.com\/(?:[\w.]+\/)?(reel|p|tv)\/([A-Za-z0-9_-]+)/i);
  if (m) {
    return {
      kind: 'instagram',
      src: `https://www.instagram.com/${m[1].toLowerCase()}/${m[2]}/embed/`,
    };
  }
  m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
  if (m) return { kind: 'youtube', src: `https://www.youtube-nocookie.com/embed/${m[1]}` };
  m = url.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/i);
  if (m) return { kind: 'tiktok', src: `https://www.tiktok.com/embed/v2/${m[1]}` };
  return undefined;
};

const howtoSlugSeen = new Map<string, number>();
export const howtos: HowTo[] = (((data as { howtos?: RawHowTo[] }).howtos || []) as RawHowTo[])
  .filter((h) => h?.title?.trim())
  .map((h) => {
    // She might type "How to dice an onion" out of habit — strip it so the
    // pages don't render "How to how to dice an onion".
    const title = h.title!.trim().replace(/^how\s+to\s+/i, '');
    const base = slugify(title);
    const n = (howtoSlugSeen.get(base) || 0) + 1;
    howtoSlugSeen.set(base, n);
    const url = h.videoUrl?.trim() || undefined;
    const terms = (h.matchText || '')
      .split(/\r?\n/)
      .map((l) => l.replace(/^[-•*]\s+/, '').trim().toLowerCase())
      .filter(Boolean);
    return {
      title,
      slug: n === 1 ? base : `${base}-${n}`,
      blurb: h.blurb?.trim() || undefined,
      image: h.image || undefined,
      videoUrl: url,
      embed: videoEmbed(url),
      terms: terms.length ? terms : [title.toLowerCase()],
    };
  });

/* Technique auto-linking: when a recipe's ingredients or method mention one
   of the how-to phrases ("medium dice", "fabricate a chicken"), the words
   become a link to that video — Wickie never links anything by hand.
   Longest phrases win, and each technique links at most once per list, so a
   recipe never turns into a sea of links. */
export type TextSegment = { text: string; href?: string; title?: string };

const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const techMatchers = howtos
  .flatMap((h) => h.terms.map((term) => ({ term, h })))
  .sort((a, b) => b.term.length - a.term.length);

export const linkTechniques = (
  parts: RecipePart[]
): (RecipePart & { segments: TextSegment[] })[] => {
  const used = new Set<string>();
  return parts.map((part) => {
    if (part.kind !== 'item' || techMatchers.length === 0) {
      return { ...part, segments: [{ text: part.text }] };
    }
    const found: { start: number; end: number; h: HowTo }[] = [];
    for (const { term, h } of techMatchers) {
      if (used.has(h.slug)) continue;
      const m = new RegExp(`(?<![\\w])${escapeRx(term)}(?![\\w])`, 'i').exec(part.text);
      if (!m) continue;
      const start = m.index;
      const end = start + m[0].length;
      if (found.some((f) => start < f.end && end > f.start)) continue; // overlap → longer phrase already won
      found.push({ start, end, h });
      used.add(h.slug);
    }
    if (!found.length) return { ...part, segments: [{ text: part.text }] };
    found.sort((a, b) => a.start - b.start);
    const segments: TextSegment[] = [];
    let pos = 0;
    for (const f of found) {
      if (f.start > pos) segments.push({ text: part.text.slice(pos, f.start) });
      segments.push({
        text: part.text.slice(f.start, f.end),
        href: `/how-to#${f.h.slug}`,
        title: `Watch: how to ${f.h.title.toLowerCase()}`,
      });
      pos = f.end;
    }
    if (pos < part.text.length) segments.push({ text: part.text.slice(pos) });
    return { ...part, segments };
  });
};

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
