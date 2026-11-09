-- Migration 10: the assigned evaluator reads the delegate (المفوض) of the organization under review,
-- so the review page can show who to contact. Organizations are already readable through
-- "organizations: evaluator reads assessed".

create policy "delegates: evaluator reads assessed" on public.delegates for select to authenticated
  using (exists (
    select 1 from public.assessments a
    where a.organization_id = delegates.organization_id
      and public.is_assigned_evaluator(a.id)
  ));
