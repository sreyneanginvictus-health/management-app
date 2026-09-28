/* =====================================================================
   Approval Center
   ===================================================================== */
function approverNames(st) {
  if (!st.approverIds.length) return 'No eligible approver';
  if (st.approverIds.length === 1) return user(st.approverIds[0]).name;
  return user(st.approverIds[0]).name + ' or ' + (st.approverIds.length - 1) + ' other' + (st.approverIds.length > 2 ? 's' : '');
}
function stepsInline(a) {
  return '<div class="steps">' + a.steps.map((s, i) => '<span class="step ' + (s.status === 'approved' ? 'done' : s.status === 'rejected' ? 'rej' : s.status === 'pending' ? 'cur' : '') + '" title="' + esc(approverNames(s)) + '"><i>' + (s.status === 'approved' ? '✓' : s.status === 'rejected' ? '✕' : i + 1) + '</i>' + esc(APPROVER_ROLES[s.role]) + '</span>').join('<span class="step-arrow">→</span>') + '</div>';
}
function ruleText(rule) {
  if (!rule) return 'Default route (no rule matched)';
  return rule.name + (rule.cond ? ' (amount ' + rule.cond.op + ' ' + money(rule.cond.value) + ')' : '') + ': ' + rule.steps.map(r => APPROVER_ROLES[r]).join(' → ');
}
function apStatusBadge(a) { return badge(titleCase(a.status), { pending: 'b-warn', approved: 'b-good', rejected: 'b-bad', cancelled: '' }[a.status]); }
VIEWS.approvals = function () {
  const u = me();
  const f = App.ui.af || (App.ui.af = { tab: 'mine', type: 'all', company: 'all', q: '' });
  const all = approvalsInView();
  const waiting = state.approvals.filter(a => canActOnApproval(a));
  const reviews = state.tasks.filter(t => canReviewTask(t));
  const mine = all.filter(a => a.requesterId === u.id);
  const canAll = can('approvals.view_all') || u.scope === 'department';
  const monthStart = CUR_YEAR + '-' + z2(CUR_MONTH + 1) + '-01';
  const decided = all.filter(a => a.decidedAt);
  const avgH = decided.length ? sum(decided, a => (new Date(a.decidedAt) - new Date(a.createdAt)) / 36e5) / decided.length : 0;
  const pendingAll = all.filter(a => a.status === 'pending');
  let h = pageHead('Approval Center', 'Requests route automatically using configurable rules. No one can approve their own request.', '<button class="btn primary" data-act="new-request">' + icon('plus') + 'New request</button>');
  h += '<div class="grid g4" style="margin-bottom:16px">' + kpiTile('Waiting on you', String(waiting.length + reviews.length), '<span class="muted">' + waiting.length + ' requests · ' + reviews.length + ' task reviews</span>', { hero: true, icon: 'stamp' }) +
    kpiTile('Pending in your view', String(pendingAll.length), can('finance.view') ? '<span class="muted">' + money(sum(pendingAll, a => a.amount || 0), { compact: true }) + ' requested</span>' : '', { icon: 'clock' }) +
    kpiTile('Approved this month', String(all.filter(a => a.status === 'approved' && a.decidedAt >= monthStart).length), '<span class="muted">' + all.filter(a => a.status === 'rejected' && a.decidedAt >= monthStart).length + ' rejected</span>', { icon: 'ok' }) +
    kpiTile('Average time to decision', avgH ? (avgH < 48 ? Math.round(avgH) + ' h' : (avgH / 24).toFixed(1) + ' days') : '—', '<span class="muted">from submit to final decision</span>', { icon: 'gauge' }) + '</div>';
  const tabs = [['mine', 'Waiting on me', waiting.length + reviews.length], ['requested', 'My requests', mine.length]];
  if (canAll) tabs.push(['all', 'All requests', all.length]);
  tabs.push(['done', 'Decided', all.filter(a => a.status !== 'pending').length]);
  h += tabsEl(tabs, f.tab, 'af-tab');
  if (f.tab === 'mine') {
    if (!waiting.length && !reviews.length) return h + card('', emptyState('You are all caught up. Nothing is waiting for your approval.'));
    h += '<div class="stack">' + waiting.map(a => approvalCard(a)).join('') + '</div>';
    if (reviews.length) h += '<h3 style="font-size:15px;margin:22px 0 10px">Task reviews</h3>' + card('', '<div class="list">' + reviews.map(t => '<div class="li"><div class="ico-box solid">' + icon('check') + '</div><div class="grow"><div class="ttl">' + esc(t.title) + '</div><div class="meta">' + esc(user(t.assigneeId).name) + ' submitted ' + (t.submittedAt ? ago(t.submittedAt) : '') + ' · ' + esc(company(t.companyId).short) + '</div></div><button class="btn sm" data-act="open-task" data-id="' + t.id + '">Review</button><button class="btn sm good" data-act="task-approve" data-id="' + t.id + '">Approve</button></div>').join('') + '</div>', { flush: true });
    return h;
  }
  let rows = f.tab === 'requested' ? mine : f.tab === 'done' ? all.filter(a => a.status !== 'pending') : all;
  h += '<div class="filters">' + selectEl('af-type', [['all', 'All types']].concat(Object.entries(APPROVAL_TYPES).map(([k, v]) => [k, v.label])), f.type, 'data-act-change="af" data-k="type" aria-label="Type"') + (activeCompanyIds().length > 1 ? selectEl('af-company', companyOptions(null, true), f.company, 'data-act-change="af" data-k="company" aria-label="Company"') : '') + '<input class="input" id="af-q" placeholder="Search title or number" value="' + esc(f.q) + '" data-act-input="af" data-k="q"></div>';
  if (f.type !== 'all') rows = rows.filter(a => a.type === f.type);
  if (f.company !== 'all') rows = rows.filter(a => a.companyId === f.company);
  if (f.q) { const q = f.q.toLowerCase(); rows = rows.filter(a => a.title.toLowerCase().includes(q) || a.no.toLowerCase().includes(q)); }
  h += card('', tableEl([
    { h: 'Request', v: a => '<b>' + esc(a.title) + '</b><div class="muted small"><span class="mono">' + a.no + '</span> · ' + esc(APPROVAL_TYPES[a.type].label) + '</div>' },
    { h: 'Amount', r: 1, v: a => a.amount ? money(a.amount) : '—' },
    { h: 'Requester', v: a => person(a.requesterId) },
    { h: 'Company', v: a => companyTag(a.companyId) },
    { h: 'Route', v: a => stepsInline(a) },
    { h: 'Status', v: a => apStatusBadge(a) },
    { h: 'Submitted', nowrap: 1, v: a => ago(a.createdAt) },
  ], rows, { rowAct: 'open-approval', pageSize: 20, pageKey: 'apg', empty: 'No requests match.' }), { flush: true });
  return h;
};
function approvalCard(a) {
  return '<div class="card" style="padding:16px 18px"><div class="row" style="justify-content:space-between;align-items:flex-start;gap:14px"><div style="min-width:0;flex:1"><div class="row">' + badge(APPROVAL_TYPES[a.type].label, 'b-brand', true) + '<span class="mono muted">' + a.no + '</span>' + companyTag(a.companyId) + '<span class="muted small">' + ago(a.createdAt) + '</span></div><h3 style="font-size:16px;margin:8px 0 4px">' + esc(a.title) + '</h3><div class="muted small">' + person(a.requesterId) + ' · ' + esc(dept(a.departmentId).name) + (a.attachments.length ? ' · ' + a.attachments.length + ' attachment' + (a.attachments.length > 1 ? 's' : '') : '') + '</div></div><div style="text-align:right"><div class="kpi-val num" style="font-size:22px;font-weight:700">' + (a.amount ? money(a.amount) : '—') + '</div><div class="muted small">Step ' + (a.currentStep + 1) + ' of ' + a.steps.length + ' · ' + esc(APPROVER_ROLES[a.steps[a.currentStep].role]) + '</div></div></div><div style="margin:12px 0">' + stepsInline(a) + '</div><div class="row"><button class="btn good" data-act="ap-approve" data-id="' + a.id + '">' + icon('ok') + 'Approve</button><button class="btn danger" data-act="ap-reject" data-id="' + a.id + '">Reject</button><button class="btn ghost" data-act="open-approval" data-id="' + a.id + '">Details</button></div></div>';
}
Object.assign(ACT, {
  'af-tab': el => { App.ui.af.tab = el.dataset.v; App.ui.apg = 0; render(); },
  'open-approval': el => openDrawer('approval', el.dataset.id),
  'ap-approve': el => {
    const a = get('approvals', el.dataset.id); if (!canActOnApproval(a)) { toast('You are not the current approver.', true); return; }
    const c = (document.getElementById('apc-' + a.id) || {}).value || '';
    decideApproval(a, 'approve', c.trim());
    toast(a.status === 'approved' ? 'Final approval given — ' + a.no + ' approved' : 'Approved. Sent to ' + APPROVER_ROLES[a.steps[a.currentStep].role]);
    refresh();
  },
  'ap-reject': el => {
    const a = get('approvals', el.dataset.id);
    openModal(modalShell('Reject ' + a.no, field('Reason', '<textarea class="input" name="comment" id="f_comment"></textarea>', { hint: 'Required. ' + esc(user(a.requesterId).name) + ' will see this.' }), '<button class="btn" data-act="close-modal">Cancel</button><button class="btn danger solid" data-act="ap-reject-go" data-id="' + a.id + '">Reject request</button>'));
  },
  'ap-reject-go': el => { const a = get('approvals', el.dataset.id); const v = formVals(); if (!v.comment.trim()) { toast('A reason is required to reject.', true); return; } decideApproval(a, 'reject', v.comment.trim()); closeModal(); toast(a.no + ' rejected'); refresh(); },
  'ap-cancel': el => { const a = get('approvals', el.dataset.id); cancelApproval(a); notify(a.steps.flatMap(s => s.approverIds), { type: 'approval', title: 'Withdrawn: ' + a.title, body: 'by ' + me().name, link: { page: 'approvals', id: a.id } }); toast('Request withdrawn'); refresh(); },
  'new-request': el => openNewRequest(el && el.dataset ? el.dataset : {}),
});
CHANGE.af = el => { App.ui.af[el.dataset.k] = el.value; App.ui.apg = 0; render(); };

