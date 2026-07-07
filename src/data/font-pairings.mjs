/* ==================================================================== */
/*  FONT PAIRINGS — shared between the site theme (src/data/theme.ts)    */
/*  and the build-time font vendorer (scripts/vendor-fonts.mjs).         */
/*                                                                       */
/*  Plain .mjs so the vendoring script can import it under Node without  */
/*  a TypeScript loader. Display/serif (headings) + body sans, paired    */
/*  on a contrast axis so they never clash. The handwritten accent       */
/*  (Caveat) stays constant — it's the site's signature. `googleFamilies`*/
/*  are the `family=` params for the Google Fonts css2 URL.              */
/* ==================================================================== */

const INTER = 'Inter:wght@400;500;600;700';
const inter = "'Inter', system-ui, -apple-system, sans-serif";

export const fontPairings = {
  fraunces: {
    label: 'Fraunces + Inter (warm editorial)',
    serif: "'Fraunces', Georgia, serif", sans: inter,
    googleFamilies: ['Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700', INTER],
  },
  playfair: {
    label: 'Playfair + Inter (classic, elegant)',
    serif: "'Playfair Display', Georgia, serif", sans: inter,
    googleFamilies: ['Playfair+Display:wght@500;600;700;800', INTER],
  },
  dmserif: {
    label: 'DM Serif + DM Sans (modern, clean)',
    serif: "'DM Serif Display', Georgia, serif", sans: "'DM Sans', system-ui, sans-serif",
    googleFamilies: ['DM+Serif+Display:ital@0;1', 'DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700'],
  },
  cormorant: {
    label: 'Cormorant + Nunito Sans (soft, refined)',
    serif: "'Cormorant Garamond', Georgia, serif", sans: "'Nunito Sans', system-ui, sans-serif",
    googleFamilies: ['Cormorant+Garamond:wght@500;600;700', 'Nunito+Sans:opsz,wght@6..12,400;6..12,500;6..12,600;6..12,700'],
  },
  lora: {
    label: 'Lora + Inter (readable, warm)',
    serif: "'Lora', Georgia, serif", sans: inter,
    googleFamilies: ['Lora:wght@500;600;700', INTER],
  },
  libre: {
    label: 'Libre Baskerville + Work Sans (bookish)',
    serif: "'Libre Baskerville', Georgia, serif", sans: "'Work Sans', system-ui, sans-serif",
    googleFamilies: ['Libre+Baskerville:wght@400;700', 'Work+Sans:wght@400;500;600;700'],
  },
  eb: {
    label: 'EB Garamond + Montserrat (timeless)',
    serif: "'EB Garamond', Georgia, serif", sans: "'Montserrat', system-ui, sans-serif",
    googleFamilies: ['EB+Garamond:wght@500;600;700', 'Montserrat:wght@400;500;600;700'],
  },
  crimson: {
    label: 'Crimson Pro + Inter (literary)',
    serif: "'Crimson Pro', Georgia, serif", sans: inter,
    googleFamilies: ['Crimson+Pro:wght@500;600;700', INTER],
  },
  spectral: {
    label: 'Spectral + Karla (calm, editorial)',
    serif: "'Spectral', Georgia, serif", sans: "'Karla', system-ui, sans-serif",
    googleFamilies: ['Spectral:wght@500;600;700', 'Karla:wght@400;500;600;700'],
  },
  bitter: {
    label: 'Bitter + Source Sans (sturdy, friendly)',
    serif: "'Bitter', Georgia, serif", sans: "'Source Sans 3', system-ui, sans-serif",
    googleFamilies: ['Bitter:wght@500;600;700', 'Source+Sans+3:wght@400;500;600;700'],
  },
  marcellus: {
    label: 'Marcellus + Nunito Sans (graceful)',
    serif: "'Marcellus', Georgia, serif", sans: "'Nunito Sans', system-ui, sans-serif",
    googleFamilies: ['Marcellus', 'Nunito+Sans:opsz,wght@6..12,400;6..12,500;6..12,600;6..12,700'],
  },
  abril: {
    label: 'Abril Fatface + Poppins (bold, magazine)',
    serif: "'Abril Fatface', Georgia, serif", sans: "'Poppins', system-ui, sans-serif",
    googleFamilies: ['Abril+Fatface', 'Poppins:wght@400;500;600;700'],
  },
  yeseva: {
    label: 'Yeseva One + Nunito Sans (pretty display)',
    serif: "'Yeseva One', Georgia, serif", sans: "'Nunito Sans', system-ui, sans-serif",
    googleFamilies: ['Yeseva+One', 'Nunito+Sans:opsz,wght@6..12,400;6..12,500;6..12,600;6..12,700'],
  },
  outfit: {
    label: 'Outfit (clean, minimal)',
    serif: "'Outfit', system-ui, sans-serif", sans: "'Outfit', system-ui, sans-serif",
    googleFamilies: ['Outfit:wght@400;500;600;700;800'],
  },
  space: {
    label: 'Space Grotesk + Inter (techy, modern)',
    serif: "'Space Grotesk', system-ui, sans-serif", sans: inter,
    googleFamilies: ['Space+Grotesk:wght@500;600;700', INTER],
  },
};

/* The css2 stylesheet URL for a pairing — the single definition used by
   both the vendorer (to download) and Base.astro (as the CDN fallback when
   no vendored fonts exist yet). Caveat rides along on every pairing. */
export const googleCssUrl = (pairing) =>
  `https://fonts.googleapis.com/css2?${pairing.googleFamilies
    .map((f) => `family=${f}`)
    .join('&')}&family=Caveat:wght@600;700&display=swap`;
