// Build the single-file prototype from prototype/src.
// Cross-platform (Windows/macOS/Linux): `node tools/build.mjs` or `npm run build`.
//
// Outputs:
//   prototype/dist/northstar.html  — body-only page for publishing as a claude.ai Artifact
//                                    (the Artifact host adds <!doctype>/<head>/<body>). Always demo mode.
//   prototype/dist/index.html      — full standalone page; open it directly in a browser.
//                                    Cloud mode (real accounts, Supabase) when SUPABASE_URL and a
//                                    publishable key are set in the environment; demo mode otherwise.
//
// HQ_DIST overrides the output folder (used by tests).
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'prototype', 'src');
const dist = process.env.HQ_DIST ? resolve(process.env.HQ_DIST) : join(root, 'prototype', 'dist');
const fail = msg => { console.error('Build failed: ' + msg); process.exit(1); };

// ORDER MATTERS: core → seed data → cloud storage → UI kit → views. views_misc.js boots the app, so it goes last.
const JS = ['core.js', 'data.js', 'cloud.js', 'ui.js', 'views_dash.js', 'views_tasks.js', 'views_approvals.js',
  'views_finance.js', 'views_org.js', 'views_reports.js', 'views_hub.js', 'views_misc.js'];

const css = readFileSync(join(src, 'styles.css'), 'utf8');
const js = JS.map(f => `/* ===== ${f} ===== */\n` + readFileSync(join(src, f), 'utf8')).join('\n');

// Fail fast on syntax errors (compiles without running).
try { new vm.Script(js, { filename: 'bundle.js' }); }
catch (e) { fail('syntax error in bundle: ' + e.message); }

/* ---------- Supabase config (index.html only) ---------- */
// Only the URL and the PUBLISHABLE (anon) key may reach the browser. Access control is row-level security.
const SUPABASE_JS = 'supabase-js-2.117.2.js';   // vendored in prototype/vendor (MIT), pinned
const env = process.env;
const pick = (...names) => { for (const n of names) if (env[n] && env[n].trim()) return [n, env[n].trim()]; return [null, '']; };
const [urlVar, supabaseUrl] = pick('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
const [keyVar, supabaseKey] = pick('SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
let cloud = null;
if (supabaseUrl && supabaseKey) {
  const SECRET_NAME = /SECRET|SERVICE_ROLE|JWT|POSTGRES/i;
  if (SECRET_NAME.test(urlVar) || SECRET_NAME.test(keyVar)) fail(`refusing to inline ${urlVar}/${keyVar}`);
  if (/^sb_secret_/.test(supabaseKey)) fail(`${keyVar} is a SECRET key (sb_secret_…). Use the publishable key.`);
  if (/^eyJ/.test(supabaseKey)) {
    let role = '';
    try { role = JSON.parse(Buffer.from(supabaseKey.split('.')[1], 'base64url').toString()).role; } catch { fail(`${keyVar} looks like a JWT but cannot be decoded`); }
    if (role !== 'anon') fail(`${keyVar} is a JWT with role "${role}". Only the anon/publishable key may be used.`);
  } else if (!/^sb_publishable_/.test(supabaseKey)) fail(`${keyVar} is neither a publishable key (sb_publishable_…) nor an anon JWT`);
  if (!/^https:\/\/[^\s"'<>]+$/.test(supabaseUrl) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(supabaseUrl)) fail(`${urlVar} must be an https URL`);
  cloud = { supabaseUrl: supabaseUrl.replace(/\/+$/, ''), supabaseKey };
}

const body = [
  '<title>Negroni</title>',
  '<meta name="description" content="Negroni — company management app (prototype)">',
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap">',
  `<style>\n${css}\n</style>`,
  '<div id="app"></div><div id="drawer-root"></div><div id="modal-root"></div><div id="toasts" class="toast-wrap" aria-live="polite"></div>',
  '%%CLOUD%%',
  `<script>\n${js}\n</script>`,
].join('\n');
const cloudTags = cloud
  ? `<script>window.HQ_CONFIG=${JSON.stringify(cloud).replace(/</g, '\\u003c')};</script>\n<script src="vendor/${SUPABASE_JS}"></script>`
  : '';

mkdirSync(dist, { recursive: true });
writeFileSync(join(dist, 'northstar.html'), body.replace('%%CLOUD%%\n', ''));
const index = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>\n' + body.replace('%%CLOUD%%', cloudTags) + '\n</body></html>\n';
// Last line of defence: nothing secret-looking in the output.
for (const [name, re] of [['sb_secret_', /sb_secret_/], ['service_role', /service_role/], ['POSTGRES', /POSTGRES/]]) {
  if (re.test(index) || re.test(body)) fail(`output contains "${name}"`);
}
for (const [n, v] of Object.entries(env)) {
  if (/SECRET|SERVICE_ROLE|JWT|POSTGRES|PASSWORD/i.test(n) && v && v.trim().length >= 16 && index.includes(v.trim())) fail(`output contains the value of ${n}`);
}
writeFileSync(join(dist, 'index.html'), index);
if (cloud) {
  mkdirSync(join(dist, 'vendor'), { recursive: true });
  copyFileSync(join(root, 'prototype', 'vendor', SUPABASE_JS), join(dist, 'vendor', SUPABASE_JS));
}
console.log(`Built northstar.html and index.html in ${dist} (${(body.length / 1024).toFixed(0)} KB) — ` +
  (cloud ? `cloud mode (${urlVar} + ${keyVar})` : 'demo mode (no Supabase env vars)'));
