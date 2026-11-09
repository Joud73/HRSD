-- RLS and workflow checks (Phase 2 security evidence). STAGING ONLY, run as postgres:
--   npx supabase db query --linked -f supabase/checks/rls_checks.sql -o json
-- One transaction, rolled back at the end: nothing is kept. Each case switches to the test user
-- (set local role + request.jwt.claims), runs the action and records PASS or FAIL.
-- Cases 1 to 19 follow supabase/checks/rls_scenarios.md (19, Advisors, is checked through the API, see the log);
-- 20 to 26 are the Phase 3 additions. Prerequisite: seed/test_accounts.sql and seed/demo_reset.sql
-- (org A draft assigned to evaluator1, org B draft assigned to evaluator2).

begin;

create temp table rls_out (n numeric, who text, action text, expected text, actual text, pass boolean) on commit drop;
grant all on rls_out to authenticated, anon;

create temp table ids on commit drop as
select
  (select id from auth.users where email = 'admin.test@tamkeen.local')      as admin,
  (select id from auth.users where email = 'org.a@tamkeen.local')           as org_a,
  (select id from auth.users where email = 'org.b@tamkeen.local')           as org_b,
  (select id from auth.users where email = 'evaluator1@tamkeen.local')      as eval1,
  (select id from auth.users where email = 'evaluator2@tamkeen.local')      as eval2,
  (select id from auth.users where email = 'supervisor.test@tamkeen.local') as sup,
  (select a.id from assessments a join assessment_cycles c on c.id = a.cycle_id and c.status = 'open'
    where a.organization_id = 'aaaaaaaa-0000-0000-0000-000000000001') as a_id,
  (select a.id from assessments a join assessment_cycles c on c.id = a.cycle_id and c.status = 'open'
    where a.organization_id = 'aaaaaaaa-0000-0000-0000-000000000002') as b_id,
  (select id from assessment_cycles where status = 'open') as cycle_id,
  -- an item of track 1, indicator 1 (empty for org A in the demo state)
  (select i.id from items i join indicators ind on ind.id = i.indicator_id join standards s on s.id = ind.standard_id
     join tracks t on t.id = s.track_id join assessment_cycles c on c.tool_version_id = i.tool_version_id and c.status = 'open'
   where t.number = 1 and ind.number = 1 order by i.number limit 1) as item_a,
  -- an item of track 5 (empty for both organizations)
  (select i.id from items i join indicators ind on ind.id = i.indicator_id join standards s on s.id = ind.standard_id
     join tracks t on t.id = s.track_id join assessment_cycles c on c.tool_version_id = i.tool_version_id and c.status = 'open'
   where t.number = 5 order by ind.number, i.number limit 1) as item_5;
grant select on ids to authenticated, anon;

create function pg_temp.claims(uid uuid) returns text language sql as
$$ select json_build_object('sub', uid, 'role', 'authenticated')::text $$;

-- ── 1. org A reads the tool ──
select set_config('request.jwt.claims', pg_temp.claims((select org_a from ids)), true);
set local role authenticated;
do $$ declare n int; begin
  select count(*) into n from items i join assessment_cycles c on c.tool_version_id = i.tool_version_id and c.status = 'open';
  insert into rls_out values (1, 'org A', 'select count(*) from items (open cycle tool)', '378', n::text, n = 378);
end $$;

-- ── 2. org A ensure_my_assessment ──
do $$ declare s text; begin
  select status into s from ensure_my_assessment();
  insert into rls_out values (2, 'org A', 'ensure_my_assessment()', 'draft', s, s = 'draft');
end $$;

-- ── 3. org B cannot see org A's assessment ──
select set_config('request.jwt.claims', pg_temp.claims((select org_b from ids)), true);
do $$ declare n_a int; n_all int; begin
  select count(*) into n_a from assessments where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001';
  select count(*) into n_all from assessments;
  insert into rls_out values (3, 'org B', 'select assessments', 'A: 0, total: 1 (own)', 'A: ' || n_a || ', total: ' || n_all, n_a = 0 and n_all = 1);
