-- طموحي checks: catalog access, recommendations from issued results, lesson gaps, enrollment and progress rules.
-- STAGING ONLY, run as postgres after migration 14 and seed/tamohi_catalog.sql:
--   npx supabase db query --linked -f supabase/checks/tamohi_checks.sql
-- One transaction, rolled back: org B is rebuilt inside it as an issued assessment (track 1 confirmed except
-- indicator 1, tracks 2 to 5 without evidence). Nothing is kept.

begin;

create temp table t_out (n int, who text, action text, expected text, actual text, pass boolean) on commit drop;
grant all on t_out to authenticated, anon;

create temp table tid on commit drop as
select
  (select id from auth.users where email = 'org.a@tamkeen.local') as org_a,
  (select id from auth.users where email = 'org.b@tamkeen.local') as org_b,
  'aaaaaaaa-0000-0000-0000-000000000002'::uuid as org_b_id,
  (select id from assessment_cycles where status = 'open') as cycle_id,
  (select tool_version_id from assessment_cycles where status = 'open') as tool_id,
  null::uuid as b_id;
grant select on tid to authenticated, anon;

-- build org B as issued (postgres: triggers maintain is_met; transition guard bypassed for setup only)
delete from assessments where organization_id = (select org_b_id from tid) and cycle_id = (select cycle_id from tid);
insert into assessments (cycle_id, organization_id, status, submitted_at)
select cycle_id, org_b_id, 'under_review', now() - interval '5 days' from tid;
update tid set b_id = (select id from assessments where organization_id = tid.org_b_id and cycle_id = tid.cycle_id);

insert into evidences (assessment_id, item_id, kind, url, uploaded_by)
select (select b_id from tid), i.id, 'link', 'https://example.org/e', (select org_b from tid)
from items i join indicators ind on ind.id = i.indicator_id join standards s on s.id = ind.standard_id
join tracks t on t.id = s.track_id
where t.number = 1 and i.tool_version_id = (select tool_id from tid);

-- setup writes verdicts as postgres: suspend auto-generation of documents (restored by the rollback)
alter table item_responses disable trigger trg_auto_generate_documents;
update item_responses r set verified = (ind.number <> 1)
from items i join indicators ind on ind.id = i.indicator_id
where r.item_id = i.id and r.assessment_id = (select b_id from tid);

insert into assessment_results (assessment_id, indicator_id, track_id, track_number, standard_id, indicator_number,
  items_total, self_counted, review_counted, self_pct, review_pct, self_level, review_level, review_label)
select assessment_id, indicator_id, track_id, track_number, standard_id, indicator_number,
  items_total, items_counted, items_review_counted, score_pct, review_score_pct, level, review_level, review_level_label
from v_indicator_scores where assessment_id = (select b_id from tid);

alter table item_responses enable trigger trg_auto_generate_documents;

select set_config('tamkeen.in_transition', '1', true);
update assessments set status = 'issued', approved_at = now(), issued_at = now() where id = (select b_id from tid);
select set_config('tamkeen.in_transition', '0', true);

create function pg_temp.claims(uid uuid) returns text language sql as
$$ select json_build_object('sub', uid, 'role', 'authenticated')::text $$;

-- expected numbers, computed as postgres from the tool itself
create temp table texp on commit drop as
select
  (select count(*) from items i join indicators ind on ind.id = i.indicator_id
    where ind.number = 1 and i.tool_version_id = (select tool_id from tid))::int as gaps_tmh01,
  (select count(*) from program_lessons l join program_modules m on m.id = l.module_id join programs p on p.id = m.program_id
    where p.code = 'TMH-01')::int as lessons_tmh01;
grant select on texp to authenticated;

select set_config('request.jwt.claims', pg_temp.claims((select org_b from tid)), true);
set local role authenticated;

-- 1. catalog
do $$ declare n int; l int; begin
  select count(*), sum(lessons_count) into n, l from v_program_catalog where code like 'TMH-%';
  insert into t_out values (1, 'org B', 'select v_program_catalog', '15 programs, 378 lessons', n || ', ' || l, n = 15 and l = 378);
end $$;

-- 2. recommendations: 13 standards below complete (track 1 standards 2 and 3 are fully confirmed)
do $$ declare n int; c text; lv int; begin
  select count(*) into n from v_program_recommendations where assessment_id = (select b_id from tid);
  select code, lowest_level into c, lv from v_program_recommendations where assessment_id = (select b_id from tid) and rank = 1;
  insert into t_out values (2, 'org B', 'recommendations from issued results', '13, rank 1 at level 0', n || ', rank 1 ' || c || ' level ' || lv, n = 13 and lv = 0);
end $$;

-- 3. gaps for TMH-01 equal the rejected items of indicator 1
do $$ declare g int; t int; begin
  select gap_lessons, lessons_total into g, t from v_program_recommendations where assessment_id = (select b_id from tid) and code = 'TMH-01';
  insert into t_out values (3, 'org B', 'TMH-01 gap lessons', (select gaps_tmh01 from texp) || ' of ' || (select lessons_tmh01 from texp), g || ' of ' || t,
    g = (select gaps_tmh01 from texp) and t = (select lessons_tmh01 from texp));
end $$;

-- 4. enroll: status forced to enrolled
do $$ declare s text; begin
  insert into program_enrollments (program_id, organization_id, assessment_id, status)
  select id, (select org_b_id from tid), (select b_id from tid), 'completed' from programs where code = 'TMH-01';
  select status into s from program_enrollments where organization_id = (select org_b_id from tid);
  insert into t_out values (4, 'org B', 'enroll in TMH-01 with status completed', 'enrolled', s, s = 'enrolled');
