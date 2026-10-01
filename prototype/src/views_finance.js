/* =====================================================================
   Finance & Accounting (authorized roles only)
   ===================================================================== */
function periodOptions() {
  const o = [['ytd', 'Year to date ' + CUR_YEAR], ['mtd', MONTHS_L[CUR_MONTH] + ' ' + CUR_YEAR + ' (to date)']];
  const lm = new Date(CUR_YEAR, CUR_MONTH - 1, 1); o.push(['lm', MONTHS_L[lm.getMonth()] + ' ' + lm.getFullYear()]);
  for (let q = Math.floor(CUR_MONTH / 3); q >= 0; q--) o.push(['q' + (q + 1), 'Q' + (q + 1) + ' ' + CUR_YEAR + (q === Math.floor(CUR_MONTH / 3) ? ' (to date)' : '')]);
  o.push(['l12', 'Last 12 months'], ['fy' + (CUR_YEAR - 1), 'Full year ' + (CUR_YEAR - 1)]);
  return o;
}
function periodRange(k) {
  if (k === 'ytd') return [CUR_YEAR + '-01-01', TODAY_S];
  if (k === 'mtd') return [monthRange(CUR_YEAR, CUR_MONTH)[0], TODAY_S];
  if (k === 'lm') { const d = new Date(CUR_YEAR, CUR_MONTH - 1, 1); return monthRange(d.getFullYear(), d.getMonth()); }
  if (/^q\d$/.test(k)) { const q = Number(k[1]) - 1; const f = monthRange(CUR_YEAR, q * 3)[0]; const t = monthRange(CUR_YEAR, q * 3 + 2)[1]; return [f, t > TODAY_S ? TODAY_S : t]; }
  if (k === 'l12') { const d = new Date(CUR_YEAR, CUR_MONTH - 11, 1); return [ymd(d), TODAY_S]; }
  if (/^fy\d{4}$/.test(k)) { const y = k.slice(2); return [y + '-01-01', y + '-12-31']; }
  return [CUR_YEAR + '-01-01', TODAY_S];
}
function priorYear(range) { return range.map(s => (Number(s.slice(0, 4)) - 1) + s.slice(4)); }
function finCompanies() { const f = App.ui.finCo || 'all'; const ids = activeCompanyIds(); return f !== 'all' && ids.includes(f) ? [f] : ids; }
function finFilterBar(extra) { return '<div class="filters">' + (activeCompanyIds().length > 1 ? selectEl('fin-co', companyOptions(null, true), App.ui.finCo || 'all', 'data-act-change="fin-co" aria-label="Company"') : '') + (extra || '') + '</div>'; }
CHANGE['fin-co'] = el => { App.ui.finCo = el.value; App.ui.txpg = 0; render(); };
CHANGE['fin-period'] = el => { App.ui.finPeriod = el.value; render(); };

VIEWS.finance = function () {
  const tab = App.ui.finTab || 'overview';
  const ids = finCompanies();
  const drafts = state.transactions.filter(t => t.status === 'draft' && ids.includes(t.companyId)).length;
  let h = pageHead('Finance & Accounting', 'Cash-basis ledger in ' + state.settings.currency + '. Posted entries are locked; corrections are made with reversal or adjustment entries.', can('finance.manage') ? '<button class="btn primary" data-act="new-tx">' + icon('plus') + 'Record transaction</button>' : '');
  h += tabsEl([['overview', 'Overview'], ['transactions', 'Transactions', drafts ? drafts + ' draft' : null], ['budgets', 'Budgets'], ['receivables', 'Receivables'], ['payables', 'Payables'], ['cash', 'Bank & cash'], ['statements', 'Statements'], ['reports', 'Monthly & yearly']], tab, 'fin-tab');
  const fn = { overview: finOverview, transactions: finTransactions, budgets: finBudgets, receivables: finReceivables, payables: finPayables, cash: finCash, statements: finStatements, reports: finReports }[tab];
  return h + fn(ids);
};
ACT['fin-tab'] = el => { App.ui.finTab = el.dataset.v; render(); };

function finOverview(ids) {
  const [f, t] = ytdRange();
  const p = pnl(ids, f, t);
  let h = finFilterBar();
  h += '<div class="grid g4" style="margin-bottom:16px">' + financeTiles(ids) + '</div>';
  const ms = monthlySeries(ids, lastNMonths(12));
  h += '<div class="grid g-2-1" style="margin-bottom:16px">' + card('Revenue vs expenses', revExpChart(ids), { sub: 'Last 12 months' }) + card('Net profit by month', lineChart({ labels: ms.map(m => m.label), series: [{ name: 'Net profit', color: 'var(--s1)', values: ms.map(m => m.net) }], area: true, zero: false, aria: 'Net profit by month' }), { sub: 'Revenue minus cost of sales and operating expenses' }) + '</div>';
  const expCats = Object.entries(p.exp).sort((a, b) => b[1] - a[1]);
  h += '<div class="grid g2">' + card('Expenses by category · YTD', hbars(expCats.map(([k, v]) => ({ label: k, value: v, color: 'var(--s2)' })), { name: 'Expenses' })) +
    card(ids.length > 1 ? 'Net profit by company · YTD' : 'Revenue by stream · YTD', ids.length > 1 ? hbars(ids.map(id => { const x = pnl([id], f, t); return { label: company(id).name, value: x.net, color: companyColor(id), sub: x.revenue ? fmtPct(x.net / x.revenue * 100, 1) + ' margin' : 'cost centre' }; }).sort((a, b) => b.value - a.value), { name: 'Net profit' }) : hbars(Object.entries(p.rev).map(([k, v]) => ({ label: k, value: v, color: 'var(--s1)' })), { name: 'Revenue' })) + '</div>';
  return h;
}

