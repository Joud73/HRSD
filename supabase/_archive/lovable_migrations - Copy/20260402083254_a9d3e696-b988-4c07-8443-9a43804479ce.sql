
-- 1. Add organization_id FK to evaluator_assignments
ALTER TABLE public.evaluator_assignments
  ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- 2. Backfill from profiles.organization_id
UPDATE public.evaluator_assignments ea
SET organization_id = p.organization_id
FROM public.profiles p
WHERE ea.association_id = p.id
  AND p.organization_id IS NOT NULL;

-- 3. Unique constraint: one active assignment per org per year
CREATE UNIQUE INDEX uq_assignment_org_year
  ON public.evaluator_assignments (organization_id, year)
  WHERE organization_id IS NOT NULL;

-- 4. Replace status validation trigger to support expanded statuses
CREATE OR REPLACE FUNCTION public.validate_assignment_status()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN (
    'not_started', 'draft', 'submitted', 'under_review',
    'needs_revision', 'resubmitted', 'approved', 'completed'
  ) THEN
    RAISE EXCEPTION 'Invalid assignment status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$;

-- 5. Ensure the trigger exists (recreate if needed)
DROP TRIGGER IF EXISTS validate_assignment_status_trigger ON public.evaluator_assignments;
CREATE TRIGGER validate_assignment_status_trigger
  BEFORE INSERT OR UPDATE ON public.evaluator_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_assignment_status();
