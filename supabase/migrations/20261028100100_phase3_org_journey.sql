-- Migration 7: Phase 3, organization journey.
--  1. Lookups seed (provisional until ملف التصنيفات from HRSD replaces it)
--  2. Per-cycle item exclusions (admin selects / deselects items, never edits their text)
--  3. Supervisor role: helper and read policies, evaluator assignment rights
--  4. Missing organization policies (org updates own profile, evaluator reads assessed org)
--  5. Scoring and progress views: one definition for dashboard, review and reports
--  6. Grants

-- ---------------------------------------------------------------
-- 1. Lookups (PROVISIONAL)
-- Codes prefixed TMP- are placeholders. When the ministry's ملف التصنيفات arrives, insert the
-- official rows and retire these by deleting rows whose code starts with TMP- that no organization
-- references. Deterministic ids keep staging and prod identical.
-- ---------------------------------------------------------------
insert into public.sub_classifications (id, code, name, sort_order) values
  (md5('tmk-subclass-01')::uuid, 'TMP-SC-01', 'الرعاية الاجتماعية', 10),
  (md5('tmk-subclass-02')::uuid, 'TMP-SC-02', 'الصحة', 20),
  (md5('tmk-subclass-03')::uuid, 'TMP-SC-03', 'التعليم والتدريب', 30),
  (md5('tmk-subclass-04')::uuid, 'TMP-SC-04', 'الأسرة والطفولة', 40),
  (md5('tmk-subclass-05')::uuid, 'TMP-SC-05', 'ذوو الإعاقة', 50),
  (md5('tmk-subclass-06')::uuid, 'TMP-SC-06', 'الأيتام', 60),
  (md5('tmk-subclass-07')::uuid, 'TMP-SC-07', 'كبار السن', 70),
  (md5('tmk-subclass-08')::uuid, 'TMP-SC-08', 'التنمية المجتمعية', 80),
  (md5('tmk-subclass-09')::uuid, 'TMP-SC-09', 'البيئة', 90),
  (md5('tmk-subclass-10')::uuid, 'TMP-SC-10', 'الثقافة والتراث', 100),
  (md5('tmk-subclass-11')::uuid, 'TMP-SC-11', 'التطوع والعمل الخيري', 110),
  (md5('tmk-subclass-12')::uuid, 'TMP-SC-12', 'أخرى', 999)
on conflict (id) do nothing;

insert into public.social_dev_centers (id, code, name, region) values
  (md5('tmk-sdc-01')::uuid, 'TMP-SDC-01', 'مركز التنمية الاجتماعية بالرياض', 'الرياض'),
  (md5('tmk-sdc-02')::uuid, 'TMP-SDC-02', 'مركز التنمية الاجتماعية بجدة', 'مكة المكرمة'),
  (md5('tmk-sdc-03')::uuid, 'TMP-SDC-03', 'مركز التنمية الاجتماعية بمكة المكرمة', 'مكة المكرمة'),
  (md5('tmk-sdc-04')::uuid, 'TMP-SDC-04', 'مركز التنمية الاجتماعية بالمدينة المنورة', 'المدينة المنورة'),
  (md5('tmk-sdc-05')::uuid, 'TMP-SDC-05', 'مركز التنمية الاجتماعية بالدمام', 'الشرقية'),
  (md5('tmk-sdc-06')::uuid, 'TMP-SDC-06', 'مركز التنمية الاجتماعية بالأحساء', 'الشرقية'),
  (md5('tmk-sdc-07')::uuid, 'TMP-SDC-07', 'مركز التنمية الاجتماعية بالقصيم', 'القصيم'),
  (md5('tmk-sdc-08')::uuid, 'TMP-SDC-08', 'مركز التنمية الاجتماعية بعسير', 'عسير'),
  (md5('tmk-sdc-09')::uuid, 'TMP-SDC-09', 'مركز التنمية الاجتماعية بتبوك', 'تبوك'),
  (md5('tmk-sdc-10')::uuid, 'TMP-SDC-10', 'مركز التنمية الاجتماعية بحائل', 'حائل'),
  (md5('tmk-sdc-11')::uuid, 'TMP-SDC-11', 'مركز التنمية الاجتماعية بالحدود الشمالية', 'الحدود الشمالية'),
  (md5('tmk-sdc-12')::uuid, 'TMP-SDC-12', 'مركز التنمية الاجتماعية بجازان', 'جازان'),
  (md5('tmk-sdc-13')::uuid, 'TMP-SDC-13', 'مركز التنمية الاجتماعية بنجران', 'نجران'),
  (md5('tmk-sdc-14')::uuid, 'TMP-SDC-14', 'مركز التنمية الاجتماعية بالباحة', 'الباحة'),
  (md5('tmk-sdc-15')::uuid, 'TMP-SDC-15', 'مركز التنمية الاجتماعية بالجوف', 'الجوف')
