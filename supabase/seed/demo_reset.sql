-- Demo reset for STAGING ONLY. Never run on prod. Run as postgres in the SQL Editor (or `supabase db query --linked -f`).
-- Idempotent: every run puts org A (منظمة الاختبار أ) back into the same demo state in the open cycle,
-- and org B (منظمة الاختبار ب) back to a fresh, empty draft (its evaluator assignment, if any, is kept).
-- Prerequisite: supabase/seed/test_accounts.sql has run (org A, org.a and evaluator1 users, admin.test).
-- Uploaded files: deleting an assessment removes its evidence rows, not the files in the private bucket.
-- Remove the files first through the Storage API (e2e/reset-demo.mjs does it, with the issued document PDFs,
-- then runs this script).
-- Since migration 11 an item is met only through its evidence: items_met equals the evidence count (182 for org A).
--
-- Demo state:
--   track 1: every item met with one link evidence, EXCEPT indicator 1 (first indicator of the track), left empty
--            for the live demo (add evidence -> label changes from غير مكتمل)
--   track 2: every item met with one link evidence (complete, level 4)
--   track 3: first half of each indicator's items met with evidence, plus one response marked met WITHOUT
--            evidence (kept from phase 3; the evidence trigger stores it as not met, so it does not count)
--   tracks 4 and 5: empty
-- Org B: draft with no responses or evidences.
-- Both: HRSD profile fields and one delegate (test values), so the evaluator's organization card is complete.

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

  -- Fresh draft (responses, evidences, history and the review assignment go with the old row).
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

-- Org B: fresh empty draft, same evaluator as before (none if it had none)
do $$
declare
  v_org   uuid := 'aaaaaaaa-0000-0000-0000-000000000002';
  v_cycle uuid;
  v_eval  uuid;
  v_by    uuid;
  v_a     uuid;
begin
  select id into v_cycle from public.assessment_cycles where status = 'open';
  select r.evaluator_id, r.assigned_by into v_eval, v_by
  from public.assessment_reviews r join public.assessments a on a.id = r.assessment_id
  where a.organization_id = v_org and a.cycle_id = v_cycle;

  delete from public.assessments where organization_id = v_org and cycle_id = v_cycle;
  insert into public.assessments (cycle_id, organization_id) values (v_cycle, v_org) returning id into v_a;
  if v_eval is not null then
    insert into public.assessment_reviews (assessment_id, evaluator_id, assigned_by) values (v_a, v_eval, v_by);
  end if;
end $$;

-- HRSD profile and delegate of both test organizations (organization card on the evaluator's review page).
-- Lookups by official code; never SC-01 in demo data.
do $$
begin
  if not exists (select 1 from public.social_dev_centers where code in ('SDC-07', 'SDC-28') having count(*) = 2)
     or not exists (select 1 from public.sub_classifications where code in ('SC-04', 'SC-05') having count(*) = 2) then
    raise exception 'Demo lookups missing: SDC-07, SDC-28, SC-04, SC-05';
  end if;

  update public.organizations set
    entity_type = 'association', registration_date = date '2019-03-10',
    sub_classification_id = (select id from public.sub_classifications where code = 'SC-04'),
    social_dev_center_id  = (select id from public.social_dev_centers where code = 'SDC-07'),
    region = 'الرياض', city = 'الرياض', district = 'العليا',
    address = 'طريق الملك فهد', employees_count = 24, email = 'info@org-a.example', website = 'https://org-a.example'
  where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  update public.organizations set
    entity_type = 'foundation', registration_date = date '2021-09-01',
    sub_classification_id = (select id from public.sub_classifications where code = 'SC-05'),
    social_dev_center_id  = (select id from public.social_dev_centers where code = 'SDC-28'),
    region = 'الشرقية', city = 'الدمام', district = 'الفيصلية',
    address = 'شارع الملك سعود', employees_count = 9, email = 'info@org-b.example', website = null
  where id = 'aaaaaaaa-0000-0000-0000-000000000002';

  delete from public.delegates where organization_id in ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002')
     or user_id in (select id from auth.users where email in ('org.a@tamkeen.local', 'org.b@tamkeen.local'));
  insert into public.delegates (organization_id, user_id, full_name, id_number, mobile, email)
  select 'aaaaaaaa-0000-0000-0000-000000000001', id, 'سارة العتيبي', '1000000001', '0550000001', 'delegate.a@org-a.example'
  from auth.users where email = 'org.a@tamkeen.local';
  insert into public.delegates (organization_id, user_id, full_name, id_number, mobile, email)
  select 'aaaaaaaa-0000-0000-0000-000000000002', id, 'خالد الشمري', '1000000002', '0550000002', 'delegate.b@org-b.example'
  from auth.users where email = 'org.b@tamkeen.local';
end $$;

commit;

select o.name, a.status, p.progress_pct, p.items_met,
       (select count(*) from public.evidences e where e.assessment_id = a.id) as evidences
from public.assessments a
join public.organizations o on o.id = a.organization_id
join public.v_assessment_progress p on p.assessment_id = a.id
where a.cycle_id = (select id from public.assessment_cycles where status = 'open')
order by o.name;
