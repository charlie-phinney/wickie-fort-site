/* ==================================================================== */
/*  WICKIE'S KITCHEN — SITE CONTENT (reads from site.json)               */
/*  Wickie edits the content through the TinaCMS editor (see /admin),    */
/*  which saves to `site.json` in this folder. You can also edit that    */
/*  JSON file directly. This file just shapes that data for the site —   */
/*  you normally don't need to touch it.                                 */
/* ==================================================================== */
import data from './site.json';
import statsData from './stats.json';

/* Live media-kit numbers, refreshed daily by the refresh-stats GitHub
   Action (src/data/stats.json). Formatted here for display. */
const kFollowers = (n: number) => `${Math.floor(n / 1000)}K+`;
const mViews = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n);

export const stats = {
  totalFollowers: kFollowers(statsData.totalFollowers),
  viralOver1M: `${statsData.viralOver1M}+`,
  topVideoViews: mViews(statsData.topVideoViews),
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

export const emails = {
  general: data.emailGeneral,
  partnerships: data.emailPartnerships,
  contact: data.emailContact,
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
  href?: string;
};

export const recipes: Recipe[] = data.recipes.map((r) => ({
  title: r.title,
  blurb: r.blurb,
  tag: r.tag || undefined,
  image: r.image || undefined,
  href: r.href || undefined,
}));

export const workWithMe = {
  heading: data.workHeading,
  intro: data.workIntro,
  cta: data.workCta,
  offerings: data.workOfferings.map((o) => o.text),
};

/* Navigation anchors — structural, kept in code (not editable in the CMS
   so the on-page links can't break). */
export const nav = [
  { label: 'About', href: '#about' },
  { label: 'Recipes', href: '#recipes' },
  { label: 'Work With Me', href: '#work' },
  { label: 'Contact', href: '#contact' },
];