on conflict (id) do nothing;

-- ---------------------------------------------------------------
-- 2. Per-cycle item exclusions
-- The tool version stays immutable. An administrator may exclude items from a cycle; excluded
-- items disappear from the organization's form and from every denominator in the scoring views.
-- Exclusions may change only while the cycle is draft or open (a closed cycle is history).
-- ---------------------------------------------------------------
create table public.cycle_item_exclusions (
  cycle_id    uuid not null references public.assessment_cycles(id) on delete cascade,
  item_id     uuid not null references public.items(id),
  reason      text,
  excluded_by uuid references auth.users(id),
  excluded_at timestamptz not null default now(),
  primary key (cycle_id, item_id)
);

create index idx_cycle_item_exclusions_item on public.cycle_item_exclusions (item_id);

create or replace function public.assert_exclusion_rules()
returns trigger language plpgsql set search_path = public as $$
declare v_cycle public.assessment_cycles%rowtype; v_item_tool uuid;
begin
  select * into v_cycle from public.assessment_cycles where id = coalesce(new.cycle_id, old.cycle_id);
  if v_cycle.status not in ('draft', 'open') then
    raise exception 'Item exclusions can only change while the cycle is draft or open' using errcode = 'check_violation';
  end if;
  if tg_op <> 'DELETE' then
    select tool_version_id into v_item_tool from public.items where id = new.item_id;
    if v_item_tool is distinct from v_cycle.tool_version_id then
      raise exception 'Item does not belong to the tool version of this cycle' using errcode = 'check_violation';
    end if;
    new.excluded_by := coalesce(new.excluded_by, auth.uid());
  end if;
  return coalesce(new, old);
end $$;

create trigger trg_cycle_item_exclusions_rules before insert or update or delete on public.cycle_item_exclusions
  for each row execute function public.assert_exclusion_rules();

alter table public.cycle_item_exclusions enable row level security;

-- Everyone signed in reads exclusions (the form must hide excluded items); only admins write.
create policy "exclusions: authenticated read" on public.cycle_item_exclusions for select to authenticated using (true);
create policy "exclusions: admin write" on public.cycle_item_exclusions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on public.cycle_item_exclusions from anon;

-- Responses and evidences may not target an excluded item.
create or replace function public.assert_item_not_excluded()
returns trigger language plpgsql set search_path = public as $$
begin
  if exists (
    select 1 from public.assessments a
    join public.cycle_item_exclusions x on x.cycle_id = a.cycle_id and x.item_id = new.item_id
    where a.id = new.assessment_id
  ) then
    raise exception 'Item is excluded from this assessment cycle' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger trg_item_responses_not_excluded before insert or update on public.item_responses
  for each row execute function public.assert_item_not_excluded();
create trigger trg_evidences_not_excluded before insert or update on public.evidences
  for each row execute function public.assert_item_not_excluded();

-- ---------------------------------------------------------------
-- 3. Supervisor (مشرف المراجعة): follows the review process across all organizations.
-- Reads everything in the assessment domain, assigns evaluators, never edits answers or verdicts.
-- Status changes stay with the evaluator and the admin (transition_assessment is unchanged).
-- ---------------------------------------------------------------
create or replace function public.is_supervisor()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'supervisor')
$$;

grant execute on function public.is_supervisor() to authenticated;

