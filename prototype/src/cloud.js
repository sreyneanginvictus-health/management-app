/* =====================================================================
   Cloud mode — real accounts + cloud-saved workspaces (Supabase)
   Active only when the build inlined window.HQ_CONFIG (handoff §15 P0).
   Everywhere else (npm run dev without env vars, the Artifact, tests)
   the app stays in demo mode with browser-only storage.

   A workspace = one row in public.workspaces holding the whole shared
   `state` as JSON. Access control is row-level security in the database;
   this file only ever uses the publishable key.
   ===================================================================== */
const Cloud = {
  enabled: false,
  sb: null,
  user: null,          // Supabase auth user
  workspaces: [],      // [{ id, name, role, ownerId, updatedAt }]
  ws: null,            // open workspace { id, name, role, ownerId, revision, readOnly }
  screen: 'loading',   // shown while no workspace is open: loading | auth | recovery | old-version | error
  authTab: 'signin',   // signin | signup | forgot
  authMsg: null,       // { text, ok }
  busy: false,
  error: '',
  oldRow: null,        // workspace saved by another app version, waiting for a choice
  status: 'saved',     // saved | saving | error | conflict | readonly
  savedAt: null,
  lastJson: null,      // last shared state the server confirmed
  members: null, membersFor: null, membersErr: '',
  _t: null, _retry: null, _inflight: false, _again: false, _retryDelay: 5000,
};
const SESSION_PREFIX = 'northstar-session:';
const LAST_WS_PREFIX = 'northstar-last-ws:';
const SAVE_DELAY_MS = 1500;

(function cloudInit() {
  const cfg = typeof window !== 'undefined' && window.HQ_CONFIG;
  if (!cfg) return;
  Cloud.enabled = true;
  STORE = Store.cloud = { load: () => state, save: () => cloudQueueSave(), clear: () => { } };
  if (!window.supabase || !window.supabase.createClient) {
    Cloud.screen = 'error'; Cloud.error = 'The sign-in library did not load. Check your internet connection and reload the page.'; return;
  }
  Cloud.recovery = /type=recovery/.test(location.hash);
  Cloud.sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  Cloud.sb.auth.onAuthStateChange((event, session) => {
    // Never await Supabase calls inside this callback (the client holds a lock) — defer instead.
    if (event === 'PASSWORD_RECOVERY') { Cloud.recovery = true; Cloud.user = session && session.user; cloudShow('recovery'); }
    else if (event === 'SIGNED_OUT' && Cloud.user) setTimeout(() => cloudAfterSignOut('You were signed out.'), 0);
  });
  addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') cloudFlush(); });
  addEventListener('beforeunload', ev => { if (cloudHasUnsaved()) { cloudFlush(); ev.preventDefault(); ev.returnValue = ''; } });
  setInterval(cloudPaintStatus, 10000);
})();

/* ---------- boot + screens ---------- */
async function cloudBoot() {
  if (!Cloud.sb) { render(); return; }
  cloudShow('loading');
  const { data, error } = await Cloud.sb.auth.getSession();
  if (Cloud.recovery) { Cloud.user = data.session && data.session.user; cloudShow('recovery'); return; }
  if (error || !data.session) { cloudShow('auth'); return; }
  await cloudEnter(data.session.user);
}
function cloudShow(screen) { state = null; Cloud.screen = screen; closeModal(); closeDrawer(); render(); }
function cloudFail(what, error) {
  const m = (error && error.message) || String(error || '');
  Cloud.error = what + (/relation .* does not exist|Could not find the (table|function)/i.test(m)
    ? ' The database is not set up yet: run supabase/migrations in the Supabase SQL Editor (handoff §15 P0.1).'
    : m ? ' (' + m + ')' : '');
  cloudShow('error');
}

