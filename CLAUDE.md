# CLAUDE.md — management app

This folder is shared by **Claude Code** and **Claude (Cowork)**. Both work here and keep it current.

**Start every session by reading `handoff.md`** (product, architecture, data model, rules, roadmap, MCP + CLI plans) and the top entry of `CHANGELOG.md`.

## Quick commands
- Build the prototype: `npm run build` → `prototype/dist/index.html` (open in a browser) and `northstar.html` (Artifact version)
- Test: `npm test` (first time: `npm i` then `npx playwright install chromium`)
- Edit source in `prototype/src/`, never in `prototype/dist/`. `views_misc.js` boots the app and must load last (see `tools/build.mjs`).

## Rules
1. Never hard-code a business rule the owner hasn't specified — put it in `state.settings`, show the `cfg()` "Configurable" tag, and list it in handoff.md §7.
2. Posted financial entries are immutable (reverse/adjust only). Every important action calls `audit()`. No self-approval.
3. Engines (`core.js`) stay free of DOM code — they will be ported to the backend.
4. Bump `VERSION` in `core.js` when the stored state shape changes.
5. Keep `npm run build` and `npm test` green at the end of a session.
6. No secrets in the repo. `.mcp.json` uses `${ENV_VARS}` only. Never read `.env*`.
7. **End of session:** add an entry at the top of `CHANGELOG.md` (date · agent · changes · next) and update handoff.md §3/§15 (and §13/§14 for questions/decisions).
8. Explain choices in plain language in the changelog and replies, keep UI copy plain, and ask the owner before large architectural changes.

## Permission mode
The owner runs Claude Code here via `start-claude.cmd` / `start-claude.ps1` (`--dangerously-skip-permissions`). Deny rules in `.claude/settings.json` still apply (installed from `setup/` by the launcher; if missing, copy `setup/claude-settings.json` → `.claude/settings.json` and `setup/mcp.json` → `.mcp.json`). Don't connect live, write-capable finance credentials in these sessions — see handoff.md §2.
