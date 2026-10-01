/* =====================================================================
   Negroni — core: helpers, store, permissions, audit, engines
   Architecture note: everything reads/writes one normalized `state`
   object (collections keyed like DB tables). Swapping localStorage for
   an API later only touches load/save + the engine functions below.
   ===================================================================== */
'use strict';
const VERSION = 7;
const STORE_KEY = 'northstar-hcms-state';

/* ---------- date + format helpers ---------- */
const z2 = n => String(n).padStart(2, '0');
function ymd(d) { return d.getFullYear() + '-' + z2(d.getMonth() + 1) + '-' + z2(d.getDate()); }
function parseD(s) { if (!s) return null; const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
const TODAY = startOfDay(new Date());
const TODAY_S = ymd(TODAY);
const CUR_YEAR = TODAY.getFullYear();
const CUR_MONTH = TODAY.getMonth(); // 0-based
function rel(n) { return ymd(addDays(TODAY, n)); }
function daysUntil(s) { return Math.round((parseD(s) - TODAY) / 864e5); }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_L = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function fmtDate(s) { if (!s) return '—'; const d = parseD(s); return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); }
function fmtShort(s) { if (!s) return '—'; const d = parseD(s); return MONTHS[d.getMonth()] + ' ' + d.getDate(); }
function fmtDT(iso) { if (!iso) return '—'; const d = new Date(iso); return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() + ' · ' + z2(d.getHours()) + ':' + z2(d.getMinutes()); }
function ago(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago'; if (s < 86400 * 7) return Math.floor(s / 86400) + 'd ago';
  return fmtDate(iso.slice(0, 10));
}
function dueLabel(s) {
  const n = daysUntil(s);
  if (n < 0) return Math.abs(n) + 'd overdue'; if (n === 0) return 'Due today'; if (n === 1) return 'Due tomorrow';
  return 'Due in ' + n + 'd';
}
function money(n, opt) {
  opt = opt || {};
  const cur = (typeof state !== 'undefined' && state && state.settings.currencySymbol) || '$';
  const neg = n < 0; const a = Math.abs(n || 0);
  let s;
  if (opt.compact && a >= 1e6) s = (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'M';
  else if (opt.compact && a >= 1e4) s = (a / 1e3).toFixed(a >= 1e5 ? 0 : 1) + 'k';
  else s = a.toLocaleString('en-US', { minimumFractionDigits: opt.cents ? 2 : 0, maximumFractionDigits: opt.cents ? 2 : 0 });
  return (neg ? (opt.paren ? '(' : '−') : '') + cur + s + (neg && opt.paren ? ')' : '');
}
function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }
function fmtPct(v, dp) { return (v == null || isNaN(v)) ? '—' : (v).toFixed(dp == null ? 0 : dp) + '%'; }
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let _fakeNow = null;
function nowISO() { return _fakeNow || new Date().toISOString(); }
let _uidc = 0;
function uid(p) { return p + '_' + Date.now().toString(36).slice(-4) + (++_uidc).toString(36) + Math.random().toString(36).slice(2, 5); }
function sum(arr, f) { let t = 0; for (const x of arr) t += f ? f(x) : x; return t; }
function groupBy(arr, f) { const m = {}; for (const x of arr) { const k = f(x); (m[k] = m[k] || []).push(x); } return m; }
function uniq(a) { return [...new Set(a)]; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function titleCase(s) { return String(s).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }

/* ---------- store ----------
   Storage adapter. Store.local = this browser only (demo mode, the Artifact, tests).
   cloud.js swaps in Store.cloud when window.HQ_CONFIG is present (real accounts, Supabase).
   `state.session` (who you are acting as, company filter) is per person: the cloud adapter
   strips it before saving and keeps it in this browser. */
let state = null;
const Store = {
  local: {
    load() {
      try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw) { const s = JSON.parse(raw); if (s && s.version === VERSION) return s; }
      } catch (e) { /* storage unavailable — fall back to fresh seed */ }
      return seedState();
    },
    _t: null,
    save(s) { clearTimeout(this._t); this._t = setTimeout(() => { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { } }, 120); },
    clear() { try { localStorage.removeItem(STORE_KEY); } catch (e) { } },
  },
  cloud: null,
};
let STORE = Store.local;
// The shared part of the state (everything except the per-person session).
function sharedState(s) { const o = Object.assign({}, s); delete o.session; return o; }
function loadState() { return STORE.load(); }
function saveState() { if (state) STORE.save(state); }
// Replace all sample records with an empty workspace (keeps people, roles, accounts chart, settings and who you are acting as).
function clearSampleData() {
  const sess = state && state.session; state = blankState(); if (sess) state.session = sess;
  audit('reset', 'workspace', 'data', 'Cleared all sample data — empty workspace ready for real data');
  saveState();
}
function resetState() { STORE.clear(); const sess = state && state.session; state = seedState(); if (STORE !== Store.local && sess) state.session = sess; saveState(); }

/* ---------- lookups ---------- */
function get(coll, id) { return state[coll].find(x => x.id === id); }
function user(id) { return state.users.find(u => u.id === id) || { id, name: 'Unknown', role: 'member', initials: '?', color: '#888' }; }
function company(id) { return state.companies.find(c => c.id === id) || { id, name: '—', short: '—' }; }
function dept(id) { return state.departments.find(d => d.id === id) || { id, name: '—' }; }
function project(id) { return state.projects.find(p => p.id === id); }
function me() { return user(state.session.userId); }

