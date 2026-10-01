/* =====================================================================
   Login + role-based dashboards
   ===================================================================== */
VIEWS.login = function () {
  const open = state.tasks.filter(t => t.status !== 'completed').length;
  const pend = state.approvals.filter(a => a.status === 'pending').length;
  const demo = [['u_kim', 'CEO'], ['u_snakeman', 'CTO'], ['u_nadia', 'CMO'], ['u_sokha', 'Financial'], ['u_rachel', 'Accounting'], ['u_vannak', 'Manager'], ['u_mony', 'Team member'], ['u_daniel', 'Investor']];
  return '<div class="login"><section class="login-art"><div class="brand" style="padding:0"><div class="brand-mark">' + LOGO + '</div><div><b>Negroni</b><small>Management OS · prototype</small></div></div>' +
    '<div class="stack" style="gap:18px"><h1>One place to run the whole company.</h1><p>Tasks, approvals, finance, people and performance for Longevity project — each person sees only what their role allows.</p></div>' +
    '<div class="mini"><div><b>' + state.companies.length + '</b><small>' + (state.companies.length === 1 ? 'company' : 'companies') + '</small></div><div><b>' + state.users.length + '</b><small>people</small></div><div><b>' + open + '</b><small>open tasks</small></div><div><b>' + pend + '</b><small>requests in approval</small></div></div>' +
    '<p class="small" style="opacity:.7">Sample data is fictional. Changes are saved in this browser only.</p></section>' +
    '<section class="login-form"><div><div class="eyebrow">Sign in</div><h2 style="font-size:24px;margin-top:4px">Welcome back</h2></div>' +
    '<form id="login-form" class="stack" style="gap:12px" onsubmit="event.preventDefault();ACT[\'login-email\']()">' + field('Work email', '<input class="input" id="login-email" type="email" placeholder="name@negroni.example" autocomplete="username">') + field('Password', '<input class="input" id="login-pass" type="password" placeholder="Any password works in the prototype" autocomplete="current-password">') + '<button class="btn primary" type="submit">Sign in</button><div id="login-err" class="small" style="color:var(--bad)"></div></form>' +
    '<div class="hr"></div><div><div class="strong">Or pick a demo account</div><div class="muted small">Try the same screens as different roles to see access control at work.</div></div>' +
    '<div class="acct-grid">' + demo.map(([id, lbl]) => { const u = user(id); return '<button class="acct" data-act="login-as" data-id="' + id + '">' + avatar(u) + '<span class="grow"><b>' + esc(u.name) + '</b><small>' + esc(lbl) + ' · ' + esc(company(u.companyId).short) + '</small></span></button>'; }).join('') + '</div></section></div>';
};
ACT['login-email'] = () => {
  const e = (document.getElementById('login-email').value || '').trim().toLowerCase();
  const u = state.users.find(x => x.email.toLowerCase() === e && x.active !== false);
  if (!u) { document.getElementById('login-err').textContent = 'No active account with that email. Use a demo account below, e.g. kim.sreyneang@negroni.example'; return; }
  login(u.id);
};

