
-- 1. Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  registration_number TEXT UNIQUE,
  type TEXT DEFAULT 'جمعية',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Add organization_id to profiles BEFORE policies reference it
ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- 3. RLS policies (now organization_id exists)
CREATE POLICY "Admins manage all organizations"
  ON public.organizations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Organization users can view their own org"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = organizations.id
    )
  );

CREATE POLICY "Evaluators can view assigned organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluator_assignments
      WHERE evaluator_assignments.association_id = organizations.id
        AND evaluator_assignments.evaluator_id = auth.uid()
    )
  );

-- 4. Timestamp trigger
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Backfill organizations from existing profiles
INSERT INTO public.organizations (name, registration_number)
SELECT DISTINCT p.organization_name, p.registration_number
FROM public.profiles p
WHERE p.organization_name IS NOT NULL
ON CONFLICT (registration_number) DO NOTHING;

-- 6. Link profiles to their organization
UPDATE public.profiles p
SET organization_id = o.id
FROM public.organizations o
WHERE p.organization_name IS NOT NULL
  AND p.organization_name = o.name;
