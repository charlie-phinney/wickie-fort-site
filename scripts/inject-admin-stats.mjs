/*
  Inject a small "site stats" card into the built /admin page, so Wickie
  sees her visitor numbers in the same place she edits the site — no extra
  login, no extra link to keep track of.

  Reads /site-stats.json at runtime (written daily by fetch-site-stats.mjs
  via refresh-stats.yml). Contains NO secrets — the JSON is aggregate visit
  counts only; the GoatCounter API token never leaves CI.

  Same contract as inject-admin-autorefresh.mjs: CI-only, refuses to
  double-inject, appends before </body>.
*/
import { readFileSync, writeFileSync } from 'node:fs';

const htmlPath = 'public/admin/index.html';
let html = readFileSync(htmlPath, 'utf8');
if (html.includes('wk-site-stats')) throw new Error('stats card already injected');
if (!html.includes('</body>')) throw new Error(`no </body> in ${htmlPath}`);

const snippet = `<script>
(function () {
  function fmt(n) {
    n = Number(n) || 0; // stats JSON values only ever render as numbers
    return n >= 10000 ? Math.round(n / 1000) + 'K' : String(n);
  }
  // Page titles are CLIENT-reported to GoatCounter (anyone can POST a forged
  // one to the public count endpoint), so they are untrusted input here.
  function clean(t) {
    return String(t).replace(/[<>&"']/g, '').slice(0, 60);
  }
  function show(s) {
    var open = false;
    var pill = document.createElement('button');
    pill.id = 'wk-site-stats';
    pill.type = 'button';
    pill.setAttribute('aria-expanded', 'false');
    pill.style.cssText = 'position:fixed;bottom:14px;left:14px;z-index:2147483000;background:#2d2016;color:#fdf9f3;border:none;border-radius:999px;padding:9px 15px;font:600 13px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgb(0 0 0 / .25);';
    pill.textContent = '\\uD83D\\uDCCA ' + fmt(s.days7) + (Number(s.days7) === 1 ? ' visit' : ' visits') + ' this week';
    var card = document.createElement('div');
    card.style.cssText = 'position:fixed;bottom:56px;left:14px;z-index:2147483000;display:none;width:270px;background:#fdf9f3;color:#2d2016;border-radius:14px;padding:16px;font:13px/1.5 system-ui,sans-serif;box-shadow:0 10px 30px rgb(0 0 0 / .3);';
    var rows = (s.topPages || []).map(function (p) {
      return '<tr><td style="padding:2px 0;max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
        clean(p.title) + '</td><td style="text-align:right;font-weight:600;">' + fmt(p.count) + '</td></tr>';
    }).join('');
    card.innerHTML =
      '<div style="font-weight:700;font-size:14px;">Your website visits</div>' +
      '<div style="margin-top:8px;display:flex;gap:18px;">' +
      '<div><div style="font-size:22px;font-weight:700;">' + fmt(s.days7) + '</div><div style="opacity:.65;">last 7 days</div></div>' +
      '<div><div style="font-size:22px;font-weight:700;">' + fmt(s.days30) + '</div><div style="opacity:.65;">last 30 days</div></div>' +
      '</div>' +
      (rows ? '<div style="margin-top:10px;font-weight:700;">Most visited</div><table style="width:100%;border-collapse:collapse;margin-top:4px;">' + rows + '</table>' : '') +
      '<div style="margin-top:10px;opacity:.55;">Counted privately, updates daily' + (s.updated ? ' \\u00b7 ' + clean(s.updated) : '') + '</div>';
    pill.addEventListener('click', function () {
      open = !open;
      card.style.display = open ? 'block' : 'none';
      pill.setAttribute('aria-expanded', String(open));
    });
    document.body.appendChild(pill);
    document.body.appendChild(card);
  }
  fetch('/site-stats.json?t=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (s) {
      if (typeof s.days7 === 'number') show(s);
    })
    .catch(function () {});
})();
</script>`;

html = html.replace('</body>', `${snippet}\n</body>`);
writeFileSync(htmlPath, html);
console.log('Injected admin site-stats card');
