# Wickie's Kitchen — wickiefort.com

The personal brand + creator website for **Wickie Fort / Wickie's Kitchen**.
Static, fast, mobile-first. Built with [Astro](https://astro.build) + Tailwind CSS.
No backend, no database, no logins, no paid services — free to host forever.

---

## 1. Run it on your computer

You need [Node.js](https://nodejs.org) (version 18 or newer) installed once.

```bash
# from inside this folder
npm install      # first time only — downloads what the site needs
npm run dev      # starts a local preview
```

Then open the link it prints (usually **http://localhost:4321**) in your browser.
Leave it running while you edit — the page updates automatically as you save.

To stop it, press `Ctrl + C` in the terminal.

---

## 2. Edit the words & content

**Almost everything you'll want to change lives in one file:**

```
src/data/site.ts
```

Open it in any text editor. Change the text inside the quotes, save, and the
site updates. That single file controls:

- Your name, brand name, and **hero tagline** (3 tagline options are included — pick one)
- The **About** paragraphs
- The **Recipe cards** (add, remove, reorder — each has a title, blurb, and tag)
- The **Work With Me** intro and the list of offerings
- Your **email addresses**
- Your **social links** (Instagram, TikTok, YouTube, ShopMy)

You don't need to touch any other file to run the site day-to-day.

> **Heads up on social links:** the handles in `socials` are placeholders
> (`@wickiefort`). Replace each `href` with the real profile URL. Set an
> `href` to `''` (empty) to hide that platform.

---

## 3. Add real photos

The site ships with tasteful placeholders wherever a photo goes. To use real
images:

1. Put your photo files into the **`public/images/`** folder
   (create the folder if it isn't there). Use web-friendly `.jpg` or `.webp`
   files, ideally under ~500 KB each so the site stays fast.
2. Point to them:
   - **Recipe photos:** in `src/data/site.ts`, add an `image` line to a recipe, e.g.
     ```ts
     {
       title: 'Brown Butter Banana Bread',
       blurb: '...',
       tag: 'Baking',
       image: '/images/banana-bread.jpg',   // ← add this line
     },
     ```
   - **Hero photo & About photo:** these live in `src/pages/index.astro`.
     Find the `<Media ... />` tags labelled `Add hero photo` and
     `Add a photo of Wickie`, and add a `src="/images/your-photo.jpg"` to them.

Any `<Media>` without a photo just shows the placeholder — nothing breaks.

---

## 4. Change the look (colors & fonts)

- **Colors:** `src/styles/global.css` — the six color roles at the top (`--bg`,
  `--ink`, `--primary`, etc.). Edit those and the whole site re-skins.
- **Fonts:** loaded in `src/layouts/Base.astro` (Fraunces for headings, Inter
  for body). Both are free Google Fonts.

---

## 5. Deploy it for free (Cloudflare Pages)

This is a static site, so hosting is **free** on Cloudflare Pages. Squarespace
stays as your **domain registrar / DNS manager only** — it is *not* hosting the
website.

### Step A — Put the code on GitHub (its own repo)

Create a **brand-new, separate** GitHub repo just for this site (do not reuse
any other repo).

```bash
# from inside this folder
git init
git add .
git commit -m "Wickie's Kitchen site — initial build"
git branch -M main
# create an EMPTY repo on github.com first (e.g. "wickie-fort-site"), then:
git remote add origin https://github.com/<your-username>/wickie-fort-site.git
git push -u origin main
```

### Step B — Connect Cloudflare Pages to the repo

1. Go to **dash.cloudflare.com** → **Workers & Pages** → **Create** →
   **Pages** → **Connect to Git**.
2. Pick the `wickie-fort-site` repo.
3. Set the build settings:
   | Setting | Value |
   |---|---|
   | Framework preset | **Astro** |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
4. Click **Save and Deploy**. In ~1 minute you'll get a free
   `something.pages.dev` URL. Confirm the site looks right there.

Every time you `git push` to `main`, Cloudflare rebuilds and redeploys
automatically. Free.

### Step C — Add your custom domain

In the Pages project → **Custom domains** → **Set up a domain**, add **both**:

- `wickiefort.com`
- `www.wickiefort.com`

Cloudflare will then show you the **exact DNS records** to add.

### Step D — Point Squarespace DNS at Cloudflare

> ⚠️ **Use the exact records Cloudflare shows you.** Do not copy records from
> anywhere else (including this README) — Cloudflare generates the correct
> targets for your specific domain, and they can differ.

1. In **Squarespace** → your domain → **DNS settings**.
2. Add exactly the records Cloudflare's "Custom domains" screen lists
   (typically a `CNAME` for `www` and either an `A`/`CNAME` for the root
   `wickiefort.com`, whatever Cloudflare specifies).
3. Save, then wait for it to verify (minutes to a couple of hours).
   Cloudflare's Custom domains screen shows **Active** when it's live.

That's it — `https://wickiefort.com` now serves this site, for free.

### Note on email

Your **Google Workspace email** (`wickie@wickiefort.com` and the aliases) is
completely separate from the website and already working. **Do not delete or
change your existing MX / email DNS records in Squarespace** when adding the
website records above — only add the records Cloudflare asks for. Email keeps
working untouched.

---

## 6. Optional: free, privacy-friendly analytics

If you ever want visitor stats, **Cloudflare Web Analytics** is free, needs no
cookie banner, and turns on with one toggle inside the same Cloudflare
dashboard (Pages project → Analytics). Totally optional — the site works fine
without it.

---

## Project structure

```
wickie-fort-site/
├── public/
│   ├── favicon.svg          # the little "W" tab icon
│   └── images/              # ← drop your photos here
├── src/
│   ├── data/site.ts         # ★ EDIT THIS — all content lives here
│   ├── styles/global.css    # colors, fonts, base styles
│   ├── layouts/Base.astro   # <head>, fonts, SEO tags
│   ├── components/          # Nav, Footer, RecipeCard, Media
│   └── pages/index.astro    # the page itself (sections assembled)
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

---

## Deploy checklist

- [ ] `npm run dev` runs and the site looks right locally
- [ ] Mobile view looks good (resize the browser narrow, or open on your phone)
- [ ] All links work; social `href`s point to the **real** profiles
- [ ] Emails are correct (`hello@`, `collabs@`)
- [ ] No leftover placeholder text you meant to change
- [ ] Pushed to its own new GitHub repo
- [ ] Cloudflare Pages deploys the `.pages.dev` URL successfully
- [ ] Custom domains `wickiefort.com` + `www.wickiefort.com` added in Cloudflare
- [ ] **DNS:** added the exact records Cloudflare provided into Squarespace
- [ ] Existing Google Workspace email records left untouched
```