DRAWERS.approval = function (id) {
  const a = get('approvals', id); if (!a || !visibleApproval(a)) return '';
  const u = me(); const rule = state.settings.approvalRules.find(r => r.id === a.ruleId);
  const actNow = canActOnApproval(a);
  const selfBlocked = a.status === 'pending' && a.requesterId === u.id && a.steps[a.currentStep] && a.steps[a.currentStep].approverIds.includes(u.id);
  let actions = '';
  if (actNow) actions = '<div class="action-bar" style="flex-direction:column;align-items:stretch"><textarea class="input" id="apc-' + a.id + '" placeholder="Comment (optional for approval)" style="min-height:52px"></textarea><div class="row"><button class="btn good" data-act="ap-approve" data-id="' + a.id + '">' + icon('ok') + (a.currentStep === a.steps.length - 1 ? 'Give final approval' : 'Approve & forward') + '</button><button class="btn danger" data-act="ap-reject" data-id="' + a.id + '">Reject</button></div></div>';
  else if (a.status === 'pending' && a.requesterId === u.id) actions = '<div class="action-bar"><span class="small" style="flex:1">Waiting on <b>' + esc(approverNames(a.steps[a.currentStep])) + '</b></span><button class="btn danger sm" data-act="ap-cancel" data-id="' + a.id + '">Withdraw request</button></div>';
  const effects = [];
  if (a.linkedTxId) { const tx = get('transactions', a.linkedTxId); if (tx) effects.push('Created ledger entry <button class="link" data-act="open" data-t="transaction" data-id="' + tx.id + '">' + tx.no + '</button> (' + tx.status + ')'); }
  if (a.billId) { const b = get('bills', a.billId); if (b) effects.push('Pays bill <button class="link" data-act="open" data-t="bill" data-id="' + b.id + '">' + b.number + '</button>' + (b.paid >= b.amount ? ' — paid' : '')); }
  if (a.projectId) { const p = project(a.projectId); if (p) effects.push('Project <button class="link" data-act="open" data-t="project" data-id="' + p.id + '">' + esc(p.name) + '</button> — ' + PROJECT_STATUS[p.status][0]); }
  const stepsHtml = '<div class="timeline">' + a.steps.map((s, i) => '<div class="tl"><div class="dotm ' + (s.status === 'approved' ? 'good' : s.status === 'rejected' ? 'bad' : s.status === 'pending' ? 'cur' : '') + '">' + icon(s.status === 'approved' ? 'ok' : s.status === 'rejected' ? 'x' : s.status === 'pending' ? 'clock' : 'dots') + '</div><div class="tx"><b>Step ' + (i + 1) + ' · ' + esc(APPROVER_ROLES[s.role]) + '</b> ' + badge(titleCase(s.status), { approved: 'b-good', rejected: 'b-bad', pending: 'b-warn', waiting: '', skipped: '' }[s.status], true) + (s.escalated ? ' ' + badge('Escalated to ' + roleLabel(state.settings.escalationRole), 'b-info', true) : '') +
    '<small>' + (s.actorId ? esc(user(s.actorId).name) + ' · ' + fmtDT(s.at) : 'Approver: ' + esc(s.approverIds.map(x => user(x).name).join(', ') || '—')) + '</small>' + (s.comment ? '<div class="small" style="margin-top:4px">“' + esc(s.comment) + '”</div>' : '') + '</div></div>').join('') + '</div>';
  return drawerHead('<span class="mono">' + a.no + '</span> · ' + esc(APPROVAL_TYPES[a.type].label) + ' request', esc(a.title), apStatusBadge(a) + companyTag(a.companyId)) +
    '<div class="drawer-b">' + actions + (selfBlocked ? noticeEl('You are listed for this step but submitted the request yourself. Self-approval is blocked; it routes to another approver. ' + cfg(), 'warn', 'lock') : '') +
    '<div class="card" style="padding:18px"><div class="row" style="justify-content:space-between"><div><div class="eyebrow">Amount</div><div class="kpi-val num" style="font-size:30px;font-weight:700">' + (a.amount ? money(a.amount, { cents: false }) : '—') + '</div></div>' + person(a.requesterId, { title: 1 }) + '</div></div>' +
    card('Approval route', '<div class="notice" style="margin-bottom:14px">' + icon('shield') + '<div>Matched rule: <b>' + esc(ruleText(rule)) + '</b> ' + cfg() + (can('settings.admin') ? ' <button class="link" data-act="goto-rules">Edit rules</button>' : '') + '</div></div>' + stepsHtml) +
    card('Details', '<dl class="dl"><dt>Company</dt><dd>' + esc(company(a.companyId).name) + '</dd><dt>Department</dt><dd>' + esc(dept(a.departmentId).name) + '</dd>' + (a.category ? '<dt>Category</dt><dd>' + esc(a.category) + '</dd>' : '') + (a.vendor ? '<dt>Vendor</dt><dd>' + esc(a.vendor) + '</dd>' : '') + '<dt>Submitted</dt><dd>' + fmtDT(a.createdAt) + '</dd>' + (a.decidedAt ? '<dt>Decided</dt><dd>' + fmtDT(a.decidedAt) + '</dd>' : '') + '</dl>' + (a.description ? '<div class="hr"></div><p style="margin:0">' + esc(a.description) + '</p>' : '') + (effects.length ? '<div class="hr"></div><div class="small strong" style="margin-bottom:6px">Linked records</div><ul style="margin:0;padding-left:18px">' + effects.map(e => '<li>' + e + '</li>').join('') + '</ul>' : '')) +
    card('Supporting documents', attachList(a.attachments, a.status === 'pending' && a.requesterId === u.id ? { act: 'approval', id: a.id } : null)) +
    card('Audit history', historyTimeline(a.id)) + '</div>';
};
ACT['goto-rules'] = () => { App.ui.setTab = 'rules'; go('settings'); };

