# Handoff — Holding Company Management System

> **Read this first.** This is the single source of truth for the project. Claude Code and Claude (Cowork) both work from the `management app` folder and keep this file current. If something here is out of date, fix it in the same session.

| | |
|---|---|
| Owner | Sreyneang (founder) |
| Folder | `Documents\management app\` (Windows) — this folder |
| Live prototype | https://claude.ai/artifact/AEtxwRQFUe4W3mq7woe4xE (private; the owner shares it) |
| Public site | https://management-app-ashy.vercel.app (Vercel, auto-deploys every push to `main`) |
| Repo | https://github.com/sreyneanginvictus-health/management-app (public; moved from `Sidiyatouch` on 2026-09-29, old URL redirects, no license = all rights reserved) |
| Database | Supabase project `management-app` (org Sidiyatouch, Free, Singapore `ap-southeast-1`) — linked, not yet used by the app |
| App name | **Negroni** (renamed from "Northstar Holding OS" on 2026-09-29). Sample data: one company, **Longevity project** |
| Status | v0.1 functional prototype — single HTML file, sample data. **Real accounts + cloud-saved workspaces are built (branch `feat/p0-accounts`, §15 P0.3) but not live yet: the owner does §15 P0.1 first, then merge to `main`.** |
| Last updated | 2026-09-29 by Claude Code |

---

## 1. What we are building

One internal platform where a **holding company** runs **multiple subsidiaries**: companies, people, tasks, projects, operations, approvals, budgets, expenses, finance/accounting, reports and company performance. It should feel like an operating system for a growing group, not a to-do app.

**Roles:** Owner/Board, CEO, CTO, Manager, Finance/Accounting, Team Member. Every user has their own login, role, company, department, manager and permissions. Role-based access control (RBAC) decides *which modules* a person sees; a data scope decides *which records* inside those modules.

**v1 priorities (in order):** Dashboard → Tasks & Projects → Approval Center → Finance & Accounting → Companies & People → Reports & KPIs.

**Product principles**

1. **Never hard-code a business rule the owner has not specified.** Use a placeholder stored as a setting and label it "Configurable" in the UI.
2. **Everything important is audited** — who created, edited, submitted, approved, rejected or changed what, and when. Audit is append-only.
3. **Money is immutable once posted.** Corrections are reversal or adjustment entries, never edits or deletes.
4. **No one approves their own request.** (Configurable, default off.)
5. **Summary before detail.** Dashboards, CLI output and AI answers synthesize; raw data is one click or flag away.
6. **Build the core so AI automation, mobile apps and integrations plug in later** — one domain/service layer, many faces (web, CLI, MCP, mobile).

---

## 2. Working protocol (Cowork ↔ Claude Code)

Both agents work from this folder. The owner may bounce between them, so each must leave the folder in a state the other can pick up cold.

| | Claude (Cowork) | Claude Code |
|---|---|---|
| Best at | Product thinking, research, specs, UX/visual design, publishing the prototype as an Artifact, docs | Implementation, refactors, tests, git, running things locally, MCP servers, CLI |
| Writes to | `handoff.md`, `docs/`, `prototype/src` (design iterations), republishes the Artifact | All code, `tests/`, `tools/`, `CHANGELOG.md`, `handoff.md` |
| Starts a session by | Reading `handoff.md` + `CHANGELOG.md` | Same (auto-loaded via `CLAUDE.md`) |

**Session rules (both agents)**

1. **Read** `handoff.md` §3 (current state) and the top of `CHANGELOG.md` before changing anything.
2. **Small, verifiable steps.** Keep the prototype buildable (`npm run build`) and green (`npm test`) at the end of every session.
3. **Business rules go in settings**, marked with the `cfg()` "Configurable" tag in UI. Add new ones to §7.
4. **Record decisions** in §14 (Decision log) with date and who decided. Unresolved questions go to §13.
5. **End of session:** append to `CHANGELOG.md` (date, agent, what changed, what's next) and update §3 and §15 here if they changed.
6. **Publishing:** only Cowork can republish the live Artifact. After Code changes the prototype, Cowork runs `npm run build` output → republishes `prototype/dist/northstar.html` to the URL above (use the Artifact tool with `url`). Note the republish in the changelog.
7. **Never commit secrets.** API keys live in environment variables or a local `.env` (git-ignored). `.mcp.json` references `${VARS}` only.
8. **Git:** initialize a repo in this folder if not done yet (`git init`). Work on branches, small commits, descriptive messages.

### Claude Code permission mode (owner's choice: skip permission prompts)

The owner chose to run Claude Code here with `--dangerously-skip-permissions` (`bypassPermissions` mode): no approval prompts for edits, commands or network calls.

- **How to start it:** double-click `start-claude.cmd`, or run `.\start-claude.ps1` in PowerShell. Both `cd` into this folder, install `.mcp.json` and `.claude/settings.json` from `setup/` if they are missing, and run `claude --dangerously-skip-permissions`. The first time, Claude Code shows a one-time warning you must accept.
- **Why a launcher and not a setting:** Claude Code ignores `defaultMode: "bypassPermissions"` in a project's `.claude/settings.json` (a checked-in file must not be able to switch prompts off). The only other way is `~/.claude/settings.json`, which would switch prompts off for **every** project on the computer — deliberately not done.
- **Guardrails that still apply** (`.claude/settings.json` → `permissions.deny`; deny rules are enforced even in bypass mode): no reading `.env*` or `secrets/`, no `git push --force`/`-f`, no `git reset --hard`. Claude Code also always stops before deleting critical paths.
- **Risk:** bypass mode gives no protection against prompt injection or mistakes. Keep real bank/accounting credentials and write-capable finance MCPs **out** of bypass sessions — use sandbox/read-only keys, or start a normal `claude` session for anything touching live money data.
- **To go back to prompts:** just run `claude` instead of the launcher (or `claude --permission-mode auto` for background safety checks with fewer prompts).

---

## 3. Current state (v0.1 prototype)

A working single-page prototype with realistic sample data. Every button, filter, form, workflow and role switch works. It runs in one of two modes, chosen at build time:

- **Demo mode** (no Supabase env vars: `npm run dev`, the claude.ai Artifact, `npm test`, Vercel previews): pick a sample person, any password; data lives in the viewer's browser (`localStorage`).
- **Cloud mode** (`SUPABASE_URL` + publishable key set when building — i.e. Vercel Production): real accounts (Supabase Auth) and cloud-saved **workspaces**; see §15 P0.

### Accounts & data — honest status (2026-09-29)

| Question | Answer today |
|---|---|
| Can a real person create an account? | **In cloud mode, yes** (code done on branch `feat/p0-accounts`, tested against a fake Supabase in `tests/cloud.mjs`). Create account / Sign in / Forgot password → own workspace seeded with sample data. **Not live until** the owner does §15 P0.1 (run migrations 0001 + 0002, auth settings) and the branch is merged to `main`. In demo mode the old sample sign-in is unchanged. |
| Where is data saved? | Cloud mode: Supabase table `workspaces` (one row per workspace, whole shared state as JSON, autosaved ~1.5 s after a change, conflict-checked by `revision`). Per-person bits (who you "act as", company filter) stay in the browser under `northstar-session:<workspace id>`. Demo mode: `localStorage` key `northstar-hcms-state`. |
| Is Supabase used? | By cloud mode only. Tables are created by `supabase/migrations/0001_workspaces.sql` + `0002_member_list.sql` (not applied yet — §15 P0.1). |
| What's left for Alex to sign up? | §15 P0.1 (owner, Supabase dashboard) → merge `feat/p0-accounts` → P0.4 live checks → P0.5 onboarding. |

### Hosting & deployment (since 2026-09-29)

| Piece | Where | Notes |
|---|---|---|
| Code | GitHub `sreyneanginvictus-health/management-app` (moved from `Sidiyatouch` 2026-09-29) | Local folder pushes to `origin`. Vercel Git connection must be re-linked to the new owner (see §16.4). |
| Site | Vercel project `management-app` (Hobby, team "sidiyatouch's projects") | `vercel.json`: no install step, `npm run build`, serves `prototype/dist`. Headers: nosniff, `X-Frame-Options: DENY`, strict referrer, camera/mic/geo off; HSTS by Vercel. Deployment Protection = Standard (preview URLs need a Vercel login; the production domain is public). |
| Database | Supabase `management-app` (`xxylukhjhhvpxzfmcdvc`, Singapore) | Data API on; **new tables are NOT exposed automatically**; **automatic RLS on** for new public tables. Linked to Vercel via the Supabase integration (Vercel project `management-app` only). It synced 16 Production env vars: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_*` (browser-safe with RLS) and **secrets** `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `POSTGRES_*` (server-only). |

- **Merging to `main` switches the live site to cloud mode immediately**, because Vercel Production already has `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`. Run the migrations first (§15 P0.1), or visitors see "The database is not set up yet". Previews have no Supabase vars → demo mode.
- **Secret handling:** `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` and `POSTGRES_*` must never be written into the browser bundle — `tools/build.mjs` only ever inlines the URL + publishable/anon key, and **fails the build** on an `sb_secret_` key, a non-anon JWT, a non-https URL, or if the output contains `sb_secret_`/`service_role`/`POSTGRES` or the value of any `*SECRET*`/`*JWT*`/`*POSTGRES*`/`*PASSWORD*` variable (tested in `tests/cloud.mjs`). The DB password lives in the owner's password manager only.
- **Public means public:** anyone with the URL sees the sample Northstar data. Before real company data goes in: real auth, server-side RBAC, RLS policies, and consider Vercel password protection or a private repo.
- `.env.example` lists the variable names; real values live in Vercel/Supabase, never in git.

### Run it

```powershell
cd "$HOME\Documents\management app"
npm run build                  # writes prototype/dist/index.html + northstar.html
start prototype\dist\index.html  # open in the default browser
# Prereqs: Node.js LTS + Git (installed on the owner's PC via winget)
# Tests (first time): npm i ; npx playwright install chromium
npm test
```

Demo accounts are on the sign-in screen (any password works). Switch users from the avatar menu (top right).

| Person | Role | Scope | Good for testing |
|---|---|---|---|
| Kim Sreyneang | CEO | Entire holding | Executive dashboard, final approvals, all settings |
| Snakeman | CTO | Entire holding | No finance by default — access control demo |
| Nadia Rahman | CMO | Entire holding | Same permissions as the CTO |
| Sokha Lim / Rachel Tan | Finance / Accounting | Entire holding | Ledger, posting, reversals, statements |
| Vannak Chea | Manager (Group Operations) | Entire holding | Team workload and reviews for Health, Logistics, Properties, HQ |
| Ethan Park | Manager (Engineering, Digital) | Own company | Task reviews, board, Digital projects |
| Piseth Noun / Lina Ortiz / Mony Keo / Jonah Reed | Team Member | Own work | Simple member dashboard |

Roster set by the owner on 2026-09-29: roles are only CEO, CTO, CMO, Finance / Accounting, Manager, Team Member (no Owner / Board). CEO and CTO names were given by the owner; the CMO, managers, finance and team members are fictional sample names.

### File map

```
management app/
├─ CLAUDE.md              ← auto-loaded by Claude Code; points here
├─ handoff.md             ← this file
├─ CHANGELOG.md           ← session log (newest first)
├─ .mcp.json              ← project MCP servers for Claude Code (created from setup/ on first launch)
├─ .claude/settings.json  ← project deny rules for bypass mode (created from setup/ on first launch)
├─ setup/                 ← templates: mcp.json, claude-settings.json (Cowork can't write the two
│                            files above directly; the launcher copies them in if missing)
├─ start-claude.cmd/.ps1  ← launch Claude Code here with permission prompts skipped
├─ package.json           ← npm run build / npm test
├─ vercel.json            ← Vercel build/output settings + security headers
├─ .env.example           ← names of Supabase env vars (values never in git)
├─ supabase/migrations/   ← database schema, applied in order (0001_workspaces.sql, 0002_member_list.sql = §15 P0)
├─ docs/
│  └─ mcp.providers.example.json  ← template for financial data-provider MCPs (needs credentials)
├─ tools/build.mjs        ← concatenates src → dist (cross-platform)
├─ tests/smoke.mjs        ← Playwright: every role × page, plus workflow assertions (demo mode)
├─ tests/cloud.mjs        ← build secret guards + cloud mode flows against an in-memory fake Supabase
└─ prototype/
   ├─ src/                ← EDIT THESE
   │  ├─ core.js          helpers, store, permissions, scope, audit, notifications,
   │  │                   TASK / APPROVAL / FINANCE engines (pure logic, no DOM)
   │  ├─ data.js          seed generator (deterministic, relative to today) + default settings/rules
   │  ├─ cloud.js         cloud mode: Supabase client, sign up/in/out, workspaces, members, autosave
   │  ├─ ui.js            icons, components, SVG charts, modal/drawer, shell, router, event wiring, search
   │  ├─ views_dash.js    login (demo) + create account/sign in (cloud) + 5 role dashboards
   │  ├─ views_tasks.js   tasks (list/board/drawer/forms) + projects (list/detail/new)
   │  ├─ views_approvals.js  Approval Center, request form with live route preview
   │  ├─ views_finance.js    overview, transactions, budgets, AR, AP, bank & cash, statements, monthly/yearly
   │  ├─ views_org.js     companies (structure tree, KPIs), people directory, person drawer
   │  ├─ views_reports.js reports & KPIs (6 tabs) + operations (risk register, recurring work)
   │  ├─ views_misc.js    documents, calendar, notifications, settings, BOOT (must load last)
   │  └─ styles.css       design tokens (light/dark), components
   ├─ vendor/             ← supabase-js 2.117.2 UMD (MIT, pinned); copied to dist/vendor in cloud builds
   └─ dist/               ← generated; do not edit
