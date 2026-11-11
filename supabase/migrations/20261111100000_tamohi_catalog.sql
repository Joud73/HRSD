-- Migration 14: طموحي, the learning catalog integrated with مركز التمكين.
--
-- Structure (competency-mapped to the approved measurement tool):
--   program  = one standard (15)       programs.standard_id
--   module   = one indicator (61)      program_modules.indicator_id
--   lesson   = one verification item   program_lessons.item_id; objective = items.improvement_action
-- A lesson closes exactly one item, so an organization's unconfirmed items point to the lessons that close them.
--
-- Access: signed-in users only (the curriculum quotes the tool's items, which anon cannot read).
-- Personalisation reads issued results only. v_program_recommendations stays the contract the readiness
-- tool may replace; it keeps its columns and gains gap counts.

-- ---------------------------------------------------------------
-- Program metadata
-- ---------------------------------------------------------------
alter table public.programs
  add column if not exists subtitle     text,
  add column if not exists audience     text,
  add column if not exists outcomes     text[] not null default '{}',
  add column if not exists standard_id  uuid references public.standards(id);

create index if not exists idx_programs_standard on public.programs (standard_id);

-- Catalog read: signed-in users (anon keeps no access to anything that quotes the tool)
drop policy if exists "programs: public read" on public.programs;
create policy "programs: signed-in read" on public.programs for select to authenticated using (is_active);
drop policy if exists "program_indicators: public read" on public.program_indicators;
create policy "program_indicators: signed-in read" on public.program_indicators for select to authenticated using (true);
revoke all on public.programs, public.program_indicators from anon;

-- ---------------------------------------------------------------
-- Curriculum
-- ---------------------------------------------------------------
create table public.program_modules (
  id            uuid primary key default gen_random_uuid(),
  program_id    uuid not null references public.programs(id) on delete cascade,
  indicator_id  uuid references public.indicators(id),
  number        smallint not null,
  title         text not null,
  summary       text,
  unique (program_id, number)
);

create table public.program_lessons (
  id                uuid primary key default gen_random_uuid(),
  module_id         uuid not null references public.program_modules(id) on delete cascade,
  item_id           uuid references public.items(id),
  number            smallint not null,
  title             text not null,          -- what the organization has in place after the lesson (the item)
  objective         text not null,          -- how to get there (the item's improvement action)
  kind              text not null check (kind in ('practice', 'template', 'checkpoint')),
  duration_minutes  smallint not null check (duration_minutes between 5 and 240),
  unique (module_id, number)
);
create index idx_program_lessons_item on public.program_lessons (item_id);

alter table public.program_modules enable row level security;
alter table public.program_lessons enable row level security;
create policy "modules: signed-in read" on public.program_modules for select to authenticated
  using (exists (select 1 from public.programs p where p.id = program_id and p.is_active));
create policy "modules: admin write" on public.program_modules for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "lessons: signed-in read" on public.program_lessons for select to authenticated
  using (exists (select 1 from public.program_modules m join public.programs p on p.id = m.program_id
                 where m.id = module_id and p.is_active));
create policy "lessons: admin write" on public.program_lessons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
revoke all on public.program_modules, public.program_lessons from anon;
grant select on public.program_modules, public.program_lessons to authenticated;

-- ---------------------------------------------------------------
-- Enrollment and progress (organization level)
-- ---------------------------------------------------------------
create table public.program_enrollments (
  id               uuid primary key default gen_random_uuid(),
  program_id       uuid not null references public.programs(id) on delete cascade,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  assessment_id    uuid references public.assessments(id) on delete set null,  -- the issued result it answers
  status           text not null default 'enrolled' check (status in ('enrolled', 'in_progress', 'completed')),
  enrolled_by      uuid references auth.users(id),
  enrolled_at      timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  completed_at     timestamptz,
  unique (program_id, organization_id)
);
create trigger update_program_enrollments_updated_at before update on public.program_enrollments
  for each row execute function public.update_updated_at_column();

create table public.lesson_progress (
  enrollment_id  uuid not null references public.program_enrollments(id) on delete cascade,
  lesson_id      uuid not null references public.program_lessons(id) on delete cascade,
  completed_by   uuid references auth.users(id),
  completed_at   timestamptz not null default now(),
  primary key (enrollment_id, lesson_id)
);

-- Status follows progress: first lesson done -> in_progress; every lesson done -> completed.
create or replace function public.sync_enrollment_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_enrollment uuid := coalesce(new.enrollment_id, old.enrollment_id);
        v_done int; v_total int;
begin
  select count(*) into v_done from public.lesson_progress where enrollment_id = v_enrollment;
  select count(*) into v_total
  from public.program_lessons l join public.program_modules m on m.id = l.module_id
  join public.program_enrollments e on e.program_id = m.program_id
  where e.id = v_enrollment;
  update public.program_enrollments
     set status = case when v_total > 0 and v_done >= v_total then 'completed'
                       when v_done > 0 then 'in_progress' else 'enrolled' end,
         completed_at = case when v_total > 0 and v_done >= v_total then coalesce(completed_at, now()) else null end
   where id = v_enrollment;
  return null;
end $$;
create trigger trg_sync_enrollment_status after insert or delete on public.lesson_progress
  for each row execute function public.sync_enrollment_status();

-- The organization owns its enrollments; status and timestamps are maintained by the database.
create or replace function public.protect_enrollment_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() or pg_trigger_depth() > 1 then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'enrolled';
    new.enrolled_by := auth.uid();
    new.enrolled_at := now();
    new.completed_at := null;
  else
    raise exception 'Enrollments change through lesson progress only' using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;
create trigger trg_protect_enrollment_columns before insert or update on public.program_enrollments
  for each row execute function public.protect_enrollment_columns();

alter table public.program_enrollments enable row level security;
alter table public.lesson_progress enable row level security;

create policy "enrollments: org reads own" on public.program_enrollments for select to authenticated
  using (organization_id = public.current_org_id());
create policy "enrollments: org enrolls itself" on public.program_enrollments for insert to authenticated
  with check (organization_id = public.current_org_id());
create policy "enrollments: org withdraws before starting" on public.program_enrollments for delete to authenticated
  using (organization_id = public.current_org_id() and status = 'enrolled');
create policy "enrollments: supervisor reads" on public.program_enrollments for select to authenticated
  using (public.is_supervisor());
create policy "enrollments: admin all" on public.program_enrollments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "progress: org reads own" on public.lesson_progress for select to authenticated
  using (exists (select 1 from public.program_enrollments e where e.id = enrollment_id and e.organization_id = public.current_org_id()));
create policy "progress: org records own" on public.lesson_progress for insert to authenticated
  with check (exists (
    select 1 from public.program_enrollments e
    join public.program_modules m on m.program_id = e.program_id
    join public.program_lessons l on l.module_id = m.id
    where e.id = enrollment_id and l.id = lesson_id and e.organization_id = public.current_org_id()));
create policy "progress: org clears own" on public.lesson_progress for delete to authenticated
  using (exists (select 1 from public.program_enrollments e where e.id = enrollment_id and e.organization_id = public.current_org_id()));
create policy "progress: supervisor reads" on public.lesson_progress for select to authenticated
  using (public.is_supervisor());
create policy "progress: admin all" on public.lesson_progress for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.stamp_lesson_progress()
returns trigger language plpgsql set search_path = public as $$
begin
  new.completed_by := coalesce(auth.uid(), new.completed_by);
  new.completed_at := now();
  return new;
end $$;
create trigger trg_stamp_lesson_progress before insert on public.lesson_progress
  for each row execute function public.stamp_lesson_progress();

revoke all on public.program_enrollments, public.lesson_progress from anon;
grant select, insert, delete on public.program_enrollments, public.lesson_progress to authenticated;

-- ---------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------
-- Catalog card data in one read
create view public.v_program_catalog with (security_invoker = true) as
select p.id as program_id, p.code, p.title, p.subtitle, p.summary, p.audience, p.outcomes,
       p.delivery, p.level_min, p.level_max, p.url, p.sort_order,
       t.id as track_id, t.number as track_number, t.name as track_name,
       s.id as standard_id, s.number as standard_number, s.name as standard_name,
       (select count(*) from public.program_modules m where m.program_id = p.id)::int as modules_count,
       (select count(*) from public.program_lessons l join public.program_modules m on m.id = l.module_id where m.program_id = p.id)::int as lessons_count,
       (select coalesce(sum(l.duration_minutes), 0) from public.program_lessons l join public.program_modules m on m.id = l.module_id where m.program_id = p.id)::int as total_minutes
from public.programs p
left join public.standards s on s.id = p.standard_id
left join public.tracks t on t.id = coalesce(s.track_id, p.track_id)
where p.is_active;

-- Lesson-level gaps for an issued assessment: a lesson is a gap when its item was not confirmed by the evaluator
create view public.v_program_lesson_gaps with (security_invoker = true) as
select a.id as assessment_id, m.program_id, m.id as module_id, l.id as lesson_id, l.item_id,
       not coalesce(v.review_counted, false) as is_gap,
       v.verified
from public.assessments a
join public.v_item_scores v on v.assessment_id = a.id
join public.program_lessons l on l.item_id = v.item_id
join public.program_modules m on m.id = l.module_id
join public.programs p on p.id = m.program_id and p.is_active
where a.status = 'issued';

-- The recommendation contract (readiness tool may replace the body; keep the columns).
-- Recommended when at least one of the program's indicators has a frozen review level inside its range.
create or replace view public.v_program_recommendations with (security_invoker = true) as
with matched as (
  select r.assessment_id, p.id as program_id, p.code, p.title, p.url, p.track_id,
         count(*)::int as matched_indicators,
         min(r.review_level)::smallint as lowest_level,
         array_agg(r.indicator_id order by r.review_level, r.indicator_number) as indicator_ids
  from public.assessment_results r
  join public.program_indicators pi on pi.indicator_id = r.indicator_id
  join public.programs p on p.id = pi.program_id and p.is_active
  where r.review_level between p.level_min and p.level_max
  group by r.assessment_id, p.id, p.code, p.title, p.url, p.track_id
),
gaps as (
  select g.assessment_id, g.program_id,
         count(*) filter (where g.is_gap)::int as gap_lessons,
         count(*)::int as lessons_total
  from public.v_program_lesson_gaps g
  group by g.assessment_id, g.program_id
)
select m.assessment_id, m.program_id, m.code, m.title, m.url, m.track_id,
       m.matched_indicators, m.lowest_level, m.indicator_ids,
       coalesce(g.gap_lessons, 0) as gap_lessons,
       coalesce(g.lessons_total, 0) as lessons_total,
       case when m.lowest_level <= 1 then 'high' else 'medium' end as priority,
       row_number() over (partition by m.assessment_id
                          order by m.lowest_level, coalesce(g.gap_lessons, 0) desc, m.code)::int as rank
from matched m
left join gaps g on g.assessment_id = m.assessment_id and g.program_id = m.program_id;

-- Per enrollment: lessons done / total
create view public.v_enrollment_progress with (security_invoker = true) as
select e.id as enrollment_id, e.program_id, e.organization_id, e.status, e.enrolled_at, e.completed_at,
       (select count(*) from public.lesson_progress lp where lp.enrollment_id = e.id)::int as lessons_done,
       (select count(*) from public.program_lessons l join public.program_modules m on m.id = l.module_id
         where m.program_id = e.program_id)::int as lessons_total
from public.program_enrollments e;

revoke all on public.v_program_catalog, public.v_program_lesson_gaps, public.v_program_recommendations, public.v_enrollment_progress from anon;
grant select on public.v_program_catalog, public.v_program_lesson_gaps, public.v_program_recommendations, public.v_enrollment_progress to authenticated;
