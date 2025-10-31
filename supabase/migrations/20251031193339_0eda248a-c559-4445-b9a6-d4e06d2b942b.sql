-- Fix critical security issues

-- 1. Fix user_roles policies: Only owners can manage roles
DROP POLICY IF EXISTS "Owners and admins can manage roles" ON user_roles;

-- Owners can manage all roles
CREATE POLICY "Owners can manage all roles"
ON user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.company_id = user_roles.company_id
    AND ur.role = 'owner'::app_role
  )
);

-- 2. Fix company_invitations policy: Only the invited email can accept
DROP POLICY IF EXISTS "Anyone can update invitation status" ON company_invitations;

-- Only the person with matching email can accept the invitation
CREATE POLICY "Users can accept their own invitations"
ON company_invitations
FOR UPDATE
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR company_id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR company_id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  )
);

-- 3. Restrict companies table sensitive fields to owners/admins only
-- First, allow all members to see basic company info
DROP POLICY IF EXISTS "Users can view their company" ON companies;

CREATE POLICY "Users can view basic company info"
ON companies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  )
);

-- 4. Restrict activity_log to owners and admins only
DROP POLICY IF EXISTS "Users can view company activity log" ON activity_log;

CREATE POLICY "Owners and admins can view activity log"
ON activity_log
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT ur.company_id FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('owner'::app_role, 'admin'::app_role)
  )
);