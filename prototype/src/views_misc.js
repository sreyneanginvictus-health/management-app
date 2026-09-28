/* =====================================================================
   Documents, Calendar, Notifications, Settings + boot
   ===================================================================== */
function allDocs() {
  const out = []; const fin = can('finance.view'); const conf = can('finance.confidential');
  let hidden = 0;
  for (const d of state.documents) {
    if (!scopeCompanyIds().includes(d.companyId)) continue;
    if (d.confidential && !conf && d.uploadedBy !== me().id) { hidden++; continue; }
    out.push({ id: d.id, name: d.name, companyId: d.companyId, source: 'Library', category: d.category, by: d.uploadedBy, at: d.at, size: d.size, confidential: d.confidential, link: d.linked });
  }
  for (const t of state.tasks) if (t.attachments.length && visibleTask(t)) t.attachments.forEach(f => out.push({ id: f.id, name: f.name, companyId: t.companyId, source: 'Task', category: t.key, by: f.by || t.assigneeId, at: f.at || t.createdAt, size: f.size, link: { type: 'task', id: t.id } }));
  for (const a of state.approvals) if (a.attachments.length && visibleApproval(a)) a.attachments.forEach(f => out.push({ id: f.id, name: f.name, companyId: a.companyId, source: 'Request', category: a.no, by: f.by || a.requesterId, at: f.at || a.createdAt, size: f.size, link: { type: 'approval', id: a.id } }));
  if (fin) {
    for (const t of state.transactions) if (scopeCompanyIds().includes(t.companyId) && t.date >= rel(-120)) t.docs.forEach(f => out.push({ id: f.id, name: f.name, companyId: t.companyId, source: 'Finance', category: t.no, by: t.createdBy, at: (t.postedAt || t.date + 'T12:00:00'), size: f.size, confidential: true, link: { type: 'transaction', id: t.id } }));
    for (const i of state.invoices.concat(state.bills)) if (scopeCompanyIds().includes(i.companyId)) (i.docs || []).forEach(f => out.push({ id: f.id, name: f.name, companyId: i.companyId, source: 'Finance', category: i.number, by: 'u_linh', at: (i.issueDate || i.date) + 'T12:00:00', size: f.size, confidential: true, link: { type: i.customer ? 'invoice' : 'bill', id: i.id } }));
  }
  out.sort((a, b) => a.at < b.at ? 1 : -1);
  return { docs: out, hidden };
}
VIEWS.documents = function () {
  const f = App.ui.df || (App.ui.df = { src: 'all', q: '', company: 'all' });
  const { docs, hidden } = allDocs();
  let rows = docs.filter(d => inActive(d.companyId));
  if (f.src !== 'all') rows = rows.filter(d => d.source === f.src);
  if (f.company !== 'all') rows = rows.filter(d => d.companyId === f.company);
  if (f.q) { const q = f.q.toLowerCase(); rows = rows.filter(d => (d.name + ' ' + d.category).toLowerCase().includes(q)); }
  const srcs = [['all', 'All'], ['Library', 'Library'], ['Task', 'Task files'], ['Request', 'Request files']].concat(can('finance.view') ? [['Finance', 'Finance (last 120 days)']] : []);
  let h = pageHead('Documents', 'Company library plus every file attached to tasks, requests and financial records you can access', '<button class="btn primary" data-act="doc-upload">' + icon('plus') + 'Upload to library</button>');
  h += '<div class="filters">' + segEl(srcs, f.src, 'df-src') + (activeCompanyIds().length > 1 ? selectEl('df-co', companyOptions(null, true), f.company, 'data-act-change="df" data-k="company" aria-label="Company"') : '') + '<input class="input" id="df-q" placeholder="Search file name or reference" value="' + esc(f.q) + '" data-act-input="df" data-k="q"></div>';
  if (hidden) h += noticeEl(hidden + ' confidential document' + (hidden > 1 ? 's are' : ' is') + ' hidden for your role.', '', 'lock') + '<div style="height:12px"></div>';
  h += card('', tableEl([
    { h: 'File', v: d => '<div class="row" style="flex-wrap:nowrap;gap:10px"><div class="ico-box">' + icon('file') + '</div><div style="min-width:0"><b>' + esc(d.name) + '</b><div class="muted small">' + Math.max(1, Math.round((d.size || 0) / 1000)) + ' KB</div></div></div>' },
    { h: 'Source', v: d => badge(d.source, { Library: 'b-brand', Task: 'b-info', Request: 'b-warn', Finance: 'b-good' }[d.source], true) + (d.confidential ? ' ' + icon('lock').replace('<svg', '<svg width="12" height="12" style="vertical-align:-1px"') : '') },
    { h: 'Reference', v: d => d.link ? '<button class="link" data-act="open" data-t="' + d.link.type + '" data-id="' + d.link.id + '">' + esc(d.category) + '</button>' : esc(d.category) },
    { h: 'Company', v: d => companyTag(d.companyId) }, { h: 'Added by', v: d => person(d.by) }, { h: 'Added', nowrap: 1, v: d => fmtDate(d.at.slice(0, 10)) },
  ], rows, { pageSize: 25, pageKey: 'dpg', empty: 'No documents match.' }), { flush: true });
  return h;
};
ACT['df-src'] = el => { App.ui.df.src = el.dataset.v; App.ui.dpg = 0; render(); };
CHANGE.df = el => { App.ui.df[el.dataset.k] = el.value; App.ui.dpg = 0; render(); };
ACT['doc-upload'] = () => {
  App.ui.pendingFiles = null;
  openModal(modalShell('Upload to library', '<div class="form-grid">' + field('Files', '<label class="btn sm" style="align-self:flex-start">' + icon('clip') + 'Choose files<input type="file" hidden multiple data-upload="modal"></label><div id="pending-files" class="stack" style="gap:6px"></div>', { full: 1, hint: 'The prototype stores file name and size only.' }) + field('Company', selectF('companyId', companyOptions(scopeCompanyIds()), me().companyId)) + field('Category', selectF('category', ['Policy', 'Contract', 'Board', 'Finance', 'Project', 'Compliance', 'Operations', 'Vendor', 'Other'])) + field('Link to project', selectF('projectId', [['', 'None']].concat(projectsInView().map(p => [p.id, p.name])), '')) + '<label class="check" style="align-self:end"><input type="checkbox" class="toggle" name="confidential" id="f_confidential"> Confidential (finance-cleared roles only)</label></div>', '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="doc-save">Upload</button>'));
};
ACT['doc-save'] = () => {
  const v = formVals(); const files = App.ui.pendingFiles || []; if (!files.length) { toast('Choose at least one file', true); return; }
  files.forEach(fl => { const d = { id: uid('doc'), name: fl.name, companyId: v.companyId, category: v.category, uploadedBy: me().id, at: nowISO(), size: fl.size, confidential: v.confidential, linked: v.projectId ? { type: 'project', id: v.projectId } : null }; state.documents.unshift(d); audit('uploaded', 'document', d.id, 'Uploaded ' + d.name + (d.confidential ? ' (confidential)' : '')); });
  App.ui.pendingFiles = null; closeModal(); toast(files.length + ' file(s) added'); render();
};

