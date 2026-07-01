/* ==================================================================== */
/*  WICKIE'S KITCHEN — THEME PRESETS (the "Look & Feel" controls)        */
/*                                                                       */
/*  Wickie picks a palette, a font pairing, and a text size in /admin.   */
/*  Every option here is a hand-tuned, contrast-checked preset, so any   */
/*  choice she makes still looks good and stays readable — she can       */
/*  re-skin the whole site without being able to break it.               */
/*                                                                       */
/*  Base.astro turns her choices into the CSS variables + font links     */
/*  that global.css / tailwind already read. To add a new option, add    */
/*  an entry here; nothing else needs to change (the /admin dropdowns    */
/*  are generated from these lists — see themeOptions at the bottom).    */
/* ==================================================================== */
import data from './site.json';

/* ------------------------------- palettes ------------------------------ */
/* Every palette fills the same 10 colour roles. Lightness/chroma stay
   near the proven default so contrast (text vs background) holds on all
   of them; only the hues really move. OKLCH throughout. */
type Palette = Record<
  | 'bg' | 'surface' | 'ink' | 'muted'
  | 'primary' | 'primary-deep' | 'primary-tint'
  | 'pop' | 'pop-deep' | 'line',
  string
>;

export const palettes: Record<string, { label: string; colors: Palette }> = {
  tomato: {
    label: 'Tomato & Marigold (warm, punchy)',
    colors: {
      bg: 'oklch(0.991 0.006 78)', surface: 'oklch(0.958 0.022 52)',
      ink: 'oklch(0.24 0.028 44)', muted: 'oklch(0.44 0.03 42)',
      primary: 'oklch(0.605 0.185 33)', 'primary-deep': 'oklch(0.50 0.165 31)',
      'primary-tint': 'oklch(0.93 0.045 45)', pop: 'oklch(0.80 0.135 78)',
      'pop-deep': 'oklch(0.60 0.12 70)', line: 'oklch(0.89 0.016 58)',
    },
  },
  berry: {
    label: 'Berry & Rose (bright, playful)',
    colors: {
      bg: 'oklch(0.991 0.006 20)', surface: 'oklch(0.955 0.022 12)',
      ink: 'oklch(0.24 0.03 18)', muted: 'oklch(0.44 0.035 16)',
      primary: 'oklch(0.575 0.175 8)', 'primary-deep': 'oklch(0.48 0.155 6)',
      'primary-tint': 'oklch(0.93 0.045 12)', pop: 'oklch(0.82 0.10 350)',
      'pop-deep': 'oklch(0.60 0.12 356)', line: 'oklch(0.89 0.016 16)',
    },
  },
  olive: {
    label: 'Olive & Honey (earthy, calm)',
    colors: {
      bg: 'oklch(0.99 0.007 120)', surface: 'oklch(0.955 0.02 118)',
      ink: 'oklch(0.25 0.022 140)', muted: 'oklch(0.45 0.026 138)',
      primary: 'oklch(0.53 0.105 138)', 'primary-deep': 'oklch(0.45 0.095 138)',
      'primary-tint': 'oklch(0.93 0.04 128)', pop: 'oklch(0.80 0.13 84)',
      'pop-deep': 'oklch(0.585 0.11 80)', line: 'oklch(0.89 0.015 120)',
    },
  },
  cocoa: {
    label: 'Cocoa & Gold (cozy, refined)',
    colors: {
      bg: 'oklch(0.99 0.007 70)', surface: 'oklch(0.955 0.02 66)',
      ink: 'oklch(0.24 0.024 58)', muted: 'oklch(0.44 0.028 56)',
      primary: 'oklch(0.475 0.075 54)', 'primary-deep': 'oklch(0.40 0.065 52)',
      'primary-tint': 'oklch(0.92 0.032 58)', pop: 'oklch(0.78 0.125 82)',
      'pop-deep': 'oklch(0.575 0.105 78)', line: 'oklch(0.89 0.015 62)',
    },
  },
  ocean: {
    label: 'Ocean & Coral (fresh, coastal)',
    colors: {
      bg: 'oklch(0.991 0.006 220)', surface: 'oklch(0.955 0.02 225)',
      ink: 'oklch(0.24 0.03 240)', muted: 'oklch(0.44 0.035 238)',
      primary: 'oklch(0.55 0.12 242)', 'primary-deep': 'oklch(0.46 0.11 244)',
      'primary-tint': 'oklch(0.93 0.04 235)', pop: 'oklch(0.76 0.135 36)',
      'pop-deep': 'oklch(0.60 0.14 34)', line: 'oklch(0.89 0.016 228)',
    },
  },
  plum: {
    label: 'Plum & Peach (rich, romantic)',
    colors: {
      bg: 'oklch(0.99 0.006 330)', surface: 'oklch(0.955 0.02 328)',
      ink: 'oklch(0.24 0.028 320)', muted: 'oklch(0.44 0.03 322)',
      primary: 'oklch(0.52 0.155 330)', 'primary-deep': 'oklch(0.44 0.14 330)',
      'primary-tint': 'oklch(0.93 0.045 330)', pop: 'oklch(0.82 0.11 55)',
      'pop-deep': 'oklch(0.63 0.12 50)', line: 'oklch(0.89 0.016 328)',
    },
  },
  forest: {
    label: 'Forest & Gold (deep, grounded)',
    colors: {
      bg: 'oklch(0.99 0.007 140)', surface: 'oklch(0.955 0.018 145)',
      ink: 'oklch(0.24 0.02 150)', muted: 'oklch(0.44 0.024 150)',
      primary: 'oklch(0.49 0.10 152)', 'primary-deep': 'oklch(0.41 0.09 152)',
      'primary-tint': 'oklch(0.93 0.04 150)', pop: 'oklch(0.79 0.13 85)',
      'pop-deep': 'oklch(0.585 0.11 80)', line: 'oklch(0.89 0.015 145)',
    },
  },
  blush: {
    label: 'Blush & Clay (soft, pretty)',
    colors: {
      bg: 'oklch(0.992 0.006 30)', surface: 'oklch(0.96 0.018 28)',
      ink: 'oklch(0.25 0.026 30)', muted: 'oklch(0.45 0.03 28)',
      primary: 'oklch(0.60 0.135 22)', 'primary-deep': 'oklch(0.51 0.13 20)',
      'primary-tint': 'oklch(0.94 0.04 25)', pop: 'oklch(0.83 0.09 40)',
      'pop-deep': 'oklch(0.64 0.11 36)', line: 'oklch(0.90 0.015 28)',
    },
  },
  teal: {
    label: 'Teal & Coral (fresh, modern)',
    colors: {
      bg: 'oklch(0.99 0.006 200)', surface: 'oklch(0.955 0.02 200)',
      ink: 'oklch(0.24 0.026 210)', muted: 'oklch(0.44 0.03 208)',
      primary: 'oklch(0.51 0.09 200)', 'primary-deep': 'oklch(0.43 0.08 200)',
      'primary-tint': 'oklch(0.93 0.04 198)', pop: 'oklch(0.75 0.135 34)',
      'pop-deep': 'oklch(0.60 0.14 32)', line: 'oklch(0.89 0.016 200)',
    },
  },
  wine: {
    label: 'Wine & Honey (bold, elegant)',
    colors: {
      bg: 'oklch(0.99 0.006 40)', surface: 'oklch(0.955 0.02 30)',
      ink: 'oklch(0.23 0.03 24)', muted: 'oklch(0.43 0.035 22)',
      primary: 'oklch(0.45 0.14 14)', 'primary-deep': 'oklch(0.38 0.13 12)',
      'primary-tint': 'oklch(0.92 0.045 18)', pop: 'oklch(0.80 0.13 78)',
      'pop-deep': 'oklch(0.60 0.12 72)', line: 'oklch(0.89 0.017 30)',
    },
  },
  lavender: {
    label: 'Lavender & Sage (gentle, dreamy)',
    colors: {
      bg: 'oklch(0.99 0.006 310)', surface: 'oklch(0.955 0.018 305)',
      ink: 'oklch(0.24 0.024 300)', muted: 'oklch(0.44 0.028 300)',
      primary: 'oklch(0.52 0.135 305)', 'primary-deep': 'oklch(0.44 0.125 305)',
      'primary-tint': 'oklch(0.93 0.045 305)', pop: 'oklch(0.80 0.075 150)',
      'pop-deep': 'oklch(0.60 0.08 152)', line: 'oklch(0.89 0.016 305)',
    },
  },
  slate: {
    label: 'Slate & Amber (calm, classic)',
    colors: {
      bg: 'oklch(0.99 0.005 250)', surface: 'oklch(0.955 0.014 250)',
      ink: 'oklch(0.23 0.024 258)', muted: 'oklch(0.43 0.026 255)',
      primary: 'oklch(0.49 0.075 255)', 'primary-deep': 'oklch(0.41 0.07 255)',
      'primary-tint': 'oklch(0.93 0.03 252)', pop: 'oklch(0.79 0.125 72)',
      'pop-deep': 'oklch(0.60 0.11 68)', line: 'oklch(0.89 0.012 252)',
    },
  },
};

