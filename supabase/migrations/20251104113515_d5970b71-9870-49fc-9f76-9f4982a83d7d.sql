-- Drop all existing variations of functions to avoid conflicts
DROP FUNCTION IF EXISTS is_system_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_system_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_system_admin(p_user_id UUID) CASCADE;
DROP FUNCTION IF EXISTS is_system_admin(_user_id UUID) CASCADE;
DROP FUNCTION IF EXISTS is_system_admin(p_user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS is_system_admin(_user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_system_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_system_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_system_admin(p_user_id UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_system_admin(_user_id UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_system_admin(p_user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_system_admin(_user_id uuid) CASCADE;

DROP FUNCTION IF EXISTS get_all_companies_for_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_all_companies_for_admin() CASCADE;

DROP FUNCTION IF EXISTS get_system_stats() CASCADE;
DROP FUNCTION IF EXISTS public.get_system_stats() CASCADE;

DROP FUNCTION IF EXISTS is_current_user_system_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_current_user_system_admin() CASCADE;

DROP FUNCTION IF EXISTS update_company_plan(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_company_plan(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_company_plan(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_company_plan(UUID, TEXT, TEXT) CASCADE;

DROP FUNCTION IF EXISTS update_company_subscription_status(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_company_subscription_status(UUID, TEXT, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS public.update_company_subscription_status(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_company_subscription_status(UUID, TEXT, TIMESTAMPTZ) CASCADE;

-- 1. Create is_system_admin function
CREATE OR REPLACE FUNCTION public.is_system_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = p_user_id 
    AND email = 'mgc.info.new@gmail.com'
  );
$$;

-- 2. Create get_all_companies_for_admin function
CREATE OR REPLACE FUNCTION public.get_all_companies_for_admin()
RETURNS TABLE (
  id UUID,
  name TEXT,
  cnpj TEXT,
  subscription_status TEXT,
  subscription_plan TEXT,
  subscription_expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  users_count BIGINT,
  products_count BIGINT,
  suppliers_count BIGINT,
  corporate_group_id UUID
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.name,
    c.cnpj,
    c.subscription_status,
    c.subscription_plan,
    c.subscription_expires_at,
    c.trial_ends_at,
    c.created_at,
    c.updated_at,
    (SELECT COUNT(*) FROM company_users WHERE company_id = c.id) as users_count,
    (SELECT COUNT(*) FROM products WHERE company_id = c.id) as products_count,
    (SELECT COUNT(*) FROM suppliers WHERE company_id = c.id) as suppliers_count,
    c.corporate_group_id
  FROM companies c
  ORDER BY c.created_at DESC;
$$;

-- 3. Create get_system_stats function
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS TABLE (
  total_companies BIGINT,
  active_companies BIGINT,
  trial_companies BIGINT,
  suspended_companies BIGINT,
  cancelled_companies BIGINT,
  basic_plan_count BIGINT,
  professional_plan_count BIGINT,
  enterprise_plan_count BIGINT,
  total_users BIGINT,
  total_products BIGINT,
  total_suppliers BIGINT,
  total_quotes BIGINT,
  total_orders BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM companies) as total_companies,
    (SELECT COUNT(*) FROM companies WHERE subscription_status = 'active') as active_companies,
    (SELECT COUNT(*) FROM companies WHERE subscription_status = 'trial') as trial_companies,
    (SELECT COUNT(*) FROM companies WHERE subscription_status = 'suspended') as suspended_companies,
    (SELECT COUNT(*) FROM companies WHERE subscription_status = 'cancelled') as cancelled_companies,
    (SELECT COUNT(*) FROM companies WHERE subscription_plan = 'basic') as basic_plan_count,
    (SELECT COUNT(*) FROM companies WHERE subscription_plan = 'professional') as professional_plan_count,
    (SELECT COUNT(*) FROM companies WHERE subscription_plan = 'enterprise') as enterprise_plan_count,
    (SELECT COUNT(DISTINCT user_id) FROM company_users) as total_users,
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT COUNT(*) FROM suppliers) as total_suppliers,
    (SELECT COUNT(*) FROM quotes) as total_quotes,
    (SELECT COUNT(*) FROM orders) as total_orders;
$$;

-- 4. Create RLS policies for system admin
DROP POLICY IF EXISTS "System admin can view all companies" ON companies;
CREATE POLICY "System admin can view all companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    public.is_system_admin(auth.uid())
  );

DROP POLICY IF EXISTS "System admin can update all companies" ON companies;
CREATE POLICY "System admin can update all companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    public.is_system_admin(auth.uid())
  )
  WITH CHECK (
    public.is_system_admin(auth.uid())
  );

-- 5. Create helper function
CREATE OR REPLACE FUNCTION public.is_current_user_system_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_system_admin(auth.uid());
$$;

-- 6. Create update functions
CREATE OR REPLACE FUNCTION public.update_company_plan(
  p_company_id UUID,
  p_new_plan TEXT,
  p_new_status TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_system_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas system admin pode atualizar planos de empresas';
  END IF;

  IF p_new_plan NOT IN ('basic', 'professional', 'enterprise') THEN
    RAISE EXCEPTION 'Plano inválido. Use: basic, professional ou enterprise';
  END IF;

  UPDATE companies
  SET 
    subscription_plan = p_new_plan,
    subscription_status = COALESCE(p_new_status, subscription_status),
    updated_at = NOW()
  WHERE id = p_company_id;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_company_subscription_status(
  p_company_id UUID,
  p_new_status TEXT,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_system_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas system admin pode atualizar status de assinatura';
  END IF;

  IF p_new_status NOT IN ('trial', 'active', 'suspended', 'cancelled') THEN
    RAISE EXCEPTION 'Status inválido. Use: trial, active, suspended ou cancelled';
  END IF;

  UPDATE companies
  SET 
    subscription_status = p_new_status,
    subscription_expires_at = COALESCE(p_expires_at, subscription_expires_at),
    updated_at = NOW()
  WHERE id = p_company_id;

  RETURN FOUND;
END;
$$;