/* ---------- calendar ---------- */
VIEWS.calendar = function () {
  const cm = App.ui.calMonth || TODAY_S.slice(0, 7);
  const [y, m] = cm.split('-').map(Number);
  const f = App.ui.calf || (App.ui.calf = { task: true, project: true, event: true, finance: can('finance.view'), mine: me().scope === 'self' });
  const items = calendarItems(f);
  const first = new Date(y, m - 1, 1); const start = addDays(first, -((first.getDay() + 6) % 7));
  let grid = '<div class="cal">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => '<div class="dow">' + d + '</div>').join('');
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i); const ds = ymd(d); const its = items.filter(x => x.date === ds);
    if (i >= 35 && d.getMonth() !== m - 1) break;
    grid += '<div class="day ' + (d.getMonth() !== m - 1 ? 'out' : '') + (ds === TODAY_S ? ' today' : '') + '"><span class="dn">' + d.getDate() + '</span>' + its.slice(0, 4).map(x => '<button class="ev ' + x.cls + '" data-act="open" data-t="' + x.t + '" data-id="' + x.id + '" title="' + esc(x.label) + '">' + esc(x.label) + '</button>').join('') + (its.length > 4 ? '<span class="muted" style="font-size:10.5px">+' + (its.length - 4) + ' more</span>' : '') + '</div>';
  }
  grid += '</div>';
  const agenda = items.filter(x => x.date >= TODAY_S && x.date <= rel(14)).sort((a, b) => a.date < b.date ? -1 : 1);
  let h = pageHead('Calendar', 'Deadlines, milestones, meetings and payment dates in one place', '');
  h += '<div class="filters"><button class="btn sm" data-act="cal-nav" data-v="-1">' + icon('arrowL') + '</button><b style="min-width:150px;text-align:center">' + MONTHS_L[m - 1] + ' ' + y + '</b><button class="btn sm" data-act="cal-nav" data-v="1">' + icon('arrowR') + '</button><button class="btn sm ghost" data-act="cal-today">Today</button><span class="spacer"></span>' +
    [['task', 'Tasks'], ['project', 'Projects'], ['event', 'Events']].concat(can('finance.view') ? [['finance', 'Invoices & bills']] : []).map(([k, l]) => '<button class="chip ' + (f[k] ? 'on' : '') + '" data-act="cal-f" data-k="' + k + '">' + l + '</button>').join('') + (me().scope !== 'self' ? '<button class="chip ' + (f.mine ? 'on' : '') + '" data-act="cal-f" data-k="mine">Only mine</button>' : '') + '</div>';
  h += '<div class="grid g-2-1" style="align-items:start">' + card('', '<div class="table-wrap">' + '<div style="min-width:560px">' + grid + '</div></div>', { flush: true }) + card('Next 14 days', agenda.length ? '<div class="list">' + agenda.map(x => '<div class="li clickable" data-act="open" data-t="' + x.t + '" data-id="' + x.id + '"><div style="width:44px;text-align:center;flex:none"><div class="eyebrow">' + MONTHS[parseD(x.date).getMonth()] + '</div><b style="font-size:18px">' + parseD(x.date).getDate() + '</b></div><div class="grow"><div class="ttl">' + esc(x.label) + '</div><div class="meta">' + esc(x.meta) + '</div></div></div>').join('') + '</div>' : emptyState('Nothing scheduled.'), { flush: true }) + '</div>';
  return h;
};
function calendarItems(f) {
  const out = []; const u = me(); const ids = activeCompanyIds();
  if (f.task) for (const t of tasksInView()) { if (f.mine && t.assigneeId !== u.id) continue; if (t.status === 'completed') continue; out.push({ date: t.dueDate, t: 'task', id: t.id, label: t.title, cls: isOverdue(t) ? 'task overdue' : 'task', meta: 'Task due · ' + user(t.assigneeId).name }); }
  if (f.project) for (const p of projectsInView()) { if (f.mine && p.ownerId !== u.id && !p.members.includes(u.id)) continue; out.push({ date: p.dueDate, t: 'project', id: p.id, label: '◆ ' + p.name, cls: 'project', meta: 'Project deadline · ' + company(p.companyId).short }); }
  if (f.event) for (const e of state.events) if (ids.includes(e.companyId)) out.push({ date: e.date, t: 'event', id: e.id, label: e.title, cls: 'event', meta: company(e.companyId).short });
  if (f.finance && can('finance.view')) {
    for (const i of state.invoices) if (ids.includes(i.companyId) && !['paid', 'void', 'draft'].includes(invoiceStatus(i))) out.push({ date: i.dueDate, t: 'invoice', id: i.id, label: '↓ ' + i.number + ' ' + money(i.amount - i.paid, { compact: true }), cls: 'finance', meta: 'Receivable due · ' + i.customer });
    for (const b of state.bills) if (ids.includes(b.companyId) && b.paid < b.amount) out.push({ date: b.dueDate, t: 'bill', id: b.id, label: '↑ ' + b.vendor + ' ' + money(b.amount - b.paid, { compact: true }), cls: 'finance', meta: 'Bill due · ' + b.number });
  }
  return out;
}
Object.assign(ACT, {
  'cal-nav': el => { const [y, m] = (App.ui.calMonth || TODAY_S.slice(0, 7)).split('-').map(Number); const d = new Date(y, m - 1 + Number(el.dataset.v), 1); App.ui.calMonth = d.getFullYear() + '-' + z2(d.getMonth() + 1); render(); },
  'cal-today': () => { App.ui.calMonth = TODAY_S.slice(0, 7); render(); },
  'cal-f': el => { App.ui.calf[el.dataset.k] = !App.ui.calf[el.dataset.k]; render(); },
});
DRAWERS.event = function (id) { const e = get('events', id); if (!e) return ''; return drawerHead('Event · ' + esc(company(e.companyId).name), esc(e.title)) + '<div class="drawer-b">' + card('', '<dl class="dl"><dt>Date</dt><dd>' + fmtDate(e.date) + '</dd><dt>Company</dt><dd>' + esc(company(e.companyId).name) + '</dd></dl>') + '</div>'; };
const _openEntity = openEntity;
openEntity = function (type, id) { if (type === 'event') { openDrawer('event', id); return; } _openEntity(type, id); };