/* ---------- roles & permissions ---------- */
const PERMISSIONS = [
  { key: 'dashboard.view', label: 'View dashboard', group: 'Core' },
  { key: 'tasks.view', label: 'View tasks', group: 'Work' },
  { key: 'tasks.create', label: 'Create & assign tasks', group: 'Work' },
  { key: 'projects.view', label: 'View projects', group: 'Work' },
  { key: 'projects.manage', label: 'Create & manage projects', group: 'Work' },
  { key: 'approvals.view', label: 'Use Approval Center', group: 'Approvals' },
  { key: 'approvals.view_all', label: 'See all requests in scope', group: 'Approvals' },
  { key: 'operations.view', label: 'Operations & risks', group: 'Operations' },
  { key: 'finance.view', label: 'View finance & accounting', group: 'Finance' },
  { key: 'finance.manage', label: 'Record, post & reverse transactions', group: 'Finance' },
  { key: 'finance.confidential', label: 'Open confidential finance docs', group: 'Finance' },
  { key: 'budget.view_own', label: 'See own department budget', group: 'Finance' },
  { key: 'reports.view', label: 'Operational reports & KPIs', group: 'Reports' },
  { key: 'reports.finance', label: 'Financial reports', group: 'Reports' },
  { key: 'kpi.update', label: 'Update KPI actuals', group: 'Reports' },
  { key: 'companies.view', label: 'View companies', group: 'Organization' },
  { key: 'companies.manage', label: 'Add companies & departments', group: 'Organization' },
  { key: 'people.view', label: 'View people directory', group: 'Organization' },
  { key: 'people.manage', label: 'Add & edit people', group: 'Organization' },
  { key: 'documents.view', label: 'Documents', group: 'Core' },
  { key: 'calendar.view', label: 'Calendar', group: 'Core' },
  { key: 'fhub.view', label: 'Financial System (IFRS statements, tax)', group: 'Financial System' },
  { key: 'fhub.manage', label: 'Edit chart of accounts & tax assumptions', group: 'Financial System' },
  { key: 'overview.view', label: 'Financial Overview report', group: 'Financial System' },
  { key: 'overview.note', label: 'Add notes to the overview report', group: 'Financial System' },
  { key: 'settings.admin', label: 'Administer rules & permissions', group: 'Admin' },
  { key: 'audit.view', label: 'View audit log', group: 'Admin' },
];
const ALL_PERMS = PERMISSIONS.map(p => p.key);
function defaultRoles() {
  const base = ['dashboard.view', 'tasks.view', 'approvals.view', 'documents.view', 'calendar.view'];
  const r = {
    ceo: { label: 'CEO', level: 5, defaultScope: 'holding', perms: ALL_PERMS.slice() },
    cto: { label: 'CTO', level: 4, defaultScope: 'holding', perms: base.concat(['tasks.create', 'projects.view', 'projects.manage', 'approvals.view_all', 'operations.view', 'reports.view', 'kpi.update', 'companies.view', 'people.view', 'budget.view_own']) },
    cmo: { label: 'CMO', level: 4, defaultScope: 'holding', perms: [] },  // same permissions as the CTO (filled in below)
    // Financial position: everything in finance plus the Financial System (IFRS statements, tax) and the overview report
    financial: { label: 'Financial', level: 4, defaultScope: 'holding', perms: base.concat(['tasks.create', 'projects.view', 'approvals.view_all', 'operations.view', 'finance.view', 'finance.manage', 'finance.confidential', 'budget.view_own', 'reports.view', 'reports.finance', 'companies.view', 'people.view', 'audit.view', 'fhub.view', 'fhub.manage', 'overview.view', 'overview.note']) },
    // Accounting position: standard bookkeeping (transactions, invoices, bills, bank, budgets) and operations — no Financial System
    accounting: { label: 'Accounting', level: 3, defaultScope: 'holding', perms: base.concat(['tasks.create', 'projects.view', 'operations.view', 'finance.view', 'finance.manage', 'budget.view_own', 'companies.view', 'people.view']) },
    manager: { label: 'Manager', level: 3, defaultScope: 'department', perms: base.concat(['tasks.create', 'projects.view', 'projects.manage', 'operations.view', 'reports.view', 'kpi.update', 'companies.view', 'people.view', 'budget.view_own']) },
    member: { label: 'Team Member', level: 1, defaultScope: 'self', perms: base.concat(['projects.view']) },
    // Investor: reads the Financial Overview and answers notes; sees nothing else
    investor: { label: 'Investor', level: 0, defaultScope: 'holding', perms: ['overview.view'] },
  };
  r.cmo.perms = r.cto.perms.slice();
  return r;
}
const ROLE_KEYS = ['ceo', 'cto', 'cmo', 'financial', 'accounting', 'manager', 'member', 'investor'];
const FINANCE_ROLES = ['financial', 'accounting'];
const SCOPES = { holding: 'Entire holding', company: 'Own company', department: 'Own department', self: 'Own work only' };
function roleLabel(r) { return (state.roles[r] || {}).label || titleCase(r); }
function can(perm, u) { u = u || me(); const r = state.roles[u.role]; return !!(r && r.perms.includes(perm)); }

/* ---------- scope ---------- */
function scopeCompanyIds(u) {
  u = u || me();
  if (u.scope === 'holding') return state.companies.map(c => c.id);
  return [u.companyId];
}
function activeCompanyIds() {
  const ids = scopeCompanyIds();
  const f = state.session.companyFilter;
  return (f && f !== 'all' && ids.includes(f)) ? [f] : ids;
}
function inActive(cid) { return activeCompanyIds().includes(cid); }
function deptTree(did) { const out = [did]; for (const d of state.departments) if (d.parentId === did) out.push(...deptTree(d.id)); return out; }
function subordinates(uid, acc) {
  acc = acc || [];
  for (const u of state.users) if (u.managerId === uid && !acc.includes(u.id)) { acc.push(u.id); subordinates(u.id, acc); }
  return acc;
}
function isHoldingWide() { return me().scope === 'holding'; }

function canSeeUser(u, viewer) {
  viewer = viewer || me();
  if (u.id === viewer.id || u.id === viewer.managerId) return true;
  if (viewer.scope === 'holding') return true;
  if (viewer.scope === 'company') return u.companyId === viewer.companyId;
  if (viewer.scope === 'department') return deptTree(viewer.departmentId).includes(u.departmentId) || subordinates(viewer.id).includes(u.id);
  return false;
}
function visibleTask(t, u) {
  u = u || me();
  if (t.assigneeId === u.id || t.creatorId === u.id || t.reviewerId === u.id || (t.chain || []).some(c => c.from === u.id || c.to === u.id)) return true;
  if (u.scope === 'self') return false;
  if (u.scope === 'department') return deptTree(u.departmentId).includes(t.departmentId) || subordinates(u.id).includes(t.assigneeId);
  return scopeCompanyIds(u).includes(t.companyId);
}
function visibleProject(p, u) {
  u = u || me();
  if (p.ownerId === u.id || (p.members || []).includes(u.id)) return true;
  if (u.scope === 'self') return state.tasks.some(t => t.projectId === p.id && t.assigneeId === u.id);
  if (u.scope === 'department') return deptTree(u.departmentId).includes(p.departmentId);
  return scopeCompanyIds(u).includes(p.companyId);
}
function visibleApproval(a, u) {
  u = u || me();
  if (a.requesterId === u.id) return true;
  if (a.steps.some(s => s.approverIds.includes(u.id) || s.actorId === u.id)) return true;
  if (!can('approvals.view_all', u)) {
    if (u.scope === 'department') return deptTree(u.departmentId).includes(a.departmentId);
    return false;
  }
  // confidential money requests stay with finance-cleared roles (configurable via permissions)
  if (['budget', 'payment', 'expense', 'contract'].includes(a.type) && !can('finance.view', u)) return false;
  return scopeCompanyIds(u).includes(a.companyId);
}
function tasksInView() { return state.tasks.filter(t => visibleTask(t) && inActive(t.companyId)); }
function projectsInView() { return state.projects.filter(p => visibleProject(p) && inActive(p.companyId)); }
function approvalsInView() { return state.approvals.filter(a => visibleApproval(a) && inActive(a.companyId)); }

/* ---------- audit + notifications ---------- */
function audit(action, type, entityId, summary, extra) {
  state.audit.unshift(Object.assign({ id: uid('au'), at: nowISO(), actorId: state.session.userId, action, type, entityId, summary }, extra || {}));
  if (state.audit.length > 4000) state.audit.length = 4000;
}
function historyOf(entityId) { return state.audit.filter(a => a.entityId === entityId); }
function notify(userIds, n) {
  const ids = uniq([].concat(userIds).filter(Boolean));
  for (const id of ids) {
    if (id === state.session.userId && !n.self) continue;
    const pr = (state.users.find(x => x.id === id) || {}).notifPrefs; if (pr && pr[n.type] === false) continue;
    state.notifications.unshift(Object.assign({ id: uid('nt'), userId: id, at: nowISO(), read: false }, n));
  }
}
function myNotifications() { return state.notifications.filter(n => n.userId === state.session.userId); }
function unreadCount() { return myNotifications().filter(n => !n.read).length; }

