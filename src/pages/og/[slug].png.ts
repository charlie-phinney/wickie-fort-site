/*
  Per-recipe social share cards, generated at build time. Sharing a recipe
  link anywhere (iMessage, Instagram DMs, Slack, X) now shows a branded card
  with the recipe's own title + photo instead of the generic site og.png.
  Pure build-time work: satori lays the card out, resvg rasterizes it. No
  runtime cost, nothing for Wickie to maintain — new recipes get cards
  automatically.
*/
import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { recipes, site, type Recipe } from '../../data/site';

export function getStaticPaths() {
  return recipes
    .filter((r) => r.slug)
    .map((r) => ({ params: { slug: r.slug! }, props: { recipe: r } }));
}

// Brand tokens from global.css, converted to sRGB hex (satori can't parse oklch).
const BG = '#fdfaf4';
const INK = '#3c3029';
const BRICK = '#a3432b';
const MARIGOLD = '#e8b04c';
const TINT = '#f6e7d8';

const fontFile = (rel: string) =>
  readFileSync(join(process.cwd(), 'node_modules', rel));

// The image path comes from the CMS (same semi-trusted source as the shop
// embed), so confine reads to public/ — a pasted "../" path or a symlink
// pointing elsewhere yields the no-photo card instead of foreign bytes.
const photoDataUri = (image?: string): string => {
  if (!image) return '';
  const publicDir = resolve(process.cwd(), 'public');
  const candidate = resolve(publicDir, image.replace(/^\//, ''));
  if (!candidate.startsWith(publicDir + '/')) return '';
  let real: string;
  try {
    real = realpathSync(candidate);
  } catch {
    return ''; // missing file → monogram fallback
  }
  if (!real.startsWith(realpathSync(publicDir) + '/')) return '';
  const ext = real.toLowerCase().split('.').pop();
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${readFileSync(real).toString('base64')}`;
};

// satori element helper (no JSX in .ts endpoints)
const el = (type: string, style: Record<string, unknown>, children?: unknown, extra?: Record<string, unknown>) => ({
  type,
  props: { style, ...(extra || {}), ...(children !== undefined ? { children } : {}) },
});

export const GET: APIRoute = async ({ props }) => {
  const recipe = props.recipe as Recipe;
  const photo = photoDataUri(recipe.image);
  // Long titles get a smaller size so they never crowd the card.
  const titleSize = recipe.title.length > 34 ? 56 : 68;

  const left = el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      flex: 1,
      padding: '64px 56px 64px 72px',
    },
    [
      recipe.tag
        ? el(
            'div',
            {
              display: 'flex',
              alignSelf: 'flex-start',
              fontFamily: 'Inter',
              fontSize: 22,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: BRICK,
              backgroundColor: TINT,
              padding: '8px 20px',
              borderRadius: 999,
              marginBottom: 28,
            },
            recipe.tag
          )
        : null,
      el(
        'div',
        {
          display: 'flex',
          fontFamily: 'Fraunces',
          fontSize: titleSize,
          lineHeight: 1.04,
          color: INK,
          letterSpacing: -1,
        },
        recipe.title
      ),
      el('div', {
        display: 'flex',
        width: 130,
        height: 12,
        backgroundColor: MARIGOLD,
        borderRadius: 6,
        marginTop: 30,
      }),
      el(
        'div',
        {
          display: 'flex',
          marginTop: 34,
          fontFamily: 'Inter',
          fontSize: 27,
          color: BRICK,
        },
        `${site.brand} · ${site.domain}`
      ),
    ].filter(Boolean)
  );

  const right = photo
    ? el(
        'img',
        { width: 460, height: 630, objectFit: 'cover' },
        undefined,
        { src: photo }
      )
    : el(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          width: 460,
          height: 630,
          backgroundColor: TINT,
          alignItems: 'center',
          justifyContent: 'center',
        },
        [
          el(
            'div',
            { display: 'flex', fontFamily: 'Fraunces', fontSize: 200, color: BRICK, lineHeight: 1 },
            'W'
          ),
          el('div', {
            display: 'flex',
            width: 110,
            height: 12,
            backgroundColor: MARIGOLD,
            borderRadius: 6,
            marginTop: 8,
          }),
        ]
      );

  const svg = await satori(
    el('div', { display: 'flex', width: 1200, height: 630, backgroundColor: BG }, [left, right]) as never,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Fraunces', data: fontFile('@fontsource/fraunces/files/fraunces-latin-600-normal.woff'), weight: 600, style: 'normal' },
        { name: 'Inter', data: fontFile('@fontsource/inter/files/inter-latin-400-normal.woff'), weight: 400, style: 'normal' },
      ],
    }
  );

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
