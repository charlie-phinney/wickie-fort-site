/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'oklch(var(--bg) / <alpha-value>)',
        surface: 'oklch(var(--surface) / <alpha-value>)',
        ink: 'oklch(var(--ink) / <alpha-value>)',
        muted: 'oklch(var(--muted) / <alpha-value>)',
        primary: 'oklch(var(--primary) / <alpha-value>)',
        'primary-deep': 'oklch(var(--primary-deep) / <alpha-value>)',
        'primary-tint': 'oklch(var(--primary-tint) / <alpha-value>)',
        pop: 'oklch(var(--pop) / <alpha-value>)',
        'pop-deep': 'oklch(var(--pop-deep) / <alpha-value>)',
        line: 'oklch(var(--line) / <alpha-value>)',
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
