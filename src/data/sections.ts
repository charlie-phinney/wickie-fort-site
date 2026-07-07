/* ==================================================================== */
/*  WICKIE'S KITCHEN — SECTION ORDER & VISIBILITY                        */
/*                                                                       */
/*  Wickie drags her homepage sections into any order and toggles each   */
/*  on/off from /admin (see the "Sections" control in tina/config.ts).   */
/*  The hero always stays pinned at the very top — everything else is    */
/*  hers to arrange.                                                     */
/*                                                                       */
/*  This resolver is deliberately bullet-proof: her order wins for the   */
/*  sections she's arranged, any she hasn't touched are appended in the  */
/*  default order (so a section can never go missing), and anything      */
/*  unknown or blank is ignored. She cannot break the page with it.      */
/* ==================================================================== */
import data from './site.json';

// The re-orderable sections, in default order, each with its nav-menu label
// (null = no menu link). The top menu is generated from this + what's visible,
// so hiding a section also removes its menu link — no dead links.
// How-To is public from day one (Charlie, 7/6): before Wickie's first video
// it shows its "coming soon" state instead of hiding.
export const sectionMeta: { id: string; nav: string | null; href: string | null }[] = [
  { id: 'stats', nav: null, href: null },
  { id: 'about', nav: 'About', href: '#about' },
  { id: 'work', nav: 'Work With Me', href: '#work' },
  { id: 'shop', nav: 'Shop', href: '#shop' },
  { id: 'philosophy', nav: null, href: null },
  { id: 'recipes', nav: 'Recipes', href: '#recipes' },
  { id: 'howto', nav: 'How To', href: '/how-to' },
  { id: 'contact', nav: 'Contact', href: '#contact' },
];

const KNOWN = sectionMeta.map((s) => s.id);
const raw: unknown = (data as { sections?: unknown }).sections;
const list = Array.isArray(raw) ? (raw as { id?: string; show?: boolean }[]) : [];

const seen = new Set<string>();
const resolved: { id: string; show: boolean }[] = [];
for (const item of list) {
  const id = item?.id ?? '';
  if (KNOWN.includes(id) && !seen.has(id)) {
    seen.add(id);
    resolved.push({ id, show: item.show !== false });
  }
}
for (const id of KNOWN) {
  if (!seen.has(id)) resolved.push({ id, show: true });
}

export const orderedSections = resolved;

// hero is 0; the re-orderable sections get 1..N in Wickie's chosen order,
// used as the CSS `order` on the flex column so they visually rearrange.
const orderPos = new Map(resolved.map((s, i) => [s.id, i + 1]));
const showMap = new Map(resolved.map((s) => [s.id, s.show]));

export const isVisible = (id: string): boolean =>
  KNOWN.includes(id) ? showMap.get(id) === true : true; // hero / unknown → shown
export const orderIndex = (id: string): number => orderPos.get(id) ?? 99;

// Menu links for the sections that are both visible and have a label, in order.
export const navItems = resolved
  .filter((s) => s.show)
  .map((s) => sectionMeta.find((m) => m.id === s.id))
  .filter((m): m is { id: string; nav: string; href: string } => !!m?.nav)
  .map((m) => ({ id: m.id, label: m.nav, href: m.href as string }));