/* ---------- transactions ---------- */
function txStatusBadge(t) { return badge(titleCase(t.status), { draft: 'b-warn', posted: 'b-good', reversed: 'b-bad' }[t.status]) + (t.reversalOf ? ' ' + badge('Reversal', '', true) : t.adjustmentOf ? ' ' + badge('Adjustment', '', true) : ''); }
function finTransactions(ids) {
  const st = App.ui.txStatus || 'all', kind = App.ui.txKind || 'all', cat = App.ui.txCat || 'all', q = App.ui.txQ || '', acct = App.ui.txAcct || 'all';
  let rows = state.transactions.filter(t => ids.includes(t.companyId));
  if (st !== 'all') rows = rows.filter(t => t.status === st);
  if (kind !== 'all') rows = rows.filter(t => t.kind === kind);
  if (cat !== 'all') rows = rows.filter(t => t.category === cat);
  if (acct !== 'all') rows = rows.filter(t => t.accountId === acct);
  if (q) { const s = q.toLowerCase(); rows = rows.filter(t => t.no.toLowerCase().includes(s) || (t.memo || '').toLowerCase().includes(s) || (t.party || '').toLowerCase().includes(s)); }
  rows = rows.slice().sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : (a.no < b.no ? 1 : -1));
  const cats = uniq(state.transactions.map(t => t.category)).sort();
  let h = finFilterBar(selectEl('tx-st', [['all', 'Any status'], ['draft', 'Draft'], ['posted', 'Posted'], ['reversed', 'Reversed']], st, 'data-act-change="txf" data-k="txStatus" aria-label="Status"') + selectEl('tx-kind', [['all', 'Revenue & expenses'], ['revenue', 'Revenue'], ['expense', 'Expenses']], kind, 'data-act-change="txf" data-k="txKind" aria-label="Type"') + selectEl('tx-cat', [['all', 'All categories']].concat(cats), cat, 'data-act-change="txf" data-k="txCat" aria-label="Category"') + (acct !== 'all' ? '<button class="chip on" data-act="tx-clear-acct">' + esc(get('accounts', acct).name) + ' · ' + esc(company(get('accounts', acct).companyId).short) + ' ✕</button>' : '') + '<input class="input" id="tx-q" placeholder="Search number, memo, party" value="' + esc(q) + '" data-act-input="txf" data-k="txQ">');
  h += '<div class="row small muted" style="margin:-4px 0 12px">' + rows.length + ' entries · ' + money(sum(rows.filter(t => t.kind === 'revenue' && posted(t)), t => t.amount), { compact: true }) + ' revenue · ' + money(sum(rows.filter(t => t.kind === 'expense' && posted(t)), t => t.amount), { compact: true }) + ' expenses (posted)</div>';
  h += card('', tableEl([
    { h: 'Entry', nowrap: 1, v: t => '<span class="mono">' + t.no + '</span><div class="muted small">' + fmtDate(t.date) + '</div>' },
    { h: 'Description', v: t => '<b>' + esc(t.memo) + '</b><div class="muted small">' + esc(t.party || '') + '</div>' },
    { h: 'Company', v: t => companyTag(t.companyId) },
    { h: 'Category', v: t => esc(t.category) },
    { h: 'Amount', r: 1, v: t => '<span class="' + (t.kind === 'revenue' ? 'up' : '') + ' strong">' + (t.kind === 'revenue' ? '+' : '−') + money(Math.abs(t.amount)).replace('−', '') + '</span>' + (t.amount < 0 ? '<div class="muted small">negative entry</div>' : '') },
    { h: 'Docs', r: 1, v: t => t.docs.length ? '<span title="Supporting documents">' + icon('clip').replace('<svg', '<svg width="13" height="13"') + ' ' + t.docs.length + '</span>' : '<span class="down small">none</span>' },
    { h: 'Status', v: t => txStatusBadge(t) },
  ], rows, { rowAct: 'open-tx', pageSize: 25, pageKey: 'txpg', empty: 'No transactions match.' }), { flush: true });
  return h;
}
CHANGE.txf = el => { App.ui[el.dataset.k] = el.value; App.ui.txpg = 0; render(); };
ACT['tx-clear-acct'] = () => { App.ui.txAcct = 'all'; render(); };
ACT['open-tx'] = el => openDrawer('tx', el.dataset.id);
DRAWERS.tx = function (id) {
  const t = get('transactions', id); if (!t || !can('finance.view') || !scopeCompanyIds().includes(t.companyId)) return '';
  const m = can('finance.manage'); const acct = get('accounts', t.accountId);
  let actions = '';
  if (m && t.status === 'draft') actions = '<div class="action-bar"><button class="btn primary" data-act="tx-post" data-id="' + t.id + '"' + (canPost(t) ? '' : ' disabled') + '>' + icon('ok') + 'Post to ledger</button><button class="btn" data-act="tx-edit" data-id="' + t.id + '">' + icon('edit') + 'Edit draft</button><button class="btn danger" data-act="tx-discard" data-id="' + t.id + '">Discard draft</button></div>' + (canPost(t) ? '' : noticeEl('A supporting document is required before posting. ' + cfg(), 'warn', 'clip'));
  if (m && t.status === 'posted' && !t.reversalOf) actions = '<div class="action-bar"><button class="btn" data-act="tx-reverse" data-id="' + t.id + '">' + icon('undo') + 'Reverse entry</button><button class="btn" data-act="tx-adjust" data-id="' + t.id + '">' + icon('edit') + 'Post adjustment</button></div>';
  const link = (lbl, tid) => { const x = get('transactions', tid); return x ? '<dt>' + lbl + '</dt><dd><button class="link" data-act="open-tx" data-id="' + x.id + '">' + x.no + '</button> · ' + money(x.amount) + '</dd>' : ''; };
  return drawerHead('<span class="mono">' + t.no + '</span> · ' + (t.kind === 'revenue' ? 'Revenue' : 'Expense') + ' entry', esc(t.memo), txStatusBadge(t) + companyTag(t.companyId)) +
    '<div class="drawer-b">' + actions + (t.status !== 'draft' ? noticeEl('Posted entries are locked. Corrections are recorded as reversal or adjustment entries so the audit trail stays complete.', '', 'lock') : '') +
    '<div class="card" style="padding:18px"><div class="eyebrow">Amount</div><div class="kpi-val num ' + (t.kind === 'revenue' ? 'up' : '') + '" style="font-size:30px;font-weight:700">' + money(t.amount, { cents: true }) + '</div></div>' +
    card('Details', '<dl class="dl"><dt>Date</dt><dd>' + fmtDate(t.date) + '</dd><dt>Company</dt><dd>' + esc(company(t.companyId).name) + '</dd><dt>Department</dt><dd>' + esc(dept(t.departmentId).name) + '</dd><dt>Category</dt><dd>' + esc(t.category) + (coaAcct(t.category) ? ' <span class="mono muted small">' + coaAcct(t.category).code + ' · ' + esc(coaLine(t.category)) + '</span>' : '') + (isNonPL(t.category) ? ' <span class="muted small">(balance sheet / cash flow only)</span>' : '') + '</dd><dt>Account</dt><dd>' + (acct ? esc(acct.name) + ' · ' + esc(company(acct.companyId).short) : '—') + '</dd><dt>Counterparty</dt><dd>' + esc(t.party || '—') + '</dd>' + (t.projectId && project(t.projectId) ? '<dt>Project</dt><dd><button class="link" data-act="open" data-t="project" data-id="' + t.projectId + '">' + esc(project(t.projectId).name) + '</button></dd>' : '') + (t.approvalId ? '<dt>Approval</dt><dd><button class="link" data-act="open" data-t="approval" data-id="' + t.approvalId + '">' + esc((get('approvals', t.approvalId) || {}).no) + '</button></dd>' : '') + '<dt>Recorded by</dt><dd>' + esc(user(t.createdBy).name) + '</dd>' + (t.postedBy ? '<dt>Posted by</dt><dd>' + esc(user(t.postedBy).name) + ' · ' + fmtDT(t.postedAt) + '</dd>' : '') + (t.reversedBy ? link('Reversed by', t.reversedBy) : '') + (t.reversalOf ? link('Reverses', t.reversalOf) : '') + (t.adjustmentOf ? link('Adjusts', t.adjustmentOf) : '') + (t.adjustments || []).map(a => link('Adjustment', a)).join('') + '</dl>') +
    card('Supporting documents', attachList(t.docs, m && t.status === 'draft' ? { act: 'tx', id: t.id } : null)) +
    card('Audit history', historyTimeline(t.id)) + '</div>';
};
Object.assign(ACT, {
  'new-tx': () => openTxForm(),
  'tx-edit': el => openTxForm(get('transactions', el.dataset.id)),
  'tx-post': el => { const t = get('transactions', el.dataset.id); if (!canPost(t)) { toast('Attach a supporting document first.', true); return; } postTransaction(t); toast(t.no + ' posted'); refresh(); },
  'tx-discard': el => {
    const t = get('transactions', el.dataset.id);
    openModal(modalShell('Discard draft ' + t.no + '?', '<p style="margin:0">Drafts were never posted, so they can be discarded. The discard is recorded in the audit log.</p>', '<button class="btn" data-act="close-modal">Keep draft</button><button class="btn danger solid" data-act="tx-discard-go" data-id="' + t.id + '">Discard</button>'));
  },
  'tx-discard-go': el => { const t = get('transactions', el.dataset.id); state.transactions = state.transactions.filter(x => x.id !== t.id); audit('discarded', 'transaction', t.id, 'Discarded draft ' + t.no + ' (' + money(t.amount) + ', ' + t.memo + ')'); closeModal(); closeDrawer(); toast('Draft discarded'); render(); },
  'tx-reverse': el => {
    const t = get('transactions', el.dataset.id);
    openModal(modalShell('Reverse ' + t.no, noticeEl('This posts a new entry of ' + money(-t.amount) + ' dated today and marks ' + t.no + ' as reversed. Both entries stay in the ledger.', 'warn', 'undo') + '<div style="height:12px"></div>' + field('Reason', '<textarea class="input" name="reason" id="f_reason" placeholder="e.g. Duplicate vendor charge"></textarea>'), '<button class="btn" data-act="close-modal">Cancel</button><button class="btn danger solid" data-act="tx-reverse-go" data-id="' + t.id + '">Post reversal</button>'));
  },
  'tx-reverse-go': el => { const v = formVals(); if (!v.reason.trim()) { toast('A reason is required', true); return; } const r = reverseTransaction(get('transactions', el.dataset.id), v.reason.trim()); closeModal(); toast('Reversal ' + r.no + ' posted'); refresh(); },
  'tx-adjust': el => {
    const t = get('transactions', el.dataset.id);
    openModal(modalShell('Adjust ' + t.no, '<p class="muted" style="margin-top:0">Posts a separate adjustment entry. Use a negative amount to reduce.</p><div class="form-grid">' + field('Adjustment amount', inputEl('delta', '', 'type="number" step="0.01"')) + field('Current amount', '<div class="input" style="background:var(--surface-2)">' + money(t.amount, { cents: true }) + '</div>') + field('Reason', '<textarea class="input" name="reason" id="f_reason"></textarea>', { full: 1 }) + '</div>', '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="tx-adjust-go" data-id="' + t.id + '">Post adjustment</button>'));
  },
  'tx-adjust-go': el => { const v = formVals(); const d = Number(v.delta); if (!d) { toast('Enter a non-zero amount', true); return; } if (!v.reason.trim()) { toast('A reason is required', true); return; } const r = adjustTransaction(get('transactions', el.dataset.id), d, v.reason.trim()); closeModal(); toast('Adjustment ' + r.no + ' posted'); refresh(); },
});
function openTxForm(t) {
  App.ui.pendingFiles = null;
  const cid = t ? t.companyId : finCompanies()[0];
  const revCats = revenueCats();
  openModal(modalShell(t ? 'Edit draft ' + t.no : 'Record transaction', '<div class="form-grid">' +
    field('Type', selectF('kind', [['expense', 'Expense / payment out'], ['revenue', 'Revenue / receipt']], t ? t.kind : 'expense', 'data-act-change="txform-kind"')) + field('Date', inputEl('date', t ? t.date : TODAY_S, 'type="date"')) +
    field('Company', selectF('companyId', companyOptions(scopeCompanyIds()), cid, 'data-act-change="txform-co"')) + field('Department', '<span id="txf-dept">' + selectF('departmentId', deptOptions(cid), t && t.departmentId) + '</span>') +
    field('Category', '<span id="txf-cat">' + selectF('category', (t ? t.kind : 'expense') === 'revenue' ? revCats : expenseCats(), t && t.category) + '</span>') + field('Amount (' + state.settings.currency + ')', inputEl('amount', t ? t.amount : '', 'type="number" step="0.01" min="0"')) +
    field('Bank / cash account', '<span id="txf-acct">' + selectF('accountId', state.accounts.filter(a => a.companyId === cid).map(a => [a.id, a.name]), t && t.accountId) + '</span>') + field('Counterparty', inputEl('party', t ? t.party : '')) +
    field('Description', inputEl('memo', t ? t.memo : '', 'placeholder="What is this entry for?"'), { full: 1 }) +
    (t ? '' : field('Supporting documents', '<label class="btn sm" style="align-self:flex-start">' + icon('clip') + 'Attach invoice / receipt<input type="file" hidden multiple data-upload="modal"></label><div id="pending-files" class="stack" style="gap:6px"></div>', { full: 1, hint: state.settings.requireDocForPosting ? 'Required before the entry can be posted. ' + cfg() : '' })) +
    (t ? '' : '<label class="check full"><input type="checkbox" class="toggle" name="postNow" id="f_postNow"> Post immediately (needs a document)</label>') + '</div>',
    '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="tx-save" data-id="' + (t ? t.id : '') + '">' + (t ? 'Save draft' : 'Save') + '</button>'), true);
}
CHANGE['txform-kind'] = el => { const revCats = revenueCats(); document.getElementById('txf-cat').innerHTML = selectF('category', el.value === 'revenue' ? revCats : expenseCats()); };
CHANGE['txform-co'] = el => { document.getElementById('txf-dept').innerHTML = selectF('departmentId', deptOptions(el.value)); document.getElementById('txf-acct').innerHTML = selectF('accountId', state.accounts.filter(a => a.companyId === el.value).map(a => [a.id, a.name])); };
ACT['tx-save'] = el => {
  const v = formVals(); const amt = Number(v.amount);
  if (!(amt > 0)) { toast('Enter a positive amount', true); return; }
  if (!v.memo.trim()) { toast('Add a description', true); return; }
  if (el.dataset.id) {
    const t = get('transactions', el.dataset.id); const before = t.no + ' ' + money(t.amount);
    Object.assign(t, { kind: v.kind, date: v.date, companyId: v.companyId, departmentId: v.departmentId, category: v.category, amount: amt, accountId: v.accountId, party: v.party, memo: v.memo.trim() });
    audit('edited', 'transaction', t.id, 'Edited draft (was ' + before + ', now ' + money(amt) + ')'); closeModal(); refresh(); return;
  }
  const t = createTransaction({ kind: v.kind, date: v.date, companyId: v.companyId, departmentId: v.departmentId, category: v.category, amount: amt, accountId: v.accountId, party: v.party, memo: v.memo.trim(), docs: App.ui.pendingFiles || [] });
  App.ui.pendingFiles = null;
  if (v.postNow) { if (canPost(t)) postTransaction(t); else toast('Saved as draft — attach a document to post.', true); }
  closeModal(); App.ui.finTab = 'transactions'; toast(t.no + (t.status === 'posted' ? ' posted' : ' saved as draft')); render(); openDrawer('tx', t.id);
};

