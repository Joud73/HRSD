-- Migration 11b: Phase 4, review, approval and results (BR-07, BR-08, BR-09, BR-10, BR-12).
--
--  1. Evidence rule: an item is met only through its evidence. is_met is derived, never ticked by hand.
--  2. Cycle periods: review may start before the submission period ends (rolling review).
--  3. Verdicts: the assigned evaluator confirms or rejects each item that has evidence; a verdict resets
--     when the organization changes that item's evidence after a return.
--  4. Scoring views gain the review basis (review_counted, review_score_pct, review_level) next to the
--     self-assessment basis. Same definitions, two columns sets, one place.
--  5. assessment_results: frozen per-indicator results written when the evaluator approves.
--  6. Documents: التقرير التعقيبي (تقرير الإشراف الفني) and خطة التحسين, generated from the tool texts,
--     edited by the evaluator, approved with the assessment, issued by the final sign-off.
--  7. Transitions: approval gate, approved -> issued through issue_results(), approved -> under_review
--     (return to the evaluator with a note).
--  8. Programs (طموحي): catalog contract and the default recommendation view the readiness tool replaces.
--  9. Documents bucket and policies.

-- ---------------------------------------------------------------
-- 1. Evidence rule
-- ---------------------------------------------------------------
create or replace function public.item_has_evidence(p_assessment uuid, p_item uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.evidences where assessment_id = p_assessment and item_id = p_item)
$$;
grant execute on function public.item_has_evidence(uuid, uuid) to authenticated;

-- is_met follows the evidence. A verdict needs evidence to judge.
create or replace function public.sync_response_with_evidence()
returns trigger language plpgsql set search_path = public as $$
declare has_ev boolean;
begin
  has_ev := public.item_has_evidence(new.assessment_id, new.item_id);
  new.is_met := has_ev;
  if new.verified is not null and not has_ev then
    raise exception 'A verdict needs at least one evidence on the item' using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists trg_sync_response_with_evidence on public.item_responses;
create trigger trg_sync_response_with_evidence before insert or update on public.item_responses
  for each row execute function public.sync_response_with_evidence();

-- Adding or removing evidence maintains the response row and clears any verdict on that item.
create or replace function public.propagate_evidence_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_assessment uuid := coalesce(new.assessment_id, old.assessment_id);
        v_item       uuid := coalesce(new.item_id, old.item_id);
        v_user       uuid := coalesce(auth.uid(), new.uploaded_by);
begin
  -- column protection must let this maintenance write through (the caller is the organization, not the evaluator)
  perform set_config('tamkeen.in_evidence_sync', '1', true);
  insert into public.item_responses (assessment_id, item_id, is_met, updated_by)
  values (v_assessment, v_item, true, v_user)
  on conflict (assessment_id, item_id) do update
    set is_met = public.item_has_evidence(v_assessment, v_item),
        verified = null,
        updated_by = coalesce(auth.uid(), item_responses.updated_by);
  perform set_config('tamkeen.in_evidence_sync', '0', true);
  return coalesce(new, old);
end $$;

drop trigger if exists trg_propagate_evidence_change on public.evidences;
create trigger trg_propagate_evidence_change after insert or delete on public.evidences
  for each row execute function public.propagate_evidence_change();

-- protect_response_columns: skip while the evidence trigger maintains is_met and clears verdicts
create or replace function public.protect_response_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if coalesce(current_setting('tamkeen.in_evidence_sync', true), '') = '1' or auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if public.is_assigned_evaluator(new.assessment_id) then
    if new.is_met is distinct from old.is_met or new.org_note is distinct from old.org_note then
      raise exception 'Evaluators cannot change the organization answer' using errcode = 'insufficient_privilege';
    end if;
  else
    if new.verified is distinct from old.verified or new.evaluator_note is distinct from old.evaluator_note then
      raise exception 'Only the assigned evaluator records verdicts' using errcode = 'insufficient_privilege';
    end if;
  end if;
  new.updated_by := auth.uid();
  return new;
end $$;

-- Heal existing rows once: anything ticked without evidence is no longer met.
update public.item_responses r
   set is_met = public.item_has_evidence(r.assessment_id, r.item_id)
 where r.is_met is distinct from public.item_has_evidence(r.assessment_id, r.item_id);

-- ---------------------------------------------------------------
-- 2. Cycle periods: review may overlap submission
-- ---------------------------------------------------------------
alter table public.assessment_cycles drop constraint if exists cycle_periods_ordered;
alter table public.assessment_cycles add constraint cycle_periods_ordered check (
  submission_start <= submission_end
  and submission_start <= review_start
  and review_start  <= review_end
  and review_end    <= approval_start
  and approval_start <= approval_end
);

