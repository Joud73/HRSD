-- Phase 4 review and results checks (evidence rule, verdicts, approval gate, documents, issuance, document integrity, programs). 25 cases.
-- STAGING ONLY, run as postgres:
--   npx supabase db query --linked -f supabase/checks/review_checks.sql
-- One transaction, rolled back at the end: nothing is kept. Each case switches to the test user
-- (set local role + request.jwt.claims). Prerequisite: seed/test_accounts.sql (org A assigned to evaluator1,
-- org B to evaluator2). Org A's answers are cleared inside the transaction, so the demo state is untouched.

begin;

create temp table rls_out (n numeric, who text, action text, expected text, actual text, pass boolean) on commit drop;
grant all on rls_out to authenticated, anon;

-- cycle dates: review may start today (migration 11 relaxed the constraint); restored by the rollback
update public.assessment_cycles set review_start = least(review_start, current_date) where status = 'open';

create temp table ids on commit drop as
select
  (select id from auth.users where email = 'admin.test@tamkeen.local')      as admin,
  (select id from auth.users where email = 'org.a@tamkeen.local')           as org_a,
  (select id from auth.users where email = 'evaluator1@tamkeen.local')      as eval1,
  (select id from auth.users where email = 'evaluator2@tamkeen.local')      as eval2,
  (select id from auth.users where email = 'supervisor.test@tamkeen.local') as sup,
  (select a.id from assessments a join assessment_cycles c on c.id = a.cycle_id and c.status = 'open'
    where a.organization_id = 'aaaaaaaa-0000-0000-0000-000000000001') as a_id,
  (select id from assessment_cycles where status = 'open') as cycle_id,
  (select i.id from items i join indicators ind on ind.id = i.indicator_id join standards s on s.id = ind.standard_id
     join tracks t on t.id = s.track_id join assessment_cycles c on c.tool_version_id = i.tool_version_id and c.status = 'open'
   where t.number = 1 and ind.number = 1 order by i.number limit 1) as item_a,
  (select i.id from items i join indicators ind on ind.id = i.indicator_id join standards s on s.id = ind.standard_id
     join tracks t on t.id = s.track_id join assessment_cycles c on c.tool_version_id = i.tool_version_id and c.status = 'open'
   where t.number = 1 and ind.number = 1 order by i.number offset 1 limit 1) as item_a2,
  (select i.id from items i join indicators ind on ind.id = i.indicator_id join standards s on s.id = ind.standard_id
     join tracks t on t.id = s.track_id join assessment_cycles c on c.tool_version_id = i.tool_version_id and c.status = 'open'
   where t.number = 5 order by ind.number, i.number limit 1) as item_5,
  (select ind.id from indicators ind join assessment_cycles c on c.tool_version_id = ind.tool_version_id and c.status = 'open'
   where ind.number = 1) as indicator_1;
grant select on ids to authenticated, anon;

-- org A back to an empty draft (as postgres; rolled back with everything else)
delete from public.assessment_document_lines where document_id in (select id from public.assessment_documents where assessment_id = (select a_id from ids));
delete from public.assessment_documents where assessment_id = (select a_id from ids);
delete from public.assessment_results where assessment_id = (select a_id from ids);
delete from public.evidences where assessment_id = (select a_id from ids);
delete from public.item_responses where assessment_id = (select a_id from ids);
select set_config('tamkeen.in_transition', '1', true);
update public.assessments set status = 'draft', submitted_at = null, returned_at = null, approved_at = null, issued_at = null, return_note = null
 where id = (select a_id from ids);
select set_config('tamkeen.in_transition', '0', true);

create function pg_temp.claims(uid uuid) returns text language sql as
$$ select json_build_object('sub', uid, 'role', 'authenticated')::text $$;

-- ── 27. org A: a tick without evidence is not met ──
select set_config('request.jwt.claims', pg_temp.claims((select org_a from ids)), true);
set local role authenticated;
do $$ declare m boolean; begin
  insert into item_responses (assessment_id, item_id, is_met) values ((select a_id from ids), (select item_a from ids), true);
  select is_met into m from item_responses where assessment_id = (select a_id from ids) and item_id = (select item_a from ids);
  insert into rls_out values (27, 'org A', 'insert item_responses is_met = true, no evidence', 'is_met false', m::text, m = false);
end $$;

