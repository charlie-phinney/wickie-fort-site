# Wickie's Kitchen — wickiefort.com

The personal brand + creator website for **Wickie Fort / Wickie's Kitchen**.
Static, fast, mobile-first. Built with [Astro](https://astro.build) + Tailwind CSS,
with a friendly visual editor ([TinaCMS](https://tina.io)). No paid services —
free to host forever.

---

## The one thing most people need: edit your content

**You do not need to touch any code to update the site.** Go to:

```
https://wickiefort.com/admin
```

Log in, and you get a friendly editor for everything on the page — your tagline,
your About story, each recipe (title, blurb, ingredients, steps), your Work With
Me offerings, your email, and your social links. Click **Save** and the site
rebuilds and updates itself in about a minute. Photos upload right there too.

That's it for day-to-day use. The rest of this file is for developers.

---

## Run it on your computer (developers)

You need [Node.js](https://nodejs.org) (version 18 or newer) installed once.

```bash
npm install       # first time only
npm run dev       # local preview at http://localhost:4321
```

To also run the CMS locally: `npm run cms`. Stop either with `Ctrl + C`.

---

## Where things live

- **Content** is stored in `src/data/site.json`. The `/admin` editor writes to
  this file; you can also hand-edit it. `src/data/site.ts` just shapes that JSON
  for the components — you rarely touch it.
- **Editor schema** (the fields + help text shown in `/admin`) is `tina/config.ts`.
- **Live follower stats** are in `src/data/stats.json`, refreshed automatically by
  a GitHub Action (see below) — don't edit by hand.
- **Colors & fonts:** the color roles at the top of `src/styles/global.css`
  (`--bg`, `--ink`, `--primary`, …) re-skin the whole site. Fonts (Fraunces +
  Inter + Caveat) load in `src/layouts/Base.astro`.

### Adding photos

Upload them through `/admin` (they commit into `public/images/`), or drop files
into `public/images/` and set the item's image path in `/admin`. Any image left
empty just shows a tasteful on-brand placeholder — nothing breaks.

---

## How it deploys (GitHub Pages)

Hosting is **free on GitHub Pages**. Squarespace is the **domain registrar / DNS
only** — it does not host the site.

- Repo: `charlie-phinney/wickie-fort-site` (personal GitHub, public).
- **`.github/workflows/deploy.yml`** builds the site and publishes it to GitHub
  Pages on every push to `main` (and via manual dispatch). Takes ~1 minute.
- The custom domain is set by **`public/CNAME`** (`wickiefort.com`). DNS in
  Squarespace points the root at GitHub Pages (4× `A` records to
  `185.199.108–111.153`) and `www` via `CNAME` to `charlie-phinney.github.io`.
- **Google Workspace email** (`wickie@wickiefort.com`) is separate — its MX
  records are untouched by any of the above.

Contributing changes: branch → PR → merge (a hook blocks committing straight to
`main`). Merging to `main` triggers the deploy.

---

## Automatic follower stats

- **`.github/workflows/refresh-stats.yml`** runs daily (and on demand), executes
  `scripts/fetch-stats.mjs`, and writes the latest Instagram / TikTok / YouTube /
  Facebook follower counts into `src/data/stats.json`. Any platform that fails a
  fetch keeps its last-good value, so the "By the numbers" band never shows 0.
- Instagram uses the official Graph API (token in the `IG_TOKEN` secret).
  **`.github/workflows/refresh-ig-token.yml`** refreshes that token weekly so it
  never expires — zero maintenance.
- The two hand-kept media-kit numbers ("videos over 1M" and "most-viewed video")
  span multiple platforms and can't be tallied for free, so they're set in
  `/admin` (`statVideosOver1M` / `statTopViews`), not auto-computed.

---

## Also included

- **Social share card** (`public/og.png`) shown when the site is linked anywhere;
  regenerate with `node scripts/make-og.mjs` if the wordmark changes.
- **SEO:** `sitemap.xml`, `robots.txt`, and JSON-LD structured data
  (Person / WebSite on the homepage, Recipe + Breadcrumb on recipe pages).
- **Recipe pages** at `/recipes/<slug>` with a print-friendly view.
- A branded **404** page.

---

## Project structure

```
wickie-fort-site/
├── public/
│   ├── favicon.svg / apple-touch-icon.png / og.png / site.webmanifest
│   ├── CNAME                 # custom domain for GitHub Pages
│   ├── robots.txt
│   └── images/               # photos (uploaded via /admin)
├── scripts/
│   └── fetch-stats.mjs       # daily follower refresh (+ make-og.mjs for the share card)
├── src/
│   ├── data/site.json        # ★ all editable content (via /admin)
│   ├── data/site.ts          # shapes site.json for the components
│   ├── data/stats.json       # auto-refreshed follower counts
│   ├── styles/global.css     # colors, fonts, base styles
│   ├── layouts/Base.astro    # <head>, fonts, SEO + social tags
│   ├── components/           # Nav, Footer, RecipeCard, Media
│   └── pages/
│       ├── index.astro       # the homepage
│       ├── 404.astro
│       ├── sitemap.xml.ts
│       └── recipes/[slug].astro
├── tina/config.ts            # the /admin editor schema
├── .github/workflows/        # deploy + stats + token refresh
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```