end $$;

-- 5. first lesson done -> in_progress
do $$ declare s text; d int; begin
  insert into lesson_progress (enrollment_id, lesson_id)
  select e.id, l.id from program_enrollments e join program_modules m on m.program_id = e.program_id
  join program_lessons l on l.module_id = m.id
  where e.organization_id = (select org_b_id from tid) order by m.number, l.number limit 1;
  select status, lessons_done into s, d from v_enrollment_progress where organization_id = (select org_b_id from tid);
  insert into t_out values (5, 'org B', 'record first lesson', 'in_progress, 1 done', s || ', ' || d || ' done', s = 'in_progress' and d = 1);
end $$;

-- 6. status cannot be set by hand
do $$ declare n int; s text; begin
  begin
    update program_enrollments set status = 'completed' where organization_id = (select org_b_id from tid);
    get diagnostics n = row_count;
  exception when others then n := 0;
  end;
  select status into s from program_enrollments where organization_id = (select org_b_id from tid);
  insert into t_out values (6, 'org B', 'update enrollment status by hand', '0 rows, still in_progress', n || ' rows, ' || s, n = 0 and s = 'in_progress');
end $$;

-- 7. progress only for lessons of the enrolled program
do $$ begin
  begin
    insert into lesson_progress (enrollment_id, lesson_id)
    select e.id, l.id from program_enrollments e, program_lessons l join program_modules m on m.id = l.module_id
    join programs p on p.id = m.program_id
    where e.organization_id = (select org_b_id from tid) and p.code = 'TMH-02' limit 1;
    insert into t_out values (7, 'org B', 'progress on a lesson of another program', 'error', 'inserted', false);
  exception when others then
    insert into t_out values (7, 'org B', 'progress on a lesson of another program', 'error', left(sqlerrm, 80), true);
  end;
end $$;

-- 8. cannot withdraw once started
do $$ declare n int; begin
  delete from program_enrollments where organization_id = (select org_b_id from tid);
  get diagnostics n = row_count;
  insert into t_out values (8, 'org B', 'withdraw an in-progress enrollment', '0 rows', n || ' rows', n = 0);
end $$;

-- 9. every lesson done -> completed
do $$ declare s text; c timestamptz; begin
  insert into lesson_progress (enrollment_id, lesson_id)
  select e.id, l.id from program_enrollments e join program_modules m on m.program_id = e.program_id
  join program_lessons l on l.module_id = m.id
  where e.organization_id = (select org_b_id from tid)
    and not exists (select 1 from lesson_progress lp where lp.enrollment_id = e.id and lp.lesson_id = l.id);
  select status, completed_at into s, c from program_enrollments where organization_id = (select org_b_id from tid);
  insert into t_out values (9, 'org B', 'record all lessons', 'completed, completed_at set', s || ', ' || (c is not null), s = 'completed' and c is not null);
end $$;

-- 10. org A sees nothing of org B
select set_config('request.jwt.claims', pg_temp.claims((select org_a from tid)), true);
do $$ declare e int; r int; g int; begin
  select count(*) into e from program_enrollments where organization_id = (select org_b_id from tid);
  select count(*) into r from v_program_recommendations where assessment_id = (select b_id from tid);
  select count(*) into g from v_program_lesson_gaps where assessment_id = (select b_id from tid);
  insert into t_out values (10, 'org A', 'org B enrollments, recommendations, gaps', '0, 0, 0', e || ', ' || r || ', ' || g, e = 0 and r = 0 and g = 0);
end $$;

-- 11. org A cannot enroll org B
do $$ begin
  begin
    insert into program_enrollments (program_id, organization_id) select id, (select org_b_id from tid) from programs where code = 'TMH-02';
    insert into t_out values (11, 'org A', 'enroll org B', 'error', 'inserted', false);
  exception when others then
    insert into t_out values (11, 'org A', 'enroll org B', 'error', left(sqlerrm, 80), true);
  end;
end $$;

-- 12. anon reads none of the catalog
reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;
do $$ declare e1 boolean := false; e2 boolean := false; begin
  begin perform count(*) from programs; exception when others then e1 := true; end;
  begin perform count(*) from program_lessons; exception when others then e2 := true; end;
  insert into t_out values (12, 'anon', 'select programs; program_lessons', 'denied; denied',
    case when e1 then 'denied' else 'allowed' end || '; ' || case when e2 then 'denied' else 'allowed' end, e1 and e2);
end $$;

-- 13. before issuance nothing is recommended (results hidden from the organization)
reset role;
select set_config('tamkeen.in_transition', '1', true);
update assessments set status = 'approved' where id = (select b_id from tid);
select set_config('tamkeen.in_transition', '0', true);
select set_config('request.jwt.claims', pg_temp.claims((select org_b from tid)), true);
set local role authenticated;
do $$ declare r int; g int; begin
  select count(*) into r from v_program_recommendations where assessment_id = (select b_id from tid);
  select count(*) into g from v_program_lesson_gaps where assessment_id = (select b_id from tid);
  insert into t_out values (13, 'org B', 'recommendations and gaps while approved (not issued)', '0, 0', r || ', ' || g, r = 0 and g = 0);
end $$;

reset role;
select n, who, action, expected, actual, case when pass then 'PASS' else 'FAIL' end as result from t_out order by n;

rollback;
