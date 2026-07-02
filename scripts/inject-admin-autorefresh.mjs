// Wickie's /admin tab lives for days. After a deploy it goes stale — worst
// case a schema change makes every save error until she refreshes. Bake the
// deploy SHA into the built admin page and publish it alongside as
// deploy-version.json, plus a watcher that compares the two:
//   - newer deploy + she's been idle a long time (the overnight-tab case)
//     -> reload the tab for her
//   - newer deploy + she's active or recently typing -> never yank the page
//     out from under her; show a banner telling her to Save, then tap it
import { readFileSync, writeFileSync } from 'node:fs';

const sha = process.env.GITHUB_SHA;
if (!sha) throw new Error('GITHUB_SHA is not set — this script runs in CI only');

const htmlPath = 'public/admin/index.html';
let html = readFileSync(htmlPath, 'utf8');
if (html.includes('deploy-version.json')) throw new Error('auto-refresh already injected');
if (!html.includes('</body>')) throw new Error(`no </body> in ${htmlPath}`);

const snippet = `<script>
(function () {
  var DEPLOYED = "${sha}";
  var LONG_IDLE_MS = 60 * 60 * 1000;
  var lastTouch = Date.now();
  var banner = null;
  ['keydown', 'pointerdown'].forEach(function (ev) {
    document.addEventListener(ev, function () { lastTouch = Date.now(); }, true);
  });
  function showBanner() {
    if (banner) return;
    banner = document.createElement('div');
    banner.textContent = 'This editor was just updated \\u2014 click Save if you have unsaved changes, then tap this bar to reload.';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#b45309;color:#fff;padding:10px 16px;font:14px/1.4 sans-serif;text-align:center;cursor:pointer;';
    banner.addEventListener('click', function () { location.reload(); });
    document.body.appendChild(banner);
  }
  function check() {
    // cache-busting query: GitHub Pages' CDN caches for ~10 min otherwise
    fetch('deploy-version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (v) {
        if (!v.sha || v.sha === DEPLOYED) return;
        if (Date.now() - lastTouch > LONG_IDLE_MS) location.reload();
        else showBanner();
      })
      .catch(function () {});
  }
  setInterval(check, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) check();
  });
})();
</script>`;

html = html.replace('</body>', `${snippet}\n</body>`);
writeFileSync(htmlPath, html);
writeFileSync('public/admin/deploy-version.json', JSON.stringify({ sha }) + '\n');
console.log(`Injected admin auto-refresh (sha ${sha.slice(0, 7)})`);