/* ---------- deadline reminders (run on login) ---------- */
function runDeadlineSweep() {
  const u = me(); const days = Number(state.settings.reminderDays) || 2;
  state.reminderKeys = state.reminderKeys || {};
  for (const t of state.tasks) {
    if (t.assigneeId !== u.id || ['completed', 'cancelled'].includes(t.status)) continue;
    const n = daysUntil(t.dueDate);
    let kind = null;
    if (n < 0) kind = 'overdue'; else if (n <= days) kind = 'deadline';
    if (!kind) continue;
    const key = u.id + ':' + t.id + ':' + kind + ':' + TODAY_S;
    if (state.reminderKeys[key]) continue;
    state.reminderKeys[key] = 1;
    state.notifications.unshift({ id: uid('nt'), userId: u.id, at: nowISO(), read: false, type: kind, title: (kind === 'overdue' ? 'Overdue: ' : 'Deadline approaching: ') + t.title, body: dueLabel(t.dueDate), link: { page: 'tasks', id: t.id } });
  }
  // budget alerts for finance / execs
  if (can('finance.view')) {
    const key = u.id + ':budget:' + TODAY_S;
    if (!state.reminderKeys[key]) {
      state.reminderKeys[key] = 1;
      const over = budgetRows(scopeCompanyIds(), CUR_YEAR).filter(b => b.util >= Number(state.settings.budgetAlertPct));
      if (over.length) state.notifications.unshift({ id: uid('nt'), userId: u.id, at: nowISO(), read: false, type: 'finance', title: over.length + ' budget lines at or above ' + state.settings.budgetAlertPct + '% utilization', body: 'Review Budget vs Actual', link: { page: 'finance', tab: 'budgets' } });
    }
    // cash runway alerts, one per company per day
    for (const r of lowCashCompanies(scopeCompanyIds())) {
      const ck = u.id + ':cash:' + r.companyId + ':' + TODAY_S;
      if (state.reminderKeys[ck]) continue;
      state.reminderKeys[ck] = 1;
      state.notifications.unshift({ id: uid('nt'), userId: u.id, at: nowISO(), read: false, type: 'finance', title: company(r.companyId).name + ' cash below ' + state.settings.cashAlertMonths + ' months of costs', body: money(r.cash, { compact: true }) + ' covers ' + fmtRunway(r.months) + ' at ' + money(r.burn, { compact: true }) + '/month', link: { page: 'finance', tab: 'cash' } });
    }
  }
}

/* =====================================================================
   TASK ENGINE — CEO → CTO → Manager → Member → Submit → Review → Done
   ===================================================================== */
const TASK_STATUS = {
  todo: { label: 'To do', cls: '' },
  in_progress: { label: 'In progress', cls: 'b-info' },
  submitted: { label: 'Awaiting review', cls: 'b-brand' },
  changes: { label: 'Changes requested', cls: 'b-warn' },
  blocked: { label: 'Blocked', cls: 'b-bad' },
  completed: { label: 'Completed', cls: 'b-good' },
};
const PRIORITY = { low: { label: 'Low', cls: '' }, medium: { label: 'Medium', cls: 'b-info' }, high: { label: 'High', cls: 'b-warn' }, critical: { label: 'Critical', cls: 'b-bad' } };
function isOverdue(t) { return t.status !== 'completed' && t.dueDate && daysUntil(t.dueDate) < 0; }

/* who may the current user delegate/assign work to */
function assignableUsers(u) {
  u = u || me();
  if (u.scope === 'holding' && state.roles[u.role].level >= 4) return state.users.filter(x => x.active !== false);
  const subs = subordinates(u.id);
  let pool = state.users.filter(x => subs.includes(x.id) || x.id === u.id);
  if (u.scope === 'company') pool = pool.concat(state.users.filter(x => x.companyId === u.companyId));
  if (u.role === 'manager') pool = pool.concat(state.users.filter(x => deptTree(u.departmentId).includes(x.departmentId)));
  if (u.scope === 'holding') pool = pool.concat(state.users.filter(x => scopeCompanyIds(u).includes(x.companyId) && state.roles[x.role].level <= state.roles[u.role].level));
  return uniq(pool.map(x => x.id)).map(user).filter(x => x.active !== false);
}
function reviewerFor(assigneeId, delegatorId) {
  // the person who handed the work down reviews it; never the assignee themself
  if (delegatorId && delegatorId !== assigneeId) return delegatorId;
  const a = user(assigneeId);
  return a.managerId || delegatorId || assigneeId;
}
function createTask(data) {
  const u = me();
  const t = Object.assign({
    id: uid('t'), key: 'T-' + (++state.counters.task), status: 'todo', progress: 0, approvalStatus: 'not_submitted',
    comments: [], attachments: [], chain: [], createdAt: nowISO(), creatorId: u.id, priority: 'medium',
  }, data);
  t.chain = [{ from: u.id, to: t.assigneeId, at: t.createdAt, note: 'Assigned' }];
  t.reviewerId = reviewerFor(t.assigneeId, u.id);
  state.tasks.unshift(t);
  audit('created', 'task', t.id, 'Created task “' + t.title + '” and assigned to ' + user(t.assigneeId).name);
  notify(t.assigneeId, { type: 'task', title: 'New task: ' + t.title, body: 'From ' + u.name + ' · ' + dueLabel(t.dueDate), link: { page: 'tasks', id: t.id } });
  return t;
}
function delegateTask(t, toId, note) {
  const u = me();
  t.chain.push({ from: u.id, to: toId, at: nowISO(), note: note || 'Delegated' });
  const prev = t.assigneeId;
  t.assigneeId = toId; t.reviewerId = reviewerFor(toId, u.id);
  if (t.status === 'submitted') { t.status = 'in_progress'; t.approvalStatus = 'not_submitted'; }
  audit('delegated', 'task', t.id, 'Delegated from ' + user(prev).name + ' to ' + user(toId).name + (note ? ' — ' + note : ''));
  notify(toId, { type: 'task', title: 'Task delegated to you: ' + t.title, body: 'From ' + u.name, link: { page: 'tasks', id: t.id } });
}
function setTaskStatus(t, status, note) {
  const old = t.status; if (old === status) return;
  t.status = status;
  if (status === 'in_progress' && !t.progress) t.progress = 10;
  audit('status', 'task', t.id, 'Status ' + TASK_STATUS[old].label + ' → ' + TASK_STATUS[status].label + (note ? ' — ' + note : ''));
  if (status === 'blocked') notify(t.reviewerId, { type: 'task', title: 'Blocked: ' + t.title, body: note || 'Assignee flagged a blocker', link: { page: 'tasks', id: t.id } });
}
function submitTask(t, note) {
  t.status = 'submitted'; t.approvalStatus = 'pending'; t.progress = Math.max(t.progress, 90); t.submittedAt = nowISO();
  if (note) t.comments.push({ id: uid('c'), userId: me().id, at: t.submittedAt, text: note, kind: 'submission' });
  audit('submitted', 'task', t.id, 'Submitted work for review by ' + user(t.reviewerId).name);
  notify(t.reviewerId, { type: 'approval', title: 'Review requested: ' + t.title, body: me().name + ' submitted work', link: { page: 'tasks', id: t.id } });
  if (!state.settings.taskReviewRequired) reviewTask(t, 'approve', 'Auto-approved (review not required)');
}
function canReviewTask(t, u) { u = u || me(); return t.status === 'submitted' && t.reviewerId === u.id && (u.id !== t.assigneeId || state.settings.allowSelfApproval); }
function reviewTask(t, decision, comment) {
  const now = nowISO();
  if (comment) t.comments.push({ id: uid('c'), userId: me().id, at: now, text: comment, kind: decision === 'approve' ? 'approval' : 'changes' });
  if (decision === 'approve') {
    t.status = 'completed'; t.approvalStatus = 'approved'; t.progress = 100; t.completedAt = now;
    audit('approved', 'task', t.id, 'Approved work — task completed');
    notify(t.assigneeId, { type: 'approval', title: 'Approved: ' + t.title, body: 'Reviewed by ' + me().name, link: { page: 'tasks', id: t.id } });
    // escalate completion up the delegation chain
    const upstream = uniq(t.chain.map(c => c.from)).filter(x => x !== me().id && x !== t.assigneeId);
    notify(upstream, { type: 'task', title: 'Completed: ' + t.title, body: 'Signed off by ' + me().name, link: { page: 'tasks', id: t.id } });
    if (t.recurrence) spawnRecurrence(t);
  } else {
    t.status = 'changes'; t.approvalStatus = 'changes_requested';
    audit('rejected', 'task', t.id, 'Requested changes' + (comment ? ' — ' + comment : ''));
    notify(t.assigneeId, { type: 'approval', title: 'Changes requested: ' + t.title, body: comment || '', link: { page: 'tasks', id: t.id } });
  }
}
function spawnRecurrence(t) {
  const step = { weekly: 7, biweekly: 14, monthly: 30, quarterly: 91 }[t.recurrence] || 30;
  const n = Object.assign({}, t, {
    id: uid('t'), key: 'T-' + (++state.counters.task), status: 'todo', progress: 0, approvalStatus: 'not_submitted', comments: [], attachments: [],
    startDate: ymd(addDays(parseD(t.dueDate), 1)), dueDate: ymd(addDays(parseD(t.dueDate), step)), createdAt: nowISO(), completedAt: null, submittedAt: null, recurOf: t.recurOf || t.id,
  });
  n.chain = [{ from: t.creatorId, to: t.assigneeId, at: n.createdAt, note: 'Recurring (' + t.recurrence + ')' }];
  state.tasks.unshift(n);
  audit('created', 'task', n.id, 'Recurring task generated from ' + t.key + ' (' + t.recurrence + ')');
  notify(n.assigneeId, { type: 'task', title: 'Next occurrence: ' + n.title, body: dueLabel(n.dueDate), link: { page: 'tasks', id: n.id } });
}

