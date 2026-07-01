/* ==================================================================== */
/*  WICKIE'S KITCHEN — SITE CONTENT                                      */
/*  This is the only file you need to edit to change the site's words,   */
/*  recipes, links, and emails. No coding required — just edit the text  */
/*  inside the quotes. Save, and the site updates.                       */
/* ==================================================================== */

export const site = {
  name: 'Wickie Fort',
  brand: "Wickie's Kitchen",
  domain: 'wickiefort.com',

  /* Pick ONE tagline for the hero (or write your own). */
  tagline: 'Simple, cozy recipes from Wickie’s Kitchen.',
  /* Other options — swap into `tagline` above if you prefer:
     'Recipes, home cooking, and kitchen favorites.'
     'Home cooking, everyday recipes, and kitchen favorites.' */

  heroKicker: 'Home cooking · recipes · lifestyle',
  heroSub:
    'Everyday recipes and kitchen favorites made to feel warm, doable, and a little bit special.',
};

/* --- Emails --------------------------------------------------------- */
export const emails = {
  general: 'hello@wickiefort.com',
  partnerships: 'collabs@wickiefort.com',
  contact: 'contact@wickiefort.com',
};

/* --- Social links --------------------------------------------------- */
/*  REPLACE the `href` values with Wickie's real profile URLs.           */
/*  Set `href` to '' to hide a platform.                                 */
export const socials = [
  { label: 'Instagram', handle: '@wickieskitchen', href: 'https://www.instagram.com/wickieskitchen' },
  { label: 'TikTok', handle: '@wickieskitchen', href: 'https://www.tiktok.com/@wickieskitchen' },
  { label: 'YouTube', handle: '@wickieskitchen', href: 'https://youtube.com/@wickieskitchen' },
  { label: 'Facebook', handle: 'Wickie’s Kitchen', href: 'https://www.facebook.com/share/1bbQG6mRhh/' },
  { label: 'ShopMy', handle: 'Shop my kitchen', href: 'https://shopmy.us/shop/wickiefort' },
];

/* --- About ---------------------------------------------------------- */
export const about = {
  heading: 'Hi, I’m Wickie.',
  /* Keep it warm and real. Edit freely — a few short paragraphs is plenty. */
  paragraphs: [
    'Wickie’s Kitchen started the way most good things do: with people I love, gathered around a table, asking for the recipe.',
    'I cook the kind of food that fits into a real week — unfussy, comforting, and worth making twice. Think slow weekend bakes, fast weeknight dinners, and the little kitchen habits that make everyday cooking feel good.',
    'This is where I share those recipes and the home-and-lifestyle bits in between. Pull up a chair.',
  ],
};

/* --- Recipes / Featured content ------------------------------------- */
/*  Add, remove, or reorder cards freely. Each needs a title + blurb.    */
/*  `image` is optional: point it at a file in /public/images once you    */
/*  have photos (e.g. image: '/images/banana-bread.jpg'). Leave it out    */
/*  and a warm placeholder shows instead.                                 */
export type Recipe = {
  title: string;
  blurb: string;
  tag?: string;
  image?: string;
  href?: string;
};

export const recipes: Recipe[] = [
  {
    title: 'Brown Butter Banana Bread',
    blurb: 'Deeply cozy, one bowl, and better on day two. The loaf everyone asks for.',
    tag: 'Baking',
  },
  {
    title: 'Weeknight Lemon Orzo',
    blurb: 'Bright, buttery, and on the table in 20 minutes. A back-pocket dinner.',
    tag: 'Weeknight',
  },
  {
    title: 'Tomato Soup & Crispy Grilled Cheese',
    blurb: 'The comfort classic, done right — silky soup and a proper golden crust.',
    tag: 'Comfort',
  },
  {
    title: 'Honey Garlic Salmon',
    blurb: 'Sticky, sweet, and roasted on one pan. Weeknight-easy, dinner-party-good.',
    tag: 'Dinner',
  },
  {
    title: 'Maple Cinnamon Granola',
    blurb: 'Clustery, warmly spiced, and made for slow mornings and gifting in jars.',
    tag: 'Breakfast',
  },
  {
    title: 'One-Pan Herb Roast Chicken',
    blurb: 'Crisp skin, jammy vegetables, and a whole meal from a single pan.',
    tag: 'Sunday',
  },
];

/* --- Work With Me --------------------------------------------------- */
export const workWithMe = {
  heading: 'Work with me',
  intro:
    'I partner with brands I genuinely love to create warm, appetizing content that feels at home in Wickie’s Kitchen — not like an ad. If your product belongs in a real kitchen, let’s talk.',
  offerings: [
    'Sponsored recipe & content',
    'Brand partnerships',
    'Product features',
    'Recipe development',
    'Short-form video content',
    'UGC-style assets',
  ],
  cta: 'Start a partnership',
};

/* --- Navigation (anchors on the single page) ------------------------ */
export const nav = [
  { label: 'About', href: '#about' },
  { label: 'Recipes', href: '#recipes' },
  { label: 'Work With Me', href: '#work' },
  { label: 'Contact', href: '#contact' },
];
