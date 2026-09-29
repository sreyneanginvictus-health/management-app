// Cloud mode tests (handoff §15 P0.4) against an in-memory fake of Supabase.
// Checks: build secret guards, sign-up/sign-in/errors, autosave + reload, second device,
// conflicts, isolation between accounts, invites (viewer/editor), old versions, sign-out cleanup.
// The fake mirrors the rules in supabase/migrations (RLS, save_workspace, invite_member);
// the real database is covered by the manual checklist in handoff §15 P0.4.
// Run: `npm test` (runs after tests/smoke.mjs).
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fails = []; const errors = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };
const tmp = mkdtempSync(join(tmpdir(), 'hq-cloud-'));

/* ---------- 1) build guards ---------- */
// Fake secret-shaped values, assembled at runtime so GitHub secret scanning doesn't flag this file.
const SB_SECRET = 'sb_' + 'secret_';
const CLEAN_ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/SUPABASE|POSTGRES|JWT|SECRET/i.test(k)));
const build = (env, out) => spawnSync(process.execPath, [join(root, 'tools', 'build.mjs')], { env: { ...CLEAN_ENV, HQ_DIST: out, ...env }, encoding: 'utf8' });
const jwt = role => 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({ role, iss: 'supabase' })).toString('base64url') + '.sig';
const URL_ = 'https://abcd.supabase.co';
ok(build({ SUPABASE_URL: URL_, SUPABASE_PUBLISHABLE_KEY: SB_SECRET + 'abc123' }, join(tmp, 'b1')).status !== 0, 'build must fail with an sb_secret_ key');
ok(build({ SUPABASE_URL: URL_, SUPABASE_ANON_KEY: jwt('service_role') }, join(tmp, 'b2')).status !== 0, 'build must fail with a service_role JWT');
ok(build({ SUPABASE_URL: URL_, SUPABASE_ANON_KEY: jwt('anon') }, join(tmp, 'b3')).status === 0, 'build accepts an anon JWT');
ok(build({ SUPABASE_URL: 'http://evil.example', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' }, join(tmp, 'b4')).status !== 0, 'build must reject a non-https URL');
const SECRET_VAL = SB_SECRET + ['this', 'must', 'never', 'ship', '0123456789'].join('-');
const good = build({ SUPABASE_URL: URL_, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test123', SUPABASE_SECRET_KEY: SECRET_VAL, SUPABASE_JWT_SECRET: 'jwt-secret-value-0123456789abcdef', POSTGRES_PASSWORD: 'pg-password-0123456789' }, join(tmp, 'cloud'));
ok(good.status === 0, 'cloud build succeeds: ' + good.stderr);
const cloudIndex = readFileSync(join(tmp, 'cloud', 'index.html'), 'utf8');
const cloudArtifact = readFileSync(join(tmp, 'cloud', 'northstar.html'), 'utf8');
ok(cloudIndex.includes('window.HQ_CONFIG={') && cloudIndex.includes('sb_publishable_test123'), 'index.html carries the publishable config');
ok(!cloudArtifact.includes('window.HQ_CONFIG={') && !cloudArtifact.includes('vendor/supabase'), 'northstar.html (Artifact) stays demo-only');
ok(existsSync(join(tmp, 'cloud', 'vendor', 'supabase-js-2.117.2.js')), 'supabase-js copied to dist/vendor');
for (const [name, s] of [['cloud index', cloudIndex], ['demo index', readFileSync(join(root, 'prototype', 'dist', 'index.html'), 'utf8')]]) {
  for (const bad of [SB_SECRET, 'service_role', 'POSTGRES', SECRET_VAL, 'jwt-secret-value', 'pg-password']) ok(!s.includes(bad), `${name} must not contain "${bad}"`);
}
ok(!readFileSync(join(root, 'prototype', 'dist', 'index.html'), 'utf8').includes('window.HQ_CONFIG={'), 'demo build has no cloud config');

/* ---------- 2) fake Supabase (server side, shared by every browser context) ---------- */
const DB = { users: [], workspaces: new Map(), members: [], rpcCalls: 0 };
const newId = () => crypto.randomUUID();
const roleOf = (ws, uid) => (DB.members.find(m => m.workspace_id === ws && m.user_id === uid) || {}).role;
const atLeast = (ws, uid, min) => { const r = roleOf(ws, uid); return !!r && (min === 'viewer' || (min === 'editor' ? r !== 'viewer' : r === 'owner')); };
const E = (message, code) => ({ data: null, error: { message, code } });
const pub = u => ({ id: u.id, email: u.email, user_metadata: u.meta });
function handle(req) {
  const uid = req.uid;
  if (req.kind === 'signUp') {
    if (DB.users.some(u => u.email === req.email.toLowerCase())) return E('User already registered');
    if (req.password.length < 10) return E('Password should be at least 10 characters.', 'weak_password');
    const u = { id: newId(), email: req.email.toLowerCase(), password: req.password, meta: req.meta || {} }; DB.users.push(u);
    return { data: pub(u), error: null };
  }
  if (req.kind === 'signIn') {
    const u = DB.users.find(x => x.email === req.email.toLowerCase() && x.password === req.password);
    return u ? { data: pub(u), error: null } : E('Invalid login credentials');
  }
  if (!uid) return E('JWT required', '401');
  const f = Object.fromEntries(req.filters || []);
  if (req.kind === 'from' && req.table === 'workspace_members') {
    if (req.op === 'select') {
      const mine = new Set(DB.members.filter(m => m.user_id === uid).map(m => m.workspace_id));
      let rows = DB.members.filter(m => mine.has(m.workspace_id));
      for (const [k, v] of Object.entries(f)) rows = rows.filter(r => r[k] === v);
      return { data: rows.map(m => { const w = DB.workspaces.get(m.workspace_id); return { ...m, workspaces: { id: w.id, name: w.name, owner_id: w.owner_id, updated_at: w.updated_at } }; }), error: null };
    }
    if (req.op === 'delete') {
      const before = DB.members.length;
      DB.members = DB.members.filter(m => !(m.workspace_id === f.workspace_id && m.user_id === f.user_id && atLeast(f.workspace_id, uid, 'owner') && m.role !== 'owner'));
      return { data: null, error: null, count: before - DB.members.length };
    }
  }
  if (req.kind === 'from' && req.table === 'workspaces') {
    if (req.op === 'select') {
      const rows = [...DB.workspaces.values()].filter(w => atLeast(w.id, uid, 'viewer') && (!f.id || w.id === f.id));
      if (req.single) return rows.length === 1 ? { data: structuredClone(rows[0]), error: null } : E('JSON object requested, multiple (or no) rows returned', 'PGRST116');
      return { data: structuredClone(rows), error: null };
    }
    if (req.op === 'insert') {
      const v = req.values;
      if (v.owner_id !== uid) return E('new row violates row-level security policy for table "workspaces"', '42501');
      const now = new Date().toISOString();
      DB.workspaces.set(v.id, { id: v.id, name: v.name, owner_id: v.owner_id, state: v.state, schema_version: v.schema_version, revision: 1, created_at: now, updated_at: now });
      DB.members.push({ workspace_id: v.id, user_id: uid, role: 'owner', added_at: now });
      return { data: null, error: null };
    }
    if (req.op === 'update') {
      const w = DB.workspaces.get(f.id);
      if (w && atLeast(w.id, uid, 'editor')) Object.assign(w, req.values);
      return { data: null, error: null };
    }
  }
  if (req.kind === 'rpc') {
    const a = req.args; DB.rpcCalls++;
    if (req.name === 'save_workspace') {
      if (!atLeast(a.ws, uid, 'editor')) return E('read-only', '42501');
      const w = DB.workspaces.get(a.ws);
      if (!w || w.revision !== a.expected_revision) return E('conflict', 'P0001');
      Object.assign(w, { state: a.new_state, schema_version: a.new_schema_version, revision: w.revision + 1, updated_at: new Date().toISOString() });
      return { data: w.revision, error: null };
    }
    if (req.name === 'invite_member') {
      if (!atLeast(a.ws, uid, 'owner')) return E('only the workspace owner can invite');
      const t = DB.users.find(u => u.email === a.member_email.toLowerCase());
      if (!t) return E('no account with that email yet - ask them to sign up first');
      const ex = DB.members.find(m => m.workspace_id === a.ws && m.user_id === t.id);
      if (ex) { if (ex.role !== 'owner') ex.role = a.member_role; } else DB.members.push({ workspace_id: a.ws, user_id: t.id, role: a.member_role, added_at: new Date().toISOString() });
      return { data: null, error: null };
    }
    if (req.name === 'workspace_members_list') {
      if (!atLeast(a.ws, uid, 'viewer')) return { data: [], error: null };
      return { data: DB.members.filter(m => m.workspace_id === a.ws).map(m => { const u = DB.users.find(x => x.id === m.user_id); return { user_id: m.user_id, role: m.role, display_name: u.meta.display_name, email: u.email, added_at: m.added_at }; }), error: null };
    }
  }
  return E('fake supabase: unsupported request ' + JSON.stringify(req).slice(0, 200));
}

// The in-page fake client (same shape as the supabase-js calls cloud.js makes).
const FAKE_CLIENT = `window.supabase = { createClient() {
  const KEY = 'sb-fake-auth-token'; const listeners = [];
  const sess = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  const call = async req => { const s = sess(); return JSON.parse(await window.__sb(JSON.stringify(Object.assign({ uid: s && s.user.id }, req)))); };
  const emit = (ev, s) => listeners.forEach(f => f(ev, s));
  const enter = r => { if (r.error) return { data: { user: null, session: null }, error: r.error }; const s = { user: r.data }; localStorage.setItem(KEY, JSON.stringify(s)); emit('SIGNED_IN', s); return { data: { user: r.data, session: s }, error: null }; };
  const auth = {
    async getSession() { return { data: { session: sess() }, error: null }; },
    onAuthStateChange(cb) { listeners.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
    async signUp(o) { return enter(await call({ kind: 'signUp', email: o.email, password: o.password, meta: o.options && o.options.data })); },
    async signInWithPassword(o) { return enter(await call({ kind: 'signIn', email: o.email, password: o.password })); },
    async signOut() { localStorage.removeItem(KEY); emit('SIGNED_OUT', null); return { error: null }; },
    async resetPasswordForEmail() { return { data: {}, error: null }; },
    async updateUser() { return { data: { user: sess() && sess().user }, error: null }; },
  };
  const from = table => { const q = { kind: 'from', table, filters: [] }; const b = {
    select(c) { if (!q.op) q.op = 'select'; q.cols = c; return b; }, insert(v) { q.op = 'insert'; q.values = v; return b; },
    update(v) { q.op = 'update'; q.values = v; return b; }, delete() { q.op = 'delete'; return b; },
    eq(c, v) { q.filters.push([c, v]); return b; }, single() { q.single = true; return b; },
    then(res, rej) { return call(q).then(res, rej); } }; return b; };
  return { auth, from, rpc: (name, args) => ({ then(res, rej) { return call({ kind: 'rpc', name, args }).then(res, rej); } }) };
} };`;

const dist = join(tmp, 'cloud');
const server = createServer((req, res) => {
  const p = req.url.split('?')[0];
  if (p.startsWith('/vendor/')) { res.writeHead(200, { 'Content-Type': 'text/javascript' }); res.end(FAKE_CLIENT); return; }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(readFileSync(join(dist, 'index.html')));
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}/`;

/* ---------- 3) browser flows ---------- */
const browser = await chromium.launch();
async function device() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  await ctx.exposeFunction('__sb', s => JSON.stringify(handle(JSON.parse(s))));
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(String(e)));
  pg.on('dialog', d => d.accept());
  await pg.goto(base);
  return pg;
}
const txt = pg => pg.innerText('#app');
const waitFor = (pg, js, t = 8000) => pg.waitForFunction(js, null, { timeout: t }).then(() => true, () => false);
const saved = pg => waitFor(pg, "Cloud.status === 'saved' && !Cloud._inflight && JSON.stringify(sharedState(state)) === Cloud.lastJson");
async function signUp(pg, name, email, pass) {
  await pg.click('.login-form .seg button[data-v="signup"]');
  await pg.fill('#auth-name', name); await pg.fill('#auth-email', email); await pg.fill('#auth-pass', pass);
  await pg.click('#auth-form button[type=submit]');
}
async function signIn(pg, email, pass) {
  await pg.fill('#auth-email', email); await pg.fill('#auth-pass', pass);
  await pg.click('#auth-form button[type=submit]');
}
const wsOf = email => [...DB.workspaces.values()].find(w => w.owner_id === DB.users.find(u => u.email === email).id);

// Sign up (Alice, device A)
const A = await device();
ok((await txt(A)).includes('Welcome back'), 'cloud build starts on the sign-in screen');
ok(await A.evaluate('state === null && !localStorage.getItem("northstar-hcms-state")'), 'no demo data before sign-in');
await signUp(A, 'Alice', 'alice@example.com', 'short');
ok(await waitFor(A, "document.getElementById('auth-msg').textContent.includes('at least 10')"), 'weak password message');
const t0 = Date.now();
await A.fill('#auth-pass', 'correct-horse-1');
await A.click('#auth-form button[type=submit]');
ok(await waitFor(A, 'state && Cloud.ws && document.querySelector(".topbar")', 5000), 'sign up lands in a workspace within 5 s');
console.log(`Sign-up → dashboard: ${Date.now() - t0} ms`);
ok(await A.evaluate("Cloud.ws.name === 'My workspace' && Cloud.ws.role === 'owner' && state.tasks.length === 1 && state.companies[0].name === 'Longevity project'"), 'new workspace seeded with sample data');
ok(await A.evaluate("me().role === 'ceo'"), 'acts as the CEO persona by default');
ok(!('session' in wsOf('alice@example.com').state), 'session is not stored in the cloud');
await A.screenshot({ path: join(tmp, 'dashboard.png') });

// Change → autosave → reload keeps it
await A.evaluate("state.settings.budgetAlertPct = 77; createTask({ title: 'Cloud test task', assigneeId: 'u_piseth', companyId: 'c_lp', departmentId: 'd_tech', due: TODAY_S, priority: 'medium' }); render()");
ok(await saved(A), 'change autosaves');
ok(wsOf('alice@example.com').state.settings.budgetAlertPct === 77 && wsOf('alice@example.com').revision === 2, 'server has the change (revision 2)');
const rpcBefore = DB.rpcCalls;
await A.evaluate("go('tasks'); go('finance'); go('dashboard')");
await A.waitForTimeout(2000);
ok(DB.rpcCalls === rpcBefore, 'navigating without changes does not save');
await A.evaluate("login('u_snakeman')");   // Act as… is per person: stays in this browser
await A.waitForTimeout(1800);
await A.reload();
ok(await waitFor(A, 'state && Cloud.ws'), 'still signed in after reload');
ok(await A.evaluate("state.settings.budgetAlertPct === 77 && state.tasks.some(t => t.title === 'Cloud test task')"), 'change survives reload');
ok(await A.evaluate("me().id === 'u_snakeman'"), 'Act as persona remembered in this browser');

// Second device (B): wrong password, then sign in
const B = await device();
await signIn(B, 'alice@example.com', 'wrong-password-1');
ok(await waitFor(B, "document.getElementById('auth-msg').textContent.includes('Wrong email or password')"), 'wrong password message');
await signIn(B, 'alice@example.com', 'correct-horse-1');
ok(await waitFor(B, 'state && Cloud.ws'), 'sign in on a second device');
ok(await B.evaluate("state.settings.budgetAlertPct === 77 && me().role === 'ceo'"), 'second device sees the saved data (own persona)');

// Conflict: A saves, then stale B saves
await A.evaluate("state.settings.budgetAlertPct = 81; render()"); ok(await saved(A), 'A saves');
await B.evaluate("state.settings.budgetAlertPct = 65; render()");
ok(await waitFor(B, "Cloud.status === 'conflict'"), 'stale device gets a conflict');
ok(wsOf('alice@example.com').state.settings.budgetAlertPct === 81, 'no silent overwrite');
ok((await B.innerText('.topbar')).includes('Reload to get the latest'), 'conflict shown in the top bar');

// Bob: duplicate email, own workspace, isolation
const C = await device();
await signUp(C, 'Bob', 'ALICE@example.com', 'another-pass-1');
ok(await waitFor(C, "document.getElementById('auth-msg').textContent.includes('already exists')"), 'existing email message');
await C.fill('#auth-email', 'bob@example.com'); await C.click('#auth-form button[type=submit]');
ok(await waitFor(C, 'state && Cloud.ws'), 'Bob signs up');
ok(await C.evaluate('Cloud.workspaces.length === 1'), 'Bob sees only his own workspace');
const aliceWs = wsOf('alice@example.com').id;
const direct = await C.evaluate(`Cloud.sb.from('workspaces').select('id, name')`);
ok(direct.data.length === 1 && direct.data[0].id !== aliceWs, 'direct select as Bob returns only his workspace');
ok((await C.evaluate(`Cloud.sb.rpc('save_workspace', { ws: '${aliceWs}', new_state: {}, expected_revision: 1, new_schema_version: 4 })`)).error, 'Bob cannot save Alice\'s workspace');

// Invite Bob as viewer → read-only; then editor → can save
await A.reload(); await waitFor(A, 'state && Cloud.ws');
await A.evaluate("App.ui.setTab = 'system'; go('settings')");
ok(await waitFor(A, "document.querySelector('#content').innerText.includes('Alice') && document.querySelector('#content').innerText.includes('(you)')"), 'members list shows the owner');
await A.fill('#ws-invite-email', 'nobody@example.com'); await A.click('form button[type=submit] >> text=Invite');
ok(await waitFor(A, "document.getElementById('toasts').innerText.includes('sign up first')"), 'inviting an unknown email explains why');
await A.fill('#ws-invite-email', 'bob@example.com'); await A.selectOption('#ws-invite-role', 'viewer'); await A.click('form button[type=submit] >> text=Invite');
ok(await waitFor(A, "document.querySelector('#content').innerText.includes('bob@example.com')"), 'invited Bob appears in members');
await A.screenshot({ path: join(tmp, 'workspace.png'), fullPage: true });
await A.evaluate("ACT['user-menu']()"); await A.waitForTimeout(500); await A.screenshot({ path: join(tmp, 'account.png') }); await A.evaluate('closeModal()');
await C.reload(); await waitFor(C, 'state && Cloud.ws');
ok(await C.evaluate('Cloud.workspaces.length === 2'), 'Bob sees the shared workspace in his switcher');
await C.evaluate(`cloudOpen('${aliceWs}')`);
ok(await waitFor(C, `Cloud.ws.id === '${aliceWs}' && state`), 'Bob opens Alice\'s workspace');
ok(await C.evaluate('Cloud.ws.readOnly'), 'viewer is read-only');
ok((await C.innerText('#content')).includes('View only'), 'view-only banner');
const revV = wsOf('alice@example.com').revision;
await C.evaluate("state.settings.budgetAlertPct = 5; render()"); await C.waitForTimeout(2000);
ok(wsOf('alice@example.com').revision === revV, 'viewer changes are not saved');
await A.selectOption('#ws-invite-role', 'editor'); await A.fill('#ws-invite-email', 'bob@example.com'); await A.click('form button[type=submit] >> text=Invite');
await waitFor(A, "document.getElementById('toasts').innerText.includes('added as editor')");
await C.reload(); await waitFor(C, `state && Cloud.ws && Cloud.ws.id === '${aliceWs}'`);
ok(await C.evaluate("Cloud.ws.role === 'editor' && !Cloud.ws.readOnly"), 'editor can edit (last workspace reopened)');
await C.evaluate("state.settings.budgetAlertPct = 90; render()");
ok(await saved(C) && wsOf('alice@example.com').state.settings.budgetAlertPct === 90, 'editor saves to the shared workspace');

// Old version → choose reset
wsOf('bob@example.com').schema_version = 3;
await C.evaluate(`cloudOpen('${wsOf('bob@example.com').id}')`);
ok(await waitFor(C, "Cloud.screen === 'old-version'") && (await txt(C)).includes('older version'), 'older workspace asks what to do');
await C.click('[data-act="cloud-old"][data-v="reset"]');
ok(await waitFor(C, 'state && Cloud.ws') && await saved(C), 'reset saves fresh sample data');
ok(wsOf('bob@example.com').schema_version === (await C.evaluate('VERSION')), 'schema version updated');

// Sign out clears this browser
await A.evaluate("ACT.logout()");
ok(await waitFor(A, "state === null && Cloud.screen === 'auth'"), 'sign out returns to sign-in');
const leftovers = await A.evaluate("Object.keys(localStorage).filter(k => k !== 'northstar-theme')");
ok(leftovers.length === 0, 'no workspace or session data left in localStorage: ' + leftovers.join(', '));
ok((await txt(A)).includes('Welcome back'), 'sign-in screen after sign out');
await A.screenshot({ path: join(tmp, 'signin.png') });

await browser.close(); server.close();
console.log('Screenshots:', join(tmp, 'signin.png'), join(tmp, 'dashboard.png'));
console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'No page errors');
console.log(fails.length ? 'FAILED:\n' + fails.join('\n') : 'All cloud checks passed');
if (!fails.length && !errors.length) rmSync(join(tmp, 'b1'), { recursive: true, force: true });
process.exit(errors.length || fails.length ? 1 : 0);