/* =====================================================================
   APPROVAL ENGINE — rules are data (Settings → Approval rules)
   ===================================================================== */
const APPROVAL_TYPES = {
  expense: { label: 'Expense', money: true }, purchase: { label: 'Purchase', money: true }, payment: { label: 'Payment', money: true },
  budget: { label: 'Budget', money: true }, hiring: { label: 'Hiring', money: true }, project: { label: 'Project', money: true },
  vendor: { label: 'Vendor', money: false }, contract: { label: 'Contract', money: true }, other: { label: 'Other request', money: false },
};
const APPROVER_ROLES = { manager: 'Direct manager', dept_head: 'Department head', finance: 'Finance', cto: 'CTO', cmo: 'CMO', ceo: 'CEO' };
function cmp(a, op, b) { a = Number(a) || 0; b = Number(b) || 0; return op === '>' ? a > b : op === '>=' ? a >= b : op === '<' ? a < b : op === '<=' ? a <= b : a === b; }
function sortedRules(type) {
  return state.settings.approvalRules.filter(r => r.type === type && r.enabled)
    .sort((x, y) => (y.cond ? 1 : 0) - (x.cond ? 1 : 0) || (y.cond ? Number(y.cond.value) : 0) - (x.cond ? Number(x.cond.value) : 0));
}
function matchRule(req) { return sortedRules(req.type).find(r => !r.cond || cmp(req.amount, r.cond.op, r.cond.value)) || null; }
function coversCompany(u, cid) { return u.scope === 'holding' || u.companyId === cid; }
function resolveApprovers(role, req) {
  const R = user(req.requesterId);
  const act = state.users.filter(u => u.active !== false);
  let ids = [];
  if (role === 'manager') ids = R.managerId ? [R.managerId] : [];
  else if (role === 'dept_head') { const d = dept(req.departmentId); ids = d.headId ? [d.headId] : []; }
  else if (role === 'finance') {
    const pick = r => act.filter(u => u.role === r && coversCompany(u, req.companyId) && u.id !== req.requesterId).map(u => u.id);
    ids = pick('financial'); if (!ids.length) ids = pick('accounting');
  } else if (role === 'ceo') {
    const local = act.filter(u => u.role === 'ceo' && u.scope === 'company' && u.companyId === req.companyId).map(u => u.id);
    const group = act.filter(u => u.role === 'ceo' && u.scope === 'holding').map(u => u.id);
    ids = local.filter(i => i !== req.requesterId).length ? local : group;
  } else ids = act.filter(u => u.role === role && coversCompany(u, req.companyId)).map(u => u.id);
  if (!state.settings.allowSelfApproval) ids = ids.filter(i => i !== req.requesterId);
  let escalated = false;
  if (!ids.length) {
    escalated = true;
    ids = act.filter(u => u.role === state.settings.escalationRole && u.id !== req.requesterId).map(u => u.id);
  }
  return { ids, escalated };
}
function buildSteps(req) {
  const rule = matchRule(req);
  const roles = rule ? rule.steps : ['manager'];
  const steps = [];
  for (const r of roles) {
    const { ids, escalated } = resolveApprovers(r, req);
    const prev = steps[steps.length - 1];
    if (prev && prev.approverIds.length === 1 && ids.length === 1 && prev.approverIds[0] === ids[0]) continue; // same person twice in a row
    steps.push({ role: r, approverIds: ids, escalated, status: 'waiting', actorId: null, at: null, comment: '' });
  }
  if (steps.length) steps[0].status = 'pending';
  return { ruleId: rule ? rule.id : null, steps };
}
function routePreview(req) {
  const { steps, ruleId } = buildSteps(req);
  const rule = state.settings.approvalRules.find(r => r.id === ruleId);
  return { steps, rule };
}
function createApproval(data, opts) {
  const u = me();
  const a = Object.assign({ id: uid('ap'), no: 'REQ-' + (++state.counters.approval), status: 'pending', requesterId: u.id, createdAt: nowISO(), attachments: [], currentStep: 0, comments: [] }, data);
  const b = buildSteps(a); a.steps = b.steps; a.ruleId = b.ruleId;
  state.approvals.unshift(a);
  const rule = state.settings.approvalRules.find(r => r.id === a.ruleId);
  audit('submitted', 'approval', a.id, 'Submitted ' + APPROVAL_TYPES[a.type].label.toLowerCase() + ' request “' + a.title + '”' + (a.amount ? ' for ' + money(a.amount) : '') + (rule ? ' · rule: ' + rule.name : ''));
  if (a.steps[0]) notify(a.steps[0].approverIds, { type: 'approval', title: 'Approval needed: ' + a.title, body: (a.amount ? money(a.amount) + ' · ' : '') + 'from ' + u.name, link: { page: 'approvals', id: a.id } });
  return a;
}
function canActOnApproval(a, u) {
  u = u || me();
  if (a.status !== 'pending') return false;
  const st = a.steps[a.currentStep]; if (!st) return false;
  if (!state.settings.allowSelfApproval && a.requesterId === u.id) return false;
  return st.approverIds.includes(u.id);
}
function decideApproval(a, decision, comment) {
  const u = me(); const st = a.steps[a.currentStep]; const now = nowISO();
  st.actorId = u.id; st.at = now; st.comment = comment || '';
  if (decision === 'approve') {
    st.status = 'approved';
    audit('approved', 'approval', a.id, 'Approved step ' + (a.currentStep + 1) + ' (' + APPROVER_ROLES[st.role] + ')' + (comment ? ' — ' + comment : ''));
    if (a.currentStep + 1 < a.steps.length) {
      a.currentStep++; a.steps[a.currentStep].status = 'pending';
      notify(a.steps[a.currentStep].approverIds, { type: 'approval', title: 'Approval needed: ' + a.title, body: (a.amount ? money(a.amount) + ' · ' : '') + 'approved by ' + u.name + ' at previous step', link: { page: 'approvals', id: a.id } });
      notify(a.requesterId, { type: 'approval', title: 'Step approved: ' + a.title, body: u.name + ' approved; now with ' + APPROVER_ROLES[a.steps[a.currentStep].role], link: { page: 'approvals', id: a.id } });
    } else {
      a.status = 'approved'; a.decidedAt = now;
      notify(a.requesterId, { type: 'approval', title: 'Approved: ' + a.title, body: 'Final approval by ' + u.name, link: { page: 'approvals', id: a.id } });
      applyApprovalEffects(a);
    }
  } else {
    st.status = 'rejected'; a.status = 'rejected'; a.decidedAt = now;
    for (let i = a.currentStep + 1; i < a.steps.length; i++) a.steps[i].status = 'skipped';
    audit('rejected', 'approval', a.id, 'Rejected at step ' + (a.currentStep + 1) + (comment ? ' — ' + comment : ''));
    notify(a.requesterId, { type: 'approval', title: 'Rejected: ' + a.title, body: (comment || '') + ' — ' + u.name, link: { page: 'approvals', id: a.id } });
  }
}
function cancelApproval(a) {
  a.status = 'cancelled'; a.steps.forEach(s => { if (s.status === 'pending' || s.status === 'waiting') s.status = 'skipped'; });
  audit('cancelled', 'approval', a.id, 'Request withdrawn by requester');
}
/* what an approved request does to the rest of the system */
function applyApprovalEffects(a) {
  if (['expense', 'purchase'].includes(a.type) && a.amount) {
    const acct = state.accounts.find(x => x.companyId === a.companyId && x.type === 'bank');
    const tx = createTransaction({ date: TODAY_S, companyId: a.companyId, departmentId: a.departmentId, kind: 'expense', category: a.category || (a.type === 'purchase' ? 'Property, plant & equipment' : 'Travel & entertainment'), amount: a.amount, accountId: acct && acct.id, party: a.vendor || user(a.requesterId).name, memo: a.title + ' (' + a.no + ')', approvalId: a.id, projectId: a.projectId, docs: (a.attachments || []).map(d => Object.assign({}, d)), status: 'draft' }, { silent: true });
    a.linkedTxId = tx.id;
    audit('created', 'transaction', tx.id, 'Draft ' + tx.no + ' created from approved request ' + a.no + ' — awaiting posting by Finance');
    notify(state.users.filter(x => FINANCE_ROLES.includes(x.role) && coversCompany(x, a.companyId)).map(x => x.id), { type: 'finance', title: 'Ready to post: ' + tx.no, body: money(a.amount) + ' · ' + a.title, link: { page: 'finance', tab: 'transactions', id: tx.id } });
  }
  if (a.type === 'payment' && a.billId) {
    const b = get('bills', a.billId);
    if (b) recordBillPayment(b, b.amount - b.paid, 'Paid under approval ' + a.no);
  }
  if (a.type === 'budget' && a.amount) {
    let line = state.budgets.find(x => x.companyId === a.companyId && x.departmentId === a.departmentId && x.category === a.category && x.year === CUR_YEAR);
    if (line) { line.amount += a.amount; }
    else { line = { id: uid('bg'), companyId: a.companyId, departmentId: a.departmentId, category: a.category || 'Marketing & branding', year: CUR_YEAR, amount: a.amount }; state.budgets.push(line); }
    audit('adjusted', 'budget', line.id, 'Budget increased by ' + money(a.amount) + ' via ' + a.no);
  }
  if (a.type === 'project' && a.projectId) {
    const p = project(a.projectId); if (p && p.status === 'proposed') { p.status = 'active'; audit('status', 'project', p.id, 'Project activated after approval ' + a.no); }
  }
  if (a.type === 'hiring') {
    notify(state.users.filter(x => x.departmentId === 'd_hq_hr').map(x => x.id), { type: 'approval', title: 'Hiring approved: ' + a.title, body: 'Open the requisition and start recruiting', link: { page: 'approvals', id: a.id } });
  }
}

