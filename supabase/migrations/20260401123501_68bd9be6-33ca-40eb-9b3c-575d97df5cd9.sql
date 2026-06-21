
-- Create request_status enum
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected');

-- Create organization_requests table
CREATE TABLE public.organization_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  email TEXT NOT NULL,
  delegate_name TEXT,
  delegate_id_number TEXT,
  delegate_mobile TEXT,
  delegate_email TEXT,
  request_status public.request_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  notes TEXT
);

-- Unique constraints to prevent duplicate pending requests
CREATE UNIQUE INDEX idx_org_requests_email_pending
  ON public.organization_requests (email)
  WHERE request_status = 'pending';

CREATE UNIQUE INDEX idx_org_requests_reg_number_pending
  ON public.organization_requests (registration_number)
  WHERE request_status = 'pending';

-- Enable RLS
ALTER TABLE public.organization_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a request (no auth required for registration)
CREATE POLICY "Anyone can submit organization request"
  ON public.organization_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (request_status = 'pending');

-- Admins can view all requests
CREATE POLICY "Admins can view all organization requests"
  ON public.organization_requests
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update organization requests"
  ON public.organization_requests
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