/* --------------------------- font pairings ----------------------------- */
/* Display/serif (headings) + body sans, paired on a contrast axis so they
   never clash. The handwritten accent (Caveat) stays constant — it's the
   site's signature. `googleFamilies` are the family params for the Google
   Fonts URL Base.astro builds. */
type FontPairing = {
  label: string;
  serif: string; // CSS font-family stack for headings
  sans: string; // CSS font-family stack for body
  googleFamilies: string[]; // Google Fonts `family=` values (display swap added in Base)
};

const INTER = 'Inter:wght@400;500;600;700';
const inter = "'Inter', system-ui, -apple-system, sans-serif";

export const fontPairings: Record<string, FontPairing> = {
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

/* ------------------------------ text size ------------------------------ */
/* A single global dial. The whole site is built in rem/clamp units, so
   nudging the root font-size scales every heading and paragraph together,
   proportionally — nothing overlaps or breaks. */
export const textSizes: Record<string, { label: string; rootPercent: number }> = {
  small: { label: 'Compact', rootPercent: 93.75 },
  medium: { label: 'Standard', rootPercent: 100 },
  large: { label: 'Large (easier to read)', rootPercent: 106.25 },
};

/* ------------------------ resolve the active theme --------------------- */
/* Reads Wickie's picks from site.json, falling back to the defaults if a
   value is blank or points at an option that no longer exists. */
const pick = <T>(map: Record<string, T>, key: unknown, fallback: string): T =>
  (typeof key === 'string' && map[key]) || map[fallback];

const d = data as {
  colorTheme?: string;
  fontPairing?: string;
  textSize?: string;
};

const activePalette = pick(palettes, d.colorTheme, 'tomato');
const activeFonts = pick(fontPairings, d.fontPairing, 'fraunces');
const activeSize = pick(textSizes, d.textSize, 'medium');

export const theme = {
  colors: activePalette.colors,
  fonts: activeFonts,
  rootPercent: activeSize.rootPercent,
};

/* The option lists, shaped for the TinaCMS dropdowns in tina/config.ts. */
export const themeOptions = {
  colorTheme: Object.entries(palettes).map(([value, p]) => ({ value, label: p.label })),
  fontPairing: Object.entries(fontPairings).map(([value, f]) => ({ value, label: f.label })),
  textSize: Object.entries(textSizes).map(([value, s]) => ({ value, label: s.label })),
};
