/* =====================================================================
   Companies & People
   ===================================================================== */
VIEWS.companies = function () {
  if (App.route.id) return companyDetail(App.route.id);
  const ids = scopeCompanyIds(); const fin = can('finance.view'); const [f, t] = ytdRange();
  let h = pageHead('Companies', ids.length + ' ' + (ids.length === 1 ? 'company' : 'companies') + ' in your scope · each has its own structure, people, budgets and KPIs', can('companies.manage') ? '<button class="btn primary" data-act="co-new">' + icon('plus') + 'Add company</button>' : '');
  h += '<div class="grid g3">' + ids.map(company).map(c => {
    const people = state.users.filter(u => u.companyId === c.id && u.active !== false).length;
    const depts = state.departments.filter(d => d.companyId === c.id).length;
    const ps = state.projects.filter(p => p.companyId === c.id && p.status === 'active');
    const ks = state.kpis.filter(k => k.companyId === c.id);
    const p = fin ? pnl([c.id], f, t) : null;
    const ser = fin ? monthlySeries([c.id], lastNMonths(9)) : null;
    return '<div class="card" style="padding:18px;cursor:pointer;display:flex;flex-direction:column;gap:14px" data-act="open-company" data-id="' + c.id + '"><div class="row" style="justify-content:space-between;align-items:flex-start;flex-wrap:nowrap"><div class="row" style="flex-wrap:nowrap;gap:12px"><div class="ico-box" style="background:' + companyColor(c.id) + ';color:#fff">' + icon('building') + '</div><div><h3 style="font-size:16px">' + esc(c.name) + '</h3><div class="muted small">' + esc(c.industry) + ' · ' + esc(c.country) + '</div></div></div>' + (c.isHolding ? badge('Parent', 'b-brand', true) : '') + '</div>' +
      (fin ? '<div class="row" style="justify-content:space-between;align-items:flex-end"><div><div class="eyebrow">' + (c.isHolding ? 'Group costs YTD' : 'Revenue YTD') + '</div><div class="kpi-val num" style="font-size:22px;font-weight:700">' + money(c.isHolding ? p.expenses : p.revenue, { compact: true }) + '</div><div class="small ' + (p.net >= 0 ? 'up' : 'down') + '">' + (c.isHolding ? 'Cost centre' : 'Net ' + money(p.net, { compact: true }) + ' · ' + fmtPct(p.net / p.revenue * 100, 1)) + '</div></div>' + sparkline(ser.map(s => c.isHolding ? s.expenses : s.revenue), companyColor(c.id), 110, 36) + '</div>' : '<p class="muted small" style="margin:0">' + esc(c.description) + '</p>') +
      '<div class="grid g4" style="gap:8px;text-align:center"><div><b class="num">' + people + '</b><div class="muted small">people</div></div><div><b class="num">' + depts + '</b><div class="muted small">depts</div></div><div><b class="num">' + ps.length + '</b><div class="muted small">projects</div></div><div><b class="num">' + ks.filter(k => kpiStatus(k) === 'good').length + '/' + ks.length + '</b><div class="muted small">KPIs</div></div></div>' +
      '<div class="muted small">Structure: ' + esc(c.structure || '—') + '</div></div>';
  }).join('') + '</div>';
  return h;
};
function companyDetail(id) {
  const c = company(id);
  if (!scopeCompanyIds().includes(id)) return pageHead('Company not available', 'Outside your access scope.');
  const tab = App.ui.coTab || 'overview'; const fin = can('finance.view');
  const people = state.users.filter(u => u.companyId === id);
  let h = '<button class="btn ghost sm" data-act="nav" data-page="companies" style="margin-bottom:10px">' + icon('arrowL') + 'All companies</button>';
  h += pageHead(esc(c.name), esc(c.industry) + ' · ' + esc(c.country) + ' · founded ' + c.founded, (can('tasks.create') ? '<button class="btn" data-act="new-task">' + icon('plus') + 'New task</button>' : '') + (can('reports.view') ? '<button class="btn" data-act="co-report" data-id="' + id + '">' + icon('chart') + 'Reports</button>' : ''));
  const tabs = [['overview', 'Overview'], ['structure', 'Structure'], ['people', 'People', people.length], ['projects', 'Projects'], ['kpis', 'KPIs']]; if (fin) tabs.push(['finance', 'Finance']);
  h += tabsEl(tabs, tab, 'co-tab');
  if (tab === 'overview') {
    const [f, t] = ytdRange(); const p = fin ? pnl([id], f, t) : null;
    const ps = state.projects.filter(x => x.companyId === id && x.status !== 'completed');
    const ts = state.tasks.filter(x => x.companyId === id && x.status !== 'completed');
    h += '<div class="grid g4" style="margin-bottom:16px">' + (fin ? kpiTile('Revenue YTD', money(p.revenue, { compact: true }), '<span class="muted">Net ' + money(p.net, { compact: true }) + '</span>', { hero: true }) + kpiTile('Cash', money(cashPosition([id]), { compact: true }), '') : kpiTile('People', String(people.length), '', { hero: true }) + kpiTile('Departments', String(state.departments.filter(d => d.companyId === id).length), '')) + kpiTile('Active projects', String(ps.filter(x => x.status === 'active').length), '<span class="muted">' + ps.map(projectStats).filter(s => s.health !== 'on_track').length + ' need attention</span>') + kpiTile('Open tasks', String(ts.length), '<span class="' + (ts.filter(isOverdue).length ? 'down' : 'muted') + '">' + ts.filter(isOverdue).length + ' overdue</span>') + '</div>';
    h += '<div class="grid g3">' + card('About', '<p style="margin-top:0">' + esc(c.description) + '</p><dl class="dl"><dt>Structure</dt><dd>' + esc(c.structure || '—') + '</dd><dt>Code</dt><dd class="mono">' + esc(c.code) + '</dd><dt>People</dt><dd>' + people.length + '</dd></dl>') +
      card('Leadership', '<div class="stack" style="gap:10px">' + uniq(state.departments.filter(d => d.companyId === id && d.headId).map(d => d.headId)).concat(people.filter(u => ['ceo', 'owner'].includes(u.role)).map(u => u.id)).filter((v, i, a) => a.indexOf(v) === i).map(uid_ => { const u = user(uid_); return '<button class="link" data-act="open-person" data-id="' + u.id + '" style="font-weight:500;color:var(--ink)">' + person(u.id, { title: 1 }) + '</button>'; }).join('') + '</div>') +
      card('KPIs', kpiMini(state.kpis.filter(k => k.companyId === id)), { flush: true }) + '</div>';
  } else if (tab === 'structure') {
    const roots = state.departments.filter(d => d.companyId === id && !d.parentId);
    const node = d => { const kids = state.departments.filter(x => x.parentId === d.id); const n = state.users.filter(u => u.departmentId === d.id).length; return '<div class="node"><div class="ico-box">' + icon('users') + '</div><div style="flex:1;min-width:0"><b>' + esc(d.name) + '</b><div class="muted small">' + n + ' people · Head: ' + (d.headId ? esc(user(d.headId).name) : '<span class="down">vacant</span>') + '</div></div>' + (can('companies.manage') ? '<button class="btn sm ghost" data-act="dept-edit" data-id="' + d.id + '">Edit</button>' : '') + '</div>' + (kids.length ? '<div class="children">' + kids.map(node).join('') + '</div>' : ''); };
    h += card('Organization structure', noticeEl('Each company defines its own departments and sub-teams. ' + esc(c.name) + ': <b>' + esc(c.structure || 'custom') + '</b>.') + '<div style="height:14px"></div><div class="tree">' + roots.map(node).join('') + '</div>', { actions: can('companies.manage') ? '<button class="btn sm" data-act="dept-new" data-id="' + id + '">' + icon('plus') + 'Add department</button>' : '' });
  } else if (tab === 'people') {
    h += card('', peopleTable(people.filter(u => canSeeUser(u))), { flush: true });
  } else if (tab === 'projects') {
    h += card('', projectTable(state.projects.filter(p => p.companyId === id && visibleProject(p))), { flush: true });
  } else if (tab === 'kpis') {
    const ks = state.kpis.filter(k => k.companyId === id);
    h += '<div class="row" style="justify-content:flex-end;margin-bottom:12px">' + (can('kpi.update') ? '<button class="btn" data-act="kpi-new" data-id="' + id + '">' + icon('plus') + 'Add KPI</button>' : '') + '</div><div class="grid g3">' + ks.map(kpiCard).join('') + '</div>';
  } else if (tab === 'finance') {
    const [f, t] = ytdRange(); const p = pnl([id], f, t);
    h += '<div class="grid g4" style="margin-bottom:16px">' + financeTiles([id]) + '</div><div class="grid g-2-1" style="margin-bottom:16px">' + card('Revenue vs expenses', revExpChart([id])) + card('Expenses by category · YTD', hbars(Object.entries(p.exp).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k, value: v, color: 'var(--s2)' })))) + '</div>' + card('Budget vs actual', budgetTable(budgetRows([id], CUR_YEAR).sort((a, b) => b.util - a.util)), { flush: true });
  }
  return h;
}
function kpiCard(k) {
  const st = kpiStatus(k); const v = k.values[k.values.length - 1]; const col = { good: 'var(--good)', warn: 'var(--warn)', bad: 'var(--bad)' }[st];
  const labels = lastNMonths(k.values.length).map(m => MONTHS[m.m]);
  return '<div class="card" style="padding:16px 18px"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="strong">' + esc(k.name) + '</div><div class="muted small">' + esc(company(k.companyId).short) + ' · owner ' + esc(user(k.ownerId).name) + '</div></div>' + badge(st === 'good' ? 'On target' : st === 'warn' ? 'Near target' : 'Off target', st === 'good' ? 'b-good' : st === 'warn' ? 'b-warn' : 'b-bad') + '</div><div class="row" style="align-items:baseline;margin:10px 0 2px"><span class="kpi-val num" style="font-size:24px;font-weight:700">' + fmtKpi(k, v) + '</span><span class="muted small">target ' + (k.direction === 'down' ? '≤ ' : '≥ ') + fmtKpi(k, k.target) + '</span></div>' +
    lineChart({ labels, series: [{ name: k.name, color: col, values: k.values }], target: k.target, zero: false, height: 150, fmt: x => fmtKpi(k, x), noLegend: true, aria: k.name + ' trend' }) + '<div class="row" style="justify-content:space-between"><span class="muted small">' + esc(k.description || '') + '</span>' + (can('kpi.update') ? '<button class="btn sm" data-act="kpi-update" data-id="' + k.id + '">Update</button>' : '') + '</div></div>';
}
Object.assign(ACT, {
  'co-tab': el => { App.ui.coTab = el.dataset.v; render(); },
  'co-report': el => { App.ui.rf = { companies: [el.dataset.id], tab: 'overview', period: 'ytd' }; go('reports'); },
  'kpi-update': el => { const k = state.kpis.find(x => x.id === el.dataset.id); openModal(modalShell('Update ' + esc(k.name), field('Actual for ' + MONTHS_L[CUR_MONTH] + ' ' + CUR_YEAR + (k.unit === '%' ? ' (%)' : k.unit === '$' ? ' ($)' : ''), inputEl('value', k.values[k.values.length - 1], 'type="number" step="0.1"'), { hint: 'Replaces this month’s value. Previous value is kept in the audit log.' }) + '<div style="height:12px"></div>' + field('Target', inputEl('target', k.target, 'type="number" step="0.1"')), '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="kpi-save" data-id="' + k.id + '">Save</button>')); },
  'kpi-save': el => { const k = state.kpis.find(x => x.id === el.dataset.id); const v = formVals(); const nv = Number(v.value), nt = Number(v.target); if (isNaN(nv) || isNaN(nt)) return; audit('updated', 'kpi', k.id, k.name + ': ' + fmtKpi(k, k.values[k.values.length - 1]) + ' → ' + fmtKpi(k, nv) + (nt !== k.target ? ', target ' + fmtKpi(k, k.target) + ' → ' + fmtKpi(k, nt) : '')); k.values[k.values.length - 1] = nv; k.target = nt; closeModal(); toast('KPI updated'); render(); },
  'kpi-new': el => { const cid = el.dataset.id; openModal(modalShell('Add KPI', '<div class="form-grid">' + field('Name', inputEl('name', ''), { full: 1 }) + field('Unit', selectF('unit', [['#', 'Number'], ['%', 'Percent'], ['$', 'Currency']], '#')) + field('Better when', selectF('direction', [['up', 'Higher'], ['down', 'Lower']], 'up')) + field('Target', inputEl('target', '', 'type="number" step="0.1"')) + field('Current value', inputEl('value', '', 'type="number" step="0.1"')) + field('Owner', selectF('ownerId', userOptions(state.users.filter(u => u.companyId === cid)), me().id), { full: 1 }) + '</div>', '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="kpi-add" data-id="' + cid + '">Add KPI</button>')); },
  'kpi-add': el => { const v = formVals(); if (!v.name.trim() || v.target === '' || v.value === '') { toast('Name, target and value are required', true); return; } const k = { id: uid('k'), companyId: el.dataset.id, name: v.name.trim(), unit: v.unit, target: Number(v.target), direction: v.direction, values: Array(9).fill(Number(v.value)), ownerId: v.ownerId, description: '' }; state.kpis.push(k); audit('created', 'kpi', k.id, 'Added KPI ' + k.name); closeModal(); render(); },
  'dept-new': el => deptForm({ companyId: el.dataset.id }),
  'dept-edit': el => deptForm(dept(el.dataset.id)),
  'co-new': () => openModal(modalShell('Add company', '<div class="form-grid">' + field('Legal name', inputEl('name', ''), { full: 1 }) + field('Short name', inputEl('short', '')) + field('Code', inputEl('code', '')) + field('Industry', inputEl('industry', '')) + field('Country', inputEl('country', '')) + field('Structure', inputEl('structure', '', 'placeholder="e.g. Flat, functional, squads"'), { full: 1 }) + field('Description', '<textarea class="input" name="description" id="f_description"></textarea>', { full: 1 }) + '</div>' + noticeEl('A first department and bank account are created so the company can receive tasks and transactions immediately.'), '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="co-add">Add company</button>'), true),
  'co-add': () => {
    const v = formVals(); if (!v.name.trim()) { toast('Name is required', true); return; }
    const c = { id: uid('c'), name: v.name.trim(), short: v.short.trim() || v.name.trim(), code: v.code.trim().toUpperCase() || 'NEW', industry: v.industry.trim() || '—', country: v.country.trim() || '—', founded: CUR_YEAR, slot: (state.companies.filter(x => x.slot).length % 4) + 1, fixedAssets: 0, loans: 0, capital: 0, structure: v.structure.trim(), description: v.description.trim() };
    state.companies.push(c); state.departments.push({ id: uid('d'), companyId: c.id, name: 'Management', headId: null, parentId: null });
    state.accounts.push({ id: uid('a'), companyId: c.id, name: 'Operating account', type: 'bank', institution: 'Primary bank', last4: '', opening: 0 });
    audit('created', 'company', c.id, 'Added company ' + c.name); closeModal(); toast(c.name + ' added'); go('companies', { id: c.id });
  },
});
function deptForm(d) {
  const isNew = !d.id; const cid = d.companyId;
  openModal(modalShell(isNew ? 'Add department' : 'Edit ' + esc(d.name), '<div class="form-grid">' + field('Name', inputEl('name', d.name || ''), { full: 1 }) + field('Part of', selectF('parentId', [['', '— Top level —']].concat(state.departments.filter(x => x.companyId === cid && x.id !== d.id).map(x => [x.id, x.name])), d.parentId || '')) + field('Head', selectF('headId', [['', 'Vacant']].concat(state.users.filter(u => u.companyId === cid || u.scope === 'holding').map(u => [u.id, u.name])), d.headId || '')) + '</div>', '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="dept-save" data-id="' + (d.id || '') + '" data-co="' + cid + '">Save</button>'));
}
ACT['dept-save'] = el => {
  const v = formVals(); if (!v.name.trim()) { toast('Name is required', true); return; }
  if (el.dataset.id) { const d = dept(el.dataset.id); Object.assign(d, { name: v.name.trim(), parentId: v.parentId || null, headId: v.headId || null }); audit('edited', 'department', d.id, 'Updated department ' + d.name); }
  else { const d = { id: uid('d'), companyId: el.dataset.co, name: v.name.trim(), parentId: v.parentId || null, headId: v.headId || null }; state.departments.push(d); audit('created', 'department', d.id, 'Added department ' + d.name + ' to ' + company(d.companyId).name); }
  closeModal(); render();
};

