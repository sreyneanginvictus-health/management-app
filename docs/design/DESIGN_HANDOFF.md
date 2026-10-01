# Negroni — design handoff (for claude.ai/design)

> Everything a designer needs to redesign **any screen** of the Negroni app, and nothing about the back-end engines (approvals routing, ledger, tax maths), which stay as they are.
> Attached with this file: `screens/*.jpg` (49 screenshots of every screen, light, dark and mobile), `styles.css` (the current design system), `references/` (two style references from the owner).
> Last updated 2026-10-01 · source of truth for the product: `handoff.md` in the repo `sreyneanginvictus-health/management-app`.

---

## 1. Product in one paragraph

**Negroni** is an internal management app for one company, **Longevity project** (Singapore, SGD). People sign in, see a dashboard for their role, and work on **tasks, projects, approvals, finance, reports and people**. A **Financial System** gives the finance lead IFRS statements and Singapore tax. A short **Financial Overview** is the report the CEO and investors read; the finance lead can pin "Please check" / "Need feedback" notes on each point and they reply. Live site: https://management-app-ashy.vercel.app (real sign-up). The screenshots use the built-in sample data.

**Design goals from the owner:** easy and short, summary before detail, card-based dashboards with big clear numbers (see `references/`), plain language, works on a phone.

---

## 2. What may change and what is fixed

| Free to redesign | Keep (or ask first) |
|---|---|
| Layout, visual style, colour palette, typography, spacing, icons, charts' look, empty states, copy/microcopy, information hierarchy, which numbers are emphasised, mobile layouts, dark mode, navigation grouping/labels | **What data exists** (§5 per screen), **who can see what** (§3), the **workflows** (task: assign → delegate → submit → review; approvals: multi-step, no self-approval; ledger: posted entries are never edited, only reversed/adjusted), the **"Configurable" tag** on business rules that are placeholders |
| Combining or splitting screens/tabs, adding summaries | Adding brand-new data or features (fine to propose — mark them "new") |

**Hand back:** HTML/CSS mockups or a component/token spec. Claude Code ports them into the app (`prototype/src/styles.css` + string-template views). Reusing the existing class names (§6.3) where it fits makes the port faster, but it isn't required.

---

## 3. Roles and what each person sees (navigation)

Sidebar groups: **Workspace** (Dashboard, Tasks, Projects, Approvals, Operations) · **Business** (Financial Overview, Financial System, Finance, Reports, Companies, People) · **Tools** (Documents, Calendar, Notifications, Settings).

| Role (sample person) | Sees |
|---|---|
| **CEO** (Kim Sreyneang) | Everything, all settings |
| **CTO** (Snakeman) · **CMO** (Nadia Rahman) | Work, operations, reports (non-financial), companies, people — **no finance** |
| **Financial** (Sokha Lim) | All finance + **Financial System** + Financial Overview (can add notes) + financial reports + audit log |
| **Accounting** (Rachel Tan) | Finance (day-to-day books) + Operations — no Financial System, no financial reports |
| **Manager** (Vannak Chea, Ethan Park) | Own team's work, KPIs, own department budget |
| **Team Member** (Piseth, Lina, Mony, Jonah) | Own tasks, requests, documents, calendar |
| **Investor** (Daniel Ong, sample) | **Only** Financial Overview, Notifications, Settings → Profile |

Each person also has a **data scope** (whole company / department / own work) that filters records. Every screen must look fine when a list is **empty** for a given role.

---

## 4. App shell (all signed-in screens)

- **Sidebar** (left, dark indigo gradient): logo + "Negroni / Management OS", grouped nav with count badges (tasks, approvals, notifications), footer "Signed in as {role} · Access: {scope} · n of 27 permissions". Collapses to a slide-in drawer under 900 px (`49-mobile-nav-open`).
- **Top bar**: menu button (mobile), global search (tasks, projects, requests, people… grouped results, `/` shortcut), cloud save status pill (live site only: "Saved · 2 s ago" / "Not saved" / "View only"), company badge, notifications bell with count, user chip → **account menu** modal (`44-account-menu`): real account, workspace switcher, "Act as" any sample person, theme (System/Light/Dark), Sign out.
- **Content**: page head (title, subtitle, actions on the right) → filters/tabs → cards.
- **Overlays**: right-side **drawer** for a record (task, approval, transaction, person, invoice, bill, risk), centred **modal** for forms, **toasts** bottom-centre.

---

## 5. Screen inventory (screenshot → purpose → data → actions)

