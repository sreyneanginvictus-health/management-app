# Changelog

Newest first. Format: `## YYYY-MM-DD · agent` → what changed → what's next.

## 2026-10-01 · Claude Code — investor funding separate from revenue (branch )
- New entry type **Investor / owner funding** (Finance → **Record investor funding**, or Type in Record transaction). Accounts: **Share capital** (equity) and new **2400 Borrowings received** (loans). Funding raises cash, shows on the balance sheet (share capital / borrowings) and as financing in the cash flow statement — never as revenue or profit. Reversal works as for any posted entry.
- **Bank & cash → Where the cash came from:** opening balances, revenue received, investor & owner funding, loans received, money paid out, cash today, plus the list of funding entries.
- **Bank accounts:** Add account and Edit (name, bank, last 4 digits, **opening balance**), audited — needed after Clear sample data, when balances start at S$0.
- Older saved workspaces are upgraded on load (): no data version bump, so real data entered since the last release is kept.
- Sample data: a S$600k seed round (share capital). Tests: funding moves cash/capital/borrowings/financing but not revenue/profit; statements balance; reversal; upgrade of older workspaces; add account with opening balance. All green.
- **Next:** owner tries it in the preview, then publish.

## 2026-10-01 · Claude Code — "Ledger green" redesign from Claude Design (branch `feat/finance-hub`)
- Source: Claude Design project "Negroni App Redesign Brief" → **Negroni Ledger green handoff** (zip saved in `docs/design/ledger-green/`: README with tokens + light/dark HTML mockups of 6 screens). **Only the design changed** — data, roles, permissions, workflows, status words and Configurable settings are as before.
- **Design system** (`styles.css`, rewritten): Ledger-green tokens for light and dark (deep green brand, lime "good" pills, red "bad" pills, mint chart colour, coral loss bars), Geist / Geist Mono, 20px cards with no borders/shadows, padded canvas with a white sidebar card, segmented tabs, round icon buttons, mono amounts in tables, fully rounded bars, the month in progress faded (bars) or dashed (lines). Delta pills colour by good vs bad (costs going up = red).
- **Screens rebuilt to the mockups:** CEO Dashboard (2×2 KPIs + revenue-by-stream donut, Progress tracking with timeline marker / task pipeline / KPIs vs target, decisions, risks, company tiles, deadline date blocks, budget with year marker), Financial Overview (revenue hero + 12-month chart, tall Gross-profit card with the note thread, runway bar with the alert marker), Finance overview (net profit by month green/coral, "Where the money went", latest entries), Reports overview (smooth area chart, KPI scorecard with progress + sparkline), Tasks (workflow strip, count tiles, key chips, progress), Projects (selected green card with lime ring + detail panel). All other screens pick up the new system automatically.
- **Theme switch** under **Account & theme** (sidebar footer button and avatar menu): Device setting (default) / Light / Dark, saved per person (per real account in cloud mode, per demo person otherwise).
- `npm run screens` refreshed `docs/design/screens/` (49 screens) and `docs/design/styles.css`. Tests: theme default/per-person checks added; all green.
- **Clear sample data (start empty)** — Settings → System & data, and a new **Start empty (real data)** choice on the "older version" screen in cloud workspaces. Removes tasks, projects, approvals, all finance records (transactions, invoices, bills, budgets, bank opening balances, company figures), KPIs, risks, documents, events, notifications, report notes and history. Keeps the company, departments, people, roles, chart of accounts and settings. Tested: every role opens every page of an empty workspace without errors; a first real entry posts correctly. `blankState()` in data.js, `clearSampleData()` in core.js.
- **Next:** owner reviews; then merge `feat/finance-hub` (Financial System + this redesign) to `main`.

