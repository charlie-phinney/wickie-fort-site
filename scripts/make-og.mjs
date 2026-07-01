/*
  Generates the site's static social-share image (public/og.png, 1200x630) and
  the iOS home-screen icon (public/apple-touch-icon.png, 180x180).

  These are rendered ONCE, locally, and committed as PNGs — CI does not run this
  and does not depend on it. Re-run only if the brand/wordmark changes:

      node scripts/make-og.mjs      (needs `sharp`, already in node_modules)

  Design matches the site tokens: committed tomato/brick field, cream Fraunces-
  style serif (Georgia fallback, since Fraunces isn't a system font), a marigold
  underline + dot, and the domain. No em dashes anywhere on the site.
*/
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '..', 'public');

// Brand palette (hex approximations of the OKLCH tokens in src/styles/global.css)
const TOMATO = '#c0533a'; // primary / theme-color
const BRICK = '#9f3f28'; // primary-deep
const CREAM = '#fdf7f2'; // bg
const MARIGOLD = '#e8b24e'; // pop
const INK = '#38251d';

const SERIF = "Georgia, 'Times New Roman', 'Fraunces', serif";
const SANS = "'Helvetica Neue', Arial, sans-serif";

/* ------------------------------- OG card ------------------------------- */
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="field" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${TOMATO}"/>
      <stop offset="1" stop-color="${BRICK}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${MARIGOLD}" stop-opacity="0.9"/>
      <stop offset="1" stop-color="${MARIGOLD}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#field)"/>

  <!-- soft marigold plate motif, top-right, purely decorative -->
  <circle cx="1050" cy="150" r="360" fill="url(#glow)" opacity="0.55"/>
  <circle cx="1010" cy="205" r="150" fill="none" stroke="${CREAM}" stroke-opacity="0.22" stroke-width="2"/>
  <circle cx="1010" cy="205" r="118" fill="none" stroke="${CREAM}" stroke-opacity="0.30" stroke-width="2"/>

  <!-- content -->
  <g transform="translate(90, 118)">
    <text x="0" y="0" font-family="${SANS}" font-size="26" letter-spacing="7"
          font-weight="700" fill="${MARIGOLD}">WICKIE'S KITCHEN</text>

    <text x="-4" y="118" font-family="${SERIF}" font-size="104" font-weight="700"
          fill="${CREAM}">From corporate</text>
    <text x="-4" y="228" font-family="${SERIF}" font-size="104" font-weight="700"
          fill="${CREAM}">to culinary.</text>
    <!-- marigold underline stroke under "culinary" -->
    <rect x="-2" y="244" width="452" height="14" rx="7" fill="${MARIGOLD}"/>

    <text x="0" y="330" font-family="${SANS}" font-size="34" fill="${CREAM}" fill-opacity="0.92">
      Simple, real food, made in New York.
    </text>
  </g>

  <!-- domain chip, bottom-left -->
  <g transform="translate(90, 548)">
    <circle cx="9" cy="-8" r="9" fill="${MARIGOLD}"/>
    <text x="30" y="0" font-family="${SANS}" font-size="30" font-weight="600"
          fill="${CREAM}">wickiefort.com</text>
  </g>
</svg>`;

/* --------------------------- apple-touch-icon --------------------------- */
// A rounded tomato tile with a cream serif "W" — matches favicon.svg, sized for iOS.
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="40" fill="${TOMATO}"/>
  <text x="50%" y="53%" dominant-baseline="central" text-anchor="middle"
        font-family="${SERIF}" font-size="110" font-weight="700" fill="${CREAM}">W</text>
</svg>`;

await sharp(Buffer.from(og)).png().toFile(join(pub, 'og.png'));
await sharp(Buffer.from(icon)).png().toFile(join(pub, 'apple-touch-icon.png'));

console.log('Wrote public/og.png (1200x630) and public/apple-touch-icon.png (180x180)');