-- ---------------------------------------------------------------
-- 3. Verdict helpers
-- ---------------------------------------------------------------
-- Items the evaluator still has to judge: evidence present, no verdict yet, item active in the cycle.
create or replace function public.pending_verdicts(p_assessment uuid)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int
  from public.item_responses r
  join public.assessments a on a.id = r.assessment_id
  where r.assessment_id = p_assessment
    and r.is_met
    and r.verified is null
    and not exists (select 1 from public.cycle_item_exclusions x where x.cycle_id = a.cycle_id and x.item_id = r.item_id)
$$;
grant execute on function public.pending_verdicts(uuid) to authenticated;

-- ---------------------------------------------------------------
-- 4. Scoring views: self basis (as before) + review basis
-- ---------------------------------------------------------------
create or replace view public.v_item_scores with (security_invoker = true) as
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
  coalesce(e.evidence_count, 0) > 0      as is_met,
  coalesce(e.evidence_count, 0)::int     as evidence_count,
  coalesce(e.evidence_count, 0) > 0      as counted,
  r.verified,
  (coalesce(e.evidence_count, 0) > 0 and r.verified is true)  as review_counted,
  (coalesce(e.evidence_count, 0) > 0 and r.verified is null)  as review_pending
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

create or replace view public.v_indicator_scores with (security_invoker = true) as
with agg as (
  select
    v.assessment_id, v.cycle_id, v.organization_id,
    v.track_id, v.track_number, v.standard_id, v.indicator_id, v.indicator_number,
    count(*)::int                                      as items_total,
    count(*) filter (where v.is_met)::int              as items_met,
    count(*) filter (where v.counted)::int             as items_counted,
    count(*) filter (where v.evidence_count > 0)::int  as items_with_evidence,
    count(*) filter (where v.review_counted)::int      as items_review_counted,
    count(*) filter (where v.review_pending)::int      as items_review_pending,
    count(*) filter (where v.counted and v.verified is false)::int as items_review_rejected
  from public.v_item_scores v
  group by v.assessment_id, v.cycle_id, v.organization_id,
           v.track_id, v.track_number, v.standard_id, v.indicator_id, v.indicator_number
),
pct as (
  select agg.*,
    case when agg.items_total = 0 then 0 else round(100.0 * agg.items_counted / agg.items_total)::int end        as score_pct,
    case when agg.items_total = 0 then 0 else round(100.0 * agg.items_review_counted / agg.items_total)::int end as review_score_pct
  from agg
)
select
  pct.assessment_id, pct.cycle_id, pct.organization_id,
  pct.track_id, pct.track_number, pct.standard_id, pct.indicator_id, pct.indicator_number,
  pct.items_total, pct.items_met, pct.items_counted, pct.items_with_evidence,
  pct.score_pct,
  pct.score_pct                                                          as progress_pct,
  coalesce(lb.level, 0)::smallint                                        as level,
  coalesce(ll.label, lb.label, '')                                       as level_label,
  (pct.items_total > 0 and pct.items_counted = pct.items_total)          as is_complete,
  (pct.items_counted > 0)                                                as is_started,
  pct.items_review_counted,
  pct.items_review_pending,
  pct.items_review_rejected,
  pct.review_score_pct,
  coalesce(rlb.level, 0)::smallint                                       as review_level,
  coalesce(rll.label, rlb.label, '')                                     as review_level_label
from pct
join public.assessment_cycles c on c.id = pct.cycle_id
left join public.level_bands lb
  on lb.tool_version_id = c.tool_version_id and pct.score_pct between lb.min_pct and lb.max_pct
left join public.level_labels ll
  on ll.tool_version_id = c.tool_version_id and ll.level = coalesce(lb.level, 0)
left join public.level_bands rlb
  on rlb.tool_version_id = c.tool_version_id and pct.review_score_pct between rlb.min_pct and rlb.max_pct
left join public.level_labels rll
  on rll.tool_version_id = c.tool_version_id and rll.level = coalesce(rlb.level, 0);

create or replace view public.v_track_scores with (security_invoker = true) as
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
       else round(100.0 * sum(s.items_met) / sum(s.items_total))::int end as progress_pct,
  sum(s.items_review_counted)::int                     as items_review_counted,
  sum(s.items_review_pending)::int                     as items_review_pending,
  round(avg(s.review_level)::numeric, 2)               as avg_review_level,
  round(avg(s.review_score_pct)::numeric)::int         as avg_review_score_pct
