-- Fase 0: Correções de Segurança - Sistema de Roles (Corrigido)

-- 1. Criar ENUM para roles da aplicação
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'member');

-- 2. Criar tabela user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, company_id)
);

-- 3. Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Criar Security Definer Function para verificar role
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

-- 5. Criar Security Definer Function para obter role do usuário
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

-- 6. Criar Security Definer Function para verificar se usuário tem uma das roles
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

-- 7. Migrar dados existentes de company_users.role para user_roles
INSERT INTO public.user_roles (user_id, company_id, role, created_at)
SELECT 
  user_id,
  company_id,
  role::app_role,
  joined_at
FROM public.company_users
WHERE role IS NOT NULL
ON CONFLICT (user_id, company_id) DO NOTHING;

-- 8. Criar políticas RLS para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view roles in their company"
ON public.user_roles
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Owners and admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = user_roles.company_id
      AND ur.role IN ('owner', 'admin')
  )
);

-- 9. Atualizar políticas RLS existentes para usar user_roles em vez de company_users.role

-- Atualizar policy na tabela companies
DROP POLICY IF EXISTS "Owners can update their company" ON public.companies;
CREATE POLICY "Owners can update their company"
ON public.companies
FOR UPDATE
USING (
  id IN (
    SELECT ur.company_id
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'owner'
  )
);

-- Atualizar policies na tabela company_users
DROP POLICY IF EXISTS "Owners and admins can add members" ON public.company_users;
CREATE POLICY "Owners and admins can add members"
ON public.company_users
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT ur.company_id
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "Owners and admins can update members" ON public.company_users;
CREATE POLICY "Owners and admins can update members"
ON public.company_users
FOR UPDATE
USING (
  company_id IN (
    SELECT ur.company_id
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "Owners and admins can remove members" ON public.company_users;
CREATE POLICY "Owners and admins can remove members"
ON public.company_users
FOR DELETE
USING (
  company_id IN (
    SELECT ur.company_id
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('owner', 'admin')
  )
  AND user_id <> auth.uid()
);

-- 10. Agora podemos remover a coluna role da tabela company_users
ALTER TABLE public.company_users DROP COLUMN IF EXISTS role;