-- Migration 5: organization profile (HRSD fields), delegates, evaluator profiles.
--  1. Lookups: sub-classifications and social development centers (seeded in the next migration)
--  2. organizations: HRSD profile columns, registration_number required, column protection
--  3. organization_requests: same columns so the admin approves a complete request
--  4. delegates: linked to the organization, ID format, column protection, org/admin policies
--  5. evaluator_profiles
-- Tool, cycle and assessment tables are not touched.

-- ---------------------------------------------------------------
-- 1. Lookups
-- ---------------------------------------------------------------
create type public.entity_type as enum ('association', 'foundation');  -- جمعية أهلية، مؤسسة أهلية

create table public.sub_classifications (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  name       text not null,
  sort_order int  not null default 0
);

create table public.social_dev_centers (
  id     uuid primary key default gen_random_uuid(),
  code   text not null unique,
  name   text not null,
  region text
);

alter table public.sub_classifications enable row level security;
alter table public.social_dev_centers  enable row level security;

-- The public registration form lists both, so anon reads them too.
create policy "sub_classifications: read" on public.sub_classifications for select to anon, authenticated using (true);
create policy "sub_classifications: admin write" on public.sub_classifications for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "social_dev_centers: read" on public.social_dev_centers for select to anon, authenticated using (true);
create policy "social_dev_centers: admin write" on public.social_dev_centers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on public.sub_classifications, public.social_dev_centers from anon;
grant select on public.sub_classifications, public.social_dev_centers to anon;

-- ---------------------------------------------------------------
-- 2. Organizations
-- ---------------------------------------------------------------
alter table public.organizations
  add column entity_type           public.entity_type,
  add column registration_date     date,
  add column sub_classification_id uuid references public.sub_classifications(id),
  add column social_dev_center_id  uuid references public.social_dev_centers(id),
  add column region                text,
  add column city                  text,
  add column district              text,
  add column address               text,
  add column employees_count       int constraint organizations_employees_count_check check (employees_count >= 0),
  add column email                 text,
  add column website               text;

-- Legacy free-text type -> entity_type
update public.organizations set entity_type = case
    when type like 'مؤسسة%' then 'foundation'::public.entity_type
    when type like 'جمعية%' then 'association'::public.entity_type
  end
where entity_type is null;

-- registration_number is already unique (organizations_registration_number_key); now required.
update public.organizations set registration_number = 'TMP-' || left(id::text, 8) where registration_number is null;
alter table public.organizations alter column registration_number set not null;

-- Identity fields are set at approval and changed only by an administrator.
create or replace function public.protect_organization_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.registration_number is distinct from old.registration_number
     or new.entity_type is distinct from old.entity_type
     or new.registration_date is distinct from old.registration_date then
    raise exception 'registration_number, entity_type and registration_date can only be changed by an administrator'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

create trigger trg_protect_organization_columns before update on public.organizations
  for each row execute function public.protect_organization_columns();

-- ---------------------------------------------------------------
-- 3. Organization requests (anon insert policy unchanged)
-- ---------------------------------------------------------------
-- `email` stays the account (login) email; the organization's contact email is organization_email.
alter table public.organization_requests
  add column entity_type           public.entity_type,
  add column registration_date     date,
  add column sub_classification_id uuid references public.sub_classifications(id),
  add column social_dev_center_id  uuid references public.social_dev_centers(id),
  add column region                text,
  add column city                  text,
  add column district              text,
  add column address               text,
  add column employees_count       int constraint organization_requests_employees_count_check check (employees_count >= 0),
  add column organization_email    text,
  add column website               text,
  -- not valid: rows submitted before this migration are kept as they are
  add constraint organization_requests_delegate_id_number_format
    check (delegate_id_number ~ '^[12][0-9]{9}$') not valid;

-- ---------------------------------------------------------------
-- 4. Delegates (the organization representative)
-- ---------------------------------------------------------------
alter table public.delegates
  add column if not exists full_name text,
  add column if not exists id_number text,
  add column if not exists mobile    text,
  add column if not exists email     text,
  add column organization_id uuid references public.organizations(id);

update public.delegates d set organization_id = p.organization_id
from public.profiles p
where p.id = d.user_id and d.organization_id is null;

create index idx_delegates_org on public.delegates (organization_id);

-- An administrator may record a delegate before the representative has an account.
alter table public.delegates alter column user_id drop not null;

-- Saudi national ID (1) or iqama (2), 10 digits. Not valid: existing rows are checked when next edited.
alter table public.delegates
  add constraint delegates_id_number_format check (id_number ~ '^[12][0-9]{9}$') not valid;

-- Non-admins never move a delegate between users/organizations, and never change a recorded ID.
create or replace function public.protect_delegate_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.organization_id is distinct from old.organization_id
     or new.user_id is distinct from old.user_id then
    raise exception 'organization_id and user_id can only be changed by an administrator'
      using errcode = 'insufficient_privilege';
  end if;
  if old.id_number is not null and new.id_number is distinct from old.id_number then
    raise exception 'id_number can only be changed by an administrator once set'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

create trigger trg_protect_delegate_columns before update on public.delegates
  for each row execute function public.protect_delegate_columns();

-- Existing own-row policies (user_id = auth.uid()) stay.
create policy "delegates: admin all" on public.delegates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "delegates: org reads own" on public.delegates for select to authenticated
  using (organization_id = public.current_org_id());
create policy "delegates: org updates own" on public.delegates for update to authenticated
  using (organization_id = public.current_org_id()) with check (organization_id = public.current_org_id());

-- ---------------------------------------------------------------
-- 5. Evaluator profiles
-- ---------------------------------------------------------------
create table public.evaluator_profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null,
  id_number  text constraint evaluator_profiles_id_number_format check (id_number ~ '^[12][0-9]{9}$'),
  mobile     text,
  email      text,
  employer   text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger update_evaluator_profiles_updated_at before update on public.evaluator_profiles
  for each row execute function public.update_updated_at_column();

-- An evaluator edits their own contact fields, never their active flag.
create or replace function public.protect_evaluator_profile_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.is_active is distinct from old.is_active or new.user_id is distinct from old.user_id then
    raise exception 'is_active can only be changed by an administrator'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

create trigger trg_protect_evaluator_profile_columns before update on public.evaluator_profiles
  for each row execute function public.protect_evaluator_profile_columns();

alter table public.evaluator_profiles enable row level security;

create policy "evaluator_profiles: admin all" on public.evaluator_profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "evaluator_profiles: evaluator reads own" on public.evaluator_profiles for select to authenticated
  using (user_id = auth.uid());
create policy "evaluator_profiles: evaluator updates own" on public.evaluator_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- organizations: no policy, no access

revoke all on public.evaluator_profiles from anon;

-- Every existing evaluator gets a profile; full_name starts as the email until an admin edits it.
insert into public.evaluator_profiles (user_id, full_name, email)
select ur.user_id, coalesce(p.email, u.email), coalesce(p.email, u.email)
from public.user_roles ur
join auth.users u on u.id = ur.user_id
left join public.profiles p on p.id = ur.user_id
where ur.role = 'evaluator'
on conflict (user_id) do nothing;