| # | Screen | Purpose / data shown | Main actions |
|---|---|---|---|
| 01 | **Sign in** (demo) | Brand panel with stats; email/password; demo account buttons. Live site instead: Sign in / Create account / Forgot password tabs | Sign in, pick demo person |
| 02 | **Dashboard – CEO** | Greeting, KPI tiles (revenue YTD, expenses, net profit, cash), revenue vs expenses chart, "Needs your decision" list, company performance table, alerts | New task, New request |
| 03 | **Dashboard – CTO/CMO** | Projects health, team workload, risks, tasks | — |
| 04 | **Dashboard – Financial/Accounting** | Cash, receivables, payables due, drafts to post, chart, approvals waiting | Record transaction, New task, New request |
| 05 | **Dashboard – Manager** | Team workload, reviews waiting, overdue, department budget | — |
| 06 | **Dashboard – Team member** | My tasks by due date, my requests | — |
| 07–08 | **Financial Overview** (CEO / Investor) | 6 points as cards: Revenue, Gross profit (+margin), Operating costs, Net profit (+margin), Cash in bank, Runway (months). Each: value, % change vs previous period, one plain sentence, open notes. Period switch: Last month / This month / This quarter / Year to date. 12-month revenue vs costs chart. Banner "n notes waiting for you" | Add note (Financial only), Reply, Mark done, show done notes |
| 09 | **Add note modal** | Kind: Please check / Need feedback · For: CEO, Investor · text · period | Send note |
| 10 | **Financial System – IFRS statements** | Year picker; Statement of profit or loss (by nature: revenue, cost of sales, gross profit, other income, 9 expense lines, EBITDA, D&A, EBIT, finance income/costs, PBT, tax, profit, margins); Statement of financial position (with check = 0); Statement of cash flows (IAS 7 indirect). Two columns: this FY to date, prior FY | Change year |
| 11 | **Chart of accounts** | Table: code, account, IFRS line, statement, GST code, FY to date. Add-account form (code, name, IFRS line, type, GST) | Add account |
| 12 | **Tax & GST** | Corporate tax estimate (PBT, chargeable income, scheme, exempt, taxable, rate, rebate, tax); GST status, 12-month taxable supplies vs S$1M threshold progress, warning if above | — |
| 13 | **Assumptions** | ~15 editable rates (tax %, exemptions, GST, year-end, useful life), each tagged Configurable | Edit inline |
| 14 | **Tasks** | List/Board toggle, scope filter, search; columns key, title, project, assignee, due, status, priority, progress | New task, open task |
| 15 | **Task drawer** | Workflow chain (who assigned → delegated → assignee → reviewer), details, progress, comments, files, activity | Reassign, Edit, Submit, Approve/Request changes, comment, attach |
| 16 | **New task modal** | Title, description, project, assignee, reviewer, due, priority, recurrence, files | Create |
| 17–18 | **Projects** / **Project detail** | Cards with health (on track / at risk / off track), progress, budget vs spent; detail: tasks, members, timeline, spend | New project, open |
| 19–21 | **Approvals** / drawer / **New request** | Tabs (waiting for me, my requests, all); request with type, amount, steps with approvers and status; form shows a **live route preview** of who will approve | Approve, Reject (comment), Withdraw, New request |
| 22 | **Operations** | Risk & issue register, recurring work | Add risk, open |
| 23–29 | **Finance** tabs: Overview, Transactions, Budgets, Receivables, Payables, Bank & cash (incl. runway), Statements | Ledger table with status draft/posted/reversed; budget vs actual with utilisation bars; invoice/bill aging; cash by account; P&L/Balance sheet/Cash flow | Record transaction, Post, Reverse, Adjust, New invoice/bill, record payment, add budget line |
| 30 | **Transaction drawer** | Details incl. account code + IFRS line, documents, audit trail; posted entries are locked | Post, Reverse, Adjust |
| 31 | **Reports** | Tabs: overview, finance, projects, people, KPIs… charts and tables | Export (planned) |
| 32–33 | **Companies** / detail | One company card (revenue YTD, sparkline, people, departments, projects, KPIs); detail tabs: overview, structure tree, people, projects, KPIs, finance | Add company |
| 34 | **People** | Directory: person, company, department, role badge, reports to, access, status | Add person, open person drawer |
| 35–37 | **Documents** · **Calendar** · **Notifications** | Files with confidential flag; month grid with tasks/events/due invoices; notification list with type tabs | Upload, filter, mark read |
| 38–43 | **Settings** tabs: Profile, Approval rules, Business rules, Roles & permissions (matrix), Audit log, System & data (workspace, members, invite, export, reset) | Rules editor with route tester; permission checkbox matrix (8 roles × 27 permissions) | Edit rules, toggle permissions, invite |
| 44 | **Account menu** | see §4 | Act as, theme, sign out |
| 45–46 | **Dark mode** (dashboard, overview) | Same screens, dark tokens | — |
| 47–49 | **Mobile** (390 px): dashboard, overview, nav open | Single column, sidebar as drawer | — |

---

## 6. Current design system (from `styles.css`)

