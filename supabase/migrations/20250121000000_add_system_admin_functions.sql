-- ============================================
-- SISTEMA ADMIN - FUNÇÕES E POLÍTICAS RLS
-- ============================================
-- Este arquivo adiciona funções para permitir que o dono do sistema
-- (mgc.info.new@gmail.com) gerencie todas as empresas do sistema

-- 1. Função para verificar se um usuário é system admin
-- Remover função existente se houver (pode ter parâmetros diferentes)
-- PostgreSQL trata funções com nomes de parâmetros diferentes como funções diferentes
-- Então precisamos remover todas as variações possíveis
DROP FUNCTION IF EXISTS is_system_admin(UUID);
DROP FUNCTION IF EXISTS is_system_admin(uuid);
DROP FUNCTION IF EXISTS is_system_admin(p_user_id UUID);
DROP FUNCTION IF EXISTS is_system_admin(_user_id UUID);
DROP FUNCTION IF EXISTS is_system_admin(p_user_id uuid);
DROP FUNCTION IF EXISTS is_system_admin(_user_id uuid);
DROP FUNCTION IF EXISTS public.is_system_admin(UUID);
DROP FUNCTION IF EXISTS public.is_system_admin(uuid);
DROP FUNCTION IF EXISTS public.is_system_admin(p_user_id UUID);
DROP FUNCTION IF EXISTS public.is_system_admin(_user_id UUID);
DROP FUNCTION IF EXISTS public.is_system_admin(p_user_id uuid);
DROP FUNCTION IF EXISTS public.is_system_admin(_user_id uuid);

CREATE OR REPLACE FUNCTION is_system_admin(p_user_id UUID)
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

-- Comentário para documentação
COMMENT ON FUNCTION is_system_admin(UUID) IS 'Verifica se o usuário é o system admin (mgc.info.new@gmail.com)';

-- 2. Função para obter todas as empresas do sistema (apenas para system admin)
-- Remover função existente se houver (pode ter assinatura diferente)
DROP FUNCTION IF EXISTS get_all_companies_for_admin();
DROP FUNCTION IF EXISTS public.get_all_companies_for_admin();

CREATE OR REPLACE FUNCTION get_all_companies_for_admin()
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

-- Comentário para documentação
COMMENT ON FUNCTION get_all_companies_for_admin() IS 'Retorna todas as empresas do sistema com contadores de recursos (apenas para system admin)';

-- 3. Função para obter estatísticas gerais do sistema
-- Remover função existente se houver (pode ter assinatura diferente)
DROP FUNCTION IF EXISTS get_system_stats();
DROP FUNCTION IF EXISTS public.get_system_stats();

CREATE OR REPLACE FUNCTION get_system_stats()
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

-- Comentário para documentação
COMMENT ON FUNCTION get_system_stats() IS 'Retorna estatísticas gerais do sistema (apenas para system admin)';

-- 4. RLS Policy: Permitir que system admin veja todas as empresas
-- Primeiro, remover política existente se houver conflito
DROP POLICY IF EXISTS "System admin can view all companies" ON companies;

-- Criar política para system admin ver todas empresas
CREATE POLICY "System admin can view all companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    is_system_admin(auth.uid())
  );

-- 5. RLS Policy: Permitir que system admin atualize empresas (para mudar planos, status, etc)
DROP POLICY IF EXISTS "System admin can update all companies" ON companies;

CREATE POLICY "System admin can update all companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    is_system_admin(auth.uid())
  )
  WITH CHECK (
    is_system_admin(auth.uid())
  );

-- 6. Criar função helper para verificar se usuário atual é system admin
-- Remover função existente se houver
DROP FUNCTION IF EXISTS is_current_user_system_admin();
DROP FUNCTION IF EXISTS public.is_current_user_system_admin();

CREATE OR REPLACE FUNCTION is_current_user_system_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_system_admin(auth.uid());
$$;

-- Comentário para documentação
COMMENT ON FUNCTION is_current_user_system_admin() IS 'Verifica se o usuário atual é system admin';

-- 7. Garantir que as políticas RLS não bloqueiem as funções
-- As funções usam SECURITY DEFINER, então elas executam com privilégios elevados
-- e podem acessar dados mesmo com RLS ativo

-- 8. Criar função para atualizar plano de uma empresa (para system admin)
-- Remover função existente se houver (pode ter parâmetros diferentes)
DROP FUNCTION IF EXISTS update_company_plan(UUID, TEXT);
DROP FUNCTION IF EXISTS update_company_plan(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_company_plan(UUID, TEXT);
DROP FUNCTION IF EXISTS public.update_company_plan(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION update_company_plan(
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
  -- Verificar se é system admin
  IF NOT is_system_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas system admin pode atualizar planos de empresas';
  END IF;

  -- Validar plano
  IF p_new_plan NOT IN ('basic', 'professional', 'enterprise') THEN
    RAISE EXCEPTION 'Plano inválido. Use: basic, professional ou enterprise';
  END IF;

  -- Atualizar empresa
  UPDATE companies
  SET 
    subscription_plan = p_new_plan,
    subscription_status = COALESCE(p_new_status, subscription_status),
    updated_at = NOW()
  WHERE id = p_company_id;

  RETURN FOUND;
END;
$$;

-- Comentário para documentação
COMMENT ON FUNCTION update_company_plan(UUID, TEXT, TEXT) IS 'Atualiza o plano e status de uma empresa (apenas system admin)';

-- 9. Criar função para atualizar status de assinatura
-- Remover função existente se houver (pode ter parâmetros diferentes)
DROP FUNCTION IF EXISTS update_company_subscription_status(UUID, TEXT);
DROP FUNCTION IF EXISTS update_company_subscription_status(UUID, TEXT, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.update_company_subscription_status(UUID, TEXT);
DROP FUNCTION IF EXISTS public.update_company_subscription_status(UUID, TEXT, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION update_company_subscription_status(
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
  -- Verificar se é system admin
  IF NOT is_system_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas system admin pode atualizar status de assinatura';
  END IF;

  -- Validar status
  IF p_new_status NOT IN ('trial', 'active', 'suspended', 'cancelled') THEN
    RAISE EXCEPTION 'Status inválido. Use: trial, active, suspended ou cancelled';
  END IF;

  -- Atualizar empresa
  UPDATE companies
  SET 
    subscription_status = p_new_status,
    subscription_expires_at = COALESCE(p_expires_at, subscription_expires_at),
    updated_at = NOW()
  WHERE id = p_company_id;

  RETURN FOUND;
END;
$$;

-- Comentário para documentação
COMMENT ON FUNCTION update_company_subscription_status(UUID, TEXT, TIMESTAMPTZ) IS 'Atualiza o status de assinatura de uma empresa (apenas system admin)';

-- 10. Garantir que as funções estejam acessíveis via RPC
-- As funções já estão criadas com SECURITY DEFINER, então podem ser chamadas via Supabase RPC

