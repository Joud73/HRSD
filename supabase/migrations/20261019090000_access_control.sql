-- Migration 3: access control and the assessment state machine.
--  1. Helper functions (who am I, which organization, am I the assigned evaluator)
--  2. Column protection on legacy tables (profiles, evaluator_assignments)
--  3. Status changes only through transition_assessment()
--  4. Role policies for the new tables and the evidences bucket
--  5. Defense in depth: anon loses table privileges Lovable granted by default

-- ---------------------------------------------------------------
-- 1. Helpers (SECURITY DEFINER so they can read profiles/reviews regardless of RLS)
-- ---------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin')
$$;

create or replace function public.is_evaluator()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'evaluator')
$$;

create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_assigned_evaluator(p_assessment uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.assessment_reviews
    where assessment_id = p_assessment and evaluator_id = auth.uid()
  )
$$;

-- True while the organization may edit: cycle open, inside submission period, status draft or returned.
create or replace function public.assessment_editable_by_org(p_assessment uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.assessments a
    join public.assessment_cycles c on c.id = a.cycle_id
    where a.id = p_assessment
      and a.organization_id = public.current_org_id()
      and c.status = 'open'
      and current_date between c.submission_start and c.submission_end
      and a.status in ('draft', 'returned')
  )
$$;

-- True while the assigned evaluator may record verdicts: status under_review, inside review period.
create or replace function public.assessment_reviewable_by_me(p_assessment uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.assessments a
    join public.assessment_cycles c on c.id = a.cycle_id
    where a.id = p_assessment
      and public.is_assigned_evaluator(a.id)
      and c.status = 'open'
      and current_date between c.review_start and c.approval_end
      and a.status = 'under_review'
  )
$$;

grant execute on function public.is_admin(), public.is_evaluator(), public.current_org_id(),
  public.is_assigned_evaluator(uuid), public.assessment_editable_by_org(uuid),
  public.assessment_reviewable_by_me(uuid) to authenticated;

-- ---------------------------------------------------------------
-- 2. Column protection on legacy tables
-- ---------------------------------------------------------------
-- profiles: a user may edit their own contact fields, never their organization or account status.
create or replace function public.protect_profile_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;  -- service role, migrations, admins
  end if;
  if new.organization_id is distinct from old.organization_id
     or new.status is distinct from old.status
     or new.email is distinct from old.email
     or new.registration_number is distinct from old.registration_number then
    raise exception 'organization_id, status, email and registration_number can only be changed by an administrator'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

create trigger trg_protect_profile_columns before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- evaluator_assignments (legacy): an evaluator may update progress, never the assignment itself.
create or replace function public.protect_assignment_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.evaluator_id is distinct from old.evaluator_id
     or new.association_id is distinct from old.association_id
     or new.organization_id is distinct from old.organization_id
     or new.year is distinct from old.year then
    raise exception 'Assignment fields can only be changed by an administrator'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

create trigger trg_protect_assignment_columns before update on public.evaluator_assignments
  for each row execute function public.protect_assignment_columns();

-- ---------------------------------------------------------------
-- 3. State machine: status changes only via transition_assessment()
-- ---------------------------------------------------------------
create or replace function public.block_direct_status_change()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status
     and coalesce(current_setting('tamkeen.in_transition', true), '') <> '1' then
    raise exception 'Assessment status changes only through transition_assessment()'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

create trigger trg_block_direct_status_change before update on public.assessments
  for each row execute function public.block_direct_status_change();

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
begin
  select * into a from public.assessments where id = p_assessment for update;
  if not found then raise exception 'Assessment not found' using errcode = 'no_data_found'; end if;
  select * into c from public.assessment_cycles where id = a.cycle_id;
  from_s := a.status;

  if c.status <> 'open' then
    raise exception 'Cycle is not open' using errcode = 'check_violation';
  end if;

  if a.status in ('draft', 'returned') and p_to = 'submitted' then
    ok := (a.organization_id = public.current_org_id() or admin)
          and current_date between c.submission_start and c.submission_end;

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

-- Organization creates (or fetches) its own draft assessment in the open cycle.
create or replace function public.ensure_my_assessment()
returns public.assessments
language plpgsql security definer set search_path = public as $$
declare
  org uuid := public.current_org_id();
  cyc uuid;
  a   public.assessments%rowtype;
begin
  if org is null then
    raise exception 'User is not linked to an organization' using errcode = 'insufficient_privilege';
  end if;
  select id into cyc from public.assessment_cycles
  where status = 'open' and current_date between submission_start and submission_end;
  if cyc is null then
    raise exception 'No open cycle in its submission period' using errcode = 'check_violation';
  end if;
  insert into public.assessments (cycle_id, organization_id) values (cyc, org)
  on conflict (cycle_id, organization_id) do nothing;
  select * into a from public.assessments where cycle_id = cyc and organization_id = org;
  return a;