end $$;

-- ── 4. org A cannot move its profile to another organization ──
select set_config('request.jwt.claims', pg_temp.claims((select org_a from ids)), true);
do $$ declare n int; begin
  begin
    update profiles set organization_id = 'aaaaaaaa-0000-0000-0000-000000000002' where id = auth.uid();
    get diagnostics n = row_count;
    insert into rls_out values (4, 'org A', 'update profiles set organization_id = B', 'error', n || ' rows', false);
  exception when others then
    insert into rls_out values (4, 'org A', 'update profiles set organization_id = B', 'error', left(sqlerrm, 90), true);
  end;
end $$;

-- ── 5. org A cannot set its status directly ──
do $$ declare n int; begin
  begin
    update assessments set status = 'approved' where id = (select a_id from ids);
    get diagnostics n = row_count;
    insert into rls_out values (5, 'org A', 'update assessments set status = approved', '0 rows or error', n || ' rows', n = 0);
  exception when others then
    insert into rls_out values (5, 'org A', 'update assessments set status = approved', '0 rows or error', left(sqlerrm, 90), true);
  end;
end $$;

-- ── 6. org A answers then submits through transition_assessment ──
do $$ declare s text; begin
  insert into item_responses (assessment_id, item_id, is_met) values ((select a_id from ids), (select item_a from ids), true);
  select status into s from transition_assessment((select a_id from ids), 'submitted');
  insert into rls_out values (6, 'org A', 'insert item_responses, transition submitted', 'submitted', s, s = 'submitted');
exception when others then
  insert into rls_out values (6, 'org A', 'insert item_responses, transition submitted', 'submitted', left(sqlerrm, 90), false);
end $$;

-- ── 7. org A cannot change answers after submitting ──
do $$ declare n int; begin
  begin
    update item_responses set org_note = 'rls' where assessment_id = (select a_id from ids);
    get diagnostics n = row_count;
    insert into rls_out values (7, 'org A', 'update item_responses after submit', '0 rows', n || ' rows', n = 0);
  exception when others then
    insert into rls_out values (7, 'org A', 'update item_responses after submit', '0 rows', left(sqlerrm, 90), true);
  end;
end $$;

-- ── 8. evaluator2 sees only its assigned assessment (org B), never org A ──
select set_config('request.jwt.claims', pg_temp.claims((select eval2 from ids)), true);
do $$ declare n_a int; n_all int; begin
  select count(*) into n_a from assessments where id = (select a_id from ids);
  select count(*) into n_all from assessments;
  insert into rls_out values (8, 'evaluator2', 'select assessments', 'A: 0, total: 1 (org B)', 'A: ' || n_a || ', total: ' || n_all, n_a = 0 and n_all = 1);
end $$;

-- ── 9. evaluator1 sees its assigned assessment ──
select set_config('request.jwt.claims', pg_temp.claims((select eval1 from ids)), true);
do $$ declare n int; begin
  select count(*) into n from assessments;
  insert into rls_out values (9, 'evaluator1', 'select count(*) from assessments', '1', n::text, n = 1);
end $$;

-- ── 10. evaluator1 cannot approve from submitted ──
do $$ begin
  perform transition_assessment((select a_id from ids), 'approved');
  insert into rls_out values (10, 'evaluator1', 'transition approved from submitted', 'error: not allowed', 'allowed', false);
exception when others then
  insert into rls_out values (10, 'evaluator1', 'transition approved from submitted', 'error: not allowed', left(sqlerrm, 90), sqlerrm like '%not allowed%');
end $$;

-- ── 11. evaluator1 cannot start the review before the review period ──
do $$ begin
  perform transition_assessment((select a_id from ids), 'under_review');
  insert into rls_out values (11, 'evaluator1', 'transition under_review before review_start', 'error: not allowed', 'allowed', false);
exception when others then
  insert into rls_out values (11, 'evaluator1', 'transition under_review before review_start', 'error: not allowed', left(sqlerrm, 90), sqlerrm like '%not allowed%');