## 2026-10-01 · Claude Code — Financial System, Financial / Accounting / Investor roles, Financial Overview (branch `feat/finance-hub`)
- **Roles:** "Finance / Accounting" split into **Financial** (all finance, the new Financial System, overview notes) and **Accounting** (transactions, invoices, bills, bank, budgets, operations — no Financial System). New **Investor** role: sees only the Financial Overview, notifications and own profile. Sample people: Sokha Lim = Financial, Rachel Tan = Accounting, Daniel Ong = Investor (sample). The "Finance" approval step now goes to the Financial position.
- **Financial System** (sidebar → Financial System, Financial only): IFRS / SFRS(I) statements from the ledger — profit or loss by nature (to EBITDA, EBIT, PBT, estimated tax), financial position (with check = 0), cash flows (IAS 7, indirect); the **Invictus Health chart of accounts** (4100–9100 + balance-sheet accounts) with IFRS line and GST code, add-account form; **Tax & GST** (Singapore CIT with start-up / partial exemption, GST registration test and F5 estimate); **Assumptions** (all rates editable, audited).
- **Financial Overview** (sidebar → Financial Overview; CEO, Financial, Investor): six short points — revenue, gross profit, operating costs, net profit, cash, runway — each with value, change vs previous period and one plain sentence; periods last month / this month / quarter / year to date; 12-month chart. On any point the Financial position can send a **"Please check" or "Need feedback" note** to CEO and/or Investor → they get a notification, can reply and mark it done. Notes are audited.
- Sample data rebuilt on the Invictus accounts, currency **SGD**, company country Singapore. `VERSION` 6 → 7 (state has `coa` and `reportNotes`).
- Tests: access per role, statements tie to the ledger, tax examples, note flow end to end. All green.
- Not yet: real opening balances, accruals (ledger is still cash basis), capital allowances in tax, importing figures from the Excel model (it is mostly empty today), server-side enforcement of the Investor role (cloud workspace roles are still owner/editor/viewer).
- **Next:** owner reviews in the preview, then merge to `main`.

## 2026-09-29 · Claude Code — Negroni, one company (branch `feat/negroni-one-company`, on top of `feat/roles-people`)
- **App name → Negroni** (page title, sidebar, sign-in screens, sample emails @negroni.example). Subtitle "Holding OS" → "Management OS" since there is now one company. Internal browser-storage keys and the `northstar.html` Artifact file name are unchanged so saved sessions keep working.
- **Companies:** the five Northstar companies are gone; the only company is **Longevity project** (5 departments: Executive Office, Finance, Technology, Marketing, Operations & Programs). The 11 people moved into it.
- **Tasks / projects / approvals:** one of each — project *Longevity program launch*, task *Prepare the pilot group launch plan* (Kim → Vannak → Mony), approval *Blood-panel kits for pilot group* ($1,800, waiting for Vannak).
- Finance, budgets, 3 KPIs, 3 documents and 2 calendar events were regenerated for the one company so those screens still have numbers (figures are fictional). Risks: none.
- `VERSION` 5 → 6. Tests updated (one company, 1/1/1 counts, title and sidebar say Negroni). All green.
- **Next:** owner reviews in the preview, then merge both branches to `main`.