end $$;

grant execute on function public.ensure_my_assessment() to authenticated;

-- Evaluator verdict columns are the only ones an evaluator may touch; the org's answer is frozen after submit.
create or replace function public.protect_response_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
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

create trigger trg_protect_response_columns before update on public.item_responses
  for each row execute function public.protect_response_columns();

-- ---------------------------------------------------------------
-- 4. Role policies (admin policies already exist from migration 2)
-- ---------------------------------------------------------------
-- assessments
create policy "assessments: org reads own" on public.assessments for select to authenticated
  using (organization_id = public.current_org_id());
create policy "assessments: evaluator reads assigned" on public.assessments for select to authenticated
  using (public.is_assigned_evaluator(id));
-- (no direct insert/update for org or evaluator: ensure_my_assessment() and transition_assessment())

-- reviews
create policy "reviews: evaluator reads own" on public.assessment_reviews for select to authenticated
  using (evaluator_id = auth.uid());

-- history
create policy "history: org reads own" on public.assessment_status_history for select to authenticated
  using (exists (select 1 from public.assessments a where a.id = assessment_id and a.organization_id = public.current_org_id()));
create policy "history: evaluator reads assigned" on public.assessment_status_history for select to authenticated
  using (public.is_assigned_evaluator(assessment_id));

-- item responses
create policy "responses: org reads own" on public.item_responses for select to authenticated
  using (exists (select 1 from public.assessments a where a.id = assessment_id and a.organization_id = public.current_org_id()));
create policy "responses: org writes while editable" on public.item_responses for insert to authenticated
  with check (public.assessment_editable_by_org(assessment_id));
create policy "responses: org updates while editable" on public.item_responses for update to authenticated
  using (public.assessment_editable_by_org(assessment_id)) with check (public.assessment_editable_by_org(assessment_id));
create policy "responses: evaluator reads assigned" on public.item_responses for select to authenticated
  using (public.is_assigned_evaluator(assessment_id));
create policy "responses: evaluator records verdict" on public.item_responses for update to authenticated
  using (public.assessment_reviewable_by_me(assessment_id)) with check (public.assessment_reviewable_by_me(assessment_id));

-- evidences
create policy "evidences: org reads own" on public.evidences for select to authenticated
  using (exists (select 1 from public.assessments a where a.id = assessment_id and a.organization_id = public.current_org_id()));
create policy "evidences: org adds while editable" on public.evidences for insert to authenticated
  with check (uploaded_by = auth.uid() and public.assessment_editable_by_org(assessment_id));
create policy "evidences: org removes while editable" on public.evidences for delete to authenticated
  using (public.assessment_editable_by_org(assessment_id));
create policy "evidences: evaluator reads assigned" on public.evidences for select to authenticated
  using (public.is_assigned_evaluator(assessment_id));

-- storage: path convention {assessment_id}/{item_id}/{file}
create policy "evidence files: admin all" on storage.objects for all to authenticated
  using (bucket_id = 'evidences' and public.is_admin())
  with check (bucket_id = 'evidences' and public.is_admin());
create policy "evidence files: org reads own" on storage.objects for select to authenticated
  using (bucket_id = 'evidences' and exists (
    select 1 from public.assessments a
    where a.id = ((storage.foldername(name))[1])::uuid and a.organization_id = public.current_org_id()));
create policy "evidence files: org uploads while editable" on storage.objects for insert to authenticated
  with check (bucket_id = 'evidences' and public.assessment_editable_by_org(((storage.foldername(name))[1])::uuid));
create policy "evidence files: org deletes while editable" on storage.objects for delete to authenticated
  using (bucket_id = 'evidences' and public.assessment_editable_by_org(((storage.foldername(name))[1])::uuid));
create policy "evidence files: evaluator reads assigned" on storage.objects for select to authenticated
  using (bucket_id = 'evidences' and public.is_assigned_evaluator(((storage.foldername(name))[1])::uuid));

-- ---------------------------------------------------------------
-- 5. Defense in depth: anon keeps only what the public registration form needs
-- ---------------------------------------------------------------
revoke all on public.profiles, public.delegates, public.user_roles, public.organizations,
  public.evaluator_assignments, public.criterion_evaluations, public.evaluation_criteria,
  public.evaluation_evidences, public.evaluation_messages from anon;
revoke all on public.organization_requests from anon;
grant insert on public.organization_requests to anon;
