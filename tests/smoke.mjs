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
ok((await E('ROLE_KEYS.join()')) === 'ceo,cto,cmo,finance,manager,member', 'role list');
ok((await E("JSON.stringify(state.users.map(u => u.role).sort())")) === JSON.stringify(['ceo', 'cmo', 'cto', 'finance', 'finance', 'manager', 'manager', 'member', 'member', 'member', 'member']), 'headcount per role');
ok((await E("state.users.filter(u => u.role === 'ceo').map(u => u.name).join()")) === 'Kim Sreyneang', 'CEO is Kim Sreyneang');
ok((await E("state.users.filter(u => u.role === 'cto').map(u => u.name).join()")) === 'Snakeman', 'CTO is Snakeman');
ok(await E("state.roles.cmo.perms.slice().sort().join() === state.roles.cto.perms.slice().sort().join()"), 'CMO has the same permissions as CTO');
const refs = await E(`(() => { const bad = []; const walk = (o, p) => { if (typeof o === 'string') { if (/^u_[a-z]+$/.test(o) && !state.users.some(u => u.id === o)) bad.push(p + '=' + o); } else if (o && typeof o === 'object') for (const k in o) walk(o[k], p + '.' + k); }; walk(state, 'state'); return bad.slice(0, 5); })()`);
ok(refs.length === 0, 'no references to removed people: ' + refs.join(', '));
ok(!(await E("state.approvals.some(a => a.steps.some(s => s.actorId === a.requesterId))")), 'nobody approved their own request in the sample data');

// 2) Expense > threshold routes Manager → Finance → CEO and creates a draft ledger entry on final approval.
await E("login('u_ethan')");
const a = await E("createApproval({type:'expense', title:'Test offsite', amount:2400, companyId:'c_digital', departmentId:'d_d_eng'}).id");
ok((await E(`get('approvals','${a}').steps.map(s=>s.role).join('>')`)) === 'manager>finance>ceo', 'expense route');
for (const u of ['u_snakeman', 'u_sokha', 'u_kim']) { await E(`login('${u}')`); await E(`decideApproval(get('approvals','${a}'),'approve','ok')`); }
ok((await E(`get('approvals','${a}').status`)) === 'approved', 'expense approved');
ok((await E(`get('transactions', get('approvals','${a}').linkedTxId).status`)) === 'draft', 'draft tx created');

// 3) No self-approval: the CEO's own step escalates to the Owner.
await E("login('u_kim')");
const route = await E("createApproval({type:'expense', title:'CEO trip', amount:5000, companyId:'c_hq', departmentId:'d_hq_exec'}).steps.map(s => s.approverIds.join('/'))");
ok(!route.some(ids => ids.includes('u_kim')), 'requester never an approver');

// 4) Threshold is configuration, not code.
await E("ruleById('r_exp_hi').cond.value = 5000");
ok((await E("routePreview({type:'expense', amount:2400, companyId:'c_digital', departmentId:'d_d_eng', requesterId:'u_ethan'}).steps.length")) === 2, 'threshold change');

// 5) Task review loop.
await E("login('u_piseth')");
const t = await E("state.tasks.find(t => t.title.startsWith('Security audit')).id");
await E(`submitTask(get('tasks','${t}'), 'done')`);
await E("login('u_ethan')");
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

await browser.close();
console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'No page errors');
console.log(fails.length ? 'FAILED:\n' + fails.join('\n') : 'All checks passed');
process.exit(errors.length || fails.length ? 1 : 0);