function openNewRequest(pre) {
  pre = pre || {};
  const u = me(); App.ui.pendingFiles = null;
  const type = pre.type || 'expense';
  const cid = activeCompanyIds().includes(u.companyId) ? u.companyId : activeCompanyIds()[0];
  const billOpts = state.bills.filter(b => scopeCompanyIds().includes(b.companyId) && b.amount > b.paid).map(b => [b.id, b.number + ' — ' + b.vendor + ' — ' + money(b.amount - b.paid)]);
  openModal(modalShell('New request', '<div class="form-grid">' +
    field('Request type', selectF('type', Object.entries(APPROVAL_TYPES).filter(([k]) => k !== 'payment' || can('finance.view')).map(([k, v]) => [k, v.label]), type, 'data-act-change="nr-update"')) +
    field('Amount (' + state.settings.currency + ')', inputEl('amount', pre.amount || '', 'type="number" min="0" step="10" placeholder="0" data-act-input="nr-update"'), { hint: '<span id="nr-amount-hint"></span>' }) +
    field('Title', inputEl('title', pre.title || '', 'placeholder="What are you asking for?"'), { full: 1 }) +
    field('Justification', '<textarea class="input" name="description" id="f_description" placeholder="Why is this needed? Link to project or budget line."></textarea>', { full: 1 }) +
    field('Company', selectF('companyId', companyOptions(scopeCompanyIds()), cid, 'data-act-change="nr-company"')) +
    field('Department', '<span id="nr-dept">' + selectF('departmentId', deptOptions(cid), state.departments.some(d => d.id === u.departmentId && d.companyId === cid) ? u.departmentId : null, 'data-act-change="nr-update"') + '</span>') +
    '<div class="field" id="nr-cat-wrap">' + '<label for="f_category">Budget category</label>' + selectF('category', EXPENSE_CATS.filter(c => c !== 'Loan repayment'), 'Travel') + '</div>' +
    field('Vendor / payee', inputEl('vendor', '', 'placeholder="Optional"')) +
    '<div class="field full" id="nr-bill-wrap" hidden><label for="f_billId">Bill to pay</label>' + (billOpts.length ? selectF('billId', billOpts, '', 'data-act-change="nr-bill"') : '<div class="muted small">No open bills in your scope.</div>') + '</div>' +
    field('Supporting documents', '<label class="btn sm" style="align-self:flex-start">' + icon('clip') + 'Attach receipt / quote<input type="file" hidden multiple data-upload="modal"></label><div id="pending-files" class="stack" style="gap:6px"></div>', { full: 1 }) +
    '<div class="full" id="nr-route"></div></div>',
    '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="new-request-go">' + icon('send') + 'Submit request</button>'), true);
  nrUpdate();
}
function nrUpdate() {
  const v = formVals(); const t = APPROVAL_TYPES[v.type];
  const cw = document.getElementById('nr-cat-wrap'); if (cw) cw.hidden = !['expense', 'purchase', 'budget'].includes(v.type);
  const bw = document.getElementById('nr-bill-wrap'); if (bw) bw.hidden = v.type !== 'payment';
  const amtIn = document.getElementById('f_amount'); if (amtIn) amtIn.disabled = !t.money;
  const req = { type: v.type, amount: Number(v.amount) || 0, companyId: v.companyId, departmentId: v.departmentId, requesterId: me().id };
  const { steps, rule } = routePreview(req);
  const hint = document.getElementById('nr-amount-hint');
  if (hint) { const thr = sortedRules(v.type).find(r => r.cond); hint.innerHTML = thr ? 'Above ' + money(thr.cond.value) + ' adds ' + thr.steps.filter(s => !(sortedRules(v.type).find(r => !r.cond) || { steps: [] }).steps.includes(s)).map(s => APPROVER_ROLES[s]).join(', ') + ' ' + cfg() : ''; }
  const box = document.getElementById('nr-route');
  if (box) box.innerHTML = '<div class="notice">' + icon('shield') + '<div style="flex:1"><div><b>Approval route preview</b> — ' + esc(ruleText(rule)) + '</div><div class="steps" style="margin-top:8px">' + steps.map((s, i) => '<span class="step"><i>' + (i + 1) + '</i>' + esc(APPROVER_ROLES[s.role]) + ': ' + esc(approverNames(s)) + (s.escalated ? ' (escalated)' : '') + '</span>').join('<span class="step-arrow">→</span>') + '</div></div></div>';
}
CHANGE['nr-update'] = () => nrUpdate();
CHANGE['nr-company'] = el => { document.getElementById('nr-dept').innerHTML = selectF('departmentId', deptOptions(el.value), null, 'data-act-change="nr-update"'); nrUpdate(); };
CHANGE['nr-bill'] = el => { const b = get('bills', el.value); if (b) { document.getElementById('f_amount').value = b.amount - b.paid; document.getElementById('f_title').value = 'Pay ' + b.vendor + ' (' + b.number + ')'; document.getElementById('f_vendor').value = b.vendor; document.getElementById('f_companyId').value = b.companyId; document.getElementById('nr-dept').innerHTML = selectF('departmentId', deptOptions(b.companyId), b.departmentId, 'data-act-change="nr-update"'); } nrUpdate(); };
ACT['new-request-go'] = () => {
  const v = formVals(); const t = APPROVAL_TYPES[v.type];
  if (!v.title.trim()) { toast('Add a title', true); return; }
  if (t.money && !(Number(v.amount) > 0) && !['hiring'].includes(v.type)) { toast('Enter an amount', true); return; }
  if (v.type === 'payment' && !v.billId) { toast('Choose the bill to pay', true); return; }
  const data = { type: v.type, title: v.title.trim(), description: v.description.trim(), amount: t.money ? Number(v.amount) || 0 : 0, companyId: v.companyId, departmentId: v.departmentId, vendor: v.vendor.trim() || null, attachments: App.ui.pendingFiles || [] };
  if (['expense', 'purchase', 'budget'].includes(v.type)) data.category = v.category;
  if (v.type === 'payment') { const b = get('bills', v.billId); data.billId = b.id; data.category = b.category; }
  const a = createApproval(data); App.ui.pendingFiles = null; closeModal();
  toast(a.no + ' submitted — routed to ' + (a.steps[0] ? approverNames(a.steps[0]) : 'approver'));
  refresh(); openDrawer('approval', a.id);
};
