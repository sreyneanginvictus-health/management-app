/* =====================================================================
   Reports & KPIs, Operations (risks, recurring work)
   ===================================================================== */
function reportScope() {
  const u = me();
  const rf = App.ui.rf || (App.ui.rf = { companies: [], tab: 'overview', period: 'ytd' });
  let ids = activeCompanyIds();
  if (rf.companies.length) ids = ids.filter(id => rf.companies.includes(id));
  if (!ids.length) ids = activeCompanyIds();
  let deptIds = null, userIds = state.users.filter(x => ids.includes(x.companyId)).map(x => x.id);
  if (u.scope === 'department') { deptIds = deptTree(u.departmentId); userIds = uniq(subordinates(u.id).concat(state.users.filter(x => deptIds.includes(x.departmentId)).map(x => x.id))); }
  if (u.scope === 'self') { userIds = [u.id]; }
  return { ids, deptIds, userIds, rf };
}
VIEWS.reports = function () {
  const { ids, deptIds, userIds, rf } = reportScope();
  const fin = can('reports.finance');
  const tabs = [['overview', 'Overview'], ['companies', 'Company comparison'], ['departments', 'Departments'], ['projects', 'Projects'], ['team', 'Team'], ['operations', 'Operations']];
  if (fin) tabs.push(['finance', 'Financial']);
  let h = pageHead('Reports & KPIs', 'Performance across ' + (ids.length === state.companies.length ? 'the entire holding' : ids.map(i => company(i).short).join(', ')) + (deptIds ? ' · limited to your department' : ''), selectEl('rf-period', periodOptions(), (App.ui.rf || {}).period || 'ytd', 'data-act-change="rf-period" aria-label="Period"') + '<button class="btn" data-act="copy-report">' + icon('copy') + 'Copy table as CSV</button>');
  const avail = activeCompanyIds();
  if (avail.length > 1) h += '<div class="filters">' + (avail.length > 1 ? '<button class="chip ' + (!rf.companies.length ? 'on' : '') + '" data-act="rf-co" data-v="all">All companies</button>' + avail.map(id => '<button class="chip ' + (rf.companies.includes(id) ? 'on' : '') + '" data-act="rf-co" data-v="' + id + '"><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:' + companyColor(id) + ';margin-right:6px"></i>' + esc(company(id).short) + '</button>').join('') : '') + '</div>';
  h += tabsEl(tabs, rf.tab, 'rf-tab');
  const [f, t] = periodRange(rf.period);
  const fn = { overview: repOverview, companies: repCompanies, departments: repDepartments, projects: repProjects, team: repTeam, operations: repOperations, finance: repFinance }[rf.tab] || repOverview;
  return h + fn({ ids, deptIds, userIds, f, t, fin });
};
Object.assign(ACT, {
  'rf-tab': el => { App.ui.rf.tab = el.dataset.v; render(); },
  'rf-co': el => { const rf = App.ui.rf; const v = el.dataset.v; if (v === 'all') rf.companies = []; else rf.companies = rf.companies.includes(v) ? rf.companies.filter(x => x !== v) : rf.companies.concat(v); render(); },
  'copy-report': () => { const tbl = document.querySelector('#content .t'); if (!tbl) { toast('No table on this view', true); return; } const csv = [...tbl.querySelectorAll('tr')].map(tr => [...tr.children].map(td => '"' + td.innerText.replace(/\s+/g, ' ').replace(/"/g, '""').trim() + '"').join(',')).join('\n'); navigator.clipboard.writeText(csv).then(() => toast('Copied as CSV'), () => toast('Copy failed', true)); },
});
CHANGE['rf-period'] = el => { App.ui.rf.period = el.value; render(); };

function tasksIn(ctx) { return state.tasks.filter(x => ctx.ids.includes(x.companyId) && (!ctx.deptIds || ctx.deptIds.includes(x.departmentId) || ctx.userIds.includes(x.assigneeId)) && (me().scope !== 'self' || x.assigneeId === me().id)); }
function repOverview(ctx) {
  const tasks = tasksIn(ctx);
  const done = tasks.filter(x => x.completedAt && x.completedAt.slice(0, 10) >= ctx.f && x.completedAt.slice(0, 10) <= ctx.t);
  const onTime = done.filter(x => x.completedAt.slice(0, 10) <= x.dueDate).length;
  const ks = state.kpis.filter(k => ctx.ids.includes(k.companyId));
  let h = '<div class="grid g4" style="margin-bottom:16px">';
  if (ctx.fin && !ctx.deptIds) { const p = pnl(ctx.ids, ctx.f, ctx.t), ly = pnl(ctx.ids, ...priorYear([ctx.f, ctx.t])); h += kpiTile('Revenue', money(p.revenue, { compact: true }), deltaTxt(p.revenue, ly.revenue, false, 'vs prior year'), { hero: true }) + kpiTile('Net profit', money(p.net, { compact: true }), '<span class="muted">' + fmtPct(p.revenue ? p.net / p.revenue * 100 : 0, 1) + ' margin</span>'); }
  else h += kpiTile('Tasks completed', String(done.length), '<span class="muted">in period</span>', { hero: true }) + kpiTile('Open tasks', String(tasks.filter(x => x.status !== 'completed').length), '<span class="muted">' + tasks.filter(isOverdue).length + ' overdue</span>');
  h += kpiTile('On-time delivery', done.length ? fmtPct(onTime / done.length * 100) : '—', '<span class="muted">' + done.length + ' tasks completed in period</span>') + kpiTile('KPIs on target', ks.filter(k => kpiStatus(k) === 'good').length + ' / ' + ks.length, '<span class="muted">' + ks.filter(k => kpiStatus(k) === 'bad').length + ' off target</span>') + '</div>';
  h += '<div class="grid g2" style="margin-bottom:16px">' + (ctx.fin && !ctx.deptIds ? card('Revenue by company', revenueByCompanyChart(ctx.ids), { sub: 'Last 12 months · ' + MONTHS[CUR_MONTH] + ' is month to date', actions: legendEl(ctx.ids.filter(id => !company(id).isHolding).slice(0, 4).map((id, i, a) => ({ name: company(id).name, color: a.length === 1 ? 'var(--s1)' : companyColor(id) }))) }) : card('Work completed', weeklyThroughput(tasks), { sub: 'Tasks approved per week' })) + card('KPI scorecard', kpiMini(ks), { flush: true, sub: ks.length + ' KPIs' }) + '</div>';
  h += '<div class="grid g2">' + card('Department on-time rate', deptPerfBars(ctx.ids, ctx.deptIds), { sub: 'Last 6 months' }) + card('Work status', taskStatusMix(tasks.filter(x => x.status !== 'completed'))) + '</div>';
  return h;
}
function revenueByCompanyChart(ids) {
  const rev = ids.filter(id => !company(id).isHolding).slice(0, 4);
  const months = lastNMonths(12);
  return lineChart({ labels: months.map(m => MONTHS[m.m]), series: rev.map((id, i) => ({ name: company(id).name, color: rev.length === 1 ? 'var(--s1)' : companyColor(id), values: monthlySeries([id], months).map(s => s.revenue) })), area: rev.length === 1, smooth: true, mtdLast: true, noLegend: true, aria: 'Revenue by company' }) + '<div class="muted small" style="margin-top:6px">' + MONTHS_L[CUR_MONTH] + ' is month to date.</div>';
}
function companyMetrics(ctx) {
  return ctx.ids.map(id => {
    const c = company(id); const p = ctx.fin ? pnl([id], ctx.f, ctx.t) : null; const ly = ctx.fin ? pnl([id], ...priorYear([ctx.f, ctx.t])) : null;
    const heads = state.users.filter(u => u.companyId === id && u.active !== false).length;
    const ts = state.tasks.filter(x => x.companyId === id);
    const done = ts.filter(x => x.completedAt && x.completedAt.slice(0, 10) >= ctx.f && x.completedAt.slice(0, 10) <= ctx.t);
    const onTime = done.filter(x => x.completedAt.slice(0, 10) <= x.dueDate).length;
    const ps = state.projects.filter(x => x.companyId === id && x.status === 'active').map(projectStats);
    const ks = state.kpis.filter(k => k.companyId === id);
    const br = ctx.fin ? budgetRows([id], CUR_YEAR) : [];
    return { id, c, p, ly, heads, done: done.length, onTime: done.length ? onTime / done.length * 100 : null, overdue: ts.filter(isOverdue).length, risky: ps.filter(s => s.health !== 'on_track').length, active: ps.length, kGood: ks.filter(k => kpiStatus(k) === 'good').length, kTot: ks.length, bud: br.length ? pct(sum(br, x => x.actual), sum(br, x => x.amount)) : null, risks: state.risks.filter(r => r.companyId === id && r.status !== 'closed').length };
  });
}
function repCompanies(ctx) {
  const rows = companyMetrics(ctx);
  const cols = [{ h: 'Company', v: r => '<span class="row" style="flex-wrap:nowrap"><i style="width:10px;height:10px;border-radius:3px;background:' + companyColor(r.id) + ';flex:none"></i><b>' + esc(r.c.short) + '</b></span>' }];
  if (ctx.fin) cols.push({ h: 'Revenue', r: 1, v: r => money(r.p.revenue, { compact: true }) }, { h: 'Growth', r: 1, v: r => r.ly.revenue ? deltaTxt(r.p.revenue, r.ly.revenue) : '—' }, { h: 'Net profit', r: 1, v: r => '<span class="' + (r.p.net < 0 ? 'down' : '') + '">' + money(r.p.net, { compact: true }) + '</span>' }, { h: 'Margin', r: 1, v: r => r.p.revenue ? fmtPct(r.p.net / r.p.revenue * 100, 1) : '—' }, { h: 'Revenue / head', r: 1, v: r => r.p.revenue ? money(r.p.revenue / r.heads, { compact: true }) : '—' }, { h: 'Budget used', r: 1, v: r => r.bud == null ? '—' : r.bud + '%' });
  cols.push({ h: 'People', r: 1, v: r => r.heads }, { h: 'Done', r: 1, v: r => r.done }, { h: 'On time', r: 1, v: r => r.onTime == null ? '—' : fmtPct(r.onTime) }, { h: 'Overdue', r: 1, v: r => '<span class="' + (r.overdue ? 'down' : '') + '">' + r.overdue + '</span>' }, { h: 'Projects at risk', r: 1, v: r => r.risky + '/' + r.active }, { h: 'Open risks', r: 1, v: r => r.risks }, { h: 'KPIs', r: 1, v: r => r.kTot ? r.kGood + '/' + r.kTot : '—' });
  let h = card('Side-by-side comparison', tableEl(cols, rows, { rowAct: 'open-company' }), { flush: true, sub: fmtDate(ctx.f) + ' – ' + fmtDate(ctx.t) });
  h += '<div class="grid g2" style="margin-top:16px">';
  const subs = rows.filter(r => !r.c.isHolding);
  if (ctx.fin) h += card('Net margin', hbars(subs.map(r => ({ label: r.c.name, value: r.p.revenue ? r.p.net / r.p.revenue * 100 : 0, color: companyColor(r.id) })).sort((a, b) => b.value - a.value), { fmt: v => fmtPct(v, 1), name: 'Net margin' })) + card('Revenue growth vs prior year', hbars(subs.map(r => ({ label: r.c.name, value: r.ly.revenue ? (r.p.revenue - r.ly.revenue) / r.ly.revenue * 100 : 0, color: companyColor(r.id) })).sort((a, b) => b.value - a.value), { fmt: v => (v >= 0 ? '+' : '') + v.toFixed(1) + '%', name: 'Growth' }));
  else h += card('On-time delivery', hbars(rows.filter(r => r.onTime != null).map(r => ({ label: r.c.name, value: r.onTime, color: companyColor(r.id) })), { fmt: v => fmtPct(v), name: 'On time' })) + card('Overdue tasks', hbars(rows.map(r => ({ label: r.c.name, value: r.overdue, color: companyColor(r.id) })), { fmt: v => String(v), name: 'Overdue' }));
  return h + '</div>';
}
function repDepartments(ctx) {
  const rows = deptPerformance(ctx.ids, ctx.deptIds).sort((a, b) => (b.onTime || 0) - (a.onTime || 0));
  const fin = can('finance.view') || can('budget.view_own');
  const br = fin ? budgetRows(ctx.ids, CUR_YEAR) : [];
  return card('Department performance', tableEl([
    { h: 'Department', v: r => '<b>' + esc(r.name) + '</b><div class="muted small">' + esc(company(r.company).short) + '</div>' },
    { h: 'Done · 6 mo', r: 1, v: r => r.done }, { h: 'On-time rate', v: r => r.onTime == null ? '—' : '<div class="row" style="flex-wrap:nowrap"><div style="width:90px">' + progressBar(r.onTime, r.onTime >= 85 ? 'good' : r.onTime >= 65 ? 'warn' : 'bad') + '</div><span class="num small">' + fmtPct(r.onTime) + '</span></div>' },
    { h: 'Open', r: 1, v: r => r.open }, { h: 'Overdue', r: 1, v: r => '<span class="' + (r.overdue ? 'down strong' : '') + '">' + r.overdue + '</span>' },
  ].concat(fin ? [{ h: 'Budget used', r: 1, v: r => { const b = br.filter(x => deptTree(r.id).includes(x.departmentId)); const a = sum(b, x => x.amount); return a ? pct(sum(b, x => x.actual), a) + '%' : '—'; } }] : []), rows), { flush: true, sub: 'Departments with tasks in the selected companies' });
}
function repProjects(ctx) {
  const ps = state.projects.filter(p => ctx.ids.includes(p.companyId) && visibleProject(p) && (!ctx.deptIds || ctx.deptIds.includes(p.departmentId)));
  const st = ps.map(p => [p, projectStats(p)]);
  const fin = can('finance.view') || can('budget.view_own');
  let h = '<div class="grid g3" style="margin-bottom:16px">' + card('Health', stackBarEl([{ label: 'On track', value: st.filter(([p, s]) => p.status === 'active' && s.health === 'on_track').length, color: 'var(--good)' }, { label: 'At risk', value: st.filter(([p, s]) => p.status === 'active' && s.health === 'at_risk').length, color: 'var(--warn)' }, { label: 'Off track', value: st.filter(([p, s]) => p.status === 'active' && s.health === 'off_track').length, color: 'var(--bad)' }]), { sub: 'Active projects' }) +
    card('Status', stackBarEl(Object.entries(PROJECT_STATUS).map(([k, v], i) => ({ label: v[0], value: ps.filter(p => p.status === k).length, color: SERIES[i] })))) +
    card('Delivery', '<div class="kpi-val num" style="font-size:28px;font-weight:700">' + (st.length ? Math.round(sum(st, ([, s]) => s.progress) / st.length) : 0) + '%</div><div class="muted small">average progress · ' + sum(st, ([, s]) => s.overdue) + ' overdue tasks across projects</div>') + '</div>';
  h += card('Project performance', tableEl([
    { h: 'Project', v: ([p]) => '<b>' + esc(p.name) + '</b><div class="muted small">' + esc(company(p.companyId).short) + ' · ' + esc(user(p.ownerId).name) + '</div>' },
    { h: 'Status', v: ([p]) => badge(PROJECT_STATUS[p.status][0], PROJECT_STATUS[p.status][1]) }, { h: 'Health', v: ([, s]) => badge(HEALTH[s.health][0], HEALTH[s.health][1]) },
    { h: 'Progress', v: ([, s]) => '<div class="row" style="flex-wrap:nowrap"><div style="width:80px">' + progressBar(s.progress) + '</div><span class="num small">' + s.progress + '%</span></div>' },
    { h: 'Tasks', r: 1, v: ([, s]) => s.done + '/' + s.total }, { h: 'Overdue', r: 1, v: ([, s]) => s.overdue },
  ].concat(fin ? [{ h: 'Budget', r: 1, v: ([p]) => p.budget ? money(p.budget, { compact: true }) : '—' }, { h: 'Spent', r: 1, v: ([p, s]) => p.budget ? '<span class="' + (s.spent > p.budget ? 'down' : '') + '">' + pct(s.spent, p.budget) + '%</span>' : '—' }] : []).concat([{ h: 'Due', nowrap: 1, v: ([p]) => fmtShort(p.dueDate) }]), st.map(x => Object.assign(x, { id: x[0].id })), { rowAct: 'open-project' }), { flush: true });
  return h;
}
function repTeam(ctx) {
  const rows = teamRows(ctx.userIds.filter(id => ctx.ids.includes(user(id).companyId) && canSeeUser(user(id)))).filter(r => r.open + r.done > 0);
  const sort = App.ui.teamSort || 'open';
  rows.sort((a, b) => sort === 'ontime' ? (b.onTime || 0) - (a.onTime || 0) : sort === 'done' ? b.done - a.done : b.open - a.open);
  return '<div class="filters"><span class="muted small">Sort by</span>' + segEl([['open', 'Workload'], ['done', 'Throughput'], ['ontime', 'On-time rate']], sort, 'team-sort') + '</div>' + card('Team performance', tableEl([
    { h: 'Person', v: r => person(r.id) + '<div class="muted small" style="margin-left:32px">' + esc(r.u.title) + ' · ' + esc(company(r.u.companyId).short) + '</div>' },
    { h: 'Open', r: 1, v: r => r.open }, { h: 'Overdue', r: 1, v: r => '<span class="' + (r.overdue ? 'down strong' : '') + '">' + r.overdue + '</span>' }, { h: 'In review', r: 1, v: r => r.review },
    { h: 'Done · 6 mo', r: 1, v: r => r.done }, { h: 'On time', v: r => r.onTime == null ? '—' : '<div class="row" style="flex-wrap:nowrap"><div style="width:70px">' + progressBar(r.onTime, r.onTime >= 85 ? 'good' : r.onTime >= 65 ? 'warn' : 'bad') + '</div><span class="num small">' + fmtPct(r.onTime) + '</span></div>' },
  ], rows, { rowAct: 'open-person', pageSize: 25, pageKey: 'tmpg' }), { flush: true, sub: 'Based on task assignments and approvals' });
}
ACT['team-sort'] = el => { App.ui.teamSort = el.dataset.v; render(); };
function repOperations(ctx) {
  const ks = state.kpis.filter(k => ctx.ids.includes(k.companyId) && k.unit !== '$');
  const rs = state.risks.filter(r => ctx.ids.includes(r.companyId) && r.status !== 'closed');
  return '<div class="grid g2" style="margin-bottom:16px">' + card('Open risks & issues by company', hbars(ctx.ids.map(id => ({ label: company(id).name, value: rs.filter(r => r.companyId === id).length, color: companyColor(id), sub: rs.filter(r => r.companyId === id && ['high', 'critical'].includes(r.severity)).length + ' high/critical' })), { fmt: v => String(v), name: 'Open' })) + card('Risk matrix', riskMatrix(rs), { sub: 'Severity × likelihood, open items' }) + '</div><div class="grid g3">' + ks.map(kpiCard).join('') + '</div>';
}
function repFinance(ctx) {
  const months = lastNMonths(12); const subs = ctx.ids.filter(id => !company(id).isHolding).slice(0, 4);
  const per = subs.map(id => monthlySeries([id], months));
  let h = card('Monthly revenue by company', barChart({ labels: months.map(m => MONTHS[m.m]), series: subs.map((id, i) => ({ name: company(id).short, color: companyColor(id), values: per[i].map(s => s.revenue) })), stacked: true, tipTitle: i => MONTHS_L[months[i].m] + ' ' + months[i].y, aria: 'Monthly revenue by company, stacked' }), { sub: 'Stacked, last 12 months' }) + '<div style="height:16px"></div>';
  h += plStatement(ctx.ids, ctx.ids.length > 1 ? ctx.ids : [], ctx.f, ctx.t);
  return h;
}

/* ---------- Operations ---------- */
const LIKELIHOOD = ['low', 'medium', 'high'];
const SEVERITY = ['low', 'medium', 'high', 'critical'];
function riskMatrix(rs, act) {
  const col = (s, l) => { const score = (SEVERITY.indexOf(s) + 1) * (LIKELIHOOD.indexOf(l) + 1); return score >= 8 ? 'var(--bad-bg)' : score >= 4 ? 'var(--warn-bg)' : 'var(--good-bg)'; };
  let h = '<div class="table-wrap"><table class="t" style="table-layout:fixed;min-width:360px"><thead><tr><th>Severity ↓ / Likelihood →</th>' + LIKELIHOOD.map(l => '<th style="text-align:center">' + titleCase(l) + '</th>').join('') + '</tr></thead><tbody>';
  SEVERITY.slice().reverse().forEach(s => { h += '<tr><td class="strong">' + titleCase(s) + '</td>' + LIKELIHOOD.map(l => { const n = rs.filter(r => r.severity === s && r.likelihood === l).length; return '<td style="text-align:center;background:' + col(s, l) + ';' + (act && n ? 'cursor:pointer' : '') + '"' + (act && n ? ' data-act="' + act + '" data-s="' + s + '" data-l="' + l + '"' : '') + '><b class="num" style="font-size:16px">' + (n || '·') + '</b></td>'; }).join('') + '</tr>'; });
  return h + '</tbody></table></div>';
}
VIEWS.operations = function () {
  const tab = App.ui.opTab || 'risks'; const ids = activeCompanyIds();
  let h = pageHead('Operations', 'Risk & issue register, recurring operational work and operating KPIs', '<button class="btn primary" data-act="risk-new">' + icon('plus') + 'Log risk or issue</button>');
  h += tabsEl([['risks', 'Risks & issues', state.risks.filter(r => ids.includes(r.companyId) && r.status !== 'closed').length], ['recurring', 'Recurring work'], ['kpis', 'Operating KPIs']], tab, 'op-tab');
  if (tab === 'risks') {
    const f = App.ui.rkf || (App.ui.rkf = { status: 'open', type: 'all', sev: null, lik: null });
    let rs = state.risks.filter(r => ids.includes(r.companyId));
    const open = rs.filter(r => r.status !== 'closed');
    h += '<div class="grid g4" style="margin-bottom:16px">' + kpiTile('Open risks', String(open.filter(r => r.type === 'risk').length), '', { hero: true, icon: 'shield' }) + kpiTile('Open issues', String(open.filter(r => r.type === 'issue').length), '', { icon: 'alert' }) + kpiTile('High & critical', String(open.filter(r => ['high', 'critical'].includes(r.severity)).length), '', { icon: 'flag' }) + kpiTile('Mitigation overdue', String(open.filter(r => daysUntil(r.dueDate) < 0).length), '', { icon: 'clock' }) + '</div>';
    if (f.status === 'open') rs = open; else if (f.status !== 'all') rs = rs.filter(r => r.status === f.status);
    if (f.type !== 'all') rs = rs.filter(r => r.type === f.type);
    if (f.sev) rs = rs.filter(r => r.severity === f.sev && r.likelihood === f.lik);
    h += '<div class="grid g-1-2" style="align-items:start">' + card('Risk matrix', riskMatrix(open, 'rk-cell') + (f.sev ? '<button class="btn sm ghost" data-act="rk-clear" style="margin-top:10px">Clear matrix filter (' + f.sev + ' × ' + f.lik + ')</button>' : '<p class="muted small" style="margin-bottom:0">Click a cell to filter the register.</p>'), { sub: 'Open items' }) +
      '<div><div class="filters">' + segEl([['open', 'Open'], ['mitigating', 'Mitigating'], ['closed', 'Closed'], ['all', 'All']], f.status, 'rk-status') + segEl([['all', 'All'], ['risk', 'Risks'], ['issue', 'Issues']], f.type, 'rk-type') + '</div>' +
      card('', tableEl([
        { h: 'Item', v: r => '<b>' + esc(r.title) + '</b><div class="muted small"><span class="mono">' + r.key + '</span> · ' + esc(company(r.companyId).short) + (r.projectId && project(r.projectId) ? ' · ' + esc(project(r.projectId).name) : '') + '</div>' },
        { h: 'Severity', v: r => sevBadge(r.severity) }, { h: 'Likelihood', v: r => titleCase(r.likelihood) }, { h: 'Owner', v: r => person(r.ownerId) },
        { h: 'Status', v: r => badge(titleCase(r.status), { open: 'b-warn', mitigating: 'b-info', closed: 'b-good' }[r.status]) }, { h: 'Review by', nowrap: 1, v: r => '<span class="' + (r.status !== 'closed' && daysUntil(r.dueDate) < 0 ? 'down strong' : '') + '">' + fmtShort(r.dueDate) + '</span>' },
      ], rs.sort((a, b) => SEVERITY.indexOf(b.severity) - SEVERITY.indexOf(a.severity)), { rowAct: 'open-risk', empty: 'Nothing logged here.' }), { flush: true }) + '</div></div>';
  } else if (tab === 'recurring') {
    const rec = state.tasks.filter(t => t.recurrence && t.status !== 'completed' && visibleTask(t) && ids.includes(t.companyId));
    h += noticeEl('Recurring tasks create their next occurrence automatically when the current one is approved.') + '<div style="height:12px"></div>' + card('', tableEl([
      { h: 'Task', v: t => '<b>' + esc(t.title) + '</b><div class="muted small">' + esc(company(t.companyId).short) + '</div>' }, { h: 'Repeats', v: t => badge(titleCase(t.recurrence), 'b-info', true) },
      { h: 'Assignee', v: t => person(t.assigneeId) }, { h: 'Status', v: t => taskStatusBadge(t) }, { h: 'Next due', nowrap: 1, v: t => fmtShort(t.dueDate) }], rec, { rowAct: 'open-task', empty: 'No recurring work set up.' }), { flush: true });
  } else {
    h += '<div class="grid g3">' + state.kpis.filter(k => ids.includes(k.companyId) && (k.unit !== '$' || can('finance.view'))).map(kpiCard).join('') + '</div>';
  }
  return h;
};
Object.assign(ACT, {
  'op-tab': el => { App.ui.opTab = el.dataset.v; render(); },
  'rk-status': el => { App.ui.rkf.status = el.dataset.v; render(); }, 'rk-type': el => { App.ui.rkf.type = el.dataset.v; render(); },
  'rk-cell': el => { Object.assign(App.ui.rkf, { sev: el.dataset.s, lik: el.dataset.l, status: 'open' }); render(); }, 'rk-clear': () => { App.ui.rkf.sev = App.ui.rkf.lik = null; render(); },
  'open-risk': el => openDrawer('risk', el.dataset.id),
  'risk-new': () => riskForm({}), 'risk-edit': el => riskForm(get('risks', el.dataset.id)),
});
DRAWERS.risk = function (id) {
  const r = get('risks', id); if (!r || !scopeCompanyIds().includes(r.companyId)) return '';
  return drawerHead('<span class="mono">' + r.key + '</span> · ' + (r.type === 'risk' ? 'Risk' : 'Issue'), esc(r.title), sevBadge(r.severity) + badge(titleCase(r.status), { open: 'b-warn', mitigating: 'b-info', closed: 'b-good' }[r.status]) + companyTag(r.companyId)) +
    '<div class="drawer-b">' + (can('operations.view') ? '<div class="action-bar"><button class="btn" data-act="risk-edit" data-id="' + r.id + '">' + icon('edit') + 'Update</button>' + (r.status !== 'closed' ? '<button class="btn good" data-act="risk-close" data-id="' + r.id + '">' + icon('ok') + 'Close</button>' : '') + (can('tasks.create') ? '<button class="btn" data-act="risk-task" data-id="' + r.id + '">' + icon('plus') + 'Create mitigation task</button>' : '') + '</div>' : '') +
    card('Details', '<dl class="dl"><dt>Company</dt><dd>' + esc(company(r.companyId).name) + '</dd><dt>Project</dt><dd>' + (r.projectId && project(r.projectId) ? esc(project(r.projectId).name) : '—') + '</dd><dt>Owner</dt><dd>' + person(r.ownerId) + '</dd><dt>Severity</dt><dd>' + titleCase(r.severity) + '</dd><dt>Likelihood</dt><dd>' + titleCase(r.likelihood) + '</dd><dt>Review by</dt><dd>' + fmtDate(r.dueDate) + '</dd><dt>Logged</dt><dd>' + fmtDT(r.createdAt) + '</dd></dl><div class="hr"></div><div class="small strong">Mitigation / response</div><p style="margin:6px 0 0">' + esc(r.mitigation || '—') + '</p>') +
    card('History', historyTimeline(r.id)) + '</div>';
};
function riskForm(r) {
  const isNew = !r.id; const cid = r.companyId || activeCompanyIds()[0];
  openModal(modalShell(isNew ? 'Log risk or issue' : 'Update ' + r.key, '<div class="form-grid">' + field('Type', selectF('type', [['risk', 'Risk (might happen)'], ['issue', 'Issue (happening now)']], r.type || 'risk')) + field('Company', selectF('companyId', companyOptions(scopeCompanyIds()), cid)) + field('Title', inputEl('title', r.title || ''), { full: 1 }) +
    field('Severity', selectF('severity', SEVERITY.map(s => [s, titleCase(s)]), r.severity || 'medium')) + field('Likelihood', selectF('likelihood', LIKELIHOOD.map(s => [s, titleCase(s)]), r.likelihood || 'medium')) +
    field('Owner', selectF('ownerId', userOptions(state.users.filter(u => canSeeUser(u) && u.active !== false)), r.ownerId || me().id)) + field('Review by', inputEl('dueDate', r.dueDate || rel(14), 'type="date"')) +
    field('Project', selectF('projectId', [['', 'None']].concat(projectsInView().map(p => [p.id, p.name])), r.projectId || '')) + field('Status', selectF('status', [['open', 'Open'], ['mitigating', 'Mitigating'], ['closed', 'Closed']], r.status || 'open')) +
    field('Mitigation / response', '<textarea class="input" name="mitigation" id="f_mitigation">' + esc(r.mitigation || '') + '</textarea>', { full: 1 }) + '</div>', '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="risk-save" data-id="' + (r.id || '') + '">Save</button>'), true);
}
Object.assign(ACT, {
  'risk-save': el => {
    const v = formVals(); if (!v.title.trim()) { toast('Title is required', true); return; }
    const data = { type: v.type, companyId: v.companyId, title: v.title.trim(), severity: v.severity, likelihood: v.likelihood, ownerId: v.ownerId, dueDate: v.dueDate, projectId: v.projectId || null, status: v.status, mitigation: v.mitigation.trim() };
    if (el.dataset.id) { const r = get('risks', el.dataset.id); const ch = Object.keys(data).filter(k => (r[k] || '') !== (data[k] || '')); Object.assign(r, data); if (ch.length) audit('edited', 'risk', r.id, 'Updated ' + ch.join(', ')); }
    else { const r = Object.assign({ id: uid('rk'), key: (v.type === 'risk' ? 'RSK-' : 'ISS-') + String(++state.counters.risk).padStart(3, '0'), createdAt: nowISO() }, data); state.risks.unshift(r); audit('created', 'risk', r.id, 'Logged ' + r.type + ' “' + r.title + '” (' + r.severity + ')'); notify(r.ownerId, { type: 'task', title: 'You own a new ' + r.type + ': ' + r.title, body: titleCase(r.severity) + ' severity', link: { page: 'operations' } }); }
    closeModal(); refresh();
  },
  'risk-close': el => { const r = get('risks', el.dataset.id); r.status = 'closed'; audit('closed', 'risk', r.id, 'Closed ' + r.key); refresh(); },
  'risk-task': el => { const r = get('risks', el.dataset.id); closeDrawer(); openNewTask({ project: r.projectId || '' }); setTimeout(() => { const t = document.getElementById('f_title'); if (t) t.value = 'Mitigate: ' + r.title; const a = document.getElementById('f_assigneeId'); if (a && [...a.options].some(o => o.value === r.ownerId)) a.value = r.ownerId; }, 20); },
});
