/* ==================================================================== */
/*  WICKIE'S KITCHEN — SITE CONTENT (reads from site.json)               */
/*  Wickie edits the content through the TinaCMS editor (see /admin),    */
/*  which saves to `site.json` in this folder. You can also edit that    */
/*  JSON file directly. This file just shapes that data for the site —   */
/*  you normally don't need to touch it.                                 */
/* ==================================================================== */
import data from './site.json';
import statsData from './stats.json';

/* Media-kit numbers for the "By the numbers" band.
   - Follower counts auto-refresh daily (src/data/stats.json, refresh-stats Action).
   - "Videos over 1M" and "most-viewed video" are set by hand in /admin: they span
     Instagram + TikTok + YouTube, which can't be tallied automatically for free, so
     they live in site.json where Wickie keeps them accurate. */
const kFollowers = (n: number) => `${Math.floor(n / 1000)}K+`;

export const stats = {
  totalFollowers: kFollowers(statsData.totalFollowers),
  videosOver1M: String(data.statVideosOver1M ?? ''),
  topViews: data.statTopViews || '',
  updated: statsData.updated,
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
  paragraphs: data.aboutParagraphs.map((p) => p.text),
};

export type Recipe = {
  title: string;
  blurb: string;
  tag?: string;
  image?: string;
  href?: string; // where the card links: its on-site recipe page, or an external URL override
  slug?: string; // on-site detail-page slug (absent only when the card links out externally)
  ingredients: string[];
  steps: string[];
  serves?: string;
  time?: string;
};

// The full-recipe fields (ingredients/steps/serves/time) are filled in later
// through the /admin editor — a recipe starts as a title + blurb and gains its
// method when Wickie writes it up.
type RawRecipe = {
  title: string;
  blurb: string;
  tag?: string;
  image?: string;
  href?: string;
  slug?: string;
  serves?: string;
  time?: string;
  ingredients?: { text: string }[];
  steps?: { text: string }[];
};

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
    title: r.title,
    blurb: r.blurb,
    tag: r.tag || undefined,
    image: r.image || undefined,
    ingredients: (r.ingredients || []).map((i) => i.text).filter(Boolean),
    steps: (r.steps || []).map((s) => s.text).filter(Boolean),
    serves: r.serves || undefined,
    time: r.time || undefined,
    slug,
    href: external || `/recipes/${slug}`,
  };
});

export const workWithMe = {
  heading: data.workHeading,
  intro: data.workIntro,
  cta: data.workCta,
  offerings: data.workOfferings.map((o) => o.text),
};

// Shop section. `embed` is the iframe HTML Wickie pastes from ShopMy
// (collection → Settings & Sharing → Embeddable Components). Until it's set,
// the section shows a button linking out to her ShopMy shop instead.
export const shop = {
  heading: (data as { shopHeading?: string }).shopHeading || 'Shop my kitchen',
  intro: (data as { shopIntro?: string }).shopIntro || '',
  embed: (data as { shopEmbed?: string }).shopEmbed || '',
  url: data.socials.find((s) => /shopmy/i.test(s.label))?.href || '',
};

/* Navigation anchors — structural, kept in code (not editable in the CMS
   so the on-page links can't break). */
export const nav = [
  { label: 'About', href: '#about' },
  { label: 'Recipes', href: '#recipes' },
  { label: 'Work With Me', href: '#work' },
  { label: 'Contact', href: '#contact' },
];
