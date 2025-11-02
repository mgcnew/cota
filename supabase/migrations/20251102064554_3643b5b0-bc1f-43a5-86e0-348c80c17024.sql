-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Owners can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles in their company" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Step 2: Create SECURITY DEFINER functions that bypass RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
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

CREATE OR REPLACE FUNCTION public.user_has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 3: Create non-recursive RLS policies using SECURITY DEFINER functions

-- Policy 1: Users can view their own roles (no self-reference)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Owners can manage all roles in their company (uses SECURITY DEFINER function)
CREATE POLICY "Owners can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = user_roles.company_id
      AND ur.role = 'owner'::app_role
  )
);

-- Policy 3: Users can view roles in their company
CREATE POLICY "Users can view roles in their company"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
);

-- Step 4: Insert owner role for the current user if it doesn't exist
INSERT INTO public.user_roles (user_id, company_id, role)
SELECT 
  '55a480d0-4809-4eb5-8d7e-1b45bd032d11'::uuid,
  '31eeb636-9ec3-436c-99d0-958cf7535b03'::uuid,
  'owner'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = '55a480d0-4809-4eb5-8d7e-1b45bd032d11'
    AND company_id = '31eeb636-9ec3-436c-99d0-958cf7535b03'
);