/* ---------- cloud mode: create account / sign in / forgot password (real Supabase accounts) ---------- */
VIEWS.cloudScreen = function () {
  const art = '<section class="login-art"><div class="brand" style="padding:0"><div class="brand-mark">' + LOGO + '</div><div><b>Negroni</b><small>Management OS · prototype</small></div></div>' +
    '<div class="stack" style="gap:18px"><h1>One place to run the whole company.</h1><p>Create your account and you get your own workspace, pre-filled with sample data for Longevity project: tasks, approvals, finance, people and performance. Your changes are saved to the cloud, so they are still there tomorrow and on any device.</p></div>' +
    '<p class="small" style="opacity:.7">Sample data is fictional. Invite colleagues from Settings → System &amp; data.</p></section>';
  const S = Cloud.screen;
  const msg = Cloud.authMsg ? '<div id="auth-msg" class="auth-msg ' + (Cloud.authMsg.ok ? 'ok' : 'bad') + '" role="status">' + esc(Cloud.authMsg.text) + '</div>' : '<div id="auth-msg" class="auth-msg" role="status"></div>';
  const input = (id, label, type, ac, extra) => field(label, '<input class="input" id="' + id + '" type="' + type + '" autocomplete="' + ac + '"' + (extra || '') + '>', { for: id });
  let form;
  if (S === 'loading') form = '<div class="stack" style="gap:8px"><div class="eyebrow">One moment</div><h2 style="font-size:22px">Loading your workspace…</h2></div>';
  else if (S === 'error') form = '<div class="stack" style="gap:12px"><div class="eyebrow">Problem</div><h2 style="font-size:22px">We could not open the app</h2>' + noticeEl(esc(Cloud.error), 'bad', 'alert') +
    '<div class="row" style="gap:8px"><button class="btn primary" data-act="cloud-boot">Try again</button>' + (Cloud.user ? '<button class="btn" data-act="logout">' + icon('logout') + 'Sign out</button>' : '') + '</div></div>';
  else if (S === 'old-version') form = '<div class="stack" style="gap:12px"><div class="eyebrow">Workspace “' + esc(Cloud.ws ? Cloud.ws.name : '') + '”</div><h2 style="font-size:22px">Saved by an older version of the app</h2><p class="muted" style="margin:0">The app has changed how it stores data since this workspace was last saved.</p>' +
    '<div class="row" style="gap:8px;flex-wrap:wrap">' + (Cloud.ws && Cloud.ws.role !== 'viewer' ? '<button class="btn primary" data-act="cloud-old" data-v="reset">' + icon('undo') + 'Reset to sample data</button>' : '') + '<button class="btn" data-act="cloud-old" data-v="keep">Keep (read-only)</button><button class="btn" data-act="logout">' + icon('logout') + 'Sign out</button></div></div>';
  else if (S === 'recovery') form = '<div><div class="eyebrow">Reset password</div><h2 style="font-size:24px;margin-top:4px">Choose a new password</h2></div>' +
    '<form id="auth-form" class="stack" style="gap:12px" onsubmit="event.preventDefault();ACT[\'auth-newpass\']()">' + input('auth-pass', 'New password', 'password', 'new-password', '') + input('auth-pass2', 'Repeat new password', 'password', 'new-password') +
    '<button class="btn primary" type="submit">Save password and continue</button>' + msg + '</form>';
  else {
    const tab = Cloud.authTab;
    const head = { signin: ['Sign in', 'Welcome back'], signup: ['Create account', 'Get your own workspace'], forgot: ['Forgot password', 'Reset your password'] }[tab];
    let f;
    if (tab === 'signup') f = '<form id="auth-form" class="stack" style="gap:12px" onsubmit="event.preventDefault();ACT[\'auth-signup\']()">' + input('auth-name', 'Your name', 'text', 'name', ' maxlength="80"') + input('auth-email', 'Email', 'email', 'username') +
      field('Password', '<input class="input" id="auth-pass" type="password" autocomplete="new-password">', { for: 'auth-pass', hint: 'At least 10 characters.' }) + '<button class="btn primary" type="submit">Create account</button>' + msg + '</form>';
    else if (tab === 'forgot') f = '<form id="auth-form" class="stack" style="gap:12px" onsubmit="event.preventDefault();ACT[\'auth-forgot\']()">' + input('auth-email', 'Email', 'email', 'username') +
      '<button class="btn primary" type="submit">Send reset link</button>' + msg + '<button class="btn ghost" type="button" data-act="auth-tab" data-v="signin">Back to sign in</button></form>';
    else f = '<form id="auth-form" class="stack" style="gap:12px" onsubmit="event.preventDefault();ACT[\'auth-signin\']()">' + input('auth-email', 'Email', 'email', 'username') + input('auth-pass', 'Password', 'password', 'current-password') +
      '<button class="btn primary" type="submit">Sign in</button>' + msg + '<button class="btn ghost" type="button" data-act="auth-tab" data-v="forgot">Forgot password?</button></form>';
    form = (tab === 'forgot' ? '' : segEl([['signin', 'Sign in'], ['signup', 'Create account']], tab, 'auth-tab')) + '<div><div class="eyebrow">' + head[0] + '</div><h2 style="font-size:24px;margin-top:4px">' + head[1] + '</h2></div>' + f;
  }
  return '<div class="login">' + art + '<section class="login-form">' + form + '</section></div>';
};
function authVal(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function authMsg(text, ok) { Cloud.authMsg = text ? { text, ok } : null; const el = document.getElementById('auth-msg'); if (el) { el.className = 'auth-msg ' + (ok ? 'ok' : 'bad'); el.textContent = text || ''; } }
async function authRun(fn) {
  if (Cloud.busy) return;
  const btn = document.querySelector('#auth-form button[type=submit]');
  Cloud.busy = true; if (btn) btn.disabled = true; authMsg('');
  try { await fn(); } catch (e) { authMsg(e.message || String(e)); }
  finally { Cloud.busy = false; const b = document.querySelector('#auth-form button[type=submit]'); if (b) b.disabled = false; }
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
Object.assign(ACT, {
  'auth-tab': el => { Cloud.authTab = el.dataset.v; Cloud.authMsg = null; render(); const f = document.getElementById(Cloud.authTab === 'signup' ? 'auth-name' : 'auth-email'); if (f) f.focus(); },
  'auth-signin': () => authRun(async () => {
    const email = authVal('auth-email').trim(), pass = authVal('auth-pass');
    if (!EMAIL_RE.test(email)) throw new Error('Enter a valid email address.');
    if (!pass) throw new Error('Enter your password.');
    await cloudSignIn(email, pass);
  }),
  'auth-signup': () => authRun(async () => {
    const name = authVal('auth-name').trim(), email = authVal('auth-email').trim(), pass = authVal('auth-pass');
    if (!name) throw new Error('Enter your name.');
    if (!EMAIL_RE.test(email)) throw new Error('Enter a valid email address.');
    if (pass.length < 10) throw new Error('Use a password of at least 10 characters.');
    if (await cloudSignUp(email, pass, name) === 'confirm') { Cloud.authTab = 'signin'; Cloud.authMsg = { text: 'Account created. Check your email and open the confirmation link, then sign in.', ok: true }; render(); }
  }),
  'auth-forgot': () => authRun(async () => {
    const email = authVal('auth-email').trim();
    if (!EMAIL_RE.test(email)) throw new Error('Enter a valid email address.');
    await cloudResetPassword(email);
    authMsg('If an account exists for ' + email + ', we sent a link to reset the password. It can take a few minutes.', true);
  }),
  'auth-newpass': () => authRun(async () => {
    const a = authVal('auth-pass'), b = authVal('auth-pass2');
    if (a.length < 10) throw new Error('Use a password of at least 10 characters.');
    if (a !== b) throw new Error('The two passwords do not match.');
    await cloudSetNewPassword(a);
    toast('Password changed');
  }),
  'cloud-boot': () => cloudBoot(),
  'cloud-old': el => cloudResolveOld(el.dataset.v),
  'cloud-reload': () => location.reload(),
  'cloud-retry': () => cloudFlush(),
  'ws-open': () => { const id = document.getElementById('ws-switch').value; closeModal(); if (!Cloud.ws || id !== Cloud.ws.id) cloudOpen(id); },
  'ws-settings': () => { closeModal(); App.ui.setTab = 'system'; go('settings'); },
});
// Real account + workspace switcher, shown at the top of the avatar menu in cloud mode.
function cloudAccountHtml() {
  const u = Cloud.user || {}; const ws = Cloud.ws;
  const name = (u.user_metadata && u.user_metadata.display_name) || '';
  const sw = Cloud.workspaces.length > 1
    ? '<div class="row" style="gap:8px">' + selectEl('ws-switch', Cloud.workspaces.map(w => [w.id, w.name + ' · ' + w.role]), ws.id, 'style="flex:1" aria-label="Workspace"') + '<button class="btn" data-act="ws-open">Open</button></div>'
    : '<div class="row" style="gap:8px"><b>' + esc(ws.name) + '</b>' + badge(ws.role, 'b-brand') + '</div>';
  return '<div class="stack" style="gap:12px">' + field('Signed in as', '<div><b>' + esc(name || u.email) + '</b>' + (name ? ' <span class="muted">' + esc(u.email) + '</span>' : '') + '</div>') +
    field('Workspace', sw + '<div style="margin-top:6px"><button class="btn ghost" data-act="ws-settings">' + icon('gear') + 'Workspace settings &amp; members</button></div>') + '</div>';
}

function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
function scopeName() { const ids = activeCompanyIds(); return ids.length === state.companies.length ? 'Entire holding (' + ids.length + ' companies)' : ids.length === 1 ? company(ids[0]).name : ids.length + ' companies'; }
function ytdRange(y) { y = y || CUR_YEAR; return [y + '-01-01', y + '-' + TODAY_S.slice(5)]; }
function pageHead(title, sub, actions) { return '<div class="page-head"><div><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><div class="actions">' + (actions || '') + '</div></div>'; }
function quickActions() {
  let h = '';
  if (can('tasks.create')) h += '<button class="btn" data-act="new-task">' + icon('plus') + 'New task</button>';
  if (can('approvals.view')) h += '<button class="btn primary" data-act="new-request">' + icon('send') + 'New request</button>';
  return h;
}
function taskRow(t, opt) {
  opt = opt || {};
  return '<div class="li clickable" data-act="open" data-t="task" data-id="' + t.id + '"><div class="ico-box ' + (isOverdue(t) ? 'bad' : t.status === 'submitted' ? 'solid' : '') + '">' + icon(t.recurrence ? 'repeat' : 'check') + '</div><div class="grow"><div class="ttl">' + esc(t.title) + '</div><div class="meta">' + (opt.showAssignee ? esc(user(t.assigneeId).name) + ' · ' : '') + esc(company(t.companyId).short) + (t.projectId ? ' · ' + esc(project(t.projectId).name) : '') + '</div></div><div style="text-align:right" class="nowrap"><div>' + taskStatusBadge(t) + '</div><div class="meta" style="margin-top:3px">' + (t.status === 'completed' ? 'Done ' + (t.completedAt ? fmtShort(t.completedAt.slice(0, 10)) : '') : dueLabel(t.dueDate)) + '</div></div></div>';
}
function approvalRow(a) {
  const st = a.steps[a.currentStep];
  return '<div class="li clickable" data-act="open" data-t="approval" data-id="' + a.id + '"><div class="ico-box ' + (a.status === 'pending' ? 'warn' : a.status === 'approved' ? 'good' : 'bad') + '">' + icon('stamp') + '</div><div class="grow"><div class="ttl">' + esc(a.title) + '</div><div class="meta">' + esc(APPROVAL_TYPES[a.type].label) + ' · ' + esc(user(a.requesterId).name) + ' · ' + esc(company(a.companyId).short) + '</div></div><div style="text-align:right" class="nowrap"><div class="strong num">' + (a.amount ? money(a.amount) : '—') + '</div><div class="meta">' + (a.status === 'pending' && st ? 'Step ' + (a.currentStep + 1) + '/' + a.steps.length : titleCase(a.status)) + '</div></div></div>';
}
function reviewQueue() {
  const items = state.approvals.filter(a => canActOnApproval(a)).map(a => ({ at: a.createdAt, html: approvalRow(a) }))
    .concat(state.tasks.filter(t => canReviewTask(t)).map(t => ({ at: t.submittedAt || t.createdAt, html: '<div class="li clickable" data-act="open" data-t="task" data-id="' + t.id + '"><div class="ico-box solid">' + icon('check') + '</div><div class="grow"><div class="ttl">' + esc(t.title) + '</div><div class="meta">Task review · ' + esc(user(t.assigneeId).name) + ' submitted work</div></div><div class="nowrap">' + badge('Review', 'b-brand') + '</div></div>' })));
  items.sort((a, b) => a.at < b.at ? 1 : -1);
  return items;
}
function deadlinesList(tasks, days, limit) {
  const up = tasks.filter(t => t.status !== 'completed' && daysUntil(t.dueDate) <= days).sort((a, b) => a.dueDate < b.dueDate ? -1 : 1).slice(0, limit || 7);
  return up.length ? '<div class="list">' + up.map(t => taskRow(t, { showAssignee: true })).join('') + '</div>' : emptyState('No deadlines in the next ' + days + ' days.');
}
function projectCard(p, alt, opt) {
  opt = opt || {};
  const st = projectStats(p); const [hl, hc] = HEALTH[st.health];
  const team = uniq([p.ownerId].concat(p.members || [])).length;
  return '<button class="pcard ' + (alt ? 'alt' : '') + (opt.sel ? ' sel' : '') + '" data-act="' + (opt.act || 'open') + '" data-t="project" data-id="' + p.id + '"><div class="p-top"><span>' + esc(company(p.companyId).short) + '</span><span>Due ' + fmtShort(p.dueDate) + '</span></div><h4>' + esc(p.name) + '</h4>' +
    '<div class="row">' + badge(hl, st.health === 'on_track' ? 'b-good' : hc) + prioBadge(p.priority) + '</div>' +
    '<div class="p-bot"><div class="row" style="justify-content:space-between"><span>Progress</span><b class="num">' + st.progress + '%</b></div>' + progressBar(st.progress) +
    '<div class="p-tiles"><div>Tasks<b>' + st.done + ' / ' + st.total + '</b></div><div>Budget<b>' + (p.budget ? pct(st.spent, p.budget) + '%' : '—') + '</b></div><div>Team<b>' + team + '</b></div></div></div></button>';
}
function alertsFor(ids) {
  const out = [];
  if (can('finance.view')) {
    lowCashCompanies(ids).forEach(r => out.push(['bad', 'dollar', company(r.companyId).name + ' cash below ' + state.settings.cashAlertMonths + ' months of costs', money(r.cash, { compact: true }) + ' · ' + fmtRunway(r.months) + ' runway', { page: 'finance', tab: 'cash' }]));
    const bl =budgetRows(ids, CUR_YEAR).filter(b => b.util >= state.settings.budgetAlertPct).sort((a, b) => b.util - a.util);
    bl.slice(0, 3).forEach(b => out.push(['warn', 'coins', 'Budget ' + fmtPct(b.util) + ' used', dept(b.departmentId).name + ' · ' + b.category + ' (' + company(b.companyId).short + ')', { page: 'finance', tab: 'budgets' }]));
    const od = state.invoices.filter(i => ids.includes(i.companyId) && invoiceStatus(i) === 'overdue');
    if (od.length) out.push(['bad', 'dollar', money(sum(od, i => i.amount - i.paid)) + ' overdue receivables', od.length + ' invoices past due', { page: 'finance', tab: 'receivables' }]);
  }
  state.risks.filter(r => ids.includes(r.companyId) && r.status !== 'closed' && ['high', 'critical'].includes(r.severity)).forEach(r => out.push([r.severity === 'critical' ? 'bad' : 'warn', 'alert', r.title, r.key + ' · ' + titleCase(r.severity) + ' · ' + user(r.ownerId).name, { page: 'operations' }, r.id]));
  const od = state.tasks.filter(t => ids.includes(t.companyId) && isOverdue(t) && visibleTask(t));
  if (od.length) out.push(['bad', 'clock', od.length + ' overdue tasks', 'Across ' + uniq(od.map(t => t.companyId)).length + ' companies', { page: 'tasks' }]);
  return out;
}
function alertsList(items, limit) {
  if (!items.length) return emptyState('No alerts. Everything is within thresholds.');
  return '<div class="list">' + items.slice(0, limit || 6).map(([k, ic, t, m, link, rid]) => '<div class="li clickable" ' + (rid ? 'data-act="open" data-t="risk" data-id="' + rid + '"' : 'data-act="follow" data-link=\'' + esc(JSON.stringify(link)) + '\'') + '><div class="ico-box ' + k + '">' + icon(ic) + '</div><div class="grow"><div class="ttl">' + esc(t) + '</div><div class="meta">' + esc(m) + '</div></div></div>').join('') + '</div>';
}
ACT.follow = el => followLink(JSON.parse(el.dataset.link));

/* ---------- metrics used by several dashboards ---------- */
function deptPerformance(ids, deptIds) {
  const since = rel(-180);
  const rows = [];
  for (const d of state.departments.filter(d => ids.includes(d.companyId) && (!deptIds || deptIds.includes(d.id)))) {
    const ts = state.tasks.filter(t => t.departmentId === d.id);
    if (!ts.length) continue;
    const done = ts.filter(t => t.status === 'completed' && t.completedAt && t.completedAt.slice(0, 10) >= since);
    const onTime = done.filter(t => t.completedAt.slice(0, 10) <= t.dueDate).length;
    const open = ts.filter(t => t.status !== 'completed');
    const overdue = open.filter(isOverdue).length;
    rows.push({ id: d.id, name: d.name, company: d.companyId, done: done.length, onTime: done.length ? onTime / done.length * 100 : null, open: open.length, overdue, score: done.length ? (onTime / done.length * 100) - overdue * 5 : null });
  }
  return rows;
}
function teamRows(userIds) {
  const since = rel(-180);
  return userIds.map(user).map(u => {
    const ts = state.tasks.filter(t => t.assigneeId === u.id);
    const open = ts.filter(t => t.status !== 'completed');
    const done = ts.filter(t => t.status === 'completed' && t.completedAt && t.completedAt.slice(0, 10) >= since);
    const onTime = done.filter(t => t.completedAt.slice(0, 10) <= t.dueDate).length;
    return { id: u.id, u, open: open.length, overdue: open.filter(isOverdue).length, review: ts.filter(t => t.status === 'submitted').length, done: done.length, onTime: done.length ? onTime / done.length * 100 : null };
  });
}
function financeTiles(ids) {
  const [f, t] = ytdRange(); const [lf, lt] = ytdRange(CUR_YEAR - 1);
  const p = pnl(ids, f, t), lp = pnl(ids, lf, lt);
  const cash = cashPosition(ids); const cash30 = cashPosition(ids, rel(-30));
  return kpiTile('Revenue YTD', money(p.revenue, { compact: true }), deltaTxt(p.revenue, lp.revenue, false, 'vs same period ' + (CUR_YEAR - 1)), { hero: true, icon: 'chart', act: 'go-finance' }) +
    kpiTile('Expenses YTD', money(p.expenses, { compact: true }), deltaTxt(p.expenses, lp.expenses, true, 'vs ' + (CUR_YEAR - 1)), { icon: 'coins', act: 'go-finance' }) +
    kpiTile('Net profit YTD', money(p.net, { compact: true }), '<span class="' + (p.net >= 0 ? 'up' : 'down') + '">' + fmtPct(p.revenue ? p.net / p.revenue * 100 : 0, 1) + ' margin</span> <span class="muted">' + money(lp.net, { compact: true }) + ' last year</span>', { icon: 'target', act: 'go-finance' }) +
    kpiTile('Cash position', money(cash, { compact: true }), deltaTxt(cash, cash30, false, 'vs 30 days ago'), { icon: 'dollar', act: 'go-cash' });
}
ACT['go-finance'] = () => { App.ui.finTab = 'statements'; go('finance'); };
ACT['go-cash'] = () => { App.ui.finTab = 'cash'; go('finance'); };
function revExpChart(ids, n) {
  const ms = monthlySeries(ids, lastNMonths(n || 12));
  return barChart({ labels: ms.map(m => m.label), series: [{ name: 'Revenue', color: 'var(--s1)', values: ms.map(m => m.revenue) }, { name: 'Expenses', color: 'var(--s2)', values: ms.map(m => m.expenses) }], tipTitle: i => MONTHS_L[ms[i].m] + ' ' + ms[i].y, tipExtra: i => [['var(--muted)', 'Net', money(ms[i].net)]], aria: 'Monthly revenue and expenses' });
}

/* ---------- dashboards ---------- */
VIEWS.dashboard = function () {
  const r = me().role;
  if (r === 'ceo') return dashExec();
  if (r === 'cto' || r === 'cmo') return dashCto();
  if (r === 'financial' || r === 'accounting') return dashFinance();
  if (r === 'investor') return VIEWS.overview();
  if (r === 'manager') return dashManager();
  return dashMember();
};
function dashExec() {
  const u = me(); const ids = activeCompanyIds(); const fin = can('finance.view');
  const tasks = state.tasks.filter(t => ids.includes(t.companyId));
  const projs = state.projects.filter(p => ids.includes(p.companyId) && p.status !== 'completed');
  const queue = reviewQueue();
  let h = pageHead(greeting() + ', ' + esc(u.name.replace(/^Dr\. /, '').split(' ')[0]), fmtDate(TODAY_S) + ' · ' + esc(scopeName()), quickActions());
  // KPIs (2×2) beside revenue by stream (finance only)
  h += '<div class="dash-top"><div class="grid kpi-2x2">' + (fin ? financeTiles(ids) : workTiles(tasks, projs)) + '</div>' + (fin ? revenueStreamsCard(ids) : decisionCard(queue)) + '</div>';
  // progress tracking beside decisions + alerts
  h += '<div class="dash-mid">' + progressCard(ids, tasks, projs) + '<div class="stack">' + (fin ? decisionCard(queue) : '') + card('Risks & alerts', alertsList(alertsFor(ids)), { flush: true }) + '</div></div>';
  h += '<div class="grid g3">' + companyTilesCard(ids) + card('Upcoming deadlines', deadlineBlocks(tasks.filter(t => ['critical', 'high'].includes(t.priority) || t.assigneeId === u.id), 14, 4), { sub: 'High-priority work, next 14 days' }) + (fin ? budgetCard(ids, tasks) : card('Work status', taskStatusMix(tasks), { sub: tasks.filter(t => t.status !== 'completed').length + ' open tasks' })) + '</div>';
  return h;
}
function decisionCard(queue) {
  return card('Needs your decision', queue.length ? '<div class="list">' + queue.slice(0, 5).map(x => x.html).join('') + '</div>' : '<div style="padding:0 22px 6px"><div class="empty-tile"><span class="ico-box good">' + icon('ok') + '</span><div><b>Nothing is waiting on you</b><small>0 waiting</small></div></div></div>',
    { flush: true, sub: queue.length ? queue.length + ' waiting' : '', actions: '<button class="link" data-act="nav" data-page="approvals">Approval Center →</button>' });
}
function revenueStreamsCard(ids) {
  const [f, t] = ytdRange(); const p = pnl(ids, f, t);
  const cols = ['var(--s1)', 'var(--s3)', 'var(--s2)', 'var(--s4)'];
  const segs = Object.entries(p.rev).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k, v], i) => ({ label: k.replace(/^Revenue - /, ''), value: v, color: cols[i % cols.length] }));
  if (!segs.length) return card('Revenue by stream', emptyState('No revenue yet this year.'), { sub: 'Year to date' });
  return card('Revenue by stream', '<div class="donut-wrap">' + donutChart(segs, 180) + '<div class="mid"><b>' + money(p.revenue, { compact: true }) + '</b><small>' + segs.length + ' stream' + (segs.length > 1 ? 's' : '') + '</small></div></div>' +
    '<div class="legend-rows">' + segs.map(s => '<div><i style="background:' + s.color + '"></i><span>' + esc(s.label) + '</span><span class="num">' + money(s.value, { compact: true }) + '</span><span class="muted">' + fmtPct(s.value / p.revenue * 100, 1) + '</span></div>').join('') + '</div>',
    { sub: 'Year to date', actions: '<span class="tag">From Finance</span>' });
}
function progressCard(ids, tasks, projs) {
  const active = projs.filter(p => p.status === 'active').slice(0, 2);
  const projHtml = active.length ? active.map(p => {
    const s = projectStats(p); const span = daysUntil(p.dueDate) - daysUntil(p.startDate); const el = span > 0 ? clamp(Math.round(-daysUntil(p.startDate) / span * 100), 0, 100) : 100;
    return '<div class="pt-proj" data-act="open" data-t="project" data-id="' + p.id + '"><div class="row" style="justify-content:space-between;flex-wrap:nowrap;align-items:flex-start"><div><b>' + esc(p.name) + '</b><div class="muted small">' + esc(user(p.ownerId).name) + ' · ' + fmtShort(p.startDate) + ' → ' + fmtDate(p.dueDate) + '</div></div><div class="row" style="flex-wrap:nowrap">' + badge(HEALTH[s.health][0], HEALTH[s.health][1]) + '<span class="pt-pct">' + s.progress + '%</span></div></div>' +
      '<div class="progress" style="margin:12px 0 8px"><i style="width:' + s.progress + '%"></i><span class="mark" style="left:' + el + '%"></span></div>' +
      '<div class="row muted small" style="justify-content:space-between"><span>Marker = ' + el + '% of timeline elapsed</span><span>Tasks ' + s.done + ' / ' + s.total + (p.budget ? ' · Budget ' + pct(s.spent, p.budget) + '% of ' + money(p.budget, { compact: true }) : '') + '</span></div></div>';
  }).join('') : emptyState('No active projects.');
  const open = tasks.filter(t => t.status !== 'completed');
  const st = [['todo', 'To do'], ['in_progress', 'In progress'], ['submitted', 'Awaiting review'], ['changes', 'Changes requested'], ['blocked', 'Blocked']];
  const mx = Math.max(1, ...st.map(([k]) => open.filter(t => t.status === k).length));
  const pipe = '<div class="pt-col"><div class="row" style="justify-content:space-between"><b>Task pipeline</b><span class="muted small">' + open.length + ' open · ' + open.filter(isOverdue).length + ' overdue</span></div>' +
    st.map(([k, l]) => { const n = open.filter(t => t.status === k).length; return '<div class="pt-row"><span' + (k === 'in_progress' && n ? ' style="color:var(--info)"' : '') + '>' + l + '</span><div class="progress"><i style="width:' + (n / mx * 100) + '%;background:' + (k === 'blocked' ? 'var(--danger)' : k === 'changes' ? '#B57E14' : 'var(--info)') + '"></i></div><span class="num mono">' + n + '</span></div>'; }).join('') + '</div>';
  const ks = state.kpis.filter(k => ids.includes(k.companyId));
  const kp = '<div class="pt-col"><div class="row" style="justify-content:space-between"><b>KPIs vs target</b><span class="muted small">' + ks.filter(k => kpiStatus(k) === 'good').length + ' / ' + ks.length + ' on target</span></div>' +
    (ks.length ? ks.slice(0, 4).map(k => { const v = k.values[k.values.length - 1]; const st = kpiStatus(k); const w = k.direction === 'down' ? Math.min(100, k.target / v * 100) : Math.min(100, v / k.target * 100); return '<div class="pt-kpi"><div class="row" style="justify-content:space-between"><span>' + esc(k.name) + '</span><span class="mono">' + esc(fmtKpi(k, v)) + ' / ' + esc(fmtKpi(k, k.target)) + '</span></div><div class="progress ' + (st === 'good' ? 'good' : st === 'warn' ? 'warn' : 'bad') + '"><i style="width:' + w + '%"></i></div></div>'; }).join('') : emptyState('No KPIs yet.')) + '</div>';
  return card('Progress tracking', '<div class="stack" style="gap:18px">' + projHtml + '<div class="grid g2">' + pipe + kp + '</div></div>', { sub: 'Projects, tasks and KPIs across the holding', actions: can('projects.view') ? '<button class="btn sm" data-act="nav" data-page="projects">Projects →</button>' : '' });
}
function companyTilesCard(ids) {
  const [f, t] = ytdRange(); const fin = can('finance.view');
  return card('Company performance', ids.map(company).map(c => {
    const p = fin ? pnl([c.id], f, t) : null; const br = fin ? budgetRows([c.id], CUR_YEAR) : [];
    const ts = state.tasks.filter(x => x.companyId === c.id && x.status !== 'completed'); const ps = state.projects.filter(x => x.companyId === c.id && x.status === 'active').map(projectStats);
    const ks = state.kpis.filter(k => k.companyId === c.id); const tile = (l, v, cls) => '<div class="tile"><div class="lbl">' + l + '</div><b' + (cls ? ' class="' + cls + '"' : '') + '>' + v + '</b></div>';
    const tiles = (fin ? [tile('Margin', p.revenue ? fmtPct(p.net / p.revenue * 100, 1) : '—', p.net < 0 ? 'down' : ''), tile('Budget used', br.length ? pct(sum(br, x => x.actual), sum(br, x => x.amount)) + '%' : '—'), tile('KPIs on target', ks.filter(k => kpiStatus(k) === 'good').length + ' / ' + ks.length), tile('Net profit', money(p.net, { compact: true }), p.net < 0 ? 'down' : '')] : [tile('KPIs on target', ks.filter(k => kpiStatus(k) === 'good').length + ' / ' + ks.length)])
      .concat([tile('Projects', ps.length), tile('Open / overdue', ts.length + ' / ' + ts.filter(isOverdue).length)]);
    const risky = ps.filter(s => s.health !== 'on_track').length;
    return '<div class="stack" style="gap:12px" data-act="open-company" data-id="' + c.id + '"><div class="row"><i style="width:9px;height:9px;border-radius:50%;background:var(--brand)"></i><b>' + esc(c.name) + '</b></div><div class="tiles-3">' + tiles.join('') + '</div><div class="row small">' + icon('ok').replace('<svg', '<svg width="16" height="16" style="color:var(--brand-2)"') + '<b>Projects:</b> ' + (risky ? risky + ' need attention' : 'all on track') + '</div></div>';
  }).join('<div class="hr"></div>'), { actions: can('reports.view') ? '<button class="link" data-act="nav" data-page="reports">Reports →</button>' : '' });
}
function deadlineBlocks(tasks, days, limit) {
  const list = tasks.filter(t => t.status !== 'completed' && daysUntil(t.dueDate) <= days).sort((a, b) => a.dueDate < b.dueDate ? -1 : 1).slice(0, limit);
  if (!list.length) return emptyState('Nothing due in the next ' + days + ' days.');
  return '<div class="stack" style="gap:14px">' + list.map(t => { const d = parseD(t.dueDate); return '<div class="dl-row" data-act="open" data-t="task" data-id="' + t.id + '"><div class="date-block"><small>' + MONTHS[d.getMonth()].toUpperCase() + '</small><b>' + d.getDate() + '</b></div><div class="grow"><b>' + esc(t.title) + '</b><div class="muted small">' + esc(user(t.assigneeId).name) + ' · ' + esc(dueLabel(t.dueDate)) + '</div><div class="row" style="margin-top:6px">' + badge(TASK_STATUS[t.status].label, TASK_STATUS[t.status].cls) + badge(titleCase(t.priority), { critical: 'b-bad', high: 'b-warn', medium: 'b-info', low: '' }[t.priority]) + '</div></div></div>'; }).join('') + '</div>';
}
function budgetCard(ids, tasks) {
  const rows = budgetRows(ids, CUR_YEAR); const b = sum(rows, r => r.amount), a = sum(rows, r => r.actual);
  const elapsed = Math.round((CUR_MONTH + TODAY.getDate() / 31) / 12 * 100); const used = pct(a, b);
  const open = tasks.filter(t => t.status !== 'completed');
  return card('Budget used ' + CUR_YEAR, '<div class="ov-val" style="margin-bottom:12px">' + used + '%</div><div class="progress" style="height:10px"><i style="width:' + Math.min(100, used) + '%"></i><span class="mark" style="left:' + elapsed + '%"></span></div>' +
    '<div class="muted small" style="margin:8px 0 6px">Marker = ' + elapsed + '% of year elapsed · ' + rows.filter(r => r.util >= state.settings.budgetAlertPct).length + ' line' + (rows.filter(r => r.util >= state.settings.budgetAlertPct).length === 1 ? '' : 's') + ' over the ' + state.settings.budgetAlertPct + '% alert</div>' + cfg() +
    '<div class="hr"></div><div class="small">Work: <b>' + open.length + ' open task' + (open.length === 1 ? '' : 's') + '</b> · ' + open.filter(t => t.status === 'in_progress').length + ' in progress · ' + open.filter(t => t.status === 'blocked').length + ' blocked</div>',
    { actions: '<span class="mono small">' + money(a, { compact: true }) + ' / ' + money(b, { compact: true }) + '</span>' });
}
function workTiles(tasks, projs) {
  const open = tasks.filter(t => t.status !== 'completed');
  const done30 = tasks.filter(t => t.completedAt && t.completedAt.slice(0, 10) >= rel(-30));
  const onTime = done30.filter(t => t.completedAt.slice(0, 10) <= t.dueDate).length;
  return kpiTile('Active projects', String(projs.filter(p => p.status === 'active').length), '<span class="muted">' + projs.map(projectStats).filter(s => s.health !== 'on_track').length + ' need attention</span>', { hero: true, icon: 'folder', act: 'nav-projects' }) +
    kpiTile('Open tasks', String(open.length), '<span class="muted">' + open.filter(t => t.status === 'submitted').length + ' awaiting review</span>', { icon: 'check', act: 'nav-tasks' }) +
    kpiTile('Overdue', String(open.filter(isOverdue).length), '<span class="' + (open.filter(isOverdue).length ? 'down' : 'up') + '">' + (open.length ? fmtPct(open.filter(isOverdue).length / open.length * 100) : '0%') + ' of open work</span>', { icon: 'clock', act: 'nav-tasks' }) +
    kpiTile('Completed · 30 days', String(done30.length), '<span class="muted">' + (done30.length ? fmtPct(onTime / done30.length * 100) : '—') + ' on time</span>', { icon: 'ok' });
}
ACT['nav-projects'] = () => go('projects'); ACT['nav-tasks'] = () => go('tasks');
function weeklyThroughput(tasks) {
  const labels = [], vals = [], late = [];
  for (let w = 11; w >= 0; w--) {
    const end = addDays(TODAY, -w * 7), start = addDays(end, -6);
    const done = tasks.filter(t => t.completedAt && t.completedAt.slice(0, 10) >= ymd(start) && t.completedAt.slice(0, 10) <= ymd(end));
    labels.push(fmtShort(ymd(start))); vals.push(done.filter(t => t.completedAt.slice(0, 10) <= t.dueDate).length); late.push(done.filter(t => t.completedAt.slice(0, 10) > t.dueDate).length);
  }
  return barChart({ labels, series: [{ name: 'On time', color: 'var(--s1)', values: vals }, { name: 'Late', color: 'var(--s2)', values: late }], stacked: true, fmt: v => String(Math.round(v)), tipTitle: i => 'Week of ' + labels[i], aria: 'Tasks completed per week' });
}
function taskStatusMix(tasks) {
  const cols = { todo: 'var(--line-2)', in_progress: 'var(--info)', submitted: 'var(--brand-2)', changes: '#B57E14', blocked: 'var(--danger)' };
  return stackBarEl(Object.keys(cols).map(k => ({ label: TASK_STATUS[k].label, value: tasks.filter(t => t.status === k).length, color: cols[k] })));
}
function deptPerfBars(ids, deptIds) {
  const rows = deptPerformance(ids, deptIds).filter(r => r.onTime != null).sort((a, b) => b.onTime - a.onTime).slice(0, 8);
  if (!rows.length) return '<div class="empty-tile"><span class="ico-box">' + icon('clock') + '</span><div><b>Not enough completed work yet</b><small>Rates appear once tasks are reviewed and completed.</small></div></div>';
  return hbars(rows.map(r => ({ label: r.name, sub: company(r.company).short + ' · ' + r.done + ' done · ' + r.overdue + ' overdue', value: r.onTime, color: companyColor(r.company) })), { fmt: v => fmtPct(v), name: 'On-time rate' });
}
function budgetSummary(ids) {
  const rows = budgetRows(ids, CUR_YEAR); const b = sum(rows, r => r.amount), a = sum(rows, r => r.actual);
  const elapsed = (CUR_MONTH + TODAY.getDate() / 31) / 12 * 100;
  return '<div class="row" style="justify-content:space-between"><span class="strong">Budget used (' + CUR_YEAR + ')</span><span class="num strong">' + money(a, { compact: true }) + ' / ' + money(b, { compact: true }) + '</span></div><div style="margin:8px 0 4px">' + progressBar(pct(a, b), pct(a, b) > elapsed + 5 ? 'warn' : '') + '</div><div class="muted small">' + pct(a, b) + '% used with ' + Math.round(elapsed) + '% of the year elapsed · ' + rows.filter(r => r.util >= state.settings.budgetAlertPct).length + ' lines over the ' + state.settings.budgetAlertPct + '% alert threshold ' + cfg() + '</div>';
}
function companyPerfCard(ids) {
  const [f, t] = ytdRange();
  const fin = can('finance.view');
  const rows = ids.map(company).map(c => {
    const p = fin ? pnl([c.id], f, t) : null;
    const ts = state.tasks.filter(x => x.companyId === c.id); const open = ts.filter(x => x.status !== 'completed');
    const ps = state.projects.filter(x => x.companyId === c.id && x.status === 'active').map(projectStats);
    const ks = state.kpis.filter(k => k.companyId === c.id);
    const br = fin ? budgetRows([c.id], CUR_YEAR) : [];
    return { id: c.id, c, p, open: open.length, overdue: open.filter(isOverdue).length, risky: ps.filter(s => s.health !== 'on_track').length, active: ps.length, kGood: ks.filter(k => kpiStatus(k) === 'good').length, kTot: ks.length, bud: br.length ? pct(sum(br, x => x.actual), sum(br, x => x.amount)) : null };
  });
  const cols = [{ h: 'Company', v: r => '<span class="row" style="flex-wrap:nowrap"><i style="width:10px;height:10px;border-radius:3px;background:' + companyColor(r.id) + ';flex:none"></i><b>' + esc(r.c.name) + '</b></span>' }];
  if (fin) cols.push({ h: 'Revenue YTD', r: 1, v: r => money(r.p.revenue, { compact: true }) }, { h: 'Net profit', r: 1, v: r => '<span class="' + (r.p.net < 0 ? 'down' : '') + '">' + money(r.p.net, { compact: true }) + '</span>' }, { h: 'Margin', r: 1, v: r => r.p.revenue ? fmtPct(r.p.net / r.p.revenue * 100, 1) : '<span class="muted">cost centre</span>' }, { h: 'Budget used', r: 1, v: r => r.bud == null ? '—' : r.bud + '%' });
  cols.push({ h: 'Projects', r: 1, v: r => r.active + (r.risky ? ' <span class="badge b-warn plain">' + r.risky + ' at risk</span>' : '') }, { h: 'Open / overdue', r: 1, v: r => r.open + ' / <span class="' + (r.overdue ? 'down' : '') + '">' + r.overdue + '</span>' }, { h: 'KPIs on target', r: 1, v: r => r.kTot ? r.kGood + '/' + r.kTot : '—' });
  return card('Company performance', tableEl(cols, rows, { rowAct: 'open-company' }), { flush: true, sub: fin ? 'Year to date · click a company for detail' : 'Operational view', actions: can('reports.view') ? '<button class="btn sm ghost" data-act="nav" data-page="reports">Compare in Reports ' + icon('arrowR') + '</button>' : '' });
}
ACT['open-company'] = el => go('companies', { id: el.dataset.id });

