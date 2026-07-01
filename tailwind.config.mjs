/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        primary: 'var(--primary)',
        'primary-deep': 'var(--primary-deep)',
        'primary-tint': 'var(--primary-tint)',
        pop: 'var(--pop)',
        'pop-deep': 'var(--pop-deep)',
        line: 'var(--line)',
      },
      fontFamily: {
        // Resolve through CSS variables so the "Look & Feel" font pairing
        // (see src/data/theme.ts, injected in Base.astro) can re-skin the
        // whole site. Defaults live in global.css :root.
        serif: ['var(--font-serif)'],
        sans: ['var(--font-sans)'],
        hand: ['var(--font-hand)'],
      },
      maxWidth: {
        prose: '68ch',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