-- ── 28. org A: evidence makes the item met ──
do $$ declare m boolean; begin
  insert into evidences (assessment_id, item_id, kind, url, uploaded_by)
  values ((select a_id from ids), (select item_a from ids), 'link', 'https://example.org/a', auth.uid());
  select is_met into m from item_responses where assessment_id = (select a_id from ids) and item_id = (select item_a from ids);
  insert into rls_out values (28, 'org A', 'insert evidence on item', 'is_met true', m::text, m = true);
end $$;

-- ── 29. org A: removing the last evidence un-meets the item ──
do $$ declare m boolean; begin
  delete from evidences where assessment_id = (select a_id from ids) and item_id = (select item_a from ids);
  select is_met into m from item_responses where assessment_id = (select a_id from ids) and item_id = (select item_a from ids);
  insert into rls_out values (29, 'org A', 'delete last evidence', 'is_met false', m::text, m = false);
end $$;

-- ── 30. org A: two evidences (a new item row appears on its own), then submit ──
do $$ declare s text; n int; begin
  insert into evidences (assessment_id, item_id, kind, url, uploaded_by) values
    ((select a_id from ids), (select item_a  from ids), 'link', 'https://example.org/a', auth.uid()),
    ((select a_id from ids), (select item_a2 from ids), 'link', 'https://example.org/b', auth.uid());
  select count(*) into n from item_responses where assessment_id = (select a_id from ids) and is_met;
  select status into s from transition_assessment((select a_id from ids), 'submitted');
  insert into rls_out values (30, 'org A', 'evidence on 2 items, submit', '2 met, submitted', n || ' met, ' || s, n = 2 and s = 'submitted');
end $$;

-- ── 31. evaluator1 starts the review (review period may overlap submission now) ──
select set_config('request.jwt.claims', pg_temp.claims((select eval1 from ids)), true);
do $$ declare s text; begin
  select status into s from transition_assessment((select a_id from ids), 'under_review');
  insert into rls_out values (31, 'evaluator1', 'transition under_review', 'under_review', s, s = 'under_review');
exception when others then
  insert into rls_out values (31, 'evaluator1', 'transition under_review', 'under_review', left(sqlerrm, 90), false);
end $$;

-- ── 32. evaluator1: no verdict on an item without evidence ──
do $$ begin
  begin
    insert into item_responses (assessment_id, item_id, verified) values ((select a_id from ids), (select item_5 from ids), true);
    insert into rls_out values (32, 'evaluator1', 'verdict on item without evidence', 'error', 'inserted', false);
  exception when others then
    insert into rls_out values (32, 'evaluator1', 'verdict on item without evidence', 'error', left(sqlerrm, 90), true);
  end;
end $$;

-- ── 33. evaluator1: approval is blocked while verdicts are pending ──
do $$ begin
  begin
    perform transition_assessment((select a_id from ids), 'approved');
    insert into rls_out values (33, 'evaluator1', 'approve with 2 pending verdicts', 'error: await a verdict', 'approved', false);
  exception when others then
    insert into rls_out values (33, 'evaluator1', 'approve with 2 pending verdicts', 'error: await a verdict', left(sqlerrm, 90), sqlerrm like '%await a verdict%');
  end;
end $$;

-- ── 34. evaluator1 records the verdicts; the documents appear on their own ──
do $$ declare d int; st int; op int; tk int; begin
  update item_responses set verified = true  where assessment_id = (select a_id from ids) and item_id = (select item_a from ids);
  update item_responses set verified = false, evaluator_note = 'الشاهد لا يغطي البند' where assessment_id = (select a_id from ids) and item_id = (select item_a2 from ids);
  select count(*) into d from assessment_documents where assessment_id = (select a_id from ids);
  select count(*) into st from assessment_document_lines l join assessment_documents x on x.id = l.document_id where x.assessment_id = (select a_id from ids) and l.section = 'strength';
  select count(*) into op from assessment_document_lines l join assessment_documents x on x.id = l.document_id where x.assessment_id = (select a_id from ids) and l.section = 'opportunity';
  select count(*) into tk from assessment_document_lines l join assessment_documents x on x.id = l.document_id where x.assessment_id = (select a_id from ids) and l.section = 'task';
  insert into rls_out values (34, 'evaluator1', 'last verdict recorded', '2 docs, 1 strength, 377 opportunities, 377 tasks',
    d || ' docs, ' || st || ' strength, ' || op || ' opportunities, ' || tk || ' tasks', d = 2 and st = 1 and op = 377 and tk = 377);
end $$;

