-- Create corporate_groups table for managing company groups
CREATE TABLE IF NOT EXISTS public.corporate_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  discount_percentage NUMERIC DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  max_companies INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on corporate_groups
ALTER TABLE public.corporate_groups ENABLE ROW LEVEL SECURITY;

-- Add corporate_group_id to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS corporate_group_id UUID REFERENCES public.corporate_groups(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_companies_corporate_group ON public.companies(corporate_group_id);

-- Function to get user's corporate group
CREATE OR REPLACE FUNCTION public.get_user_corporate_group_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cg.id
  FROM corporate_groups cg
  INNER JOIN companies c ON c.corporate_group_id = cg.id
  INNER JOIN company_users cu ON cu.company_id = c.id
  WHERE cu.user_id = _user_id
  LIMIT 1;
$$;

-- Function to check if user is super admin (owner in any company of the group)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = 'owner'::app_role
  );
$$;

-- Function to calculate group discount based on number of companies
CREATE OR REPLACE FUNCTION public.calculate_group_discount(_corporate_group_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN COUNT(*) >= 10 THEN 30
      WHEN COUNT(*) >= 5 THEN 20
      WHEN COUNT(*) >= 3 THEN 15
      WHEN COUNT(*) >= 2 THEN 10
      ELSE 0
    END
  FROM companies
  WHERE corporate_group_id = _corporate_group_id;
$$;

-- RLS Policies for corporate_groups

-- Super admins can view corporate groups
CREATE POLICY "Super admins can view corporate groups"
ON public.corporate_groups
FOR SELECT
TO authenticated
USING (
  id = get_user_corporate_group_id(auth.uid())
  OR is_super_admin(auth.uid())
);

-- Super admins can create corporate groups
CREATE POLICY "Super admins can create corporate groups"
ON public.corporate_groups
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

-- Super admins can update their corporate groups
CREATE POLICY "Super admins can update corporate groups"
ON public.corporate_groups
FOR UPDATE
TO authenticated
USING (
  id = get_user_corporate_group_id(auth.uid())
  AND is_super_admin(auth.uid())
);

-- Super admins can delete their corporate groups
CREATE POLICY "Super admins can delete corporate groups"
ON public.corporate_groups
FOR DELETE
TO authenticated
USING (
  id = get_user_corporate_group_id(auth.uid())
  AND is_super_admin(auth.uid())
);

-- Update companies policies to allow super admins to view all companies in group
DROP POLICY IF EXISTS "Users can view basic company info" ON public.companies;

CREATE POLICY "Users can view company info"
ON public.companies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT company_id
    FROM company_users
    WHERE user_id = auth.uid()
  )
  OR (
    corporate_group_id = get_user_corporate_group_id(auth.uid())
    AND is_super_admin(auth.uid())
  )
);

-- Trigger to update updated_at on corporate_groups
CREATE TRIGGER update_corporate_groups_updated_at
BEFORE UPDATE ON public.corporate_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();