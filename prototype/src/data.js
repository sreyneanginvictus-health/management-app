/* =====================================================================
   Sample data — one company, "Longevity project" (figures fictional). Generated relative to
   today's date so deadlines and reports always look current.
   ===================================================================== */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function defaultSettings() {
  return {
    currency: 'SGD', currencySymbol: 'S$',
    allowSelfApproval: false, requireDocForPosting: true, taskReviewRequired: true,
    budgetAlertPct: 80, reminderDays: 2, escalationRole: 'financial', fiscalYearStartMonth: 1,
    // Placeholders — see handoff.md §7. Cash alert: runway = cash ÷ average monthly costs over the lookback.
    cashAlertMonths: 2, runwayLookbackMonths: 3,
    // Financial System assumptions (Invictus model, Singapore). Marked 'verify' there — confirm each Budget / YA.
    fin: { framework: 'SFRS(I) — identical to IFRS', yearEndMonth: 12, firstYA: CUR_YEAR + 1, citRate: 0.17, useSUTE: 1, sute1: 0.75, sute2: 0.5, pte1: 0.75, pte2: 0.5, rebatePct: 0, rebateCap: 0,
      gstRegistered: 0, gstRate: 0.09, gstThreshold: 1000000, usefulLifeYears: 5 },
    projectHealth: {
      offBudgetPct: 100, offOverdueTasks: 3, offPastDue: 1,               // off track if any is true
      riskBudgetPct: 85, riskOverdueTasks: 1, riskDaysToDue: 21, riskMinProgress: 70, // at risk if any is true
    },
    approvalRules: [
      { id: 'r_exp_hi', type: 'expense', name: 'Expenses above threshold', cond: { op: '>', value: 1000 }, steps: ['manager', 'finance', 'ceo'], enabled: true, sample: true },
      { id: 'r_exp', type: 'expense', name: 'Standard expenses', cond: null, steps: ['manager', 'finance'], enabled: true },
      { id: 'r_pur_hi', type: 'purchase', name: 'Large purchases', cond: { op: '>', value: 5000 }, steps: ['manager', 'finance', 'ceo'], enabled: true },
      { id: 'r_pur', type: 'purchase', name: 'Standard purchases', cond: null, steps: ['manager', 'finance'], enabled: true },
      { id: 'r_pay_hi', type: 'payment', name: 'Large payments', cond: { op: '>', value: 10000 }, steps: ['finance', 'ceo'], enabled: true },
      { id: 'r_pay', type: 'payment', name: 'Standard payments', cond: null, steps: ['finance'], enabled: true },
      { id: 'r_bud', type: 'budget', name: 'Budget changes', cond: null, steps: ['finance', 'ceo'], enabled: true },
      { id: 'r_hire', type: 'hiring', name: 'New headcount', cond: null, steps: ['manager', 'ceo'], enabled: true },
      { id: 'r_proj_hi', type: 'project', name: 'Major projects', cond: { op: '>', value: 50000 }, steps: ['finance', 'ceo'], enabled: true },
      { id: 'r_proj', type: 'project', name: 'New projects', cond: null, steps: ['ceo'], enabled: true },
      { id: 'r_ven', type: 'vendor', name: 'Vendor onboarding', cond: null, steps: ['manager', 'finance'], enabled: true },
      { id: 'r_con_hi', type: 'contract', name: 'Major contracts', cond: { op: '>', value: 25000 }, steps: ['finance', 'ceo'], enabled: true },
      { id: 'r_con', type: 'contract', name: 'Standard contracts', cond: null, steps: ['manager', 'ceo'], enabled: true },
      { id: 'r_oth', type: 'other', name: 'Other requests', cond: null, steps: ['manager'], enabled: true },
    ],
  };
}

