-- FASE 1: Criar estrutura de empresas (SaaS Multi-Tenant)
-- Esta migração NÃO afeta dados existentes

-- 1. Criar tabela de empresas
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'professional', 'enterprise')),
  subscription_expires_at TIMESTAMPTZ,
  max_users INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. Criar tabela de relacionamento usuário-empresa
CREATE TABLE company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Habilitar RLS
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

-- Índices para performance
CREATE INDEX idx_company_users_company ON company_users(company_id);
CREATE INDEX idx_company_users_user ON company_users(user_id);

-- 3. Função Security Definer para obter company_id do usuário (evita recursão RLS)
CREATE OR REPLACE FUNCTION get_user_company_id(p_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id 
  FROM company_users 
  WHERE user_id = p_user_id 
  LIMIT 1;
$$;

-- 4. RLS Policies para companies
-- Usuários podem ver apenas sua própria empresa
CREATE POLICY "Users can view their company"
ON companies FOR SELECT
TO authenticated
USING (id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));

-- Apenas owners podem atualizar empresa
CREATE POLICY "Owners can update their company"
ON companies FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT company_id 
    FROM company_users 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- 5. RLS Policies para company_users
-- Usuários podem ver membros da própria empresa
CREATE POLICY "Users can view company members"
ON company_users FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- Owners e admins podem adicionar membros
CREATE POLICY "Owners and admins can add members"
ON company_users FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM company_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Owners e admins podem atualizar membros
CREATE POLICY "Owners and admins can update members"
ON company_users FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM company_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Owners e admins podem remover membros (exceto não podem se auto-remover)
CREATE POLICY "Owners and admins can remove members"
ON company_users FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM company_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
  AND user_id != auth.uid()
);