```

### Architecture of the prototype

- **One normalized `state` object** (collections like DB tables) persisted through a storage adapter in `core.js` (`STORE` = `Store.local` → `localStorage` key `northstar-hcms-state`, or `Store.cloud` from `cloud.js`). `VERSION` in `core.js` — bump it when the schema changes; demo data is reseeded, cloud workspaces ask "Reset to sample data / Keep (read-only)".
- **Engines are separate from screens.** `createTask/delegateTask/submitTask/reviewTask`, `createApproval/buildSteps/decideApproval/applyApprovalEffects`, `createTransaction/postTransaction/reverseTransaction/adjustTransaction`, `pnl/balanceSheet/cashFlow/budgetRows` live in `core.js` and never touch the DOM. These are the pieces to port into the real backend.
- **Rendering:** string templates → `innerHTML`; `render()` redraws the page, `renderDrawer()` the side panel. Events use delegation: `data-act="name"` → `ACT[name]`, `data-act-change` / `data-act-input` → `CHANGE[name]`.
- **Clock:** `nowISO()` (overridable via `_fakeNow` during seeding). All sample dates are relative to today.
- **Charts:** hand-written SVG (`barChart`, `lineChart`, `sparkline`, `hbars`, `stackBarEl`) with hover tooltips; colors from CSS tokens so dark mode works.

---

## 4. Domain model

All collections live in `state`. Field names below are the contract to carry into the database.

| Entity | Key fields | Notes |
|---|---|---|
| `companies` | id, name, short, code, industry, country, isHolding, structure, slot, fixedAssets, loans, capital | Holding itself is a company (`isHolding`). `slot` = chart color index |
| `departments` | id, companyId, name, headId, parentId | Tree per company; structures differ (Digital has squads under Engineering; Properties is flat) |
| `users` | id, name, email, title, role, scope, companyId, departmentId, managerId, active, notifPrefs | `scope` ∈ holding / company / department / self |
| `roles` | key → {label, level, defaultScope, perms[]} | Editable permission matrix |
| `projects` | id, name, companyId, departmentId, ownerId, members[], status, priority, startDate, dueDate, budget, spentBase, description | status: proposed / active / on_hold / completed. Health is computed |
| `tasks` | id, key, title, description, companyId, departmentId, projectId, creatorId, assigneeId, reviewerId, priority, startDate, dueDate, progress, status, approvalStatus, comments[], attachments[], chain[], recurrence, submittedAt, completedAt | `chain` = delegation history (from → to) |
| `approvals` | id, no, type, title, description, amount, companyId, departmentId, requesterId, category, vendor, projectId, billId, steps[], currentStep, ruleId, status, attachments[], linkedTxId, decidedAt | steps: {role, approverIds[], escalated, status, actorId, at, comment} |
| `transactions` | id, no, date, companyId, departmentId, kind (revenue/expense), category, amount, accountId, party, memo, status (draft/posted/reversed), docs[], approvalId, projectId, invoiceId, billId, reversalOf, reversedBy, adjustmentOf, adjustments[], createdBy, postedBy, postedAt | Cash-basis ledger |
| `accounts` | id, companyId, name, type (bank/cash), institution, last4, opening | Balance = opening ± posted transactions |
| `invoices` (AR) | id, number, companyId, departmentId, category, customer, issueDate, dueDate, amount, paid, status, docs[] | Status computed: draft/sent/partial/paid/overdue/void |
| `bills` (AP) | id, number, companyId, departmentId, category, vendor, date, dueDate, amount, paid, status, docs[] | Paid via payment approval |
| `budgets` | id, companyId, departmentId, category, year, amount | Actual/forecast computed from ledger |
| `kpis` | id, companyId, name, unit (#/%/$), target, direction (up/down), values[9], ownerId, description | Last value = current month |
| `risks` | id, key, type (risk/issue), title, companyId, projectId, ownerId, severity, likelihood, status, mitigation, dueDate | |
| `documents` | id, name, companyId, category, uploadedBy, at, size, confidential, linked{type,id} | Prototype stores metadata only |
| `events` | id, title, date, companyId, kind | Calendar |
| `notifications` | id, userId, type, title, body, link{page,id,tab}, read, at | Types: task, approval, deadline, overdue, finance, report |
| `audit` | id, at, actorId, action, type, entityId, summary | Append-only. Entity history = `audit.filter(entityId)` |
| `settings` | approvalRules[], allowSelfApproval, requireDocForPosting, taskReviewRequired, budgetAlertPct, reminderDays, escalationRole, currency | All configurable |

---

## 5. Access control

**Two layers:**

1. **Permissions (per role)** decide modules and actions. Keys: `dashboard.view, tasks.view, tasks.create, projects.view, projects.manage, approvals.view, approvals.view_all, operations.view, finance.view, finance.manage, finance.confidential, budget.view_own, reports.view, reports.finance, kpi.update, companies.view, companies.manage, people.view, people.manage, documents.view, calendar.view, settings.admin, audit.view`.
2. **Data scope (per person)** decides records: `holding` (all companies) · `company` (own company) · `department` (own department tree + direct/indirect reports) · `self` (own work).

**Defaults:** CEO = all permissions (always keeps admin). CTO and CMO = work/ops/reports, **no finance**. Finance = finance + audit + financial reports. Manager = work, own department budget, KPIs. Member = own tasks, requests, documents, calendar.

**Rules implemented:** sidebar shows only permitted sections; confidential money requests (expense/budget/payment/contract) are hidden from roles without `finance.view` unless they are the requester or an approver; confidential documents need `finance.confidential`; the Owner can never lose `settings.admin` (lock-out guard).

**Production requirement:** enforce the same checks **on the server** (and ideally with Postgres row-level security). The prototype only enforces them in the browser.

---

## 6. Workflows

### Tasks
`To do → In progress → Submitted (awaiting review) → Completed`, with side states `Changes requested` and `Blocked`.

- **Delegation chain** (e.g. CEO → CTO → Manager → Team Member). Each hand-off is recorded in `task.chain`; **the person who delegated becomes the reviewer**. If someone would review their own work, the reviewer falls back to their manager.
- **Submit work** (note + files) → reviewer notified → **Approve & complete** or **Request changes** (comment required).
- Completion notifies everyone upstream in the chain.
- **Recurring** tasks (weekly / biweekly / monthly / quarterly) spawn the next occurrence when approved.
- Who can assign to whom: `assignableUsers()` — execs with holding scope → anyone; others → their reporting line, department, company per scope.
- Deadline sweep on login creates "due soon" (settings.reminderDays) and "overdue" notifications, deduplicated per day.

### Approvals (Approval Center)
- Types: expense, purchase, payment, budget, hiring, project, vendor, contract, other. Task reviews also appear in "Waiting on me".
- **Rules are data:** `{type, name, cond: {op, value} | null, steps: [role…], enabled}`. For a request, the matching rule with the highest threshold wins, else the rule without a condition.
- Approver roles: `manager` (requester's manager), `dept_head`, `finance` (company finance first, then group), `ceo` (company CEO, else group CEO), `cto`, `owner`.
- **Self-approval blocked**; if no eligible approver remains, the step **escalates** to `settings.escalationRole` (Finance since 2026-09-29 — there is no Owner role, so the CEO's own requests go to Finance).
- Consecutive steps resolving to the same single person collapse into one.
- **Effects on final approval:** expense/purchase → draft ledger entry for Finance to post · payment → pays the linked bill (posted entry) · budget → increases the budget line · project → Proposed becomes Active · hiring → notifies People & HR.
- Requester can withdraw a pending request. Reject needs a reason.

### Finance
- **Cash-basis ledger.** Drafts can be edited or discarded; **posting requires a supporting document** (configurable). Posted entries are locked: **Reverse** (new entry with negative amount, original marked reversed) or **Adjust** (separate delta entry). Both carry reasons and link to the original.
- Categories: Payroll, Cost of sales, Rent & facilities, Marketing, Software & IT, Travel, Professional fees, Utilities, Equipment (capex), Loan repayment. Capex and loan repayment are excluded from P&L and flow into investing / financing cash flow.
- **Statements:** P&L (per company columns + consolidated + prior year + change), Balance Sheet (simplified: retained earnings is the balancing figure), Cash Flow (direct method). Periods: YTD, MTD, last month, quarters, last 12 months, prior full year.
- **Budget vs Actual** per company × department × category, utilization, full-year forecast (actual ÷ share of year elapsed), alert threshold.
- **AR:** draft → sent → record payment (posts a revenue entry) · aging buckets. **AP:** enter bill → request payment (goes through payment approval rules) → paid.
- Monthly management report and yearly month-by-month report; "Copy as CSV" (downloads are blocked inside Artifacts).

### Reports & KPIs
Company comparison (revenue, growth, margin, revenue/head, budget used, delivery, risks, KPIs), departments, projects, team, operations (risk matrix + KPI trends), financial. Owner/CEO can select one, several or all companies.

---

## 7. Configurable business rules (placeholders)

Everything here is stored in `state.settings` and editable in **Settings**. Replace placeholders once the owner decides.

| Rule | Current value | Where | Status |
|---|---|---|---|
| Expenses above X need CEO | **$1,000** → Manager → Finance → CEO | Approval rules | Sample given by owner; configurable |
| Standard expenses | Manager → Finance | Approval rules | Placeholder |
| Purchases above X | $5,000 → Manager → Finance → CEO | Approval rules | Placeholder |
| Payments above X | $10,000 → Finance → CEO; else Finance | Approval rules | Placeholder |
| Budget changes | Finance → CEO | Approval rules | Placeholder |
| New headcount | Manager → CEO | Approval rules | Placeholder |
| Projects above X | $50,000 → Finance → CEO; else CEO | Approval rules | Placeholder |
| Contracts above X | $25,000 → Finance → CEO; else Manager → CEO | Approval rules | Placeholder |
| Vendor onboarding | Manager → Finance | Approval rules | Placeholder |
| Allow self-approval | Off | Business rules | Recommended off |
| Document required to post | On | Business rules | Placeholder |
| Task review required | On | Business rules | Placeholder |
| Budget alert threshold | 80% | Business rules | Placeholder |
| Deadline reminder | 2 days before due | Business rules | Placeholder |
| Escalation role | Finance | Business rules | Placeholder — confirm with owner (was Owner / Board, removed 2026-09-29) |
| Currency | USD, single currency | Business rules | Multi-currency is Phase 2 |
| Project health formula | at risk if ≥1 overdue task, >85% budget spent, or <70% progress within 21 days of due; off track if spent >100% of budget, ≥3 overdue, or past due | Business rules → Project health (`settings.projectHealth`, `projectHealth()` in core.js) | Placeholder; configurable |
| Cash-low alert | Alert when a company's runway < **2 months** (0 = off). Runway = cash ÷ avg monthly costs (all posted expenses incl. capex & loan repayments) over the last **3** full months | Business rules (`settings.cashAlertMonths`, `runwayLookbackMonths`); shown in Finance → Bank & cash, dashboard alerts, login notifications | Placeholder; configurable |

---

## 8. Design system

Visual direction came from the owner's references: deep indigo panels, soft lavender background, white rounded cards, pill badges, clean data-dense dashboards.

| Token | Light | Dark |
|---|---|---|
| `--brand` | `#3b3494` | `#8f87f2` |
| `--nav-bg` (sidebar) | `#221e5c` | `#161530` |
| `--bg` | `#f2f3f9` | `#11111c` |
| `--surface` | `#ffffff` | `#1a1a29` |
| `--ink` / `--muted` | `#1b1a36` / `#7a7c98` | `#ececf8` / `#9496b4` |
| Status | good `#12805c`, warn `#a46200`, bad `#c23434`, info `#2a64c4` | lighter equivalents |
| Chart series (validated for color-blind separation, keep this order) | `#4a3aa7`, `#eb6834`, `#1baf7a`, `#2a78d6` | `#9085e9`, `#d95926`, `#199e70`, `#3987e5` |

