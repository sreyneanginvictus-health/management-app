/* =====================================================================
   Sample data — "Northstar Holdings" (fictional). Generated relative to
   today's date so deadlines and reports always look current.
   ===================================================================== */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function defaultSettings() {
  return {
    currency: 'USD', currencySymbol: '$',
    allowSelfApproval: false, requireDocForPosting: true, taskReviewRequired: true,
    budgetAlertPct: 80, reminderDays: 2, escalationRole: 'finance', fiscalYearStartMonth: 1,
    // Placeholders — see handoff.md §7. Cash alert: runway = cash ÷ average monthly costs over the lookback.
    cashAlertMonths: 2, runwayLookbackMonths: 3,
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
    invoices: [], bills: [], budgets: [], kpis: [], risks: [], documents: [], events: [], notifications: [], audit: [], reminderKeys: {},
  };
  state = s;
  const at = (dayOffset, h, m) => { const d = addDays(TODAY, dayOffset); d.setHours(h == null ? 9 : h, m == null ? RI(0, 59) : m); return d.toISOString(); };
  const as = (userId, iso, fn) => { const prevU = s.session.userId, prevT = _fakeNow; s.session.userId = userId; _fakeNow = iso; try { return fn(); } finally { s.session.userId = prevU; _fakeNow = prevT; } };

  /* ---------- companies ---------- */
  s.companies = [
    { id: 'c_hq', name: 'Northstar Holdings', short: 'Holdings HQ', code: 'NSH', industry: 'Holding company', country: 'Singapore', founded: 2016, isHolding: true, slot: 0, fixedAssets: 420000, loans: 0, capital: 3200000, structure: 'Functional (group services)', description: 'Parent company. Group strategy, finance, people and legal services for all subsidiaries.' },
    { id: 'c_health', name: 'Northstar Health', short: 'Health', code: 'NSHL', industry: 'Clinics & longevity programs', country: 'Cambodia', founded: 2019, slot: 1, fixedAssets: 1350000, loans: 600000, capital: 1800000, structure: 'Clinic network with program teams', description: 'Two outpatient clinics in Phnom Penh plus metabolic-health and longevity membership programs.' },
    { id: 'c_digital', name: 'Northstar Digital', short: 'Digital', code: 'NSD', industry: 'Software (SaaS)', country: 'Singapore', founded: 2021, slot: 2, fixedAssets: 140000, loans: 0, capital: 1900000, structure: 'Product squads under one engineering org', description: 'B2B scheduling and billing platform for clinics and service businesses.' },
    { id: 'c_logi', name: 'Northstar Logistics', short: 'Logistics', code: 'NSL', industry: 'Freight & warehousing', country: 'Thailand', founded: 2018, slot: 3, fixedAssets: 2900000, loans: 1400000, capital: 2200000, structure: 'Operations-led, three functions', description: 'Regional trucking fleet (64 vehicles) and two bonded warehouses.' },
    { id: 'c_prop', name: 'Northstar Properties', short: 'Properties', code: 'NSP', industry: 'Commercial real estate', country: 'Cambodia', founded: 2017, slot: 4, fixedAssets: 8600000, loans: 4200000, capital: 4000000, structure: 'Flat — one team', description: 'Owns and leases two office towers (Tower A fully let, Tower B in lease-up).' },
  ];
  /* ---------- departments (structures differ per company) ---------- */
  const D = (id, companyId, name, headId, parentId) => ({ id, companyId, name, headId, parentId: parentId || null });
  s.departments = [
    D('d_hq_exec', 'c_hq', 'Executive Office', 'u_kim'), D('d_hq_fin', 'c_hq', 'Group Finance', 'u_sokha'), D('d_hq_hr', 'c_hq', 'People & HR', 'u_vannak'), D('d_hq_legal', 'c_hq', 'Legal & Compliance', null),
    D('d_h_clin', 'c_health', 'Clinical Operations', 'u_vannak'), D('d_h_care', 'c_health', 'Patient Care', 'u_vannak', 'd_h_clin'), D('d_h_nut', 'c_health', 'Longevity Programs', 'u_vannak'), D('d_h_mkt', 'c_health', 'Marketing', 'u_nadia'),
    D('d_d_eng', 'c_digital', 'Engineering', 'u_ethan'), D('d_d_be', 'c_digital', 'Platform Squad', 'u_ethan', 'd_d_eng'), D('d_d_fe', 'c_digital', 'Experience Squad', 'u_ethan', 'd_d_eng'), D('d_d_prod', 'c_digital', 'Product & Design', 'u_ethan'), D('d_d_sales', 'c_digital', 'Sales', 'u_ethan'), D('d_d_ops', 'c_digital', 'Finance & Ops', 'u_rachel'),
    D('d_l_fleet', 'c_logi', 'Fleet Operations', 'u_vannak'), D('d_l_wh', 'c_logi', 'Warehousing', 'u_vannak'), D('d_l_proc', 'c_logi', 'Procurement', 'u_vannak'),
    D('d_p_team', 'c_prop', 'Leasing & Facilities', 'u_vannak'),
  ];
  /* ---------- people ---------- */
  const COLORS = ['#4a3aa7', '#1c7c63', '#2a64c4', '#b4532a', '#8a3c8f', '#35706f', '#6a5acd', '#a23d5c', '#3d6b2f', '#7a5b12'];
  let ci = 0;
  const P = (id, name, title, role, companyId, departmentId, managerId, scope, extra) => {
    const initials = name.replace(/^Dr\. /, '').split(' ').map(x => x[0]).slice(0, 2).join('');
    return Object.assign({ id, name, title, role, companyId, departmentId, managerId, scope: scope || defaultRoles()[role].defaultScope, email: name.replace(/^Dr\. /, '').toLowerCase().replace(/[^a-z ]/g, '').replace(' ', '.').replace(/ /g, '') + '@northstar.example', initials, color: COLORS[(ci++) % COLORS.length], active: true, joined: ymd(addDays(TODAY, -RI(120, 2200))) }, extra || {});
  };
  s.users = [
    P('u_kim', 'Kim Sreyneang', 'Chief Executive Officer', 'ceo', 'c_hq', 'd_hq_exec', null),
    P('u_snakeman', 'Snakeman', 'Chief Technology Officer', 'cto', 'c_hq', 'd_hq_exec', 'u_kim'),
    P('u_nadia', 'Nadia Rahman', 'Chief Marketing Officer', 'cmo', 'c_hq', 'd_hq_exec', 'u_kim'),
    P('u_vannak', 'Vannak Chea', 'Group Operations Manager', 'manager', 'c_logi', 'd_l_fleet', 'u_kim', 'holding'),
    P('u_ethan', 'Ethan Park', 'Engineering Manager, Digital', 'manager', 'c_digital', 'd_d_eng', 'u_snakeman', 'company'),
    P('u_sokha', 'Sokha Lim', 'Group Finance Director', 'finance', 'c_hq', 'd_hq_fin', 'u_kim'),
    P('u_rachel', 'Rachel Tan', 'Senior Accountant', 'finance', 'c_hq', 'd_hq_fin', 'u_sokha'),
    P('u_piseth', 'Piseth Noun', 'Software Engineer', 'member', 'c_digital', 'd_d_be', 'u_ethan'),
    P('u_lina', 'Lina Ortiz', 'Product Designer', 'member', 'c_digital', 'd_d_prod', 'u_ethan'),
    P('u_mony', 'Mony Keo', 'Patient Care Coordinator', 'member', 'c_health', 'd_h_care', 'u_vannak'),
    P('u_jonah', 'Jonah Reed', 'Fleet Dispatcher', 'member', 'c_logi', 'd_l_fleet', 'u_vannak'),
  ];

  /* ---------- bank & cash accounts ---------- */
  const ACC = [];
  for (const c of s.companies) {
    ACC.push({ id: 'a_' + c.id + '_op', companyId: c.id, name: 'Operating account', type: 'bank', institution: 'Primary bank', last4: String(RI(1000, 9999)), opening: 0 });
    ACC.push({ id: 'a_' + c.id + '_pc', companyId: c.id, name: 'Petty cash', type: 'cash', institution: 'Office safe', last4: '', opening: RI(3, 9) * 1000 });
  }
  s.accounts = ACC;

  /* ---------- ledger generation (cash basis) ---------- */
  const CUSTOMERS = {
    c_health: ['Walk-in patients', 'Membership billing', 'Corporate wellness — Mekong Beverage', 'Corporate wellness — Angkor Garments', 'Insurance claims — Pacific Cross (sample)'],
    c_digital: ['Stripe payouts', 'Kestrel Group', 'Lumen Dental Chain', 'Harbor Physio', 'Bright Smile Clinics'],
    c_logi: ['Siam Retail Co.', 'Chao Phraya Foods', 'Mekong Electronics', 'Andaman Apparel', 'Bangkok Pharma Distribution'],
    c_prop: ['Tower A tenants', 'Tower B tenants', 'Service charge billing'],
  };
  const VENDORS = {
    'Cost of sales': { c_health: 'MedSupply Asia', c_digital: 'CloudHost (AWS reseller)', c_logi: 'Fuel & subcontract carriers', c_prop: 'BuildRight Maintenance' },
    'Rent & facilities': 'Landlord / facilities', 'Marketing': 'Brightline Media', 'Software & IT': 'SaaS subscriptions', 'Travel': 'Corporate travel desk',
    'Professional fees': 'KPMG-style advisors (sample)', 'Utilities': 'Electricity & water utility', 'Equipment (capex)': 'Equipment supplier', 'Loan repayment': 'Bank loan facility', 'Payroll': 'Payroll run',
  };
  const PLAN = {
    c_hq: { rev: [], payroll: { d_hq_exec: 30000, d_hq_fin: 13000, d_hq_hr: 8000, d_hq_legal: 6500 }, cogs: 0, cogsDept: null, rent: [7000, 'd_hq_exec'], mkt: [0, null], sw: [3200, 'd_hq_fin'], travel: [2000, 5000, 'd_hq_exec'], prof: [4000, 9000, 'd_hq_legal'], util: [1100, 'd_hq_exec'], capex: [], loan: 0 },
    c_health: { rev: [['Clinic services', 142000, .016], ['Wellness memberships', 36000, .034]], payroll: { d_h_clin: 61000, d_h_care: 9500, d_h_nut: 16500, d_h_mkt: 9800 }, cogs: .22, cogsDept: 'd_h_clin', rent: [15000, 'd_h_clin'], mkt: [.06, 'd_h_mkt'], sw: [2600, 'd_h_care'], travel: [800, 2400, 'd_h_nut'], prof: [1500, 4200, 'd_h_clin'], util: [3400, 'd_h_clin'], capex: [[4, 62000, 'd_h_clin'], [16, 48000, 'd_h_clin', 'p_siem']], loan: 12000 },
    c_digital: { rev: [['Subscriptions', 74000, .036], ['Implementation services', 26000, .012]], payroll: { d_d_eng: 7000, d_d_be: 26500, d_d_fe: 20500, d_d_prod: 12000, d_d_sales: 10500, d_d_ops: 5200 }, cogs: .11, cogsDept: 'd_d_be', rent: [8200, 'd_d_ops'], mkt: [.05, 'd_d_sales'], sw: [6200, 'd_d_eng'], travel: [1200, 4200, 'd_d_sales'], prof: [2000, 6000, 'd_d_ops'], util: [1100, 'd_d_ops'], capex: [[7, 24000, 'd_d_eng'], [18, 19000, 'd_d_eng', 'p_soc2']], loan: 0 },
    c_logi: { rev: [['Freight services', 212000, .007], ['Warehousing', 56000, .01]], payroll: { d_l_fleet: 58000, d_l_wh: 26000, d_l_proc: 8500 }, cogs: .41, cogsDept: 'd_l_fleet', rent: [21000, 'd_l_wh'], mkt: [.012, 'd_l_proc'], sw: [3800, 'd_l_proc'], travel: [700, 1800, 'd_l_proc'], prof: [1500, 4500, 'd_l_proc'], util: [6800, 'd_l_wh'], capex: [[5, 155000, 'd_l_fleet'], [17, 132000, 'd_l_fleet', 'p_tele']], loan: 28000 },
    c_prop: { rev: [['Rental income', 84000, .006], ['Service charges', 14500, .004]], payroll: { d_p_team: 15500 }, cogs: .13, cogsDept: 'd_p_team', rent: [0, 'd_p_team'], mkt: [.02, 'd_p_team'], sw: [1400, 'd_p_team'], travel: [200, 900, 'd_p_team'], prof: [2500, 6500, 'd_p_team'], util: [8800, 'd_p_team'], capex: [[12, 88000, 'd_p_team', 'p_energy']], loan: 38000 },
  };
  const months = []; for (let i = 20; i >= 0; i--) { const d = new Date(CUR_YEAR, CUR_MONTH - i, 1); months.push({ y: d.getFullYear(), m: d.getMonth() }); }
  const txs = [];
  const mk = (cid, date, kind, category, amount, dep, party, memo, projectId) => {
    const t = { id: 'tx' + (txs.length + 1), no: 'TX-' + String(txs.length + 1).padStart(5, '0'), date, companyId: cid, departmentId: dep, kind, category, amount: Math.round(amount), accountId: 'a_' + cid + '_op', party, memo, status: 'posted', docs: [{ id: 'f' + (txs.length + 1), name: (kind === 'revenue' ? 'receipt-' : 'invoice-') + (txs.length + 1) + '.pdf', size: RI(40, 900) * 1000 }], createdBy: 'u_rachel', projectId: projectId || null };
    txs.push(t); return t;
  };
  months.forEach(({ y, m }, idx) => {
    const lastDay = (y === CUR_YEAR && m === CUR_MONTH) ? TODAY.getDate() : new Date(y, m + 1, 0).getDate();
    const day = d => ymd(new Date(y, m, Math.min(d, lastDay)));
    const partial = lastDay / new Date(y, m + 1, 0).getDate();
    const seasonal = 1 + (m >= 9 ? .06 : m <= 1 ? -.04 : 0);
    const payGrowth = Math.pow(1.008, idx);
    for (const [cid, pl] of Object.entries(PLAN)) {
      let revTotal = 0;
      for (const [cat, base, g] of pl.rev) {
        const v = base * Math.pow(1 + g, idx) * seasonal * R(.93, 1.07) * partial;
        const dep = cid === 'c_health' ? (cat === 'Wellness memberships' ? 'd_h_nut' : 'd_h_clin') : cid === 'c_digital' ? (cat === 'Subscriptions' ? 'd_d_sales' : 'd_d_prod') : cid === 'c_logi' ? (cat === 'Warehousing' ? 'd_l_wh' : 'd_l_fleet') : 'd_p_team';
        // split into 2 receipts
        const a1 = v * R(.45, .6);
        mk(cid, day(RI(3, 12)), 'revenue', cat, a1, dep, pick(CUSTOMERS[cid]), cat + ' — ' + MONTHS[m] + ' collections');
        if (lastDay >= 15) mk(cid, day(RI(15, 27)), 'revenue', cat, v - a1, dep, pick(CUSTOMERS[cid]), cat + ' — ' + MONTHS[m] + ' collections');
        revTotal += v;
      }
      if (lastDay >= 25 || !(y === CUR_YEAR && m === CUR_MONTH)) for (const [dep, amt] of Object.entries(pl.payroll)) mk(cid, day(25), 'expense', 'Payroll', amt * payGrowth * R(.98, 1.03), dep, 'Payroll run', MONTHS[m] + ' payroll — ' + dept(dep).name);
      if (pl.cogs) mk(cid, day(RI(8, 20)), 'expense', 'Cost of sales', revTotal * pl.cogs * R(.94, 1.06), pl.cogsDept, VENDORS['Cost of sales'][cid], 'Direct costs — ' + MONTHS[m]);
      if (pl.rent[0]) mk(cid, day(1), 'expense', 'Rent & facilities', pl.rent[0], pl.rent[1], VENDORS['Rent & facilities'], MONTHS[m] + ' rent');
      if (pl.mkt[0]) mk(cid, day(RI(5, 18)), 'expense', 'Marketing', revTotal * pl.mkt[0] * R(.8, 1.25), pl.mkt[1], VENDORS.Marketing, 'Campaigns — ' + MONTHS[m]);
      mk(cid, day(RI(2, 6)), 'expense', 'Software & IT', pl.sw[0] * R(.95, 1.1), pl.sw[1], VENDORS['Software & IT'], 'Monthly software subscriptions');
      if (rnd() > .25 && lastDay > 10) mk(cid, day(RI(6, 24)), 'expense', 'Travel', R(pl.travel[0], pl.travel[1]), pl.travel[2], VENDORS.Travel, 'Business travel');
      if (rnd() > .35 && lastDay > 10) mk(cid, day(RI(10, 26)), 'expense', 'Professional fees', R(pl.prof[0], pl.prof[1]), pl.prof[2], pick(['Legal counsel', 'Audit & tax advisors', 'Recruitment agency', 'IT consultants']), 'Professional services');
      if (lastDay >= 15) mk(cid, day(15), 'expense', 'Utilities', pl.util[0] * R(.9, 1.15), pl.util[1], VENDORS.Utilities, MONTHS[m] + ' utilities');
      for (const cx of pl.capex) if (cx[0] === idx) mk(cid, day(RI(8, 20)), 'expense', 'Equipment (capex)', cx[1], cx[2], VENDORS['Equipment (capex)'], 'Capital purchase', cx[3]);
      if (pl.loan && lastDay >= 20) mk(cid, day(20), 'expense', 'Loan repayment', pl.loan, pl.rent[1] || Object.keys(pl.payroll)[0], VENDORS['Loan repayment'], 'Scheduled loan repayment');
    }
  });
  // sort by date and renumber
  txs.sort((a, b) => a.date < b.date ? -1 : 1);
  txs.forEach((t, i) => { t.no = 'TX-' + String(i + 1).padStart(5, '0'); });
  s.transactions = txs; s.counters.tx = txs.length;
  // set opening balances so each operating account ends at a plausible cash level
  const TARGET_CASH = { c_hq: 2150000, c_health: 780000, c_digital: 1240000, c_logi: 415000, c_prop: 690000 };
  for (const a of s.accounts.filter(a => a.type === 'bank')) {
    const flows = sum(txs.filter(t => t.accountId === a.id), t => (t.kind === 'revenue' ? 1 : -1) * t.amount);
    let run = 0, minRun = 0; for (const t of txs.filter(t => t.accountId === a.id)) { run += (t.kind === 'revenue' ? 1 : -1) * t.amount; minRun = Math.min(minRun, run); }
    a.opening = Math.max(TARGET_CASH[a.companyId] - flows, -minRun + 120000);
    a.opening = round(a.opening, 1000);
  }
  // a few petty cash spends
  for (const c of s.companies) for (let k = 0; k < 3; k++) { const t = mk(c.id, rel(-RI(3, 50)), 'expense', 'Travel', RI(40, 380), s.departments.find(d => d.companyId === c.id).id, 'Taxi & meals', 'Petty cash spend'); t.accountId = 'a_' + c.id + '_pc'; t.no = 'TX-' + String(++s.counters.tx).padStart(5, '0'); }

  /* ---------- reversal + adjustment examples (immutable ledger) ---------- */
  const lastMonthSw = txs.filter(t => t.companyId === 'c_digital' && t.category === 'Software & IT' && t.date < rel(-5)).slice(-1)[0];
  if (lastMonthSw) {
    const dup = mk('c_digital', lastMonthSw.date, 'expense', 'Software & IT', lastMonthSw.amount, lastMonthSw.departmentId, lastMonthSw.party, 'Monthly software subscriptions (duplicate charge)');
    dup.no = 'TX-' + String(++s.counters.tx).padStart(5, '0');
    as('u_rachel', at(-4, 10), () => { reverseTransaction(dup, 'Duplicate vendor charge — refund confirmed by vendor'); });
  }
  const util = txs.filter(t => t.companyId === 'c_logi' && t.category === 'Utilities').slice(-2)[0];
  if (util) as('u_rachel', at(-9, 15), () => { adjustTransaction(util, 412, 'Final utility bill higher than estimate (meter re-read)'); });
  // drafts awaiting posting
  as('u_rachel', at(-1, 11), () => {
    const d1 = createTransaction({ date: rel(-1), companyId: 'c_health', departmentId: 'd_h_clin', kind: 'expense', category: 'Cost of sales', amount: 6840, accountId: 'a_c_health_op', party: 'MedSupply Asia', memo: 'Lab reagents — emergency restock', docs: [{ id: uid('f'), name: 'medsupply-inv-44821.pdf', size: 212000 }] });
    const d2 = createTransaction({ date: TODAY_S, companyId: 'c_logi', departmentId: 'd_l_wh', kind: 'expense', category: 'Rent & facilities', amount: 3250, accountId: 'a_c_logi_op', party: 'Forklift rental', memo: 'Forklift rental — peak season', docs: [] });
    return [d1, d2];
  });

  /* ---------- AR invoices / AP bills (open items) ---------- */
  const INV_CAT = { c_health: ['Clinic services', 'd_h_clin'], c_digital: ['Implementation services', 'd_d_prod'], c_logi: ['Freight services', 'd_l_fleet'], c_prop: ['Rental income', 'd_p_team'] };
  let invN = 4100, billN = 7700;
  for (const cid of ['c_health', 'c_digital', 'c_logi', 'c_prop']) {
    const n = RI(5, 7);
    for (let k = 0; k < n; k++) {
      const issue = -RI(2, 85); const amt = round(R(4000, cid === 'c_logi' ? 58000 : 32000), 10);
      const r = rnd(); const paid = r < .25 ? amt : r < .4 ? round(amt * R(.3, .6), 10) : 0;
      s.invoices.push({ id: uid('inv'), number: 'INV-' + CUR_YEAR + '-' + (++invN), companyId: cid, departmentId: INV_CAT[cid][1], category: INV_CAT[cid][0], customer: pick(CUSTOMERS[cid].filter(c => !/Walk-in|payouts|billing|tenants/.test(c)).concat(['Tower B tenants'].filter(() => cid === 'c_prop'))), issueDate: rel(issue), dueDate: rel(issue + 30), amount: amt, paid, status: k === n - 1 ? 'draft' : 'sent', docs: [{ id: uid('f'), name: 'INV-' + CUR_YEAR + '-' + invN + '.pdf', size: 96000 }] });
    }
  }
  const BILL_V = [['MedSupply Asia', 'c_health', 'Cost of sales', 'd_h_clin'], ['Brightline Media', 'c_health', 'Marketing', 'd_h_mkt'], ['CloudHost', 'c_digital', 'Cost of sales', 'd_d_be'], ['SecureAudit Partners', 'c_digital', 'Professional fees', 'd_d_ops'], ['Fuel & subcontract carriers', 'c_logi', 'Cost of sales', 'd_l_fleet'], ['FleetTrack Telematics', 'c_logi', 'Equipment (capex)', 'd_l_fleet'], ['Tyre & Parts Co.', 'c_logi', 'Cost of sales', 'd_l_fleet'], ['BuildRight Maintenance', 'c_prop', 'Cost of sales', 'd_p_team'], ['GreenWatt Lighting', 'c_prop', 'Equipment (capex)', 'd_p_team'], ['Legal counsel', 'c_hq', 'Professional fees', 'd_hq_legal'], ['Office landlord', 'c_hq', 'Rent & facilities', 'd_hq_exec'], ['Recruitment agency', 'c_hq', 'Professional fees', 'd_hq_hr']];
  for (const [vendor, cid, cat, dep] of BILL_V) {
    const issue = -RI(3, 60); const amt = round(R(1800, vendor === 'FleetTrack Telematics' ? 18500 : 16000), 10);
    const r = rnd(); const paid = r < .2 ? amt : 0;
    s.bills.push({ id: uid('bill'), number: 'BILL-' + (++billN), companyId: cid, departmentId: dep, category: cat, vendor, date: rel(issue), dueDate: rel(issue + 30), amount: vendor === 'FleetTrack Telematics' ? 18500 : amt, paid: vendor === 'FleetTrack Telematics' ? 0 : paid, status: 'open', docs: [{ id: uid('f'), name: 'BILL-' + billN + '.pdf', size: 140000 }] });
  }

  /* ---------- budgets (current year, per department & category) ---------- */
  const ytdFrom = CUR_YEAR + '-01-01';
  const elapsed = (CUR_MONTH + TODAY.getDate() / 31) / 12;
  const byKey = {};
  for (const t of txs) if (t.kind === 'expense' && t.date >= ytdFrom && !['Loan repayment'].includes(t.category)) { const k = t.companyId + '|' + t.departmentId + '|' + t.category; byKey[k] = (byKey[k] || 0) + t.amount; }
  for (const [k, v] of Object.entries(byKey)) {
    const [companyId, departmentId, category] = k.split('|');
    const f = category === 'Marketing' ? R(.82, 1.02) : category === 'Travel' ? R(.85, 1.15) : R(.97, 1.14);
    const annual = category === 'Equipment (capex)' ? v * R(1.1, 1.6) : v / elapsed * f;
    s.budgets.push({ id: uid('bg'), companyId, departmentId, category, year: CUR_YEAR, amount: round(Math.max(annual, v * 1.02), 500) });
  }

  /* ---------- projects ---------- */
  const PJ = (id, name, companyId, departmentId, ownerId, members, status, priority, start, due, budget, spentBase, description) => ({ id, name, companyId, departmentId, ownerId, members: uniq(members).filter(m => m !== ownerId), status, priority, startDate: rel(start), dueDate: rel(due), budget, spentBase, description, createdAt: at(start - 3) });
  s.projects = [
    PJ('p_v3', 'Platform v3.0 release', 'c_digital', 'd_d_eng', 'u_ethan', ['u_piseth', 'u_piseth', 'u_lina', 'u_ethan'], 'active', 'high', -70, 24, 180000, 118000, 'New scheduling engine, redesigned billing and onboarding. Launch target: end of next month.'),
    PJ('p_soc2', 'SOC 2 Type I readiness', 'c_digital', 'd_d_eng', 'u_snakeman', ['u_ethan', 'u_piseth', 'u_rachel'], 'active', 'critical', -95, 30, 95000, 61000, 'Close gaps from the security assessment ahead of auditor fieldwork. Required by two enterprise prospects.'),
    PJ('p_pipe', 'Q4 enterprise pipeline', 'c_digital', 'd_d_sales', 'u_ethan', ['u_lina', 'u_piseth'], 'active', 'high', -30, 60, 40000, 12500, 'Convert Kestrel Group and two dental chains; target $420k in new ARR.'),
    PJ('p_member', 'Longevity membership launch', 'c_health', 'd_h_mkt', 'u_nadia', ['u_mony', 'u_vannak', 'u_mony'], 'active', 'high', -40, 18, 65000, 41000, 'Launch a tiered longevity membership (screening, coaching, quarterly labs).'),
    PJ('p_booking', 'Clinic booking app rollout', 'c_health', 'd_h_clin', 'u_vannak', ['u_mony'], 'active', 'medium', -25, 35, 22000, 6200, 'Roll out Northstar Digital booking platform to both clinics.'),
    PJ('p_nps', 'Patient NPS program', 'c_health', 'd_h_care', 'u_vannak', ['u_mony'], 'active', 'medium', -60, 5, 8000, 5100, 'Post-visit surveys and a closed-loop follow-up process.'),
    PJ('p_siem', 'Siem Reap clinic fit-out', 'c_health', 'd_h_clin', 'u_kim', ['u_vannak'], 'proposed', 'high', 10, 200, 240000, 0, 'Third clinic. Fit-out, equipment and licensing. Awaiting group approval.'),
    PJ('p_tele', 'Fleet telematics upgrade', 'c_logi', 'd_l_fleet', 'u_vannak', ['u_vannak', 'u_jonah'], 'active', 'high', -50, 40, 210000, 58000, 'GPS + driver behaviour telemetry across 64 trucks, pilot with 20.'),
    PJ('p_wh', 'Bangkok warehouse expansion', 'c_logi', 'd_l_wh', 'u_vannak', ['u_jonah'], 'on_hold', 'medium', -20, 120, 380000, 22000, 'Add 4,000 m² racking. On hold pending Q4 volume forecast.'),
    PJ('p_vendor', 'Supplier consolidation', 'c_logi', 'd_l_proc', 'u_vannak', ['u_jonah'], 'active', 'medium', -35, 45, 15000, 3800, 'Reduce packaging & parts suppliers from 38 to 15.'),
    PJ('p_towerb', 'Tower B lease-up', 'c_prop', 'd_p_team', 'u_vannak', ['u_jonah'], 'active', 'critical', -120, 14, 60000, 49000, 'Reach 70% occupancy in Tower B (currently 41%).'),
    PJ('p_energy', 'Energy efficiency retrofit', 'c_prop', 'd_p_team', 'u_vannak', ['u_jonah'], 'active', 'low', -80, 70, 120000, 12000, 'LED + HVAC controls in Tower A; target −18% utilities.'),
    PJ('p_erp', 'Group ERP & reporting consolidation', 'c_hq', 'd_hq_fin', 'u_snakeman', ['u_sokha', 'u_rachel', 'u_ethan'], 'active', 'high', -45, 110, 150000, 21000, 'Single chart of accounts and consolidated monthly reporting across all subsidiaries.'),
    PJ('p_fy27', 'FY' + (CUR_YEAR + 1) + ' budget cycle', 'c_hq', 'd_hq_fin', 'u_sokha', ['u_rachel', 'u_rachel'], 'active', 'high', -10, 55, 0, 0, 'Group budget process: templates, subsidiary submissions, board sign-off.'),
    PJ('p_brand', 'Group brand refresh', 'c_hq', 'd_hq_exec', 'u_kim', ['u_nadia'], 'completed', 'low', -150, -20, 30000, 27400, 'Unified Northstar identity across subsidiaries.'),
  ];

  /* ---------- tasks ---------- */
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
  T('Security audit remediation for SOC 2', 'p_soc2', ['u_kim', 'u_snakeman', 'u_ethan', 'u_piseth'], 'in_progress', 'high', 6, 55, { desc: 'Close the 14 findings from the gap assessment (logging, key rotation, vendor reviews). Evidence goes in the SOC 2 folder.', comments: [['u_kim', -12, 'Board wants this closed before auditor fieldwork. Snakeman, please own.'], ['u_snakeman', -11, 'Ethan — can your Platform squad take the technical findings?'], ['u_ethan', -10, 'Assigning to Piseth. Key rotation and logging first.'], ['u_piseth', -2, '9 of 14 closed. Vendor reviews waiting on Legal templates.']], files: ['soc2-findings-tracker.xlsx'] });
  T('Load test v3.0 API gateway', 'p_v3', ['u_snakeman', 'u_ethan', 'u_piseth'], 'submitted', 'high', 2, 90, { desc: 'Sustain 2,000 req/s at p95 < 250ms on the new gateway.', comments: [['u_piseth', -1, 'p95 = 212ms at 2,100 req/s. Report attached.', 'submission']], files: ['loadtest-report-v3.pdf'] });
  T('Redesign onboarding flow', 'p_v3', ['u_ethan', 'u_lina'], 'in_progress', 'medium', 9, 40, { desc: 'Cut time-to-first-booking from 3 days to under 1 day.', files: ['onboarding-v3-wireframes.fig'] });
  T('Implement new billing UI', 'p_v3', ['u_ethan', 'u_piseth'], 'changes', 'high', 1, 75, { changes: 'Tax line and currency formatting incorrect for SGD', comments: [['u_piseth', -3, 'Ready for review — screens for invoices, credit notes and refunds.', 'submission'], ['u_ethan', -1, 'Close. Tax line is missing on credit notes and SGD shows 3 decimals. Please fix and resubmit.', 'changes']] });
  T('Migrate auth to SSO provider', 'p_soc2', ['u_ethan', 'u_piseth'], 'todo', 'high', 14, 0);
  T('Write v3.0 release notes', 'p_v3', ['u_ethan', 'u_lina'], 'todo', 'low', 16, 0);
  T('Quarterly access review', 'p_soc2', ['u_ethan', 'u_piseth'], 'todo', 'medium', 20, 0, { recurrence: 'quarterly', desc: 'Review production access for all engineers; export evidence.' });
  T('Fix checkout accessibility issues', 'p_v3', ['u_ethan', 'u_piseth'], 'completed', 'medium', -6, 100);
  T('Prepare demo environment for Kestrel Group', 'p_pipe', ['u_ethan', 'u_ethan', 'u_piseth'], 'in_progress', 'high', 3, 60, { desc: 'Seed demo tenant with 3 clinics and realistic bookings.' });
  T('Q4 pipeline review deck', 'p_pipe', ['u_ethan', 'u_lina'], 'in_progress', 'high', 4, 50);
  T('Follow up 12 stalled enterprise leads', 'p_pipe', ['u_ethan', 'u_lina'], 'in_progress', 'medium', -3, 30);
  T('Weekly sales forecast update', 'p_pipe', ['u_ethan', 'u_lina'], 'todo', 'medium', 2, 0, { recurrence: 'weekly' });
  T('Launch longevity membership pricing page', 'p_member', ['u_kim', 'u_nadia', 'u_mony'], 'in_progress', 'high', 5, 60, { desc: 'Three tiers: Essentials, Performance, Longevity+. Legal copy review needed.' });
  T('Membership launch campaign — social assets', 'p_member', ['u_nadia', 'u_mony'], 'submitted', 'medium', 1, 90, { files: ['membership-social-set-v2.zip'], comments: [['u_mony', -1, '18 assets in Khmer and English. Ready for review.', 'submission']] });
  T('Design 12-week metabolic health program', 'p_member', ['u_kim', 'u_vannak', 'u_mony'], 'in_progress', 'high', 12, 45, { desc: 'Curriculum, lab schedule (fasting glucose, HbA1c, lipids), coaching cadence.' });
  T('Clinic booking app: staff training', 'p_booking', ['u_vannak', 'u_mony'], 'todo', 'medium', 10, 0);
  T('Patient NPS survey rollout', 'p_nps', ['u_vannak', 'u_mony'], 'in_progress', 'medium', -2, 50);
  T('Siem Reap clinic: contractor shortlist', 'p_siem', ['u_kim', 'u_vannak'], 'in_progress', 'high', 7, 35);
  T('Monthly clinical quality report', null, ['u_kim', 'u_vannak'], 'todo', 'medium', 3, 0, { recurrence: 'monthly' });
  T('Update patient intake forms', 'p_booking', ['u_vannak', 'u_mony'], 'completed', 'low', -10, 100);
  T('Nutrition content calendar Q4', 'p_member', ['u_vannak', 'u_mony'], 'completed', 'low', -4, 100);
  T('Telematics vendor evaluation', 'p_tele', ['u_kim', 'u_vannak', 'u_vannak'], 'in_progress', 'high', 4, 70, { files: ['telematics-scoring-matrix.xlsx'] });
  T('Install GPS units — pilot fleet (20 trucks)', 'p_tele', ['u_vannak', 'u_jonah'], 'in_progress', 'high', 11, 30);
  T('Warehouse racking layout for expansion', 'p_wh', ['u_vannak', 'u_jonah'], 'todo', 'high', 18, 0);
  T('Consolidate packaging suppliers', 'p_vendor', ['u_vannak', 'u_vannak'], 'in_progress', 'medium', 21, 25);
  T('Weekly fleet safety inspection', null, ['u_vannak', 'u_jonah'], 'todo', 'medium', 1, 0, { recurrence: 'weekly' });
  T('Resolve damaged-goods claims backlog', null, ['u_vannak', 'u_jonah'], 'blocked', 'high', -1, 40, { blocker: 'Waiting on insurer adjuster visit', comments: [['u_jonah', -2, 'Blocked — insurer adjuster has not confirmed a visit date. 23 claims pending.']] });
  T('Fuel card policy update', null, ['u_vannak', 'u_vannak'], 'completed', 'low', -8, 100);
  T('Tower B: shortlist anchor tenants', 'p_towerb', ['u_kim', 'u_vannak', 'u_jonah'], 'in_progress', 'critical', 6, 50, { comments: [['u_kim', -14, 'Anchor tenant is the unlock for Tower B. Weekly updates please.']] });
  T('Tower B marketing brochure', 'p_towerb', ['u_vannak', 'u_jonah'], 'submitted', 'medium', 3, 90, { files: ['tower-b-brochure-draft.pdf'] });
  T('LED lighting retrofit quotes', 'p_energy', ['u_vannak', 'u_jonah'], 'todo', 'medium', 15, 0);
  T('Monthly rent collection follow-up', null, ['u_vannak', 'u_jonah'], 'in_progress', 'high', 2, 60, { recurrence: 'monthly' });
  T('Prepare Q3 board pack', null, ['u_kim', 'u_kim', 'u_sokha'], 'in_progress', 'critical', 5, 65, { desc: 'Consolidated results, subsidiary updates, risk register, FY' + (CUR_YEAR + 1) + ' budget timeline.', comments: [['u_kim', -9, 'Please include cash runway by subsidiary this quarter.']] });
  T('Consolidate subsidiary P&Ls for Q3', 'p_erp', ['u_sokha', 'u_rachel'], 'in_progress', 'high', 4, 50);
  T('Month-end close — ' + MONTHS_L[CUR_MONTH], null, ['u_sokha', 'u_rachel'], 'in_progress', 'high', 3, 40, { recurrence: 'monthly' });
  T('FY' + (CUR_YEAR + 1) + ' budget templates to subsidiaries', 'p_fy27', ['u_sokha', 'u_rachel'], 'todo', 'high', 9, 0);
  T('Select group ERP vendor', 'p_erp', ['u_kim', 'u_snakeman'], 'in_progress', 'high', 20, 35);
  T('Chart of accounts mapping', 'p_erp', ['u_snakeman', 'u_ethan'], 'in_progress', 'medium', 25, 20);
  T('Update employee handbook (' + CUR_YEAR + ' edition)', null, ['u_kim', 'u_vannak'], 'submitted', 'medium', 2, 95, { files: ['employee-handbook-' + CUR_YEAR + '.docx'] });
  T('Recruit Senior Backend Engineer', null, ['u_snakeman', 'u_vannak'], 'in_progress', 'high', 30, 30);
  T('Annual compliance filings', null, ['u_kim', 'u_sokha'], 'completed', 'high', -12, 100);
  T('Review insurance renewals across group', null, ['u_kim', 'u_sokha', 'u_rachel'], 'todo', 'medium', 13, 0);
  T('Cloud cost optimization', 'p_v3', ['u_snakeman', 'u_ethan'], 'completed', 'medium', -5, 100);
  T('Q4 OKRs for all subsidiaries', null, ['u_kim', 'u_kim'], 'in_progress', 'high', 8, 40);
  T('Vendor due diligence: FleetTrack', 'p_tele', ['u_vannak', 'u_vannak'], 'submitted', 'medium', 2, 90);
  T('Update risk register for Q4', null, ['u_kim', 'u_snakeman'], 'todo', 'medium', 6, 0);
  T('Tower A HVAC service contract renewal', 'p_energy', ['u_vannak', 'u_jonah'], 'in_progress', 'medium', -4, 55);
  // completed history — gives Reports real throughput / on-time data
  const HIST = [ ['u_piseth', ['API rate limiting', 'Database index tuning', 'Webhook retries', 'Audit log export']], ['u_piseth', ['Calendar week view', 'Invoice PDF styling', 'Dark mode fixes']], ['u_lina', ['Pricing page mockups', 'Usability test round 3']], ['u_lina', ['Harbor Physio renewal', 'Lumen Dental proposal', 'CRM data cleanup']], ['u_mony', ['August newsletter', 'Clinic photoshoot', 'Google Ads restructure']], ['u_mony', ['Follow-up calls backlog', 'Waiting room signage']], ['u_mony', ['Coaching scripts', 'Lab panel guide']], ['u_jonah', ['Route plan — north corridor', 'Driver roster August', 'Fuel log audit']], ['u_jonah', ['Cycle count Zone C', 'Pallet labelling SOP']], ['u_jonah', ['Tenant satisfaction survey', 'Tower A renewals list']], ['u_rachel', ['Bank reconciliations', 'VAT return prep', 'Fixed asset register update']], ['u_vannak', ['Tyre supplier RFQ']], ['u_vannak', ['Infection control audit']], ['u_nadia', ['Q3 campaign plan']], ['u_ethan', ['Sprint planning cadence']], ['u_vannak', ['Performance review cycle']], ['u_rachel', ['Digital Q2 close']], ['u_sokha', ['Q2 consolidation']], ['u_vannak', ['Service charge reconciliation']], ['u_vannak', ['Safety KPI review']], ['u_ethan', ['Roadmap v3 sign-off']], ['u_vannak', ['Program pricing inputs']] ];
  for (const [uid_, titles] of HIST) {
    titles.forEach((ttl, i) => {
      const a = user(uid_); const due = -RI(10, 170); const late = rnd() < .34 ? RI(1, 6) : -RI(0, 3);
      const t = { id: 't_' + (s.tasks.length + 1), key: 'T-' + (++s.counters.task), title: ttl, description: '', companyId: a.companyId, departmentId: a.departmentId, projectId: null, creatorId: a.managerId || uid_, assigneeId: uid_, reviewerId: a.managerId || uid_, priority: pick(['low', 'medium', 'medium', 'high']), startDate: rel(due - 14), dueDate: rel(due), progress: 100, status: 'completed', approvalStatus: 'approved', comments: [], attachments: [], chain: [{ from: a.managerId || uid_, to: uid_, at: at(due - 14), note: 'Assigned' }], createdAt: at(due - 14), completedAt: at(due + late, 16), recurrence: null };
      s.tasks.push(t);
    });
  }

  /* ---------- approvals (run through the real rules engine) ---------- */
  const A = (who, dayOff, data, decisions) => {
    const a = as(who, at(dayOff, 10), () => createApproval(data));
    (decisions || []).forEach(([dec, d, comment]) => {
      const st = a.steps[a.currentStep]; if (!st || a.status !== 'pending') return;
      const actor = st.approverIds[0];
      as(actor, at(d, 15), () => decideApproval(a, dec, comment));
    });
    return a;
  };
  A('u_mony', -1, { type: 'expense', title: 'Influencer seeding kits (membership launch)', description: 'Sample kits for 12 wellness creators.', amount: 460, companyId: 'c_health', departmentId: 'd_h_mkt', category: 'Marketing', projectId: 'p_member', vendor: 'Brightline Media', attachments: [{ id: 'f_a1', name: 'kits-quote.pdf', size: 84000 }] });
  A('u_ethan', -4, { type: 'expense', title: 'Conference travel — KubeCon Asia (2 engineers)', description: 'Flights, hotel, passes for Piseth and Lina.', amount: 2400, companyId: 'c_digital', departmentId: 'd_d_eng', category: 'Travel', vendor: 'Corporate travel desk', attachments: [{ id: 'f_a2', name: 'kubecon-costs.xlsx', size: 22000 }] }, [['approve', -3, 'Good for recruiting too.'], ['approve', -2, 'Within Engineering travel budget.']]);
  A('u_ethan', -3, { type: 'purchase', title: '8 developer laptops', description: 'Replacement cycle + 2 new hires.', amount: 7800, companyId: 'c_digital', departmentId: 'd_d_eng', category: 'Equipment (capex)', vendor: 'Equipment supplier', attachments: [{ id: 'f_a3', name: 'laptop-quote-Q4.pdf', size: 150000 }] }, [['approve', -2, 'Approved — needed for v3 crunch.']]);
  const fleetBill = s.bills.find(b => b.vendor === 'FleetTrack Telematics');
  A('u_vannak', -2, { type: 'payment', title: 'FleetTrack Telematics — pilot hardware (' + fleetBill.number + ')', description: '20 GPS units + installation.', amount: 18500, companyId: 'c_logi', departmentId: 'd_l_fleet', billId: fleetBill.id, category: 'Equipment (capex)', vendor: 'FleetTrack Telematics', attachments: [{ id: 'f_a4', name: fleetBill.number + '.pdf', size: 140000 }] }, [['approve', -1, 'Matches PO and delivery note.']]);
  A('u_nadia', -2, { type: 'budget', title: 'Marketing budget increase — membership launch', description: 'Paid social and events for launch month.', amount: 25000, companyId: 'c_health', departmentId: 'd_h_mkt', category: 'Marketing' });
  A('u_ethan', -5, { type: 'hiring', title: 'Senior Backend Engineer (new headcount)', description: 'Platform squad. Salary band $5.5k–6.8k/month.', amount: 78000, companyId: 'c_digital', departmentId: 'd_d_be' }, [['approve', -4, 'Critical for SOC 2 and v3 scale.']]);
  A('u_kim', -6, { type: 'project', title: 'Siem Reap clinic fit-out', description: 'Third clinic. Fit-out, equipment, licensing.', amount: 240000, companyId: 'c_health', departmentId: 'd_h_clin', projectId: 'p_siem', attachments: [{ id: 'f_a5', name: 'siem-reap-business-case.pdf', size: 1200000 }] });
  A('u_vannak', -3, { type: 'vendor', title: 'Onboard FleetTrack Telematics as approved vendor', description: 'Due diligence pack attached.', amount: 0, companyId: 'c_logi', departmentId: 'd_l_proc', attachments: [{ id: 'f_a6', name: 'fleettrack-dd-pack.pdf', size: 640000 }] });
  A('u_vannak', -7, { type: 'contract', title: 'Tower A anchor lease renewal (5 years)', description: 'Renewal with 3% annual escalator.', amount: 612000, companyId: 'c_prop', departmentId: 'd_p_team', attachments: [{ id: 'f_a7', name: 'tower-a-lease-renewal.pdf', size: 880000 }] }, [['approve', -5, 'Commercial terms fine. Board to sign.']]);
  A('u_mony', -12, { type: 'expense', title: 'Taxi to supplier site', amount: 85, companyId: 'c_health', departmentId: 'd_h_care', category: 'Travel' }, [['approve', -11], ['approve', -10]]);
  A('u_vannak', -15, { type: 'expense', title: 'Replacement ultrasound probe', description: 'Probe failure in clinic 2.', amount: 1250, companyId: 'c_health', departmentId: 'd_h_clin', category: 'Cost of sales', attachments: [{ id: 'f_a8', name: 'probe-quote.pdf', size: 90000 }] }, [['reject', -14, 'Warranty should cover this — raise with vendor first.']]);
  A('u_lina', -20, { type: 'expense', title: 'Client dinner — Kestrel Group', amount: 320, companyId: 'c_digital', departmentId: 'd_d_sales', category: 'Marketing' }, [['approve', -19], ['approve', -18]]);
  A('u_jonah', -9, { type: 'purchase', title: 'Safety vests and cones (fleet)', amount: 940, companyId: 'c_logi', departmentId: 'd_l_fleet', category: 'Cost of sales' }, [['approve', -8], ['approve', -7]]);
  A('u_jonah', -1, { type: 'other', title: 'Weekend overtime for claims backlog', description: 'Two Saturdays, 4 staff.', amount: 0, companyId: 'c_logi', departmentId: 'd_l_wh' });
  A('u_jonah', -2, { type: 'expense', title: 'Tower B open-house catering', amount: 780, companyId: 'c_prop', departmentId: 'd_p_team', category: 'Marketing', projectId: 'p_towerb' }, [['approve', -1, '']]);
  A('u_vannak', -8, { type: 'hiring', title: 'Legal & Compliance Manager', description: 'Vacant head of Legal & Compliance.', amount: 64000, companyId: 'c_hq', departmentId: 'd_hq_legal' }, [['approve', -6, 'Yes — we have no in-house legal cover.'], ['approve', -5, 'Approved.']]);
  A('u_sokha', -3, { type: 'expense', title: 'External audit interim fieldwork', amount: 14800, companyId: 'c_hq', departmentId: 'd_hq_fin', category: 'Professional fees', vendor: 'Audit & tax advisors', attachments: [{ id: 'f_a9', name: 'audit-engagement-letter.pdf', size: 210000 }] }, [['approve', -2, 'Agreed per engagement letter.']]);
  // post the drafts created by older approved expense requests; leave the latest for Finance to post
  const approvalDrafts = s.transactions.filter(t => t.approvalId && t.status === 'draft');
  approvalDrafts.forEach((t, i) => { if (i < approvalDrafts.length - 1) as('u_rachel', at(-RI(1, 8), 16), () => postTransaction(t)); });

  /* ---------- KPIs ---------- */
  const series = (start, end, noise) => { const out = []; for (let i = 0; i < 9; i++) out.push(start + (end - start) * i / 8 + (rnd() - .5) * noise); return out; };
  const K = (companyId, name, unit, target, direction, vals, ownerId, desc) => s.kpis.push({ id: uid('k'), companyId, name, unit, target, direction, values: vals.map(v => Math.round(v * 10) / 10), ownerId, description: desc });
  K('c_health', 'Patient visits / month', '#', 5200, 'up', series(4300, 5050, 260), 'u_vannak', 'Completed consultations across both clinics.');
  K('c_health', 'Net Promoter Score', '#', 60, 'up', series(48, 63, 5), 'u_vannak', 'Post-visit survey, rolling 30 days.');
  K('c_health', 'Membership retention', '%', 90, 'up', series(84, 88.5, 2), 'u_vannak', 'Members renewing at 3-month mark.');
  K('c_digital', 'Monthly recurring revenue', '$', 150000, 'up', series(98000, 142000, 5000), 'u_ethan', 'Subscription MRR at month end.');
  K('c_digital', 'Logo churn', '%', 2, 'down', series(3.4, 2.3, .4), 'u_ethan', 'Customers lost / customers at start of month.');
  K('c_digital', 'Platform uptime', '%', 99.9, 'up', series(99.82, 99.95, .06), 'u_ethan', 'Monthly availability, excluding planned maintenance.');
  K('c_logi', 'On-time delivery', '%', 95, 'up', series(91, 93.2, 1.4), 'u_vannak', 'Deliveries within promised window.');
  K('c_logi', 'Fleet utilization', '%', 85, 'up', series(78, 86, 2.5), 'u_vannak', 'Truck-days in service / available truck-days.');
  K('c_logi', 'Cost per delivery', '$', 18, 'down', series(21.5, 18.6, .8), 'u_vannak', 'Fully loaded direct cost per completed delivery.');
  K('c_prop', 'Occupancy (portfolio)', '%', 88, 'up', series(69, 74, 1.5), 'u_vannak', 'Leased NLA / total NLA across Tower A and B.');
  K('c_prop', 'Rent collection rate', '%', 97, 'up', series(95, 97.8, 1.2), 'u_vannak', 'Cash collected / rent billed in month.');
  K('c_hq', 'Days to monthly close', '#', 7, 'down', series(12, 8, 1.2), 'u_sokha', 'Business days from month end to consolidated close.');
  K('c_hq', 'Group headcount', '#', 260, 'up', series(221, 243, 3), 'u_vannak', 'Full-time equivalents across all companies.');

  /* ---------- risks & issues ---------- */
  const RK = (type, title, companyId, projectId, ownerId, severity, likelihood, status, mitigation, due) => s.risks.push({ id: uid('rk'), key: (type === 'risk' ? 'RSK-' : 'ISS-') + String(++s.counters.risk).padStart(3, '0'), type, title, companyId, projectId, ownerId, severity, likelihood, status, mitigation, dueDate: rel(due), createdAt: at(-RI(5, 60)) });
  RK('risk', 'SOC 2 fieldwork slips past enterprise deal deadlines', 'c_digital', 'p_soc2', 'u_snakeman', 'high', 'medium', 'mitigating', 'Weekly remediation burndown; auditor slot pre-booked; bridge letter prepared for prospects.', 21);
  RK('risk', 'Tower B anchor tenant delay extends vacancy cost', 'c_prop', 'p_towerb', 'u_vannak', 'critical', 'medium', 'open', 'Incentive package approved up to 4 months rent-free; two backup prospects in pipeline.', 14);
  RK('issue', 'Nurse staffing shortage at Clinic 2', 'c_health', null, 'u_vannak', 'high', 'high', 'open', 'Agency nurses for 6 weeks; referral bonus launched.', 10);
  RK('risk', 'Telematics vendor lock-in', 'c_logi', 'p_tele', 'u_vannak', 'medium', 'medium', 'open', 'Require open data export (API) and 12-month exit clause in contract.', 30);
  RK('issue', 'Damaged-goods claims backlog (23 open)', 'c_logi', null, 'u_vannak', 'medium', 'high', 'mitigating', 'Weekend overtime requested; escalate insurer adjuster via broker.', 7);
  RK('risk', 'FX exposure on THB-denominated revenue', 'c_hq', null, 'u_sokha', 'medium', 'medium', 'open', 'Evaluate natural hedge via THB costs; review quarterly.', 45);
  RK('risk', 'Key-person dependency in Platform squad', 'c_digital', 'p_v3', 'u_ethan', 'medium', 'high', 'mitigating', 'Senior Backend hire approved; pair on critical services; runbooks.', 35);
  RK('risk', 'Siem Reap fit-out cost overrun', 'c_health', 'p_siem', 'u_kim', 'medium', 'low', 'open', 'Fixed-price contract with 8% contingency.', 60);
  RK('issue', 'Chart of accounts differs across subsidiaries', 'c_hq', 'p_erp', 'u_rachel', 'low', 'high', 'mitigating', 'Mapping table maintained until ERP go-live.', 40);

  /* ---------- standalone documents ---------- */
  const DOC = (name, companyId, category, ownerId, dayOff, confidential, linked) => s.documents.push({ id: uid('doc'), name, companyId, category, uploadedBy: ownerId, at: at(dayOff), size: RI(80, 4200) * 1000, confidential: !!confidential, linked: linked || null });
  DOC('Q2 Board Pack.pdf', 'c_hq', 'Board', 'u_sokha', -80, true);
  DOC('Group Delegation of Authority Policy.pdf', 'c_hq', 'Policy', 'u_kim', -200);
  DOC('Employee Handbook ' + (CUR_YEAR - 1) + '.pdf', 'c_hq', 'Policy', 'u_vannak', -300);
  DOC('FY' + CUR_YEAR + ' Budget — Consolidated.xlsx', 'c_hq', 'Finance', 'u_sokha', -270, true);
  DOC('Bank Facility Agreement — Logistics.pdf', 'c_logi', 'Contract', 'u_sokha', -400, true);
  DOC('SOC 2 Gap Assessment.pdf', 'c_digital', 'Compliance', 'u_snakeman', -95, false, { type: 'project', id: 'p_soc2' });
  DOC('Siem Reap Clinic Floor Plan.pdf', 'c_health', 'Project', 'u_kim', -8, false, { type: 'project', id: 'p_siem' });
  DOC('FleetTrack Proposal.pdf', 'c_logi', 'Vendor', 'u_vannak', -28, false, { type: 'project', id: 'p_tele' });
  DOC('Membership Pricing Model.xlsx', 'c_health', 'Finance', 'u_nadia', -21, true, { type: 'project', id: 'p_member' });
  DOC('Tower B Lease Template.docx', 'c_prop', 'Contract', 'u_vannak', -110);
  DOC('Clinical Quality Manual.pdf', 'c_health', 'Policy', 'u_vannak', -150);
  DOC('Engineering On-call Runbook.md', 'c_digital', 'Operations', 'u_ethan', -40);

  /* ---------- calendar events ---------- */
  const EV = (title, day, companyId, kind) => s.events.push({ id: uid('ev'), title, date: rel(day), companyId, kind: kind || 'meeting' });
  EV('Board meeting — Q3 review', 9, 'c_hq'); EV('Q4 planning offsite', 16, 'c_hq'); EV('SOC 2 auditor fieldwork begins', 24, 'c_digital');
  EV('Tower B open house', 12, 'c_prop'); EV('Membership launch day', 18, 'c_health'); EV('Subsidiary budget submissions due', 30, 'c_hq');
  EV('Monthly management review', -5, 'c_hq'); EV('Fleet safety audit', -12, 'c_logi');

  /* ---------- a few system notifications ---------- */
  for (const uid_ of ['u_kim', 'u_sokha']) s.notifications.push({ id: uid('nt'), userId: uid_, at: at(-2, 8), read: false, type: 'report', title: MONTHS_L[(CUR_MONTH + 11) % 12] + ' management report is ready', body: 'Consolidated P&L, cash and KPIs', link: { page: 'reports' } });
  s.notifications.push({ id: uid('nt'), userId: 'u_sokha', at: at(-1, 9), read: false, type: 'finance', title: 'Overdue receivables above $50k', body: 'Review AR aging by subsidiary', link: { page: 'finance', tab: 'receivables' } });
  // cash runway alerts are generated on login from settings.cashAlertMonths (runDeadlineSweep)
  // older notifications read
  const cutoff = addDays(TODAY, -3).toISOString();
  s.notifications.forEach(n => { if (n.at < cutoff) n.read = true; });
  s.notifications.sort((a, b) => a.at < b.at ? 1 : -1);
  s.audit.sort((a, b) => a.at < b.at ? 1 : -1);
  s.session.userId = null;
  return s;
}
