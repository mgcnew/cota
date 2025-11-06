# 🚨 SQL para Resolver Limite de Produtos - Para Lovable

## Problema
Owners estão recebendo erro "Limite de produtos atingido" mesmo sendo owners, que deveriam ter produtos ilimitados.

## Solução
Aplicar este SQL no Supabase Dashboard (SQL Editor):

```sql
-- =====================================================
-- CORRIGIR LIMITE DE PRODUTOS PARA OWNERS
-- =====================================================

-- 1. ATUALIZAR FUNÇÃO check_max_products()
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
  v_user_id UUID;
  v_is_owner BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  -- Verifica se é owner (3 métodos)
  SELECT is_super_admin(v_user_id) INTO v_is_owner;
  
  IF NOT v_is_owner THEN
    SELECT is_system_admin(v_user_id) INTO v_is_owner;
  END IF;
  
  IF NOT v_is_owner THEN
    SELECT EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = v_user_id AND role = 'owner'::app_role
    ) INTO v_is_owner;
  END IF;
  
  -- Se for owner, permitir sem limite
  IF v_is_owner THEN
    RETURN NEW;
  END IF;
  
  -- Se não é owner, aplicar limites do plano
  v_company_id := NEW.company_id;
  
  SELECT subscription_plan INTO v_plan_name
  FROM public.companies
  WHERE id = v_company_id;
  
  v_plan_name := COALESCE(v_plan_name, 'basic');
  
  SELECT max_products INTO v_max_products
  FROM public.get_plan_features(v_plan_name);
  
  IF v_max_products = -1 THEN
    RETURN NEW;
  END IF;
  
  SELECT COUNT(*) INTO v_current_products
  FROM public.products
  WHERE company_id = v_company_id;
  
  IF v_current_products >= v_max_products THEN
    RAISE EXCEPTION 'Limite de produtos atingido (%/%). Faça upgrade do plano para adicionar mais produtos.', v_current_products, v_max_products;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.check_max_products() IS 'Valida limite de produtos antes de inserir em products. Owners não têm limites.';
```

## Verificações Necessárias

Antes de aplicar, verifique se estas funções existem:

### 1. Verificar/Criar `is_super_admin(UUID)`
```sql
-- Verificar
SELECT proname FROM pg_proc WHERE proname = 'is_super_admin';

-- Se não existir, criar:
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id AND role = 'owner'::app_role
  );
END;
$$;
```

### 2. Verificar/Criar `is_system_admin(UUID)`
```sql
-- Verificar
SELECT proname FROM pg_proc WHERE proname = 'is_system_admin';

-- Se não existir, criar:
CREATE OR REPLACE FUNCTION public.is_system_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = p_user_id AND email = 'mgc.info.new@gmail.com'
  );
END;
$$;
```

### 3. Verificar `get_plan_features(TEXT)`
```sql
-- Verificar se existe
SELECT proname FROM pg_proc WHERE proname = 'get_plan_features';
-- Esta função deve retornar max_products baseado no plano
```

## Resultado Esperado

✅ Owners podem adicionar produtos **ilimitados**  
✅ Usuários normais continuam com limites do plano  

## Teste

Após aplicar, teste adicionando um produto como owner. Não deve aparecer erro de limite.