/* ---------- budgets ---------- */
function budgetTable(rows, opt) {
  opt = opt || {};
  const alert = Number(state.settings.budgetAlertPct);
  return tableEl([
    { h: 'Budget line', v: b => '<b>' + esc(b.category) + '</b><div class="muted small">' + esc(dept(b.departmentId).name) + ' · ' + esc(company(b.companyId).short) + '</div>' },
    { h: 'Budget', r: 1, v: b => money(b.amount) }, { h: 'Actual', r: 1, v: b => money(b.actual) }, { h: 'Remaining', r: 1, v: b => '<span class="' + (b.remaining < 0 ? 'down' : '') + '">' + money(b.remaining) + '</span>' },
    { h: 'Used', v: b => '<div class="row" style="flex-wrap:nowrap;gap:8px"><div style="width:90px">' + progressBar(Math.min(100, b.util), b.util >= 100 ? 'bad' : b.util >= alert ? 'warn' : 'good') + '</div><span class="num small strong">' + fmtPct(b.util) + '</span></div>' },
    { h: 'Full-year forecast', r: 1, v: b => cfSection(b.category) === 'investing' ? '<span class="muted small">n/a (one-off)</span>' : '<span class="' + (b.variance < 0 ? 'down' : '') + '">' + money(b.forecast) + '</span>' },
  ].concat(opt.edit ? [{ h: '', v: b => '<button class="btn sm ghost" data-act="bud-edit" data-id="' + b.id + '">Edit</button>' }] : []), rows, { pageSize: opt.page ? 20 : 0, pageKey: 'bpg', empty: 'No budget lines over the alert threshold.' });
}
function finBudgets(ids) {
  const rows = budgetRows(ids, CUR_YEAR);
  const cmp = ids.map(id => { const r = rows.filter(b => b.companyId === id); return { id, b: sum(r, x => x.amount), a: sum(r, x => x.actual) }; }).filter(x => x.b);
  const sort = App.ui.budSort || 'util';
  const sorted = rows.slice().sort((a, b) => sort === 'util' ? b.util - a.util : sort === 'amount' ? b.amount - a.amount : (a.companyId + a.departmentId + a.category < b.companyId + b.departmentId + b.category ? -1 : 1));
  const elapsed = Math.round((CUR_MONTH + TODAY.getDate() / 31) / 12 * 100);
  let h = finFilterBar('<span class="muted small">Sort</span>' + segEl([['util', 'Most used'], ['amount', 'Largest'], ['org', 'By company']], sort, 'bud-sort') + '<span class="spacer"></span>' + (can('finance.manage') ? '<button class="btn" data-act="bud-new">' + icon('plus') + 'Add budget line</button>' : '<button class="btn" data-act="new-request" data-type="budget">Request budget change</button>'));
  h += '<div class="grid g4" style="margin-bottom:16px">' + kpiTile(CUR_YEAR + ' budget', money(sum(rows, r => r.amount), { compact: true }), '<span class="muted">' + rows.length + ' lines</span>', { hero: true }) + kpiTile('Spent to date', money(sum(rows, r => r.actual), { compact: true }), '<span class="muted">' + pct(sum(rows, r => r.actual), sum(rows, r => r.amount)) + '% used · ' + elapsed + '% of year elapsed</span>') + kpiTile('Lines over alert', String(rows.filter(r => r.util >= state.settings.budgetAlertPct).length), '<span class="muted">threshold ' + state.settings.budgetAlertPct + '%</span> ' + cfg()) + kpiTile('Forecast overrun', money(-sum(rows.filter(r => r.variance < 0 && cfSection(r.category) !== 'investing'), r => r.variance), { compact: true }), '<span class="muted">' + rows.filter(r => r.variance < 0 && cfSection(r.category) !== 'investing').length + ' lines trending over</span>') + '</div>';
  if (cmp.length > 1) h += card('Budget vs actual by company', barChart({ labels: cmp.map(c => company(c.id).short), series: [{ name: 'Budget', color: 'var(--s4)', values: cmp.map(c => c.b) }, { name: 'Actual to date', color: 'var(--s1)', values: cmp.map(c => c.a) }], height: 200, aria: 'Budget versus actual by company' }), { sub: CUR_YEAR + ' full-year budget vs spend to date' }) + '<div style="height:16px"></div>';
  h += card('Budget vs actual', budgetTable(sorted, { edit: can('finance.manage'), page: true }), { flush: true, sub: 'Forecast = actual ÷ share of year elapsed' });
  return h;
}
Object.assign(ACT, {
  'bud-sort': el => { App.ui.budSort = el.dataset.v; render(); },
  'bud-edit': el => { const b = get('budgets', el.dataset.id); openModal(modalShell('Edit budget line', '<p class="muted" style="margin-top:0">' + esc(b.category) + ' · ' + esc(dept(b.departmentId).name) + ' · ' + esc(company(b.companyId).name) + '</p>' + field('Annual budget (' + CUR_YEAR + ')', inputEl('amount', b.amount, 'type="number" min="0" step="500"')) + '<div style="height:12px"></div>' + field('Reason for change', '<textarea class="input" name="reason" id="f_reason"></textarea>', { hint: 'Budget changes are logged. Large changes should go through a Budget request.' }), '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="bud-save" data-id="' + b.id + '">Save</button>')); },
  'bud-save': el => { const b = get('budgets', el.dataset.id); const v = formVals(); const n = Number(v.amount); if (!(n >= 0)) return; if (!v.reason.trim()) { toast('Give a reason for the change', true); return; } audit('adjusted', 'budget', b.id, 'Budget ' + b.category + ' (' + dept(b.departmentId).name + ') ' + money(b.amount) + ' → ' + money(n) + ' — ' + v.reason.trim()); b.amount = n; closeModal(); toast('Budget updated'); render(); },
  'bud-new': () => { const cid = finCompanies()[0]; openModal(modalShell('Add budget line', '<div class="form-grid">' + field('Company', selectF('companyId', companyOptions(scopeCompanyIds()), cid, 'data-act-change="bud-co"')) + field('Department', '<span id="bud-dept">' + selectF('departmentId', deptOptions(cid)) + '</span>') + field('Category', selectF('category', expenseCats())) + field('Annual amount', inputEl('amount', '', 'type="number" min="0" step="500"')) + '</div>', '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="bud-add">Add</button>')); },
  'bud-add': () => { const v = formVals(); const n = Number(v.amount); if (!(n > 0)) { toast('Enter an amount', true); return; } if (state.budgets.some(b => b.companyId === v.companyId && b.departmentId === v.departmentId && b.category === v.category && b.year === CUR_YEAR)) { toast('That line already exists — edit it instead.', true); return; } const b = { id: uid('bg'), companyId: v.companyId, departmentId: v.departmentId, category: v.category, year: CUR_YEAR, amount: n }; state.budgets.push(b); audit('created', 'budget', b.id, 'Added budget line ' + v.category + ' · ' + dept(v.departmentId).name + ' ' + money(n)); closeModal(); render(); },
});
CHANGE['bud-co'] = el => { document.getElementById('bud-dept').innerHTML = selectF('departmentId', deptOptions(el.value)); };

