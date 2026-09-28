// Build the single-file prototype from prototype/src.
// Cross-platform (Windows/macOS/Linux): `node tools/build.mjs` or `npm run build`.
//
// Outputs:
//   prototype/dist/northstar.html  — body-only page for publishing as a claude.ai Artifact
//                                    (the Artifact host adds <!doctype>/<head>/<body>)
//   prototype/dist/index.html      — full standalone page; open it directly in a browser
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'prototype', 'src');
const dist = join(root, 'prototype', 'dist');

// ORDER MATTERS: core → seed data → UI kit → views. views_misc.js boots the app, so it goes last.
const JS = ['core.js', 'data.js', 'ui.js', 'views_dash.js', 'views_tasks.js', 'views_approvals.js',
  'views_finance.js', 'views_org.js', 'views_reports.js', 'views_misc.js'];

const css = readFileSync(join(src, 'styles.css'), 'utf8');
const js = JS.map(f => `/* ===== ${f} ===== */\n` + readFileSync(join(src, f), 'utf8')).join('\n');

// Fail fast on syntax errors (compiles without running).
try { new vm.Script(js, { filename: 'bundle.js' }); }
catch (e) { console.error('Syntax error in bundle:', e.message); process.exit(1); }

const body = [
  '<title>Northstar Holding OS</title>',
  '<meta name="description" content="Holding company operating system prototype">',
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap">',
  `<style>\n${css}\n</style>`,
  '<div id="app"></div><div id="drawer-root"></div><div id="modal-root"></div><div id="toasts" class="toast-wrap" aria-live="polite"></div>',
  `<script>\n${js}\n</script>`,
].join('\n');

mkdirSync(dist, { recursive: true });
writeFileSync(join(dist, 'northstar.html'), body);
writeFileSync(join(dist, 'index.html'),
  '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>\n' + body + '\n</body></html>\n');
console.log(`Built prototype/dist/northstar.html and index.html (${(body.length / 1024).toFixed(0)} KB)`);
