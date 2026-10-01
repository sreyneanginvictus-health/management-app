/* =====================================================================
   Financial Overview (CEO & investors) + Financial System (Financial position)
   ===================================================================== */

/* ---------- Financial Overview: short report, a note thread on every point ---------- */
const OV_ICON = { revenue: 'dollar', gross: 'coins', costs: 'list', profit: 'target', cash: 'shield', runway: 'clock' };
const OV_PERIODS = [['last_month', 'Last month'], ['month', 'This month'], ['quarter', 'This quarter'], ['ytd', 'Year to date']];
function ovSentence(key, x, per) {
  const ch = x.change == null ? '' : (x.change >= 0 ? 'up ' : 'down ') + Math.abs(x.change).toFixed(1) + '% on ' + per.prevLabel;
  if (key === 'revenue') return 'Sales were ' + money(x.value, { compact: true }) + (ch ? ', ' + ch : '') + '.';
  if (key === 'gross') return 'After direct costs (kits, lab fees, supplements) we kept ' + money(x.value, { compact: true }) + ' — ' + x.sub + '.';
  if (key === 'costs') return 'Running costs (people, marketing, rent, software…) were ' + money(x.value, { compact: true }) + (ch ? ', ' + ch : '') + '.';
  if (key === 'profit') return (x.value >= 0 ? 'Profit of ' : 'Loss of ') + money(Math.abs(x.value), { compact: true }) + ' after depreciation, interest and estimated tax.';
  if (key === 'cash') return 'Cash in the bank today' + (ch ? ', ' + ch.replace(' on ', ' since end of ') : '') + '.';
  return x.value === Infinity ? 'No recent costs, so no runway limit.' : 'At current spending, cash lasts about ' + fmtRunway(x.value) + '.';
}
function ovValue(key, x) { return key === 'runway' ? (x.value === Infinity ? '∞' : (x.value < 10 ? x.value.toFixed(1) : Math.round(x.value)) + ' mo') : money(x.value, { compact: true }); }
function ovDelta(x, per) {
  if (x.runway || x.change == null) return x.sub ? '<span class="muted">' + esc(x.sub) + '</span>' : '';
  const good = x.good === 'down' ? x.change <= 0 : x.change >= 0;
  return '<span class="' + (good ? 'up' : 'down') + '">' + (x.change >= 0 ? '▲ ' : '▼ ') + Math.abs(x.change).toFixed(1) + '%</span> <span class="muted">vs ' + esc(per.prevLabel) + '</span>' + (x.sub ? ' · <span class="muted">' + esc(x.sub) + '</span>' : '');
}
function noteHtml(n) {
  const u = me(); const mineToAnswer = n.audience.includes(u.role) && n.status === 'open';
  return '<div class="ov-note ' + n.kind + (n.status === 'resolved' ? ' done' : '') + '" id="note-' + n.id + '">' +
    '<div class="row" style="gap:6px;flex-wrap:wrap">' + badge(NOTE_KINDS[n.kind], n.kind === 'feedback' ? 'b-warn' : 'b-info') + '<span class="muted small">for ' + n.audience.map(r => esc(roleLabel(r))).join(' & ') + ' · ' + esc(n.periodLabel) + '</span>' + (n.status === 'resolved' ? badge('Done', 'b-good') : '') + '</div>' +
    '<div><b>' + esc(user(n.authorId).name) + ':</b> ' + esc(n.text) + '</div>' +
    n.replies.map(r => '<div class="ov-reply"><b>' + esc(user(r.userId).name) + ':</b> ' + esc(r.text) + ' <span class="muted small">' + ago(r.at) + '</span></div>').join('') +
    (n.status === 'open' && canSeeNote(n) ? '<div class="row" style="gap:6px"><button class="btn sm" data-act="ov-reply" data-id="' + n.id + '">' + icon('send') + 'Reply</button>' + (mineToAnswer || n.authorId === u.id ? '<button class="btn sm ghost" data-act="ov-done" data-id="' + n.id + '">' + icon('ok') + 'Mark done</button>' : '') + '</div>' : '') + '</div>';
}
VIEWS.overview = function () {
  const per = overviewPeriod(App.ui.ovPer || 'last_month');
  const ids = scopeCompanyIds();
  const F = overviewFigures(ids, per);
  const notes = (state.reportNotes || []).filter(n => canSeeNote(n));
  const forMe = notes.filter(n => n.status === 'open' && n.audience.includes(me().role));
  let h = pageHead('Financial Overview', 'Short summary for the CEO and investors · ' + esc(per.label) + ' · ' + esc(state.settings.currency) + ', IFRS / SFRS(I)', segEl(OV_PERIODS, per.key, 'ov-per'));
  if (forMe.length) h += noticeEl('<b>' + forMe.length + ' note' + (forMe.length > 1 ? 's' : '') + ' waiting for you.</b> ' + forMe.map(n => '<a href="#" data-act="ov-jump" data-id="' + n.id + '">' + esc((OVERVIEW_POINTS.find(p => p[0] === n.point) || [, ''])[1]) + ' — ' + esc(NOTE_KINDS[n.kind]) + '</a>').join(' · '), 'warn', 'flag') + '<div style="height:14px"></div>';
  h += '<div class="ov-grid">' + OVERVIEW_POINTS.map(([key, label], i) => {
    const x = F[key]; const pn = notes.filter(n => n.point === key);
    const open = pn.filter(n => n.status === 'open'); const done = pn.length - open.length;
    return '<section class="card ov-point' + (i === 0 ? ' hero' : '') + '">' +
      '<div class="row" style="gap:10px"><span class="ov-ic">' + icon(OV_ICON[key]) + '</span><span class="strong">' + label + '</span><span class="spacer"></span>' + (open.length ? badge(open.length + ' open', 'b-warn') : '') + '</div>' +
      '<div class="ov-val">' + ovValue(key, x) + '</div><div class="delta small">' + ovDelta(x, per) + '</div>' +
      '<p class="ov-say">' + esc(ovSentence(key, x, per)) + '</p>' +
      open.map(noteHtml).join('') + (done ? '<button class="btn sm ghost" data-act="ov-show-done" data-v="' + key + '">' + done + ' done note' + (done > 1 ? 's' : '') + '</button>' : '') +
      (App.ui.ovDone === key ? pn.filter(n => n.status !== 'open').map(noteHtml).join('') : '') +
      (can('overview.note') ? '<div><button class="btn sm' + (i === 0 ? '' : ' ghost') + '" data-act="ov-note" data-v="' + key + '">' + icon('plus') + 'Add note for CEO / investor</button></div>' : '') +
      '</section>';
  }).join('') + '</div>';
  const ms = monthlySeries(ids, lastNMonths(12));
  h += '<div style="height:16px"></div>' + card('Revenue and costs, last 12 months', barChart({ labels: ms.map(m => m.label), series: [{ name: 'Revenue', color: 'var(--s1)', values: ms.map(m => m.revenue) }, { name: 'Costs', color: 'var(--s2)', values: ms.map(m => m.expenses) }], tipTitle: i => MONTHS_L[ms[i].m] + ' ' + ms[i].y }), { sub: 'Cash basis, posted entries' });
  return h;
};
Object.assign(ACT, {
  'ov-per': el => { App.ui.ovPer = el.dataset.v; render(); },
  'ov-show-done': el => { App.ui.ovDone = App.ui.ovDone === el.dataset.v ? null : el.dataset.v; render(); },
  'ov-jump': el => { const n = document.getElementById('note-' + el.dataset.id); if (n) n.scrollIntoView({ behavior: 'smooth', block: 'center' }); },
  'ov-note': el => {
    const key = el.dataset.v; const per = overviewPeriod(App.ui.ovPer || 'last_month');
    const label = OVERVIEW_POINTS.find(p => p[0] === key)[1];
    openModal(modalShell('Note on ' + esc(label), '<form id="ov-form" class="stack" style="gap:12px" onsubmit="event.preventDefault();ACT[\'ov-note-save\']()"><input type="hidden" name="point" value="' + key + '">' +
      field('What do you need?', '<div class="row" style="gap:16px"><label class="check"><input type="radio" name="kind" value="check" checked> Please check</label><label class="check"><input type="radio" name="kind" value="feedback"> Need feedback</label></div>') +
      field('For', '<div class="row" style="gap:16px"><label class="check"><input type="checkbox" name="ceo" checked> CEO</label><label class="check"><input type="checkbox" name="investor" checked> Investor</label></div>') +
      field('Note', '<textarea class="input" name="text" rows="4" placeholder="What should they look at, or what decision do you need?" required></textarea>', { hint: 'Period: ' + esc(per.label) + '. They get a notification and can reply here.' }) + '</form>',
      '<button class="btn" data-act="close-modal">Cancel</button><span class="spacer"></span><button class="btn primary" data-act="ov-note-save">' + icon('send') + 'Send note</button>'));
  },
  'ov-note-save': () => {
    const form = document.getElementById('ov-form'); if (!form) return;
    const v = formVals(form); const kind = form.querySelector('input[name=kind]:checked').value;
    const audience = ['ceo', 'investor'].filter(r => v[r]);
    if (!audience.length) { toast('Choose CEO, investor or both.', true); return; }
    if (!String(v.text || '').trim()) { toast('Write the note first.', true); return; }
    const per = overviewPeriod(App.ui.ovPer || 'last_month');
    addReportNote({ point: v.point, period: per.key, periodLabel: per.label, kind, audience, text: v.text.trim() });
    closeModal(); render(); toast('Note sent to ' + audience.map(roleLabel).join(' & '));
  },
  'ov-reply': el => {
    openModal(modalShell('Reply', '<form id="ov-reply-form" onsubmit="event.preventDefault();ACT[\'ov-reply-save\']()"><input type="hidden" name="id" value="' + el.dataset.id + '">' + field('Your reply', '<textarea class="input" name="text" rows="4" required></textarea>') + '</form>',
      '<button class="btn" data-act="close-modal">Cancel</button><span class="spacer"></span><button class="btn primary" data-act="ov-reply-save">' + icon('send') + 'Send reply</button>'));
  },
  'ov-reply-save': () => {
    const v = formVals(document.getElementById('ov-reply-form')); const n = (state.reportNotes || []).find(x => x.id === v.id);
    if (!n || !String(v.text || '').trim()) { toast('Write a reply first.', true); return; }
    replyReportNote(n, v.text.trim()); closeModal(); render(); toast('Reply sent');
  },
  'ov-done': el => { const n = (state.reportNotes || []).find(x => x.id === el.dataset.id); if (n) { resolveReportNote(n); render(); toast('Marked as done'); } },
});