/* ---------- accounts ---------- */
function authError(error) {
  const m = (error && error.message) || String(error || '');
  if (/invalid login credentials/i.test(m)) return 'Wrong email or password.';
  if (/already (been )?registered|already exists/i.test(m)) return 'An account with this email already exists. Sign in instead.';
  if (/email not confirmed/i.test(m)) return 'Confirm your email first: open the link we sent you, then sign in.';
  if (/password/i.test(m) && /(at least|weak|should|characters|pwned|guess)/i.test(m)) return 'Password is too weak: ' + m;
  if (/rate limit|too many/i.test(m)) return 'Too many attempts. Wait a minute and try again.';
  if (/valid email|invalid format|email address .* invalid/i.test(m)) return 'Enter a valid email address.';
  if (/failed to fetch|networkerror|load failed/i.test(m)) return 'Cannot reach the server. Check your internet connection.';
  return m || 'Something went wrong. Try again.';
}
async function cloudSignIn(email, password) {
  const { data, error } = await Cloud.sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(authError(error));
  await cloudEnter(data.user);
}
async function cloudSignUp(email, password, displayName) {
  const { data, error } = await Cloud.sb.auth.signUp({ email, password, options: { data: { display_name: displayName }, emailRedirectTo: location.origin + location.pathname } });
  if (error) throw new Error(authError(error));
  if (!data.session) return 'confirm';   // "Confirm email" is on: they must click the link first
  await cloudEnter(data.user);
  return 'in';
}
async function cloudResetPassword(email) {
  const { error } = await Cloud.sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
  if (error) throw new Error(authError(error));
}
async function cloudSetNewPassword(password) {
  const { data, error } = await Cloud.sb.auth.updateUser({ password });
  if (error) throw new Error(authError(error));
  Cloud.recovery = false;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
  await cloudEnter(data.user);
}
async function cloudSignOut() {
  await cloudFlush();
  if (cloudHasUnsaved() && !confirm('Some changes are not saved yet. Sign out anyway?')) return;
  Cloud.user = null;   // so the SIGNED_OUT event doesn't run the cleanup twice
  try { await Cloud.sb.auth.signOut(); } catch (e) { }
  cloudAfterSignOut();
}
function cloudAfterSignOut(msg) {
  clearTimeout(Cloud._t); clearTimeout(Cloud._retry);
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(SESSION_PREFIX) || k.startsWith(LAST_WS_PREFIX) || k === STORE_KEY)) localStorage.removeItem(k);
    }
  } catch (e) { }
  Object.assign(Cloud, { user: null, workspaces: [], ws: null, lastJson: null, members: null, membersFor: null, authTab: 'signin', authMsg: msg ? { text: msg } : null, status: 'saved' });
  App.ui = {}; App.route = { page: 'dashboard' }; App.drawer = null;
  cloudShow('auth');
}