/* =====================================================================
   FINANCE ENGINE — cash-basis ledger with immutable posted entries
   ===================================================================== */
/* Chart of accounts (state.coa, Financial System → Chart of accounts). A transaction's category is an account name;
   each account maps to an IFRS statement line (Invictus model, SFRS(I) = IFRS). Statement 'PL' = profit or loss,
   'SFP' = financial position (capex, loans, share capital — not in profit or loss). */
function coaAcct(name) { return (state.coa || []).find(a => a.name === name) || null; }
function coaLine(name) { const a = coaAcct(name); return a ? a.line : 'Other operating expenses'; }
function isNonPL(name) { const a = coaAcct(name); return !!(a && a.statement === 'SFP'); }
function cfSection(name) { const a = coaAcct(name); return (a && a.cf) || 'operating'; }
function revenueCats() { return (state.coa || []).filter(a => a.type === 'income').map(a => a.name); }
function expenseCats() { return (state.coa || []).filter(a => a.type === 'expense' || (a.type === 'sfp' && a.cf !== 'financing') || a.name === 'Repayment of borrowings').map(a => a.name); }
function createTransaction(data, opts) {
  const t = Object.assign({ id: uid('tx'), no: 'TX-' + String(++state.counters.tx).padStart(5, '0'), status: 'draft', docs: [], createdBy: state.session.userId, createdAt: nowISO() }, data);
  state.transactions.push(t);
  if (!(opts && opts.silent)) audit('created', 'transaction', t.id, 'Recorded ' + t.kind + ' ' + t.no + ' ' + money(t.amount) + ' (' + t.category + ') as draft');
  return t;
}
function canPost(t) { return t.status === 'draft' && (!state.settings.requireDocForPosting || (t.docs && t.docs.length)); }
function postTransaction(t) {
  t.status = 'posted'; t.postedBy = state.session.userId; t.postedAt = nowISO();
  audit('posted', 'transaction', t.id, 'Posted ' + t.no + ' ' + money(t.amount) + ' to ledger');
}
function reverseTransaction(t, reason) {
  const r = createTransaction({ date: TODAY_S, companyId: t.companyId, departmentId: t.departmentId, kind: t.kind, category: t.category, amount: -t.amount, accountId: t.accountId, party: t.party, memo: 'Reversal of ' + t.no + ' — ' + reason, reversalOf: t.id, docs: t.docs.slice(), status: 'posted', postedBy: state.session.userId, postedAt: nowISO(), projectId: t.projectId }, { silent: true });
  t.status = 'reversed'; t.reversedBy = r.id;
  audit('reversed', 'transaction', t.id, 'Reversed by ' + r.no + ' — ' + reason);
  audit('created', 'transaction', r.id, 'Reversal entry for ' + t.no + ' (' + money(-t.amount) + ')');
  return r;
}
function adjustTransaction(t, delta, reason) {
  const r = createTransaction({ date: TODAY_S, companyId: t.companyId, departmentId: t.departmentId, kind: t.kind, category: t.category, amount: delta, accountId: t.accountId, party: t.party, memo: 'Adjustment to ' + t.no + ' — ' + reason, adjustmentOf: t.id, docs: [], status: 'posted', postedBy: state.session.userId, postedAt: nowISO(), projectId: t.projectId }, { silent: true });
  (t.adjustments = t.adjustments || []).push(r.id);
  audit('adjusted', 'transaction', t.id, 'Adjusted by ' + r.no + ' (' + money(delta) + ') — ' + reason);
  audit('created', 'transaction', r.id, 'Adjustment entry for ' + t.no);
  return r;
}
function posted(tx) { return tx.status === 'posted' || tx.status === 'reversed'; } // reversed originals stay in ledger; the reversal entry offsets them
function txIn(companyIds, from, to) {
  return state.transactions.filter(t => posted(t) && companyIds.includes(t.companyId) && (!from || t.date >= from) && (!to || t.date <= to));
}
function pnl(companyIds, from, to) {
  const tx = txIn(companyIds, from, to);
  const rev = {}, exp = {};
  for (const t of tx) {
    if (isNonPL(t.category)) continue;
    if (t.kind === 'revenue') rev[t.category] = (rev[t.category] || 0) + t.amount;
    else exp[t.category] = (exp[t.category] || 0) + t.amount;
  }
  const revenue = sum(Object.values(rev)); const cogs = sum(Object.entries(exp).filter(([k]) => coaLine(k) === 'Cost of sales').map(([, v]) => v));
  const opex = sum(Object.entries(exp).filter(([k]) => coaLine(k) !== 'Cost of sales').map(([, v]) => v));
  return { rev, exp, revenue, cogs, gross: revenue - cogs, opex, expenses: cogs + opex, net: revenue - cogs - opex };
}
function monthRange(y, m) { return [y + '-' + z2(m + 1) + '-01', ymd(new Date(y, m + 1, 0))]; }
function monthlySeries(companyIds, months) {
  // months: array of {y,m}
  return months.map(({ y, m }) => { const [f, t] = monthRange(y, m); const p = pnl(companyIds, f, t); return { y, m, label: MONTHS[m], revenue: p.revenue, expenses: p.expenses, net: p.net }; });
}
function lastNMonths(n) { const out = []; for (let i = n - 1; i >= 0; i--) { const d = new Date(CUR_YEAR, CUR_MONTH - i, 1); out.push({ y: d.getFullYear(), m: d.getMonth() }); } return out; }
function ytdMonths(y) { y = y || CUR_YEAR; const last = y === CUR_YEAR ? CUR_MONTH : 11; const out = []; for (let m = 0; m <= last; m++) out.push({ y, m }); return out; }
function accountBalance(a, asOf) {
  let b = a.opening;
  for (const t of state.transactions) {
    if (t.accountId !== a.id || !posted(t) || (asOf && t.date > asOf)) continue;
    b += (t.kind === 'revenue' ? 1 : -1) * t.amount;
  }
  return b;
}
function cashPosition(companyIds, asOf) { return sum(state.accounts.filter(a => companyIds.includes(a.companyId)), a => accountBalance(a, asOf)); }
function invoiceStatus(i) {
  if (i.status === 'void') return 'void';
  if (i.paid >= i.amount) return 'paid';
  if (i.status === 'draft') return 'draft';
  if (daysUntil(i.dueDate) < 0) return 'overdue';
  return i.paid > 0 ? 'partial' : 'sent';
}
const DOC_STATUS = { draft: ['Draft', ''], sent: ['Open', 'b-info'], partial: ['Part paid', 'b-brand'], paid: ['Paid', 'b-good'], overdue: ['Overdue', 'b-bad'], void: ['Void', ''] };
function recordInvoicePayment(inv, amt, note) {
  inv.paid = Math.min(inv.amount, inv.paid + amt);
  const acct = state.accounts.find(x => x.companyId === inv.companyId && x.type === 'bank');
  const tx = createTransaction({ date: TODAY_S, companyId: inv.companyId, departmentId: inv.departmentId, kind: 'revenue', category: inv.category, amount: amt, accountId: acct && acct.id, party: inv.customer, memo: 'Receipt for ' + inv.number, docs: [{ id: uid('f'), name: inv.number + '-remittance.pdf', size: 88000 }], invoiceId: inv.id, status: 'draft' }, { silent: true });
  postTransaction(tx);
  audit('payment', 'invoice', inv.id, 'Recorded receipt ' + money(amt) + ' → ' + tx.no + (note ? ' — ' + note : ''));
  return tx;
}
function recordBillPayment(b, amt, note) {
  b.paid = Math.min(b.amount, b.paid + amt);
  const acct = state.accounts.find(x => x.companyId === b.companyId && x.type === 'bank');
  const tx = createTransaction({ date: TODAY_S, companyId: b.companyId, departmentId: b.departmentId, kind: 'expense', category: b.category, amount: amt, accountId: acct && acct.id, party: b.vendor, memo: 'Payment of ' + b.number, docs: [{ id: uid('f'), name: b.number + '.pdf', size: 120000 }], billId: b.id, status: 'draft' }, { silent: true });
  postTransaction(tx);
  audit('payment', 'bill', b.id, 'Paid ' + money(amt) + ' → ' + tx.no + (note ? ' — ' + note : ''));
  return tx;
}
function arOutstanding(ids) { return sum(state.invoices.filter(i => ids.includes(i.companyId) && !['void', 'draft'].includes(invoiceStatus(i))), i => i.amount - i.paid); }
function apOutstanding(ids) { return sum(state.bills.filter(i => ids.includes(i.companyId) && i.status !== 'void'), i => i.amount - i.paid); }
function aging(list) {
  const b = { current: 0, d30: 0, d60: 0, d90: 0 };
  for (const i of list) {
    const out = i.amount - i.paid; if (out <= 0 || i.status === 'void' || i.status === 'draft') continue;
    const od = -daysUntil(i.dueDate);
    if (od <= 0) b.current += out; else if (od <= 30) b.d30 += out; else if (od <= 60) b.d60 += out; else b.d90 += out;
  }
  return b;
}
function budgetRows(companyIds, year) {
  const [f, t] = [year + '-01-01', year + '-12-31'];
  const tx = txIn(companyIds, f, t).filter(x => x.kind === 'expense');
  const act = {};
  for (const x of tx) { const k = x.companyId + '|' + x.departmentId + '|' + x.category; act[k] = (act[k] || 0) + x.amount; }
  const elapsed = year === CUR_YEAR ? (CUR_MONTH + TODAY.getDate() / 31) / 12 : 1;
  return state.budgets.filter(b => b.year === year && companyIds.includes(b.companyId)).map(b => {
    const actual = act[b.companyId + '|' + b.departmentId + '|' + b.category] || 0;
    const util = b.amount ? actual / b.amount * 100 : 0;
    const forecast = elapsed ? actual / elapsed : actual;
    return Object.assign({}, b, { actual, util, remaining: b.amount - actual, forecast, variance: b.amount - forecast });
  });
}
function balanceSheet(ids, asOf) {
  const cash = cashPosition(ids, asOf);
  const ar = arOutstanding(ids); const ap = apOutstanding(ids);
  const cos = state.companies.filter(c => ids.includes(c.id));
  const fixed = sum(cos, c => c.fixedAssets || 0) + sum(txIn(ids, null, asOf).filter(t => cfSection(t.category) === 'investing'), t => t.amount);
  const loans = sum(cos, c => c.loans || 0) - sum(txIn(ids, null, asOf).filter(t => t.category === 'Repayment of borrowings'), t => t.amount);
  const capital = sum(cos, c => c.capital || 0);
  const assets = cash + ar + fixed; const liab = ap + loans;
  return { cash, ar, fixed, assets, ap, loans, liab, capital, retained: assets - liab - capital, equity: assets - liab };
}
function cashFlow(ids, from, to) {
  const tx = txIn(ids, from, to);
  const sec = { operating: { in: 0, out: 0 }, investing: { in: 0, out: 0 }, financing: { in: 0, out: 0 } };
  for (const t of tx) { const s = cfSection(t.category); if (t.kind === 'revenue') sec[s].in += t.amount; else sec[s].out += t.amount; }
  const opening = cashPosition(ids, ymd(addDays(parseD(from), -1)));
  const net = sum(Object.values(sec), s => s.in - s.out);
  return { sec, opening, net, closing: opening + net };
}

