-- Migration 11a: the sixth assessment status.
-- Lifecycle: draft -> submitted -> under_review -> (returned -> submitted) -> approved -> issued
--   approved = the assigned evaluator approved the assessment (results frozen, documents awaiting final sign-off)
--   issued   = the final sign-off (supervisor today, see can_issue_results()) published the results to the organization
-- A new enum value cannot be used in the transaction that adds it, so this lives in its own file.
alter type public.assessment_status add value if not exists 'issued';