/* ---------- workspaces ---------- */
async function cloudEnter(user) {
  Cloud.user = user; cloudShow('loading');
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
  if (!(await cloudListWorkspaces())) return;
  if (!Cloud.workspaces.length) {
    // §13 #12: new accounts start with the sample data
    if (!(await cloudCreateWorkspace('My workspace'))) return;
    if (!(await cloudListWorkspaces())) return;
  }
  let last = null; try { last = localStorage.getItem(LAST_WS_PREFIX + user.id); } catch (e) { }
  const target = Cloud.workspaces.find(w => w.id === last) || Cloud.workspaces[0];
  await cloudOpen(target.id);
}
async function cloudListWorkspaces() {
  const { data, error } = await Cloud.sb.from('workspace_members').select('role, workspaces(id, name, owner_id, updated_at)').eq('user_id', Cloud.user.id);
  if (error) { cloudFail('Could not load your workspaces.', error); return false; }
  Cloud.workspaces = (data || []).filter(r => r.workspaces).map(r => ({ id: r.workspaces.id, name: r.workspaces.name, ownerId: r.workspaces.owner_id, updatedAt: r.workspaces.updated_at, role: r.role }))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return true;
}
async function cloudCreateWorkspace(name) {
  const s = seedState();
  // The id is made here: the new row isn't readable until the owner-membership trigger has run.
  const { error } = await Cloud.sb.from('workspaces').insert({ id: crypto.randomUUID(), name, owner_id: Cloud.user.id, state: sharedState(s), schema_version: VERSION });
  if (error) { cloudFail('Could not create your workspace.', error); return false; }
  return true;
}
async function cloudOpen(id) {
  if (state) await cloudFlush();
  const { data, error } = await Cloud.sb.from('workspaces').select('id, name, owner_id, state, schema_version, revision, updated_at').eq('id', id).single();
  if (error) { cloudFail('Could not open the workspace.', error); return; }
  const meta = Cloud.workspaces.find(w => w.id === id);
  const role = (meta && meta.role) || 'viewer';
  Cloud.ws = { id: data.id, name: data.name, ownerId: data.owner_id, role, revision: data.revision, readOnly: role === 'viewer' };
  Cloud.members = null; Cloud.membersFor = null;
  try { localStorage.setItem(LAST_WS_PREFIX + Cloud.user.id, id); } catch (e) { }
  if (data.schema_version !== VERSION || !data.state || data.state.version !== VERSION) { Cloud.oldRow = data; cloudShow('old-version'); return; }
  cloudActivate(data.state, data.updated_at);
}
// Old-version choice: 'reset' = replace with fresh sample data (editors), 'keep' = open it read-only.
function cloudResolveOld(choice) {
  const row = Cloud.oldRow; Cloud.oldRow = null; if (!row) return;
  if (choice === 'reset' && Cloud.ws.role !== 'viewer') { cloudActivate(sharedState(seedState()), row.updated_at); Cloud.lastJson = null; saveState(); toast('Workspace reset to sample data'); }
  else { Cloud.ws.readOnly = true; cloudActivate(row.state || seedState(), row.updated_at); }
}
function cloudActivate(shared, updatedAt) {
  state = shared;
  let sess = null; try { sess = JSON.parse(localStorage.getItem(SESSION_PREFIX + Cloud.ws.id) || 'null'); } catch (e) { }
  const persona = (state.users || []).find(u => u.role === 'ceo' && u.active !== false) || (state.users || [])[0] || { id: null };
  state.session = Object.assign({ userId: persona.id, companyFilter: 'all' }, sess || {});
  if (!state.users.some(u => u.id === state.session.userId && u.active !== false)) state.session.userId = persona.id;
  Cloud.lastJson = JSON.stringify(sharedState(state));
  Cloud.savedAt = updatedAt ? new Date(updatedAt).getTime() : Date.now();
  Cloud.status = Cloud.ws.readOnly ? 'readonly' : 'saved';
  Cloud.screen = null;
  App.ui = {}; App.route = { page: 'dashboard' }; App.drawer = null;
  try { runDeadlineSweep(); } catch (e) { console.error(e); }
  closeModal(); closeDrawer(); render(); window.scrollTo(0, 0);
}
async function cloudRename(name) {
  name = String(name || '').trim().slice(0, 80);
  if (!name) throw new Error('Enter a name.');
  const { error } = await Cloud.sb.from('workspaces').update({ name }).eq('id', Cloud.ws.id);
  if (error) throw new Error(error.message);
  Cloud.ws.name = name; const w = Cloud.workspaces.find(x => x.id === Cloud.ws.id); if (w) w.name = name;
}

/* ---------- members ---------- */
async function cloudLoadMembers() {
  const ws = Cloud.ws; if (!ws) return;
  Cloud.membersFor = ws.id; Cloud.membersErr = '';
  let { data, error } = await Cloud.sb.rpc('workspace_members_list', { ws: ws.id });
  if (error) {
    // Migration 0002 not applied yet: fall back to ids + roles only.
    const r = await Cloud.sb.from('workspace_members').select('user_id, role, added_at').eq('workspace_id', ws.id);
    data = r.data; Cloud.membersErr = r.error ? r.error.message : 'Names and emails appear after migration 0002 is applied.';
  }
  if (Cloud.ws !== ws) return;
  Cloud.members = (data || []).sort((a, b) => ({ owner: 0, editor: 1, viewer: 2 }[a.role] - { owner: 0, editor: 1, viewer: 2 }[b.role]));
}
async function cloudInvite(email, role) {
  const { error } = await Cloud.sb.rpc('invite_member', { ws: Cloud.ws.id, member_email: email, member_role: role });
  if (error) throw new Error(error.message);
  await cloudLoadMembers();
}
async function cloudRemoveMember(userId) {
  const { error } = await Cloud.sb.from('workspace_members').delete().eq('workspace_id', Cloud.ws.id).eq('user_id', userId);
  if (error) throw new Error(error.message);
  await cloudLoadMembers();
}