/* ---------- project metrics ---------- */
// Health thresholds are settings (Settings → Business rules), not code.
function projectHealth(m, p, st) {
  if (p.healthOverride) return p.healthOverride;
  if (p.status === 'completed') return 'on_track';
  const h = st.projectHealth || {};
  const n = (k, d) => (h[k] === undefined || h[k] === null || h[k] === '' ? d : Number(h[k]));
  const due = daysUntil(p.dueDate);
  if ((p.budget && m.spent > p.budget * n('offBudgetPct', 100) / 100) || m.overdue >= n('offOverdueTasks', 3) || (n('offPastDue', 1) && due < 0)) return 'off_track';
  if (m.overdue >= n('riskOverdueTasks', 1) || (p.budget && m.spent > p.budget * n('riskBudgetPct', 85) / 100) || (due < n('riskDaysToDue', 21) && m.progress < n('riskMinProgress', 70))) return 'at_risk';
  return 'on_track';
}
function projectStats(p) {
  const ts = state.tasks.filter(t => t.projectId === p.id);
  const done = ts.filter(t => t.status === 'completed').length;
  const overdue = ts.filter(isOverdue).length;
  const progress = ts.length ? Math.round(sum(ts, t => t.status === 'completed' ? 100 : t.progress) / ts.length) : (p.progress || 0);
  const spent = sum(state.transactions.filter(t => t.projectId === p.id && posted(t) && t.kind === 'expense'), t => t.amount) + (p.spentBase || 0);
  const health = projectHealth({ overdue, progress, spent }, p, state.settings);
  return { tasks: ts, total: ts.length, done, overdue, progress, spent, health };
}