/* ---------- People ---------- */
function roleBadge(r) { return badge(roleLabel(r), { owner: 'b-brand', ceo: 'b-brand', cto: 'b-info', finance: 'b-good', manager: 'b-warn', member: '' }[r], true); }
function peopleTable(list) {
  return tableEl([
    { h: 'Person', v: u => '<div class="row" style="flex-wrap:nowrap;gap:10px">' + avatar(u) + '<div><b>' + esc(u.name) + '</b><div class="muted small">' + esc(u.title) + '</div></div></div>' },
    { h: 'Company', v: u => companyTag(u.companyId) }, { h: 'Department', v: u => esc(dept(u.departmentId).name) },
    { h: 'Role', v: u => roleBadge(u.role) }, { h: 'Reports to', v: u => u.managerId ? person(u.managerId) : '<span class="muted">—</span>' },
    { h: 'Access', v: u => '<span class="small">' + esc(SCOPES[u.scope]) + '</span>' },
    { h: 'Status', v: u => u.active === false ? badge('Inactive', '') : badge('Active', 'b-good') },
  ], list, { rowAct: 'open-person', pageSize: 30, pageKey: 'ppg', empty: 'No people match.' });
}
VIEWS.people = function () {
  const f = App.ui.pplf || (App.ui.pplf = { company: 'all', role: 'all', q: '' });
  let list = state.users.filter(u => canSeeUser(u) && inActive(u.companyId));
  const total = list.length;
  if (f.company !== 'all') list = list.filter(u => u.companyId === f.company);
  if (f.role !== 'all') list = list.filter(u => u.role === f.role);
  if (f.q) { const q = f.q.toLowerCase(); list = list.filter(u => (u.name + ' ' + u.title + ' ' + u.email).toLowerCase().includes(q)); }
  let h = pageHead('People', total + ' people you can see · every person has their own login, role, company, department, manager and access scope', can('people.manage') ? '<button class="btn primary" data-act="person-new">' + icon('plus') + 'Add person</button>' : '');
  h += '<div class="filters">' + (activeCompanyIds().length > 1 ? selectEl('pp-co', companyOptions(null, true), f.company, 'data-act-change="pplf" data-k="company" aria-label="Company"') : '') + selectEl('pp-role', [['all', 'All roles']].concat(ROLE_KEYS.map(r => [r, roleLabel(r)])), f.role, 'data-act-change="pplf" data-k="role" aria-label="Role"') + '<input class="input" id="pp-q" placeholder="Search name, title, email" value="' + esc(f.q) + '" data-act-input="pplf" data-k="q"></div>';
  h += card('', peopleTable(list.sort((a, b) => state.roles[b.role].level - state.roles[a.role].level || a.name.localeCompare(b.name))), { flush: true });
  return h;
};
CHANGE.pplf = el => { App.ui.pplf[el.dataset.k] = el.value; App.ui.ppg = 0; render(); };
DRAWERS.person = function (id) {
  const u = user(id); if (!canSeeUser(u) && !can('people.view')) return '';
  const chain = []; let m = u.managerId; while (m && chain.length < 8) { chain.push(m); m = user(m).managerId; }
  const reports = state.users.filter(x => x.managerId === u.id);
  const open = state.tasks.filter(t => t.assigneeId === u.id && t.status !== 'completed' && visibleTask(t));
  const tr = teamRows([u.id])[0];
  const perms = state.roles[u.role].perms;
  return drawerHead(esc(roleLabel(u.role)) + ' · ' + esc(company(u.companyId).name), esc(u.name), roleBadge(u.role) + badge(SCOPES[u.scope], '', true) + (u.active === false ? badge('Inactive', '') : '')) +
    '<div class="drawer-b">' + (can('people.manage') ? '<div class="action-bar"><button class="btn" data-act="person-edit" data-id="' + u.id + '">' + icon('edit') + 'Edit role & access</button>' + (can('tasks.create') && assignableUsers().some(x => x.id === u.id) ? '<button class="btn" data-act="task-for" data-id="' + u.id + '">' + icon('plus') + 'Assign a task</button>' : '') + '</div>' : '') +
    card('Profile', '<div class="row" style="gap:14px;margin-bottom:14px">' + avatar(u, 'lg') + '<div><div class="strong">' + esc(u.title) + '</div><div class="muted small">' + esc(u.email) + '</div></div></div><dl class="dl"><dt>Company</dt><dd>' + esc(company(u.companyId).name) + '</dd><dt>Department</dt><dd>' + esc(dept(u.departmentId).name) + '</dd><dt>Reports to</dt><dd>' + (u.managerId ? person(u.managerId) : '—') + '</dd><dt>Joined</dt><dd>' + fmtDate(u.joined) + '</dd></dl>') +
    card('Reporting line', '<div class="steps">' + chain.slice().reverse().map(x => '<span class="step"><i>' + esc(user(x).initials) + '</i>' + esc(user(x).name) + '</span>').join('<span class="step-arrow">→</span>') + (chain.length ? '<span class="step-arrow">→</span>' : '') + '<span class="step cur"><i>' + esc(u.initials) + '</i>' + esc(u.name) + '</span></div>' + (reports.length ? '<div class="hr"></div><div class="small strong" style="margin-bottom:8px">Direct reports (' + reports.length + ')</div><div class="stack" style="gap:8px">' + reports.map(r => '<button class="link" style="color:var(--ink);font-weight:500" data-act="open-person" data-id="' + r.id + '">' + person(r.id, { title: 1 }) + '</button>').join('') + '</div>' : '')) +
    card('Work', '<div class="grid g4" style="gap:8px;text-align:center;margin-bottom:12px"><div><b>' + tr.open + '</b><div class="muted small">open</div></div><div><b class="' + (tr.overdue ? 'down' : '') + '">' + tr.overdue + '</b><div class="muted small">overdue</div></div><div><b>' + tr.done + '</b><div class="muted small">done · 6 mo</div></div><div><b>' + (tr.onTime == null ? '—' : fmtPct(tr.onTime)) + '</b><div class="muted small">on time</div></div></div>' + (open.length ? '<div class="list" style="margin:0 -18px">' + open.slice(0, 6).map(t => taskRow(t)).join('') + '</div>' : '<div class="muted small">No open tasks visible to you.</div>')) +
    card('Access', '<dl class="dl"><dt>Role</dt><dd>' + esc(roleLabel(u.role)) + '</dd><dt>Data scope</dt><dd>' + esc(SCOPES[u.scope]) + '</dd><dt>Permissions</dt><dd>' + perms.length + ' of ' + ALL_PERMS.length + '</dd></dl><div class="row" style="margin-top:10px;gap:6px">' + PERMISSIONS.map(p => '<span class="tag" style="' + (perms.includes(p.key) ? '' : 'opacity:.35;text-decoration:line-through') + '">' + esc(p.label) + '</span>').join('') + '</div>') +
    card('Audit history', historyTimeline(u.id, 20)) + '</div>';
};
Object.assign(ACT, {
  'task-for': el => { openNewTask(); setTimeout(() => { const s = document.getElementById('f_assigneeId'); if (s) s.value = el.dataset.id; }, 20); },
  'person-new': () => personForm({}),
  'person-edit': el => personForm(user(el.dataset.id)),
});
function personForm(u) {
  const isNew = !u.id; const cid = u.companyId || scopeCompanyIds()[0];
  openModal(modalShell(isNew ? 'Add person' : 'Edit ' + esc(u.name), '<div class="form-grid">' + field('Full name', inputEl('name', u.name || '')) + field('Job title', inputEl('title', u.title || '')) + field('Work email', inputEl('email', u.email || '', 'type="email"'), { full: 1, hint: 'Used to sign in.' }) +
    field('Company', selectF('companyId', companyOptions(scopeCompanyIds()), cid, 'data-act-change="pf-co"')) + field('Department', '<span id="pf-dept">' + selectF('departmentId', deptOptions(cid), u.departmentId) + '</span>') +
    field('Reports to', selectF('managerId', [['', '— No manager —']].concat(state.users.filter(x => x.id !== u.id && x.active !== false).map(x => [x.id, x.name + ' — ' + x.title])), u.managerId || '')) +
    field('Role', selectF('role', ROLE_KEYS.map(r => [r, roleLabel(r)]), u.role || 'member', 'data-act-change="pf-role"'), { hint: 'Controls which modules and actions are available.' }) +
    field('Data scope', selectF('scope', Object.entries(SCOPES), u.scope || 'self'), { hint: 'Which records they can see within those modules.' }) +
    (isNew ? '' : '<label class="check" style="align-self:end"><input type="checkbox" class="toggle" name="active" id="f_active"' + (u.active !== false ? ' checked' : '') + '> Active account</label>') + '</div>', '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="person-save" data-id="' + (u.id || '') + '">' + (isNew ? 'Add person' : 'Save changes') + '</button>'), true);
}
CHANGE['pf-co'] = el => { document.getElementById('pf-dept').innerHTML = selectF('departmentId', deptOptions(el.value)); };
CHANGE['pf-role'] = el => { const s = document.getElementById('f_scope'); if (s) s.value = state.roles[el.value].defaultScope; };
ACT['person-save'] = el => {
  const v = formVals(); if (!v.name.trim() || !v.email.trim()) { toast('Name and email are required', true); return; }
  if (state.users.some(x => x.email.toLowerCase() === v.email.trim().toLowerCase() && x.id !== el.dataset.id)) { toast('That email is already in use', true); return; }
  if (el.dataset.id) {
    const u = user(el.dataset.id); const ch = [];
    for (const k of ['name', 'title', 'email', 'companyId', 'departmentId', 'managerId', 'role', 'scope']) { const nv = (v[k] || '').trim ? v[k].trim() : v[k]; if ((u[k] || '') !== (nv || '')) { ch.push(k === 'role' ? 'role ' + roleLabel(u.role) + ' → ' + roleLabel(nv) : k === 'scope' ? 'scope ' + SCOPES[u.scope] + ' → ' + SCOPES[nv] : k === 'managerId' ? 'manager → ' + (nv ? user(nv).name : 'none') : k); u[k] = nv || null; } }
    if (u.active !== v.active) { ch.push(v.active ? 'reactivated' : 'deactivated'); u.active = v.active; }
    if (u.id === state.session.userId && !can('people.manage')) toast('You changed your own access — some screens may disappear.');
    if (ch.length) audit('edited', 'user', u.id, 'Updated ' + u.name + ': ' + ch.join(', '));
    closeModal(); refresh(); return;
  }
  const initials = v.name.trim().split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase();
  const u = { id: uid('u'), name: v.name.trim(), title: v.title.trim() || 'Team member', email: v.email.trim(), role: v.role, scope: v.scope, companyId: v.companyId, departmentId: v.departmentId, managerId: v.managerId || null, initials, color: ['#4a3aa7', '#1c7c63', '#2a64c4', '#b4532a', '#8a3c8f'][state.users.length % 5], active: true, joined: TODAY_S };
  state.users.push(u); audit('created', 'user', u.id, 'Added ' + u.name + ' as ' + roleLabel(u.role) + ' in ' + company(u.companyId).name);
  if (u.managerId) notify(u.managerId, { type: 'task', title: u.name + ' joined your team', body: u.title, link: { page: 'people' } });
  closeModal(); toast(u.name + ' added — they can sign in with ' + u.email); render();
};
