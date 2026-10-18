SET local check_function_bodies = off;

CREATE TABLE "public"."criterion_evaluations" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "assignment_id" uuid                     NOT NULL,
  "criterion_id"  uuid                     NOT NULL,
  "score"         numeric,
  "notes"         text,
  "status"        text                     NOT NULL DEFAULT 'pending'::text,
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "criterion_evaluations_assignment_id_criterion_id_key" UNIQUE (assignment_id, criterion_id),
  CONSTRAINT "criterion_evaluations_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."criterion_evaluations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."delegates" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "full_name"  text,
  "id_number"  text,
  "mobile"     text,
  "email"      text,
  "login_name" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "delegates_pkey" PRIMARY KEY (id),
  CONSTRAINT "delegates_user_id_key" UNIQUE (user_id)
);

ALTER TABLE "public"."delegates"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."evaluation_criteria" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "track_name"     text                     NOT NULL,
  "criterion_name" text                     NOT NULL,
  "description"    text,
  "sort_order"     integer                  NOT NULL DEFAULT 0,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "evaluation_criteria_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."evaluation_criteria"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."evaluation_evidences" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "assignment_id" uuid                     NOT NULL,
  "criterion_id"  uuid                     NOT NULL,
  "file_name"     text                     NOT NULL,
  "file_url"      text                     NOT NULL,
  "uploaded_by"   uuid                     NOT NULL,
  "uploaded_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "evaluation_evidences_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."evaluation_evidences"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."evaluation_messages" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "assignment_id" uuid                     NOT NULL,
  "sender_id"     uuid                     NOT NULL,
  "message"       text                     NOT NULL,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "evaluation_messages_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."evaluation_messages"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."evaluator_assignments" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "evaluator_id"          uuid                     NOT NULL,
  "association_id"        uuid                     NOT NULL,
  "year"                  integer                  NOT NULL DEFAULT (EXTRACT(year FROM now()))::integer,
  "status"                text                     NOT NULL DEFAULT 'not_started'::text,
  "completion_percentage" integer                  NOT NULL DEFAULT 0,
  "assigned_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"            timestamp with time zone NOT NULL DEFAULT now(),
  "organization_id"       uuid,
  CONSTRAINT "evaluator_assignments_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."evaluator_assignments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."organization_requests" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_name"   text                     NOT NULL,
  "registration_number" text                     NOT NULL,
  "email"               text                     NOT NULL,
  "delegate_name"       text,
  "delegate_id_number"  text,
  "delegate_mobile"     text,
  "delegate_email"      text,
  "submitted_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "reviewed_at"         timestamp with time zone,
  "reviewed_by"         uuid,
  "notes"               text,
  CONSTRAINT "organization_requests_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."organization_requests"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."organizations" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"                text                     NOT NULL,
  "registration_number" text,
  "type"                text                     DEFAULT 'جمعية'::text,
  "status"              text                     NOT NULL DEFAULT 'active'::text,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "organizations_pkey" PRIMARY KEY (id),
  CONSTRAINT "organizations_registration_number_key" UNIQUE (registration_number)
);

ALTER TABLE "public"."organizations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"                  uuid                     NOT NULL,
  "email"               text                     NOT NULL,
  "organization_name"   text,
  "registration_number" text,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "organization_id"     uuid,
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_roles" (
  "id"      uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  CONSTRAINT "user_roles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."user_roles"
  ENABLE ROW LEVEL SECURITY;

CREATE TYPE "public"."app_role" AS ENUM (
  'admin',
  'evaluator',
  'user',
  'organization',
  'individual'
);

ALTER TABLE "public"."user_roles"
  ADD COLUMN "role" public.app_role NOT NULL;

CREATE TYPE "public"."profile_status" AS ENUM (
  'pending_verification',
  'profile_incomplete',
  'active'
);

ALTER TABLE "public"."profiles"
  ADD COLUMN "status" public.profile_status NOT NULL DEFAULT 'pending_verification'::public.profile_status;

CREATE TYPE "public"."request_status" AS ENUM (
  'pending',
  'approved',
  'rejected'
);

ALTER TABLE "public"."organization_requests"
  ADD COLUMN "request_status" public.request_status NOT NULL DEFAULT 'pending'::public.request_status;

