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
        // Fields are shown in this order, top to bottom — the same order they
        // appear on the page. Every label talks plainly; the `description` under
        // each one tells Wickie exactly what it does. Anything marked optional can
        // be left blank and simply won't show on the site.
        fields: [
          // ===== 1. The top of your page =====
          {
            type: 'string',
            name: 'tagline',
            label: 'Your big headline',
            description: 'The large line people see first at the top of the page. Keep it short.',
          },
          {
            type: 'string',
            name: 'heroKicker',
            label: 'The little line above your headline',
            description: 'A short, warm intro — like “welcome to”.',
          },
          {
            type: 'string',
            name: 'heroSub',
            label: 'Your intro sentence',
            description: 'One or two friendly sentences under the headline.',
            ui: { component: 'textarea' },
          },
          {
            type: 'image',
            name: 'heroImage',
            label: 'Your main photo (top of the page)',
            description: 'Click to upload. A tall (portrait) photo of you looks best here.',
          },

          // ===== 2. About you =====
          {
            type: 'string',
            name: 'aboutHeading',
            label: 'About section — heading',
            description: 'The title of your “about me” section.',
          },
          {
            type: 'image',
            name: 'aboutImage',
            label: 'Your About photo',
            description: 'Click to upload a photo of you for the About section.',
          },
          {
            type: 'object',
            name: 'aboutParagraphs',
            label: 'Your story (paragraphs)',
            description: 'Tell people about you. Add one box per paragraph.',
            list: true,
            ui: { itemProps: (i) => ({ label: i?.text?.slice(0, 40) || 'New paragraph' }) },
            fields: [{ type: 'string', name: 'text', label: 'Paragraph', ui: { component: 'textarea' } }],
          },

          // ===== 3. Your recipes =====
          {
            type: 'object',
            name: 'recipes',
            label: 'Your recipes',
            description:
              'Each recipe becomes a card on the homepage and gets its own page. Add a photo, ingredients and steps whenever you’re ready — anything you leave blank just won’t show. Use “+ Add” to make a new one, or drag to reorder.',
            list: true,
            ui: { itemProps: (i) => ({ label: i?.title || 'New recipe' }) },
            fields: [
              {
                type: 'string',
                name: 'title',
                label: 'Recipe name',
              },
              {
                type: 'string',
                name: 'blurb',
                label: 'Short description',
                description: 'One or two sentences shown on the card.',
                ui: { component: 'textarea' },
              },
              {
                type: 'string',
                name: 'tag',
                label: 'Little label (optional)',
                description: 'A small tag on the card, like “Dinner” or “On repeat”.',
              },
              {
                type: 'image',
                name: 'image',
                label: 'Recipe photo (optional)',
                description: 'Click to upload. A nice placeholder shows until you add one.',
              },
              {
                type: 'string',
                name: 'serves',
                label: 'Serves (optional)',
                description: 'For example: “Serves 4”.',
              },
              {
                type: 'string',
                name: 'time',
                label: 'Time (optional)',
                description: 'For example: “30 min”.',
              },
              {
                type: 'object',
                name: 'ingredients',
                label: 'Ingredients (optional)',
                description: 'Add one ingredient per box.',
                list: true,
                ui: { itemProps: (i) => ({ label: i?.text || 'New ingredient' }) },
                fields: [{ type: 'string', name: 'text', label: 'Ingredient' }],
              },
              {
                type: 'object',
                name: 'steps',
                label: 'Method / steps (optional)',
                description: 'Add one step per box, in order. They’ll be numbered automatically.',
                list: true,
                ui: { itemProps: (i) => ({ label: i?.text?.slice(0, 40) || 'New step' }) },
                fields: [{ type: 'string', name: 'text', label: 'Step', ui: { component: 'textarea' } }],
              },
              {
                type: 'string',
                name: 'href',
                label: 'Link to another site (advanced — usually leave blank)',
                description:
                  'Only fill this in if you want this card to open another website (like an Instagram post) instead of its own recipe page.',
              },
            ],
          },

          // ===== 4. Work with me =====
          {
            type: 'string',
            name: 'workHeading',
            label: 'Work-with-me — heading',
            description: 'The title of the section about collaborating with you.',
          },
          {
            type: 'string',
            name: 'workIntro',
            label: 'Work-with-me — intro',
            description: 'A short paragraph inviting brands and people to work with you.',
            ui: { component: 'textarea' },
          },
          {
            type: 'string',
            name: 'workCta',
            label: 'Work-with-me — button text',
            description: 'What the button says, like “Let’s work together”.',
          },
          {
            type: 'object',
            name: 'workOfferings',
            label: 'Ways people can work with you',
            description: 'The list of things you offer. One per box.',
            list: true,
            ui: { itemProps: (i) => ({ label: i?.text || 'New item' }) },
            fields: [{ type: 'string', name: 'text', label: 'Offering' }],
          },

          // ===== 5. Your contact + social links =====
          {
            type: 'string',
            name: 'emailGeneral',
            label: 'Your email address',
            description: 'Where people reach you. Used on the contact button and in the footer.',
          },
          {
            type: 'object',
            name: 'socials',
            label: 'Your social links',
            description: 'Your profiles. For each one, paste the full web address (it starts with https://).',
            list: true,
            ui: { itemProps: (i) => ({ label: i?.label || 'New link' }) },
            fields: [
              { type: 'string', name: 'label', label: 'Platform name', description: 'e.g. Instagram, TikTok, YouTube.' },
              { type: 'string', name: 'handle', label: 'Your handle', description: 'e.g. @wickieskitchen.' },
              { type: 'string', name: 'href', label: 'Web address (URL)', description: 'The full link, e.g. https://www.instagram.com/wickieskitchen' },
            ],
          },

          // ===== Behind-the-scenes (your name + brand — you rarely need these) =====
          {
            type: 'string',
            name: 'name',
            label: 'Your name',
            description: 'Used in the page’s behind-the-scenes title. You rarely need to change this.',
            required: true,
          },
          {
            type: 'string',
            name: 'brand',
            label: 'Your brand name',
            description: 'Like “Wickie’s Kitchen”. Shown in the top-left corner and the footer.',
            required: true,
          },
        ],
      },
    ],
  },
});