/* ---------- receivables & payables ---------- */
function finReceivables(ids) {
  const list = state.invoices.filter(i => ids.includes(i.companyId));
  const ag = aging(list);
  const st = App.ui.arSt || 'open';
  let rows = list.slice().sort((a, b) => a.dueDate < b.dueDate ? -1 : 1);
  if (st === 'open') rows = rows.filter(i => !['paid', 'void'].includes(invoiceStatus(i)));
  else if (st !== 'all') rows = rows.filter(i => invoiceStatus(i) === st);
  let h = finFilterBar(segEl([['open', 'Open'], ['overdue', 'Overdue'], ['draft', 'Draft'], ['paid', 'Paid'], ['all', 'All']], st, 'ar-st') + '<span class="spacer"></span>' + (can('finance.manage') ? '<button class="btn" data-act="inv-new">' + icon('plus') + 'New invoice</button>' : ''));
  h += '<div class="grid g4" style="margin-bottom:16px">' + kpiTile('Outstanding', money(arOutstanding(ids), { compact: true }), '<span class="muted">' + list.filter(i => ['sent', 'partial', 'overdue'].includes(invoiceStatus(i))).length + ' open invoices</span>', { hero: true }) + kpiTile('Current', money(ag.current, { compact: true }), '<span class="muted">not yet due</span>') + kpiTile('1–30 days overdue', money(ag.d30, { compact: true }), '') + kpiTile('Over 30 days', money(ag.d60 + ag.d90, { compact: true }), '<span class="' + (ag.d60 + ag.d90 ? 'down' : 'up') + '">' + (ag.d60 + ag.d90 ? 'Chase now' : 'None') + '</span>') + '</div>';
  h += card('', tableEl([
    { h: 'Invoice', nowrap: 1, v: i => '<span class="mono strong">' + i.number + '</span><div class="muted small">' + fmtDate(i.issueDate) + '</div>' },
    { h: 'Customer', v: i => '<b>' + esc(i.customer) + '</b><div class="muted small">' + esc(i.category) + '</div>' },
    { h: 'Company', v: i => companyTag(i.companyId) },
    { h: 'Due', nowrap: 1, v: i => '<span class="' + (invoiceStatus(i) === 'overdue' ? 'down strong' : '') + '">' + fmtShort(i.dueDate) + '</span>' },
    { h: 'Amount', r: 1, v: i => money(i.amount) }, { h: 'Outstanding', r: 1, v: i => '<b>' + money(i.amount - i.paid) + '</b>' },
    { h: 'Status', v: i => badge(DOC_STATUS[invoiceStatus(i)][0], DOC_STATUS[invoiceStatus(i)][1]) },
  ], rows, { rowAct: 'open-inv', empty: 'No invoices.' }), { flush: true });
  return h;
}
function finPayables(ids) {
  const list = state.bills.filter(i => ids.includes(i.companyId));
  const st = App.ui.apSt || 'open';
  let rows = list.slice().sort((a, b) => a.dueDate < b.dueDate ? -1 : 1);
  if (st === 'open') rows = rows.filter(i => i.amount > i.paid);
  else if (st === 'paid') rows = rows.filter(i => i.paid >= i.amount);
  const due30 = list.filter(b => b.amount > b.paid && daysUntil(b.dueDate) <= 30);
  let h = finFilterBar(segEl([['open', 'Unpaid'], ['paid', 'Paid'], ['all', 'All']], st, 'ap-st') + '<span class="spacer"></span>' + (can('finance.manage') ? '<button class="btn" data-act="bill-new">' + icon('plus') + 'Enter bill</button>' : ''));
  h += '<div class="grid g4" style="margin-bottom:16px">' + kpiTile('Unpaid bills', money(apOutstanding(ids), { compact: true }), '<span class="muted">' + list.filter(b => b.amount > b.paid).length + ' bills</span>', { hero: true }) + kpiTile('Due within 30 days', money(sum(due30, b => b.amount - b.paid), { compact: true }), '<span class="muted">' + due30.length + ' bills</span>') + kpiTile('Overdue', money(sum(list.filter(b => b.amount > b.paid && daysUntil(b.dueDate) < 0), b => b.amount - b.paid), { compact: true }), '') + kpiTile('In payment approval', String(state.approvals.filter(a => a.type === 'payment' && a.status === 'pending' && ids.includes(a.companyId)).length), '<span class="muted">payments route through approvals</span>') + '</div>';
  h += card('', tableEl([
    { h: 'Bill', nowrap: 1, v: i => '<span class="mono strong">' + i.number + '</span><div class="muted small">' + fmtDate(i.date) + '</div>' },
    { h: 'Vendor', v: i => '<b>' + esc(i.vendor) + '</b><div class="muted small">' + esc(i.category) + '</div>' },
    { h: 'Company', v: i => companyTag(i.companyId) },
    { h: 'Due', nowrap: 1, v: i => '<span class="' + (i.amount > i.paid && daysUntil(i.dueDate) < 0 ? 'down strong' : '') + '">' + fmtShort(i.dueDate) + '</span>' },
    { h: 'Amount', r: 1, v: i => money(i.amount) }, { h: 'Unpaid', r: 1, v: i => '<b>' + money(i.amount - i.paid) + '</b>' },
    { h: 'Status', v: i => { const ap = state.approvals.find(a => a.billId === i.id && a.status === 'pending'); return i.paid >= i.amount ? badge('Paid', 'b-good') : ap ? badge('In approval', 'b-brand') : daysUntil(i.dueDate) < 0 ? badge('Overdue', 'b-bad') : badge('Open', 'b-info'); } },
  ], rows, { rowAct: 'open-bill', empty: 'No bills.' }), { flush: true });
  return h;
}
Object.assign(ACT, {
  'ar-st': el => { App.ui.arSt = el.dataset.v; render(); }, 'ap-st': el => { App.ui.apSt = el.dataset.v; render(); },
  'open-inv': el => openDrawer('invoice', el.dataset.id), 'open-bill': el => openDrawer('bill', el.dataset.id),
});
DRAWERS.invoice = function (id) {
  const i = get('invoices', id); if (!i || !can('finance.view')) return '';
  const s = invoiceStatus(i); const m = can('finance.manage');
  let actions = '';
  if (m && s === 'draft') actions = '<div class="action-bar"><button class="btn primary" data-act="inv-send" data-id="' + i.id + '">' + icon('send') + 'Mark as sent</button><button class="btn danger" data-act="inv-void" data-id="' + i.id + '">Void</button></div>';
  else if (m && ['sent', 'partial', 'overdue'].includes(s)) actions = '<div class="action-bar"><button class="btn good" data-act="inv-pay" data-id="' + i.id + '">' + icon('dollar') + 'Record payment</button>' + (i.paid === 0 ? '<button class="btn danger" data-act="inv-void" data-id="' + i.id + '">Void</button>' : '') + '</div>';
  const receipts = state.transactions.filter(t => t.invoiceId === i.id);
  return drawerHead('Invoice · ' + esc(company(i.companyId).name), '<span class="mono">' + i.number + '</span> — ' + esc(i.customer), badge(DOC_STATUS[s][0], DOC_STATUS[s][1])) + '<div class="drawer-b">' + actions +
    '<div class="grid g3">' + kpiTile('Amount', money(i.amount)) + kpiTile('Paid', money(i.paid)) + kpiTile('Outstanding', money(i.amount - i.paid)) + '</div>' +
    card('Details', '<dl class="dl"><dt>Issued</dt><dd>' + fmtDate(i.issueDate) + '</dd><dt>Due</dt><dd>' + fmtDate(i.dueDate) + '</dd><dt>Revenue category</dt><dd>' + esc(i.category) + '</dd><dt>Department</dt><dd>' + esc(dept(i.departmentId).name) + '</dd>' + (receipts.length ? '<dt>Receipts</dt><dd>' + receipts.map(t => '<button class="link" data-act="open-tx" data-id="' + t.id + '">' + t.no + '</button> ' + money(t.amount)).join('<br>') + '</dd>' : '') + '</dl>') +
    card('Documents', attachList(i.docs || [])) + card('Audit history', historyTimeline(i.id)) + '</div>';
};
DRAWERS.bill = function (id) {
  const b = get('bills', id); if (!b || !can('finance.view')) return '';
  const ap = state.approvals.find(a => a.billId === b.id && a.status === 'pending');
  let actions = '';
  if (b.paid < b.amount) actions = ap ? noticeEl('Payment request <button class="link" data-act="open-approval" data-id="' + ap.id + '">' + ap.no + '</button> is in approval. The bill is paid automatically once approved.', '', 'stamp') : '<div class="action-bar"><button class="btn primary" data-act="bill-pay" data-id="' + b.id + '">' + icon('send') + 'Request payment</button><span class="small muted">Routes through payment approval rules ' + cfg() + '</span></div>';
  const pays = state.transactions.filter(t => t.billId === b.id);
  return drawerHead('Bill · ' + esc(company(b.companyId).name), '<span class="mono">' + b.number + '</span> — ' + esc(b.vendor), b.paid >= b.amount ? badge('Paid', 'b-good') : badge(daysUntil(b.dueDate) < 0 ? 'Overdue' : 'Open', daysUntil(b.dueDate) < 0 ? 'b-bad' : 'b-info')) + '<div class="drawer-b">' + actions +
    '<div class="grid g3">' + kpiTile('Amount', money(b.amount)) + kpiTile('Paid', money(b.paid)) + kpiTile('Unpaid', money(b.amount - b.paid)) + '</div>' +
    card('Details', '<dl class="dl"><dt>Bill date</dt><dd>' + fmtDate(b.date) + '</dd><dt>Due</dt><dd>' + fmtDate(b.dueDate) + '</dd><dt>Category</dt><dd>' + esc(b.category) + '</dd><dt>Department</dt><dd>' + esc(dept(b.departmentId).name) + '</dd>' + (pays.length ? '<dt>Payments</dt><dd>' + pays.map(t => '<button class="link" data-act="open-tx" data-id="' + t.id + '">' + t.no + '</button> ' + money(t.amount)).join('<br>') + '</dd>' : '') + '</dl>') +
    card('Documents', attachList(b.docs || [])) + card('Audit history', historyTimeline(b.id)) + '</div>';
};
Object.assign(ACT, {
  'inv-send': el => { const i = get('invoices', el.dataset.id); i.status = 'sent'; audit('sent', 'invoice', i.id, 'Invoice ' + i.number + ' sent to ' + i.customer); refresh(); },
  'inv-void': el => { const i = get('invoices', el.dataset.id); i.status = 'void'; audit('voided', 'invoice', i.id, 'Invoice ' + i.number + ' voided (no payments recorded)'); toast('Invoice voided'); refresh(); },
  'inv-pay': el => { const i = get('invoices', el.dataset.id); openModal(modalShell('Record payment — ' + i.number, field('Amount received', inputEl('amount', i.amount - i.paid, 'type="number" min="0" step="0.01"'), { hint: 'Outstanding ' + money(i.amount - i.paid) + '. A posted revenue entry is created automatically.' }), '<button class="btn" data-act="close-modal">Cancel</button><button class="btn good" data-act="inv-pay-go" data-id="' + i.id + '">Record</button>')); },
  'inv-pay-go': el => { const i = get('invoices', el.dataset.id); const n = Number(formVals().amount); if (!(n > 0) || n > i.amount - i.paid + .001) { toast('Enter an amount up to the outstanding balance', true); return; } const tx = recordInvoicePayment(i, n); closeModal(); toast('Receipt ' + tx.no + ' posted'); refresh(); },
  'bill-pay': el => { const b = get('bills', el.dataset.id); closeDrawer(); openNewRequest({ type: 'payment' }); setTimeout(() => { const s = document.getElementById('f_billId'); if (s) { s.value = b.id; CHANGE['nr-bill'](s); } }, 20); },
  'inv-new': () => { const cid = finCompanies().find(id => !company(id).isHolding) || finCompanies()[0]; const revCats = uniq(state.transactions.filter(x => x.kind === 'revenue').map(x => x.category)); openModal(modalShell('New invoice', '<div class="form-grid">' + field('Company', selectF('companyId', companyOptions(scopeCompanyIds()), cid, 'data-act-change="doc-co"')) + field('Department', '<span id="doc-dept">' + selectF('departmentId', deptOptions(cid)) + '</span>') + field('Customer', inputEl('party', '')) + field('Revenue category', selectF('category', revCats)) + field('Amount', inputEl('amount', '', 'type="number" min="0" step="0.01"')) + field('Due date', inputEl('dueDate', rel(30), 'type="date"')) + '</div>', '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="inv-create">Create draft</button>')); },
  'inv-create': () => { const v = formVals(); if (!v.party.trim() || !(Number(v.amount) > 0)) { toast('Customer and amount are required', true); return; } const n = 'INV-' + CUR_YEAR + '-' + (4200 + state.invoices.length); const i = { id: uid('inv'), number: n, companyId: v.companyId, departmentId: v.departmentId, category: v.category, customer: v.party.trim(), issueDate: TODAY_S, dueDate: v.dueDate, amount: Number(v.amount), paid: 0, status: 'draft', docs: [{ id: uid('f'), name: n + '.pdf', size: 90000 }] }; state.invoices.push(i); audit('created', 'invoice', i.id, 'Created draft invoice ' + n + ' for ' + i.customer + ' ' + money(i.amount)); closeModal(); refresh(); openDrawer('invoice', i.id); },
  'bill-new': () => { const cid = finCompanies()[0]; openModal(modalShell('Enter bill', '<div class="form-grid">' + field('Company', selectF('companyId', companyOptions(scopeCompanyIds()), cid, 'data-act-change="doc-co"')) + field('Department', '<span id="doc-dept">' + selectF('departmentId', deptOptions(cid)) + '</span>') + field('Vendor', inputEl('party', '')) + field('Category', selectF('category', expenseCats())) + field('Amount', inputEl('amount', '', 'type="number" min="0" step="0.01"')) + field('Due date', inputEl('dueDate', rel(30), 'type="date"')) + field('Vendor invoice', '<label class="btn sm" style="align-self:flex-start">' + icon('clip') + 'Attach<input type="file" hidden data-upload="modal"></label><div id="pending-files"></div>', { full: 1 }) + '</div>', '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="bill-create">Save bill</button>')); App.ui.pendingFiles = null; },
  'bill-create': () => { const v = formVals(); if (!v.party.trim() || !(Number(v.amount) > 0)) { toast('Vendor and amount are required', true); return; } const n = 'BILL-' + (7800 + state.bills.length); const b = { id: uid('bill'), number: n, companyId: v.companyId, departmentId: v.departmentId, category: v.category, vendor: v.party.trim(), date: TODAY_S, dueDate: v.dueDate, amount: Number(v.amount), paid: 0, status: 'open', docs: App.ui.pendingFiles || [] }; App.ui.pendingFiles = null; state.bills.push(b); audit('created', 'bill', b.id, 'Entered bill ' + n + ' from ' + b.vendor + ' ' + money(b.amount)); closeModal(); refresh(); openDrawer('bill', b.id); },
});
CHANGE['doc-co'] = el => { document.getElementById('doc-dept').innerHTML = selectF('departmentId', deptOptions(el.value)); };

