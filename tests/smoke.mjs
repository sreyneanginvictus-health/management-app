// Smoke + workflow tests for the prototype. Run: `npm run build && npm test`
// Requires: npm i -D playwright  (then `npx playwright install chromium` once)
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const page_url = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '..', 'prototype', 'dist', 'index.html')).href;
const errors = []; const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };

const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
pg.on('pageerror', e => errors.push(String(e)));
await pg.goto(page_url);
const E = s => pg.evaluate(s);
await E('resetState()');

// 1) Every role can open every page, tab, drawer and form it is allowed to see, without errors.
const users = await E('state.users.map(u => u.id)');
const pages = await E('NAV.flatMap(g => g[1].map(i => i[0]))');
for (const u of users) {
  await E(`login('${u}')`);
  for (const p of pages) {
    if (!(await E(`pageAllowed('${p}')`))) continue;
    await E(`go('${p}')`);
    const tabs = await E(`[...document.querySelectorAll('#content .tabs button')].map(b => b.dataset.v)`);
    for (const v of [null, ...tabs]) {
      if (v) await E(`document.querySelector('#content .tabs button[data-v="${v}"]')?.click()`);
      const txt = await pg.innerText('#content');
      ok(!txt.includes('Something went wrong'), `${u} ${p} ${v || ''} rendered an error`);
    }
  }
  for (const js of ["tasksInView()[0] && openDrawer('task', tasksInView()[0].id)", "approvalsInView()[0] && openDrawer('approval', approvalsInView()[0].id)",
    "can('finance.view') && openDrawer('tx', state.transactions[5].id)", "openDrawer('person', me().id)", "can('tasks.create') && openNewTask()", 'openNewRequest()']) {
    await E(js); await E('closeDrawer(); closeModal()');
  }
}

// 1b) Roster and roles (owner request 2026-09-29): CEO, CTO, CMO, Finance, Manager, Team Member only.
ok((await E('ROLE_KEYS.join()')) === 'ceo,cto,cmo,financial,accounting,manager,member,investor', 'role list');
ok((await E("JSON.stringify(state.users.map(u => u.role).sort())")) === JSON.stringify(['accounting', 'ceo', 'cmo', 'cto', 'financial', 'investor', 'manager', 'manager', 'member', 'member', 'member', 'member']), 'headcount per role');
ok((await E("state.users.filter(u => u.role === 'ceo').map(u => u.name).join()")) === 'Kim Sreyneang', 'CEO is Kim Sreyneang');
ok((await E("state.users.filter(u => u.role === 'cto').map(u => u.name).join()")) === 'Snakeman', 'CTO is Snakeman');
ok(await E("state.roles.cmo.perms.slice().sort().join() === state.roles.cto.perms.slice().sort().join()"), 'CMO has the same permissions as CTO');
const refs = await E(`(() => { const bad = []; const walk = (o, p) => { if (typeof o === 'string') { if (/^u_[a-z]+$/.test(o) && !state.users.some(u => u.id === o)) bad.push(p + '=' + o); } else if (o && typeof o === 'object') for (const k in o) walk(o[k], p + '.' + k); }; walk(state, 'state'); return bad.slice(0, 5); })()`);
ok(refs.length === 0, 'no references to removed people: ' + refs.join(', '));
ok(!(await E("state.approvals.some(a => a.steps.some(s => s.actorId === a.requesterId))")), 'nobody approved their own request in the sample data');

// 1c) One company, one task, one project, one approval (owner request 2026-09-29).
ok((await E('state.companies.map(c => c.name).join()')) === 'Longevity project', 'only company is Longevity project');
ok((await E('[state.tasks.length, state.projects.length, state.approvals.length].join()')) === '1,1,1', 'one task, one project, one approval');
ok((await pg.title()) === 'Negroni', 'page title is Negroni');
ok((await pg.innerText('.sidebar .brand')).includes('Negroni'), 'app name in sidebar');

// 1d) Financial vs Accounting vs Investor access (owner request 2026-10-01).
await E("login('u_sokha')");
ok(await E("pageAllowed('hub') && pageAllowed('overview') && pageAllowed('finance') && can('fhub.manage')"), 'Financial: Financial System + overview + finance');
await E("login('u_rachel')");
ok(await E("pageAllowed('finance') && pageAllowed('operations') && can('finance.manage')"), 'Accounting: finance + operations');
ok(!(await E("pageAllowed('hub') || pageAllowed('overview') || can('reports.finance')")), 'Accounting: no Financial System, overview or financial reports');
await E("login('u_daniel')");
ok((await E("NAV.flatMap(g => g[1].map(i => i[0])).filter(p => pageAllowed(p)).join()")) === 'overview,notifications,settings', 'Investor sees only overview, notifications, settings');
ok((await E('App.route.page')) === 'overview', 'Investor lands on the overview');
ok((await E("searchAll('pilot').length")) === 0, 'Investor search finds no tasks or requests');