function seedState() {
  const rnd = mulberry32(20260928);
  const R = (a, b) => a + rnd() * (b - a);
  const RI = (a, b) => Math.round(R(a, b));
  const pick = a => a[Math.floor(rnd() * a.length)];
  const round = (v, s) => Math.round(v / (s || 1)) * (s || 1);
  const s = {
    version: VERSION, seededOn: TODAY_S, counters: { task: 1000, approval: 300, tx: 0, risk: 0 },
    session: { userId: null, companyFilter: 'all' }, settings: defaultSettings(), roles: defaultRoles(),
    companies: [], departments: [], users: [], projects: [], tasks: [], approvals: [], transactions: [], accounts: [],
    coa: [], reportNotes: [], invoices: [], bills: [], budgets: [], kpis: [], risks: [], documents: [], events: [], notifications: [], audit: [], reminderKeys: {},
  };
  state = s;
  const at = (dayOffset, h, m) => { const d = addDays(TODAY, dayOffset); d.setHours(h == null ? 9 : h, m == null ? RI(0, 59) : m); return d.toISOString(); };
  const as = (userId, iso, fn) => { const prevU = s.session.userId, prevT = _fakeNow; s.session.userId = userId; _fakeNow = iso; try { return fn(); } finally { s.session.userId = prevU; _fakeNow = prevT; } };

  /* ---------- chart of accounts (Invictus Health model, IFRS / SFRS(I) lines) ---------- */
  const AC = (code, name, line, type, gst, extra) => Object.assign({ code, name, line, statement: type === 'sfp' ? 'SFP' : 'PL', type, gst, cf: 'operating' }, extra || {});
  s.coa = [
    AC('4100', 'Revenue - Home testing kits', 'Revenue', 'income', 'SR'), AC('4400', 'Revenue - Supplements', 'Revenue', 'income', 'SR'),
    AC('4500', 'Revenue - Solutions / coaching', 'Revenue', 'income', 'SR'), AC('4600', 'Revenue - Key partners (gyms etc.)', 'Revenue', 'income', 'SR'),
    AC('5100', 'COGS - Home testing kits', 'Cost of sales', 'expense', 'TX'), AC('5200', 'COGS - Lab analysis fees', 'Cost of sales', 'expense', 'TX'),
    AC('5300', 'COGS - Supplements', 'Cost of sales', 'expense', 'TX'), AC('5400', 'COGS - App hosting / cloud (direct)', 'Cost of sales', 'expense', 'TX'),
    AC('5500', 'COGS - Partner operation cost', 'Cost of sales', 'expense', 'TX'),
    AC('6100', 'Other income', 'Other income', 'income', 'OS'), AC('6200', 'Government grants', 'Other income', 'income', 'OS'),
    AC('7100', 'Marketing & branding', 'Marketing expenses', 'expense', 'TX'), AC('7110', 'Events & booths', 'Marketing expenses', 'expense', 'TX'),
    AC('7200', 'Delivery & courier (outbound)', 'Distribution & logistics', 'expense', 'TX'), AC('7210', 'Logistics & warehousing', 'Distribution & logistics', 'expense', 'TX'),
    AC('7300', 'Salaries & wages', 'Employee benefits expense', 'expense', 'OS'), AC('7310', 'CPF & statutory contributions', 'Employee benefits expense', 'expense', 'OS'),
    AC('7320', 'Staff amenities', 'Employee benefits expense', 'expense', 'TX'), AC('7400', 'Professional fees', 'Professional fees', 'expense', 'TX'),
    AC('7500', 'Rental - short-term / low-value leases', 'Occupancy & utilities', 'expense', 'TX'), AC('7510', 'Utilities', 'Occupancy & utilities', 'expense', 'TX'),
    AC('7520', 'Maintenance & cleaning', 'Occupancy & utilities', 'expense', 'TX'), AC('7600', 'Subscriptions & software licences', 'Technology & subscriptions', 'expense', 'TX'),
    AC('7610', 'Internet & telephone', 'Technology & subscriptions', 'expense', 'TX'), AC('7700', 'Travel & entertainment', 'Travel & transport', 'expense', 'TX'),
    AC('7710', 'Transportation', 'Travel & transport', 'expense', 'TX'), AC('7800', 'Research & development', 'Research & development', 'expense', 'TX'),
    AC('7900', 'Other operating expenses', 'Other operating expenses', 'expense', 'TX'),
    AC('8200', 'Interest income', 'Finance income', 'income', 'OS'), AC('8300', 'Interest expense / bank charges', 'Finance costs', 'expense', 'OS'),
    AC('1500', 'Property, plant & equipment', 'Property, plant & equipment', 'sfp', 'TX', { cf: 'investing' }),
    AC('1600', 'Intangible assets - app / software', 'Intangible assets', 'sfp', 'TX', { cf: 'investing' }),
    AC('2500', 'Repayment of borrowings', 'Borrowings', 'sfp', 'OS', { cf: 'financing' }),
    AC('3100', 'Share capital', 'Share capital', 'sfp', 'OS', { cf: 'financing' }),
  ];

  /* ---------- company (one, set by the owner 2026-09-29) ---------- */
  s.companies = [
    { id: 'c_lp', name: 'Longevity project', short: 'Longevity', code: 'LGP', industry: 'Longevity programs', country: 'Singapore', founded: CUR_YEAR, slot: 1, fixedAssets: 180000, loans: 0, capital: 1200000, structure: 'Five teams reporting to the CEO', description: 'Longevity programs and memberships. Sample figures — replace with real data.' },
  ];
  /* ---------- departments ---------- */
  const D = (id, name, headId) => ({ id, companyId: 'c_lp', name, headId, parentId: null });
  s.departments = [
    D('d_exec', 'Executive Office', 'u_kim'), D('d_fin', 'Finance', 'u_sokha'), D('d_tech', 'Technology', 'u_ethan'),
    D('d_mkt', 'Marketing', 'u_nadia'), D('d_ops', 'Operations & Programs', 'u_vannak'),
  ];
  /* ---------- people ---------- */
  const COLORS = ['#0F4D35', '#2E8C5F', '#2559B8', '#B4532A', '#6A3FA0', '#35706F', '#B57E14', '#A23D5C', '#3D6B2F', '#7A5B12', '#1C6B47'];
  let ci = 0;
  const P = (id, name, title, role, departmentId, managerId, scope) => {
    const initials = name.split(' ').map(x => x[0]).slice(0, 2).join('');
    return { id, name, title, role, companyId: 'c_lp', departmentId, managerId, scope: scope || defaultRoles()[role].defaultScope, email: name.toLowerCase().replace(/[^a-z ]/g, '').replace(' ', '.').replace(/ /g, '') + '@negroni.example', initials, color: COLORS[(ci++) % COLORS.length], active: true, joined: ymd(addDays(TODAY, -RI(120, 900))) };
  };
  s.users = [
    P('u_kim', 'Kim Sreyneang', 'Chief Executive Officer', 'ceo', 'd_exec', null),
    P('u_snakeman', 'Snakeman', 'Chief Technology Officer', 'cto', 'd_tech', 'u_kim'),
    P('u_nadia', 'Nadia Rahman', 'Chief Marketing Officer', 'cmo', 'd_mkt', 'u_kim'),
    P('u_vannak', 'Vannak Chea', 'Operations Manager', 'manager', 'd_ops', 'u_kim'),
    P('u_ethan', 'Ethan Park', 'Engineering Manager', 'manager', 'd_tech', 'u_snakeman'),
    P('u_sokha', 'Sokha Lim', 'Head of Finance', 'financial', 'd_fin', 'u_kim'),
    P('u_rachel', 'Rachel Tan', 'Accountant', 'accounting', 'd_fin', 'u_sokha'),
    P('u_piseth', 'Piseth Noun', 'Software Engineer', 'member', 'd_tech', 'u_ethan'),
    P('u_lina', 'Lina Ortiz', 'Product Designer', 'member', 'd_tech', 'u_ethan'),
    P('u_mony', 'Mony Keo', 'Client Care Coordinator', 'member', 'd_ops', 'u_vannak'),
    P('u_jonah', 'Jonah Reed', 'Program Coordinator', 'member', 'd_ops', 'u_vannak'),
    P('u_daniel', 'Daniel Ong', 'Investor (sample)', 'investor', 'd_exec', null),
  ];

  /* ---------- bank & cash accounts ---------- */
  s.accounts = [
    { id: 'a_c_lp_op', companyId: 'c_lp', name: 'Operating account', type: 'bank', institution: 'Primary bank', last4: String(RI(1000, 9999)), opening: 0 },
    { id: 'a_c_lp_pc', companyId: 'c_lp', name: 'Petty cash', type: 'cash', institution: 'Office safe', last4: '', opening: 5000 },
  ];

  /* ---------- ledger (cash basis, last 21 months) — gives Finance and Reports real numbers ---------- */
  const CUSTOMERS = ['Online shop', 'Coaching clients', 'Corporate wellness — Harbour Bank', 'FitLab Gyms (partner)'];
  const PL = { rev: [['Revenue - Home testing kits', 52000, .025, 'd_ops'], ['Revenue - Solutions / coaching', 41000, .02, 'd_ops'], ['Revenue - Supplements', 18000, .03, 'd_mkt'], ['Revenue - Key partners (gyms etc.)', 9000, .035, 'd_mkt']],
    payroll: { d_exec: 22000, d_fin: 9000, d_tech: 24000, d_mkt: 9500, d_ops: 28000 }, cogs: .26, rent: 11000, mkt: .06, sw: 3200, util: 2300 };
  const months = []; for (let i = 20; i >= 0; i--) { const d = new Date(CUR_YEAR, CUR_MONTH - i, 1); months.push({ y: d.getFullYear(), m: d.getMonth() }); }
  const txs = [];
  const cid = 'c_lp';
  const mk = (cid, date, kind, category, amount, dep, party, memo, projectId) => {
    const t = { id: 'tx' + (txs.length + 1), no: 'TX-' + String(txs.length + 1).padStart(5, '0'), date, companyId: cid, departmentId: dep, kind, category, amount: Math.round(amount), accountId: 'a_' + cid + '_op', party, memo, status: 'posted', docs: [{ id: 'f' + (txs.length + 1), name: (kind === 'revenue' ? 'receipt-' : 'invoice-') + (txs.length + 1) + '.pdf', size: RI(40, 900) * 1000 }], createdBy: 'u_rachel', projectId: projectId || null };
    txs.push(t); return t;
  };
  months.forEach(({ y, m }, idx) => {
    const lastDay = (y === CUR_YEAR && m === CUR_MONTH) ? TODAY.getDate() : new Date(y, m + 1, 0).getDate();
    const day = d => ymd(new Date(y, m, Math.min(d, lastDay)));
    const partial = lastDay / new Date(y, m + 1, 0).getDate();
    const seasonal = 1 + (m >= 9 ? .06 : m <= 1 ? -.04 : 0);
    let revTotal = 0;
    for (const [cat, base, g, dep] of PL.rev) {
      const v = base * Math.pow(1 + g, idx) * seasonal * R(.93, 1.07) * partial;
      const a1 = v * R(.45, .6);
      mk(cid, day(RI(3, 12)), 'revenue', cat, a1, dep, pick(CUSTOMERS), cat + ' — ' + MONTHS[m] + ' collections');
      if (lastDay >= 15) mk(cid, day(RI(15, 27)), 'revenue', cat, v - a1, dep, pick(CUSTOMERS), cat + ' — ' + MONTHS[m] + ' collections');
      revTotal += v;
    }
    if (lastDay >= 25 || !(y === CUR_YEAR && m === CUR_MONTH)) for (const [dep, amt] of Object.entries(PL.payroll)) {
      const gross = amt * Math.pow(1.008, idx) * R(.98, 1.03);
      mk(cid, day(25), 'expense', 'Salaries & wages', gross * .87, dep, 'Payroll run', MONTHS[m] + ' salaries — ' + dept(dep).name);
      mk(cid, day(25), 'expense', 'CPF & statutory contributions', gross * .13, dep, 'CPF Board', MONTHS[m] + ' CPF — ' + dept(dep).name);
    }
    mk(cid, day(RI(8, 20)), 'expense', 'COGS - Home testing kits', revTotal * PL.cogs * .5 * R(.94, 1.06), 'd_ops', 'Kit components supplier', 'Kit components — ' + MONTHS[m]);
    mk(cid, day(RI(8, 20)), 'expense', 'COGS - Lab analysis fees', revTotal * PL.cogs * .32 * R(.94, 1.06), 'd_ops', 'Partner laboratory', 'Lab analysis — ' + MONTHS[m]);
    mk(cid, day(RI(8, 20)), 'expense', 'COGS - Supplements', revTotal * PL.cogs * .18 * R(.94, 1.06), 'd_ops', 'Supplements manufacturer', 'Supplements stock — ' + MONTHS[m]);
    mk(cid, day(1), 'expense', 'Rental - short-term / low-value leases', PL.rent, 'd_ops', 'Landlord / facilities', MONTHS[m] + ' rent');
    mk(cid, day(RI(5, 18)), 'expense', 'Marketing & branding', revTotal * PL.mkt * R(.8, 1.25), 'd_mkt', 'Brightline Media', 'Campaigns — ' + MONTHS[m]);
    mk(cid, day(RI(2, 6)), 'expense', 'Subscriptions & software licences', PL.sw * R(.95, 1.1), 'd_tech', 'SaaS subscriptions', 'Monthly software subscriptions');
    if (rnd() > .3 && lastDay > 10) mk(cid, day(RI(6, 24)), 'expense', 'Travel & entertainment', R(600, 2200), 'd_exec', 'Corporate travel desk', 'Business travel');
    if (rnd() > .4 && lastDay > 10) mk(cid, day(RI(10, 26)), 'expense', 'Professional fees', R(1200, 4800), 'd_fin', pick(['Legal counsel', 'Audit & tax advisors', 'IT consultants']), 'Professional services');
    if (lastDay >= 15) mk(cid, day(15), 'expense', 'Utilities', PL.util * R(.9, 1.15), 'd_ops', 'Electricity & water utility', MONTHS[m] + ' utilities');
    mk(cid, day(28), 'expense', 'Interest expense / bank charges', R(40, 90), 'd_fin', 'Primary bank', 'Bank charges');
    if (idx === 14) mk(cid, day(12), 'expense', 'Property, plant & equipment', 42000, 'd_ops', 'Equipment supplier', 'Body-composition scanner and lab equipment');
  });
  txs.sort((a, b) => a.date < b.date ? -1 : 1);
  txs.forEach((t, i) => { t.no = 'TX-' + String(i + 1).padStart(5, '0'); });
  s.transactions = txs; s.counters.tx = txs.length;
  { // opening balance so the operating account ends at a plausible cash level
    const a = s.accounts[0];
    const flows = sum(txs, t => (t.kind === 'revenue' ? 1 : -1) * t.amount);
    let run = 0, minRun = 0; for (const t of txs) { run += (t.kind === 'revenue' ? 1 : -1) * t.amount; minRun = Math.min(minRun, run); }
    a.opening = round(Math.max(820000 - flows, -minRun + 120000), 1000);
  }
  for (let k = 0; k < 3; k++) { const t = mk(cid, rel(-RI(3, 50)), 'expense', 'Transportation', RI(40, 380), 'd_ops', 'Taxi & meals', 'Petty cash spend'); t.accountId = 'a_c_lp_pc'; t.no = 'TX-' + String(++s.counters.tx).padStart(5, '0'); }
  // immutable ledger examples: one reversal, one adjustment, one draft waiting to be posted
  const lastSw = txs.filter(t => t.category === 'Subscriptions & software licences' && t.date < rel(-5)).slice(-1)[0];
  if (lastSw) {
    const dup = mk(cid, lastSw.date, 'expense', 'Subscriptions & software licences', lastSw.amount, lastSw.departmentId, lastSw.party, 'Monthly software subscriptions (duplicate charge)');
    dup.no = 'TX-' + String(++s.counters.tx).padStart(5, '0');
    as('u_rachel', at(-4, 10), () => { reverseTransaction(dup, 'Duplicate vendor charge — refund confirmed by vendor'); });
  }
  const util = txs.filter(t => t.category === 'Utilities').slice(-2)[0];
  if (util) as('u_rachel', at(-9, 15), () => { adjustTransaction(util, 312, 'Final utility bill higher than estimate (meter re-read)'); });
  as('u_rachel', at(-1, 11), () => createTransaction({ date: rel(-1), companyId: cid, departmentId: 'd_ops', kind: 'expense', category: 'COGS - Home testing kits', amount: 4280, accountId: 'a_c_lp_op', party: 'Kit components supplier', memo: 'Blood-panel kits — restock', docs: [{ id: uid('f'), name: 'lab-inv-2291.pdf', size: 212000 }] }));

  /* ---------- open invoices and bills ---------- */
  let invN = 4100, billN = 7700;
  for (let k = 0; k < 5; k++) {
    const issue = -RI(2, 85); const amt = round(R(3000, 24000), 10);
    const r = rnd(); const paid = r < .25 ? amt : r < .4 ? round(amt * R(.3, .6), 10) : 0;
    s.invoices.push({ id: uid('inv'), number: 'INV-' + CUR_YEAR + '-' + (++invN), companyId: cid, departmentId: 'd_ops', category: 'Revenue - Solutions / coaching', customer: pick(CUSTOMERS.slice(2).concat(['Riverside Clinic Group'])), issueDate: rel(issue), dueDate: rel(issue + 30), amount: amt, paid, status: k === 4 ? 'draft' : 'sent', docs: [{ id: uid('f'), name: 'INV-' + CUR_YEAR + '-' + invN + '.pdf', size: 96000 }] });
  }
  for (const [vendor, cat, dep] of [['Partner laboratory', 'COGS - Lab analysis fees', 'd_ops'], ['Brightline Media', 'Marketing & branding', 'd_mkt'], ['Audit & tax advisors', 'Professional fees', 'd_fin']]) {
    const issue = -RI(3, 60); const amt = round(R(1800, 12000), 10);
    s.bills.push({ id: uid('bill'), number: 'BILL-' + (++billN), companyId: cid, departmentId: dep, category: cat, vendor, date: rel(issue), dueDate: rel(issue + 30), amount: amt, paid: rnd() < .2 ? amt : 0, status: 'open', docs: [{ id: uid('f'), name: 'BILL-' + billN + '.pdf', size: 140000 }] });
  }

  /* ---------- budgets (current year, per department & category, from actuals) ---------- */
  const ytdFrom = CUR_YEAR + '-01-01';
  const elapsed = (CUR_MONTH + TODAY.getDate() / 31) / 12;
  const byKey = {};
  for (const t of txs) if (t.kind === 'expense' && t.date >= ytdFrom) { const k = t.departmentId + '|' + t.category; byKey[k] = (byKey[k] || 0) + t.amount; }
  for (const [k, v] of Object.entries(byKey)) {
    const [departmentId, category] = k.split('|');
    const f = category === 'Marketing & branding' ? R(.82, 1.02) : R(.97, 1.14);
    const annual = category === 'Property, plant & equipment' ? v * R(1.1, 1.6) : v / elapsed * f;
    s.budgets.push({ id: uid('bg'), companyId: cid, departmentId, category, year: CUR_YEAR, amount: round(Math.max(annual, v * 1.02), 500) });
  }

  /* ---------- one project ---------- */
  s.projects = [
    { id: 'p_launch', name: 'Longevity program launch', companyId: cid, departmentId: 'd_ops', ownerId: 'u_vannak', members: ['u_mony', 'u_jonah', 'u_nadia'], status: 'active', priority: 'high', startDate: rel(-30), dueDate: rel(45), budget: 60000, spentBase: 18000, description: 'Launch the first 12-week longevity program with a pilot group of 40 members.', createdAt: at(-33) },
  ];

  /* ---------- one task ---------- */
  const T = (title, projectId, chain, status, priority, due, progress, opt) => {
    opt = opt || {};
    chain = chain.filter((x, i) => i === 0 || x !== chain[i - 1]); // one person may now hold several old roles
    const creator = chain[0], assignee = chain[chain.length - 1];
    const a = user(assignee);
    const p = projectId ? s.projects.find(x => x.id === projectId) : null;
    const created = -(RI(8, 25)) + Math.min(0, due);
    const t = {
      id: 't_' + (s.tasks.length + 1), key: 'T-' + (++s.counters.task), title, description: opt.desc || '', companyId: p ? p.companyId : a.companyId, departmentId: p ? p.departmentId : a.departmentId, projectId,
      creatorId: creator, assigneeId: assignee, reviewerId: chain.length > 1 ? chain[chain.length - 2] : (a.managerId || creator), priority, startDate: rel(created + 1), dueDate: rel(due),
      progress: status === 'completed' ? 100 : progress, status, approvalStatus: status === 'completed' ? 'approved' : status === 'submitted' ? 'pending' : status === 'changes' ? 'changes_requested' : 'not_submitted',
      comments: [], attachments: [], chain: [], createdAt: at(created, 9), recurrence: opt.recurrence || null,
    };
    if (t.reviewerId === t.assigneeId) t.reviewerId = a.managerId || creator;
    for (let i = 1; i < chain.length; i++) t.chain.push({ from: chain[i - 1], to: chain[i], at: at(created + i - 1, 10 + i), note: i === 1 ? 'Assigned' : 'Delegated' });
    if (chain.length === 1) t.chain.push({ from: creator, to: assignee, at: t.createdAt, note: 'Assigned' });
    as(creator, t.createdAt, () => audit('created', 'task', t.id, 'Created task “' + title + '” and assigned to ' + user(chain[1] || assignee).name));
    for (let i = 2; i < chain.length; i++) as(chain[i - 1], t.chain[i - 1].at, () => audit('delegated', 'task', t.id, 'Delegated from ' + user(chain[i - 1]).name + ' to ' + user(chain[i]).name));
    if (status !== 'todo') as(assignee, at(created + chain.length, 14), () => audit('status', 'task', t.id, 'Status To do → In progress'));
    if (['submitted', 'completed', 'changes'].includes(status)) { t.submittedAt = at(Math.min(-1, due - 1), 16); as(assignee, t.submittedAt, () => audit('submitted', 'task', t.id, 'Submitted work for review by ' + user(t.reviewerId).name)); }
    if (status === 'completed') { t.completedAt = at(Math.min(0, due) - RI(0, 2), 17); as(t.reviewerId, t.completedAt, () => audit('approved', 'task', t.id, 'Approved work — task completed')); }
    if (status === 'changes') as(t.reviewerId, at(-1, 11), () => audit('rejected', 'task', t.id, 'Requested changes — ' + (opt.changes || 'see comments')));
    if (status === 'blocked') as(assignee, at(-2, 12), () => audit('status', 'task', t.id, 'Status In progress → Blocked — ' + (opt.blocker || '')));
    if (opt.comments) opt.comments.forEach(([uid_, d, text, kind]) => t.comments.push({ id: 'c' + Math.floor(rnd() * 1e9), userId: uid_, at: at(d, RI(9, 18)), text, kind }));
    if (opt.files) opt.files.forEach(n => t.attachments.push({ id: 'f' + Math.floor(rnd() * 1e9), name: n, size: RI(60, 2400) * 1000, by: assignee, at: at(-RI(1, 6)) }));
    s.tasks.push(t); return t;
  };
  T('Prepare the pilot group launch plan', 'p_launch', ['u_kim', 'u_vannak', 'u_mony'], 'in_progress', 'high', 5, 40, { desc: 'Schedule, intake checklist and lab-test calendar for the 40 pilot members.', comments: [['u_vannak', -3, 'Mony — please draft the intake checklist first.'], ['u_mony', -1, 'Checklist drafted. Working on the lab-test calendar.']], files: ['pilot-intake-checklist.docx'] });

  /* ---------- one approval (runs through the real rules engine) ---------- */
  const A = (who, dayOff, data, decisions) => {
    const a = as(who, at(dayOff, 10), () => createApproval(data));
    (decisions || []).forEach(([dec, d, comment]) => {
      const st = a.steps[a.currentStep]; if (!st || a.status !== 'pending') return;
      const actor = st.approverIds[0];
      as(actor, at(d, 15), () => decideApproval(a, dec, comment));
    });
    return a;
  };
  A('u_mony', -2, { type: 'expense', title: 'Blood-panel kits for pilot group', description: '40 kits for baseline lab tests.', amount: 1800, companyId: cid, departmentId: 'd_ops', category: 'COGS - Home testing kits', projectId: 'p_launch', vendor: 'Kit components supplier', attachments: [{ id: 'f_a1', name: 'lab-kits-quote.pdf', size: 84000 }] });

  /* ---------- KPIs ---------- */
  const series = (start, end, noise) => { const out = []; for (let i = 0; i < 9; i++) out.push(start + (end - start) * i / 8 + (rnd() - .5) * noise); return out; };
  const K = (name, unit, target, direction, vals, ownerId, desc) => s.kpis.push({ id: uid('k'), companyId: cid, name, unit, target, direction, values: vals.map(v => Math.round(v * 10) / 10), ownerId, description: desc });
  K('Active members', '#', 400, 'up', series(220, 340, 18), 'u_nadia', 'Paying members at month end.');
  K('Program completion rate', '%', 85, 'up', series(72, 81, 3), 'u_vannak', 'Members who finish the 12-week program.');
  K('Days to monthly close', '#', 7, 'down', series(11, 8, 1), 'u_sokha', 'Business days from month end to closed books.');

  /* ---------- documents and calendar ---------- */
  const DOC = (name, category, ownerId, dayOff, confidential, linked) => s.documents.push({ id: uid('doc'), name, companyId: cid, category, uploadedBy: ownerId, at: at(dayOff), size: RI(80, 4200) * 1000, confidential: !!confidential, linked: linked || null });
  DOC('Delegation of Authority Policy.pdf', 'Policy', 'u_kim', -120);
  DOC('Pilot Program Plan.pdf', 'Project', 'u_vannak', -20, false, { type: 'project', id: 'p_launch' });
  DOC('FY' + CUR_YEAR + ' Budget.xlsx', 'Finance', 'u_sokha', -200, true);
  const EV = (title, day, kind) => s.events.push({ id: uid('ev'), title, date: rel(day), companyId: cid, kind: kind || 'meeting' });
  EV('Pilot group kickoff', 12); EV('Monthly management review', -5);

  /* ---------- a few system notifications ---------- */
  s.reportNotes = [];
  as('u_sokha', at(-1, 17), () => addReportNote({ point: 'gross', period: 'last_month', periodLabel: overviewPeriod('last_month').label, kind: 'feedback', audience: ['ceo', 'investor'],
    text: 'Lab analysis fees rose faster than kit sales. Should we renegotiate with the partner lab or raise the kit price?' }));
  for (const uid_ of ['u_kim', 'u_sokha']) s.notifications.push({ id: uid('nt'), userId: uid_, at: at(-2, 8), read: false, type: 'report', title: MONTHS_L[(CUR_MONTH + 11) % 12] + ' management report is ready', body: 'P&L, cash and KPIs', link: { page: 'reports' } });
  s.notifications.sort((a, b) => a.at < b.at ? 1 : -1);
  s.audit.sort((a, b) => a.at < b.at ? 1 : -1);
  s.session.userId = null;
  return s;
}

/* Empty workspace for real data (Settings → System & data → Clear sample data).
   Keeps the company, departments, people, roles, chart of accounts and settings;
   removes every sample record (work, finance, KPIs, documents, history). */
function blankState() {
  const s = seedState();
  for (const k of ['tasks', 'projects', 'approvals', 'transactions', 'invoices', 'bills', 'budgets', 'kpis', 'risks', 'documents', 'events', 'notifications', 'audit', 'reportNotes']) s[k] = [];
  s.reminderKeys = {}; s.counters = { task: 1000, approval: 300, tx: 0, risk: 0 };
  s.accounts.forEach(a => { a.opening = 0; a.last4 = ''; });
  s.companies.forEach(c => Object.assign(c, { fixedAssets: 0, loans: 0, capital: 0, description: '', founded: c.founded }));
  s.blank = true;
  return s;
}