/* ---------- autosave ---------- */
function cloudSaveSession() { if (Cloud.ws && state) try { localStorage.setItem(SESSION_PREFIX + Cloud.ws.id, JSON.stringify(state.session)); } catch (e) { } }
function cloudQueueSave() {
  if (!Cloud.ws || !state) return;
  cloudSaveSession();
  if (Cloud.ws.readOnly || Cloud.status === 'conflict') return;
  clearTimeout(Cloud._t); Cloud._t = setTimeout(cloudFlush, SAVE_DELAY_MS);
}
function cloudHasUnsaved() {
  if (!Cloud.ws || !state || Cloud.ws.readOnly) return false;
  return Cloud._inflight || JSON.stringify(sharedState(state)) !== Cloud.lastJson;
}
async function cloudFlush() {
  clearTimeout(Cloud._t); clearTimeout(Cloud._retry);
  const ws = Cloud.ws;
  if (!ws || !state || ws.readOnly || Cloud.status === 'conflict') return;
  if (Cloud._inflight) { Cloud._again = true; return; }
  const json = JSON.stringify(sharedState(state));
  if (json === Cloud.lastJson) return;
  Cloud._inflight = true; Cloud.status = 'saving'; cloudPaintStatus();
  let res;
  try { res = await Cloud.sb.rpc('save_workspace', { ws: ws.id, new_state: JSON.parse(json), expected_revision: ws.revision, new_schema_version: VERSION }); }
  catch (e) { res = { error: e }; }
  Cloud._inflight = false;
  if (Cloud.ws !== ws) return;   // switched workspace or signed out meanwhile
  const { data, error } = res;
  if (error) {
    const m = String(error.message || error);
    if (/conflict/i.test(m)) { Cloud.status = 'conflict'; toast('Changed in another tab or device — reload to get the latest. Autosave is paused.', true); }
    else if (/read-only/i.test(m) || error.code === '42501') { ws.readOnly = true; Cloud.status = 'readonly'; toast('View only: your changes are not saved.', true); render(); }
    else { Cloud.status = 'error'; Cloud._retry = setTimeout(cloudFlush, Cloud._retryDelay); Cloud._retryDelay = Math.min(Cloud._retryDelay * 2, 60000); }
    cloudPaintStatus(); return;
  }
  ws.revision = data; Cloud.lastJson = json; Cloud.savedAt = Date.now(); Cloud.status = 'saved'; Cloud._retryDelay = 5000;
  cloudPaintStatus();
  if (Cloud._again) { Cloud._again = false; cloudQueueSave(); }
}
function cloudStatusHtml() {
  if (!Cloud.ws) return '';
  const s = Cloud.status;
  if (s === 'readonly') return '<span class="save-status ro" data-tip="You are a viewer in this workspace. Changes are not saved.">' + icon('lock') + 'View only</span>';
  if (s === 'conflict') return '<button class="save-status bad" data-act="cloud-reload" data-tip="Someone saved this workspace from another tab or device. Reload to get the latest; your last changes here are not saved.">' + icon('alert') + 'Reload to get the latest</button>';
  if (s === 'error') return '<button class="save-status bad" data-act="cloud-retry" data-tip="Retrying automatically. Click to retry now.">' + icon('alert') + 'Not saved</button>';
  if (s === 'saving') return '<span class="save-status">' + icon('repeat') + 'Saving…</span>';
  const secs = Math.max(0, Math.round((Date.now() - (Cloud.savedAt || Date.now())) / 1000));
  return '<span class="save-status ok" data-tip="Saved to workspace “' + esc(Cloud.ws.name) + '”">' + icon('check') + 'Saved · ' + (secs < 60 ? secs + ' s ago' : ago(new Date(Cloud.savedAt).toISOString())) + '</span>';
}
function cloudPaintStatus() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('[data-save-status]').forEach(el => { el.innerHTML = cloudStatusHtml(); });
}