end $$;

-- ── 12 and 13. admin override needs a note, and is logged ──
select set_config('request.jwt.claims', pg_temp.claims((select admin from ids)), true);
do $$ begin
  perform transition_assessment((select a_id from ids), 'under_review');
  insert into rls_out values (12, 'admin', 'transition under_review without note', 'error: requires a note', 'allowed', false);
exception when others then
  insert into rls_out values (12, 'admin', 'transition under_review without note', 'error: requires a note', left(sqlerrm, 90), sqlerrm like '%requires a note%');
end $$;
do $$ declare s text; h int; begin
  select status into s from transition_assessment((select a_id from ids), 'under_review', 'rls check');
  select count(*) into h from assessment_status_history where assessment_id = (select a_id from ids) and to_status = 'under_review' and note = 'rls check';
  insert into rls_out values (13, 'admin', 'transition under_review with note', 'under_review, 1 history row', s || ', ' || h || ' history row', s = 'under_review' and h = 1);
end $$;

-- ── 14. evaluator1 cannot change the organization's answers ──
select set_config('request.jwt.claims', pg_temp.claims((select eval1 from ids)), true);
do $$ declare n int; begin
  begin
    update item_responses set is_met = false where assessment_id = (select a_id from ids);
    get diagnostics n = row_count;
    insert into rls_out values (14, 'evaluator1', 'update item_responses set is_met = false', '0 rows', n || ' rows', n = 0);
  exception when others then
    insert into rls_out values (14, 'evaluator1', 'update item_responses set is_met = false', '0 rows', left(sqlerrm, 90), true);
  end;
end $$;

-- ── 16. org B cannot upload into org A's evidence folder ──
select set_config('request.jwt.claims', pg_temp.claims((select org_b from ids)), true);
do $$ begin
  insert into storage.objects (bucket_id, name, owner) values ('evidences', (select a_id from ids) || '/rls-test.pdf', auth.uid());
  insert into rls_out values (16, 'org B', 'upload into org A''s evidences folder', 'error', 'allowed', false);
exception when others then
  insert into rls_out values (16, 'org B', 'upload into org A''s evidences folder', 'error', left(sqlerrm, 90), true);
end $$;

-- ── 17. org A sees only its own history ──
select set_config('request.jwt.claims', pg_temp.claims((select org_a from ids)), true);
do $$ declare own int; other int; begin
  select count(*) filter (where assessment_id = (select a_id from ids)), count(*) filter (where assessment_id <> (select a_id from ids))
    into own, other from assessment_status_history;
  insert into rls_out values (17, 'org A', 'select assessment_status_history', 'own > 0, other 0', 'own ' || own || ', other ' || other, own > 0 and other = 0);
end $$;

-- ── 18. anonymous cannot read the tool ──
reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
do $$ begin
  perform count(*) from items;
  insert into rls_out values (18, 'anon', 'select from items', 'error: permission denied', 'allowed', false);
exception when others then
  insert into rls_out values (18, 'anon', 'select from items', 'error: permission denied', left(sqlerrm, 90), sqlerrm like '%permission denied%');
end $$;
reset role;

-- ── 20. supervisor proxy entry on org B's draft ──
select set_config('request.jwt.claims', pg_temp.claims((select sup from ids)), true);
set local role authenticated;
do $$ begin
  insert into item_responses (assessment_id, item_id, is_met) values ((select b_id from ids), (select item_5 from ids), true);
  insert into rls_out values (20, 'supervisor', 'insert item_responses on org B (draft)', 'allowed', 'allowed', true);
exception when others then
  insert into rls_out values (20, 'supervisor', 'insert item_responses on org B (draft)', 'allowed', left(sqlerrm, 90), false);
end $$;

