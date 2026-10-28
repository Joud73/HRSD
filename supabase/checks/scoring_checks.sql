-- Scoring verification for the approved rule (run on staging after migration 7, as postgres in SQL Editor).
-- Scenario on منظمة الاختبار أ (aaaaaaaa-0000-0000-0000-000000000001), indicator 1 (7 items) and indicator 2 (6 items):
--   indicator 1: 7 items met, 7 with evidence            -> 100 %  level 4  متحقق بالكامل
--   indicator 2: 6 items met, only 3 with evidence       ->  50 %  level 1  متحقق جزئياً   (met without evidence does not count)
--   indicator 3: nothing                                 ->   0 %  level 0  غير متحقق
-- Track 1 (13 indicators): avg_level = (4 + 1 + 0 * 11) / 13 = 0.38
-- Everything is wrapped in a transaction and rolled back: nothing is left behind.

begin;

do $$
declare
  v_a   uuid;
  v_u   uuid;
  v_tool uuid := md5('cts-v0.2.1')::uuid;
begin
  select id into v_u from auth.users where email = 'org.a@tamkeen.local';
  select id into v_a from public.assessments
   where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
     and cycle_id = (select id from public.assessment_cycles where status = 'open');
  if v_a is null then raise exception 'No assessment for org A in the open cycle: run seed/test_accounts.sql first'; end if;

  delete from public.evidences where assessment_id = v_a;
  delete from public.item_responses where assessment_id = v_a;

  -- indicator 1: all 7 items met with evidence
  insert into public.item_responses (assessment_id, item_id, is_met, updated_by)
  select v_a, i.id, true, v_u from public.items i where i.tool_version_id = v_tool and i.indicator_id = md5('cts-v0.2.1-indicator-1')::uuid;
  insert into public.evidences (assessment_id, item_id, kind, url, uploaded_by)
  select v_a, i.id, 'link', 'https://example.org/evidence/' || i.number, v_u from public.items i
   where i.tool_version_id = v_tool and i.indicator_id = md5('cts-v0.2.1-indicator-1')::uuid;

  -- indicator 2: 6 met, evidence on the first 3 only
  insert into public.item_responses (assessment_id, item_id, is_met, updated_by)
  select v_a, i.id, true, v_u from public.items i where i.tool_version_id = v_tool and i.indicator_id = md5('cts-v0.2.1-indicator-2')::uuid;
  insert into public.evidences (assessment_id, item_id, kind, url, uploaded_by)
  select v_a, i.id, 'link', 'https://example.org/evidence/' || i.number, v_u from public.items i
   where i.tool_version_id = v_tool and i.indicator_id = md5('cts-v0.2.1-indicator-2')::uuid
   order by i.number limit 3;
end $$;

-- Expected: (1, 7, 7, 7, 100, 4, 'متحقق بالكامل'), (2, 6, 6, 3, 50, 1, 'متحقق جزئياً'), (3, 6, 0, 0, 0, 0, 'غير متحقق')
select indicator_number, items_total, items_met, items_counted, score_pct, level, level_label
from public.v_indicator_scores
where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001' and indicator_number <= 3
order by indicator_number;

-- Expected track 1: indicators_total 13, indicators_complete 1, indicators_started 2, avg_level 0.38
select track_number, indicators_total, indicators_started, indicators_complete, items_met, items_counted, avg_level, progress_pct
from public.v_track_scores
where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
order by track_number;

-- Expected: items_total 378, items_met 13, items_counted 10, progress_pct 3, score_pct 3
select items_total, items_met, items_with_evidence, items_counted, progress_pct, score_pct, avg_level, indicators_started, indicators_complete
from public.v_assessment_progress
where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001';

-- Exclusion check: excluding item 1 of indicator 1 turns it into 6/6 (still 100 %) and removes it from the form.
insert into public.cycle_item_exclusions (cycle_id, item_id, reason)
select c.id, md5('cts-v0.2.1-item-1')::uuid, 'check' from public.assessment_cycles c where c.status = 'open';
select indicator_number, items_total, items_counted, score_pct, level
from public.v_indicator_scores
where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001' and indicator_number = 1;
-- Expected: (1, 6, 6, 100, 4)

rollback;
