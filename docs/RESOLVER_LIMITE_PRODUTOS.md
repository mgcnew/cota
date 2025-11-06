# 🔧 Resolver Problema de Limite de Produtos

## 📋 Resumo do Problema

Owners estão recebendo erro "Limite de produtos atingido" mesmo sendo owners, que deveriam ter produtos ilimitados.

## ✅ O que já foi feito no Frontend

- ✅ Mensagens de erro melhoradas no `AddProductDialog.tsx`
- ✅ Validações frontend implementadas
- ✅ Logs de debug adicionados

## ⚠️ O que FALTA no Banco de Dados

### 1. Aplicar a Migração SQL

A função `check_max_products()` precisa ser atualizada no banco de dados. Execute o SQL abaixo no Supabase Dashboard (SQL Editor):

```sql
-- =====================================================
-- CORRIGIR LIMITE DE PRODUTOS PARA OWNERS
-- =====================================================
-- Esta migração permite que owners adicionem produtos
-- sem limites, enquanto usuários normais continuam
-- com limites baseados no plano
-- =====================================================

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
  -- Obter user_id atual
  v_user_id := auth.uid();
  
  -- Verificar se o usuário é owner usando três métodos:
  
  -- 1. Verifica pela função is_super_admin (owners em user_roles)
  SELECT is_super_admin(v_user_id) INTO v_is_owner;
  
  -- 2. Se não for owner, verifica se é system admin (mgc.info.new@gmail.com)
  IF NOT v_is_owner THEN
    SELECT is_system_admin(v_user_id) INTO v_is_owner;
  END IF;
  
  -- 3. Se ainda não encontrou, verifica diretamente na tabela user_roles
  IF NOT v_is_owner THEN
    SELECT EXISTS (
      SELECT 1 
      FROM user_roles 
      WHERE user_id = v_user_id 
        AND role = 'owner'::app_role
    ) INTO v_is_owner;
  END IF;
  
  -- Se for owner ou system admin, permitir sem verificar limite
  IF v_is_owner THEN
    RETURN NEW;
  END IF;
  
  -- Se não é owner, aplicar limites normais do plano
  
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
  
  -- Contar produtos atuais da empresa
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

-- Comentário atualizado
COMMENT ON FUNCTION public.check_max_products() IS 'Valida limite de produtos antes de inserir em products. Owners não têm limites.';
```

### 2. Verificar se as Funções Auxiliares Existem

A função `check_max_products()` depende de três funções auxiliares. Verifique se elas existem:

#### 2.1. Função `is_super_admin(UUID)`

Esta função deve verificar se o usuário é owner na tabela `user_roles`:

```sql
-- Verificar se existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'is_super_admin';

-- Se não existir, criar:
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = p_user_id
      AND role = 'owner'::app_role
  );
END;
$$;
```

#### 2.2. Função `is_system_admin(UUID)`

Esta função deve verificar se o usuário é o system admin (email específico):

```sql
-- Verificar se existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'is_system_admin';

-- Se não existir, criar:
CREATE OR REPLACE FUNCTION public.is_system_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = p_user_id
      AND email = 'mgc.info.new@gmail.com'
  );
END;
$$;
```

#### 2.3. Função `get_plan_features(TEXT)`

Esta função deve retornar as features do plano, incluindo `max_products`:

```sql
-- Verificar se existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_plan_features';

-- Se não existir, criar (exemplo básico):
CREATE OR REPLACE FUNCTION public.get_plan_features(p_plan_name TEXT)
RETURNS TABLE (
  max_products INTEGER,
  max_suppliers INTEGER,
  max_quotes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE p_plan_name
      WHEN 'basic' THEN 500
      WHEN 'premium' THEN 2000
      WHEN 'enterprise' THEN -1  -- Ilimitado
      ELSE 500
    END as max_products,
    CASE p_plan_name
      WHEN 'basic' THEN 50
      WHEN 'premium' THEN 200
      WHEN 'enterprise' THEN -1  -- Ilimitado
      ELSE 50
    END as max_suppliers,
    CASE p_plan_name
      WHEN 'basic' THEN 100
      WHEN 'premium' THEN 500
      WHEN 'enterprise' THEN -1  -- Ilimitado
      ELSE 100
    END as max_quotes;
END;
$$;
```

### 3. Verificar se o Trigger Está Ativo

Verifique se o trigger `check_max_products_trigger` está ativo na tabela `products`:

```sql
-- Verificar triggers na tabela products
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'products'
  AND trigger_name LIKE '%product%';

-- Se não existir, criar:
CREATE TRIGGER check_max_products_trigger
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.check_max_products();
```

## 📝 Checklist para o Lovable/Equipe de Banco de Dados

Execute estes comandos SQL na seguinte ordem:

- [ ] **1. Verificar/Criar função `is_super_admin(UUID)`**
  - Verifica se usuário é owner na tabela `user_roles`

- [ ] **2. Verificar/Criar função `is_system_admin(UUID)`**
  - Verifica se usuário é o system admin (mgc.info.new@gmail.com)

- [ ] **3. Verificar/Criar função `get_plan_features(TEXT)`**
  - Retorna limites do plano (max_products, etc)

- [ ] **4. Atualizar função `check_max_products()`**
  - Aplicar o SQL completo acima

- [ ] **5. Verificar/Criar trigger `check_max_products_trigger`**
  - Garantir que está ativo na tabela `products`

- [ ] **6. Testar**
  - Tentar adicionar um produto como owner
  - Deve funcionar sem erro de limite

## 🎯 Resultado Esperado

Após aplicar todas as alterações:

✅ **Owners** podem adicionar produtos **ilimitados**  
✅ **Usuários normais** continuam com limites baseados no plano  
✅ **System admin** (mgc.info.new@gmail.com) também tem produtos ilimitados  

## 🔍 Como Verificar se Funcionou

1. Faça login como owner
2. Tente adicionar um produto
3. Não deve aparecer erro "Limite de produtos atingido"
4. O produto deve ser criado com sucesso

## 📞 Se Ainda Não Funcionar

Se após aplicar todas as alterações o problema persistir, verifique:

1. Se o usuário realmente tem role 'owner' na tabela `user_roles`
2. Se o email do usuário é exatamente 'mgc.info.new@gmail.com' (case-sensitive)
3. Se o trigger está realmente ativo executando a função
4. Logs do Supabase para ver qual verificação está falhando

