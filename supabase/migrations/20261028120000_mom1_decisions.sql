-- Migration 8: decisions from verification meeting 1 (MoM 12 Oct 2026) and the files HRSD sent after it.
--  1. Official lookups (ملف التصنيفات): 39 social development centers, 18 sub-classifications.
--     Provisional TMP- rows from migration 7 are removed when no organization or request uses them.
--  2. Result labels of the reference tool (tamkeen-cts.com reports): غير مكتمل / بحاجة لتحسين كبير /
--     بحاجة لتحسين بسيط / مكتمل. level_bands of the approved version stay immutable; labels live beside them.
--  3. Per-assessment self-assessment deadline (MoM point 7): the admin may extend one organization's
--     submission deadline without touching the cycle.
--  4. المشرف الفني (role code `supervisor`, MoM point 13): enters the self-assessment and evidences on behalf
--     of organizations without connectivity, edits evidences, submits for them. Assigning evaluators belongs
--     to the admin (MoM point 12), so the supervisor loses that right (separation of duties: whoever enters
--     evidence for an organization does not choose its auditor).
--  5. ensure_assessment_for(org): admin or supervisor opens an organization's assessment in the open cycle.

-- ---------------------------------------------------------------
-- 1. Official lookups (names normalized for spelling only: hamza, taa marbuta, spacing)
-- ---------------------------------------------------------------
insert into public.social_dev_centers (id, code, name, region) values
  (md5('tmk-sdc-official-01')::uuid, 'SDC-01', 'مركز التنمية الاجتماعية بأبها', 'عسير'),
  (md5('tmk-sdc-official-02')::uuid, 'SDC-02', 'مركز التنمية الاجتماعية بالعيص', 'المدينة المنورة'),
  (md5('tmk-sdc-official-03')::uuid, 'SDC-03', 'مركز التنمية الاجتماعية بعرعر', 'الحدود الشمالية'),
  (md5('tmk-sdc-official-04')::uuid, 'SDC-04', 'مركز التنمية الاجتماعية بالعلا', 'المدينة المنورة'),
  (md5('tmk-sdc-official-05')::uuid, 'SDC-05', 'مركز التنمية الاجتماعية بتبوك', 'تبوك'),
  (md5('tmk-sdc-official-06')::uuid, 'SDC-06', 'مركز التنمية الاجتماعية بدومة الجندل', 'الجوف'),
  (md5('tmk-sdc-official-07')::uuid, 'SDC-07', 'مركز التنمية الاجتماعية بالرياض', 'الرياض'),
  (md5('tmk-sdc-official-08')::uuid, 'SDC-08', 'مركز التنمية الاجتماعية ببيشة', 'عسير'),
  (md5('tmk-sdc-official-09')::uuid, 'SDC-09', 'مركز التنمية الاجتماعية بحفر الباطن', 'الشرقية'),
  (md5('tmk-sdc-official-10')::uuid, 'SDC-10', 'مركز التنمية الاجتماعية بالوجه', 'تبوك'),
  (md5('tmk-sdc-official-11')::uuid, 'SDC-11', 'مركز التنمية الاجتماعية بالدوادمي', 'الرياض'),
  (md5('tmk-sdc-official-12')::uuid, 'SDC-12', 'مركز التنمية الاجتماعية بوادي الدواسر', 'الرياض'),
  (md5('tmk-sdc-official-13')::uuid, 'SDC-13', 'مركز التنمية الاجتماعية بالقطيف', 'الشرقية'),
  (md5('tmk-sdc-official-14')::uuid, 'SDC-14', 'مركز التنمية الاجتماعية بوادي فاطمة', 'مكة المكرمة'),
  (md5('tmk-sdc-official-15')::uuid, 'SDC-15', 'مركز التنمية الاجتماعية بالمندق', 'الباحة'),
  (md5('tmk-sdc-official-16')::uuid, 'SDC-16', 'مركز التنمية الاجتماعية بالقويعية', 'الرياض'),
  (md5('tmk-sdc-official-17')::uuid, 'SDC-17', 'مركز التنمية الاجتماعية بالقوز', 'مكة المكرمة'),
  (md5('tmk-sdc-official-18')::uuid, 'SDC-18', 'مركز التنمية الاجتماعية بجازان', 'جازان'),
  (md5('tmk-sdc-official-19')::uuid, 'SDC-19', 'مركز التنمية الاجتماعية بالدلم', 'الرياض'),
  (md5('tmk-sdc-official-20')::uuid, 'SDC-20', 'مركز التنمية الاجتماعية بالقريات', 'الجوف'),
  (md5('tmk-sdc-official-21')::uuid, 'SDC-21', 'مركز التنمية الاجتماعية ببدر', 'المدينة المنورة'),
  (md5('tmk-sdc-official-22')::uuid, 'SDC-22', 'مركز التنمية الاجتماعية برجال ألمع', 'عسير'),
  (md5('tmk-sdc-official-23')::uuid, 'SDC-23', 'مركز التنمية الاجتماعية بحائل', 'حائل'),
  (md5('tmk-sdc-official-24')::uuid, 'SDC-24', 'مركز التنمية الاجتماعية ببريدة', 'القصيم'),
  (md5('tmk-sdc-official-25')::uuid, 'SDC-25', 'مركز التنمية الاجتماعية بشقراء', 'الرياض'),
  (md5('tmk-sdc-official-26')::uuid, 'SDC-26', 'مركز التنمية الاجتماعية بنجران', 'نجران'),
  (md5('tmk-sdc-official-27')::uuid, 'SDC-27', 'مركز التنمية الاجتماعية بالمدينة المنورة', 'المدينة المنورة'),
  (md5('tmk-sdc-official-28')::uuid, 'SDC-28', 'مركز التنمية الاجتماعية بالدمام', 'الشرقية'),
  (md5('tmk-sdc-official-29')::uuid, 'SDC-29', 'مركز التنمية الاجتماعية بعنيزة', 'القصيم'),
  (md5('tmk-sdc-official-30')::uuid, 'SDC-30', 'مركز التنمية الاجتماعية بالأفلاج', 'الرياض'),
  (md5('tmk-sdc-official-31')::uuid, 'SDC-31', 'مركز التنمية الاجتماعية بمحافظة الأحساء', 'الشرقية'),
  (md5('tmk-sdc-official-32')::uuid, 'SDC-32', 'مركز التنمية الاجتماعية بمحافظة عفيف', 'الرياض'),
  (md5('tmk-sdc-official-33')::uuid, 'SDC-33', 'مركز التنمية الاجتماعية بتربة', 'مكة المكرمة'),
  (md5('tmk-sdc-official-34')::uuid, 'SDC-34', 'مركز التنمية الاجتماعية بروضة سدير', 'الرياض'),
  (md5('tmk-sdc-official-35')::uuid, 'SDC-35', 'مركز التنمية الاجتماعية بجدة', 'مكة المكرمة'),
  (md5('tmk-sdc-official-36')::uuid, 'SDC-36', 'مركز التنمية الاجتماعية بشرورة', 'نجران'),
  (md5('tmk-sdc-official-37')::uuid, 'SDC-37', 'مركز التنمية الاجتماعية بمكة المكرمة', 'مكة المكرمة'),
  (md5('tmk-sdc-official-38')::uuid, 'SDC-38', 'مركز التنمية الاجتماعية بالباحة', 'الباحة'),
  (md5('tmk-sdc-official-39')::uuid, 'SDC-39', 'مركز التنمية الاجتماعية بالطائف', 'مكة المكرمة')
