-- 0002_member_list.sql — list a workspace's members with name + email (Settings → System → Workspace)
-- profiles are private (own row only) and auth.users is not exposed, so members of a workspace
-- read each other's name/email only through this function, and only for workspaces they belong to.
-- Apply after 0001 (SQL Editor or `supabase db push`). The app still works without it (shows ids only).

create or replace function public.workspace_members_list(ws uuid)
returns table (user_id uuid, role text, display_name text, email text, added_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select m.user_id, m.role, p.display_name, u.email::text, m.added_at
  from public.workspace_members m
  join auth.users u on u.id = m.user_id
  left join public.profiles p on p.id = m.user_id
  where m.workspace_id = ws and public.has_ws_role(ws)
  order by case m.role when 'owner' then 0 when 'editor' then 1 else 2 end, m.added_at;
$$;

revoke execute on function public.workspace_members_list(uuid) from public, anon;
grant execute on function public.workspace_members_list(uuid) to authenticated;
