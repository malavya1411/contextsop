-- Migration to resolve JWT org_id issues and configure updated RLS policies

-- 1. Create a helper function to get org_id from auth claims or metadata
create or replace function public.get_auth_org_id()
returns text
language plpgsql
security definer
as $$
begin
  return coalesce(
    auth.jwt() ->> 'org_id',
    auth.jwt() -> 'app_metadata' ->> 'org_id',
    auth.jwt() -> 'user_metadata' ->> 'org_id',
    ''
  );
end;
$$;

-- 2. Update public.handle_new_user() trigger to inject org_id into auth.users metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  org_id uuid;
  org_name text;
begin
  -- Check if user is joining an existing organization via metadata
  if new.raw_user_meta_data->>'org_id' is not null then
    org_id := (new.raw_user_meta_data->>'org_id')::uuid;
  else
    -- Create a new organization
    org_name := coalesce(new.raw_user_meta_data->>'org_name', 'My Organization');
    insert into public.organizations (name)
    values (org_name)
    returning id into org_id;
  end if;

  -- Create profile linking the user to the organization
  insert into public.profiles (id, organization_id, email, role)
  values (new.id, org_id, new.email, coalesce(new.raw_user_meta_data->>'role', 'member'));

  -- Inject org_id into raw_user_meta_data and raw_app_meta_data to ensure fallback resolves
  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('org_id', org_id),
      raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('org_id', org_id)
  where id = new.id;

  return new;
end;
$$;

-- 3. Retroactively populate metadata for any existing users
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('org_id', p.organization_id),
    raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('org_id', p.organization_id)
from public.profiles p
where auth.users.id = p.id;

-- 4. Recreate RLS policies with fallback support
drop policy if exists "members can read their organization" on public.organizations;
drop policy if exists "owners can update their organization" on public.organizations;
drop policy if exists "members can read their profile" on public.profiles;
drop policy if exists "users can update their own profile" on public.profiles;
drop policy if exists "tenant isolation for sops" on public.sops;
drop policy if exists "tenant isolation for projects" on public.projects;
drop policy if exists "tenant isolation for sop_versions" on public.sop_versions;
drop policy if exists "tenant isolation for sop_executions" on public.sop_executions;

-- Organizations Select & Update policies
create policy "members can read their organization" on public.organizations for select to authenticated
  using (id::text = public.get_auth_org_id());

create policy "owners can update their organization" on public.organizations for update to authenticated
  using (id::text = public.get_auth_org_id())
  with check (id::text = public.get_auth_org_id());

-- Profiles Select & Update policies
create policy "members can read their profile" on public.profiles for select to authenticated
  using (organization_id::text = public.get_auth_org_id() or id = auth.uid());

create policy "users can update their own profile" on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- SOPs policies
create policy "tenant isolation for sops" on public.sops for all to authenticated
  using (organization_id::text = public.get_auth_org_id())
  with check (organization_id::text = public.get_auth_org_id());

-- Projects policies
create policy "tenant isolation for projects" on public.projects for all to authenticated
  using (organization_id::text = public.get_auth_org_id())
  with check (organization_id::text = public.get_auth_org_id());

-- SOP Versions policies
create policy "tenant isolation for sop_versions" on public.sop_versions for all to authenticated
  using (
    exists (
      select 1 from public.sops
      where sops.id = sop_versions.sop_id
      and sops.organization_id::text = public.get_auth_org_id()
    )
  )
  with check (
    exists (
      select 1 from public.sops
      where sops.id = sop_versions.sop_id
      and sops.organization_id::text = public.get_auth_org_id()
    )
  );

-- SOP Executions policies
create policy "tenant isolation for sop_executions" on public.sop_executions for all to authenticated
  using (organization_id::text = public.get_auth_org_id())
  with check (organization_id::text = public.get_auth_org_id());