from public.v_indicator_scores s
group by s.assessment_id, s.cycle_id, s.organization_id, s.track_id, s.track_number;

create or replace view public.v_assessment_progress with (security_invoker = true) as
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
  round(avg(s.level)::numeric, 2)                      as avg_level,
  sum(s.items_review_counted)::int                     as items_review_counted,
  sum(s.items_review_pending)::int                     as items_review_pending,
  sum(s.items_review_rejected)::int                    as items_review_rejected,
  case when sum(s.items_total) = 0 then 0
       else round(100.0 * sum(s.items_review_counted) / sum(s.items_total))::int end as review_score_pct,
  round(avg(s.review_level)::numeric, 2)               as avg_review_level
from public.v_indicator_scores s
group by s.assessment_id, s.cycle_id, s.organization_id;

-- ---------------------------------------------------------------
-- 5. Frozen results (written on approval, deleted if the approval is withdrawn)
-- ---------------------------------------------------------------
create table public.assessment_results (
  assessment_id        uuid not null references public.assessments(id) on delete cascade,
  indicator_id         uuid not null references public.indicators(id),
  track_id             uuid not null references public.tracks(id),
  track_number         smallint not null,
  standard_id          uuid not null references public.standards(id),
  indicator_number     smallint not null,
  items_total          int not null,
  self_counted         int not null,
  review_counted       int not null,
  self_pct             int not null,
  review_pct           int not null,
  self_level           smallint not null,
  review_level         smallint not null,
  review_label         text not null,
  frozen_at            timestamptz not null default now(),
  primary key (assessment_id, indicator_id)
);
create index idx_assessment_results_track on public.assessment_results (assessment_id, track_number);

-- Per track and overall, for the organization results page, reports and the readiness tool.
create view public.v_assessment_results_tracks with (security_invoker = true) as
select assessment_id, track_id, track_number,
       count(*)::int as indicators_total,
       sum(items_total)::int as items_total,
       sum(self_counted)::int as self_counted,
       sum(review_counted)::int as review_counted,
       round(avg(self_pct)::numeric)::int   as self_pct,
       round(avg(review_pct)::numeric)::int as review_pct,
       round(avg(self_level)::numeric, 2)   as self_level,
       round(avg(review_level)::numeric, 2) as review_level,
       count(*) filter (where review_level < 4)::int as indicators_below_complete
from public.assessment_results
group by assessment_id, track_id, track_number;

create view public.v_assessment_results_overall with (security_invoker = true) as
select r.assessment_id, a.cycle_id, a.organization_id,
       sum(r.items_total)::int as items_total,
       sum(r.self_counted)::int as self_counted,
       sum(r.review_counted)::int as review_counted,
       case when sum(r.items_total) = 0 then 0 else round(100.0 * sum(r.self_counted) / sum(r.items_total))::int end   as self_pct,
       case when sum(r.items_total) = 0 then 0 else round(100.0 * sum(r.review_counted) / sum(r.items_total))::int end as review_pct,
       round(avg(r.review_level)::numeric, 2) as review_level,
       min(r.frozen_at) as frozen_at
from public.assessment_results r
join public.assessments a on a.id = r.assessment_id
group by r.assessment_id, a.cycle_id, a.organization_id;

alter table public.assessment_results enable row level security;
create policy "results: admin all" on public.assessment_results for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "results: supervisor reads" on public.assessment_results for select to authenticated
  using (public.is_supervisor());
create policy "results: evaluator reads assigned" on public.assessment_results for select to authenticated
  using (public.is_assigned_evaluator(assessment_id));
create policy "results: org reads own when issued" on public.assessment_results for select to authenticated
  using (exists (select 1 from public.assessments a
                 where a.id = assessment_id and a.organization_id = public.current_org_id() and a.status = 'issued'));
revoke all on public.assessment_results from anon;
grant select on public.v_assessment_results_tracks, public.v_assessment_results_overall to authenticated;

-- ---------------------------------------------------------------
-- 6. Documents
-- ---------------------------------------------------------------
create type public.document_kind    as enum ('feedback_report', 'improvement_plan');
create type public.document_status  as enum ('draft', 'approved', 'issued');
create type public.document_section as enum ('strength', 'opportunity', 'task');