-- ── 35. evaluator1 edits a task line; fixed columns stay fixed ──
do $$ declare e boolean; ok2 boolean := false; begin
  update assessment_document_lines set text = 'نص معدل من المدقق'
   where id = (select l.id from assessment_document_lines l join assessment_documents x on x.id = l.document_id
               where x.assessment_id = (select a_id from ids) and l.section = 'task' order by l.sort_order limit 1);
  select edited into e from assessment_document_lines l join assessment_documents x on x.id = l.document_id
   where x.assessment_id = (select a_id from ids) and l.section = 'task' and l.text = 'نص معدل من المدقق';
  begin
    update assessment_document_lines set source = 'manual'
     where id = (select l.id from assessment_document_lines l join assessment_documents x on x.id = l.document_id
                 where x.assessment_id = (select a_id from ids) and l.section = 'task' order by l.sort_order limit 1);
  exception when others then ok2 := true;
  end;
  insert into rls_out values (35, 'evaluator1', 'edit line text; change source', 'edited true; source error', 'edited ' || e || '; ' || case when ok2 then 'error' else 'changed' end, e and ok2);
end $$;

-- ── 36. evaluator1 adds a manual line ──
do $$ declare s text; begin
  insert into assessment_document_lines (document_id, section, track_id, standard_id, indicator_id, sort_order, text, source)
  select x.id, 'task', t.id, st.id, null, 999, 'مهمة يضيفها المدقق', 'auto'
  from assessment_documents x, tracks t join standards st on st.track_id = t.id
  where x.assessment_id = (select a_id from ids) and x.kind = 'improvement_plan' and t.number = 1 and st.number = 1
    and t.tool_version_id = (select tool_version_id from assessment_cycles where id = (select cycle_id from ids));
  select source into s from assessment_document_lines where text = 'مهمة يضيفها المدقق';
  insert into rls_out values (36, 'evaluator1', 'insert line with source auto', 'source forced to manual', s, s = 'manual');
end $$;

-- ── 37. org A sees no documents before issuance ──
select set_config('request.jwt.claims', pg_temp.claims((select org_a from ids)), true);
do $$ declare n int; begin
  select count(*) into n from assessment_documents where assessment_id = (select a_id from ids);
  insert into rls_out values (37, 'org A', 'select assessment_documents (draft)', '0', n::text, n = 0);
end $$;

-- ── 38. return to the organization; new evidence resets the verdict; resubmit ──
select set_config('request.jwt.claims', pg_temp.claims((select eval1 from ids)), true);
do $$ declare v boolean; s text; p int; begin
  perform transition_assessment((select a_id from ids), 'returned', 'أكمل الشاهد على البند الثاني');
  perform set_config('request.jwt.claims', pg_temp.claims((select org_a from ids)), true);
  insert into evidences (assessment_id, item_id, kind, url, uploaded_by)
  values ((select a_id from ids), (select item_a from ids), 'link', 'https://example.org/a2', auth.uid());
  select verified into v from item_responses where assessment_id = (select a_id from ids) and item_id = (select item_a from ids);
  select status into s from transition_assessment((select a_id from ids), 'submitted');
  perform set_config('request.jwt.claims', pg_temp.claims((select eval1 from ids)), true);
  perform transition_assessment((select a_id from ids), 'under_review');
  p := pending_verdicts((select a_id from ids));
  insert into rls_out values (38, 'eval1 / org A', 'return, org adds evidence on verified item, resubmit', 'verified null, submitted, 1 pending',
    coalesce(v::text, 'null') || ', ' || s || ', ' || p || ' pending', v is null and s = 'submitted' and p = 1);
end $$;

-- ── 39. evaluator1 approves: results frozen, documents approved ──
do $$ declare s text; r int; rc int; ds text; hp int; begin
  update item_responses set verified = true where assessment_id = (select a_id from ids) and item_id = (select item_a from ids);
  select status into s from transition_assessment((select a_id from ids), 'approved');
  select count(*), sum(review_counted) into r, rc from assessment_results where assessment_id = (select a_id from ids);
  select string_agg(distinct status::text, ',') into ds from assessment_documents where assessment_id = (select a_id from ids);
  select (header->>'review_pct')::int into hp from assessment_documents where assessment_id = (select a_id from ids) and kind = 'feedback_report';
  insert into rls_out values (39, 'evaluator1', 'approve', 'approved, 61 results, 1 review_counted, docs approved, header review_pct 0',
    s || ', ' || r || ' results, ' || rc || ' review_counted, docs ' || ds || ', header ' || hp, s = 'approved' and r = 61 and rc = 1 and ds = 'approved' and hp = 0);
end $$;