// 1e) IFRS statements tie to the ledger; Singapore tax estimate follows the assumptions.
await E("login('u_sokha')");
ok(await E("Math.abs(ifrsSFP(scopeCompanyIds(), TODAY_S).check) < 1"), 'statement of financial position balances');
ok(await E("(() => { const ids = scopeCompanyIds(), f = CUR_YEAR + '-01-01'; const a = ifrsPL(ids, f, TODAY_S), b = pnl(ids, f, TODAY_S); return Math.abs(a.revenue - b.revenue) < 1 && Math.abs(a.cos + b.cogs) < 1; })()"), 'IFRS revenue and cost of sales match the ledger');
ok(await E("(() => { const c = ifrsCF(scopeCompanyIds(), CUR_YEAR + '-01-01', TODAY_S); return Math.abs(c.closing - cashPosition(scopeCompanyIds(), TODAY_S)) < 1; })()"), 'cash flow statement ends at the bank balance');
ok(Math.abs((await E("sgTax(300000, state.settings.fin.firstYA).tax")) - 29750) < 0.01, 'start-up exemption: S$300k → tax on S$175k at 17%');
ok((await E("sgTax(300000, state.settings.fin.firstYA + 3).exempt")) === 7500 + 95000, 'partial exemption after the first 3 YAs');
ok((await E("state.coa.find(a => a.code === '4100').line")) === 'Revenue', 'Invictus chart of accounts loaded');

// 1f) Overview notes: Financial asks, CEO and Investor are notified, Investor replies, CEO marks done.
const nid = await E("addReportNote({ point: 'cash', period: 'month', periodLabel: 'test', kind: 'check', audience: ['ceo', 'investor'], text: 'Please check the cash dip' }).id");
await E("login('u_kim')"); ok((await E("myNotifications().filter(n => n.title.startsWith('Please check: Cash')).length")) > 0, 'CEO notified of note');
await E("login('u_daniel')"); ok((await E("myNotifications().filter(n => n.title.startsWith('Please check: Cash')).length")) > 0, 'Investor notified of note');
await E(`replyReportNote(state.reportNotes.find(n => n.id === '${nid}'), 'Looks fine to me')`);
await E("login('u_kim')"); await E(`resolveReportNote(state.reportNotes.find(n => n.id === '${nid}'))`);
ok((await E(`JSON.stringify(state.reportNotes.find(n => n.id === '${nid}')) `)).includes('"status":"resolved"'), 'note resolved');
await E("login('u_piseth')"); ok(!(await E(`canSeeNote(state.reportNotes.find(n => n.id === '${nid}'))`)), 'team members cannot see report notes');

// 1g) Theme: follows the device until a person picks one; the choice is saved per person (Account & theme).
await E("login('u_kim')");
ok(!(await E("document.documentElement.hasAttribute('data-theme')")), 'theme defaults to the device setting');
ok(await E("!!document.querySelector('.sidebar-foot [data-act=\"user-menu\"]')"), 'Account & theme button in the sidebar');
await E("applyTheme('dark')");
await E("login('u_piseth')"); ok(!(await E("document.documentElement.hasAttribute('data-theme')")), 'another person keeps the device setting');
await E("login('u_kim')"); ok((await E("document.documentElement.getAttribute('data-theme')")) === 'dark', 'Kim gets her saved dark theme back');
await E("applyTheme('')"); ok(!(await E("document.documentElement.hasAttribute('data-theme')")), 'Device setting clears the override');

// 2) Expense > threshold routes Manager → Finance → CEO and creates a draft ledger entry on final approval.
await E("login('u_ethan')");
const a = await E("createApproval({type:'expense', title:'Test offsite', amount:2400, companyId:'c_lp', departmentId:'d_tech'}).id");
ok((await E(`get('approvals','${a}').steps.map(s=>s.role).join('>')`)) === 'manager>finance>ceo', 'expense route');
for (const u of ['u_snakeman', 'u_sokha', 'u_kim']) { await E(`login('${u}')`); await E(`decideApproval(get('approvals','${a}'),'approve','ok')`); }
ok((await E(`get('approvals','${a}').status`)) === 'approved', 'expense approved');
ok((await E(`get('transactions', get('approvals','${a}').linkedTxId).status`)) === 'draft', 'draft tx created');

// 3) No self-approval: the CEO's own step escalates to the Owner.
await E("login('u_kim')");
const route = await E("createApproval({type:'expense', title:'CEO trip', amount:5000, companyId:'c_lp', departmentId:'d_exec'}).steps.map(s => s.approverIds.join('/'))");
ok(!route.some(ids => ids.includes('u_kim')), 'requester never an approver');

