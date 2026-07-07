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
  // accept: iPhones default to HEIC, which Chrome/Firefox can't display —
  // restricting the picker forces an export to JPEG/PNG instead of letting
  // her publish a photo that looks fine to her (Safari) and broken to others.
  media: {
    tina: {
      mediaRoot: 'images',
      publicFolder: 'public',
    },
    accept: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
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
          // ===== Ask for a change (the escape hatch) =====
          // Anything the editor can't do, Wickie types here and Saves. A
          // GitHub Action (.github/workflows/change-request.yml) turns it into
          // a request that reaches Charlie automatically.
          {
            type: 'string',
            name: 'changeRequest',
            label: '✨ Want a change you can\'t make below? Ask here',
            description:
              "Describe anything you'd like changed that these controls don't let you do (a new kind of section, a custom layout, anything at all), then hit Save. It goes straight to Charlie and he'll take care of it. Clear this box once it's done. (Tip: after any Save, your live site updates in about 3 minutes.)",
            ui: { component: 'textarea' },
          },

          // ===== Look & Feel (safe, whole-site style controls) =====
          // These three re-skin the entire site. Every option is a tested,
          // good-looking preset, so any choice still looks right — see
          // src/data/theme.ts. Change one, Save, and the whole site updates.
          {
            type: 'string',
            name: 'colorTheme',
            label: '🎨 Color theme',
            description: 'Sets the colors across your whole site. Pick the mood you like.',
            options: [
              { value: 'tomato', label: 'Tomato & Marigold (warm, punchy)' },
              { value: 'berry', label: 'Berry & Rose (bright, playful)' },
              { value: 'olive', label: 'Olive & Honey (earthy, calm)' },
              { value: 'cocoa', label: 'Cocoa & Gold (cozy, refined)' },
              { value: 'ocean', label: 'Ocean & Coral (fresh, coastal)' },
              { value: 'plum', label: 'Plum & Peach (rich, romantic)' },
              { value: 'forest', label: 'Forest & Gold (deep, grounded)' },
              { value: 'blush', label: 'Blush & Clay (soft, pretty)' },
              { value: 'teal', label: 'Teal & Coral (fresh, modern)' },
              { value: 'wine', label: 'Wine & Honey (bold, elegant)' },
              { value: 'lavender', label: 'Lavender & Sage (gentle, dreamy)' },
              { value: 'slate', label: 'Slate & Amber (calm, classic)' },
            ],
          },
          {
            type: 'string',
            name: 'fontPairing',
            label: '✍️ Fonts',
            description: 'The lettering style for your headings and text.',
            options: [
              { value: 'fraunces', label: 'Fraunces + Inter (warm editorial)' },
              { value: 'playfair', label: 'Playfair + Inter (classic, elegant)' },
              { value: 'dmserif', label: 'DM Serif + DM Sans (modern, clean)' },
              { value: 'cormorant', label: 'Cormorant + Nunito Sans (soft, refined)' },
              { value: 'lora', label: 'Lora + Inter (readable, warm)' },
              { value: 'libre', label: 'Libre Baskerville + Work Sans (bookish)' },
              { value: 'eb', label: 'EB Garamond + Montserrat (timeless)' },
              { value: 'crimson', label: 'Crimson Pro + Inter (literary)' },
              { value: 'spectral', label: 'Spectral + Karla (calm, editorial)' },
              { value: 'bitter', label: 'Bitter + Source Sans (sturdy, friendly)' },
              { value: 'marcellus', label: 'Marcellus + Nunito Sans (graceful)' },
              { value: 'abril', label: 'Abril Fatface + Poppins (bold, magazine)' },
              { value: 'yeseva', label: 'Yeseva One + Nunito Sans (pretty display)' },
              { value: 'outfit', label: 'Outfit (clean, minimal)' },
              { value: 'space', label: 'Space Grotesk + Inter (techy, modern)' },
            ],
          },
          {
            type: 'string',
            name: 'textSize',
            label: '🔠 Text size',
            description: 'Make everything a little smaller or bigger, all at once.',
            options: [
              { value: 'small', label: 'Compact' },
              { value: 'medium', label: 'Standard' },
              { value: 'large', label: 'Large (easier to read)' },
            ],
          },
          {
            type: 'object',
            name: 'sections',
            label: '🧩 Sections (drag to reorder, switch to show/hide)',
            description:
              'Drag these into the order you want them on your page, and turn any of them off with the switch. Your top banner always stays first.',
            list: true,
            ui: {
              itemProps: (item) => ({
                label:
                  ({
                    stats: 'By the numbers',
                    about: 'About you',
                    work: 'Work with me',
                    shop: 'Shop',
                    philosophy: 'Your quote',
                    recipes: 'Recipes',
                    howto: 'How-to videos',
                    contact: 'Contact',
                  }[item?.id] || 'Section') + (item?.show === false ? ' — hidden' : ''),
              }),
            },
            fields: [
              {
                type: 'string',
                name: 'id',
                label: 'Section',
                options: [
                  { value: 'stats', label: 'By the numbers' },
                  { value: 'about', label: 'About you' },
                  { value: 'work', label: 'Work with me' },
                  { value: 'shop', label: 'Shop' },
                  { value: 'philosophy', label: 'Your quote' },
                  { value: 'recipes', label: 'Recipes' },
                  { value: 'howto', label: 'How-to videos' },
                  { value: 'contact', label: 'Contact' },
                ],
              },
              { type: 'boolean', name: 'show', label: 'Show on page' },
            ],
          },

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
            type: 'string',
            name: 'aboutText',
            label: 'Your story',
            description:
              'Tell people about you, all in this one box. Leave an empty line between paragraphs.',
            ui: { component: 'textarea' },
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
                type: 'string',
                name: 'ingredientsText',
                label: 'Ingredients (optional)',
                description:
                  'Type or paste them all in this one box — one ingredient per line. For a group title like “For the sauce”, put it on its own line ending with a colon (:).',
                ui: { component: 'textarea' },
              },
              {
                type: 'string',
                name: 'methodText',
                label: 'Method / steps (optional)',
                description:
                  'Type or paste the whole method in this one box — one step per line. Steps are numbered automatically. For a section title like “Prep your burger”, put it on its own line ending with a colon (:). After you Save, your live site updates in about 3 minutes.',
                ui: { component: 'textarea' },
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

          // ===== 3b. How-to videos (technique library) =====
          {
            type: 'object',
            name: 'howtos',
            label: 'How-to videos (kitchen basics)',
            description:
              'Your technique videos — how to medium dice a potato, dice an onion, fabricate a chicken. Each one gets its own spot on your How-To page, and any recipe that mentions the technique links to your video automatically. Use “+ Add” for each new video.',
            list: true,
            ui: { itemProps: (i) => ({ label: i?.title || 'New how-to' }) },
            fields: [
              {
                type: 'string',
                name: 'title',
                label: 'Technique name',
                description:
                  'What you’re teaching, like “Medium dice a potato”. No need to type “How to” — the site adds it.',
              },
              {
                type: 'string',
                name: 'videoUrl',
                label: 'Video link',
                description:
                  'Paste the link to your video — an Instagram reel, YouTube video, or TikTok. It plays right on the page. You can add the technique now and paste the link later.',
              },
              {
                type: 'string',
                name: 'blurb',
                label: 'Short description (optional)',
                description: 'One or two sentences about the technique and when you use it.',
                ui: { component: 'textarea' },
              },
              {
                type: 'image',
                name: 'image',
                label: 'Cover photo (optional)',
                description: 'Shown on the card until someone plays the video.',
              },
              {
                type: 'string',
                name: 'matchText',
                label: 'Recipe words that should link here (optional)',
                description:
                  'When a recipe of yours mentions these words, they automatically become a link to this video — one word or phrase per line, like “medium dice” or “diced potatoes”. Leave blank to just use the technique name above.',
                ui: { component: 'textarea' },
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
            type: 'string',
            name: 'workOfferingsText',
            label: 'Ways people can work with you',
            description: 'The list of things you offer — one per line in this box.',
            ui: { component: 'textarea' },
          },

          // ===== Your numbers (the "By the numbers" band) =====
          {
            type: 'number',
            name: 'statVideosOver1M',
            label: 'How many videos have over 1 million views',
            description:
              'Counted automatically every day — this is a safety minimum. The site shows whichever is higher.',
          },

          // ===== Shop section =====
          {
            type: 'string',
            name: 'shopHeading',
            label: 'Shop section — heading',
            description: 'The title of your shop section, like “Shop my kitchen”.',
          },
          {
            type: 'string',
            name: 'shopIntro',
            label: 'Shop section — intro',
            description: 'A short line about what you share in your shop.',
            ui: { component: 'textarea' },
          },
          {
            type: 'string',
            name: 'shopEmbed',
            label: 'Shop embed code (optional — shows your shop right on the page)',
            description:
              'To show your ShopMy shop directly on the page: in ShopMy open a collection → Settings & Sharing → Embeddable Components → copy the code → paste it here. Leave blank to show a button that opens your shop instead.',
            ui: { component: 'textarea' },
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