/* ---------- cash runway (alert threshold is a setting) ---------- */
// Average monthly cash out (all posted expense entries, incl. capex and loan repayments) over the last N full months.
function monthlyBurn(companyIds, months) {
  months = months || Number(state.settings.runwayLookbackMonths) || 3;
  const first = lastNMonths(months + 1)[0]; // N full months back, excluding the current month
  const f = monthRange(first.y, first.m)[0];
  const t = ymd(addDays(parseD(monthRange(CUR_YEAR, CUR_MONTH)[0]), -1));
  return sum(txIn(companyIds, f, t).filter(x => x.kind === 'expense'), x => x.amount) / months;
}
function cashRunway(companyIds) {
  const cash = cashPosition(companyIds); const burn = monthlyBurn(companyIds);
  return { cash, burn, months: burn > 0 ? cash / burn : Infinity };
}
// Companies whose runway is below settings.cashAlertMonths (0 or blank = alert off).
function lowCashCompanies(companyIds) {
  const lim = Number(state.settings.cashAlertMonths);
  if (!lim) return [];
  return companyIds.map(id => Object.assign({ companyId: id }, cashRunway([id]))).filter(r => r.months < lim).sort((a, b) => a.months - b.months);
}
function fmtRunway(m) { return m === Infinity ? 'No recent costs' : (m < 10 ? m.toFixed(1) : Math.round(m)) + ' months'; }
const HEALTH = { on_track: ['On track', 'b-good'], at_risk: ['At risk', 'b-warn'], off_track: ['Off track', 'b-bad'] };
const PROJECT_STATUS = { proposed: ['Proposed', 'b-brand'], active: ['Active', 'b-info'], on_hold: ['On hold', 'b-warn'], completed: ['Completed', 'b-good'] };

/* ---------- KPI helpers ---------- */
function kpiStatus(k) {
  const v = k.values[k.values.length - 1];
  const good = k.direction === 'down' ? v <= k.target : v >= k.target;
  const near = k.direction === 'down' ? v <= k.target * 1.1 : v >= k.target * 0.9;
  return good ? 'good' : near ? 'warn' : 'bad';
}
function fmtKpi(k, v) { if (k.unit === '$') return money(v, { compact: true }); if (k.unit === '%') return v.toFixed(1) + '%'; return (Math.round(v * 10) / 10).toLocaleString('en-US') + (k.unit && k.unit !== '#' ? ' ' + k.unit : ''); }

/* =====================================================================
   FINANCIAL SYSTEM — IFRS / SFRS(I) statements from the ledger (Invictus model layout)
   The ledger is cash-basis; statements are management statements, not audited accounts.
   Rates and policies live in state.settings.fin (Financial System → Assumptions).
   ===================================================================== */
const IFRS_PL_OPEX = ['Marketing expenses', 'Distribution & logistics', 'Employee benefits expense', 'Professional fees', 'Occupancy & utilities', 'Technology & subscriptions', 'Travel & transport', 'Research & development', 'Other operating expenses'];
function finSet() { return state.settings.fin || {}; }
// Straight-line depreciation on capital purchases (useful life is an assumption).
function depreciation(ids, from, to) {
  const life = Math.max(1, Number(finSet().usefulLifeYears) || 5) * 12;
  const [f, t] = [parseD(from), parseD(to)];
  let total = 0;
  for (const x of txIn(ids, null, to)) {
    if (cfSection(x.category) !== 'investing' || x.kind !== 'expense') continue;
    const start = parseD(x.date); const monthly = x.amount / life;
    const mFrom = Math.max(0, (f.getFullYear() - start.getFullYear()) * 12 + f.getMonth() - start.getMonth());
    const mTo = Math.min(life, (t.getFullYear() - start.getFullYear()) * 12 + t.getMonth() - start.getMonth() + 1);
    if (mTo > mFrom) total += monthly * (mTo - mFrom);
  }
  return total;
}
function ifrsPL(ids, from, to) {
  const tx = txIn(ids, from, to).filter(t => !isNonPL(t.category));
  const by = {};
  for (const t of tx) { const l = coaLine(t.category); by[l] = (by[l] || 0) + (t.kind === 'revenue' ? t.amount : -t.amount); }
  const g = l => by[l] || 0;
  const revenue = g('Revenue'), cos = g('Cost of sales'), gross = revenue + cos, other = g('Other income');
  const opex = IFRS_PL_OPEX.map(l => [l, g(l)]); const opexTotal = sum(opex, o => o[1]);
  const ebitda = gross + other + opexTotal;
  const da = -depreciation(ids, from, to);
  const ebit = ebitda + da;
  const finInc = g('Finance income'), finCost = g('Finance costs');
  const pbt = ebit + finInc + finCost;
  const tax = -sgTax(pbt).tax;
  const profit = pbt + tax;
  return { revenue, cos, gross, grossPct: revenue ? gross / revenue * 100 : 0, other, opex, opexTotal, ebitda, da, ebit, finInc, finCost, pbt, tax, profit, netPct: revenue ? profit / revenue * 100 : 0 };
}
function ifrsSFP(ids, asOf) {
  const b = balanceSheet(ids, asOf);
  const accDep = depreciation(ids, '2000-01-01', asOf);
  const ppe = b.fixed - accDep;
  const cash = b.cash, recv = b.ar;
  const nonCurrent = ppe, current = cash + recv, assets = nonCurrent + current;
  const payables = b.ap, borrowings = b.loans, liab = payables + borrowings;
  const capital = b.capital, retained = assets - liab - capital;
  return { ppe, nonCurrent, recv, cash, current, assets, capital, retained, equity: capital + retained, payables, borrowings, liab, total: capital + retained + liab, check: assets - (capital + retained + liab) };
}
// IAS 7 indirect presentation. Operating cash is taken from the bank ledger; the reconciling line shows the difference.
function ifrsCF(ids, from, to) {
  const p = ifrsPL(ids, from, to); const c = cashFlow(ids, from, to);
  const operating = c.sec.operating.in - c.sec.operating.out;
  const investing = c.sec.investing.in - c.sec.investing.out;
  const financing = c.sec.financing.in - c.sec.financing.out;
  const pbtCash = p.pbt - p.tax; // tax is an estimate, not yet paid
  return { pbt: p.pbt, da: -p.da, workingCapital: operating - p.pbt + p.da, operating, investing, financing, net: operating + investing + financing, opening: c.opening, closing: c.opening + operating + investing + financing, pbtCash };
}
/* Singapore corporate income tax estimate (rates are assumptions to verify each Budget). */
function sgTax(chargeable, ya) {
  const fs = finSet(); const rate = Number(fs.citRate) || 0;
  ya = ya || CUR_YEAR + 1;
  const ci = Math.max(0, chargeable || 0);
  const firstYA = Number(fs.firstYA) || ya;
  const sute = Number(fs.useSUTE) && ya >= firstYA && ya < firstYA + 3;
  const [p1, p2] = sute ? [Number(fs.sute1) || 0, Number(fs.sute2) || 0] : [Number(fs.pte1) || 0, Number(fs.pte2) || 0];
  const [b1, b2] = sute ? [100000, 100000] : [10000, 190000];
  const exempt = Math.min(ci, b1) * p1 + Math.min(Math.max(ci - b1, 0), b2) * p2;
  const gross = Math.max(0, ci - exempt) * rate;
  const rebate = Math.min(gross * (Number(fs.rebatePct) || 0), Number(fs.rebateCap) || Infinity);
  return { chargeable: ci, scheme: sute ? 'Start-up tax exemption' : 'Partial tax exemption', exempt, taxable: Math.max(0, ci - exempt), rate, gross, rebate, tax: Math.max(0, gross - rebate) };
}
function gstStatus(ids) {
  const fs = finSet(); const rate = Number(fs.gstRate) || 0;
  const first = lastNMonths(12)[0];
  const turnover = sum(txIn(ids, monthRange(first.y, first.m)[0], TODAY_S).filter(t => t.kind === 'revenue' && (coaAcct(t.category) || {}).gst === 'SR'), t => t.amount);
  const registered = !!Number(fs.gstRegistered); const threshold = Number(fs.gstThreshold) || 0;
  const q = Math.floor(CUR_MONTH / 3); const qFrom = ymd(new Date(CUR_YEAR, q * 3, 1));
  const qtx = txIn(ids, qFrom, TODAY_S);
  const output = registered ? sum(qtx.filter(t => t.kind === 'revenue' && (coaAcct(t.category) || {}).gst === 'SR'), t => t.amount) * rate : 0;
  const input = registered ? sum(qtx.filter(t => t.kind === 'expense' && (coaAcct(t.category) || {}).gst === 'TX'), t => t.amount) * rate : 0;
  return { registered, rate, threshold, turnover, mustRegister: !registered && threshold && turnover > threshold, quarter: 'Q' + (q + 1) + ' ' + CUR_YEAR, output, input, net: output - input };
}