### 6.1 Tokens (CSS variables on `:root`; dark values override under `prefers-color-scheme: dark` and `[data-theme="dark"]`)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` / `--surface` / `--surface-2` / `--surface-3` | #f2f3f9 / #fff / #f7f7fc / #eceef7 | #11111c / #1a1a29 / #202032 / #272740 | page, cards, subtle fills |
| `--ink` / `--ink-2` / `--muted` | #1b1a36 / #4a4b68 / #7a7c98 | #ececf8 / #c3c4dc / #9496b4 | text |
| `--line` / `--line-2` | #e3e4ef / #d3d5e5 | #2b2b42 / #3a3a57 | borders |
| `--brand` / `--brand-2` / `--brand-soft` / `--brand-ink` | #3b3494 / #5a52c7 / #e9e8f8 / #fff | #8f87f2 / #a9a2ff / #2a2856 / #12112a | primary |
| `--brand-grad` | 135° #3b3494 → #5a52c7 | 135° #8f87f2 → #b3adff | hero cards, primary buttons |
| `--nav-bg`, `--nav-grad`, `--nav-ink`, `--nav-active` | indigo #221e5c… | #161530… | sidebar |
| `--good` / `--warn` / `--bad` / `--info` (+ `-bg`) | #12805c / #a46200 / #c23434 / #2a64c4 | #4cc79a / #f0b451 / #f07b7b / #79a8f5 | status |
| `--s1..--s4` chart series | #4a3aa7 #eb6834 #1baf7a #2a78d6 | #9085e9 #d95926 #199e70 #3987e5 | charts |
| `--radius` / `--radius-sm` | 14px / 9px | | cards / inputs |
| `--shadow`, `--shadow-hover`, `--shadow-lg`, `--ring` | soft layered shadows, 4px focus ring | | |

**Type:** Plus Jakarta Sans 400–800 (UI), IBM Plex Mono (codes, numbers in tables). Sizes: page title ~26 px, card title 15 px, KPI value 28–30 px / 800, body 13–14 px, small 12 px, eyebrow 11 px uppercase.
**Breakpoints:** 1180 px (4→2 columns), 900 px (sidebar becomes drawer, single column), 560 px (forms and grids single column). Respect `prefers-reduced-motion`.

### 6.2 Icons
Inline SVG line icons (24 px grid, 1.8 stroke). Available names: home check folder stamp gauge coins chart building users file calendar bell gear search plus x menu clip alert info lock clock repeat send ok undo flag shield sun moon logout swap dollar target copy edit dots board list. New icons are fine — supply them as SVG paths.

### 6.3 Components (class names in `styles.css`)
`.card` (+ `.card-h`, `.card-b`, `.flush`) · `.kpi` / `.kpi.hero` tiles · `.ov-point` (overview card, `.hero` variant), `.ov-note` (note: `.check` blue / `.feedback` amber / `.done`) · `.btn` (`.primary .ghost .danger .good .sm`) · `.icon-btn` · `.badge` (`.b-good .b-warn .b-bad .b-info .b-brand`) · `.tag` · `.chip` · `.seg` (segmented control) · `.tabs` · `.input .select .toggle .check` · `.field`, `.form-grid` · `.t` tables in `.table-wrap` (`.num` right-aligned, `.r`) · `.progress` · `.notice` (`.warn .bad .good`) · `.drawer`, `.modal`, `.toast` · `.avatar`, `.person` · `.timeline` · `.steps` (workflow chain) · `.board`/`.col`/`.tcard` (kanban) · `.cal` (calendar) · `.perm-matrix` · `.cfg` ("Configurable" tag) · `.save-status` pill · charts: hand-drawn SVG bar, line, sparkline, horizontal bars, stacked bar with hover tooltips.

### 6.4 Owner's style references (`references/`)
1. **Fitness dashboard** — soft lavender canvas, rounded white cards, one saturated hero card with a smooth area chart, big numbers, small pill buttons, right rail with a people list.
2. **Sales report** — clean white, deep-green accent, KPI cards with coloured "+x%" pills, bold bar chart, donut/pie "product statistic", "Upgrade" card in the sidebar.
Take the *feel* (big numbers, generous whitespace, pill deltas, one hero card per view), not necessarily the colours — the brand is currently indigo; a palette change is allowed.

---

## 7. Content and copy rules

- Plain language; short sentences; numbers first ("Sales were S$185k, down 7% on August").
- Money: **S$**, compact on cards (S$1.70M, S$185k), full in tables, negatives as −S$x or (S$x) in statements.
- Dates: "Oct 1, 2026"; relative for activity ("2h ago").
- Placeholder business rules always show the **Configurable** tag.
- Status words are fixed: tasks (To do, In progress, Submitted, Changes requested, Blocked, Completed), approvals (Pending, Approved, Rejected, Cancelled), ledger (Draft, Posted, Reversed), projects (On track, At risk, Off track).

---

## 8. Technical constraints for the build (so designs port 1:1)

- Plain HTML + one CSS file + vanilla JS string templates; **no framework, no build-time CSS tools**, Google Fonts only, no external images (icons inline SVG).
- Every colour via CSS variables so **light and dark** both work; contrast ≥ WCAG AA.
- Must work from **390 px** to wide desktop; tables scroll horizontally inside `.table-wrap`.
- Charts are custom SVG — any chart type is fine if it can be drawn with simple SVG (bars, lines, areas, donuts).
- Interactions are click/tap + keyboard (Esc closes drawers/modals, `/` focuses search). Keep focus rings visible.
- Out of scope for design: back-end, permissions logic, calculations (all numbers on screen come from existing functions).
