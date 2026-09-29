-- 0003_lock_trigger_functions.sql — Security Advisor clean-up (2026-09-29)
-- handle_new_user() and handle_new_workspace() are trigger functions. Postgres grants EXECUTE to
-- PUBLIC by default, so the Data API listed them as callable by anon/signed-in users. Nobody needs
-- to call them directly (firing a trigger does not check EXECUTE), so revoke it.
-- has_ws_role, invite_member, save_workspace and workspace_members_list stay callable by
-- signed-in users on purpose: each checks workspace membership itself.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_workspace() from public, anon, authenticated;