function dashCto() {
  const u = me(); const ids = activeCompanyIds();
  const tasks = state.tasks.filter(t => ids.includes(t.companyId));
  const projs = state.projects.filter(p => ids.includes(p.companyId) && p.status !== 'completed');
  const queue = reviewQueue();
  let h = pageHead(greeting() + ', ' + esc(u.name.split(' ')[0]), fmtDate(TODAY_S) + ' · Delivery & technology view · ' + esc(scopeName()), quickActions());
  h += noticeEl('Financial figures are hidden for your role. Finance and the CEO can grant access in Settings → Roles & permissions.', '', 'lock');
  h += '<div class="grid g4" style="margin:16px 0">' + workTiles(tasks, projs) + '</div>';
  h += '<div class="grid g-2-1" style="margin-bottom:16px">' + card('Project portfolio', projectTable(projs), { flush: true, sub: projs.length + ' in flight', actions: '<button class="btn sm ghost" data-act="nav" data-page="projects">All projects ' + icon('arrowR') + '</button>' }) + card('Needs your review', queue.length ? '<div class="list">' + queue.slice(0, 6).map(x => x.html).join('') + '</div>' : emptyState('Nothing is waiting on you.'), { flush: true }) + '</div>';
  h += '<div class="grid g3" style="margin-bottom:16px">' + card('Work completed', weeklyThroughput(tasks), { sub: 'Approved tasks per week, on time vs late' }) + card('Upcoming deadlines', deadlinesList(tasks, 10, 6), { flush: true }) + card('Risks & issues', alertsList(alertsFor(ids).filter(a => a[1] !== 'coins' && a[1] !== 'dollar')), { flush: true }) + '</div>';
  h += '<div class="grid g2">' + card('Workload by department', hbars(deptPerformance(ids).sort((a, b) => b.open - a.open).slice(0, 8).map(r => ({ label: r.name, sub: company(r.company).short + ' · ' + r.overdue + ' overdue', value: r.open, color: companyColor(r.company) })), { fmt: v => String(v), name: 'Open tasks' }), { sub: 'Open tasks' }) + card('Department performance', deptPerfBars(ids), { sub: 'On-time completion, last 6 months' }) + '</div>';
  return h;
}
function projectTable(projs) {
  return tableEl([
    { h: 'Project', v: p => '<b>' + esc(p.name) + '</b><div class="muted small">' + esc(company(p.companyId).short) + ' · ' + esc(user(p.ownerId).name) + '</div>' },
    { h: 'Progress', v: p => { const s = projectStats(p); return '<div class="row" style="flex-wrap:nowrap;gap:8px"><div style="flex:1;min-width:70px">' + progressBar(s.progress) + '</div><span class="num small">' + s.progress + '%</span></div>'; } },
    { h: 'Health', v: p => { const s = projectStats(p); return badge(HEALTH[s.health][0], HEALTH[s.health][1]); } },
    { h: 'Due', nowrap: 1, v: p => fmtShort(p.dueDate) },
  ], projs.slice().sort((a, b) => a.dueDate < b.dueDate ? -1 : 1), { rowAct: 'open-project' });
}
ACT['open-project'] = el => go('projects', { id: el.dataset.id });

