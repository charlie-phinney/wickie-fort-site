/*
  Render the built /media-kit page to dist/media-kit.pdf.

  Runs in deploy.yml AFTER `astro build`, so the PDF always carries the same
  daily-measured numbers as the live page — nothing is hand-maintained. The
  print stylesheet the page already ships (nav/footer/buttons hidden) is what
  page.pdf() renders, so the PDF is exactly the "save as PDF" a brand would
  make themselves, minus the asking.

  External requests are blocked during the render (fonts and photos are all
  same-origin since the speed pass) — deterministic output, no ad scripts.
  Exits non-zero on failure after retries: a red deploy beats a 404 download.
*/
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(DIST, 'media-kit.pdf');

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.woff2': 'font/woff2', '.xml': 'application/xml',
};

const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  let file = path.join(DIST, p);
  if (!path.resolve(file).startsWith(DIST)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file) && fs.existsSync(`${file}/index.html`)) file = `${file}/index.html`;
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

await new Promise((r) => server.listen(0, r));
const port = server.address().port;

let lastErr;
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    // Same-origin only: fonts/photos are local; ads and embeds have no
    // business in a PDF and would make the render nondeterministic.
    await page.route('**/*', (route) =>
      new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort()
    );
    await page.goto(`http://localhost:${port}/media-kit/`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    await page.pdf({
      path: OUT,
      format: 'Letter',
      printBackground: true,
      // scaled to keep the whole kit on ONE page (it spilled three bullets
      // onto a blank page 2 at full size)
      scale: 0.72,
      margin: { top: '0.4in', bottom: '0.4in', left: '0.45in', right: '0.45in' },
    });
    await browser.close();
    const size = fs.statSync(OUT).size;
    if (size < 20_000) throw new Error(`suspiciously small PDF (${size} bytes)`);
    console.log(`media-kit.pdf written (${Math.round(size / 1024)} KB)`);
    server.close();
    process.exit(0);
  } catch (err) {
    lastErr = err;
    console.warn(`attempt ${attempt} failed: ${err.message}`);
  }
}
server.close();
console.error(`media-kit PDF generation failed after 3 attempts: ${lastErr?.message}`);
process.exit(1);