- **Type:** Plus Jakarta Sans (UI), IBM Plex Mono (IDs, entry numbers). Tabular numbers for all figures.
- **Components:** cards (radius 14), KPI tiles (first one "hero" in brand color), pill badges with state dot, tables with pagination, right-side drawers for record detail, modals for forms, segmented controls, tabs, toggles, timeline for history/approval steps, step pills for workflow chains, "Configurable" tag.
- **Charts:** one axis only, legend for ≥2 series, hover tooltip on every mark, company colors follow the entity (never re-colored by rank), status colors never used as series colors.
- **Responsive:** desktop-first; sidebar becomes off-canvas under 900px; grids stack; tables scroll horizontally inside their card.
- Owner brand note: the owner's startup brand (Invictus Health) uses blue/purple/teal with deep navy — close to this palette if the app is re-skinned for that group.

---

## 9. Known limitations (prototype)

- Cloud mode stores each workspace as one JSON document; access is per workspace (owner/editor/viewer), not per record. Inside a workspace, roles are "Act as" personas, not tied to the real account (`users[].authUserId` not added yet). Server-side RBAC comes with §15 item 7.
- Viewers see a "View only" banner and nothing they change is saved, but editing controls are not hidden.
- Save conflicts are detected, not merged: the later tab/device must reload and redo its last changes.
- File attachments store name + size only.
- Cash-basis accounting; no double-entry, chart of accounts, accruals, VAT/GST, intercompany eliminations, FX.
- Balance sheet is simplified (retained earnings is a plug).
- No email/Slack/push notifications; in-app only.
- String-template rendering (fine for a prototype; move to a component framework for production).
- Settings changes (thresholds, rules) are not versioned beyond the audit log entry.

