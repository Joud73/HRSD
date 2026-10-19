-- Migration 4: fix three-valued logic in transition_assessment().
-- Found during staging tests: a caller with no organization (current_org_id() = NULL) made the
-- permission expression NULL, and `if not ok` on NULL does not raise. Now coalesced to false.

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
  ok     boolean := false;  -- every branch result is coalesced: NULL from a NULL org must never pass
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
