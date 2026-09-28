# Handoff — Holding Company Management System

> **Read this first.** This is the single source of truth for the project. Claude Code and Claude (Cowork) both work from the `management app` folder and keep this file current. If something here is out of date, fix it in the same session.

| | |
|---|---|
| Owner | Sreyneang (founder) |
| Folder | `Documents\management app\` (Windows) — this folder |
| Live prototype | https://claude.ai/artifact/AEtxwRQFUe4W3mq7woe4xE (private; the owner shares it) |
| Prototype codename | "Northstar Holding OS" (fictional sample company, replace with real data later) |
| Status | v0.1 functional prototype — single HTML file, browser-only storage, sample data |
| Last updated | 2026-09-28 by Claude Code |

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

A working single-page prototype with realistic sample data. Every button, filter, form, workflow and role switch works. Data is stored in the viewer's browser (`localStorage`), so each person testing it sees their own copy.

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
| Sophea Chan | Owner / Board | Entire holding | Final approvals on large contracts/projects |
| Daniel Reyes | Group CEO | Entire holding | Executive dashboard, 5 pending decisions |
| Dr. Amara Okafor | CEO, Northstar Health | Own company | Subsidiary CEO sees one company only |
| Priya Nair | CTO | Entire holding | No finance by default — access control demo |
| Marcus Lee / Linh Tran | Finance | Entire holding | Ledger, posting, reversals, statements |
| Ravi Patel | Finance (Digital) | Own company | Company-level finance approver |
| Tomás Alvarez | Manager | Own department | Team workload, task reviews, board |
| Visal Heng / Rith Sok | Team Member | Own work | Simple member dashboard |

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
├─ docs/
│  └─ mcp.providers.example.json  ← template for financial data-provider MCPs (needs credentials)
├─ tools/build.mjs        ← concatenates src → dist (cross-platform)
├─ tests/smoke.mjs        ← Playwright: every role × page, plus workflow assertions
└─ prototype/
   ├─ src/                ← EDIT THESE
   │  ├─ core.js          helpers, store, permissions, scope, audit, notifications,
   │  │                   TASK / APPROVAL / FINANCE engines (pure logic, no DOM)
   │  ├─ data.js          seed generator (deterministic, relative to today) + default settings/rules
   │  ├─ ui.js            icons, components, SVG charts, modal/drawer, shell, router, event wiring, search
   │  ├─ views_dash.js    login + 5 role dashboards
   │  ├─ views_tasks.js   tasks (list/board/drawer/forms) + projects (list/detail/new)
   │  ├─ views_approvals.js  Approval Center, request form with live route preview
   │  ├─ views_finance.js    overview, transactions, budgets, AR, AP, bank & cash, statements, monthly/yearly
   │  ├─ views_org.js     companies (structure tree, KPIs), people directory, person drawer
   │  ├─ views_reports.js reports & KPIs (6 tabs) + operations (risk register, recurring work)
   │  ├─ views_misc.js    documents, calendar, notifications, settings, BOOT (must load last)
   │  └─ styles.css       design tokens (light/dark), components
   └─ dist/               ← generated; do not edit
```

### Architecture of the prototype

- **One normalized `state` object** (collections like DB tables) persisted to `localStorage` key `northstar-hcms-state` (`VERSION` in `core.js` — bump it when the schema changes; old data is discarded and reseeded).
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

**Defaults:** Owner & CEO = all permissions. CTO = work/ops/reports, **no finance**. Finance = finance + audit + financial reports. Manager = work, own department budget, KPIs. Member = own tasks, requests, documents, calendar.

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
- **Self-approval blocked**; if no eligible approver remains, the step **escalates** to `settings.escalationRole` (Owner).
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
| Projects above X | $50,000 → CEO → Owner; else CEO | Approval rules | Placeholder |
| Contracts above X | $25,000 → CEO → Owner; else Manager → CEO | Approval rules | Placeholder |
| Vendor onboarding | Manager → Finance | Approval rules | Placeholder |
| Allow self-approval | Off | Business rules | Recommended off |
| Document required to post | On | Business rules | Placeholder |
| Task review required | On | Business rules | Placeholder |
| Budget alert threshold | 80% | Business rules | Placeholder |
| Deadline reminder | 2 days before due | Business rules | Placeholder |
| Escalation role | Owner | Business rules | Placeholder |
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

- Browser-only storage, no real users/auth (any password), no server-side enforcement.
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
| 2026-09-28 | Runway = cash ÷ average monthly posted expenses (incl. capex and loan repayments) over the last N full months; `prototype/dist/` is not committed (build output) | Claude Code (placeholder, owner to confirm) |

---

## 15. Next tasks for Claude Code (prioritized)

*Done 2026-09-28 (Claude Code): git repo initialized on `main`; project health formula and cash-low alert moved into Settings → Business rules with UI + tests.*

3. **Data export/import for the prototype:** "Export data (JSON)" copy-to-clipboard and "Import data" paste box in Settings → System, so testers can share a scenario.
4. **Split `core.js` engines into ES modules** with unit tests (Node test runner) for: rule matching, approver resolution + escalation, self-approval block, task reviewer fallback, recurring spawn, reversal/adjustment, P&L/BS/CF math. Keep `tools/build.mjs` producing the single file.
5. **Statement import prototype:** Finance → Bank & cash → "Import statement (CSV)" → preview → match to ledger → create drafts for unmatched lines. This seeds the future connector + `hq reconcile`.
6. **CLI spike:** `apps/cli` with `hq brief`, `hq cash`, `hq pnl` running against the prototype's seed data (import engines from step 4) to validate the output style in §12.
7. **Schema draft:** SQL (Postgres) for §4 entities + RLS policies for scope; migration tool choice.
8. Accessibility pass (focus order in drawers/modals, labels), and performance check with 10× data.

**Acceptance for every task:** `npm run build` succeeds, `npm test` green, CHANGELOG updated, §3/§15 here updated if affected.