-- ── 40. supervisor sends it back to the evaluator (note required) ──
select set_config('request.jwt.claims', pg_temp.claims((select sup from ids)), true);
do $$ declare s text; r int; ds text; e1 boolean := false; begin
  begin
    perform transition_assessment((select a_id from ids), 'under_review');
  exception when others then e1 := true;
  end;
  select status into s from transition_assessment((select a_id from ids), 'under_review', 'راجع صياغة المهام');
  select count(*) into r from assessment_results where assessment_id = (select a_id from ids);
  select string_agg(distinct status::text, ',') into ds from assessment_documents where assessment_id = (select a_id from ids);
  insert into rls_out values (40, 'supervisor', 'return to evaluator without / with note', 'error; under_review, 0 results, docs draft',
    case when e1 then 'error; ' else 'passed; ' end || s || ', ' || r || ' results, docs ' || ds, e1 and s = 'under_review' and r = 0 and ds = 'draft');
end $$;

-- ── 41. evaluator1 approves again ──
select set_config('request.jwt.claims', pg_temp.claims((select eval1 from ids)), true);
do $$ declare s text; begin
  select status into s from transition_assessment((select a_id from ids), 'approved');
  insert into rls_out values (41, 'evaluator1', 'approve again', 'approved', s, s = 'approved');
end $$;

-- ── 49 to 51. document integrity (migration 13): canonical paths only, writes only while approved ──
select set_config('request.jwt.claims', pg_temp.claims((select sup from ids)), true);
do $$ declare e boolean := false; begin
  begin
    perform issue_results((select a_id from ids), results_number((select a_id from ids)), jsonb_build_array(
      jsonb_build_object('kind', 'feedback_report',  'path', 'other-folder/feedback_report.pdf', 'sha256', repeat('a', 64)),
      jsonb_build_object('kind', 'improvement_plan', 'path', (select a_id from ids) || '/improvement_plan.pdf', 'sha256', repeat('b', 64))));
  exception when others then e := sqlerrm like 'Invalid PDF entry%';
  end;
  insert into rls_out values (49, 'supervisor', 'issue_results with a PDF outside the assessment folder', 'error: invalid entry', case when e then 'error' else 'accepted' end, e);
end $$;
do $$ declare ok1 boolean := false; e2 boolean := false; begin
  begin
    insert into storage.objects (bucket_id, name) values ('documents', (select a_id from ids) || '/feedback_report.pdf');
    ok1 := true;
  exception when others then ok1 := false;
  end;
  begin
    insert into storage.objects (bucket_id, name) values ('documents', (select a_id from ids) || '/notes.pdf');
  exception when others then e2 := true;
  end;
  insert into rls_out values (50, 'supervisor', 'upload canonical / other name while approved', 'allowed; refused',
    case when ok1 then 'allowed' else 'refused' end || '; ' || case when e2 then 'refused' else 'allowed' end, ok1 and e2);
end $$;

-- ── 42. supervisor issues: stale number refused, correct number publishes ──
select set_config('request.jwt.claims', pg_temp.claims((select sup from ids)), true);
do $$ declare s text; e1 boolean := false; num text; dn text; ia timestamptz; begin
  begin
    perform issue_results((select a_id from ids), 'ت.م.WRONG|00.00.00', '[]'::jsonb);
  exception when others then e1 := true;
  end;
  num := results_number((select a_id from ids));
  select status into s from issue_results((select a_id from ids), num, jsonb_build_array(
    jsonb_build_object('kind', 'feedback_report',   'path', (select a_id from ids) || '/feedback_report.pdf',   'sha256', repeat('a', 64)),
    jsonb_build_object('kind', 'improvement_plan',  'path', (select a_id from ids) || '/improvement_plan.pdf',  'sha256', repeat('b', 64))));
  select string_agg(distinct number, ',') into dn from assessment_documents where assessment_id = (select a_id from ids);
  select issued_at into ia from assessments where id = (select a_id from ids);
  insert into rls_out values (42, 'supervisor', 'issue_results wrong / right number', 'error; issued, number set',
    case when e1 then 'error; ' else 'passed; ' end || s || ', ' || dn || ', issued_at ' || (ia is not null), e1 and s = 'issued' and dn = num and ia is not null);
end $$;