-- ── 21. supervisor cannot assign evaluators ──
do $$ declare n int; begin
  begin
    update assessment_reviews set evaluator_id = (select eval1 from ids) where assessment_id = (select b_id from ids);
    get diagnostics n = row_count;
    insert into rls_out values (21, 'supervisor', 'update assessment_reviews (reassign org B)', '0 rows or error', n || ' rows', n = 0);
  exception when others then
    insert into rls_out values (21, 'supervisor', 'update assessment_reviews (reassign org B)', '0 rows or error', left(sqlerrm, 90), true);
  end;
end $$;

-- ── 22. evaluator cannot enter answers (no proxy entry) ──
select set_config('request.jwt.claims', pg_temp.claims((select eval2 from ids)), true);
do $$ begin
  insert into item_responses (assessment_id, item_id, is_met) values ((select b_id from ids), (select item_a from ids), true);
  insert into rls_out values (22, 'evaluator2', 'insert item_responses on org B', 'error', 'allowed', false);
exception when others then
  insert into rls_out values (22, 'evaluator2', 'insert item_responses on org B', 'error', left(sqlerrm, 90), true);
end $$;

-- ── 23. assigned evaluator reads the organization's delegate ──
select set_config('request.jwt.claims', pg_temp.claims((select eval1 from ids)), true);
do $$ declare n_a int; n_b int; begin
  select count(*) filter (where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
         count(*) filter (where organization_id = 'aaaaaaaa-0000-0000-0000-000000000002')
    into n_a, n_b from delegates;
  insert into rls_out values (23, 'evaluator1', 'select delegates', 'org A: 1, org B: 0', 'org A: ' || n_a || ', org B: ' || n_b, n_a = 1 and n_b = 0);
end $$;

-- ── 24. org reads the cycle's exclusions ──
reset role;
insert into cycle_item_exclusions (cycle_id, item_id, reason) values ((select cycle_id from ids), (select item_5 from ids), 'rls check');
select set_config('request.jwt.claims', pg_temp.claims((select org_a from ids)), true);
set local role authenticated;
do $$ declare n int; begin
  select count(*) into n from cycle_item_exclusions where cycle_id = (select cycle_id from ids);
  insert into rls_out values (24, 'org A', 'select cycle_item_exclusions', '1', n::text, n = 1);
end $$;

-- ── 25. unassigned evaluator reads 0 assessments ──
reset role;
delete from assessment_reviews where evaluator_id = (select eval2 from ids);
select set_config('request.jwt.claims', pg_temp.claims((select eval2 from ids)), true);
set local role authenticated;
do $$ declare n int; begin
  select count(*) into n from assessments;
  insert into rls_out values (25, 'evaluator2 (unassigned)', 'select count(*) from assessments', '0', n::text, n = 0);
end $$;

-- ── 15 and 26. inside the review period: return needs a note; with a note it is returned ──
-- (the cycle's dates are moved so that today is the first review day; rolled back)
reset role;
update assessment_cycles set submission_start = current_date - 20, submission_end = current_date - 1, review_start = current_date
where id = (select cycle_id from ids);
select set_config('request.jwt.claims', pg_temp.claims((select eval1 from ids)), true);
set local role authenticated;
do $$ begin
  perform transition_assessment((select a_id from ids), 'returned');
  insert into rls_out values (15, 'evaluator1', 'transition returned without note (review period)', 'error: note is required', 'allowed', false);
exception when others then
  insert into rls_out values (15, 'evaluator1', 'transition returned without note (review period)', 'error: note is required', left(sqlerrm, 90), sqlerrm like '%note is required%');
end $$;
do $$ declare s text; begin
  select status into s from transition_assessment((select a_id from ids), 'returned', 'أكملوا الشواهد');
  insert into rls_out values (26, 'evaluator1', 'transition returned with note (review period)', 'returned', s, s = 'returned');
exception when others then
  insert into rls_out values (26, 'evaluator1', 'transition returned with note (review period)', 'returned', left(sqlerrm, 90), false);
end $$;

reset role;
select json_agg(json_build_object('n', n, 'who', who, 'action', action, 'expected', expected, 'actual', actual, 'result', case when pass then 'PASS' else 'FAIL' end) order by n)::text as results
from rls_out;

rollback;