on conflict (id) do nothing;

-- Source row 1 reads only "المهنية" (looks truncated in the file); kept as sent, to be confirmed with HRSD.
insert into public.sub_classifications (id, code, name, sort_order) values
  (md5('tmk-sc-official-01')::uuid, 'SC-01', 'المهنية', 1),
  (md5('tmk-sc-official-02')::uuid, 'SC-02', 'خدمات برامج التدريب على العمل', 2),
  (md5('tmk-sc-official-03')::uuid, 'SC-03', 'خدمات الإرشاد والتوجيه المهني', 3),
  (md5('tmk-sc-official-04')::uuid, 'SC-04', 'خدمات الأسرة', 4),
  (md5('tmk-sc-official-05')::uuid, 'SC-05', 'خدمات التنمية الاجتماعية', 5),
  (md5('tmk-sc-official-06')::uuid, 'SC-06', 'خدمات الحماية الأسرية', 6),
  (md5('tmk-sc-official-07')::uuid, 'SC-07', 'خدمات الرعاية وخدمات الأطفال', 7),
  (md5('tmk-sc-official-08')::uuid, 'SC-08', 'التوعية والتأييد والمؤازرة', 8),
  (md5('tmk-sc-official-09')::uuid, 'SC-09', 'المسؤولية الاجتماعية', 9),
  (md5('tmk-sc-official-10')::uuid, 'SC-10', 'أبحاث العلوم الاجتماعية ودراسات السياسات الاجتماعية ونحوها', 10),
  (md5('tmk-sc-official-11')::uuid, 'SC-11', 'خدمات الأشخاص ذوي الإعاقة', 11),
  (md5('tmk-sc-official-12')::uuid, 'SC-12', 'خدمات التأهيل المهني والورش للأشخاص ذوي الإعاقة', 12),
  (md5('tmk-sc-official-13')::uuid, 'SC-13', 'خدمات التدخل في الأزمات والحماية', 13),
  (md5('tmk-sc-official-14')::uuid, 'SC-14', 'خدمات الشباب والنشء', 14),
  (md5('tmk-sc-official-15')::uuid, 'SC-15', 'خدمات المسنين', 15),
  (md5('tmk-sc-official-16')::uuid, 'SC-16', 'خدمات تأهيل الجانحين والأحداث', 16),
  (md5('tmk-sc-official-17')::uuid, 'SC-17', 'خدمات تعزيز الاعتماد على الذات والخدمات الاجتماعية الأخرى للأفراد', 17),
  (md5('tmk-sc-official-18')::uuid, 'SC-18', 'خدمات دعم الدخل', 18)