CREATE OR REPLACE FUNCTION public.has_role (
  _user_id uuid,
  _role    public.app_role
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_assignment_status()
  RETURNS TRIGGER
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

CREATE OR REPLACE FUNCTION public.validate_criterion_status()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
BEGIN
  IF NEW.status NOT IN ('pending', 'evaluated', 'needs_revision') THEN
    RAISE EXCEPTION 'Invalid criterion status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$;

ALTER TABLE "public"."delegates"
  ADD CONSTRAINT "delegates_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."criterion_evaluations"
  ADD CONSTRAINT "criterion_evaluations_criterion_id_fkey" FOREIGN KEY (criterion_id) REFERENCES public.evaluation_criteria(id) ON DELETE CASCADE;

ALTER TABLE "public"."evaluation_evidences"
  ADD CONSTRAINT "evaluation_evidences_criterion_id_fkey" FOREIGN KEY (criterion_id) REFERENCES public.evaluation_criteria(id) ON DELETE CASCADE;

ALTER TABLE "public"."criterion_evaluations"
  ADD CONSTRAINT "criterion_evaluations_assignment_id_fkey" FOREIGN KEY (assignment_id) REFERENCES public.evaluator_assignments(id) ON DELETE CASCADE;

ALTER TABLE "public"."evaluation_evidences"
  ADD CONSTRAINT "evaluation_evidences_assignment_id_fkey" FOREIGN KEY (assignment_id) REFERENCES public.evaluator_assignments(id) ON DELETE CASCADE;

ALTER TABLE "public"."evaluation_messages"
  ADD CONSTRAINT "evaluation_messages_assignment_id_fkey" FOREIGN KEY (assignment_id) REFERENCES public.evaluator_assignments(id) ON DELETE CASCADE;

ALTER TABLE "public"."evaluator_assignments"
  ADD CONSTRAINT "evaluator_assignments_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

ALTER TABLE "public"."user_roles"
  ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE (user_id, ROLE);

CREATE UNIQUE INDEX idx_org_requests_email_pending ON public.organization_requests USING btree (email)
  WHERE (request_status = 'pending'::public.request_status);

CREATE UNIQUE INDEX idx_org_requests_reg_number_pending ON public.organization_requests USING btree (registration_number)
  WHERE (request_status = 'pending'::public.request_status);

CREATE UNIQUE INDEX uq_assignment_org_year ON public.evaluator_assignments USING btree (organization_id, year)
  WHERE (organization_id IS NOT NULL);

CREATE TRIGGER trg_validate_criterion_status
  BEFORE INSERT OR UPDATE ON public.criterion_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_criterion_status();

CREATE TRIGGER update_criterion_evaluations_updated_at
  BEFORE UPDATE ON public.criterion_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delegates_updated_at
  BEFORE UPDATE ON public.delegates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_validate_assignment_status
  BEFORE INSERT OR UPDATE ON public.evaluator_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_assignment_status();

CREATE TRIGGER update_evaluator_assignments_updated_at
  BEFORE UPDATE ON public.evaluator_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER validate_assignment_status_trigger
  BEFORE INSERT OR UPDATE ON public.evaluator_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_assignment_status();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins manage all criterion evaluations" ON "public"."criterion_evaluations"
  FOR ALL
  TO "authenticated"
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Evaluators manage own criterion evaluations" ON "public"."criterion_evaluations"
  FOR ALL
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.evaluator_assignments
  WHERE ((evaluator_assignments.id = criterion_evaluations.assignment_id) AND (evaluator_assignments.evaluator_id = auth.uid())))));

CREATE POLICY "Organization users view own criterion evaluations" ON "public"."criterion_evaluations"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM (public.evaluator_assignments ea
     JOIN public.profiles p ON ((p.organization_id = ea.organization_id)))
  WHERE ((ea.id = criterion_evaluations.assignment_id) AND (p.id = auth.uid())))));

CREATE POLICY "Users can insert their own delegate info" ON "public"."delegates"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can update their own delegate info" ON "public"."delegates"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can view their own delegate info" ON "public"."delegates"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "Admins manage criteria" ON "public"."evaluation_criteria"
  FOR ALL
  TO "authenticated"
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Authenticated users can view criteria" ON "public"."evaluation_criteria"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "Admins manage all evidences" ON "public"."evaluation_evidences"
  FOR ALL
  TO "authenticated"
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Evaluators view own assignment evidences" ON "public"."evaluation_evidences"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.evaluator_assignments
  WHERE ((evaluator_assignments.id = evaluation_evidences.assignment_id) AND (evaluator_assignments.evaluator_id = auth.uid())))));

CREATE POLICY "Organization users insert own evidences" ON "public"."evaluation_evidences"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((auth.uid() = uploaded_by) AND (EXISTS ( SELECT 1
   FROM (public.evaluator_assignments ea
     JOIN public.profiles p ON ((p.organization_id = ea.organization_id)))
  WHERE ((ea.id = evaluation_evidences.assignment_id) AND (p.id = auth.uid()))))));

