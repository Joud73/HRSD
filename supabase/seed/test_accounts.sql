-- Test accounts wiring for STAGING ONLY. Never run on prod.
-- Prerequisite: create the five users in Dashboard > Authentication > Users (Auto Confirm User),
-- with the emails below. This script links roles, organizations and the evaluator assignment.

begin;

insert into public.organizations (id, name, registration_number)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'منظمة الاختبار أ', 'TEST-0001'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'منظمة الاختبار ب', 'TEST-0002')
on conflict (id) do nothing;

-- roles
insert into public.user_roles (user_id, role)
select u.id, r.role::public.app_role
from auth.users u
join (values
  ('admin.test@tamkeen.local', 'admin'),
  ('org.a@tamkeen.local',      'organization'),
  ('org.b@tamkeen.local',      'organization'),
  ('evaluator1@tamkeen.local', 'evaluator'),
  ('evaluator2@tamkeen.local', 'evaluator')
) as r(email, role) on r.email = u.email
on conflict (user_id, role) do nothing;

-- profiles (organization users)
insert into public.profiles (id, email, organization_name, organization_id, status)
select u.id, u.email, o.name, o.id, 'active'
from auth.users u
join (values
  ('org.a@tamkeen.local', 'aaaaaaaa-0000-0000-0000-000000000001'::uuid),
  ('org.b@tamkeen.local', 'aaaaaaaa-0000-0000-0000-000000000002'::uuid)
) as m(email, org_id) on m.email = u.email
join public.organizations o on o.id = m.org_id
on conflict (id) do update set organization_id = excluded.organization_id, status = 'active';

-- profiles (staff) so the app's profile lookup does not fail
insert into public.profiles (id, email, status)
select id, email, 'active' from auth.users
where email in ('admin.test@tamkeen.local', 'evaluator1@tamkeen.local', 'evaluator2@tamkeen.local')
on conflict (id) do nothing;

-- org A draft assessment in the open cycle, assigned to evaluator 1
insert into public.assessments (cycle_id, organization_id)
select c.id, 'aaaaaaaa-0000-0000-0000-000000000001'
from public.assessment_cycles c where c.status = 'open'
on conflict (cycle_id, organization_id) do nothing;

insert into public.assessment_reviews (assessment_id, evaluator_id, assigned_by)
select a.id, e.id, ad.id
from public.assessments a
join auth.users e  on e.email  = 'evaluator1@tamkeen.local'
join auth.users ad on ad.email = 'admin.test@tamkeen.local'
where a.organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
on conflict (assessment_id) do nothing;

commit;

-- verify
select u.email, r.role, p.organization_id
from auth.users u
left join public.user_roles r on r.user_id = u.id
left join public.profiles p on p.id = u.id
where u.email like '%@tamkeen.local' order by u.email;
