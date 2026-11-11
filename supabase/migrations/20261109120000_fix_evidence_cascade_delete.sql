-- Migration 12: fix for migration 11's evidence trigger.
-- Deleting an assessment cascades to its evidences; the AFTER DELETE trigger then tried to upsert an
-- item_responses row for the assessment being deleted and failed ("Item does not belong to the tool version
-- of this assessment cycle"). This broke demo_reset.sql, the seeds and any admin delete of an assessment
-- with evidence. The trigger now does nothing when the assessment itself is gone.
create or replace function public.propagate_evidence_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_assessment uuid := coalesce(new.assessment_id, old.assessment_id);
        v_item       uuid := coalesce(new.item_id, old.item_id);
        v_user       uuid := coalesce(auth.uid(), new.uploaded_by);
begin
  -- the assessment itself is being deleted (cascade): nothing to maintain
  if tg_op = 'DELETE' and not exists (select 1 from public.assessments where id = v_assessment) then
    return old;
  end if;
  perform set_config('tamkeen.in_evidence_sync', '1', true);
  insert into public.item_responses (assessment_id, item_id, is_met, updated_by)
  values (v_assessment, v_item, true, v_user)
  on conflict (assessment_id, item_id) do update
    set is_met = public.item_has_evidence(v_assessment, v_item),
        verified = null,
        updated_by = coalesce(auth.uid(), item_responses.updated_by);
  perform set_config('tamkeen.in_evidence_sync', '0', true);
  return coalesce(new, old);
end $$;
