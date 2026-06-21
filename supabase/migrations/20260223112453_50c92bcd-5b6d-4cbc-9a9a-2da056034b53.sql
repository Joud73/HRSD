
-- ═══════════════════════════════════════════════
-- 1. Role system
-- ═══════════════════════════════════════════════
CREATE TYPE public.app_role AS ENUM ('admin', 'evaluator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════════════
-- 2. Evaluator assignments
-- ═══════════════════════════════════════════════
CREATE TABLE public.evaluator_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluator_id uuid NOT NULL,
  association_id uuid NOT NULL,
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now())::integer,
  status text NOT NULL DEFAULT 'not_started',
  completion_percentage integer NOT NULL DEFAULT 0,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluator_assignments ENABLE ROW LEVEL SECURITY;

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_assignment_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('not_started', 'in_progress', 'waiting_response', 'completed') THEN
    RAISE EXCEPTION 'Invalid assignment status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_assignment_status
BEFORE INSERT OR UPDATE ON public.evaluator_assignments
FOR EACH ROW EXECUTE FUNCTION public.validate_assignment_status();

CREATE TRIGGER update_evaluator_assignments_updated_at
BEFORE UPDATE ON public.evaluator_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Evaluators view own assignments" ON public.evaluator_assignments
FOR SELECT TO authenticated USING (auth.uid() = evaluator_id);

CREATE POLICY "Evaluators update own assignments" ON public.evaluator_assignments
FOR UPDATE TO authenticated USING (auth.uid() = evaluator_id);

CREATE POLICY "Admins manage all assignments" ON public.evaluator_assignments
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════════════
-- 3. Evaluation criteria (predefined)
-- ═══════════════════════════════════════════════
CREATE TABLE public.evaluation_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_name text NOT NULL,
  criterion_name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view criteria" ON public.evaluation_criteria
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage criteria" ON public.evaluation_criteria
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════════════
-- 4. Criterion evaluations (scores + notes)
-- ═══════════════════════════════════════════════
CREATE TABLE public.criterion_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.evaluator_assignments(id) ON DELETE CASCADE,
  criterion_id uuid NOT NULL REFERENCES public.evaluation_criteria(id) ON DELETE CASCADE,
  score numeric,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, criterion_id)
);

ALTER TABLE public.criterion_evaluations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.validate_criterion_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'evaluated', 'needs_revision') THEN
    RAISE EXCEPTION 'Invalid criterion status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_criterion_status
BEFORE INSERT OR UPDATE ON public.criterion_evaluations
FOR EACH ROW EXECUTE FUNCTION public.validate_criterion_status();

CREATE TRIGGER update_criterion_evaluations_updated_at
BEFORE UPDATE ON public.criterion_evaluations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Evaluators manage own criterion evaluations" ON public.criterion_evaluations
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.evaluator_assignments
    WHERE id = criterion_evaluations.assignment_id
    AND evaluator_id = auth.uid()
  )
);

CREATE POLICY "Admins manage all criterion evaluations" ON public.criterion_evaluations
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════════════
-- 5. Evidence uploads tracking
-- ═══════════════════════════════════════════════
CREATE TABLE public.evaluation_evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.evaluator_assignments(id) ON DELETE CASCADE,
  criterion_id uuid NOT NULL REFERENCES public.evaluation_criteria(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  uploaded_by uuid NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluation_evidences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Evaluators view own assignment evidences" ON public.evaluation_evidences
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.evaluator_assignments
    WHERE id = evaluation_evidences.assignment_id
    AND evaluator_id = auth.uid()
  )
);

CREATE POLICY "Admins manage all evidences" ON public.evaluation_evidences
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════════════
-- 6. Evaluation messages / feedback
-- ═══════════════════════════════════════════════
CREATE TABLE public.evaluation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.evaluator_assignments(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Evaluators view own assignment messages" ON public.evaluation_messages
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.evaluator_assignments
    WHERE id = evaluation_messages.assignment_id
    AND evaluator_id = auth.uid()
  )
);

CREATE POLICY "Evaluators send messages on own assignments" ON public.evaluation_messages
FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.evaluator_assignments
    WHERE id = evaluation_messages.assignment_id
    AND evaluator_id = auth.uid()
  )
);

CREATE POLICY "Admins manage all messages" ON public.evaluation_messages
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════════════
-- 7. Seed evaluation criteria
-- ═══════════════════════════════════════════════
INSERT INTO public.evaluation_criteria (track_name, criterion_name, description, sort_order) VALUES
('التوجه', 'الرؤية والرسالة', 'مدى وضوح رؤية ورسالة الجمعية وارتباطها بأهدافها', 1),
('التوجه', 'التخطيط الاستراتيجي', 'جودة الخطة الاستراتيجية ومدى تطبيقها', 2),
('التوجه', 'الحوكمة', 'مستوى الحوكمة والشفافية في الجمعية', 3),
('الفريق', 'الهيكل التنظيمي', 'وضوح الهيكل التنظيمي وتوزيع المهام', 1),
('الفريق', 'تطوير الكفاءات', 'برامج تدريب وتطوير العاملين', 2),
('الفريق', 'بيئة العمل', 'جودة بيئة العمل ورضا الموظفين', 3),
('الشراكات', 'الشراكات المجتمعية', 'عدد وجودة الشراكات مع القطاعات المختلفة', 1),
('الشراكات', 'التمويل والاستدامة', 'تنوع مصادر التمويل والاستدامة المالية', 2),
('التأثير', 'قياس الأثر', 'آليات قياس الأثر الاجتماعي للبرامج', 1),
('التأثير', 'رضا المستفيدين', 'مستوى رضا المستفيدين عن الخدمات المقدمة', 2),
('البرامج', 'تصميم البرامج', 'جودة تصميم البرامج والمشاريع', 1),
('البرامج', 'تنفيذ البرامج', 'كفاءة تنفيذ البرامج والمشاريع', 2),
('البرامج', 'متابعة وتقييم البرامج', 'آليات المتابعة والتقييم المستمر', 3);