create policy "assessments: supervisor reads all" on public.assessments for select to authenticated
  using (public.is_supervisor());
create policy "reviews: supervisor manages" on public.assessment_reviews for all to authenticated
  using (public.is_supervisor()) with check (public.is_supervisor());
create policy "history: supervisor reads all" on public.assessment_status_history for select to authenticated
  using (public.is_supervisor());
create policy "responses: supervisor reads all" on public.item_responses for select to authenticated
  using (public.is_supervisor());
create policy "evidences: supervisor reads all" on public.evidences for select to authenticated
  using (public.is_supervisor());
create policy "evidence files: supervisor reads all" on storage.objects for select to authenticated
  using (bucket_id = 'evidences' and public.is_supervisor());
create policy "organizations: supervisor reads all" on public.organizations for select to authenticated
  using (public.is_supervisor());
create policy "profiles: supervisor reads all" on public.profiles for select to authenticated
  using (public.is_supervisor());
create policy "delegates: supervisor reads all" on public.delegates for select to authenticated
  using (public.is_supervisor());
create policy "evaluator_profiles: supervisor reads all" on public.evaluator_profiles for select to authenticated
  using (public.is_supervisor());
create policy "user_roles: supervisor reads all" on public.user_roles for select to authenticated
  using (public.is_supervisor());

-- The supervisor assigns evaluators; column protection on item_responses already rejects
-- verdict edits from anyone who is not the assigned evaluator or an admin.

-- ---------------------------------------------------------------
-- 4. Organization policies that were missing
-- ---------------------------------------------------------------
-- The organization edits its own profile (identity columns are frozen by protect_organization_columns).
create policy "organizations: org updates own" on public.organizations for update to authenticated
  using (id = public.current_org_id()) with check (id = public.current_org_id());

-- The assigned evaluator reads the organization of the assessment assigned to them (new model).
create policy "organizations: evaluator reads assessed" on public.organizations for select to authenticated
  using (exists (
    select 1 from public.assessments a
    where a.organization_id = organizations.id and public.is_assigned_evaluator(a.id)
  ));

-- ---------------------------------------------------------------
-- 5. Scoring and progress views (security_invoker: RLS of the base tables applies to the caller)
--
-- Approved rule (HRSD, Oct 2026):
--   * items inside an indicator carry equal weight; no per-item weights
--   * an item counts toward the score only when the organization marked it met AND attached
--     at least one evidence (file or link)
--   * indicator pct = round(100 * counted items / active items); level from level_bands
--     (0 -> 0, 1..60 -> 1, 61..99 -> 2, 100 -> 4)
--   * track score = average of its indicators' levels; assessment score = average over all indicators
-- Progress (how far the organization is) is separate from score (what it will be credited):
--   progress counts items marked met regardless of evidence.
-- ---------------------------------------------------------------

-- Every active item of every assessment, with the organization's answer and its evidence count.
create view public.v_item_scores with (security_invoker = true) as
select
  a.id                                   as assessment_id,
  a.cycle_id,
  a.organization_id,
  t.id                                   as track_id,
  t.number                               as track_number,
  s.id                                   as standard_id,
  ind.id                                 as indicator_id,
  ind.number                             as indicator_number,
  i.id                                   as item_id,
  i.number                               as item_number,
  coalesce(r.is_met, false)              as is_met,
  coalesce(e.evidence_count, 0)::int     as evidence_count,
  (coalesce(r.is_met, false) and coalesce(e.evidence_count, 0) > 0) as counted
from public.assessments a
join public.assessment_cycles c on c.id = a.cycle_id
join public.items i             on i.tool_version_id = c.tool_version_id
join public.indicators ind      on ind.id = i.indicator_id
join public.standards s         on s.id = ind.standard_id
join public.tracks t            on t.id = s.track_id
left join public.item_responses r on r.assessment_id = a.id and r.item_id = i.id
left join (
  select assessment_id, item_id, count(*) as evidence_count
  from public.evidences group by assessment_id, item_id
) e on e.assessment_id = a.id and e.item_id = i.id
where not exists (
  select 1 from public.cycle_item_exclusions x where x.cycle_id = a.cycle_id and x.item_id = i.id
);