/* =====================================================================
   FINANCIAL OVERVIEW — short report for the CEO and investors, with notes on each point
   ===================================================================== */
const OVERVIEW_POINTS = [
  ['revenue', 'Revenue'], ['gross', 'Gross profit'], ['costs', 'Operating costs'], ['profit', 'Net profit'], ['cash', 'Cash in bank'], ['runway', 'Runway'],
];
const NOTE_KINDS = { check: 'Please check', feedback: 'Need feedback' };
function overviewPeriod(key) {
  const lm = lastNMonths(2)[0];
  if (key === 'last_month') { const [f, t] = monthRange(lm.y, lm.m); const pm = lastNMonths(3)[0]; const [pf, pt] = monthRange(pm.y, pm.m); return { key, label: MONTHS_L[lm.m] + ' ' + lm.y, from: f, to: t, prevFrom: pf, prevTo: pt, prevLabel: MONTHS_L[pm.m] }; }
  if (key === 'quarter') { const q = Math.floor(CUR_MONTH / 3); const f = ymd(new Date(CUR_YEAR, q * 3, 1)); const pf = ymd(new Date(CUR_YEAR, q * 3 - 3, 1)); const pt = ymd(addDays(parseD(f), -1)); return { key, label: 'Q' + (q + 1) + ' ' + CUR_YEAR + ' to date', from: f, to: TODAY_S, prevFrom: pf, prevTo: pt, prevLabel: 'last quarter' }; }
  if (key === 'ytd') return { key, label: 'Year to date ' + CUR_YEAR, from: CUR_YEAR + '-01-01', to: TODAY_S, prevFrom: (CUR_YEAR - 1) + '-01-01', prevTo: ymd(new Date(CUR_YEAR - 1, CUR_MONTH, TODAY.getDate())), prevLabel: 'same period ' + (CUR_YEAR - 1) };
  const [f] = monthRange(CUR_YEAR, CUR_MONTH); const [pf] = monthRange(lm.y, lm.m); const pt = ymd(new Date(lm.y, lm.m, Math.min(TODAY.getDate(), new Date(lm.y, lm.m + 1, 0).getDate())));
  return { key: 'month', label: MONTHS_L[CUR_MONTH] + ' ' + CUR_YEAR + ' to date', from: f, to: TODAY_S, prevFrom: pf, prevTo: pt, prevLabel: 'same days last month' };
}
function overviewFigures(ids, per) {
  const p = ifrsPL(ids, per.from, per.to), q = ifrsPL(ids, per.prevFrom, per.prevTo);
  const r = cashRunway(ids); const cashPrev = cashPosition(ids, per.prevTo);
  const pct = (a, b) => b ? (a - b) / Math.abs(b) * 100 : null;
  return {
    revenue: { value: p.revenue, prev: q.revenue, change: pct(p.revenue, q.revenue), good: 'up' },
    gross: { value: p.gross, prev: q.gross, change: pct(p.gross, q.gross), good: 'up', sub: fmtPct(p.grossPct, 1) + ' margin', marginPct: p.grossPct },
    costs: { value: -p.opexTotal, prev: -q.opexTotal, change: pct(-p.opexTotal, -q.opexTotal), good: 'down' },
    profit: { value: p.profit, prev: q.profit, change: pct(p.profit, q.profit), good: 'up', sub: fmtPct(p.netPct, 1) + ' net margin' },
    cash: { value: r.cash, prev: cashPrev, change: pct(r.cash, cashPrev), good: 'up' },
    runway: { value: r.months, runway: true, good: 'up', sub: money(r.burn, { compact: true }) + ' average monthly costs' },
  };
}
function canSeeNote(n, u) { u = u || me(); return n.authorId === u.id || n.audience.includes(u.role) || can('overview.note', u); }
function addReportNote(data) {
  const u = me();
  const n = Object.assign({ id: uid('rn'), authorId: u.id, createdAt: nowISO(), status: 'open', replies: [] }, data);
  (state.reportNotes = state.reportNotes || []).unshift(n);
  const label = (OVERVIEW_POINTS.find(p => p[0] === n.point) || [, n.point])[1];
  audit('created', 'report_note', n.id, NOTE_KINDS[n.kind] + ' note on ' + label + ' (' + n.periodLabel + ') for ' + n.audience.map(roleLabel).join(' & '));
  notify(state.users.filter(x => n.audience.includes(x.role) && x.active !== false).map(x => x.id), { type: 'report', title: NOTE_KINDS[n.kind] + ': ' + label, body: n.text.slice(0, 90) + ' — ' + u.name, link: { page: 'overview', id: n.id } });
  return n;
}
function replyReportNote(n, text) {
  const u = me();
  n.replies.push({ id: uid('rr'), userId: u.id, at: nowISO(), text });
  audit('commented', 'report_note', n.id, 'Replied to report note');
  notify([n.authorId].concat(n.replies.map(r => r.userId)).filter(id => id !== u.id), { type: 'report', title: u.name + ' replied on the financial overview', body: text.slice(0, 90), link: { page: 'overview', id: n.id } });
}
function resolveReportNote(n) {
  n.status = 'resolved'; n.resolvedBy = me().id; n.resolvedAt = nowISO();
  audit('resolved', 'report_note', n.id, 'Marked report note as done');
  if (n.authorId !== me().id) notify(n.authorId, { type: 'report', title: me().name + ' marked your note as done', body: n.text.slice(0, 90), link: { page: 'overview', id: n.id } });
}