---

## 10. Target architecture (recommendation — confirm with CTO)

"One service layer, many faces." The web app, the CLI (§12) and the MCP server (§11.3) all call the **same API** and the same permission checks.

```
          ┌──────────── faces ────────────┐
 Web app (React)   hq CLI   hq-mcp (for Claude)   Mobile (later)
          └──────────────┬────────────────┘
                   HQ API (REST/JSON + webhooks)
      auth (OIDC) · RBAC + scope · audit middleware · rate limits
                         │
     Domain services (ported from prototype core.js engines)
  tasks · approvals(rules) · ledger · budgets · reports · kpis · notify
                         │
   Postgres (row-level security by company/department) · object storage (docs)
                         │
      Connector layer (provider adapters → canonical financial model)
   bank feeds · statement import · accounting (QuickBooks/Xero) · payments (Stripe/PayPal)
```

Suggested stack (TypeScript monorepo): `apps/web` (React + Vite or Next.js), `apps/api` (Node, Fastify/NestJS), `apps/cli`, `apps/mcp` (MCP TypeScript SDK), `packages/core` (domain engines + types), `packages/connectors`, Postgres + Drizzle/Prisma, S3-compatible storage, OIDC auth (e.g. Auth0/Clerk/Supabase Auth), background jobs for syncs and reminders. Keep the prototype as the living UI spec until the web app reaches parity.

**Phases**
1. **v0.2 prototype hardening** (now): items in §15.
2. **v1 production core:** API + Postgres + auth + RBAC on server + audit + Tasks/Projects/Approvals + basic ledger; web app parity with prototype.
3. **v1.1 finance depth:** chart of accounts, double-entry, accrual, VAT/GST, statement import & bank reconciliation, month-end close.
4. **v1.2 integrations:** first data providers (§11), CLI (§12), `hq-mcp` read-only (§11.3).
5. **v2:** multi-currency + FX, intercompany eliminations, mobile app, AI automation (summaries, anomaly detection, approval pre-checks, report drafting).

---

## 11. Integrations & MCP (Model Context Protocol)

MCP lets Claude connect to tools and data through a standard protocol. We use it three ways.

### 11.1 Dev MCPs for Claude Code (configured in `.mcp.json`)

| Server | Why | Config |
|---|---|---|
| **Playwright** (`@playwright/mcp`) | Lets Claude Code open the prototype, click through flows and check layout/regressions | In `setup/mcp.json` → `.mcp.json` (stdio via `npx`) |
| GitHub (optional, once a repo exists) | PRs, issues, reviews | `claude mcp add --transport http github https://api.githubcopilot.com/mcp/` with a token header — add at *user* scope so the token never lands in the repo |
| Postgres (optional, v1) | Inspect schema/data during backend work | Add when a dev database exists; use a read-only role |

First time Claude Code starts in this folder it asks to approve project MCP servers; approve `playwright`. Check with `claude mcp list` or `/mcp`.

### 11.2 Financial data-provider MCPs (for later; need credentials)