-- Indicator score: pct and level per assessment and indicator.
create view public.v_indicator_scores with (security_invoker = true) as
with agg as (
  select
    v.assessment_id, v.cycle_id, v.organization_id,
    v.track_id, v.track_number, v.standard_id, v.indicator_id, v.indicator_number,
    count(*)::int                                   as items_total,
    count(*) filter (where v.is_met)::int           as items_met,
    count(*) filter (where v.counted)::int          as items_counted,
    count(*) filter (where v.evidence_count > 0)::int as items_with_evidence
  from public.v_item_scores v
  group by v.assessment_id, v.cycle_id, v.organization_id,
           v.track_id, v.track_number, v.standard_id, v.indicator_id, v.indicator_number
)
select
  agg.*,
  case when agg.items_total = 0 then 0
       else round(100.0 * agg.items_counted / agg.items_total)::int end as score_pct,
  case when agg.items_total = 0 then 0
       else round(100.0 * agg.items_met / agg.items_total)::int end     as progress_pct,
  coalesce(lb.level, 0)::smallint                                        as level,
  coalesce(lb.label, '')                                                 as level_label,
  (agg.items_total > 0 and agg.items_counted = agg.items_total)          as is_complete,
  (agg.items_met > 0 or agg.items_with_evidence > 0)                     as is_started
from agg
join public.assessment_cycles c on c.id = agg.cycle_id
left join public.level_bands lb
  on lb.tool_version_id = c.tool_version_id
 and (case when agg.items_total = 0 then 0 else round(100.0 * agg.items_counted / agg.items_total)::int end)
     between lb.min_pct and lb.max_pct;

-- Track score: average level of the track's indicators (approved tool formula), plus item totals.
create view public.v_track_scores with (security_invoker = true) as
select
  s.assessment_id, s.cycle_id, s.organization_id, s.track_id, s.track_number,
  count(*)::int                                        as indicators_total,
  count(*) filter (where s.is_started)::int            as indicators_started,
  count(*) filter (where s.is_complete)::int           as indicators_complete,
  sum(s.items_total)::int                              as items_total,
  sum(s.items_met)::int                                as items_met,
  sum(s.items_counted)::int                            as items_counted,
  round(avg(s.level)::numeric, 2)                      as avg_level,
  round(avg(s.score_pct)::numeric)::int                as avg_score_pct,
  case when sum(s.items_total) = 0 then 0
       else round(100.0 * sum(s.items_met) / sum(s.items_total))::int end as progress_pct
from public.v_indicator_scores s
group by s.assessment_id, s.cycle_id, s.organization_id, s.track_id, s.track_number;

-- Assessment progress and overall score: one row per assessment (organization dashboard, admin lists).
create view public.v_assessment_progress with (security_invoker = true) as
select
  s.assessment_id, s.cycle_id, s.organization_id,
  count(*)::int                                        as indicators_total,
  count(*) filter (where s.is_started)::int            as indicators_started,
  count(*) filter (where s.is_complete)::int           as indicators_complete,
  sum(s.items_total)::int                              as items_total,
  sum(s.items_met)::int                                as items_met,
  sum(s.items_with_evidence)::int                      as items_with_evidence,
  sum(s.items_counted)::int                            as items_counted,
  case when sum(s.items_total) = 0 then 0
       else round(100.0 * sum(s.items_met) / sum(s.items_total))::int end     as progress_pct,
  case when sum(s.items_total) = 0 then 0
       else round(100.0 * sum(s.items_counted) / sum(s.items_total))::int end as score_pct,
  round(avg(s.level)::numeric, 2)                      as avg_level
from public.v_indicator_scores s
group by s.assessment_id, s.cycle_id, s.organization_id;

-- ---------------------------------------------------------------
-- 6. Grants
-- ---------------------------------------------------------------
grant select on public.v_item_scores, public.v_indicator_scores, public.v_track_scores, public.v_assessment_progress to authenticated;
revoke all on public.v_item_scores, public.v_indicator_scores, public.v_track_scores, public.v_assessment_progress from anon;