/* ---------- Financial System (Financial position only) ---------- */
VIEWS.hub = function () {
  const tabs = [['statements', 'IFRS statements'], ['coa', 'Chart of accounts'], ['tax', 'Tax & GST'], ['assumptions', 'Assumptions']];
  const tab = tabs.some(t => t[0] === App.ui.hubTab) ? App.ui.hubTab : 'statements';
  const fs = finSet();
  let h = pageHead('Financial System', esc(fs.framework || 'IFRS') + ' · ' + esc(state.settings.currency) + ' · year end ' + MONTHS_L[(Number(fs.yearEndMonth) || 12) - 1] + ' · management statements from the ledger');
  h += tabsEl(tabs, tab, 'hub-tab');
  return h + ({ statements: hubStatements, coa: hubCoa, tax: hubTax, assumptions: hubAssumptions }[tab])();
};
ACT['hub-tab'] = el => { App.ui.hubTab = el.dataset.v; render(); };
function hubYears() { const y = Number(App.ui.hubYear) || CUR_YEAR; return [y, y - 1]; }
function hubPeriod(y) { return [y + '-01-01', y === CUR_YEAR ? TODAY_S : y + '-12-31']; }
function hubStatements() {
  const ids = scopeCompanyIds(); const [y, py] = hubYears();
  const head = [y === CUR_YEAR ? 'FY' + y + ' to date' : 'FY' + y, 'FY' + py];
  const P = [y, py].map(x => ifrsPL(ids, ...hubPeriod(x)));
  const r = fn => P.map(fn);
  const pl = [['Revenue', r(p => p.revenue)], ['Cost of sales', r(p => p.cos)], ['Gross profit', r(p => p.gross), 'tot'], ['Gross margin', r(p => fmtPct(p.grossPct, 1)), 'sub-row'],
    ['Other income', r(p => p.other)]].concat(P[0].opex.map((o, i) => [o[0], r(p => p.opex[i][1]), 'indent']))
    .concat([['Total operating expenses', r(p => p.opexTotal), 'tot'], ['EBITDA', r(p => p.ebitda), 'tot'], ['Depreciation & amortisation', r(p => p.da)], ['Operating profit (EBIT)', r(p => p.ebit), 'tot'],
      ['Finance income', r(p => p.finInc)], ['Finance costs', r(p => p.finCost)], ['Profit / (loss) before tax', r(p => p.pbt), 'tot'], ['Income tax expense (estimate)', r(p => p.tax)], ['Profit / (loss) for the period', r(p => p.profit), 'tot'], ['Net margin', r(p => fmtPct(p.netPct, 1)), 'sub-row']]);
  const S = [y, py].map(x => ifrsSFP(ids, hubPeriod(x)[1])); const s = fn => S.map(fn);
  const sfp = [['Assets', [], 'sec'], ['Property, plant & equipment (net)', s(b => b.ppe), 'indent'], ['Total non-current assets', s(b => b.nonCurrent), 'tot'], ['Trade & other receivables', s(b => b.recv), 'indent'], ['Cash & cash equivalents', s(b => b.cash), 'indent'], ['Total current assets', s(b => b.current), 'tot'], ['TOTAL ASSETS', s(b => b.assets), 'tot'],
    ['Equity & liabilities', [], 'sec'], ['Share capital', s(b => b.capital), 'indent'], ['Retained earnings / (accumulated losses)', s(b => b.retained), 'indent'], ['Total equity', s(b => b.equity), 'tot'], ['Borrowings', s(b => b.borrowings), 'indent'], ['Trade & other payables', s(b => b.payables), 'indent'], ['Total liabilities', s(b => b.liab), 'tot'], ['TOTAL EQUITY & LIABILITIES', s(b => b.total), 'tot'], ['Check (must be 0)', s(b => Math.round(b.check)), 'sub-row']];
  const C = [y, py].map(x => ifrsCF(ids, ...hubPeriod(x))); const c = fn => C.map(fn);
  const cf = [['Cash flows from operating activities', [], 'sec'], ['Profit / (loss) before tax', c(x => x.pbt), 'indent'], ['Add back: depreciation & amortisation', c(x => x.da), 'indent'], ['Working capital & other movements', c(x => x.workingCapital), 'indent'], ['Net cash from operating activities', c(x => x.operating), 'tot'],
    ['Net cash used in investing activities', c(x => x.investing), 'tot'], ['Net cash from financing activities', c(x => x.financing), 'tot'], ['Net increase / (decrease) in cash', c(x => x.net), 'tot'], ['Cash at beginning of period', c(x => x.opening)], ['Cash at end of period', c(x => x.closing), 'tot']];
  const yrs = uniq(state.transactions.map(t => Number(t.date.slice(0, 4)))).sort((a, b) => b - a).map(x => [x, 'FY' + x]);
  return '<div class="filters">' + selectEl('hub-year', yrs, y, 'data-act-change="hub-year" aria-label="Financial year"') + '<span class="muted small">Expenses by nature. Income tax is an estimate from the Tax &amp; GST tab. Retained earnings is the balancing figure until opening balances are entered.</span></div>' +
    '<div class="stack" style="gap:16px">' + stmtTable('Statement of profit or loss', 'IFRS / SFRS(I), expenses by nature', head, pl) +
    stmtTable('Statement of financial position', 'As at ' + fmtDate(hubPeriod(y)[1]) + ' and ' + fmtDate(hubPeriod(py)[1]), head, sfp) + stmtTable('Statement of cash flows', 'IAS 7, indirect method', head, cf) + '</div>';
}
CHANGE['hub-year'] = el => { App.ui.hubYear = Number(el.value); render(); };
const IFRS_LINES = ['Revenue', 'Cost of sales', 'Other income'].concat(IFRS_PL_OPEX).concat(['Finance income', 'Finance costs', 'Property, plant & equipment', 'Intangible assets', 'Borrowings', 'Share capital']);
function hubCoa() {
  const ids = scopeCompanyIds(); const ytd = txIn(ids, CUR_YEAR + '-01-01', TODAY_S);
  const bal = {}; for (const t of ytd) bal[t.category] = (bal[t.category] || 0) + t.amount;
  const rows = (state.coa || []).slice().sort((a, b) => a.code.localeCompare(b.code)).map(a => Object.assign({ id: a.code, ytd: bal[a.name] || 0 }, a));
  const form = can('fhub.manage') ? card('Add account', '<form id="coa-form" class="form-grid" onsubmit="event.preventDefault();ACT[\'coa-add\']()">' + field('Code', '<input class="input" name="code" inputmode="numeric" maxlength="6" placeholder="e.g. 7330">') + field('Account name', '<input class="input" name="name" maxlength="60">') +
    field('IFRS line', selectF('line', IFRS_LINES, 'Other operating expenses')) + field('Type', selectF('type', [['expense', 'Expense'], ['income', 'Income'], ['sfp', 'Balance sheet (capex, loans, capital)']], 'expense')) + field('GST code', selectF('gst', [['TX', 'TX — standard-rated purchase'], ['SR', 'SR — standard-rated supply'], ['OS', 'OS — out of scope']], 'TX')) +
    '<div class="field full"><button class="btn primary" type="submit">' + icon('plus') + 'Add account</button></div></form>') + '<div style="height:16px"></div>' : '';
  return form + card('', tableEl([{ h: 'Code', v: a => '<span class="mono">' + esc(a.code) + '</span>' }, { h: 'Account', v: a => esc(a.name) }, { h: 'IFRS line', v: a => esc(a.line) }, { h: 'Statement', v: a => a.statement === 'PL' ? 'Profit or loss' : 'Financial position' }, { h: 'GST', v: a => '<span class="tag">' + esc(a.gst) + '</span>' }, { h: 'FY' + CUR_YEAR + ' to date', r: 1, v: a => a.ytd ? money(a.ytd) : '<span class="muted">—</span>' }], rows), { flush: true });
}
ACT['coa-add'] = () => {
  if (!can('fhub.manage')) return;
  const v = formVals(document.getElementById('coa-form')); const code = String(v.code || '').trim(); const name = String(v.name || '').trim();
  if (!/^\d{4,6}$/.test(code)) { toast('Code must be 4–6 digits.', true); return; }
  if (!name) { toast('Enter an account name.', true); return; }
  if (state.coa.some(a => a.code === code || a.name.toLowerCase() === name.toLowerCase())) { toast('That code or name already exists.', true); return; }
  const cf = v.type === 'sfp' ? (['Borrowings', 'Share capital'].includes(v.line) ? 'financing' : 'investing') : 'operating';
  state.coa.push({ code, name, line: v.line, statement: v.type === 'sfp' ? 'SFP' : 'PL', type: v.type, gst: v.gst, cf });
  audit('created', 'account', code, 'Added account ' + code + ' ' + name + ' → ' + v.line); render(); toast('Account ' + code + ' added');
};
function hubTax() {
  const ids = scopeCompanyIds(); const p = ifrsPL(ids, CUR_YEAR + '-01-01', TODAY_S); const t = sgTax(p.pbt, CUR_YEAR + 1); const g = gstStatus(ids);
  const dl = rows => '<dl class="dl">' + rows.map(([k, v]) => '<dt>' + k + '</dt><dd class="num">' + v + '</dd>').join('') + '</dl>';
  const cit = card('Corporate income tax — estimate', dl([['Profit before tax, FY' + CUR_YEAR + ' to date', money(p.pbt)], ['Chargeable income (simplified = PBT)', money(t.chargeable)], ['Scheme', esc(t.scheme) + ' ' + cfg()], ['Exempt amount', money(t.exempt)], ['Taxable after exemption', money(t.taxable)], ['Tax rate', fmtPct(t.rate * 100, 0) + ' ' + cfg()], ['Rebate', money(t.rebate)], ['Estimated tax (YA ' + (CUR_YEAR + 1) + ')', '<b>' + money(t.tax) + '</b>']]) +
    '<p class="muted small" style="margin-bottom:0">Singapore rules as in the Invictus model (SUTE for the first 3 YAs, otherwise partial exemption). Capital allowances and non-deductible items are not yet adjusted — confirm with your tax agent.</p>', { sub: 'Year of Assessment = year after the financial year' });
  const pctOf = g.threshold ? Math.min(100, g.turnover / g.threshold * 100) : 0;
  const gst = card('GST', (g.registered ? dl([['Status', badge('Registered', 'b-good')], ['Rate', fmtPct(g.rate * 100, 0) + ' ' + cfg()], ['Output tax, ' + g.quarter, money(g.output)], ['Input tax, ' + g.quarter, money(g.input)], ['Net GST payable (F5 estimate)', '<b>' + money(g.net) + '</b>']])
    : dl([['Status', badge('Not registered', '') + ' ' + cfg()], ['Taxable supplies, last 12 months', money(g.turnover)], ['Registration threshold', money(g.threshold)]]) + '<div class="progress" style="margin:6px 0 10px"><i style="width:' + pctOf.toFixed(1) + '%"></i></div>' +
      (g.mustRegister ? noticeEl('Taxable turnover is above the threshold — GST registration is compulsory. Turn on "GST registered" in Assumptions after registering.', 'bad', 'alert') : '<p class="muted small" style="margin:0">' + fmtPct(pctOf, 0) + ' of the threshold. Registration becomes compulsory above it (retrospective and prospective tests).</p>')),
    { sub: 'Amounts in the ledger are treated as GST-exclusive' });
  return '<div class="grid g2" style="align-items:start">' + cit + gst + '</div>';
}
const FIN_FIELDS = [
  ['framework', 'Reporting framework', 'text'], ['yearEndMonth', 'Financial year-end month (1–12)', 'num'], ['firstYA', 'First Year of Assessment', 'num'],
  ['citRate', 'Corporate tax rate (e.g. 0.17)', 'num'], ['useSUTE', 'Use start-up tax exemption (1 = yes, 0 = no)', 'num'], ['sute1', 'SUTE % on first S$100k', 'num'], ['sute2', 'SUTE % on next S$100k', 'num'],
  ['pte1', 'Partial exemption % on first S$10k', 'num'], ['pte2', 'Partial exemption % on next S$190k', 'num'], ['rebatePct', 'CIT rebate % (per Budget)', 'num'], ['rebateCap', 'CIT rebate cap (S$, 0 = none)', 'num'],
  ['gstRegistered', 'GST registered (1 = yes, 0 = no)', 'num'], ['gstRate', 'GST rate (e.g. 0.09)', 'num'], ['gstThreshold', 'GST registration threshold (S$)', 'num'], ['usefulLifeYears', 'Useful life of equipment (years)', 'num'],
];
function hubAssumptions() {
  const fs = finSet(); const edit = can('fhub.manage');
  return card('Assumptions', '<div class="stack" style="gap:12px">' + FIN_FIELDS.map(([k, label, type]) => '<div class="row" style="gap:12px;justify-content:space-between;flex-wrap:wrap"><span>' + esc(label) + ' ' + cfg() + '</span>' +
    (edit ? '<input class="input" style="max-width:240px" ' + (type === 'num' ? 'type="number" step="any"' : 'type="text"') + ' value="' + esc(fs[k] == null ? '' : fs[k]) + '" data-act-change="fin-set" data-k="' + k + '" aria-label="' + esc(label) + '">' : '<b class="num">' + esc(fs[k]) + '</b>') + '</div>').join('') + '</div>',
    { sub: 'From the Invictus model (Singapore). Items marked "verify" there should be checked each Budget / Year of Assessment.' + (edit ? '' : ' Only the Financial position can change them.') });
}
CHANGE['fin-set'] = el => {
  if (!can('fhub.manage')) return;
  const k = el.dataset.k; const fs = state.settings.fin = state.settings.fin || {};
  const field = FIN_FIELDS.find(f => f[0] === k); const old = fs[k];
  const v = field[2] === 'num' ? Number(el.value) : el.value.trim();
  if (field[2] === 'num' && (!isFinite(v) || v < 0)) { toast('Enter a number of 0 or more.', true); el.value = old; return; }
  fs[k] = v; audit('edited', 'settings', 'fin', 'Financial System ' + k + ': ' + old + ' → ' + v); toast('Saved'); render();
};
