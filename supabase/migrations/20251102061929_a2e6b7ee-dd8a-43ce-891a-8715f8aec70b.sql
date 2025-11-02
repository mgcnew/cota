-- Fix infinite recursion in RLS policies by using security definer functions

-- 1. Fix activity_log policy
DROP POLICY IF EXISTS "Owners and admins can view activity log" ON activity_log;

CREATE POLICY "Owners and admins can view activity log"
ON activity_log
FOR SELECT
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- 2. Fix company_users policies
DROP POLICY IF EXISTS "Owners and admins can add members" ON company_users;

CREATE POLICY "Owners and admins can add members"
ON company_users
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

DROP POLICY IF EXISTS "Owners and admins can remove members" ON company_users;

CREATE POLICY "Owners and admins can remove members"
ON company_users
FOR DELETE
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND user_id <> auth.uid()
);

DROP POLICY IF EXISTS "Owners and admins can update members" ON company_users;

CREATE POLICY "Owners and admins can update members"
ON company_users
FOR UPDATE
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- 3. Fix companies policy
DROP POLICY IF EXISTS "Owners can update their company" ON companies;

CREATE POLICY "Owners can update their company"
ON companies
FOR UPDATE
TO authenticated
USING (
  id = get_user_company_id(auth.uid())
  AND has_role(auth.uid(), 'owner'::app_role)
);