/* ---------- notifications ---------- */
const NOTIF_TYPES = { task: ['Tasks', 'check'], approval: ['Approvals', 'stamp'], deadline: ['Deadlines', 'clock'], overdue: ['Overdue', 'alert'], finance: ['Finance alerts', 'coins'], report: ['Reports', 'chart'] };
VIEWS.notifications = function () {
  const f = App.ui.nf || 'all';
  let ns = myNotifications();
  const unread = ns.filter(n => !n.read).length;
  if (f === 'unread') ns = ns.filter(n => !n.read); else if (f !== 'all') ns = ns.filter(n => n.type === f || (f === 'deadline' && n.type === 'overdue'));
  let h = pageHead('Notifications', unread + ' unread', '<button class="btn" data-act="notif-all-read"' + (unread ? '' : ' disabled') + '>' + icon('ok') + 'Mark all as read</button>');
  h += tabsEl([['all', 'All'], ['unread', 'Unread', unread], ['task', 'Tasks'], ['approval', 'Approvals'], ['deadline', 'Deadlines']].concat(can('finance.view') ? [['finance', 'Finance']] : []).concat([['report', 'Reports']]), f, 'nf');
  h += card('', ns.length ? '<div class="list">' + ns.slice(0, 120).map(n => { const [, ic] = NOTIF_TYPES[n.type] || ['', 'bell']; return '<div class="li clickable" data-act="mark-read" data-id="' + n.id + '" style="' + (n.read ? '' : 'background:var(--brand-soft)') + '"><div class="ico-box ' + (n.type === 'overdue' ? 'bad' : n.type === 'deadline' ? 'warn' : n.type === 'finance' ? 'good' : '') + '">' + icon(ic) + '</div><div class="grow"><div class="ttl" style="' + (n.read ? 'font-weight:500' : '') + '">' + esc(n.title) + '</div><div class="meta">' + esc(n.body || '') + '</div></div><span class="muted small nowrap">' + ago(n.at) + '</span></div>'; }).join('') + '</div>' : emptyState('No notifications here.'), { flush: true });
  return h;
};
ACT.nf = el => { App.ui.nf = el.dataset.v; render(); };
ACT['notif-all-read'] = () => { myNotifications().forEach(n => n.read = true); render(); };

