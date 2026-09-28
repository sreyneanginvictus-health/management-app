# Changelog

Newest first. Format: `## YYYY-MM-DD · agent` → what changed → what's next.

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
