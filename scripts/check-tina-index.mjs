/*
  Guards against the stale-TinaCloud-index failure class (bit us 2026-06-30
  and again 2026-07-01): the repo's schema moves ahead of the index TinaCloud
  is serving, and every /admin save fails with `Variable "$params" got
  invalid value` while all checks stay green.

  It collects every field name from the freshly built local schema
  (tina/__generated__/_schema.json) and asserts each one appears in the
  GraphQL schema TinaCloud is actually serving for `main`. Indexing after a
  push is asynchronous, so it retries for ~3 minutes before failing.

  Requires TINA_PUBLIC_CLIENT_ID and TINA_TOKEN in the environment.
*/
import { readFileSync } from 'node:fs';

const clientId = process.env.TINA_PUBLIC_CLIENT_ID;
const token = process.env.TINA_TOKEN;
if (!clientId || !token) {
  console.error('TINA_PUBLIC_CLIENT_ID / TINA_TOKEN not set');
  process.exit(1);
}

// Every named field in the local schema, e.g. "recipes", "methodText".
const localSchema = JSON.parse(readFileSync('tina/__generated__/_schema.json', 'utf8'));
const localFields = new Set();
(function walk(node) {
  if (Array.isArray(node)) return node.forEach(walk);
  if (node && typeof node === 'object') {
    if (typeof node.name === 'string' && (node.type || node.fields)) localFields.add(node.name);
    Object.values(node).forEach(walk);
  }
})(localSchema);

// Every field name TinaCloud's content API serves.
const INTROSPECTION = `{ __schema { types { fields { name } } } }`;
async function servedFields() {
  const res = await fetch(`https://content.tinajs.io/1.6/content/${clientId}/github/main`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': token },
    body: JSON.stringify({ query: INTROSPECTION }),
  });
  if (!res.ok) throw new Error(`content API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const served = new Set();
  for (const t of json?.data?.__schema?.types || [])
    for (const f of t.fields || []) served.add(f.name);
  if (!served.size) throw new Error('introspection returned no fields');
  return served;
}

const ATTEMPTS = 9;
for (let i = 1; i <= ATTEMPTS; i++) {
  try {
    const served = await servedFields();
    const missing = [...localFields].filter((f) => !served.has(f));
    if (!missing.length) {
      console.log(`TinaCloud index is in sync (${localFields.size} fields verified).`);
      process.exit(0);
    }
    console.log(`Attempt ${i}/${ATTEMPTS}: index missing [${missing.join(', ')}] — waiting for reindex…`);
  } catch (e) {
    console.log(`Attempt ${i}/${ATTEMPTS}: ${e.message}`);
  }
  if (i < ATTEMPTS) await new Promise((r) => setTimeout(r, 20000));
}
console.error(
  '\nTinaCloud is serving a STALE schema — /admin saves will fail for Wickie.\n' +
    "Fix: app.tina.io → Wickie's Kitchen → Configuration → Branches → main → ⋮ → Reindex, then re-run this workflow."
);
process.exit(1);
