-- Migration 1: assessment tool (CTS) reference tables.
-- Tracks -> standards -> indicators -> items, all pinned to a tool version.
-- An approved version is immutable: any change to the tool is a new version.

create type public.tool_version_status as enum ('draft', 'approved', 'retired');

create table public.tool_versions (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  title            text not null,
  status           public.tool_version_status not null default 'draft',
  source_file_name text,
  source_sha256    char(64),
  approved_at      date,
  approved_by      text,
  created_at       timestamptz not null default now()
);

create table public.tracks (
  id              uuid primary key default gen_random_uuid(),
  tool_version_id uuid not null references public.tool_versions(id) on delete cascade,
  number          smallint not null check (number > 0),
  name            text not null,
  unique (tool_version_id, number)
);

create table public.standards (
  id              uuid primary key default gen_random_uuid(),
  tool_version_id uuid not null references public.tool_versions(id) on delete cascade,
  track_id        uuid not null references public.tracks(id) on delete cascade,
  number          smallint not null check (number > 0),
  name            text not null,
  unique (tool_version_id, number)
);

create table public.indicators (
  id              uuid primary key default gen_random_uuid(),
  tool_version_id uuid not null references public.tool_versions(id) on delete cascade,
  standard_id     uuid not null references public.standards(id) on delete cascade,
  number          smallint not null check (number > 0),
  text            text not null,
  unique (tool_version_id, number)
);

create table public.items (
  id                 uuid primary key default gen_random_uuid(),
  tool_version_id    uuid not null references public.tool_versions(id) on delete cascade,
  indicator_id       uuid not null references public.indicators(id) on delete cascade,
  number             smallint not null check (number > 0),
  text               text not null,
  improvement_action text not null,
  strength_text      text not null,
  opportunity_text   text not null,
  unique (tool_version_id, number)
);

-- Indicator percentage -> level. Stored as configuration, not code.
create table public.level_bands (
  id              uuid primary key default gen_random_uuid(),
  tool_version_id uuid not null references public.tool_versions(id) on delete cascade,
  level           smallint not null check (level >= 0),
  min_pct         smallint not null check (min_pct between 0 and 100),
  max_pct         smallint not null check (max_pct between 0 and 100),
  label           text not null,
  unique (tool_version_id, level),
  check (min_pct <= max_pct)
);

create index idx_standards_track   on public.standards (track_id);
create index idx_indicators_std    on public.indicators (standard_id);
create index idx_items_indicator   on public.items (indicator_id);

-- ---------------------------------------------------------------
-- Immutability: content rows may only change while the version is draft.
-- ---------------------------------------------------------------
create or replace function public.assert_tool_version_draft()
returns trigger language plpgsql set search_path = public as $$
declare v_id uuid; v_status public.tool_version_status;
begin
  v_id := coalesce(new.tool_version_id, old.tool_version_id);
  select status into v_status from public.tool_versions where id = v_id;
  if v_status is distinct from 'draft' then
    raise exception 'Tool version % is %, its content is immutable. Create a new version.', v_id, v_status
      using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end $$;

create trigger trg_tracks_immutable     before insert or update or delete on public.tracks      for each row execute function public.assert_tool_version_draft();
create trigger trg_standards_immutable  before insert or update or delete on public.standards   for each row execute function public.assert_tool_version_draft();
create trigger trg_indicators_immutable before insert or update or delete on public.indicators  for each row execute function public.assert_tool_version_draft();
create trigger trg_items_immutable      before insert or update or delete on public.items       for each row execute function public.assert_tool_version_draft();
create trigger trg_level_bands_immutable before insert or update or delete on public.level_bands for each row execute function public.assert_tool_version_draft();

-- A version can go draft -> approved -> retired, never back.
create or replace function public.assert_tool_version_transition()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status = 'approved' and new.status = 'draft' then
    raise exception 'An approved tool version cannot return to draft' using errcode = 'check_violation';
  end if;
  if old.status = 'retired' and new.status <> 'retired' then
    raise exception 'A retired tool version cannot be reactivated' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger trg_tool_versions_transition before update on public.tool_versions
  for each row execute function public.assert_tool_version_transition();

-- ---------------------------------------------------------------
-- Row level security: every signed-in user reads the tool; only admins write.
-- ---------------------------------------------------------------
alter table public.tool_versions enable row level security;
alter table public.tracks        enable row level security;
alter table public.standards     enable row level security;
alter table public.indicators    enable row level security;
alter table public.items         enable row level security;
alter table public.level_bands   enable row level security;

create policy "tool: authenticated read"  on public.tool_versions for select to authenticated using (true);
create policy "tool: admin write"         on public.tool_versions for all    to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "tracks: authenticated read" on public.tracks for select to authenticated using (true);
create policy "tracks: admin write"        on public.tracks for all    to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "standards: authenticated read" on public.standards for select to authenticated using (true);
create policy "standards: admin write"        on public.standards for all    to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "indicators: authenticated read" on public.indicators for select to authenticated using (true);
create policy "indicators: admin write"        on public.indicators for all    to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "items: authenticated read" on public.items for select to authenticated using (true);
create policy "items: admin write"        on public.items for all    to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "level_bands: authenticated read" on public.level_bands for select to authenticated using (true);
create policy "level_bands: admin write"        on public.level_bands for all    to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Lovable granted anon full table privileges by default; the tool is not public.
revoke all on public.tool_versions, public.tracks, public.standards, public.indicators, public.items, public.level_bands from anon;