function dashFinance() {
  const u = me(); const ids = activeCompanyIds();
  const ar = aging(state.invoices.filter(i => ids.includes(i.companyId)));
  const apDue = state.bills.filter(b => ids.includes(b.companyId) && b.amount > b.paid && daysUntil(b.dueDate) <= 30);
  const drafts = state.transactions.filter(t => t.status === 'draft' && ids.includes(t.companyId));
  const queue = reviewQueue();
  let h = pageHead(greeting() + ', ' + esc(u.name.split(' ')[0]), fmtDate(TODAY_S) + ' · Finance & accounting · ' + esc(scopeName()), '<button class="btn" data-act="new-tx">' + icon('plus') + 'Record transaction</button>' + quickActions());
  h += '<div class="grid g4" style="margin-bottom:16px">' +
    kpiTile('Cash position', money(cashPosition(ids), { compact: true }), deltaTxt(cashPosition(ids), cashPosition(ids, rel(-30)), false, 'vs 30 days ago'), { hero: true, icon: 'dollar', act: 'go-cash' }) +
    kpiTile('Receivables outstanding', money(arOutstanding(ids), { compact: true }), '<span class="' + (ar.d30 + ar.d60 + ar.d90 ? 'down' : 'up') + '">' + money(ar.d30 + ar.d60 + ar.d90, { compact: true }) + ' overdue</span>', { icon: 'arrowR', act: 'go-ar' }) +
    kpiTile('Payables due ≤ 30 days', money(sum(apDue, b => b.amount - b.paid), { compact: true }), '<span class="muted">' + apDue.length + ' bills</span>', { icon: 'arrowL', act: 'go-ap' }) +
    kpiTile('Drafts to post', String(drafts.length), '<span class="muted">' + drafts.filter(d => !d.docs.length).length + ' missing documents</span>', { icon: 'file', act: 'go-tx' }) + '</div>';
  h += '<div class="grid g-2-1" style="margin-bottom:16px">' + card('Revenue vs expenses', revExpChart(ids), { sub: 'Last 12 months' }) + card('Awaiting your approval', queue.length ? '<div class="list">' + queue.slice(0, 6).map(x => x.html).join('') + '</div>' : emptyState('Nothing is waiting on you.'), { flush: true }) + '</div>';
  h += '<div class="grid g3" style="margin-bottom:16px">' +
    card('Cash by company', hbars(ids.map(id => ({ label: company(id).name, value: cashPosition([id]), color: companyColor(id) })).sort((a, b) => b.value - a.value)), { sub: 'All bank & cash accounts' }) +
    card('Receivables aging', stackBarEl([{ label: 'Current', value: Math.round(ar.current), color: 'var(--s3)' }, { label: '1–30 days', value: Math.round(ar.d30), color: 'var(--s4)' }, { label: '31–60', value: Math.round(ar.d60), color: 'var(--s2)' }, { label: '60+', value: Math.round(ar.d90), color: 'var(--bad)' }], v => money(v, { compact: true }), 'Outstanding'), { sub: 'Outstanding by days past due' }) +
    card('Drafts to post', drafts.length ? '<div class="list">' + drafts.slice(0, 5).map(t => '<div class="li clickable" data-act="open" data-t="transaction" data-id="' + t.id + '"><div class="ico-box ' + (t.docs.length ? '' : 'warn') + '">' + icon('file') + '</div><div class="grow"><div class="ttl">' + esc(t.memo) + '</div><div class="meta">' + t.no + ' · ' + esc(company(t.companyId).short) + (t.docs.length ? '' : ' · no document') + '</div></div><b class="num">' + money(t.amount) + '</b></div>').join('') + '</div>' : emptyState('Ledger is up to date.'), { flush: true }) + '</div>';
  h += card('Budget alerts', budgetTable(budgetRows(ids, CUR_YEAR).filter(b => b.util >= state.settings.budgetAlertPct).sort((a, b) => b.util - a.util)), { flush: true, sub: 'Lines at or above ' + state.settings.budgetAlertPct + '% utilization ' + cfg() });
  return h;
}
ACT['go-ar'] = () => { App.ui.finTab = 'receivables'; go('finance'); };
ACT['go-ap'] = () => { App.ui.finTab = 'payables'; go('finance'); };
ACT['go-tx'] = () => { App.ui.finTab = 'transactions'; App.ui.txStatus = 'draft'; go('finance'); };

