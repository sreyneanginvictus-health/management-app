-- 0001_workspaces.sql — accounts + cloud-saved workspaces (handoff.md §15 P0)
-- Apply in Supabase SQL Editor or with `supabase db push`. Verified 2026-09-29 on Postgres 16
-- with a mock auth schema: owner/editor/viewer/anon/stranger access, conflicts, owner protection.

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
