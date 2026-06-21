
-- Organization users can view assignments for their org
CREATE POLICY "Organization users view own assignments"
  ON public.evaluator_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = evaluator_assignments.organization_id
    )
  );

-- Organization users can view evidences on their org's assignments
CREATE POLICY "Organization users view own evidences"
  ON public.evaluation_evidences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluator_assignments ea
      JOIN public.profiles p ON p.organization_id = ea.organization_id
      WHERE ea.id = evaluation_evidences.assignment_id
        AND p.id = auth.uid()
    )
  );

-- Organization users can upload evidences on their org's assignments
CREATE POLICY "Organization users insert own evidences"
  ON public.evaluation_evidences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM public.evaluator_assignments ea
      JOIN public.profiles p ON p.organization_id = ea.organization_id
      WHERE ea.id = evaluation_evidences.assignment_id
        AND p.id = auth.uid()
    )
  );

-- Organization users can view messages on their org's assignments
CREATE POLICY "Organization users view own messages"
  ON public.evaluation_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluator_assignments ea
      JOIN public.profiles p ON p.organization_id = ea.organization_id
      WHERE ea.id = evaluation_messages.assignment_id
        AND p.id = auth.uid()
    )
  );

-- Organization users can send messages on their org's assignments
CREATE POLICY "Organization users send own messages"
  ON public.evaluation_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.evaluator_assignments ea
      JOIN public.profiles p ON p.organization_id = ea.organization_id
      WHERE ea.id = evaluation_messages.assignment_id
        AND p.id = auth.uid()
    )
  );

-- Organization users can view criterion evaluations on their assignments
CREATE POLICY "Organization users view own criterion evaluations"
  ON public.criterion_evaluations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluator_assignments ea
      JOIN public.profiles p ON p.organization_id = ea.organization_id
      WHERE ea.id = criterion_evaluations.assignment_id
        AND p.id = auth.uid()
    )
  );
