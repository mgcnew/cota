-- 1. CRIAR TABELA plan_features
CREATE TABLE IF NOT EXISTS public.plan_features (
  plan_name TEXT PRIMARY KEY,
  max_users INTEGER DEFAULT 5,
  max_products INTEGER DEFAULT 100,
  max_suppliers INTEGER DEFAULT 50,
  max_quotes_per_month INTEGER DEFAULT 100,
  api_access BOOLEAN DEFAULT FALSE,
  advanced_analytics BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir 3 planos padrão
INSERT INTO public.plan_features (plan_name, max_users, max_products, max_suppliers, max_quotes_per_month, api_access, advanced_analytics, priority_support)
VALUES 
  ('basic', 5, 100, 50, 100, FALSE, FALSE, FALSE),
  ('professional', 15, 500, 200, 1000, TRUE, TRUE, FALSE),
  ('enterprise', 100, -1, -1, -1, TRUE, TRUE, TRUE)
ON CONFLICT (plan_name) DO NOTHING;

-- 2. ATUALIZAR TABELA companies (adicionar campos se não existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='trial_ends_at') THEN
    ALTER TABLE public.companies ADD COLUMN trial_ends_at TIMESTAMPTZ;
  END IF;
END $$;

-- Atualizar valores padrão se os campos já existirem
UPDATE public.companies 
SET subscription_status = COALESCE(subscription_status, 'trial'),
    subscription_plan = COALESCE(subscription_plan, 'basic')
WHERE subscription_status IS NULL OR subscription_plan IS NULL;

-- 3. CRIAR FUNÇÕES SQL

-- Função para verificar se assinatura está ativa
CREATE OR REPLACE FUNCTION public.is_subscription_active(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN c.subscription_status = 'suspended' THEN FALSE
      WHEN c.subscription_status = 'cancelled' THEN FALSE
      WHEN c.subscription_status = 'trial' AND c.trial_ends_at < NOW() THEN FALSE
      WHEN c.subscription_status = 'trial' AND c.subscription_expires_at < NOW() THEN FALSE
      WHEN c.subscription_status = 'active' AND c.subscription_expires_at < NOW() THEN FALSE
      ELSE TRUE
    END
  FROM public.companies c
  WHERE c.id = p_company_id;
$$;

-- Função para obter features do plano
CREATE OR REPLACE FUNCTION public.get_plan_features(p_plan_name TEXT)
RETURNS TABLE (
  max_users INTEGER,
  max_products INTEGER,
  max_suppliers INTEGER,
  max_quotes_per_month INTEGER,
  api_access BOOLEAN,
  advanced_analytics BOOLEAN,
  priority_support BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(pf.max_users, 5) as max_users,
    COALESCE(pf.max_products, 100) as max_products,
    COALESCE(pf.max_suppliers, 50) as max_suppliers,
    COALESCE(pf.max_quotes_per_month, 100) as max_quotes_per_month,
    COALESCE(pf.api_access, FALSE) as api_access,
    COALESCE(pf.advanced_analytics, FALSE) as advanced_analytics,
    COALESCE(pf.priority_support, FALSE) as priority_support
  FROM public.plan_features pf
  WHERE pf.plan_name = p_plan_name
  UNION ALL
  SELECT 5, 100, 50, 100, FALSE, FALSE, FALSE
  WHERE NOT EXISTS (SELECT 1 FROM public.plan_features WHERE plan_name = p_plan_name)
  LIMIT 1;
$$;

-- Função para verificar limite de usuários
CREATE OR REPLACE FUNCTION public.check_max_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_plan_name TEXT;
  v_max_users INTEGER;
  v_current_users INTEGER;
BEGIN
  -- Obter company_id do novo registro
  v_company_id := NEW.company_id;
  
  -- Obter plano da empresa
  SELECT subscription_plan INTO v_plan_name
  FROM public.companies
  WHERE id = v_company_id;
  
  -- Se não encontrou plano, usar basic
  v_plan_name := COALESCE(v_plan_name, 'basic');
  
  -- Obter limite do plano
  SELECT max_users INTO v_max_users
  FROM public.get_plan_features(v_plan_name);
  
  -- Contar usuários atuais
  SELECT COUNT(*) INTO v_current_users
  FROM public.company_users
  WHERE company_id = v_company_id;
  
  -- Verificar se atingiu o limite
  IF v_current_users >= v_max_users THEN
    RAISE EXCEPTION 'Limite de usuários atingido (%/%). Faça upgrade do plano para adicionar mais usuários.', v_current_users, v_max_users;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Função para verificar limite de produtos
CREATE OR REPLACE FUNCTION public.check_max_products()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_plan_name TEXT;
  v_max_products INTEGER;
  v_current_products INTEGER;
BEGIN
  -- Obter company_id do novo registro
  v_company_id := NEW.company_id;
  
  -- Obter plano da empresa
  SELECT subscription_plan INTO v_plan_name
  FROM public.companies
  WHERE id = v_company_id;
  
  -- Se não encontrou plano, usar basic
  v_plan_name := COALESCE(v_plan_name, 'basic');
  
  -- Obter limite do plano
  SELECT max_products INTO v_max_products
  FROM public.get_plan_features(v_plan_name);
  
  -- Se ilimitado (-1), permitir
  IF v_max_products = -1 THEN
    RETURN NEW;
  END IF;
  
  -- Contar produtos atuais
  SELECT COUNT(*) INTO v_current_products
  FROM public.products
  WHERE company_id = v_company_id;
  
  -- Verificar se atingiu o limite
  IF v_current_products >= v_max_products THEN
    RAISE EXCEPTION 'Limite de produtos atingido (%/%). Faça upgrade do plano para adicionar mais produtos.', v_current_products, v_max_products;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Função para verificar limite de fornecedores
CREATE OR REPLACE FUNCTION public.check_max_suppliers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_plan_name TEXT;
  v_max_suppliers INTEGER;
  v_current_suppliers INTEGER;
BEGIN
  -- Obter company_id do novo registro
  v_company_id := NEW.company_id;
  
  -- Obter plano da empresa
  SELECT subscription_plan INTO v_plan_name
  FROM public.companies
  WHERE id = v_company_id;
  
  -- Se não encontrou plano, usar basic
  v_plan_name := COALESCE(v_plan_name, 'basic');
  
  -- Obter limite do plano
  SELECT max_suppliers INTO v_max_suppliers
  FROM public.get_plan_features(v_plan_name);
  
  -- Se ilimitado (-1), permitir
  IF v_max_suppliers = -1 THEN
    RETURN NEW;
  END IF;
  
  -- Contar fornecedores atuais
  SELECT COUNT(*) INTO v_current_suppliers
  FROM public.suppliers
  WHERE company_id = v_company_id;
  
  -- Verificar se atingiu o limite
  IF v_current_suppliers >= v_max_suppliers THEN
    RAISE EXCEPTION 'Limite de fornecedores atingido (%/%). Faça upgrade do plano para adicionar mais fornecedores.', v_current_suppliers, v_max_suppliers;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. CRIAR TRIGGERS

-- Remover triggers existentes se houver
DROP TRIGGER IF EXISTS enforce_max_users ON public.company_users;
DROP TRIGGER IF EXISTS enforce_max_products ON public.products;
DROP TRIGGER IF EXISTS enforce_max_suppliers ON public.suppliers;

-- Criar triggers
CREATE TRIGGER enforce_max_users
  BEFORE INSERT ON public.company_users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_max_users();

CREATE TRIGGER enforce_max_products
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.check_max_products();

CREATE TRIGGER enforce_max_suppliers
  BEFORE INSERT ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.check_max_suppliers();

-- 5. CONFIGURAR RLS

-- Permitir leitura pública em plan_features para usuários autenticados
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view plan features" ON public.plan_features;
CREATE POLICY "Anyone can view plan features"
  ON public.plan_features
  FOR SELECT
  TO authenticated
  USING (true);