on conflict (id) do nothing;

-- Remove the provisional rows nobody references.
delete from public.social_dev_centers c
where c.code like 'TMP-%'
  and not exists (select 1 from public.organizations o where o.social_dev_center_id = c.id)
  and not exists (select 1 from public.organization_requests r where r.social_dev_center_id = c.id);
delete from public.sub_classifications s
where s.code like 'TMP-%'
  and not exists (select 1 from public.organizations o where o.sub_classification_id = s.id)
  and not exists (select 1 from public.organization_requests r where r.sub_classification_id = s.id);

-- ---------------------------------------------------------------
-- 2. Result labels (as shown in the reference tool's reports)
-- ---------------------------------------------------------------
create table public.level_labels (
  tool_version_id uuid not null references public.tool_versions(id) on delete cascade,
  level           smallint not null,
  label           text not null,
  primary key (tool_version_id, level)
);

alter table public.level_labels enable row level security;
create policy "level_labels: authenticated read" on public.level_labels for select to authenticated using (true);
create policy "level_labels: admin write" on public.level_labels for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
revoke all on public.level_labels from anon;

insert into public.level_labels (tool_version_id, level, label) values
  (md5('cts-v0.2.1')::uuid, 0, 'غير مكتمل'),
  (md5('cts-v0.2.1')::uuid, 1, 'بحاجة لتحسين كبير'),
  (md5('cts-v0.2.1')::uuid, 2, 'بحاجة لتحسين بسيط'),
  (md5('cts-v0.2.1')::uuid, 4, 'مكتمل')
on conflict do nothing;

-- Same columns as migration 7; only level_label now prefers level_labels.
create or replace view public.v_indicator_scores with (security_invoker = true) as
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
  coalesce(ll.label, lb.label, '')                                       as level_label,
  (agg.items_total > 0 and agg.items_counted = agg.items_total)          as is_complete,
  (agg.items_met > 0 or agg.items_with_evidence > 0)                     as is_started
from agg
join public.assessment_cycles c on c.id = agg.cycle_id
left join public.level_bands lb
  on lb.tool_version_id = c.tool_version_id
 and (case when agg.items_total = 0 then 0 else round(100.0 * agg.items_counted / agg.items_total)::int end)
     between lb.min_pct and lb.max_pct
left join public.level_labels ll
  on ll.tool_version_id = c.tool_version_id and ll.level = coalesce(lb.level, 0);

-- ---------------------------------------------------------------
-- 3. Per-assessment deadline (only the admin updates assessments, through the existing admin policy)
-- ---------------------------------------------------------------
alter table public.assessments add column submission_due date;
comment on column public.assessments.submission_due is
  'Admin extension of the self-assessment deadline for this organization. Null = cycle submission_end.';

-- ---------------------------------------------------------------
-- 4. Supervisor (المشرف الفني): proxy entry for organizations
-- ---------------------------------------------------------------
-- The organization OR a supervisor may edit while: cycle open, inside the (possibly extended) submission
-- period, status draft or returned. Every existing policy that calls this function (responses, evidences,
-- evidence files) now covers the supervisor without new policies. Name kept for the existing policies.
create or replace function public.assessment_editable_by_org(p_assessment uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.assessments a
    join public.assessment_cycles c on c.id = a.cycle_id
    where a.id = p_assessment
      and (a.organization_id = public.current_org_id() or public.is_supervisor())
      and c.status = 'open'
      and current_date between c.submission_start and coalesce(a.submission_due, c.submission_end)
      and a.status in ('draft', 'returned')
  )
$$;

-- The supervisor follows assignments but no longer manages them.
drop policy if exists "reviews: supervisor manages" on public.assessment_reviews;
create policy "reviews: supervisor reads all" on public.assessment_reviews for select to authenticated
  using (public.is_supervisor());

-- Submission on behalf of the organization, and the extended deadline.
create or replace function public.transition_assessment(
  p_assessment uuid,
  p_to         public.assessment_status,
  p_note       text default null
) returns public.assessments
language plpgsql security definer set search_path = public as $$
declare
  a      public.assessments%rowtype;
  c      public.assessment_cycles%rowtype;
  me     uuid := auth.uid();
  admin  boolean := public.is_admin();
  ok     boolean := false;  -- every branch result is coalesced: NULL from a NULL org must never pass
  from_s public.assessment_status;
begin
  select * into a from public.assessments where id = p_assessment for update;
  if not found then raise exception 'Assessment not found' using errcode = 'no_data_found'; end if;
  select * into c from public.assessment_cycles where id = a.cycle_id;
  from_s := a.status;

  if c.status <> 'open' then
    raise exception 'Cycle is not open' using errcode = 'check_violation';
  end if;

  if a.status in ('draft', 'returned') and p_to = 'submitted' then
    ok := (a.organization_id = public.current_org_id() or public.is_supervisor() or admin)
          and current_date between c.submission_start and coalesce(a.submission_due, c.submission_end);

  elsif a.status = 'submitted' and p_to = 'under_review' then
    ok := (public.is_assigned_evaluator(a.id) or admin)
          and current_date between c.review_start and c.approval_end;

  elsif a.status = 'under_review' and p_to = 'returned' then
    ok := (public.is_assigned_evaluator(a.id) or admin)
          and current_date between c.review_start and c.approval_end;
    if ok and coalesce(trim(p_note), '') = '' then
      raise exception 'A note is required when returning an assessment' using errcode = 'check_violation';
    end if;

  elsif a.status = 'under_review' and p_to = 'approved' then
    ok := (public.is_assigned_evaluator(a.id) or admin)
          and current_date between c.review_start and c.approval_end;

  end if;

  -- Administrative override: any transition, outside periods included, must be justified and is always logged.
  ok := coalesce(ok, false);
  if not ok and admin then
    if coalesce(trim(p_note), '') = '' then
      raise exception 'Administrative override requires a note' using errcode = 'check_violation';
    end if;
    ok := true;
  end if;

  if not ok then
    raise exception 'Transition % -> % is not allowed for this user at this time', a.status, p_to
      using errcode = 'insufficient_privilege';
  end if;

  perform set_config('tamkeen.in_transition', '1', true);

  update public.assessments set
    status       = p_to,
    submitted_at = case when p_to = 'submitted' then now() else submitted_at end,
    returned_at  = case when p_to = 'returned'  then now() else returned_at  end,
    approved_at  = case when p_to = 'approved'  then now() else approved_at  end,
    return_note  = case when p_to = 'returned'  then p_note else return_note end
  where id = a.id
  returning * into a;

  insert into public.assessment_status_history (assessment_id, from_status, to_status, changed_by, note)
  values (a.id, from_s, p_to, me, p_note);

  return a;
end $$;

grant execute on function public.transition_assessment(uuid, public.assessment_status, text) to authenticated;

-- ---------------------------------------------------------------
-- 5. Open an organization's assessment on its behalf (admin, supervisor)
-- ---------------------------------------------------------------
create or replace function public.ensure_assessment_for(p_org uuid)
returns public.assessments
language plpgsql security definer set search_path = public as $$
declare
  cyc uuid;
  a   public.assessments%rowtype;
begin
  if not (public.is_admin() or public.is_supervisor()) then
    raise exception 'Only an administrator or a supervisor can open an assessment for an organization'
      using errcode = 'insufficient_privilege';
  end if;
  if not exists (select 1 from public.organizations where id = p_org) then
    raise exception 'Organization not found' using errcode = 'no_data_found';
  end if;
  select id into cyc from public.assessment_cycles
  where status = 'open' and current_date between submission_start and submission_end;
  if cyc is null then
    raise exception 'No open cycle in its submission period' using errcode = 'check_violation';
  end if;
  insert into public.assessments (cycle_id, organization_id) values (cyc, p_org)
  on conflict (cycle_id, organization_id) do nothing;
  select * into a from public.assessments where cycle_id = cyc and organization_id = p_org;
  return a;
end $$;

grant execute on function public.ensure_assessment_for(uuid) to authenticated;
