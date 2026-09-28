# Starts Claude Code in this folder with permission prompts skipped (bypassPermissions).
# First run: installs .mcp.json and .claude/settings.json from ./setup if missing.
# Deny rules in .claude/settings.json still apply. See handoff.md section 2.
# If PowerShell blocks scripts, run once:  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
Set-Location -Path $PSScriptRoot
if (-not (Test-Path '.mcp.json')) { Copy-Item 'setup/mcp.json' '.mcp.json' }
if (-not (Test-Path '.claude/settings.json')) { New-Item -ItemType Directory -Force '.claude' | Out-Null; Copy-Item 'setup/claude-settings.json' '.claude/settings.json' }
claude --dangerously-skip-permissions @args