The owner hasn't chosen providers yet. A template lives in `docs/mcp.providers.example.json` — copy the ones you choose into `.mcp.json` (and `setup/mcp.json`) (secrets via env vars only). Verify details at integration time; this space moves fast.

| Provider | What it covers | MCP status (as researched Sep 2026) |
|---|---|---|
| **Stripe** | Payments, invoices, subscriptions, balances, payouts, balance transactions | Official hosted server `https://mcp.stripe.com` (OAuth or Stripe *agent API keys*). From **Oct 31, 2026** full secret keys and non-agent restricted keys are no longer accepted. Write actions like refunds need human confirmation. |
| **QuickBooks Online** | Accounting: P&L, balance sheet, cash flow, AR/AP, invoices, bills | Official open-source local server `github.com/intuit/quickbooks-online-mcp-server` (OAuth) |
| **Xero** | Accounting, invoices, bank transactions | Official `xero-mcp-server`, self-hosted |
| **PayPal** | Invoices, payments | Official (hosted and local) |
| **Plaid** | Bank account aggregation (API) | Plaid's MCP is for integration diagnostics, **not** a bank-data gateway — use the Plaid API through our own connector. Coverage is mainly US/CA/UK/EU; confirm for Singapore/Cambodia |
| **Mercury / Ramp / Brex / Modern Treasury** | US business banking, spend, ledgers | Official MCPs exist (Mercury read-only) — relevant only if the group banks with them |
| **Local banks (Cambodia, Singapore)** | Bank statements & balances | No known MCP. Plan: **statement import** (CSV / XLSX / PDF / MT940 / OFX) first, then bank APIs where offered to corporate clients. Verify per bank. |

**Security rules for provider MCPs:** read-only scopes by default; separate sandbox and live credentials; enable human confirmation for any write; never mix a write-capable finance MCP with untrusted content sources in the same session (prompt-injection risk); log every tool call to our audit table when routed through `hq-mcp`.

### 11.3 Our own MCP server: `hq-mcp` (v1.2)

Expose the HQ API to Claude (Cowork, Claude Code, claude.ai) **with the user's own identity and permissions** — the MCP server never widens access. Start read-only.

| Tool | Returns (synthesized + record IDs for drill-down) |
|---|---|
| `hq_brief(scope?)` | Cash, P&L to date, approvals waiting on me, overdue work, alerts |
| `hq_cash_position(company?, by?)` | Balances by company/account, 30-day change, runway |
| `hq_pnl(company[], period, compare?)` | P&L summary with top drivers of change |
| `hq_budget_status(company?, threshold?)` | Lines over threshold, forecast overruns |
| `hq_receivables(overdue?)` / `hq_payables(due_within?)` | Aging, largest items |
| `hq_search_transactions(query, filters)` | Matching entries (paginated) |
| `hq_explain_variance(metric, company, period)` | Which categories/accounts moved and by how much |
| `hq_list_approvals(mine?)` / `hq_get_record(id)` | Pending items, full record with history |
| *(later, gated)* `hq_submit_request`, `hq_decide_approval` | Only through the approval engine, with confirmation, never bypassing rules or self-approval |

Resources: `hq://companies`, `hq://settings/approval-rules`. Prompts: "Monthly management report", "Board pack summary".

---

## 12. CLI concept: `hq`

**Why:** finance data is large and ugly. A CLI (and the MCP tools behind it) should turn it into short, decision-ready answers for humans — with the raw data one flag away. Same login, same permissions, same audit as the web app.

### Principles
1. **Synthesize by default.** Headline → 3–6 key numbers → what changed and why → what needs attention → next command to run.
2. **Drill down on demand:** `--detail`, `--json` (machines/agents), `--csv` (spreadsheets), `--ids` (record references).
3. **Human units:** $1.24M, "12 days overdue", "▲ 8.1% vs last year", local dates.
4. **Scoped and safe:** respects role + scope; writes are rare, go through the approval engine, and ask for confirmation. Every call is audited.
5. **Provider-agnostic:** commands talk to canonical types (Account, BankTransaction, Invoice, Bill, Statement), not to a specific bank's format.
6. **Works for non-technical users:** plain-English help, `hq ask` for questions, sensible defaults (current company scope, YTD).

### Command tree (draft)

```
hq login | logout | whoami | scope [all|<company>]
hq brief                                   # morning brief for my role
hq cash      [--company X] [--by account] [--trend 90d] [--runway]
hq pnl       [--period ytd|mtd|q3|2025|l12] [--company X,Y] [--compare py|pm]
hq bs | hq cf [--as-of DATE] [--company X]
hq budget    [--over 80] [--company X] [--forecast]
hq ar        [--overdue] [--aging] [--customer NAME]
hq ap        [--due 30d] [--vendor NAME]
hq tx        list|search|show <TX-…> [--docs]
hq invoice   show <INV-…> | hq bill show <BILL-…>
hq statements import <file> --account <acct>   # CSV/XLSX/PDF/MT940/OFX → staged
hq reconcile --account <acct> [--auto]          # match statement lines to ledger
hq sources                                      # connected providers + last sync
hq sync      [provider]                          # pull latest from providers
hq approvals [--mine] | hq approve <REQ-…> [-m "…"] | hq reject <REQ-…> -m "…"
hq tasks     [--mine|--overdue|--review]
hq kpi       [--company X]
hq ask "why did Logistics margin drop in August?"   # AI answer over hq-mcp tools, cites record IDs
hq export <report> --format csv|xlsx
```

### Example output (target style)

```
$ hq cash --runway
Cash across the group: $5.30M  (▼ 0.3% vs 30 days ago)

  Holdings HQ     $2.16M   ███████████████░░
  Digital         $1.25M   █████████░░░░░░░
  Health          $0.78M   █████░░░░░░░░░░░
  Properties      $0.69M   █████░░░░░░░░░░░
  Logistics       $0.42M   ███░░░░░░░░░░░░░   ⚠ 1.6 months of costs

Watch: Logistics runway below the 2-month alert (configurable).
Next:  hq cash --company logistics --by account   ·   hq ap --company logistics --due 30d
```

```
$ hq pnl --period ytd --compare py
Group P&L, Jan 1 – Sep 28 2026 (cash basis)
  Revenue      $7.26M   ▲ 19.4% vs 2025
  Expenses     $6.68M   ▲ 10.7%
  Net profit   $587k    8.1% margin  (2025: $51k)

Biggest movers
  + Subscriptions (Digital)       +$395k   new enterprise customers
  + Wellness memberships (Health) +$175k
  − Payroll (group)               +$310k   headcount growth
Next:  hq pnl --company digital --detail   ·   hq ask "what drove payroll growth?"
```

### Architecture
- Node/TypeScript CLI (e.g. `oclif` or `commander`), installable with `npm i -g`, Windows-friendly.
- Auth: device-code OIDC login (`hq login` opens the browser); token in the OS keychain.
- Calls the HQ API only — **no direct provider access from the CLI**. Connectors run server-side so credentials never sit on laptops.
- Output renderers: `summary` (default), `table`, `json`, `csv`. Summaries built from deterministic templates first; AI phrasing (`hq ask`) is optional and always shows the underlying figures.

### Connector interface (server-side)

```ts
interface Connector {
  id: string;                         // 'stripe' | 'quickbooks' | 'xero' | 'statement-import' | 'bank:<name>'
  capabilities: Array<'accounts'|'balances'|'transactions'|'invoices'|'bills'|'payments'|'statements'>;
  auth: 'oauth' | 'apiKey' | 'file';
  sync(opts: { since?: string; companyId: string }): Promise<SyncResult>;   // idempotent, cursor-based
  toCanonical(raw: unknown): CanonicalRecord[];                             // map provider → our types
}
// Canonical types: Account, Balance, BankTransaction, Invoice, Bill, Payment, Statement, Document
// Every imported record keeps: source, sourceId, importedAt, rawHash (dedupe + audit)
```

