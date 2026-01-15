-- =====================================================
-- Correção: Remover Recursão Infinita em user_roles RLS
-- Data: 2026-01-15
-- Problema: Política "Owners can manage roles" causava recursão infinita
-- =====================================================

-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Owners can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view company roles" ON user_roles;

-- Recriar políticas sem recursão
-- Política 1: Usuários podem ver roles da sua empresa
CREATE POLICY "Users can view company roles"
ON user_roles FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- Política 2: Owners podem adicionar roles
CREATE POLICY "Owners can add roles"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM company_users cu
    WHERE cu.user_id = auth.uid()
    AND cu.company_id = user_roles.company_id
  )
);

-- Política 3: Owners podem atualizar roles
CREATE POLICY "Owners can update roles"
ON user_roles FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Política 4: Owners podem deletar roles
CREATE POLICY "Owners can delete roles"
ON user_roles FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));
