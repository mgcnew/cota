-- =====================================================
-- Correção: user_roles RLS exige papel de OWNER para mutações
-- Data: 2026-05-26
-- Problema: As políticas criadas em 20260115_fix_user_roles_rls_recursion.sql
--           permitiam que QUALQUER membro da empresa criasse/alterasse/removesse
--           roles, bastando o company_id bater. Restaura o gate de owner.
-- =====================================================

-- Remover políticas frouxas
DROP POLICY IF EXISTS "Owners can add roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners can delete roles" ON public.user_roles;

-- INSERT: apenas owners da empresa podem adicionar roles
CREATE POLICY "Owners can add roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_role(auth.uid(), 'owner'::app_role)
);

-- UPDATE: apenas owners podem alterar roles
CREATE POLICY "Owners can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_role(auth.uid(), 'owner'::app_role)
);

-- DELETE: apenas owners podem remover roles
CREATE POLICY "Owners can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_role(auth.uid(), 'owner'::app_role)
);
