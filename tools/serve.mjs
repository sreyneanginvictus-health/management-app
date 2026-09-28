// Dev server: builds, serves prototype/dist on http://localhost:5173, rebuilds on src changes
// and live-reloads the page. No dependencies. Run: `npm run dev`.
import { createServer } from 'node:http';
import { readFileSync, watch, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'prototype', 'src');
const dist = join(root, 'prototype', 'dist');
const PORT = Number(process.env.PORT) || 5173;
const clients = new Set();

function build() {
  try { execFileSync(process.execPath, [join(root, 'tools', 'build.mjs')], { stdio: 'inherit' }); return true; }
  catch { console.error('Build failed — keeping the last good output'); return false; }
}
build();

let t = null;
watch(src, () => { clearTimeout(t); t = setTimeout(() => { if (build()) for (const res of clients) res.write('data: reload\n\n'); }, 120); });

const RELOAD = '<script>new EventSource("/__reload").onmessage=()=>location.reload()</script>';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/__reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write('\n'); clients.add(res); req.on('close', () => clients.delete(res)); return;
  }
  const file = join(dist, url === '/' ? 'index.html' : url.replace(/^\/+/, ''));
  if (!file.startsWith(dist) || !existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
  let body = readFileSync(file);
  if (file.endsWith('.html')) body = body.toString().replace('</body>', RELOAD + '</body>');
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(body);
}).listen(PORT, () => console.log(`Serving prototype on http://localhost:${PORT} (live reload on src changes)`));