create table public.assessment_documents (
  id             uuid primary key default gen_random_uuid(),
  assessment_id  uuid not null references public.assessments(id) on delete cascade,
  kind           public.document_kind not null,
  status         public.document_status not null default 'draft',
  number         text,                      -- ت.م.{رقم التسجيل}|{yy.mm.dd}, assigned at issuance
  header         jsonb not null default '{}'::jsonb,  -- organization facts and scores frozen at approval
  generated_at   timestamptz not null default now(),
  approved_by    uuid references auth.users(id),
  approved_at    timestamptz,
  issued_by      uuid references auth.users(id),
  issued_at      timestamptz,
  pdf_path       text,                      -- documents/{assessment_id}/{kind}.pdf
  pdf_sha256     char(64),
  unique (assessment_id, kind)
);

create table public.assessment_document_lines (
  id             uuid primary key default gen_random_uuid(),
  document_id    uuid not null references public.assessment_documents(id) on delete cascade,
  section        public.document_section not null,
  track_id       uuid not null references public.tracks(id),
  standard_id    uuid not null references public.standards(id),
  indicator_id   uuid references public.indicators(id),
  item_id        uuid references public.items(id),
  sort_order     int not null,
  text           text not null,
  original_text  text,                      -- the tool text the line was generated from (null for manual lines)
  source         text not null default 'auto' check (source in ('auto', 'manual')),
  included       boolean not null default true,
  edited         boolean not null default false,
  task_status    text not null default 'not_started' check (task_status in ('not_started', 'in_progress', 'done')),
  updated_by     uuid references auth.users(id),
  updated_at     timestamptz not null default now()
);
create index idx_document_lines_doc on public.assessment_document_lines (document_id, section, sort_order);
create unique index uq_document_lines_auto on public.assessment_document_lines (document_id, section, item_id) where source = 'auto';

-- Documents change only through the functions below (or an administrator).
create or replace function public.block_direct_document_change()
returns trigger language plpgsql set search_path = public as $$
begin
  if coalesce(current_setting('tamkeen.in_document_fn', true), '') = '1' or auth.uid() is null or public.is_admin() then
    return coalesce(new, old);
  end if;
  raise exception 'Documents change only through generate_assessment_documents(), transition_assessment() and issue_results()'
    using errcode = 'insufficient_privilege';
end $$;
create trigger trg_block_direct_document_change before insert or update or delete on public.assessment_documents
  for each row execute function public.block_direct_document_change();

-- The assigned evaluator edits lines while the document is a draft and the assessment is under review.
create or replace function public.document_editable_by_me(p_document uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.assessment_documents d
    join public.assessments a on a.id = d.assessment_id
    where d.id = p_document
      and d.status = 'draft'
      and a.status = 'under_review'
      and public.assessment_reviewable_by_me(a.id)
  )
$$;
grant execute on function public.document_editable_by_me(uuid) to authenticated;

-- Lines: the evaluator may change text, included, sort_order; everything else is fixed.
create or replace function public.protect_document_line_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if coalesce(current_setting('tamkeen.in_document_fn', true), '') = '1' or auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if tg_op = 'UPDATE' and (
       new.document_id is distinct from old.document_id or new.section is distinct from old.section
    or new.item_id is distinct from old.item_id or new.source is distinct from old.source
    or new.original_text is distinct from old.original_text or new.task_status is distinct from old.task_status) then
    raise exception 'Only text, included and sort_order may change on a document line' using errcode = 'insufficient_privilege';
  end if;
  if tg_op = 'INSERT' then
    new.source := 'manual';
    new.original_text := null;
  end if;
  if coalesce(trim(new.text), '') = '' then
    raise exception 'A document line needs text' using errcode = 'check_violation';
  end if;
  new.edited := (new.source = 'auto' and new.text is distinct from new.original_text);
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end $$;
create trigger trg_protect_document_line_columns before insert or update on public.assessment_document_lines
  for each row execute function public.protect_document_line_columns();

alter table public.assessment_documents enable row level security;
alter table public.assessment_document_lines enable row level security;

create policy "documents: admin all" on public.assessment_documents for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "documents: supervisor reads" on public.assessment_documents for select to authenticated
  using (public.is_supervisor());
create policy "documents: evaluator reads assigned" on public.assessment_documents for select to authenticated
  using (public.is_assigned_evaluator(assessment_id));
create policy "documents: org reads issued" on public.assessment_documents for select to authenticated
  using (status = 'issued' and exists (select 1 from public.assessments a
         where a.id = assessment_id and a.organization_id = public.current_org_id()));