---

## 13. Open decisions (owner / CTO)

1. **Real structure:** actual subsidiary names, departments, reporting lines, people and roles (replace Northstar sample).
2. **Currencies:** USD only, or USD + KHR + SGD (multi-currency with FX)? Reporting currency?
3. **Accounting system:** keep our own ledger as the book of record, or sync with QuickBooks/Xero and treat ours as a management layer?
4. **Banks & data providers:** which banks per company; do they offer APIs or only statements?
5. **Approval thresholds** for every placeholder in §7, and whether thresholds differ per company.
6. **Hosting & data residency** (Singapore region?), auth provider, SSO needs.
7. **Tax:** which companies need VAT/GST handling in v1.
8. **Who uses the CLI first** (finance team? CEO?) — shapes the first commands to build.
9. **Budget periods:** calendar year or a different fiscal year start.
10. **Sign-up policy (needed for §15 P0):** open sign-up on the public site, or invite-only? Default in P0: open sign-up, every new account gets its own private workspace (RLS keeps them apart).
11. **Email confirmation & sender (needed for §15 P0):** Supabase's built-in email only delivers to members of the Supabase org and about 2 emails/hour. Options: (a) turn "Confirm email" off during the prototype phase (default in P0), (b) custom SMTP (e.g. Resend/Postmark) from a domain the owner controls — required before real users/data.
12. **New workspace content:** start with the Northstar sample data (default in P0, so Alex can explore immediately) or blank?

---

## 14. Decision log

| Date | Decision | By |
|---|---|---|
| 2026-09-28 | Six v1 priority areas; placeholders must be configurable, not hard-coded | Owner |
| 2026-09-28 | Sample rule: expenses above $1,000 need CEO approval (configurable) | Owner |
| 2026-09-28 | Prototype as single-file web app with sample data; published as a private claude.ai Artifact | Claude (Cowork) |
| 2026-09-28 | Posted financial entries are immutable; corrections by reversal/adjustment | Owner requirement |
| 2026-09-28 | Project folder `Documents\management app` shared by Cowork and Claude Code; `handoff.md` is the source of truth | Owner |
| 2026-09-28 | Plan a human-friendly `hq` CLI and `hq-mcp` server over one shared API | Owner (concept) |
| 2026-09-28 | Claude Code runs in this folder with `--dangerously-skip-permissions` via `start-claude.cmd/.ps1`; project deny rules as guardrails | Owner |
| 2026-09-29 | Real accounts + cloud-saved data is the #1 priority (§15 P0) so Alex can sign up and prototype; first version stores each workspace as one JSON document in Supabase, normalized tables come later (§15 item 7) | Owner |
| 2026-09-29 | Public GitHub repo + Vercel hosting (production public) + Supabase in Singapore with auto-RLS and no auto-exposed tables; app keeps browser storage for now | Owner |
| 2026-09-29 | P0 built on a branch; vendored supabase-js 2.117.2 served from our own domain (not a CDN); cloud mode switches on automatically when the build sees the Supabase URL + publishable key; default "Act as" persona = sample Owner | Claude Code |
| 2026-09-29 | Roles reduced to CEO, CTO, CMO, Finance / Accounting, Manager, Team Member (Owner / Board removed); CMO = same permissions as CTO; people: CEO Kim Sreyneang, CTO Snakeman, 1 CMO, 2 managers, 2 finance, 4 team members | Owner |
| 2026-09-29 | With no Owner role: large project/contract rules become Finance → CEO, escalation role = Finance (placeholders) | Claude Code (owner to confirm) |
| 2026-09-29 | App renamed **Negroni**; sample data reduced to one company (**Longevity project**) with one task, one project and one approval; finance, budgets, KPIs and documents regenerated for that company | Owner |
| 2026-09-28 | Runway = cash ÷ average monthly posted expenses (incl. capex and loan repayments) over the last N full months; `prototype/dist/` is not committed (build output) | Claude Code (placeholder, owner to confirm) |

---

## 15. Next tasks for Claude Code (prioritized)

*Done 2026-09-28 (Claude Code): git repo initialized on `main`; project health formula and cash-low alert moved into Settings → Business rules with UI + tests.*

*Done 2026-09-29 (Cowork): GitHub repo, Vercel deploy, Supabase project linked (see §3 Hosting & deployment).*

*Done 2026-09-29 (Claude Code): §15 P0.3 app changes on branch `feat/p0-accounts` (not merged). Remaining: P0.1 (owner), merge, P0.4 live checks, P0.5.*

### P0 — Real accounts + cloud-saved data (do this first)

