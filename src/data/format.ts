/* Number formatters shared by the homepage stats band and the media kit.
   Both FLOOR (never round up) because every figure is stated as an honest
   floor of the real number. fmtM is mirrored client-side in the count-up
   script in index.astro — keep the two in step. */

// "112.1M+" — for floor totals that carry the "+".
export const fmtM = (n: number) =>
  `${(Math.floor(n / 1e5) / 10).toFixed(1).replace(/\.0$/, '')}M+`;

// "29.8K" / "52.1M" — exact-scale plain counts, no "+".
export const fmtCount = (n: number) =>
  n >= 1e6
    ? `${(Math.floor(n / 1e5) / 10).toFixed(1).replace(/\.0$/, '')}M`
    : n >= 1e3
      ? `${(Math.floor(n / 100) / 10).toFixed(1).replace(/\.0$/, '')}K`
      : String(n);