// 4) Threshold is configuration, not code.
await E("ruleById('r_exp_hi').cond.value = 5000");
ok((await E("routePreview({type:'expense', amount:2400, companyId:'c_lp', departmentId:'d_tech', requesterId:'u_ethan'}).steps.length")) === 2, 'threshold change');

// 5) Task review loop.
await E("login('u_mony')");
const t = await E("state.tasks.find(t => t.title.startsWith('Prepare the pilot')).id");
await E(`submitTask(get('tasks','${t}'), 'done')`);
await E("login('u_vannak')");
ok(await E(`canReviewTask(get('tasks','${t}'))`), 'reviewer can review');
await E(`reviewTask(get('tasks','${t}'), 'approve', '')`);
ok((await E(`get('tasks','${t}').status`)) === 'completed', 'task completed');

// 6) Posted ledger entries are corrected by reversal, never edited.
await E("login('u_rachel')");
const tx = await E("state.transactions.find(t => t.status === 'posted').id");
await E(`reverseTransaction(get('transactions','${tx}'), 'test')`);
ok((await E(`get('transactions','${tx}').status`)) === 'reversed', 'reversal');

// 7) Access control spot checks.
await E("login('u_snakeman')"); ok(!(await E("can('finance.view')")), 'CTO has no finance by default');
await E("login('u_piseth')"); ok(!(await E("pageAllowed('finance')")), 'member cannot open finance');

// 8) Project health formula is configuration, not code.
await E("login('u_kim')");
const H = "state.projects.filter(p => p.status !== 'completed' && !p.healthOverride).map(p => projectStats(p).health)";
await E("Object.assign(state.settings.projectHealth, {offBudgetPct: 1e9, offOverdueTasks: 1e9, offPastDue: 0, riskBudgetPct: 1e9, riskOverdueTasks: 1e9, riskDaysToDue: -1e9, riskMinProgress: 0})");
ok((await E(H)).every(h => h === 'on_track'), 'lenient health settings → all on track');
await E("Object.assign(state.settings.projectHealth, {riskDaysToDue: 1e9, riskMinProgress: 101})");
ok((await E(H)).every(h => h === 'at_risk'), 'strict at-risk settings → all at risk');
await E("state.settings.projectHealth = defaultSettings().projectHealth");
ok((await E(H)).some(h => h !== 'at_risk'), 'defaults restored');
await E("App.ui.setTab = 'business'; go('settings')");
ok((await pg.innerText('#content')).includes('Project health'), 'health settings visible to admin');

// 9) Cash-low alert uses settings.cashAlertMonths (0 = off) and notifies Finance on login.
await E('state.settings.cashAlertMonths = 0');
ok((await E('lowCashCompanies(state.companies.map(c => c.id)).length')) === 0, 'cash alert off at 0');
await E('state.settings.cashAlertMonths = 1000');
ok((await E('lowCashCompanies(state.companies.map(c => c.id)).length')) === (await E('state.companies.length')), 'every company below 1000 months');
await E("login('u_sokha')");
ok((await E("myNotifications().filter(n => n.title.includes('cash below 1000 months')).length")) > 0, 'cash alert notification on login');
await E("login('u_piseth')");
ok((await E("myNotifications().filter(n => n.title.includes('cash below')).length")) === 0, 'no cash alerts for members');
await E('state.settings.cashAlertMonths = 2');
console.log('Runway (months):', await E("state.companies.map(c => company(c.id).short + ' ' + cashRunway([c.id]).months.toFixed(1)).join(', ')"));