**Goal:** Alex (the owner's teacher) opens https://management-app-ashy.vercel.app, creates his own account, lands in his own workspace (pre-filled with the Northstar sample data), changes things, and finds them still there after refresh, on another device, or the next day. The owner can invite Alex into a shared workspace. The demo mode keeps working everywhere Supabase isn't configured (local `npm run dev`, the claude.ai Artifact, `npm test`).

**Approach (fastest safe path):** Supabase Auth for accounts + one Postgres row per **workspace** holding the prototype's whole `state` as `jsonb`. This keeps every existing screen and engine unchanged (they already read/write one `state` object). Normalized tables per §4 come later (item 7) without changing the sign-up flow.

#### P0.1 Supabase dashboard setup (owner does this, ~10 min; Claude can guide in the browser)

1. **Auth → URL Configuration:** Site URL `https://management-app-ashy.vercel.app`; Redirect URLs add `https://management-app-ashy.vercel.app/**`, `https://*-sidiyatouch.vercel.app/**` (previews), `http://localhost:5173/**`.
2. **Auth → Sign In / Providers → Email:** enabled; minimum password length 10. **"Confirm email": OFF for the prototype phase** (built-in mail only reaches Supabase org members, ~2/hour — see §13 #11). Turn it back ON after custom SMTP is set up.
3. **Auth → Sign-ups:** allowed (default, §13 #10). To go invite-only later: disable sign-ups and use Auth → Users → *Invite user* (needs custom SMTP).
4. ✅ 2026-09-29: ran **`supabase/migrations/0001_workspaces.sql`**, **`0002_member_list.sql`** and **`0003_lock_trigger_functions.sql`** (members list with names/emails in Settings → System) in **SQL Editor**, or `supabase db push` once the Supabase CLI is linked. Keep every future schema change as a new numbered file there so the database can be rebuilt anywhere (§16).
5. **Vercel → Settings → Environment Variables:** `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` already exist for **Production** (synced by the integration). Also tick **Preview** for those two if preview deployments should have accounts too. Redeploy after changes.
6. **Then** merge `feat/p0-accounts` into `main` (Vercel deploys it; the live site switches to cloud mode). Doing this before step 4 shows visitors "The database is not set up yet".

#### P0.2 Database migration `supabase/migrations/0001_workspaces.sql`

> Verified 2026-09-29 (Cowork) on Postgres 16 with a mock `auth` schema: sign-up creates a profile; owner sees only their workspace; a stranger sees nothing and cannot update; only owners can invite; unknown emails are rejected; editors save with revision checks (stale save → `conflict`); viewers get `read-only`; editors can't add members; `anon` is denied; the owner row can't be removed or demoted. Re-run these checks against the real project after applying.
>
> Our project has **"Automatically expose new tables" OFF**, so every table needs explicit `GRANT`s to `authenticated`, or the app gets permission errors even with correct RLS. Automatic RLS is ON, but we still enable it explicitly so the file works on any project.

```sql
-- Profiles: one per auth user
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- A workspace = one copy of the whole prototype state
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  owner_id uuid not null references auth.users(id) on delete cascade,
  state jsonb not null,
  schema_version int not null,          -- = VERSION in core.js
  revision bigint not null default 1,   -- optimistic concurrency
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','editor','viewer')),
  added_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index on public.workspace_members (user_id);

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

-- Membership check (security definer avoids RLS recursion)
create or replace function public.has_ws_role(ws uuid, min_role text default 'viewer')
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = (select auth.uid())
      and case min_role
            when 'viewer' then true
            when 'editor' then m.role in ('editor','owner')
            when 'owner'  then m.role = 'owner'
          end);
$$;

-- Policies
create policy "own profile read"   on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "members read ws"    on public.workspaces for select to authenticated using (public.has_ws_role(id));
create policy "create own ws"      on public.workspaces for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "editors update ws"  on public.workspaces for update to authenticated using (public.has_ws_role(id,'editor')) with check (public.has_ws_role(id,'editor'));
create policy "owner deletes ws"   on public.workspaces for delete to authenticated using (owner_id = (select auth.uid()));

create policy "members read members" on public.workspace_members for select to authenticated using (public.has_ws_role(workspace_id));
-- Owners add/change/remove editors & viewers; the owner row itself is only created by the trigger below
create policy "owner adds members"    on public.workspace_members for insert to authenticated
  with check (public.has_ws_role(workspace_id,'owner') and role in ('editor','viewer'));
create policy "owner changes members" on public.workspace_members for update to authenticated
  using (public.has_ws_role(workspace_id,'owner') and role <> 'owner')
  with check (public.has_ws_role(workspace_id,'owner') and role in ('editor','viewer'));
create policy "owner removes members" on public.workspace_members for delete to authenticated
  using (public.has_ws_role(workspace_id,'owner') and role <> 'owner');

-- New auth user -> profile
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- New workspace -> creator becomes owner member
create or replace function public.handle_new_workspace() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return new;
end $$;
create trigger on_workspace_created after insert on public.workspaces
  for each row execute function public.handle_new_workspace();

-- Save with conflict detection (runs as the caller, so RLS applies)
create or replace function public.save_workspace(ws uuid, new_state jsonb, expected_revision bigint, new_schema_version int)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare r bigint;
begin
  if not public.has_ws_role(ws,'editor') then raise exception 'read-only' using errcode = '42501'; end if;
  update public.workspaces
     set state = new_state, schema_version = new_schema_version,
         revision = revision + 1, updated_at = now()
   where id = ws and revision = expected_revision
  returning revision into r;
  if r is null then raise exception 'conflict' using errcode = 'P0001'; end if;
  return r;
end $$;

-- Owner invites an existing account by email
create or replace function public.invite_member(ws uuid, member_email text, member_role text default 'editor')
returns void language plpgsql security definer set search_path = '' as $$
declare target uuid;
begin
  if not public.has_ws_role(ws,'owner') then raise exception 'only the workspace owner can invite'; end if;
  if member_role not in ('editor','viewer') then raise exception 'role must be editor or viewer'; end if;
  select id into target from auth.users where lower(email) = lower(member_email);
  if target is null then raise exception 'no account with that email yet - ask them to sign up first'; end if;
  insert into public.workspace_members (workspace_id, user_id, role) values (ws, target, member_role)
  on conflict (workspace_id, user_id) do update set role = excluded.role
    where public.workspace_members.role <> 'owner';  -- never demote the owner
end $$;

-- Grants (required: auto-expose is OFF)
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.workspaces, public.workspace_members to authenticated;
revoke all on public.profiles, public.workspaces, public.workspace_members from anon;
revoke execute on function public.save_workspace(uuid,jsonb,bigint,int), public.invite_member(uuid,text,text), public.has_ws_role(uuid,text) from public, anon;
grant execute on function public.save_workspace(uuid,jsonb,bigint,int), public.invite_member(uuid,text,text), public.has_ws_role(uuid,text) to authenticated;
```

#### P0.3 App changes (Claude Code) — ✅ done 2026-09-29 on `feat/p0-accounts`

As built (differences from the plan below): supabase-js **2.117.2** is **vendored** in `prototype/vendor/` and served from our own domain (`dist/vendor/`) instead of a CDN (no third-party script, no SRI drift, works on localhost). The build also accepts `SUPABASE_ANON_KEY` (anon JWT) as a fallback. New workspaces get their id from the browser (`crypto.randomUUID()`) because the row isn't readable until the owner-membership trigger has run. `users[].authUserId` was not added (nothing uses it yet); the default "Act as" persona is the sample Owner (Sophea Chan). Viewers get a "View only" banner and no saves rather than hidden controls. Tests: `tests/cloud.mjs` runs every P0.4 flow against an in-memory fake of the migration's rules.

| File | Change |
|---|---|
| `tools/build.mjs` | Read `process.env.SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (fallback `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). If both present, emit `<script>window.HQ_CONFIG={supabaseUrl,supabaseKey}</script>` and a pinned `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.x.y/dist/umd/supabase.min.js">` (pin exact version) into **`index.html` only**. `northstar.html` (Artifact) stays demo-only. **Fail the build** if the key starts with `sb_secret_`, or decodes as a JWT with `"role":"service_role"`, or if any other env var name containing `SECRET`, `SERVICE_ROLE`, `JWT` or `POSTGRES` would be inlined. |
| `prototype/src/core.js` | Replace `loadState/saveState/resetState` with a **storage adapter**: `Store.local` (today's behaviour) and `Store.cloud` (Supabase). Pick cloud when `window.HQ_CONFIG` exists. `state.session` is **per person** and must be stripped before cloud saves (keep it in `localStorage` under `northstar-session:<workspaceId>`). |
| `prototype/src/cloud.js` *(new, loaded after `core.js`)* | Supabase client; `signUp / signIn / signOut / resetPassword`; `listWorkspaces()`; `createWorkspace(name, state)`; `openWorkspace(id)`; debounced `save` (≈1.5 s) via `rpc('save_workspace')` with `revision`; flush on `visibilitychange`/`beforeunload`; on `conflict` → toast "Changed in another tab/device — reload to get the latest" and stop autosave until reload; on `read-only` → hide editing controls and show "View only"; offline/failed save → visible "Not saved" badge + retry. |
| `views_dash.js` | When cloud is on, the login view becomes **Create account / Sign in / Forgot password** (email + password, display name on sign-up). The demo persona buttons move to an in-app "Act as…" picker (below). |
| `views_misc.js` (boot) | Boot becomes async: cloud → get session → none = auth screen; else list workspaces → none = create "My workspace" seeded with `seedState()` (§13 #12) → open most recent → render. |
| `ui.js` (avatar menu) | Show the real signed-in email, **Sign out**, current workspace + switcher. Keep **"Act as"** (today's Switch user) so one real person can test every role inside their workspace; label it "Prototype: acting as Daniel Reyes (CEO)". |
| Settings → System | **Workspace** card: rename; members list; *Invite by email* (owner, calls `invite_member`); *Reset to sample data*; *Export JSON* (feeds §15 item 3). Show "Saved · 2 s ago" status. |
| `data.js` / `core.js` | Add optional `users[].authUserId` (not used for access yet) and bump `VERSION` only if the saved shape changes; when a workspace's `schema_version` ≠ `VERSION`, show "This workspace was saved by an older version — Reset to sample data / Keep (read-only)". |

**Security rules for P0:** only the publishable key reaches the browser; all access control is RLS; never call Supabase with the secret/service-role key from the web app; never log tokens; sign-out clears in-memory state and the session cache.

#### P0.4 Acceptance checklist (all must pass)

Status 2026-09-29: the unticked items all pass in `npm test` against a fake Supabase (`tests/cloud.mjs`); tick them after checking on the live site (after P0.1 + merge).

- [x] `npm run build` without Supabase env → demo mode exactly as today; `npm test` green.
- [ ] On the live site: sign up with a new email → lands in "My workspace" with sample data within 5 s.
- [ ] Make a change (e.g. create a task), refresh → still there. Open in another browser/device, sign in → still there.
- [ ] Second account cannot see the first account's workspace (check in UI **and** with a direct `from('workspaces').select()` call from that account).
- [ ] Owner invites the second account as editor → it appears in their workspace switcher; they can edit; viewer role cannot save.
- [ ] Two tabs editing the same workspace → the later save gets the conflict message, no silent overwrite.
- [ ] Wrong password, existing email on sign-up, and weak password show clear messages.
- [ ] Sign out → back to sign-in; no workspace data left in `localStorage`.
- [x] Built `index.html` contains no `sb_secret_`, `service_role`, `POSTGRES`, or JWT secret (build fails otherwise; also checked in `tests/cloud.mjs`).
- [x] Supabase **Advisors → Security** shows no errors (2026-09-29: 0 errors; remaining warnings are the intended signed-in RPCs + Supabase's own `rls_auto_enable`).

#### P0.5 Onboarding Alex (after P0 ships)

1. Send Alex the link https://management-app-ashy.vercel.app → **Create account** (his email, a password, his name). No confirmation email while "Confirm email" is off.
2. He gets his own workspace with sample data and can use **Act as…** to try each role.
3. To work in the owner's workspace instead: owner opens Settings → System → Workspace → **Invite by email** → Alex's email, role *editor*.
4. If sign-in fails: Supabase → Auth → Users (check the account exists); Auth → Logs.
5. Free-plan reminder: the Supabase project **pauses after ~7 days of low activity** (email warning first); Resume in the dashboard, data is kept.

### After P0

3. **Data export/import for the prototype:** "Export data (JSON)" copy-to-clipboard and "Import data" paste box in Settings → System, so testers can share a scenario.
4. **Split `core.js` engines into ES modules** with unit tests (Node test runner) for: rule matching, approver resolution + escalation, self-approval block, task reviewer fallback, recurring spawn, reversal/adjustment, P&L/BS/CF math. Keep `tools/build.mjs` producing the single file.
5. **Statement import prototype:** Finance → Bank & cash → "Import statement (CSV)" → preview → match to ledger → create drafts for unmatched lines. This seeds the future connector + `hq reconcile`.
6. **CLI spike:** `apps/cli` with `hq brief`, `hq cash`, `hq pnl` running against the prototype's seed data (import engines from step 4) to validate the output style in §12.
7. **Schema draft:** SQL (Postgres) for §4 entities + RLS policies for scope, as further files in `supabase/migrations/`; migrate each workspace's JSON into the tables; move RBAC/scope checks server-side (§5). Builds on P0's auth + workspaces.
8. Accessibility pass (focus order in drawers/modals, labels), and performance check with 10× data.

**Acceptance for every task:** `npm run build` succeeds, `npm test` green, CHANGELOG updated, §3/§15 here updated if affected.

---

## 16. Portability — move, rebuild or hand over the app

Everything needed to run this app lives in **four places**. Nothing important lives only on one laptop.

### 16.1 Inventory

| What | Where | Owner / login | Holds secrets? |
|---|---|---|---|
| Source code, docs, history | GitHub `sreyneanginvictus-health/management-app` (public; moved from *Sidiyatouch* 2026-09-29) + local folder `Documents\management app` | GitHub account *sreyneanginvictus-health* (sreyneang.invictus@gmail.com) | No — secrets are never committed (`.gitignore`: `.env*` except `.env.example`, `secrets/`) |
| Hosting | Vercel project `management-app`, team "sidiyatouch's projects" (Hobby), domain `management-app-ashy.vercel.app` | Vercel login via GitHub *sreyneanginvictus-health* or email (sreyneang.invictus@gmail.com; old sidiyatouch333@gmail.com still attached) | Env vars (synced from Supabase) |
| Database + accounts | Supabase org *Sidiyatouch* (Free) → project `management-app`, ref `xxylukhjhhvpxzfmcdvc`, Singapore | Owners: sreyneang.invictus@gmail.com (GitHub login *sreyneanginvictus-health*) and sidiyatouch333@gmail.com (GitHub login *Sidiyatouch*) | DB password (owner's password manager only), API keys |
| Design prototype | claude.ai Artifact https://claude.ai/artifact/AEtxwRQFUe4W3mq7woe4xE | Owner's Claude account | No |
| Glue | Vercel GitHub app (access: this repo only); Supabase ↔ Vercel integration (access: `management-app` only) | Installed by owner | — |

### 16.2 Run it on a new computer

```powershell
git clone https://github.com/sreyneanginvictus-health/management-app.git "$HOME\Documents\management app"
cd "$HOME\Documents\management app"
npm i                      # dev deps only (Playwright for tests)
npx playwright install chromium
npm run build ; npm test   # demo mode, no secrets needed
npm run dev                # http://localhost:5173 with live reload
```
For cloud mode locally: copy `.env.example` → `.env`, fill **only** `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` (Supabase → Project Settings → API Keys), then build. Never put the secret key in `.env` for the web app.

### 16.3 Rebuild everything from zero (new accounts / new region)

1. **GitHub:** create an empty repo, `git remote set-url origin <new url>`, `git push -u origin main`.
2. **Supabase:** new project (choose region; turn *Automatically expose new tables* OFF and *automatic RLS* ON as today) → apply `supabase/migrations/*.sql` in order (SQL Editor or `supabase link` + `supabase db push`) → redo Auth settings in §15 P0.1.
3. **Vercel:** Add New → Project → import the repo (preset "Other"; `vercel.json` supplies build settings) → install the Supabase integration with **Link existing account**, limited to this project → Redeploy.
4. Update the URLs in this file (header table, §3, §15 P0.1 redirect URLs) and the Supabase Site URL.
5. Move data if needed: see 16.5.

### 16.4 Hand over to another owner (keep the same services)

- **GitHub:** Settings → Transfer ownership (or add collaborators). Vercel's Git link follows the repo; re-authorize the Vercel GitHub app for the new owner if asked.
- **Vercel:** Project → Settings → Transfer to another team (Hobby → their team), or add them to the team.
- **Supabase:** Org → Team → invite them as Owner, or Project settings → Transfer project to their organization. Then **rotate keys and the DB password** (Project Settings → Database / API Keys) and let the integration re-sync Vercel env vars.
- Update §14 decision log and the header table.

### 16.5 Backups & data export

- The Free plan has no downloadable backups in the dashboard. Take your own: `supabase db dump --data-only -f backup.sql` (Supabase CLI) or `pg_dump` with the connection string from **Connect** → *Direct*. Store dumps outside the repo.
- Per-workspace JSON export from the app (Settings → System → Export JSON, §15 item 3) is the easy way for a single tester to save or share a scenario.
- Restore: create the schema from `supabase/migrations/`, then load the dump.

### 16.6 If a secret leaks

Rotate immediately in Supabase (API Keys → roll the secret key; Database → reset password), let the Vercel integration re-sync, redeploy, and check Supabase **Auth → Logs** and **Advisors**. The publishable key is designed to be public; RLS is what protects data.

### 16.7 Known limits of the current hosting

- Supabase Free: project pauses after ~7 days of low activity (resume from dashboard, data kept); built-in auth email is for testing only (§13 #11).
- Vercel Hobby: for personal, non-commercial use — move to Pro before commercial use.
- Only the production domain is public; preview URLs require a Vercel login (Deployment Protection: Standard).