create policy "lines: admin all" on public.assessment_document_lines for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "lines: supervisor reads" on public.assessment_document_lines for select to authenticated
  using (exists (select 1 from public.assessment_documents d where d.id = document_id and public.is_supervisor()));
create policy "lines: evaluator reads assigned" on public.assessment_document_lines for select to authenticated
  using (exists (select 1 from public.assessment_documents d where d.id = document_id and public.is_assigned_evaluator(d.assessment_id)));
create policy "lines: evaluator edits draft" on public.assessment_document_lines for update to authenticated
  using (public.document_editable_by_me(document_id)) with check (public.document_editable_by_me(document_id));
create policy "lines: evaluator adds to draft" on public.assessment_document_lines for insert to authenticated
  with check (public.document_editable_by_me(document_id));
create policy "lines: evaluator removes manual from draft" on public.assessment_document_lines for delete to authenticated
  using (source = 'manual' and public.document_editable_by_me(document_id));
create policy "lines: org reads issued" on public.assessment_document_lines for select to authenticated
  using (included and exists (
    select 1 from public.assessment_documents d join public.assessments a on a.id = d.assessment_id
    where d.id = document_id and d.status = 'issued' and a.organization_id = public.current_org_id()));

revoke all on public.assessment_documents, public.assessment_document_lines from anon;

