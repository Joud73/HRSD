-- Demo reset for STAGING ONLY. Never run on prod. Run as postgres in the SQL Editor (or `supabase db query --linked -f`).
-- Idempotent: every run puts org A (منظمة الاختبار أ) back into the same demo state in the open cycle.
-- Prerequisite: supabase/seed/test_accounts.sql has run (org A, org.a and evaluator1 users, admin.test).
--
-- Demo state:
--   track 1: every item met with one link evidence, EXCEPT indicator 1 (first indicator of the track), left empty
--            for the live demo (tick + evidence -> label changes from غير مكتمل)
--   track 2: every item met with one link evidence (complete, level 4)
--   track 3: first half of each indicator's items met with evidence, plus one item met WITHOUT evidence
--            (shows the warning in the submit dialog)
--   tracks 4 and 5: empty

begin;

do $$
declare
  v_org   uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_user  uuid;
  v_eval  uuid;
  v_admin uuid;
  v_cycle uuid;
  v_tool  uuid;
  v_a     uuid;
begin
  select id into v_user  from auth.users where email = 'org.a@tamkeen.local';
  select id into v_eval  from auth.users where email = 'evaluator1@tamkeen.local';
  select id into v_admin from auth.users where email = 'admin.test@tamkeen.local';
  select id, tool_version_id into v_cycle, v_tool from public.assessment_cycles where status = 'open';
  if v_user is null or v_eval is null or v_admin is null then
    raise exception 'Test users missing: create them and run seed/test_accounts.sql first';
  end if;
  if v_cycle is null then raise exception 'No open cycle'; end if;

  -- Fresh draft (responses, evidences, history and the review assignment go with the old row)
  delete from public.assessments where organization_id = v_org and cycle_id = v_cycle;
  insert into public.assessments (cycle_id, organization_id) values (v_cycle, v_org) returning id into v_a;
  insert into public.assessment_reviews (assessment_id, evaluator_id, assigned_by) values (v_a, v_eval, v_admin);

  -- Items with their track, indicator and position inside the indicator
  create temp table demo_items on commit drop as
  select i.id as item_id, i.number as item_number, t.number as track_number, ind.number as indicator_number,
         row_number() over (partition by ind.id order by i.number) as pos,
         count(*)    over (partition by ind.id)                     as n,
         min(ind.number) over (partition by t.id)                   as first_indicator
  from public.items i
  join public.indicators ind on ind.id = i.indicator_id
  join public.standards s    on s.id = ind.standard_id
  join public.tracks t       on t.id = s.track_id
  where i.tool_version_id = v_tool
    and not exists (select 1 from public.cycle_item_exclusions x where x.cycle_id = v_cycle and x.item_id = i.id);

  -- Met and evidenced: tracks 1 (minus its first indicator) and 2, first half of every track 3 indicator
  create temp table demo_met on commit drop as
  select item_id, item_number from demo_items
  where (track_number = 1 and indicator_number <> first_indicator)
     or track_number = 2
     or (track_number = 3 and pos <= n / 2);

  insert into public.item_responses (assessment_id, item_id, is_met, updated_by)
  select v_a, item_id, true, v_user from demo_met;

  insert into public.evidences (assessment_id, item_id, kind, url, uploaded_by)
  select v_a, item_id, 'link', 'https://example.org/evidence/' || item_number, v_user from demo_met;

  -- Track 3: one item met without evidence (the first one after the half, in the track's first indicator)
  insert into public.item_responses (assessment_id, item_id, is_met, updated_by)
  select v_a, item_id, true, v_user from demo_items
  where track_number = 3 and indicator_number = first_indicator and pos = n / 2 + 1;
end $$;

commit;

select track_number, indicators_total, indicators_started, indicators_complete,
       items_total, items_met, items_counted, avg_level, avg_score_pct, progress_pct
from public.v_track_scores
where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
  and cycle_id = (select id from public.assessment_cycles where status = 'open')
order by track_number;
