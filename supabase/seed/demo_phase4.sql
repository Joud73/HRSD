-- Phase 4 demo state for STAGING ONLY. Never run on prod. Run as postgres (`supabase db query --linked -f`).
-- Idempotent: every run puts org B (منظمة الاختبار ب) into the same review state in the open cycle.
-- Run after demo_reset.sql (node e2e/reset-demo.mjs), which leaves org A in its demo state and org B as a draft.
-- Prerequisite: seed/test_accounts.sql (org.b, evaluator2, admin.test).
--
-- Org B, under review, assigned to evaluator2:
--   evidence (one link each) on every item of tracks 1 and 2 and the first half of every track 3 indicator
--   verdicts on every evidenced item EXCEPT the first 3 items of track 1 indicator 1 (pending: the demo records them)
--   two rejections with notes: item 1 of track 1 indicator 2, and item 1 of track 3's first indicator
-- No documents yet: they are generated when the last pending verdict is recorded.
-- Since migration 11, items_met equals the evidence count.

begin;

do $$
declare
  v_org   uuid := 'aaaaaaaa-0000-0000-0000-000000000002';
  v_user  uuid;
  v_eval  uuid;
  v_admin uuid;
  v_cycle uuid;
  v_tool  uuid;
  v_a     uuid;
begin
  select id into v_user  from auth.users where email = 'org.b@tamkeen.local';
  select id into v_eval  from auth.users where email = 'evaluator2@tamkeen.local';
  select id into v_admin from auth.users where email = 'admin.test@tamkeen.local';
  select id, tool_version_id into v_cycle, v_tool from public.assessment_cycles where status = 'open';
  if v_user is null or v_eval is null or v_admin is null then
    raise exception 'Test users missing: run seed/test_accounts.sql first';
  end if;
  if v_cycle is null then raise exception 'No open cycle'; end if;

  -- Fresh assessment (responses, evidences, documents, results and the assignment go with the old row).
  -- Inserted directly as under_review: the status guard only blocks updates.
  delete from public.assessments where organization_id = v_org and cycle_id = v_cycle;
  insert into public.assessments (cycle_id, organization_id, status, submitted_at)
  values (v_cycle, v_org, 'under_review', now() - interval '3 days')
  returning id into v_a;
  insert into public.assessment_reviews (assessment_id, evaluator_id, assigned_by) values (v_a, v_eval, v_admin);

  create temp table p4_items on commit drop as
  select i.id as item_id, i.number as item_number, t.number as track_number, ind.number as indicator_number,
         row_number() over (partition by ind.id order by i.number) as pos,
         count(*)    over (partition by ind.id)                     as n,
         dense_rank() over (partition by t.id order by ind.number)  as ind_in_track
  from public.items i
  join public.indicators ind on ind.id = i.indicator_id
  join public.standards s    on s.id = ind.standard_id
  join public.tracks t       on t.id = s.track_id
  where i.tool_version_id = v_tool
    and not exists (select 1 from public.cycle_item_exclusions x where x.cycle_id = v_cycle and x.item_id = i.id);

  create temp table p4_evidenced on commit drop as
  select * from p4_items
  where track_number in (1, 2) or (track_number = 3 and pos <= n / 2);

  -- Evidence: the evidence trigger creates each response row with is_met = true
  insert into public.evidences (assessment_id, item_id, kind, url, file_name, uploaded_by)
  select v_a, item_id, 'link', 'https://example.org/evidence/b/' || item_number, 'شاهد البند ' || item_number, v_user
  from p4_evidenced;

  -- Verdicts: confirm everything except the 3 pending items, then the two rejections
  update public.item_responses r set verified = true
  from p4_evidenced e
  where r.assessment_id = v_a and r.item_id = e.item_id
    and not (e.track_number = 1 and e.ind_in_track = 1 and e.pos <= 3);

  update public.item_responses r set verified = false, evaluator_note = 'الشاهد لا يغطي الفترة المطلوبة، أرفقوا سجلاً محدثاً.'
  from p4_evidenced e
  where r.assessment_id = v_a and r.item_id = e.item_id and e.track_number = 1 and e.ind_in_track = 2 and e.pos = 1;

  update public.item_responses r set verified = false, evaluator_note = 'الرابط لا يفتح وثيقة معتمدة.'
  from p4_evidenced e
  where r.assessment_id = v_a and r.item_id = e.item_id and e.track_number = 3 and e.ind_in_track = 1 and e.pos = 1;

  if public.pending_verdicts(v_a) <> 3 then
    raise exception 'Expected 3 pending verdicts, found %', public.pending_verdicts(v_a);
  end if;
end $$;

commit;

select o.name, a.status, p.items_with_evidence, p.items_review_counted as confirmed, p.items_review_rejected as rejected,
       p.items_review_pending as pending, p.score_pct, p.review_score_pct,
       (select count(*) from public.assessment_documents d where d.assessment_id = a.id) as documents,
       (select u.email from public.assessment_reviews r join auth.users u on u.id = r.evaluator_id where r.assessment_id = a.id) as evaluator
from public.assessments a
join public.organizations o on o.id = a.organization_id
join public.v_assessment_progress p on p.assessment_id = a.id
where a.organization_id = 'aaaaaaaa-0000-0000-0000-000000000002'
  and a.cycle_id = (select id from public.assessment_cycles where status = 'open');
