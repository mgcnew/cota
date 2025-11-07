-- ============================================
-- VALIDAÇÕES DE LIMITES E GUARDIAS DE ASSINATURA
-- ============================================

-- 1. Criar tabela plan_features se não existir
CREATE TABLE IF NOT EXISTS plan_features (
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

-- Inserir features padrão (se não existirem)
INSERT INTO plan_features (plan_name, max_users, max_products, max_suppliers, max_quotes_per_month, api_access, advanced_analytics, priority_support) 
VALUES
  ('basic', 5, 100, 50, 100, FALSE, FALSE, FALSE),
  ('professional', 15, 500, 200, 1000, TRUE, TRUE, FALSE),
  ('enterprise', 100, -1, -1, -1, TRUE, TRUE, TRUE) -- -1 = ilimitado
ON CONFLICT (plan_name) DO NOTHING;

-- 2. Função para verificar limite de usuários
CREATE OR REPLACE FUNCTION check_max_users()
RETURNS TRIGGER AS $$
DECLARE
  v_max_users INTEGER;
  v_current_users INTEGER;
  v_plan_name TEXT;
BEGIN
  -- Obter plano e limite da empresa
  SELECT c.subscription_plan, pf.max_users INTO v_plan_name, v_max_users
  FROM companies c
  JOIN plan_features pf ON c.subscription_plan = pf.plan_name
  WHERE c.id = NEW.company_id;
  
  -- Se não encontrou plano, usar padrão básico
  IF v_max_users IS NULL THEN
    v_max_users := 5;
  END IF;
  
  -- Contar usuários atuais
  SELECT COUNT(*) INTO v_current_users
  FROM company_users
  WHERE company_id = NEW.company_id;
  
  -- Validar limite (considerando que NEW ainda não foi inserido)
  IF v_current_users >= v_max_users THEN
    RAISE EXCEPTION 'Limite de usuários atingido (%/%). Faça upgrade do plano para adicionar mais usuários.', 
      v_current_users, v_max_users;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para validar max_users
DROP TRIGGER IF EXISTS enforce_max_users ON company_users;
CREATE TRIGGER enforce_max_users
  BEFORE INSERT ON company_users
  FOR EACH ROW
  EXECUTE FUNCTION check_max_users();

-- 3. Função para verificar limite de produtos
CREATE OR REPLACE FUNCTION check_max_products()
RETURNS TRIGGER AS $$
DECLARE
  v_max_products INTEGER;
  v_current_products INTEGER;
  v_plan_name TEXT;
BEGIN
  -- Obter plano e limite da empresa
  SELECT c.subscription_plan, pf.max_products INTO v_plan_name, v_max_products
  FROM companies c
  JOIN plan_features pf ON c.subscription_plan = pf.plan_name
  WHERE c.id = NEW.company_id;
  
  -- Se não encontrou plano, usar padrão básico
  IF v_max_products IS NULL THEN
    v_max_products := 100;
  END IF;
  
  -- Se -1, é ilimitado
  IF v_max_products = -1 THEN
    RETURN NEW;
  END IF;
  
  -- Contar produtos atuais
  SELECT COUNT(*) INTO v_current_products
  FROM products
  WHERE company_id = NEW.company_id;
  
  -- Validar limite
  IF v_current_products >= v_max_products THEN
    RAISE EXCEPTION 'Limite de produtos atingido (%/%). Faça upgrade do plano para adicionar mais produtos.', 
      v_current_products, v_max_products;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para validar max_products
DROP TRIGGER IF EXISTS enforce_max_products ON products;
CREATE TRIGGER enforce_max_products
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_max_products();

-- 4. Função para verificar limite de fornecedores
CREATE OR REPLACE FUNCTION check_max_suppliers()
RETURNS TRIGGER AS $$
DECLARE
  v_max_suppliers INTEGER;
  v_current_suppliers INTEGER;
  v_plan_name TEXT;
BEGIN
  -- Obter plano e limite da empresa
  SELECT c.subscription_plan, pf.max_suppliers INTO v_plan_name, v_max_suppliers
  FROM companies c
  JOIN plan_features pf ON c.subscription_plan = pf.plan_name
  WHERE c.id = NEW.company_id;
  
  -- Se não encontrou plano, usar padrão básico
  IF v_max_suppliers IS NULL THEN
    v_max_suppliers := 50;
  END IF;
  
  -- Se -1, é ilimitado
  IF v_max_suppliers = -1 THEN
    RETURN NEW;
  END IF;
  
  -- Contar fornecedores atuais
  SELECT COUNT(*) INTO v_current_suppliers
  FROM suppliers
  WHERE company_id = NEW.company_id;
  
  -- Validar limite
  IF v_current_suppliers >= v_max_suppliers THEN
    RAISE EXCEPTION 'Limite de fornecedores atingido (%/%). Faça upgrade do plano para adicionar mais fornecedores.', 
      v_current_suppliers, v_max_suppliers;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para validar max_suppliers
DROP TRIGGER IF EXISTS enforce_max_suppliers ON suppliers;
CREATE TRIGGER enforce_max_suppliers
  BEFORE INSERT ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION check_max_suppliers();

-- 5. Função para verificar se assinatura está ativa
CREATE OR REPLACE FUNCTION is_subscription_active(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN subscription_status = 'suspended' THEN FALSE
      WHEN subscription_status = 'cancelled' THEN FALSE
      WHEN subscription_status = 'trial' AND subscription_expires_at < NOW() THEN FALSE
      WHEN subscription_status = 'trial' AND trial_ends_at < NOW() THEN FALSE
      WHEN subscription_status = 'active' AND subscription_expires_at IS NOT NULL 
           AND subscription_expires_at < NOW() THEN FALSE
      ELSE TRUE
    END
  FROM companies
  WHERE id = p_company_id;
$$;

-- 6. Função helper para obter features do plano
CREATE OR REPLACE FUNCTION get_plan_features(p_plan_name TEXT)
RETURNS TABLE (
  max_users INTEGER,
  max_products INTEGER,
  max_suppliers INTEGER,
  max_quotes_per_month INTEGER
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(max_users, 5),
    COALESCE(max_products, 100),
    COALESCE(max_suppliers, 50),
    COALESCE(max_quotes_per_month, 100)
  FROM plan_features
  WHERE plan_name = p_plan_name;
$$;

-- 7. Adicionar campo trial_ends_at se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE companies 
    ADD COLUMN trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days');
  END IF;
END $$;

-- 8. Comentários para documentação
COMMENT ON FUNCTION check_max_users() IS 'Valida limite de usuários antes de inserir em company_users';
COMMENT ON FUNCTION check_max_products() IS 'Valida limite de produtos antes de inserir em products';
COMMENT ON FUNCTION check_max_suppliers() IS 'Valida limite de fornecedores antes de inserir em suppliers';
COMMENT ON FUNCTION is_subscription_active(UUID) IS 'Verifica se assinatura da empresa está ativa';
COMMENT ON FUNCTION get_plan_features(TEXT) IS 'Retorna features do plano especificado';