// 9b) Investor funding: raises cash and share capital / borrowings, never revenue or profit; statements still balance.
await E("login('u_sokha')");
ok(await E("catsForKind('funding').includes('Share capital') && catsForKind('funding').includes('Borrowings received (investor / bank loans)')"), 'funding categories offered');
ok(!(await E("expenseCats().some(c => fundingCats().includes(c))")), 'funding accounts are not offered as expenses');
const fb = await E("(() => { const ids = scopeCompanyIds(); return { cash: cashPosition(ids), rev: pnl(ids, CUR_YEAR + '-01-01', TODAY_S).revenue, net: ifrsPL(ids, CUR_YEAR + '-01-01', TODAY_S).profit, cap: balanceSheet(ids).capital, loans: balanceSheet(ids).loans, fin: ifrsCF(ids, CUR_YEAR + '-01-01', TODAY_S).financing }; })()");
const ftx = await E("createTransaction({ kind: 'funding', date: TODAY_S, companyId: 'c_lp', departmentId: 'd_fin', category: 'Share capital', amount: 250000, accountId: 'a_c_lp_op', party: 'Test investor', memo: 'Series A tranche', docs: [{ id: 'fd', name: 'subscription.pdf', size: 1 }] }).id");
await E(`postTransaction(get('transactions','${ftx}'))`);
await E("postTransaction(createTransaction({ kind: 'funding', date: TODAY_S, companyId: 'c_lp', departmentId: 'd_fin', category: 'Borrowings received (investor / bank loans)', amount: 50000, accountId: 'a_c_lp_op', party: 'Test lender', memo: 'Bridge loan', docs: [{ id: 'fl', name: 'loan.pdf', size: 1 }] }))");
const fa = await E("(() => { const ids = scopeCompanyIds(); return { cash: cashPosition(ids), rev: pnl(ids, CUR_YEAR + '-01-01', TODAY_S).revenue, net: ifrsPL(ids, CUR_YEAR + '-01-01', TODAY_S).profit, cap: balanceSheet(ids).capital, loans: balanceSheet(ids).loans, fin: ifrsCF(ids, CUR_YEAR + '-01-01', TODAY_S).financing, check: ifrsSFP(ids, TODAY_S).check }; })()");
ok(Math.round(fa.cash - fb.cash) === 300000, 'funding raises cash by 300k');
ok(Math.round(fa.rev - fb.rev) === 0 && Math.round(fa.net - fb.net) === 0, 'funding does not touch revenue or profit');
ok(Math.round(fa.cap - fb.cap) === 250000 && Math.round(fa.loans - fb.loans) === 50000, 'share capital +250k, borrowings +50k on the balance sheet');
ok(Math.round(fa.fin - fb.fin) === 300000, 'shown as financing in the cash flow statement');
ok(Math.abs(fa.check) < 1, 'statement of financial position still balances');
await E(`reverseTransaction(get('transactions','${ftx}'), 'test')`);
ok(Math.round((await E('balanceSheet(scopeCompanyIds()).capital')) - fb.cap) === 0, 'reversing funding takes the capital back out');
ok(await E("(() => { const s = { coa: JSON.parse(JSON.stringify(state.coa)).filter(a => a.code !== '2400').map(a => (delete a.dir, a)) }; upgradeState(s); return s.coa.some(a => a.code === '2400' && a.dir === 'in') && s.coa.find(a => a.code === '3100').dir === 'in'; })()"), 'older workspaces get the funding accounts on load');
await E("ACT['acct-edit']({ dataset: {} })"); await E("document.querySelector('#modal-root [name=name]').value = 'DBS current'; document.querySelector('#modal-root [name=opening]').value = '15000'; ACT['acct-save']({ dataset: {} })");
ok((await E("state.accounts.find(a => a.name === 'DBS current').opening")) === 15000, 'add a bank account with an opening balance');

// 10) Clear sample data → empty workspace for real data: every role, every page, no errors; real entries work from scratch.
await E("login('u_kim'); clearSampleData()");
ok((await E("['tasks','projects','approvals','transactions','invoices','bills','budgets','kpis','risks','documents','events','reportNotes'].every(k => state[k].length === 0)")), 'sample records removed');
ok((await E("state.users.length > 0 && state.coa.length > 0 && state.companies.length === 1 && state.session.userId === 'u_kim'")), 'people, chart of accounts, company and session kept');
for (const u of users) {
  await E(`login('${u}')`);
  for (const p of pages) {
    if (!(await E(`pageAllowed('${p}')`))) continue;
    await E(`go('${p}')`);
    const tabs = await E(`[...document.querySelectorAll('#content .tabs button')].map(b => b.dataset.v)`);
    for (const v of [null, ...tabs]) {
      if (v) await E(`document.querySelector('#content .tabs button[data-v="${v}"]')?.click()`);
      ok(!(await pg.innerText('#content')).includes('Something went wrong'), `empty workspace: ${u} ${p} ${v || ''} rendered an error`);
    }
  }
}
await E("login('u_rachel')");
const rtx = await E("createTransaction({ date: TODAY_S, companyId: 'c_lp', departmentId: 'd_fin', kind: 'revenue', category: 'Revenue - Home testing kits', amount: 1200, accountId: 'a_c_lp_op', party: 'First customer', memo: 'First real sale', docs: [{ id: 'f1', name: 'receipt.pdf', size: 1 }] }).id");
await E(`postTransaction(get('transactions','${rtx}'))`);
ok((await E("cashPosition(['c_lp'])")) === 1200, 'first real entry posts to an empty ledger');

await browser.close();
console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'No page errors');
console.log(fails.length ? 'FAILED:\n' + fails.join('\n') : 'All checks passed');
process.exit(errors.length || fails.length ? 1 : 0);
