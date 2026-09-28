@echo off
REM Starts Claude Code in this folder with permission prompts skipped (bypassPermissions).
REM First run: installs .mcp.json and .claude\settings.json from the setup folder if missing.
REM Deny rules in .claude\settings.json still apply. See handoff.md section 2.
cd /d "%~dp0"
if not exist ".mcp.json" copy /Y "setup\mcp.json" ".mcp.json" >nul
if not exist ".claude" mkdir ".claude"
if not exist ".claude\settings.json" copy /Y "setup\claude-settings.json" ".claude\settings.json" >nul
claude --dangerously-skip-permissions %*