## 2026-09-29 · Claude Code — new roles and people (branch `feat/roles-people`)
- **Roles** are now CEO, CTO, **CMO** (new, same permissions as CTO), Finance / Accounting, Manager, Team Member. **Owner / Board removed**; the CEO has every permission and always keeps admin. Permissions otherwise unchanged. The CMO sees the CTO dashboard.
- **People** (sample data) replaced: CEO **Kim Sreyneang**, CTO **Snakeman**, CMO Nadia Rahman, managers Vannak Chea and Ethan Park, finance Sokha Lim and Rachel Tan, team members Piseth Noun, Lina Ortiz, Mony Keo, Jonah Reed. All tasks, projects, approvals, KPIs, risks and documents of the 27 old people were handed to one of the new people.
- Without an Owner: "Major projects" and "Major contracts" rules now go Finance → CEO, and the escalation role is Finance (so the CEO's own requests are approved by Finance). Both are placeholders in Settings.
- `VERSION` 4 → 5: browsers reseed; **existing cloud workspaces (e.g. Alex's) will ask "Reset to sample data / Keep (read-only)"** after this is deployed.
- Tests: role list, headcount per role, CEO/CTO names, CMO = CTO permissions, no references to removed people, no self-approval in sample data. All green.
- **Next:** owner reviews in the preview, then merge to `main`.

## 2026-09-29 · Claude Code — accounts moved to the owner's main email
- GitHub repo transferred **Sidiyatouch/management-app → sreyneanginvictus-health/management-app** (account on sreyneang.invictus@gmail.com). Old URL redirects. Local `origin` updated.
- Vercel: login switched from the Sidiyatouch GitHub to sreyneanginvictus-health; sreyneang.invictus@gmail.com added as login email (verification pending, then make it primary); project Git connection re-linked to the new repo. Vercel team/project/domain unchanged.
- GitHub push protection flagged the fake `sb_secret_` test value in `tests/cloud.mjs`; the test now builds fake secrets at runtime.
- Supabase: sreyneang.invictus@gmail.com invited and joined as **Owner** of org *Sidiyatouch* (project and data unchanged; Sidiyatouch login kept as second owner).
- **§15 P0.1 done:** Site URL → management-app-ashy.vercel.app, redirect URLs (live, previews, localhost), Confirm email off, min password 10, migrations 0001–0003 applied (0003 = new: revoke EXECUTE on the two trigger functions after Security Advisor warnings). Advisor: 0 errors.
- Merged `feat/p0-accounts` → `main`: live site now runs cloud mode.
- **Next:** P0.4 checks on the live site, P0.5 onboard Alex; verify the Vercel email and make it primary.

## 2026-09-29 · Claude Code — real accounts + cloud-saved workspaces (§15 P0.3), branch `feat/p0-accounts`
- **Two modes, picked at build time.** If `SUPABASE_URL` and a publishable key are set when building (Vercel Production), `index.html` runs in **cloud mode**. Otherwise (local dev, the Artifact, tests, previews) it is the same **demo mode** as before.
- **Cloud mode:** Create account / Sign in / Forgot password (+ set new password from the reset link). A new account gets "My workspace" with the Northstar sample data. Changes autosave about 1.5 s after you stop, with a status pill in the top bar: Saved · 2 s ago / Saving… / Not saved (retries on its own) / Reload to get the latest (conflict) / View only. Avatar menu shows your real email, a workspace switcher and **Act as…** (the old Switch user) to try every role. Sign out clears this browser.
- **Settings → System & data → Workspace:** rename (owner), members list, invite by email as editor/viewer (owner), remove member, Export JSON. Workspaces saved by an older app version ask "Reset to sample data / Keep (read-only)".
- `core.js`: storage adapter (`Store.local` / `Store.cloud`, `sharedState()` strips the per-person `session`). New `cloud.js`. Async boot in `views_misc.js`.
- `tools/build.mjs`: inlines only the URL + publishable/anon key, into `index.html` only, and **fails the build** on secret keys, service-role JWTs, non-https URLs, or any secret value in the output. supabase-js 2.117.2 is vendored in `prototype/vendor/` (MIT) and served from our own domain.
- New `supabase/migrations/0002_member_list.sql` (members' names/emails for the Workspace card). Without it the app still works but shows member ids only.
- Tests: new `tests/cloud.mjs` covers the build guards and every P0.4 flow (sign up, errors, autosave + reload, second device, conflict, isolation, invites, viewer, old version, sign-out cleanup) against an in-memory fake Supabase. `npm test` runs both suites; all green.
- **Not live yet.** Merging to `main` switches the live site to cloud mode immediately (Production already has the env vars), so do P0.1 first.
- **Next:** owner does §15 P0.1 (auth settings + run migrations 0001 and 0002) → merge `feat/p0-accounts` → run the P0.4 checks on the live site → P0.5 onboard Alex. Cowork: the Artifact is unchanged (demo mode), so it doesn't need republishing for this change.

## 2026-09-29 · Claude (Cowork) — accounts plan
- Confirmed: **no real user accounts yet** (demo sign-in, any password; data only in the browser). Added "Accounts & data — honest status" to handoff §3.
- New **§15 P0 — Real accounts + cloud-saved data** so Alex can sign up and prototype: Supabase dashboard steps, full SQL migration, file-by-file app changes, acceptance checklist, onboarding steps.
- Added `supabase/migrations/0001_workspaces.sql` (profiles, workspaces as JSON, members with owner/editor/viewer, RLS, save-with-revision, invite by email, explicit grants). Tested on local Postgres 16 with a mock auth schema: 12 access checks pass.
- New **§16 Portability** (inventory of every account, run on a new PC, rebuild from zero, hand over ownership, backups, secret rotation, hosting limits). Open decisions §13 #10–12 (sign-up policy, email confirmation/SMTP, seeded vs blank workspace). README links the live site.
- **Next:** Claude Code implements §15 P0 (owner first does P0.1 in the Supabase dashboard).

## 2026-09-29 · Claude (Cowork)
- Created public GitHub repo **Sidiyatouch/management-app** (empty, then the owner pushed the existing `main` history). Added `vercel.json` (no install, `npm run build` → `prototype/dist`, security headers), `.env.example` (Supabase variable names only) and allowed it through `.gitignore`.
- Deployed to Vercel: **https://management-app-ashy.vercel.app** — checked live: HTTP 200, HTTPS + HSTS, all headers present, demo sign-in (Daniel Reyes / CEO) loads the dashboard, no console errors. Production domain is public; previews stay behind Vercel login.
- Created Supabase org **Sidiyatouch** (Free) and project **management-app** in Singapore with Data API on, auto-expose new tables **off**, automatic RLS **on**. Linked to the Vercel project through the Supabase integration ("Link existing account", access limited to `management-app`); 16 Production env vars synced, verified in Vercel. The app does not use Supabase yet.
- **Next:** handoff §15 item 3; §15 item 7 (schema + RLS) is now unblocked by a real database.

## 2026-09-28 · Claude Code (style pass)
- `npm run dev` / `tools/serve.mjs`: zero-dependency dev server on http://localhost:5173 that rebuilds on `prototype/src` changes and live-reloads. `.claude/launch.json` registers it as the "prototype" preview.
- `styles.css` polish within the §8 design system (palette and chart series unchanged): new tokens (`--brand-grad`, `--nav-grad`, `--shadow-hover`, `--ring`, `--page-glow`, `--ease`), gradient sidebar with glowing active indicator, gradient hero KPI and primary buttons, hover lift on clickable cards/tiles, focus rings on inputs, animated tab underline, tinted table headers and row hover accent, blurred overlays, modal/toast pop-in, thin themed scrollbars, richer login panel. Light and dark checked.
- **Next:** Cowork republishes the Artifact; then handoff §15 item 3.

## 2026-09-28 · Claude Code
- Installed Git and Node.js LTS on the owner's PC (winget); `npm i` + Playwright Chromium; `git init` on `main` (`prototype/dist/` ignored as build output).
- **Project health formula → settings** (`settings.projectHealth`, new `projectHealth()` in core.js). Settings → Business rules has a "Project health" card with off-track and at-risk thresholds.
- **Cash-low alert → real rule.** `settings.cashAlertMonths` (default 2, 0 = off) and `runwayLookbackMonths` (default 3). New `monthlyBurn/cashRunway/lowCashCompanies` in core.js. Shown in Finance → Bank & cash ("Runway by company"), in dashboard alerts and as daily login notifications for finance viewers. Removed the hard-coded Logistics sample notification (the real rule flags Logistics at ~1.2 months with the seed data).
- `VERSION` 3 → 4 (settings schema changed; browser data reseeds). Settings number inputs now clamp to ≥ 0.
- Tests: `npm test` adds checks 8 (health follows settings) and 9 (cash alert threshold, off at 0, notifies finance not members). All green.
- **Next:** handoff §15 item 3 — data export/import in Settings → System. Cowork: republish the Artifact from `prototype/dist/northstar.html`.

## 2026-09-28 · Claude (Cowork)
- Created the `management app` project folder shared by Cowork and Claude Code.
- Added `handoff.md` (full context: concept, working protocol, current state, data model, access control, workflows, configurable rules, design system, target architecture, integrations & MCP plan, `hq` CLI concept, open decisions, next tasks).
- Imported the v0.1 prototype source into `prototype/src`; added cross-platform `tools/build.mjs`, Playwright `tests/smoke.mjs` (all roles × pages + 7 workflow checks, passing), `package.json`.
- Added `CLAUDE.md`, `setup/mcp.json` (Playwright MCP) and `setup/claude-settings.json` (deny rules) — the launchers copy them to `.mcp.json` / `.claude/settings.json` on first run because remote tools can't write those paths; `docs/mcp.providers.example.json` (Stripe / QuickBooks / Xero / future `hq` templates), `.gitignore`.
- Per owner: Claude Code launches with `--dangerously-skip-permissions` via `start-claude.cmd` / `start-claude.ps1`; `.claude/settings.json` holds deny-rule guardrails.
- Live prototype: https://claude.ai/artifact/AEtxwRQFUe4W3mq7woe4xE (v1).
- **Next:** handoff.md §15 — start with `git init`, then move the project-health and cash-alert placeholders into Settings.

## 2026-09-28 · Claude (Cowork)
- Built and published the v0.1 prototype (Northstar Holding OS): role-based dashboards, tasks & projects, approval center with configurable rules, finance & accounting, companies & people, reports & KPIs, operations, documents, calendar, notifications, settings, audit log.