CREATE POLICY "Organization users view own evidences" ON "public"."evaluation_evidences"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM (public.evaluator_assignments ea
     JOIN public.profiles p ON ((p.organization_id = ea.organization_id)))
  WHERE ((ea.id = evaluation_evidences.assignment_id) AND (p.id = auth.uid())))));

CREATE POLICY "Admins manage all messages" ON "public"."evaluation_messages"
  FOR ALL
  TO "authenticated"
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Evaluators send messages on own assignments" ON "public"."evaluation_messages"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM public.evaluator_assignments
  WHERE ((evaluator_assignments.id = evaluation_messages.assignment_id) AND (evaluator_assignments.evaluator_id = auth.uid()))))));

CREATE POLICY "Evaluators view own assignment messages" ON "public"."evaluation_messages"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.evaluator_assignments
  WHERE ((evaluator_assignments.id = evaluation_messages.assignment_id) AND (evaluator_assignments.evaluator_id = auth.uid())))));

CREATE POLICY "Organization users send own messages" ON "public"."evaluation_messages"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM (public.evaluator_assignments ea
     JOIN public.profiles p ON ((p.organization_id = ea.organization_id)))
  WHERE ((ea.id = evaluation_messages.assignment_id) AND (p.id = auth.uid()))))));

CREATE POLICY "Organization users view own messages" ON "public"."evaluation_messages"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM (public.evaluator_assignments ea
     JOIN public.profiles p ON ((p.organization_id = ea.organization_id)))
  WHERE ((ea.id = evaluation_messages.assignment_id) AND (p.id = auth.uid())))));

CREATE POLICY "Admins manage all assignments" ON "public"."evaluator_assignments"
  FOR ALL
  TO "authenticated"
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Evaluators update own assignments" ON "public"."evaluator_assignments"
  FOR UPDATE
  TO "authenticated"
  USING ((auth.uid() = evaluator_id));

CREATE POLICY "Evaluators view own assignments" ON "public"."evaluator_assignments"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = evaluator_id));

CREATE POLICY "Organization users view own assignments" ON "public"."evaluator_assignments"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.organization_id = evaluator_assignments.organization_id)))));

CREATE POLICY "Admins can update organization requests" ON "public"."organization_requests"
  FOR UPDATE
  TO "authenticated"
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can view all organization requests" ON "public"."organization_requests"
  FOR SELECT
  TO "authenticated"
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Anyone can submit organization request" ON "public"."organization_requests"
  FOR INSERT
  TO "anon", "authenticated"
  WITH CHECK ((request_status = 'pending'::public.request_status));

CREATE POLICY "Admins manage all organizations" ON "public"."organizations"
  FOR ALL
  TO "authenticated"
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Evaluators can view assigned organizations" ON "public"."organizations"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.evaluator_assignments
  WHERE ((evaluator_assignments.association_id = organizations.id) AND (evaluator_assignments.evaluator_id = auth.uid())))));

CREATE POLICY "Organization users can view their own org" ON "public"."organizations"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.organization_id = organizations.id)))));

CREATE POLICY "Admins can update all profiles" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can view all profiles" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can insert their own profile" ON "public"."profiles"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can update their own profile" ON "public"."profiles"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = id));

CREATE POLICY "Users can view their own profile" ON "public"."profiles"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = id));

CREATE POLICY "Admins can manage all roles" ON "public"."user_roles"
  FOR ALL
  TO "authenticated"
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can view their own roles" ON "public"."user_roles"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = user_id));

GRANT EXECUTE ON FUNCTION "public"."has_role"(uuid, public.app_role) TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."has_role"(uuid, public.app_role) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."has_role"(uuid, public.app_role) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."has_role"(uuid, public.app_role) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."update_updated_at_column"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."update_updated_at_column"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."update_updated_at_column"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."update_updated_at_column"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."validate_assignment_status"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."validate_assignment_status"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."validate_assignment_status"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."validate_assignment_status"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."validate_criterion_status"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."validate_criterion_status"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."validate_criterion_status"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."validate_criterion_status"() TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."criterion_evaluations" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."criterion_evaluations" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."criterion_evaluations" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."criterion_evaluations" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."delegates" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."delegates" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."delegates" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."delegates" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."evaluation_criteria" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."evaluation_criteria" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."evaluation_criteria" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."evaluation_criteria" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."evaluation_evidences" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."evaluation_evidences" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."evaluation_evidences" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."evaluation_evidences" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."evaluation_messages" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."evaluation_messages" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."evaluation_messages" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."evaluation_messages" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."evaluator_assignments" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."evaluator_assignments" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."evaluator_assignments" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."evaluator_assignments" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organization_requests" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."organization_requests" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organization_requests" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organization_requests" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organizations" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."organizations" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organizations" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organizations" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_roles" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."user_roles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_roles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_roles" TO "service_role";