/* ---------- settings ---------- */
VIEWS.settings = function () {
  const admin = can('settings.admin');
  const tabs = [['profile', 'My profile']];
  if (admin) tabs.push(['rules', 'Approval rules'], ['business', 'Business rules'], ['roles', 'Roles & permissions']);
  if (can('audit.view')) tabs.push(['audit', 'Audit log']);
  tabs.push(['system', 'System & data']);
  let tab = App.ui.setTab || 'profile'; if (!tabs.some(t => t[0] === tab)) tab = 'profile';
  let h = pageHead('Settings', admin ? 'Business rules are data, not code — change them here without a release.' : 'Your profile and preferences');
  h += tabsEl(tabs, tab, 'set-tab');
  return h + ({ profile: setProfile, rules: setRules, business: setBusiness, roles: setRoles, audit: setAudit, system: setSystem }[tab])();
};
ACT['set-tab'] = el => { App.ui.setTab = el.dataset.v; render(); };
function setProfile() {
  const u = me(); const prefs = u.notifPrefs || {};
  return '<div class="grid g2">' + card('Profile', '<div class="row" style="gap:14px;margin-bottom:14px">' + avatar(u, 'lg') + '<div><div class="strong" style="font-size:16px">' + esc(u.name) + '</div><div class="muted">' + esc(u.title) + '</div></div></div><dl class="dl"><dt>Email (login)</dt><dd>' + esc(u.email) + '</dd><dt>Company</dt><dd>' + esc(company(u.companyId).name) + '</dd><dt>Department</dt><dd>' + esc(dept(u.departmentId).name) + '</dd><dt>Manager</dt><dd>' + (u.managerId ? esc(user(u.managerId).name) : '—') + '</dd><dt>Role</dt><dd>' + esc(roleLabel(u.role)) + '</dd><dt>Data scope</dt><dd>' + esc(SCOPES[u.scope]) + '</dd></dl><p class="muted small" style="margin-bottom:0">Role, company and manager are managed by People administrators.</p>') +
    card('Notification preferences', '<div class="stack" style="gap:12px">' + Object.entries(NOTIF_TYPES).filter(([k]) => k !== 'finance' || can('finance.view')).map(([k, [l]]) => '<label class="check" style="justify-content:space-between"><span>' + l + '</span><input type="checkbox" class="toggle" data-act-change="notif-pref" data-k="' + k + '"' + (prefs[k] === false ? '' : ' checked') + '></label>').join('') + '</div><p class="muted small">Deadline reminders are sent ' + state.settings.reminderDays + ' days before due ' + cfg() + '</p>') + '</div>';
}
CHANGE['notif-pref'] = el => { const u = me(); u.notifPrefs = u.notifPrefs || {}; u.notifPrefs[el.dataset.k] = el.checked; saveState(); toast('Preference saved'); };
function setRules() {
  const rules = state.settings.approvalRules;
  const test = App.ui.ruleTest || { type: 'expense', amount: 2400, requesterId: 'u_tomas' };
  const tu = user(test.requesterId);
  const prev = routePreview({ type: test.type, amount: Number(test.amount) || 0, companyId: tu.companyId, departmentId: tu.departmentId, requesterId: tu.id });
  let h = noticeEl('Rules are checked top-down per request type: the highest matching amount threshold wins, otherwise the rule without a condition applies. Sample: <b>expenses above $1,000 require CEO approval</b> — edit the amount below. Requesters are always skipped as approvers; if nobody else qualifies the step escalates to ' + roleLabel(state.settings.escalationRole) + '.', '', 'shield') + '<div style="height:16px"></div>';
  h += '<div class="grid g-2-1" style="align-items:start"><div class="stack">';
  for (const [type, meta] of Object.entries(APPROVAL_TYPES)) {
    const rs = sortedRules(type).concat(rules.filter(r => r.type === type && !r.enabled));
    h += card(esc(meta.label), '<div class="stack" style="gap:10px">' + rs.map(r => '<div class="row" style="gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;' + (r.enabled ? '' : 'opacity:.55') + '"><input type="checkbox" class="toggle" data-act-change="rule-en" data-id="' + r.id + '"' + (r.enabled ? ' checked' : '') + ' aria-label="Enabled"><input class="input" style="flex:1;min-width:140px" value="' + esc(r.name) + '" data-act-change="rule-name" data-id="' + r.id + '" aria-label="Rule name">' +
      (meta.money ? '<span class="small muted">when amount</span>' + selectEl('rop-' + r.id, [['', 'any'], ['>', '>'], ['>=', '≥']], r.cond ? r.cond.op : '', 'data-act-change="rule-op" data-id="' + r.id + '" style="width:70px"') + (r.cond ? '<input class="input num" type="number" step="100" min="0" style="width:110px" value="' + r.cond.value + '" data-act-change="rule-val" data-id="' + r.id + '" aria-label="Threshold">' : '') : '') +
      '<div class="row" style="flex-basis:100%;gap:6px"><span class="small muted">Route:</span>' + r.steps.map((s, i) => selectEl('rs-' + r.id + '-' + i, Object.entries(APPROVER_ROLES), s, 'data-act-change="rule-step" data-id="' + r.id + '" data-i="' + i + '" style="padding:5px 8px"') + '<button class="btn sm ghost" data-act="rule-step-del" data-id="' + r.id + '" data-i="' + i + '" aria-label="Remove step"' + (r.steps.length === 1 ? ' disabled' : '') + '>✕</button>').join('<span class="step-arrow">→</span>') + '<button class="btn sm" data-act="rule-step-add" data-id="' + r.id + '">+ step</button><span class="spacer"></span><button class="btn sm ghost danger" data-act="rule-del" data-id="' + r.id + '">Delete rule</button></div></div>').join('') + '<button class="btn sm" style="align-self:flex-start" data-act="rule-add" data-type="' + type + '">' + icon('plus') + 'Add rule</button></div>');
  }
  h += '</div><div style="position:sticky;top:80px">' + card('Test a request', '<div class="stack" style="gap:10px">' + field('Type', selectEl('rt-type', Object.entries(APPROVAL_TYPES).map(([k, v]) => [k, v.label]), test.type, 'data-act-change="rule-test" data-k="type"')) + field('Amount', '<input class="input" id="rt-amount" type="number" value="' + esc(test.amount) + '" data-act-input="rule-test" data-k="amount">') + field('Requested by', selectEl('rt-user', userOptions(state.users), test.requesterId, 'data-act-change="rule-test" data-k="requesterId"')) + '<div class="hr" style="margin:4px 0"></div><div class="small">Matched: <b>' + esc(prev.rule ? prev.rule.name : 'Default') + '</b></div><div class="timeline">' + prev.steps.map((s, i) => '<div class="tl"><div class="dotm cur">' + (i + 1) + '</div><div class="tx"><b>' + esc(APPROVER_ROLES[s.role]) + '</b><small>' + esc(s.approverIds.map(x => user(x).name).join(', ') || '—') + (s.escalated ? ' · escalated' : '') + '</small></div></div>').join('') + '</div></div>') + '</div></div>';
  return h;
}
function ruleById(id) { return state.settings.approvalRules.find(r => r.id === id); }
function ruleChanged(r, what) { audit('edited', 'rule', r.id, 'Approval rule “' + r.name + '”: ' + what); saveState(); }
Object.assign(CHANGE, {
  'rule-en': el => { const r = ruleById(el.dataset.id); r.enabled = el.checked; ruleChanged(r, el.checked ? 'enabled' : 'disabled'); render(); },
  'rule-name': el => { const r = ruleById(el.dataset.id); const o = r.name; r.name = el.value.trim() || o; ruleChanged(r, 'renamed from “' + o + '”'); },
  'rule-op': el => { const r = ruleById(el.dataset.id); if (!el.value) { r.cond = null; } else { r.cond = { op: el.value, value: r.cond ? r.cond.value : 1000 }; } ruleChanged(r, 'condition ' + (r.cond ? 'amount ' + r.cond.op + ' ' + r.cond.value : 'removed')); render(); },
  'rule-val': el => { const r = ruleById(el.dataset.id); const o = r.cond.value; r.cond.value = Math.max(0, Number(el.value) || 0); ruleChanged(r, 'threshold ' + money(o) + ' → ' + money(r.cond.value)); toast('Threshold updated — new requests use ' + money(r.cond.value)); render(); },
  'rule-step': el => { const r = ruleById(el.dataset.id); const i = Number(el.dataset.i); const o = r.steps[i]; r.steps[i] = el.value; ruleChanged(r, 'step ' + (i + 1) + ' ' + APPROVER_ROLES[o] + ' → ' + APPROVER_ROLES[el.value]); render(); },
  'rule-test': el => { App.ui.ruleTest = App.ui.ruleTest || { type: 'expense', amount: 2400, requesterId: 'u_tomas' }; App.ui.ruleTest[el.dataset.k] = el.value; render(); },
});
Object.assign(ACT, {
  'rule-step-add': el => { const r = ruleById(el.dataset.id); r.steps.push('ceo'); ruleChanged(r, 'added step'); render(); },
  'rule-step-del': el => { const r = ruleById(el.dataset.id); if (r.steps.length < 2) return; const [x] = r.steps.splice(Number(el.dataset.i), 1); ruleChanged(r, 'removed step ' + APPROVER_ROLES[x]); render(); },
  'rule-del': el => { const r = ruleById(el.dataset.id); state.settings.approvalRules = state.settings.approvalRules.filter(x => x !== r); audit('deleted', 'rule', r.id, 'Deleted approval rule “' + r.name + '”'); render(); },
  'rule-add': el => { const r = { id: uid('r'), type: el.dataset.type, name: 'New ' + APPROVAL_TYPES[el.dataset.type].label.toLowerCase() + ' rule', cond: APPROVAL_TYPES[el.dataset.type].money ? { op: '>', value: 5000 } : null, steps: ['manager'], enabled: true }; state.settings.approvalRules.push(r); audit('created', 'rule', r.id, 'Added approval rule for ' + r.type); render(); },
});
function setBusiness() {
  const s = state.settings;
  const row = (label, hint, ctl) => '<div class="li" style="padding:14px 18px"><div class="grow"><div class="ttl" style="white-space:normal">' + label + ' ' + cfg() + '</div><div class="meta" style="white-space:normal">' + hint + '</div></div><div>' + ctl + '</div></div>';
  const tog = (k) => '<input type="checkbox" class="toggle" data-act-change="biz" data-k="' + k + '"' + (s[k] ? ' checked' : '') + ' aria-label="' + k + '">';
  const num = (k, st) => '<input class="input num" type="number" min="0" style="width:90px" value="' + s[k] + '" step="' + (st || 1) + '" data-act-change="biz" data-k="' + k + '" aria-label="' + k + '">';
  const ph = s.projectHealth || {};
  const hnum = k => '<input class="input num" type="number" min="0" style="width:90px" value="' + ph[k] + '" data-act-change="biz-health" data-k="' + k + '" aria-label="' + k + '">';
  const htog = k => '<input type="checkbox" class="toggle" data-act-change="biz-health" data-k="' + k + '"' + (ph[k] ? ' checked' : '') + ' aria-label="' + k + '">';
  const health = card('Project health', '<div class="list">' +
    '<div class="li" style="padding:10px 18px">' + badge(HEALTH.off_track[0], HEALTH.off_track[1]) + '<span class="muted small">if any of these is true</span></div>' +
    row('Spend above (% of budget)', 'Posted project expenses exceed this share of the project budget.', hnum('offBudgetPct')) +
    row('Overdue tasks, at least', 'Number of overdue tasks in the project.', hnum('offOverdueTasks')) +
    row('Past its due date', 'The project is still open after its due date.', htog('offPastDue')) +
    '<div class="li" style="padding:10px 18px">' + badge(HEALTH.at_risk[0], HEALTH.at_risk[1]) + '<span class="muted small">otherwise, if any of these is true</span></div>' +
    row('Spend above (% of budget)', 'Posted project expenses exceed this share of the budget.', hnum('riskBudgetPct')) +
    row('Overdue tasks, at least', 'Number of overdue tasks in the project.', hnum('riskOverdueTasks')) +
    row('Behind schedule near the deadline', 'Due within <b>' + ph.riskDaysToDue + '</b> days and progress below <b>' + ph.riskMinProgress + '%</b>.', '<div class="row" style="gap:6px;flex-wrap:nowrap"><span class="small muted">days</span>' + hnum('riskDaysToDue') + '<span class="small muted">%</span>' + hnum('riskMinProgress') + '</div>') +
    '</div>', { flush: true, sub: 'Everything else is On track. Completed projects are always On track.' });
  return noticeEl('These are placeholders for rules you have not specified yet. Each is stored as a setting so it can change without code.', 'warn', 'info') + '<div style="height:12px"></div>' + card('', '<div class="list">' +
    row('Allow self-approval', 'When off, a requester is never an approver on their own request or task. Recommended off.', tog('allowSelfApproval')) +
    row('Require a supporting document to post', 'Transactions cannot be posted to the ledger without at least one attached document.', tog('requireDocForPosting')) +
    row('Tasks need manager review', 'Submitted work must be approved by the reviewer before it counts as completed.', tog('taskReviewRequired')) +
    row('Budget alert threshold (%)', 'Budget lines at or above this utilization trigger alerts on dashboards and notifications.', num('budgetAlertPct')) +
    row('Deadline reminder (days before due)', 'Assignees are notified this many days before a task is due, and daily once overdue.', num('reminderDays')) +
    row('Cash-low alert (months of runway)', 'Alert Finance and executives when a company’s cash covers fewer months than this, at its average monthly costs. 0 turns the alert off.', num('cashAlertMonths', 0.5)) +
    row('Runway lookback (full months)', 'How many recent full months are averaged to estimate monthly costs for runway.', num('runwayLookbackMonths')) +
    row('Escalation role', 'Who approves a step when nobody else in the configured role is eligible (for example the CEO’s own request).', selectEl('biz-esc', ROLE_KEYS.map(r => [r, roleLabel(r)]), s.escalationRole, 'data-act-change="biz" data-k="escalationRole"')) +
    row('Reporting currency', 'Single-currency in v1. Multi-currency with FX rates is planned.', '<span class="tag">' + esc(s.currency) + ' (' + esc(s.currencySymbol) + ')</span>') + '</div>', { flush: true }) + '<div style="height:16px"></div>' + health;
}
CHANGE['biz-health'] = el => {
  const h = state.settings.projectHealth = state.settings.projectHealth || {};
  const k = el.dataset.k; const o = h[k]; const v = el.type === 'checkbox' ? (el.checked ? 1 : 0) : Math.max(0, Number(el.value) || 0);
  h[k] = v; audit('edited', 'settings', 'settings', 'Project health ' + k + ': ' + o + ' → ' + v); toast('Saved — project health recalculated'); render();
};
CHANGE.biz = el => { const k = el.dataset.k; const o = state.settings[k]; const v = el.type === 'checkbox' ? el.checked : el.tagName === 'SELECT' ? el.value : Math.max(0, Number(el.value) || 0); state.settings[k] = v; audit('edited', 'settings', 'settings', 'Business rule ' + k + ': ' + o + ' → ' + v); toast('Saved'); render(); };
function setRoles() {
  const groups = groupBy(PERMISSIONS, p => p.group);
  let h = noticeEl('Changing a role affects everyone who holds it, immediately. Data scope (holding, company, department, own work) is set per person in People and limits which records each module shows.', '', 'lock') + '<div style="height:12px"></div>';
  h += card('', '<div class="table-wrap"><table class="t perm-matrix"><thead><tr><th>Permission</th>' + ROLE_KEYS.map(r => '<th>' + esc(roleLabel(r)) + '</th>').join('') + '</tr></thead><tbody>' +
    Object.entries(groups).map(([g, ps]) => '<tr><td colspan="' + (ROLE_KEYS.length + 1) + '" class="strong" style="background:var(--surface-2)">' + esc(g) + '</td></tr>' + ps.map(p => '<tr><td>' + esc(p.label) + '<div class="muted small mono">' + p.key + '</div></td>' + ROLE_KEYS.map(r => { const locked = r === 'owner' && p.key === 'settings.admin'; return '<td><input type="checkbox" data-act-change="perm" data-r="' + r + '" data-p="' + p.key + '"' + (state.roles[r].perms.includes(p.key) ? ' checked' : '') + (locked ? ' disabled title="Owner always keeps admin access"' : '') + ' aria-label="' + esc(roleLabel(r) + ': ' + p.label) + '" style="width:16px;height:16px;accent-color:var(--brand)"></td>'; }).join('') + '</tr>').join('')).join('') +
    '<tr><td class="strong">Default data scope for new people</td>' + ROLE_KEYS.map(r => '<td>' + selectEl('ds-' + r, Object.entries(SCOPES).map(([k, v]) => [k, v]), state.roles[r].defaultScope, 'data-act-change="role-scope" data-r="' + r + '" style="padding:4px 6px;font-size:12px"') + '</td>').join('') + '</tr></tbody></table></div>', { flush: true });
  return h;
}
CHANGE.perm = el => { const r = state.roles[el.dataset.r]; const p = el.dataset.p; if (el.checked) r.perms = uniq(r.perms.concat(p)); else r.perms = r.perms.filter(x => x !== p); audit('edited', 'role', el.dataset.r, (el.checked ? 'Granted ' : 'Revoked ') + p + ' for ' + r.label); toast((el.checked ? 'Granted' : 'Revoked') + ' for ' + r.label); render(); };
CHANGE['role-scope'] = el => { state.roles[el.dataset.r].defaultScope = el.value; audit('edited', 'role', el.dataset.r, 'Default scope for ' + roleLabel(el.dataset.r) + ' → ' + SCOPES[el.value]); saveState(); };
function setAudit() {
  const f = App.ui.auf || (App.ui.auf = { type: 'all', actor: 'all', q: '' });
  let rows = state.audit;
  if (f.type !== 'all') rows = rows.filter(a => a.type === f.type);
  if (f.actor !== 'all') rows = rows.filter(a => a.actorId === f.actor);
  if (f.q) { const q = f.q.toLowerCase(); rows = rows.filter(a => a.summary.toLowerCase().includes(q)); }
  const types = uniq(state.audit.map(a => a.type)).sort();
  return '<div class="filters">' + selectEl('au-type', [['all', 'All records']].concat(types.map(t => [t, titleCase(t)])), f.type, 'data-act-change="auf" data-k="type"') + selectEl('au-actor', [['all', 'Anyone']].concat(state.users.map(u => [u.id, u.name])), f.actor, 'data-act-change="auf" data-k="actor"') + '<input class="input" id="au-q" placeholder="Search summaries" value="' + esc(f.q) + '" data-act-input="auf" data-k="q"><span class="muted small">' + rows.length + ' events · append-only</span></div>' +
    card('', tableEl([
      { h: 'When', nowrap: 1, v: a => fmtDT(a.at) }, { h: 'Who', v: a => person(a.actorId) }, { h: 'Action', v: a => badge(titleCase(a.action), { approved: 'b-good', posted: 'b-good', rejected: 'b-bad', reversed: 'b-bad', submitted: 'b-brand', created: 'b-info', edited: 'b-warn', adjusted: 'b-warn' }[a.action] || '', true) },
      { h: 'Record', v: a => '<span class="tag">' + esc(titleCase(a.type)) + '</span>' }, { h: 'Summary', v: a => esc(a.summary) },
    ], rows, { pageSize: 30, pageKey: 'aupg', rowAct: 'audit-open' }), { flush: true });
}
CHANGE.auf = el => { App.ui.auf[el.dataset.k] = el.value; App.ui.aupg = 0; render(); };
ACT['audit-open'] = el => { const a = state.audit.find(x => x.id === el.dataset.id); if (!a) return; const map = { task: 'task', approval: 'approval', transaction: 'transaction', project: 'project', risk: 'risk', invoice: 'invoice', bill: 'bill', user: 'user', company: 'company' }; if (map[a.type]) { const coll = { task: 'tasks', approval: 'approvals', transaction: 'transactions', project: 'projects', risk: 'risks', invoice: 'invoices', bill: 'bills', user: 'users', company: 'companies' }[a.type]; if (get(coll, a.entityId)) openEntity(map[a.type], a.entityId); } };
function setSystem() {
  const size = (() => { try { return Math.round(JSON.stringify(state).length / 1024); } catch (e) { return 0; } })();
  return '<div class="grid g2">' + card('Demo data', '<p style="margin-top:0">This prototype runs entirely in your browser. Changes you make (tasks, approvals, postings, settings) are saved in this browser only (' + size + ' KB). Other people do not see them.</p>' + (App.ui.confirmReset ? '<div class="action-bar"><span class="small" style="flex:1">Reset all data to the original sample? Your changes will be lost.</span><button class="btn" data-act="reset-cancel">Cancel</button><button class="btn danger solid" data-act="reset-go">Reset data</button></div>' : '<button class="btn danger" data-act="reset-ask">' + icon('undo') + 'Reset sample data</button>')) +
    card('Architecture notes', '<ul style="margin:0;padding-left:18px;line-height:1.7"><li>One normalized data model: companies, departments, users, roles, tasks, projects, approvals, transactions, accounts, invoices, bills, budgets, KPIs, risks, documents, notifications, audit.</li><li>Workflow engines (tasks, approvals, ledger) are separate from screens, ready to move behind an API.</li><li>Approval routing, thresholds, permissions and alerts are configuration, not code.</li><li>Ledger is append-only after posting: reversals and adjustments, never edits.</li><li>Planned next: server + real authentication, email/Slack notifications, accrual accounting and intercompany eliminations, multi-currency, mobile app, AI assistants for summaries and anomaly checks.</li></ul>') + '</div>';
}
Object.assign(ACT, {
  'reset-ask': () => { App.ui.confirmReset = true; render(); }, 'reset-cancel': () => { App.ui.confirmReset = false; render(); },
  'reset-go': () => { const uidNow = state.session.userId; resetState(); App.ui = {}; state.session.userId = uidNow; App.ui.setTab = 'system'; render(); toast('Sample data restored'); },
});

/* ---------- boot ---------- */
(function boot() {
  state = loadState();
  try { const t = localStorage.getItem('northstar-theme'); if (t) applyTheme(t); } catch (e) { }
  bindEvents();
  render();
})();
