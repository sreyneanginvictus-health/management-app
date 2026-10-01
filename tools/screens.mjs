// Capture every screen of the prototype for design work (docs/design/screens/*.jpg).
// Run: npm run build && npm run screens   (demo mode, sample data, light theme unless noted)
import { chromium } from 'playwright';
import { mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'docs', 'design', 'screens');
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
const url = pathToFileURL(join(root, 'prototype', 'dist', 'index.html')).href;

const browser = await chromium.launch();
async function session(opts) {
  const pg = await browser.newPage({ viewport: opts.viewport || { width: 1440, height: 900 }, colorScheme: opts.dark ? 'dark' : 'light' });
  await pg.goto(url);
  await pg.evaluate(() => { resetState(); applyTheme(''); });
  return pg;
}
let n = 0;
async function shot(pg, name, js, opt) {
  if (js) await pg.evaluate(js);
  await pg.evaluate(() => { document.getElementById('toasts').innerHTML = ''; });
  await pg.waitForTimeout(250);
  const file = String(++n).padStart(2, '0') + '-' + name + '.jpg';
  await pg.screenshot({ path: join(out, file), type: 'jpeg', quality: 78, fullPage: !(opt && opt.viewportOnly) });
  console.log(file);
}
const as = (u, page, extra) => `login('${u}'); ${extra || ''} go('${page}'); window.scrollTo(0,0);`;

const pg = await session({});
await shot(pg, 'sign-in-demo', 'render()');
await shot(pg, 'dashboard-ceo', as('u_kim', 'dashboard'));
await shot(pg, 'dashboard-cto', as('u_snakeman', 'dashboard'));
await shot(pg, 'dashboard-financial', as('u_sokha', 'dashboard'));
await shot(pg, 'dashboard-manager', as('u_vannak', 'dashboard'));
await shot(pg, 'dashboard-member', as('u_mony', 'dashboard'));
await shot(pg, 'financial-overview-ceo', as('u_kim', 'overview'));
await shot(pg, 'financial-overview-investor', as('u_daniel', 'overview'));
await shot(pg, 'overview-add-note-modal', as('u_sokha', 'overview') + " ACT['ov-note']({ dataset: { v: 'revenue' } });", { viewportOnly: true });
for (const [t, l] of [['statements', 'ifrs-statements'], ['coa', 'chart-of-accounts'], ['tax', 'tax-gst'], ['assumptions', 'assumptions']])
  await shot(pg, 'financial-system-' + l, as('u_sokha', 'hub', `App.ui.hubTab='${t}';`));
await shot(pg, 'tasks-list', as('u_kim', 'tasks'));
await shot(pg, 'task-drawer', as('u_vannak', 'tasks') + " openDrawer('task', state.tasks[0].id);", { viewportOnly: true });
await shot(pg, 'new-task-modal', as('u_kim', 'tasks') + ' openNewTask();', { viewportOnly: true });
await shot(pg, 'projects', as('u_kim', 'projects'));
await shot(pg, 'project-detail', as('u_kim', 'projects', '') + " go('projects', { id: state.projects[0].id });");
await shot(pg, 'approvals', as('u_vannak', 'approvals'));
await shot(pg, 'approval-drawer', as('u_vannak', 'approvals') + " openDrawer('approval', state.approvals[0].id);", { viewportOnly: true });
await shot(pg, 'new-request-modal', as('u_mony', 'approvals') + ' openNewRequest();', { viewportOnly: true });
await shot(pg, 'operations', as('u_kim', 'operations'));
for (const t of ['overview', 'transactions', 'budgets', 'receivables', 'payables', 'cash', 'statements'])
  await shot(pg, 'finance-' + t, as('u_rachel', 'finance', `App.ui.finTab='${t}';`));
await shot(pg, 'transaction-drawer', as('u_rachel', 'finance', "App.ui.finTab='transactions';") + " openDrawer('tx', state.transactions[state.transactions.length - 3].id);", { viewportOnly: true });
await shot(pg, 'reports', as('u_kim', 'reports'));
await shot(pg, 'companies', as('u_kim', 'companies'));
await shot(pg, 'company-detail', as('u_kim', 'companies') + " go('companies', { id: 'c_lp' });");
await shot(pg, 'people', as('u_kim', 'people'));
await shot(pg, 'documents', as('u_kim', 'documents'));
await shot(pg, 'calendar', as('u_kim', 'calendar'));
await shot(pg, 'notifications', as('u_kim', 'notifications'));
for (const t of ['profile', 'rules', 'business', 'roles', 'audit', 'system'])
  await shot(pg, 'settings-' + t, as('u_kim', 'settings', `App.ui.setTab='${t}';`));
await shot(pg, 'account-menu', as('u_kim', 'dashboard') + " ACT['user-menu']();", { viewportOnly: true });
await pg.close();

const dark = await session({ dark: true });
await shot(dark, 'dark-dashboard-ceo', as('u_kim', 'dashboard'), { viewportOnly: true });
await shot(dark, 'dark-financial-overview', as('u_kim', 'overview'), { viewportOnly: true });
await dark.close();

const mobile = await session({ viewport: { width: 390, height: 844 } });
await shot(mobile, 'mobile-dashboard-ceo', as('u_kim', 'dashboard'), { viewportOnly: true });
await shot(mobile, 'mobile-financial-overview', as('u_daniel', 'overview'), { viewportOnly: true });
await shot(mobile, 'mobile-nav-open', as('u_kim', 'dashboard') + " ACT['toggle-nav']();", { viewportOnly: true });
await mobile.close();

await browser.close();
console.log(n + ' screens in docs/design/screens');