/* ---------- bank & cash ---------- */
function finCash(ids) {
  const accts = state.accounts.filter(a => ids.includes(a.companyId));
  const months = lastNMonths(12);
  const bal = months.map(({ y, m }) => { const end = monthRange(y, m)[1]; return cashPosition(ids, end > TODAY_S ? TODAY_S : end); });
  let h = finFilterBar();
  h += '<div class="grid g-2-1" style="margin-bottom:16px">' + card('Cash balance, month end', lineChart({ labels: months.map(m => MONTHS[m.m]), series: [{ name: 'Cash', color: 'var(--s1)', values: bal }], area: true, zero: false, aria: 'Cash balance by month' }), { sub: 'All bank and cash accounts in view' }) +
    card('Position today', '<div class="kpi-val num" style="font-size:30px;font-weight:700">' + money(cashPosition(ids)) + '</div><div class="muted small" style="margin-bottom:14px">across ' + accts.length + ' accounts</div>' + hbars(ids.map(id => ({ label: company(id).name, value: cashPosition([id]), color: companyColor(id) })).sort((a, b) => b.value - a.value))) + '</div>';
  const lim = Number(state.settings.cashAlertMonths); const lb = Number(state.settings.runwayLookbackMonths) || 3;
  const rw = ids.map(id => Object.assign({ id }, cashRunway([id]))).sort((a, b) => a.months - b.months);
  h += '<div style="margin-bottom:16px">' + card('Runway by company ' + cfg(), tableEl([
    { h: 'Company', v: r => companyTag(r.id) }, { h: 'Cash today', r: 1, v: r => money(r.cash) },
    { h: 'Avg monthly costs', r: 1, v: r => money(r.burn) }, { h: 'Runway', r: 1, v: r => '<b>' + fmtRunway(r.months) + '</b>' },
    { h: 'Status', v: r => !lim ? '<span class="muted">Alert off</span>' : r.months < lim ? badge('Below ' + lim + ' months', 'b-bad') : badge('OK', 'b-good') },
  ], rw), { flush: true, sub: 'Runway = cash ÷ average monthly costs over the last ' + lb + ' full months (all posted expenses, incl. capex and loan repayments). Alert threshold: ' + (lim ? lim + ' months' : 'off') + ' — change it in Settings → Business rules.' }) + '</div>';
  h += card('Accounts', tableEl([
    { h: 'Account', v: a => '<b>' + esc(a.name) + '</b>' + (a.last4 ? ' <span class="mono muted">••' + a.last4 + '</span>' : '') + '<div class="muted small">' + esc(a.institution) + '</div>' },
    { h: 'Company', v: a => companyTag(a.companyId) }, { h: 'Type', v: a => badge(a.type === 'bank' ? 'Bank' : 'Cash', a.type === 'bank' ? 'b-info' : '', true) },
    { h: '30-day change', r: 1, v: a => { const d = accountBalance(a) - accountBalance(a, rel(-30)); return '<span class="' + (d >= 0 ? 'up' : 'down') + '">' + (d >= 0 ? '+' : '') + money(d) + '</span>'; } },
    { h: 'Balance', r: 1, v: a => '<b>' + money(accountBalance(a)) + '</b>' },
  ], accts, { rowAct: 'acct-tx' }), { flush: true, sub: 'Click an account to see its transactions' });
  return h;
}
ACT['acct-tx'] = el => { App.ui.txAcct = el.dataset.id; App.ui.finTab = 'transactions'; App.ui.txpg = 0; render(); };