function dashManager() {
  const u = me();
  const depts = deptTree(u.departmentId);
  const teamIds = uniq(subordinates(u.id).concat(state.users.filter(x => depts.includes(x.departmentId)).map(x => x.id))).filter(id => id !== u.id);
  const tasks = state.tasks.filter(t => visibleTask(t) && (depts.includes(t.departmentId) || teamIds.includes(t.assigneeId) || t.assigneeId === u.id));
  const open = tasks.filter(t => t.status !== 'completed');
  const queue = reviewQueue();
  const projs = state.projects.filter(p => visibleProject(p) && p.status !== 'completed');
  const scopeTxt = u.scope === 'company' ? company(u.companyId).name : dept(u.departmentId).name + ' · ' + company(u.companyId).short;
  let h = pageHead(greeting() + ', ' + esc(u.name.split(' ')[0]), fmtDate(TODAY_S) + ' · ' + esc(scopeTxt), quickActions());
  let budTile = '';
  if (can('budget.view_own')) {
    const br = budgetRows([u.companyId], CUR_YEAR).filter(b => depts.includes(b.departmentId));
    const b = sum(br, x => x.amount), a = sum(br, x => x.actual);
    budTile = kpiTile('Department budget used', b ? pct(a, b) + '%' : '—', '<span class="muted">' + money(a, { compact: true }) + ' of ' + money(b, { compact: true }) + '</span>', { icon: 'coins' });
  } else budTile = kpiTile('Team size', String(teamIds.length), '', { icon: 'users' });
  h += '<div class="grid g4" style="margin-bottom:16px">' + kpiTile('Team open tasks', String(open.length), '<span class="muted">' + open.filter(t => t.status === 'in_progress').length + ' in progress</span>', { hero: true, icon: 'check', act: 'nav-tasks' }) + kpiTile('Overdue', String(open.filter(isOverdue).length), '<span class="' + (open.filter(isOverdue).length ? 'down' : 'up') + '">' + (open.filter(isOverdue).length ? 'Needs follow-up' : 'All on schedule') + '</span>', { icon: 'clock', act: 'nav-tasks' }) + kpiTile('Waiting on you', String(queue.length), '<span class="muted">reviews & approvals</span>', { icon: 'stamp', act: 'nav-approvals' }) + budTile + '</div>';
  const tr = teamRows(teamIds);
  h += '<div class="grid g-2-1" style="margin-bottom:16px">' + card('Team workload', tableEl([
    { h: 'Person', v: r => person(r.id) + '<div class="muted small" style="margin-left:32px">' + esc(r.u.title) + '</div>' },
    { h: 'Open', r: 1, v: r => r.open }, { h: 'Overdue', r: 1, v: r => '<span class="' + (r.overdue ? 'down strong' : '') + '">' + r.overdue + '</span>' },
    { h: 'In review', r: 1, v: r => r.review }, { h: 'Done · 6 mo', r: 1, v: r => r.done }, { h: 'On time', r: 1, v: r => r.onTime == null ? '—' : fmtPct(r.onTime) }], tr, { rowAct: 'open-person', empty: 'No direct reports.' }), { flush: true, sub: teamIds.length + ' people' }) +
    card('Needs your review', queue.length ? '<div class="list">' + queue.slice(0, 6).map(x => x.html).join('') + '</div>' : emptyState('Nothing is waiting on you.'), { flush: true }) + '</div>';
  h += '<div class="stack" style="margin-bottom:16px"><div class="row" style="justify-content:space-between"><h3 style="font-size:15px">Your projects</h3><button class="btn sm ghost" data-act="nav" data-page="projects">All projects ' + icon('arrowR') + '</button></div><div class="grid g4">' + (projs.length ? projs.slice(0, 4).map((p, i) => projectCard(p, i > 0)).join('') : emptyState('No active projects in your area.')) + '</div></div>';
  h += '<div class="grid g3">' + card('Upcoming deadlines', deadlinesList(tasks, 10, 6), { flush: true }) + card('Department performance', deptPerfBars([u.companyId], depts.concat(uniq(teamIds.map(i => user(i).departmentId)))), { sub: 'On-time completion, last 6 months' }) + card(esc(company(u.companyId).short) + ' KPIs', kpiMini(state.kpis.filter(k => k.companyId === u.companyId)), { flush: true }) + '</div>';
  return h;
}
ACT['nav-approvals'] = () => go('approvals');
ACT['open-person'] = el => openDrawer('person', el.dataset.id);
function kpiMini(ks) {
  if (!ks.length) return emptyState('No KPIs defined for this company.');
  const col = { good: 'var(--brand-2)', warn: '#B57E14', bad: 'var(--danger)' };
  return '<div class="list">' + ks.map(k => {
    const st = kpiStatus(k); const v = k.values[k.values.length - 1];
    const w = k.direction === 'down' ? Math.min(100, k.target / v * 100) : Math.min(100, v / k.target * 100);
    return '<div class="li kpi-row"><div class="grow"><div class="ttl">' + esc(k.name) + '</div><div class="meta">Target ' + fmtKpi(k, k.target) + '</div><div class="progress" style="margin-top:8px;height:6px"><i style="width:' + w + '%;background:' + col[st] + '"></i></div></div>' +
      sparkline(k.values, col[st], 100, 28) + '<div style="text-align:right;min-width:74px"><div class="kpi-row-val">' + fmtKpi(k, v) + '</div>' + badge(st === 'good' ? 'On target' : st === 'warn' ? 'Near' : 'Off', st === 'good' ? 'b-good' : st === 'warn' ? 'b-warn' : 'b-bad') + '</div></div>';
  }).join('') + '</div>';
}

