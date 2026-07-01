import { defineConfig } from 'tinacms';

// The branch Tina reads/writes. Defaults to main (our deploy branch).
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.HEAD ||
  'main';

export default defineConfig({
  branch,
  // These come from your free Tina account at app.tina.io (set as repo
  // secrets TINA_PUBLIC_CLIENT_ID and TINA_TOKEN). Local editing works
  // without them via `npm run cms`.
  clientId: process.env.TINA_PUBLIC_CLIENT_ID || '',
  token: process.env.TINA_TOKEN || '',

  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  // Photos Wickie uploads are stored in the repo under public/images.
  media: {
    tina: {
      mediaRoot: 'images',
      publicFolder: 'public',
    },
  },

  schema: {
    collections: [
      {
        name: 'site',
        label: 'Website Content',
        path: 'src/data',
        format: 'json',
        match: { include: 'site' },
        // Singleton: no creating or deleting the content file.
        ui: {
          allowedActions: { create: false, delete: false },
          global: true,
        },
        fields: [
          // ---- Header / hero -------------------------------------------
          { type: 'string', name: 'name', label: 'Your name', required: true },
          { type: 'string', name: 'brand', label: 'Brand name (e.g. Wickie’s Kitchen)', required: true },
          { type: 'string', name: 'tagline', label: 'Tagline (big line under your name)' },
          { type: 'string', name: 'heroKicker', label: 'Small line above your name' },
          { type: 'string', name: 'heroSub', label: 'Intro sentence', ui: { component: 'textarea' } },
          { type: 'image', name: 'heroImage', label: 'Hero photo (top of the page)' },

          // ---- About ---------------------------------------------------
          { type: 'string', name: 'aboutHeading', label: 'About heading' },
          { type: 'image', name: 'aboutImage', label: 'Photo of you (About section)' },
          {
            type: 'object',
            name: 'aboutParagraphs',
            label: 'About paragraphs',
            list: true,
            ui: { itemProps: (i) => ({ label: i?.text?.slice(0, 40) || 'Paragraph' }) },
            fields: [{ type: 'string', name: 'text', label: 'Paragraph', ui: { component: 'textarea' } }],
          },

          // ---- Recipes -------------------------------------------------
          {
            type: 'object',
            name: 'recipes',
            label: 'Recipe / content cards',
            list: true,
            ui: { itemProps: (i) => ({ label: i?.title || 'Recipe' }) },
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'blurb', label: 'Short description', ui: { component: 'textarea' } },
              { type: 'string', name: 'tag', label: 'Tag / category (optional)' },
              { type: 'image', name: 'image', label: 'Photo (optional)' },
              { type: 'string', name: 'href', label: 'Link (optional)' },
            ],
          },

          // ---- Work With Me --------------------------------------------
          { type: 'string', name: 'workHeading', label: 'Work-with-me heading' },
          { type: 'string', name: 'workIntro', label: 'Work-with-me intro', ui: { component: 'textarea' } },
          { type: 'string', name: 'workCta', label: 'Work-with-me button text' },
          {
            type: 'object',
            name: 'workOfferings',
            label: 'What you offer (list)',
            list: true,
            ui: { itemProps: (i) => ({ label: i?.text || 'Offering' }) },
            fields: [{ type: 'string', name: 'text', label: 'Offering' }],
          },

          // ---- Social links --------------------------------------------
          {
            type: 'object',
            name: 'socials',
            label: 'Social links',
            list: true,
            ui: { itemProps: (i) => ({ label: i?.label || 'Link' }) },
            fields: [
              { type: 'string', name: 'label', label: 'Platform (e.g. Instagram)' },
              { type: 'string', name: 'handle', label: 'Handle (e.g. @wickieskitchen)' },
              { type: 'string', name: 'href', label: 'Full URL' },
            ],
          },

          // ---- Emails --------------------------------------------------
          { type: 'string', name: 'emailGeneral', label: 'General / contact email' },
          { type: 'string', name: 'emailPartnerships', label: 'Partnerships email' },
          { type: 'string', name: 'emailContact', label: 'Extra contact email' },
        ],
      },
    ],
  },
});
