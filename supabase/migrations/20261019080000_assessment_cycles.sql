-- Migration 2: operational assessment model.
-- cycle -> assessment (one per organization per cycle) -> item responses + evidences.
-- The legacy tables (evaluator_assignments, criterion_evaluations, evaluation_evidences,
-- evaluation_criteria, evaluation_messages) stay untouched until the UI is moved; a later
-- cleanup migration drops them.

create type public.cycle_status      as enum ('draft', 'open', 'closed', 'archived');
create type public.assessment_status as enum ('draft', 'submitted', 'under_review', 'returned', 'approved');
create type public.evidence_kind     as enum ('file', 'link');

-- ---------------------------------------------------------------
-- Cycles
-- ---------------------------------------------------------------
create table public.assessment_cycles (
  id               uuid primary key default gen_random_uuid(),
  name             text not null unique,
  tool_version_id  uuid not null references public.tool_versions(id),
  status           public.cycle_status not null default 'draft',
  submission_start date not null,
  submission_end   date not null,
  review_start     date not null,
  review_end       date not null,
  approval_start   date not null,
  approval_end     date not null,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- periods are ordered and may touch but not overlap
  constraint cycle_periods_ordered check (
    submission_start <= submission_end
    and submission_end <= review_start
    and review_start  <= review_end
    and review_end    <= approval_start
    and approval_start <= approval_end
  )
);

-- Only one open cycle at any time.
create unique index uq_one_open_cycle on public.assessment_cycles ((true)) where status = 'open';

create trigger update_assessment_cycles_updated_at before update on public.assessment_cycles
  for each row execute function public.update_updated_at_column();

-- A cycle may only open on an approved tool version; a closed/archived cycle never reopens.
create or replace function public.assert_cycle_rules()
returns trigger language plpgsql set search_path = public as $$
declare v_status public.tool_version_status;
begin
  if new.status = 'open' then
    select status into v_status from public.tool_versions where id = new.tool_version_id;
    if v_status is distinct from 'approved' then
      raise exception 'Cycle can only open on an approved tool version' using errcode = 'check_violation';
    end if;
  end if;
  if tg_op = 'UPDATE' then
    if old.status in ('closed', 'archived') and new.status in ('draft', 'open') then
      raise exception 'A closed or archived cycle cannot reopen' using errcode = 'check_violation';
    end if;
    if old.tool_version_id <> new.tool_version_id and old.status <> 'draft' then
      raise exception 'Tool version is fixed once a cycle leaves draft' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;

create trigger trg_cycle_rules before insert or update on public.assessment_cycles
  for each row execute function public.assert_cycle_rules();

-- ---------------------------------------------------------------
-- Assessments
-- ---------------------------------------------------------------
create table public.assessments (
  id              uuid primary key default gen_random_uuid(),
  cycle_id        uuid not null references public.assessment_cycles(id),
  organization_id uuid not null references public.organizations(id),
  status          public.assessment_status not null default 'draft',
  submitted_at    timestamptz,
  returned_at     timestamptz,
  approved_at     timestamptz,
  return_note     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (cycle_id, organization_id)
);

create index idx_assessments_org    on public.assessments (organization_id);
create index idx_assessments_cycle  on public.assessments (cycle_id, status);

create trigger update_assessments_updated_at before update on public.assessments
  for each row execute function public.update_updated_at_column();

-- Evaluator assignment: one evaluator per assessment (replaces evaluator_assignments).
create table public.assessment_reviews (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null unique references public.assessments(id) on delete cascade,
  evaluator_id  uuid not null references auth.users(id),
  assigned_by   uuid references auth.users(id),
  assigned_at   timestamptz not null default now()
);

create index idx_reviews_evaluator on public.assessment_reviews (evaluator_id);

-- Every status change, who and when. Written by the transition function (migration 3).
create table public.assessment_status_history (
  id            bigint generated always as identity primary key,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  from_status   public.assessment_status,
  to_status     public.assessment_status not null,
  changed_by    uuid references auth.users(id),
  note          text,
  changed_at    timestamptz not null default now()
);

create index idx_status_history_assessment on public.assessment_status_history (assessment_id, changed_at);

-- ---------------------------------------------------------------
-- Responses and evidences (item level)
-- ---------------------------------------------------------------
create table public.item_responses (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  item_id       uuid not null references public.items(id),
  is_met        boolean not null default false,  -- organization's self-assessment
  org_note      text,
  -- evaluator verdict, filled during review
  verified      boolean,
  evaluator_note text,
  updated_by    uuid references auth.users(id),
  updated_at    timestamptz not null default now(),
  unique (assessment_id, item_id)
);

create index idx_item_responses_assessment on public.item_responses (assessment_id);

create trigger update_item_responses_updated_at before update on public.item_responses
  for each row execute function public.update_updated_at_column();

create table public.evidences (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  item_id       uuid not null references public.items(id),
  kind          public.evidence_kind not null,
  storage_path  text,          -- evidences/{assessment_id}/{item_id}/{uuid}.{ext}
  url           text,
  file_name     text,
  mime_type     text,
  size_bytes    bigint check (size_bytes is null or size_bytes <= 20 * 1024 * 1024),
  uploaded_by   uuid not null references auth.users(id),
  uploaded_at   timestamptz not null default now(),
  constraint evidence_kind_payload check (
    (kind = 'file' and storage_path is not null and url is null)
    or (kind = 'link' and url is not null and storage_path is null)
  )
);

create index idx_evidences_assessment_item on public.evidences (assessment_id, item_id);

-- The response/evidence item must belong to the cycle's tool version.
create or replace function public.assert_item_matches_cycle_tool()
returns trigger language plpgsql set search_path = public as $$
declare v_tool uuid; v_item_tool uuid;
begin
  select c.tool_version_id into v_tool
  from public.assessments a join public.assessment_cycles c on c.id = a.cycle_id
  where a.id = new.assessment_id;
  select tool_version_id into v_item_tool from public.items where id = new.item_id;
  if v_tool is distinct from v_item_tool then
    raise exception 'Item does not belong to the tool version of this assessment cycle' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger trg_item_responses_tool before insert or update on public.item_responses
  for each row execute function public.assert_item_matches_cycle_tool();
create trigger trg_evidences_tool before insert or update on public.evidences
  for each row execute function public.assert_item_matches_cycle_tool();

-- ---------------------------------------------------------------
-- Storage bucket for evidence files (private, signed URLs only)
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidences', 'evidences', false, 20971520,
  array['application/pdf','image/png','image/jpeg',
        'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------
-- RLS: enabled now with admin-only access. Organization and evaluator
-- policies arrive in migration 3 together with the transition function.
-- ---------------------------------------------------------------
alter table public.assessment_cycles         enable row level security;
alter table public.assessments               enable row level security;
alter table public.assessment_reviews        enable row level security;
alter table public.assessment_status_history enable row level security;
alter table public.item_responses            enable row level security;
alter table public.evidences                 enable row level security;

create policy "cycles: authenticated read" on public.assessment_cycles for select to authenticated using (true);
create policy "cycles: admin write" on public.assessment_cycles for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "assessments: admin all" on public.assessments for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "reviews: admin all" on public.assessment_reviews for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "history: admin read" on public.assessment_status_history for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "responses: admin all" on public.item_responses for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "evidences: admin all" on public.evidences for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

revoke all on public.assessment_cycles, public.assessments, public.assessment_reviews,
  public.assessment_status_history, public.item_responses, public.evidences from anon;
