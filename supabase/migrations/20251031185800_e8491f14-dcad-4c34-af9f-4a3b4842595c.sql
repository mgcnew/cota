-- Create table for email invitations
CREATE TABLE IF NOT EXISTS public.company_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'member',
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, email)
);

-- Enable RLS
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;

-- Only authenticated users from the same company can view invitations
CREATE POLICY "Users can view company invitations"
ON public.company_invitations
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
  )
);

-- Only admins and owners can create invitations
CREATE POLICY "Admins can create invitations"
ON public.company_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
  )
  AND (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')
  )
);

-- Only admins and owners can delete invitations
CREATE POLICY "Admins can delete invitations"
ON public.company_invitations
FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
  )
  AND (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')
  )
);

-- Anyone can update invitation status (for accepting invites)
CREATE POLICY "Anyone can update invitation status"
ON public.company_invitations
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_invitations_token ON public.company_invitations(token);
CREATE INDEX IF NOT EXISTS idx_company_invitations_email ON public.company_invitations(email);
CREATE INDEX IF NOT EXISTS idx_company_invitations_status ON public.company_invitations(status);