/* ---------- statements ---------- */
function finStatements(ids) {
  const which = App.ui.stmt || 'pl'; const per = App.ui.finPeriod || 'ytd';
  let h = finFilterBar(segEl([['pl', 'Profit & Loss'], ['bs', 'Balance Sheet'], ['cf', 'Cash Flow']], which, 'stmt') + selectEl('fin-period', periodOptions(), per, 'data-act-change="fin-period" aria-label="Period"') + '<span class="spacer"></span><button class="btn sm" data-act="copy-stmt">' + icon('copy') + 'Copy as CSV</button>');
  const [f, t] = periodRange(per);
  const cols = ids.length > 1 ? ids : [];
  if (which === 'pl') h += plStatement(ids, cols, f, t);
  else if (which === 'bs') h += bsStatement(ids, cols, t);
  else h += cfStatement(ids, cols, f, t);
  return h;
}
ACT.stmt = el => { App.ui.stmt = el.dataset.v; render(); };
ACT['copy-stmt'] = () => {
  const tbl = document.querySelector('#stmt-table table'); if (!tbl) return;
  const csv = [...tbl.querySelectorAll('tr')].map(tr => [...tr.children].map(td => '"' + td.innerText.replace(/"/g, '""').trim() + '"').join(',')).join('\n');
  navigator.clipboard.writeText(csv).then(() => toast('Copied as CSV — paste into a spreadsheet'), () => toast('Copy failed — select the table manually', true));
};
function stmtTable(title, sub, head, lines) {
  // lines: [label, values[], cls]
  return card(title, '<div class="table-wrap" id="stmt-table"><table class="t"><thead><tr><th>Line</th>' + head.map(x => '<th class="r">' + x + '</th>').join('') + '</tr></thead><tbody>' + lines.map(([l, vals, cls]) => cls === 'sec' ? '<tr><td colspan="' + (head.length + 1) + '" class="strong" style="background:var(--surface-2)">' + esc(l) + '</td></tr>' : '<tr class="' + (cls || '') + '"><td class="' + (cls === 'tot' ? 'strong' : '') + '">' + esc(l) + '</td>' + vals.map(v => '<td class="r num ' + (cls === 'tot' ? 'strong' : '') + '">' + (typeof v === 'string' ? v : money(v, { paren: true })) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>', { flush: true, sub });
}
function plStatement(ids, cols, f, t) {
  const sets = cols.map(id => pnl([id], f, t)); const tot = pnl(ids, f, t); const [pf, pt] = priorYear([f, t]); const ly = pnl(ids, pf, pt);
  const head = cols.map(id => esc(company(id).short)).concat(['Consolidated', 'Prior year', 'Change']);
  const row = (fn) => sets.map(fn).concat([fn(tot), fn(ly)]);
  const chg = (a, b) => b ? ((a - b) / Math.abs(b) * 100 >= 0 ? '+' : '') + ((a - b) / Math.abs(b) * 100).toFixed(1) + '%' : '—';
  const revCats = uniq(Object.keys(tot.rev).concat(Object.keys(ly.rev))); const expCats = uniq(Object.keys(tot.exp).concat(Object.keys(ly.exp))).filter(c => coaLine(c) !== 'Cost of sales');
  const lines = [['Revenue', [], 'sec']];
  revCats.forEach(c => lines.push([c, row(p => p.rev[c] || 0).concat([chg(tot.rev[c] || 0, ly.rev[c] || 0)]), 'indent']));
  lines.push(['Total revenue', row(p => p.revenue).concat([chg(tot.revenue, ly.revenue)]), 'tot']);
  lines.push(['Cost of sales', row(p => -p.cogs).concat([chg(tot.cogs, ly.cogs)])]);
  lines.push(['Gross profit', row(p => p.gross).concat([chg(tot.gross, ly.gross)]), 'tot']);
  lines.push(['Gross margin', row(p => p.revenue ? fmtPct(p.gross / p.revenue * 100, 1) : '—').concat(['']), 'sub-row']);
  lines.push(['Operating expenses', [], 'sec']);
  expCats.forEach(c => lines.push([c, row(p => -(p.exp[c] || 0)).concat([chg(tot.exp[c] || 0, ly.exp[c] || 0)]), 'indent']));
  lines.push(['Total operating expenses', row(p => -p.opex).concat([chg(tot.opex, ly.opex)]), 'tot']);
  lines.push(['Net profit', row(p => p.net).concat([chg(tot.net, ly.net)]), 'tot']);
  lines.push(['Net margin', row(p => p.revenue ? fmtPct(p.net / p.revenue * 100, 1) : '—').concat(['']), 'sub-row']);
  return stmtTable('Profit & Loss', fmtDate(f) + ' – ' + fmtDate(t) + ' · consolidated figures do not yet eliminate intercompany items ' + cfg('Phase 2'), head, lines);
}
function bsStatement(ids, cols, asOf) {
  const sets = cols.map(id => balanceSheet([id], asOf)).concat([balanceSheet(ids, asOf)]);
  const head = cols.map(id => esc(company(id).short)).concat(['Consolidated']);
  const r = fn => sets.map(fn);
  return stmtTable('Balance Sheet', 'As of ' + fmtDate(asOf) + ' · simplified: fixed assets, loans and capital are opening balances + ledger movements; retained earnings is the balancing figure', head, [
    ['Assets', [], 'sec'], ['Cash & bank', r(b => b.cash), 'indent'], ['Accounts receivable', r(b => b.ar), 'indent'], ['Property, plant & equipment', r(b => b.fixed), 'indent'], ['Total assets', r(b => b.assets), 'tot'],
    ['Liabilities', [], 'sec'], ['Accounts payable', r(b => b.ap), 'indent'], ['Loans & borrowings', r(b => b.loans), 'indent'], ['Total liabilities', r(b => b.liab), 'tot'],
    ['Equity', [], 'sec'], ['Share capital', r(b => b.capital), 'indent'], ['Retained earnings', r(b => b.retained), 'indent'], ['Total equity', r(b => b.equity), 'tot'],
    ['Liabilities + equity', r(b => b.liab + b.equity), 'tot'],
  ]);
}
function cfStatement(ids, cols, f, t) {
  const sets = cols.map(id => cashFlow([id], f, t)).concat([cashFlow(ids, f, t)]);
  const head = cols.map(id => esc(company(id).short)).concat(['Consolidated']);
  const r = fn => sets.map(fn);
  return stmtTable('Cash Flow', fmtDate(f) + ' – ' + fmtDate(t) + ' · direct method from the bank ledger', head, [
    ['Operating activities', [], 'sec'], ['Cash received from customers', r(c => c.sec.operating.in), 'indent'], ['Cash paid to suppliers & staff', r(c => -c.sec.operating.out), 'indent'], ['Net cash from operations', r(c => c.sec.operating.in - c.sec.operating.out), 'tot'],
    ['Investing activities', [], 'sec'], ['Capital expenditure', r(c => -c.sec.investing.out), 'indent'], ['Net cash from investing', r(c => c.sec.investing.in - c.sec.investing.out), 'tot'],
    ['Financing activities', [], 'sec'], ['Loan repayments', r(c => -c.sec.financing.out), 'indent'], ['Net cash from financing', r(c => c.sec.financing.in - c.sec.financing.out), 'tot'],
    ['Net change in cash', r(c => c.net), 'tot'], ['Opening cash', r(c => c.opening)], ['Closing cash', r(c => c.closing), 'tot'],
  ]);
}

/* ---------- monthly & yearly reports ---------- */
function finReports(ids) {
  const mode = App.ui.repMode || 'month';
  const mSel = App.ui.repMonth || ymd(new Date(CUR_YEAR, CUR_MONTH - 1, 1)).slice(0, 7);
  const ySel = Number(App.ui.repYear || CUR_YEAR);
  const monthOpts = lastNMonths(18).reverse().map(({ y, m }) => [y + '-' + z2(m + 1), MONTHS_L[m] + ' ' + y + (y === CUR_YEAR && m === CUR_MONTH ? ' (to date)' : '')]);
  let h = finFilterBar(segEl([['month', 'Monthly report'], ['year', 'Yearly report']], mode, 'rep-mode') + (mode === 'month' ? selectEl('rep-month', monthOpts, mSel, 'data-act-change="rep" data-k="repMonth" aria-label="Month"') : selectEl('rep-year', [[CUR_YEAR, CUR_YEAR + ' (to date)'], [CUR_YEAR - 1, String(CUR_YEAR - 1)]], ySel, 'data-act-change="rep" data-k="repYear" aria-label="Year"')) + '<span class="spacer"></span><button class="btn sm" data-act="copy-stmt">' + icon('copy') + 'Copy as CSV</button>');
  if (mode === 'month') {
    const [y, m] = mSel.split('-').map(Number); const [f, t0] = monthRange(y, m - 1); const t = t0 > TODAY_S ? TODAY_S : t0;
    const prev = new Date(y, m - 2, 1); const [pf, pt] = monthRange(prev.getFullYear(), prev.getMonth());
    const cur = pnl(ids, f, t), pm = pnl(ids, pf, pt), ly = pnl(ids, ...priorYear([f, t]));
    h += '<div class="grid g4" style="margin-bottom:16px">' + kpiTile('Revenue', money(cur.revenue, { compact: true }), deltaTxt(cur.revenue, pm.revenue, false, 'vs prior month'), { hero: true }) + kpiTile('Expenses', money(cur.expenses, { compact: true }), deltaTxt(cur.expenses, pm.expenses, true, 'vs prior month')) + kpiTile('Net profit', money(cur.net, { compact: true }), deltaTxt(cur.net, ly.net, false, 'vs ' + MONTHS[m - 1] + ' ' + (y - 1))) + kpiTile('Closing cash', money(cashPosition(ids, t), { compact: true }), deltaTxt(cashPosition(ids, t), cashPosition(ids, pt), false, 'vs prior month end')) + '</div>';
    const lines = [['By company', [], 'sec']].concat(ids.map(id => { const a = pnl([id], f, t), b = pnl([id], pf, pt); return [company(id).name, [a.revenue, a.expenses, a.net, b.net, a.revenue ? fmtPct(a.net / a.revenue * 100, 1) : '—'], 'indent']; })).concat([['Total', [cur.revenue, cur.expenses, cur.net, pm.net, cur.revenue ? fmtPct(cur.net / cur.revenue * 100, 1) : '—'], 'tot']]);
    h += stmtTable('Management report — ' + MONTHS_L[m - 1] + ' ' + y, 'Posted transactions only', ['Revenue', 'Expenses', 'Net profit', 'Prior month net', 'Margin'], lines);
  } else {
    const ms = ytdMonths(ySel); const ser = monthlySeries(ids, ms);
    h += card('Monthly trend — ' + ySel, barChart({ labels: ser.map(s => s.label), series: [{ name: 'Revenue', color: 'var(--s1)', values: ser.map(s => s.revenue) }, { name: 'Expenses', color: 'var(--s2)', values: ser.map(s => s.expenses) }], tipExtra: i => [['var(--muted)', 'Net', money(ser[i].net)]] }), { sub: 'Posted transactions' }) + '<div style="height:16px"></div>';
    const tot = pnl(ids, ySel + '-01-01', ySel + '-12-31');
    h += stmtTable('Yearly report — ' + ySel, 'Month by month', ser.map(s => s.label).concat(['Total']), [
      ['Revenue', ser.map(s => s.revenue).concat([tot.revenue])], ['Expenses', ser.map(s => -s.expenses).concat([-tot.expenses])], ['Net profit', ser.map(s => s.net).concat([tot.net]), 'tot'], ['Net margin', ser.map(s => s.revenue ? fmtPct(s.net / s.revenue * 100, 1) : '—').concat([tot.revenue ? fmtPct(tot.net / tot.revenue * 100, 1) : '—']), 'sub-row']]);
  }
  return h;
}
ACT['rep-mode'] = el => { App.ui.repMode = el.dataset.v; render(); };
CHANGE.rep = el => { App.ui[el.dataset.k] = el.value; render(); };
