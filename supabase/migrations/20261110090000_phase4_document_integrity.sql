-- Migration 13: integrity of issued documents (review finding, 10 Nov).
-- 1. The documents bucket accepted writes from the final sign-off on any path, at any time: an issued PDF could be
--    replaced afterwards (its stored sha256 would no longer match) and files could land outside an assessment folder.
--    Writes are now allowed only to {assessment_id}/feedback_report.pdf or {assessment_id}/improvement_plan.pdf,
--    and only while that assessment is approved (that is, before issuance).
-- 2. issue_results() accepted any path. It now requires the canonical path per document kind.

drop policy if exists "document files: issuer writes" on storage.objects;
drop policy if exists "document files: issuer replaces" on storage.objects;

create or replace function public.document_path_writable(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.can_issue_results()
     and array_length(string_to_array(p_name, '/'), 1) = 2
     and split_part(p_name, '/', 2) in ('feedback_report.pdf', 'improvement_plan.pdf')
     and exists (
       select 1 from public.assessments a
       where a.id::text = split_part(p_name, '/', 1) and a.status = 'approved'
     )
$$;
grant execute on function public.document_path_writable(text) to authenticated;

create policy "document files: issuer writes" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and public.document_path_writable(name));
create policy "document files: issuer replaces" on storage.objects for update to authenticated
  using (bucket_id = 'documents' and public.document_path_writable(name))
  with check (bucket_id = 'documents' and public.document_path_writable(name));

create or replace function public.issue_results(p_assessment uuid, p_number text, p_pdfs jsonb)
returns public.assessments
language plpgsql security definer set search_path = public as $$
declare a public.assessments%rowtype; expected text; r record;
begin
  if not public.can_issue_results() then
    raise exception 'Only the final sign-off issues results' using errcode = 'insufficient_privilege';
  end if;
  expected := public.results_number(p_assessment);
  if p_number is distinct from expected then
    raise exception 'Report number is stale: expected %', expected using errcode = 'check_violation';
  end if;
  if (select count(distinct kind) from public.assessment_documents where assessment_id = p_assessment and status = 'approved') <> 2 then
    raise exception 'Both documents must be approved before issuing' using errcode = 'check_violation';
  end if;
  if jsonb_typeof(p_pdfs) <> 'array' or jsonb_array_length(p_pdfs) <> 2 then
    raise exception 'Two PDFs are required' using errcode = 'check_violation';
  end if;
  for r in select * from jsonb_to_recordset(p_pdfs) as x(kind text, path text, sha256 text) loop
    if r.kind not in ('feedback_report', 'improvement_plan')
       or r.path is distinct from p_assessment::text || '/' || r.kind || '.pdf'
       or coalesce(r.sha256, '') !~ '^[0-9a-f]{64}$' then
      raise exception 'Invalid PDF entry for %', coalesce(r.kind, '?') using errcode = 'check_violation';
    end if;
  end loop;

  perform set_config('tamkeen.issuing', '1', true);
  a := public.transition_assessment(p_assessment, 'issued', null);
  perform set_config('tamkeen.issuing', '0', true);

  perform set_config('tamkeen.in_document_fn', '1', true);
  for r in select * from jsonb_to_recordset(p_pdfs) as x(kind text, path text, sha256 text) loop
    update public.assessment_documents
       set status = 'issued', number = p_number, issued_by = auth.uid(), issued_at = now(),
           pdf_path = r.path, pdf_sha256 = r.sha256
     where assessment_id = p_assessment and kind = r.kind::public.document_kind;
  end loop;
  perform set_config('tamkeen.in_document_fn', '0', true);

  if exists (select 1 from public.assessment_documents where assessment_id = p_assessment and (pdf_path is null or status <> 'issued')) then
    raise exception 'Each document needs its PDF' using errcode = 'check_violation';
  end if;
  return a;
end $$;
grant execute on function public.issue_results(uuid, text, jsonb) to authenticated;