function dashMember() {
  const u = me();
  const mine = state.tasks.filter(t => t.assigneeId === u.id);
  const open = mine.filter(t => t.status !== 'completed').sort((a, b) => a.dueDate < b.dueDate ? -1 : 1);
  const week = open.filter(t => daysUntil(t.dueDate) <= 7 && daysUntil(t.dueDate) >= 0);
  const reqs = state.approvals.filter(a => a.requesterId === u.id);
  const projs = state.projects.filter(p => visibleProject(p) && p.status !== 'completed');
  let h = '<div class="page-head"><div><div class="eyebrow">' + fmtDate(TODAY_S) + '</div><h1 style="font-size:28px;font-weight:500;margin-top:4px">Hello, <b style="font-weight:800">' + esc(u.name.split(' ')[0]) + '!</b></h1><p>' + (open.filter(isOverdue).length ? 'You have ' + open.filter(isOverdue).length + ' overdue task' + (open.filter(isOverdue).length > 1 ? 's' : '') + ' — start there.' : week.length ? week.length + ' task' + (week.length > 1 ? 's are' : ' is') + ' due this week.' : 'Nothing urgent today. Have a good day.') + '</p></div><div class="actions">' + quickActions() + '</div></div>';
  h += '<div class="grid g4" style="margin-bottom:16px">' + kpiTile('My open tasks', String(open.length), '', { hero: true, icon: 'check', act: 'nav-tasks' }) + kpiTile('Due this week', String(week.length), '', { icon: 'calendar' }) + kpiTile('Overdue', String(open.filter(isOverdue).length), '', { icon: 'clock' }) + kpiTile('Waiting for review', String(open.filter(t => t.status === 'submitted').length), '<span class="muted">submitted by you</span>', { icon: 'send' }) + '</div>';
  if (projs.length) h += '<div class="grid g4" style="margin-bottom:16px">' + projs.slice(0, 4).map((p, i) => projectCard(p, i > 0)).join('') + '</div>';
  h += '<div class="grid g-2-1" style="margin-bottom:16px">' + card('My tasks', open.length ? '<div class="list">' + open.map(t => taskRow(t)).join('') + '</div>' : emptyState('No open tasks. Nice work.'), { flush: true, actions: '<button class="btn sm ghost" data-act="nav" data-page="tasks">Board view ' + icon('arrowR') + '</button>' }) +
    '<div class="stack">' + card('My requests', reqs.length ? '<div class="list">' + reqs.slice(0, 5).map(approvalRow).join('') + '</div>' : emptyState('You have not submitted any requests.'), { flush: true, actions: '<button class="btn sm" data-act="new-request">' + icon('plus') + 'New</button>' }) +
    card('Recent notifications', (() => { const ns = myNotifications().slice(0, 5); return ns.length ? '<div class="list">' + ns.map(n => '<div class="li clickable" data-act="mark-read" data-id="' + n.id + '"><div class="grow"><div class="ttl" style="' + (n.read ? 'font-weight:500' : '') + '">' + esc(n.title) + '</div><div class="meta">' + ago(n.at) + '</div></div></div>').join('') + '</div>' : emptyState('No notifications.'); })(), { flush: true }) + '</div></div>';
  h += card('Recently completed', (() => { const d = mine.filter(t => t.status === 'completed').sort((a, b) => (a.completedAt || '') < (b.completedAt || '') ? 1 : -1).slice(0, 5); return d.length ? '<div class="list">' + d.map(t => taskRow(t)).join('') + '</div>' : emptyState('Nothing completed yet.'); })(), { flush: true });
  return h;
}