-- ── 43. org A now reads its documents, lines and results ──
select set_config('request.jwt.claims', pg_temp.claims((select org_a from ids)), true);
do $$ declare d int; l int; r int; rp int; begin
  select count(*) into d from assessment_documents where assessment_id = (select a_id from ids);
  select count(*) into l from assessment_document_lines x join assessment_documents dd on dd.id = x.document_id where dd.assessment_id = (select a_id from ids);
  select count(*) into r from assessment_results where assessment_id = (select a_id from ids);
  select review_pct into rp from v_assessment_results_overall where assessment_id = (select a_id from ids);
  insert into rls_out values (43, 'org A', 'select documents, lines, results after issuance', '2 docs, 756 lines, 61 results, review_pct 0',
    d || ' docs, ' || l || ' lines, ' || r || ' results, review_pct ' || rp, d = 2 and l = 756 and r = 61 and rp = 0);
end $$;

-- ── 44. evaluator2 (not assigned to A) sees none of it ──
select set_config('request.jwt.claims', pg_temp.claims((select eval2 from ids)), true);
do $$ declare d int; r int; begin
  select count(*) into d from assessment_documents where assessment_id = (select a_id from ids);
  select count(*) into r from assessment_results where assessment_id = (select a_id from ids);
  insert into rls_out values (44, 'evaluator2', 'select org A documents and results', '0, 0', d || ', ' || r, d = 0 and r = 0);
end $$;

-- ── 45. programs: default recommendation reaches the organization ──
select set_config('request.jwt.claims', pg_temp.claims((select admin from ids)), true);
do $$ declare pid uuid; n int; begin
  insert into programs (code, title, track_id, level_min, level_max, url)
  select 'TMH-001', 'تحليل السياق للمنظمات غير الربحية', t.id, 0, 2, 'https://tamohi.example/programs/TMH-001'
  from tracks t where t.number = 1 and t.tool_version_id = (select tool_version_id from assessment_cycles where id = (select cycle_id from ids))
  returning id into pid;
  insert into program_indicators (program_id, indicator_id) values (pid, (select indicator_1 from ids));
  perform set_config('request.jwt.claims', pg_temp.claims((select org_a from ids)), true);
  select count(*) into n from v_program_recommendations where assessment_id = (select a_id from ids) and code = 'TMH-001';
  insert into rls_out values (45, 'admin / org A', 'program on indicator 1 (level 1) recommended', '1', n::text, n = 1);
end $$;

-- ── 46. anon reads the catalog, nothing else ──
select set_config('request.jwt.claims', '', true);
set local role anon;
do $$ declare n int; e boolean := false; begin
  select count(*) into n from programs;
  begin
    perform count(*) from assessment_documents;
  exception when others then e := true;
  end;
  insert into rls_out values (46, 'anon', 'select programs; select assessment_documents', '>= 1; permission denied', n || '; ' || case when e then 'denied' else 'allowed' end, n >= 1 and e);
end $$;

-- ── 47. supervisor cannot edit lines directly ──
set local role authenticated;
select set_config('request.jwt.claims', pg_temp.claims((select sup from ids)), true);
do $$ declare n int; begin
  begin
    update assessment_document_lines set text = 'x' where document_id in (select id from assessment_documents where assessment_id = (select a_id from ids));
    get diagnostics n = row_count;
    insert into rls_out values (47, 'supervisor', 'update document lines', '0 rows or error', n || ' rows', n = 0);
  exception when others then
    insert into rls_out values (47, 'supervisor', 'update document lines', '0 rows or error', left(sqlerrm, 90), true);
  end;
end $$;

-- ── 51. supervisor cannot replace a PDF after issuance ──
select set_config('request.jwt.claims', pg_temp.claims((select sup from ids)), true);
do $$ declare e boolean := false; begin
  begin
    insert into storage.objects (bucket_id, name) values ('documents', (select a_id from ids) || '/improvement_plan.pdf');
  exception when others then e := true;
  end;
  insert into rls_out values (51, 'supervisor', 'upload a PDF for an issued assessment', 'refused', case when e then 'refused' else 'allowed' end, e);
end $$;

-- ── 48. org A cannot issue ──
select set_config('request.jwt.claims', pg_temp.claims((select org_a from ids)), true);
do $$ begin
  begin
    perform issue_results((select a_id from ids), results_number((select a_id from ids)), '[]'::jsonb);
    insert into rls_out values (48, 'org A', 'issue_results', 'error', 'passed', false);
  exception when others then
    insert into rls_out values (48, 'org A', 'issue_results', 'error', left(sqlerrm, 90), true);
  end;
end $$;

reset role;
select n, who, action, expected, actual, case when pass then 'PASS' else 'FAIL' end as result from rls_out order by n;

rollback;