-- Header facts for both documents: organization, dates, and the three scores the plan's introduction compares.
create or replace function public.document_header(p_assessment uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare a public.assessments%rowtype; h jsonb; v_avg int;
begin
  select * into a from public.assessments where id = p_assessment;
  select round(avg(o.review_pct))::int into v_avg
  from public.v_assessment_results_overall o
  join public.assessments x on x.id = o.assessment_id
  where x.cycle_id = a.cycle_id and x.id <> a.id and x.status in ('approved', 'issued');
  select jsonb_build_object(
    'organization_id',     o.id,
    'organization_name',   o.name,
    'registration_number', o.registration_number,
    'social_dev_center',   sdc.name,
    'region',              o.region,
    'cycle_name',          c.name,
    'self_assessment_date', (a.submitted_at at time zone 'Asia/Riyadh')::date,
    'self_pct',            p.score_pct,
    'review_pct',          p.review_score_pct,
    'cycle_avg_review_pct', v_avg
  ) into h
  from public.organizations o
  left join public.social_dev_centers sdc on sdc.id = o.social_dev_center_id
  join public.assessment_cycles c on c.id = a.cycle_id
  left join public.v_assessment_progress p on p.assessment_id = a.id
  where o.id = a.organization_id;
  return coalesce(h, '{}'::jsonb);
end $$;

-- Builds (or refreshes) both documents from the current verdicts.
--   strength    = strength_text of every item the evaluator confirmed
--   opportunity = opportunity_text of every active item not confirmed (rejected, pending, or without evidence)
--   task        = improvement_action of the same items (the plan's task register)
-- Untouched auto lines are rebuilt; edited lines survive while their item still qualifies; manual lines always survive.
create or replace function public.generate_assessment_documents(p_assessment uuid)
returns setof public.assessment_documents
language plpgsql security definer set search_path = public as $$
declare
  a public.assessments%rowtype;
  d_report uuid; d_plan uuid; h jsonb;
begin
  select * into a from public.assessments where id = p_assessment for update;
  if not found then raise exception 'Assessment not found' using errcode = 'no_data_found'; end if;
  if not (public.is_admin() or public.is_assigned_evaluator(a.id)) then
    raise exception 'Only the assigned evaluator generates the documents' using errcode = 'insufficient_privilege';
  end if;
  if a.status <> 'under_review' then
    raise exception 'Documents are generated while the assessment is under review' using errcode = 'check_violation';
  end if;
  if exists (select 1 from public.assessment_documents where assessment_id = a.id and status <> 'draft') then
    raise exception 'Approved documents are not regenerated' using errcode = 'check_violation';
  end if;

  perform set_config('tamkeen.in_document_fn', '1', true);
  h := public.document_header(a.id);

  insert into public.assessment_documents (assessment_id, kind, header) values (a.id, 'feedback_report', h)
  on conflict (assessment_id, kind) do update set header = excluded.header, generated_at = now()
  returning id into d_report;
  insert into public.assessment_documents (assessment_id, kind, header) values (a.id, 'improvement_plan', h)
  on conflict (assessment_id, kind) do update set header = excluded.header, generated_at = now()
  returning id into d_plan;

  -- current qualification of every active item
  create temp table _q on commit drop as
  select v.track_id, v.standard_id, v.indicator_id, v.item_id, v.item_number,
         v.review_counted as confirmed
  from public.v_item_scores v where v.assessment_id = a.id;

  -- drop auto lines that are untouched, or whose item no longer qualifies for their section
  delete from public.assessment_document_lines l
  using public.assessment_documents d
  where l.document_id = d.id and d.assessment_id = a.id and l.source = 'auto'
    and (not l.edited
         or not exists (select 1 from _q where _q.item_id = l.item_id
                        and ((l.section = 'strength' and _q.confirmed) or (l.section <> 'strength' and not _q.confirmed))));

  -- strengths and opportunities (report), tasks (plan)
  insert into public.assessment_document_lines (document_id, section, track_id, standard_id, indicator_id, item_id, sort_order, text, original_text, source)
  select d_report, 'strength', q.track_id, q.standard_id, q.indicator_id, q.item_id, q.item_number, i.strength_text, i.strength_text, 'auto'
  from _q q join public.items i on i.id = q.item_id
  where q.confirmed
    and not exists (select 1 from public.assessment_document_lines l where l.document_id = d_report and l.section = 'strength' and l.item_id = q.item_id);

  insert into public.assessment_document_lines (document_id, section, track_id, standard_id, indicator_id, item_id, sort_order, text, original_text, source)
  select d_report, 'opportunity', q.track_id, q.standard_id, q.indicator_id, q.item_id, q.item_number, i.opportunity_text, i.opportunity_text, 'auto'
  from _q q join public.items i on i.id = q.item_id
  where not q.confirmed
    and not exists (select 1 from public.assessment_document_lines l where l.document_id = d_report and l.section = 'opportunity' and l.item_id = q.item_id);

  insert into public.assessment_document_lines (document_id, section, track_id, standard_id, indicator_id, item_id, sort_order, text, original_text, source)
  select d_plan, 'task', q.track_id, q.standard_id, q.indicator_id, q.item_id, q.item_number, i.improvement_action, i.improvement_action, 'auto'
  from _q q join public.items i on i.id = q.item_id
  where not q.confirmed
    and not exists (select 1 from public.assessment_document_lines l where l.document_id = d_plan and l.section = 'task' and l.item_id = q.item_id);

  drop table _q;
  perform set_config('tamkeen.in_document_fn', '0', true);
  return query select * from public.assessment_documents where assessment_id = a.id order by kind;
end $$;
grant execute on function public.generate_assessment_documents(uuid) to authenticated;

-- The documents appear on their own the moment the last verdict is recorded.
create or replace function public.auto_generate_documents()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_status public.assessment_status;
begin
  if new.verified is not null and new.verified is distinct from old.verified then
    select status into v_status from public.assessments where id = new.assessment_id;
    if v_status = 'under_review'
       and public.pending_verdicts(new.assessment_id) = 0
       and not exists (select 1 from public.assessment_documents where assessment_id = new.assessment_id) then
      perform public.generate_assessment_documents(new.assessment_id);
    end if;
  end if;
  return null;
end $$;
drop trigger if exists trg_auto_generate_documents on public.item_responses;
create trigger trg_auto_generate_documents after update on public.item_responses
  for each row execute function public.auto_generate_documents();

-- ---------------------------------------------------------------
-- 7. Transitions
-- ---------------------------------------------------------------
alter table public.assessments add column if not exists issued_at timestamptz;

-- Who publishes results. Today the technical supervisor; switch to the administrator here if the ministry decides so.
create or replace function public.can_issue_results()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_supervisor() or public.is_admin()
$$;
grant execute on function public.can_issue_results() to authenticated;

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
  ok     boolean := false;
  from_s public.assessment_status;
  v_pending int;
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

  elsif a.status = 'approved' and p_to = 'under_review' then
    -- the final sign-off sends the assessment back to the evaluator
    ok := public.can_issue_results() and current_date between c.review_start and c.approval_end;
    if ok and coalesce(trim(p_note), '') = '' then
      raise exception 'A note is required when returning an assessment to the evaluator' using errcode = 'check_violation';
    end if;

  elsif a.status = 'approved' and p_to = 'issued' then
    if coalesce(current_setting('tamkeen.issuing', true), '') <> '1' then
      raise exception 'Results are issued through issue_results()' using errcode = 'check_violation';
    end if;
    ok := public.can_issue_results() and current_date between c.review_start and c.approval_end;
  end if;

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

  -- Approval gate and side effects (apply to administrators too: data integrity, not permission)
  if p_to = 'approved' then
    v_pending := public.pending_verdicts(a.id);
    if v_pending > 0 then
      raise exception '% item(s) still await a verdict', v_pending using errcode = 'check_violation';
    end if;
    if not exists (select 1 from public.assessment_documents where assessment_id = a.id) then
      perform public.generate_assessment_documents(a.id);
    end if;
    delete from public.assessment_results where assessment_id = a.id;
    insert into public.assessment_results (assessment_id, indicator_id, track_id, track_number, standard_id, indicator_number,
      items_total, self_counted, review_counted, self_pct, review_pct, self_level, review_level, review_label)
    select s.assessment_id, s.indicator_id, s.track_id, s.track_number, s.standard_id, s.indicator_number,
      s.items_total, s.items_counted, s.items_review_counted, s.score_pct, s.review_score_pct, s.level, s.review_level, s.review_level_label
    from public.v_indicator_scores s where s.assessment_id = a.id;
    perform set_config('tamkeen.in_document_fn', '1', true);
    update public.assessment_documents set status = 'approved', approved_by = me, approved_at = now(), header = public.document_header(a.id)
    where assessment_id = a.id;
    perform set_config('tamkeen.in_document_fn', '0', true);
  end if;

  if from_s = 'approved' and p_to = 'under_review' then
    delete from public.assessment_results where assessment_id = a.id;
    perform set_config('tamkeen.in_document_fn', '1', true);
    update public.assessment_documents set status = 'draft', approved_by = null, approved_at = null where assessment_id = a.id;
    perform set_config('tamkeen.in_document_fn', '0', true);
  end if;

  perform set_config('tamkeen.in_transition', '1', true);

  update public.assessments set
    status       = p_to,
    submitted_at = case when p_to = 'submitted' then now() else submitted_at end,
    returned_at  = case when p_to = 'returned'  then now() else returned_at  end,
    approved_at  = case when p_to = 'approved'  then now() else approved_at  end,
    issued_at    = case when p_to = 'issued'    then now() else issued_at    end,
    return_note  = case when p_to = 'returned'  then p_note else return_note end
  where id = a.id
  returning * into a;

  insert into public.assessment_status_history (assessment_id, from_status, to_status, changed_by, note)
  values (a.id, from_s, p_to, me, p_note);

  return a;
end $$;

grant execute on function public.transition_assessment(uuid, public.assessment_status, text) to authenticated;

-- The report number the documents carry. Deterministic, so the client renders the PDF with it before issuing.
create or replace function public.results_number(p_assessment uuid, p_date date default (now() at time zone 'Asia/Riyadh')::date)
returns text language sql stable security definer set search_path = public as $$
  select 'ت.م.' || o.registration_number || '|' || to_char(p_date, 'YY.MM.DD')
  from public.assessments a join public.organizations o on o.id = a.organization_id
  where a.id = p_assessment
$$;
grant execute on function public.results_number(uuid, date) to authenticated;

-- Final sign-off: the two PDFs are already in the documents bucket; this locks everything and publishes.
-- p_pdfs: [{"kind":"feedback_report","path":"<assessment>/feedback_report.pdf","sha256":"..."}, {...improvement_plan...}]
create or replace function public.issue_results(p_assessment uuid, p_number text, p_pdfs jsonb)
returns public.assessments
language plpgsql security definer set search_path = public as $$
declare a public.assessments%rowtype; expected text; r record;
begin
  if not public.can_issue_results() then
    raise exception 'Only the final sign-off issues results' using errcode = 'insufficient_privilege';
  end if;
  expected := public.results_number(p_assessment);
  if p_number is distinct from expected then
    raise exception 'Report number is stale: expected %', expected using errcode = 'check_violation';
  end if;
  if (select count(distinct kind) from public.assessment_documents where assessment_id = p_assessment and status = 'approved') <> 2 then
    raise exception 'Both documents must be approved before issuing' using errcode = 'check_violation';
  end if;
  if jsonb_typeof(p_pdfs) <> 'array' or jsonb_array_length(p_pdfs) <> 2 then
    raise exception 'Two PDFs are required' using errcode = 'check_violation';
  end if;

  perform set_config('tamkeen.issuing', '1', true);
  a := public.transition_assessment(p_assessment, 'issued', null);
  perform set_config('tamkeen.issuing', '0', true);

  perform set_config('tamkeen.in_document_fn', '1', true);
  for r in select * from jsonb_to_recordset(p_pdfs) as x(kind text, path text, sha256 text) loop
    update public.assessment_documents
       set status = 'issued', number = p_number, issued_by = auth.uid(), issued_at = now(),
           pdf_path = r.path, pdf_sha256 = r.sha256
     where assessment_id = p_assessment and kind = r.kind::public.document_kind;
  end loop;
  perform set_config('tamkeen.in_document_fn', '0', true);

  if exists (select 1 from public.assessment_documents where assessment_id = p_assessment and (pdf_path is null or status <> 'issued')) then
    raise exception 'Each document needs its PDF' using errcode = 'check_violation';
  end if;
  return a;
end $$;
grant execute on function public.issue_results(uuid, text, jsonb) to authenticated;

-- Organizations and evaluators may not read verdict columns before issuance? They may: the evaluator writes them,
-- the organization sees only is_met/org_note through the UI (verdicts stay internal by product rule, MoM point 15).
-- The supervisor already reads all responses (migration 7).

-- ---------------------------------------------------------------
-- 8. Programs (طموحي) contract
-- ---------------------------------------------------------------
create table public.programs (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  title        text not null,
  summary      text,
  track_id     uuid references public.tracks(id),       -- primary track; indicator mapping below is what recommendations use
  level_min    smallint not null default 0 check (level_min between 0 and 4),   -- recommended when review level is within [min, max]
  level_max    smallint not null default 2 check (level_max between 0 and 4),
  duration_hours numeric(5,1),
  delivery     text check (delivery in ('online', 'in_person', 'blended', 'self_paced')),
  url          text,                                      -- deep link into طموحي
  is_active    boolean not null default true,
  sort_order   int not null default 100,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (level_min <= level_max)
);
create trigger update_programs_updated_at before update on public.programs
  for each row execute function public.update_updated_at_column();

create table public.program_indicators (
  program_id   uuid not null references public.programs(id) on delete cascade,
  indicator_id uuid not null references public.indicators(id),
  primary key (program_id, indicator_id)
);

alter table public.programs enable row level security;
alter table public.program_indicators enable row level security;
create policy "programs: public read" on public.programs for select to anon, authenticated using (is_active);
create policy "programs: admin write" on public.programs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "program_indicators: public read" on public.program_indicators for select to anon, authenticated using (true);
create policy "program_indicators: admin write" on public.program_indicators for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Default recommendation (the readiness tool owns the final rules and may replace this view):
-- a program is recommended for an assessment when it maps to at least one indicator whose frozen review level
-- falls inside the program's level range; ranked by how many such indicators it covers, then by the lowest level.
create view public.v_program_recommendations with (security_invoker = true) as
select r.assessment_id, p.id as program_id, p.code, p.title, p.url, p.track_id,
       count(*)::int as matched_indicators,
       min(r.review_level)::smallint as lowest_level,
       array_agg(r.indicator_id order by r.review_level, r.indicator_number) as indicator_ids
from public.assessment_results r
join public.program_indicators pi on pi.indicator_id = r.indicator_id
join public.programs p on p.id = pi.program_id and p.is_active
where r.review_level between p.level_min and p.level_max
group by r.assessment_id, p.id, p.code, p.title, p.url, p.track_id;
grant select on public.v_program_recommendations to authenticated;

-- ---------------------------------------------------------------
-- 9. Documents bucket (private; path {assessment_id}/{kind}.pdf)
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

create policy "document files: admin all" on storage.objects for all to authenticated
  using (bucket_id = 'documents' and public.is_admin()) with check (bucket_id = 'documents' and public.is_admin());
create policy "document files: issuer writes" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and public.can_issue_results());
create policy "document files: issuer replaces" on storage.objects for update to authenticated
  using (bucket_id = 'documents' and public.can_issue_results());
create policy "document files: supervisor reads" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and public.is_supervisor());
create policy "document files: evaluator reads assigned" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and public.is_assigned_evaluator(((storage.foldername(name))[1])::uuid));
create policy "document files: org reads issued" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and exists (
    select 1 from public.assessments a
    where a.id = ((storage.foldername(name))[1])::uuid and a.organization_id = public.current_org_id() and a.status = 'issued'));

-- ---------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------
grant select on public.assessment_results, public.assessment_documents, public.assessment_document_lines to authenticated;
grant insert, update, delete on public.assessment_document_lines to authenticated;
grant select on public.programs, public.program_indicators to anon, authenticated;
revoke all on public.v_assessment_results_tracks, public.v_assessment_results_overall, public.v_program_recommendations from anon;
