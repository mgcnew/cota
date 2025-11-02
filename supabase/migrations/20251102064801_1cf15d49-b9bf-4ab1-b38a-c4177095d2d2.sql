-- Drop the problematic policy that still has recursion
DROP POLICY IF EXISTS "Owners can manage all roles" ON public.user_roles;

-- Create a correct policy that uses ONLY the SECURITY DEFINER function
-- This function bypasses RLS, so no recursion happens
CREATE POLICY "Owners can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  -- Use the SECURITY DEFINER function that bypasses RLS
  public.has_role(auth.uid(), 'owner'::app_role)
  AND company_id IN (
    SELECT company_id 
    FROM public.company_users 
    WHERE user_id = auth.uid()
  )
);