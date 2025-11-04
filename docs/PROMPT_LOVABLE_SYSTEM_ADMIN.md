# 🎯 PROMPT PARA LOVABLE CRIAR SISTEMA ADMIN

## 📋 INSTRUÇÕES PARA COPIAR E COLAR NO LOVABLE

---

## PROMPT COMPLETO:

```
Preciso que você crie funções SQL e políticas RLS para permitir que o dono do sistema (email: mgc.info.new@gmail.com) tenha acesso a um painel de gerenciamento completo de todas as empresas do sistema.

Siga exatamente estas instruções:

## 1. CRIAR FUNÇÃO is_system_admin()

Primeiro, remover função existente se houver (pode ter parâmetros diferentes):
**IMPORTANTE**: PostgreSQL trata funções com nomes de parâmetros diferentes como funções diferentes. 
Remova TODAS as variações possíveis:

```sql
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
```

Depois, criar uma função PostgreSQL que verifica se um usuário é o system admin:

```sql
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
```

## 2. CRIAR FUNÇÃO get_all_companies_for_admin()

**IMPORTANTE**: Remover função existente se houver (pode ter assinatura diferente):

```sql
DROP FUNCTION IF EXISTS get_all_companies_for_admin();
DROP FUNCTION IF EXISTS public.get_all_companies_for_admin();
```

Depois, criar uma função que retorna TODAS as empresas do sistema com contadores de recursos:

```sql
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
```

## 3. CRIAR FUNÇÃO get_system_stats()

**IMPORTANTE**: Remover função existente se houver (pode ter assinatura diferente):

```sql
DROP FUNCTION IF EXISTS get_system_stats();
DROP FUNCTION IF EXISTS public.get_system_stats();
```

Depois, criar uma função que retorna estatísticas gerais do sistema:

```sql
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
    (SELECT COUNT(*) FROM cotacoes) as total_quotes,
    (SELECT COUNT(*) FROM pedidos) as total_orders;
$$;
```

## 4. CRIAR POLÍTICAS RLS

### 4.1. Política para system admin ver todas empresas

```sql
DROP POLICY IF EXISTS "System admin can view all companies" ON companies;

CREATE POLICY "System admin can view all companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    is_system_admin(auth.uid())
  );
```

### 4.2. Política para system admin atualizar empresas

```sql
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
```

## 5. CRIAR FUNÇÃO HELPER

**IMPORTANTE**: Remover função existente se houver:

```sql
DROP FUNCTION IF EXISTS is_current_user_system_admin();
DROP FUNCTION IF EXISTS public.is_current_user_system_admin();
```

Depois, criar função para verificar se usuário atual é system admin:

```sql
CREATE OR REPLACE FUNCTION is_current_user_system_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_system_admin(auth.uid());
$$;
```

## 6. CRIAR FUNÇÕES DE ATUALIZAÇÃO (OPCIONAL MAS RECOMENDADO)

### 6.1. Função para atualizar plano de empresa

**IMPORTANTE**: Remover função existente se houver (pode ter parâmetros diferentes):

```sql
DROP FUNCTION IF EXISTS update_company_plan(UUID, TEXT);
DROP FUNCTION IF EXISTS update_company_plan(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_company_plan(UUID, TEXT);
DROP FUNCTION IF EXISTS public.update_company_plan(UUID, TEXT, TEXT);
```

Depois, criar a função:

```sql
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
```

### 6.2. Função para atualizar status de assinatura

**IMPORTANTE**: Remover função existente se houver (pode ter parâmetros diferentes):

```sql
DROP FUNCTION IF EXISTS update_company_subscription_status(UUID, TEXT);
DROP FUNCTION IF EXISTS update_company_subscription_status(UUID, TEXT, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.update_company_subscription_status(UUID, TEXT);
DROP FUNCTION IF EXISTS public.update_company_subscription_status(UUID, TEXT, TIMESTAMPTZ);
```

Depois, criar a função:

```sql
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
```

## IMPORTANTE:

1. **Todas as funções devem usar `SECURITY DEFINER`** para funcionar corretamente com RLS
2. **Use `SET search_path = public`** para evitar problemas de segurança
3. **Use `DROP POLICY IF EXISTS`** antes de criar políticas para evitar erros
4. **O email do system admin é:** `mgc.info.new@gmail.com` (exatamente assim)
5. **Todas as funções devem ser STABLE** (exceto as de atualização que são VOLATILE por padrão)

## VERIFICAÇÃO APÓS CRIAR:

Execute estas queries para verificar:

```sql
-- Verificar se função existe
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('is_system_admin', 'get_all_companies_for_admin', 'get_system_stats');

-- Testar função (substitua UUID pelo seu user_id)
SELECT is_system_admin('seu-user-id-aqui');

-- Ver políticas RLS criadas
SELECT * FROM pg_policies WHERE tablename = 'companies' AND policyname LIKE '%admin%';
```

Por favor, execute tudo isso e me confirme quando terminar. Se houver algum erro, me informe qual função/política deu problema.
```

---

## 🎯 VERSÃO RESUMIDA (SE O LOVABLE TIVER LIMITE DE CARACTERES):

```
Criar sistema admin para gerenciar todas empresas:

1. FUNÇÃO is_system_admin(user_id) - Verifica se email = 'mgc.info.new@gmail.com'
2. FUNÇÃO get_all_companies_for_admin() - Retorna todas empresas com contadores
3. FUNÇÃO get_system_stats() - Retorna estatísticas do sistema
4. RLS POLICY - System admin pode ver todas empresas
5. RLS POLICY - System admin pode atualizar empresas
6. FUNÇÃO update_company_plan() - Atualizar plano de empresa
7. FUNÇÃO update_company_subscription_status() - Atualizar status

Todas funções devem usar SECURITY DEFINER e SET search_path = public.
```

---

## ✅ CHECKLIST APÓS LOVABLE EXECUTAR:

- [ ] Função `is_system_admin()` criada
- [ ] Função `get_all_companies_for_admin()` criada
- [ ] Função `get_system_stats()` criada
- [ ] Política RLS "System admin can view all companies" criada
- [ ] Política RLS "System admin can update all companies" criada
- [ ] Função `is_current_user_system_admin()` criada
- [ ] Função `update_company_plan()` criada (opcional)
- [ ] Função `update_company_subscription_status()` criada (opcional)

---

## 🔍 QUERIES DE VERIFICAÇÃO:

```sql
-- 1. Verificar funções criadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'is_system_admin',
  'get_all_companies_for_admin',
  'get_system_stats',
  'is_current_user_system_admin',
  'update_company_plan',
  'update_company_subscription_status'
);

-- 2. Testar função is_system_admin (substitua pelo seu user_id)
SELECT is_system_admin(auth.uid());

-- 3. Testar get_all_companies_for_admin
SELECT * FROM get_all_companies_for_admin();

-- 4. Testar get_system_stats
SELECT * FROM get_system_stats();

-- 5. Ver políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'companies' 
AND policyname LIKE '%admin%';
```

---

## 💡 DICAS:

1. **Se o Lovable perguntar sobre RLS:**
   - Diga que as políticas devem permitir acesso TOTAL para system admin
   - As políticas existentes para usuários normais devem continuar funcionando

2. **Se der erro em alguma função:**
   - Verifique se está usando `SECURITY DEFINER`
   - Verifique se está usando `SET search_path = public`
   - Verifique se o email está exatamente como `mgc.info.new@gmail.com`

3. **Se perguntar sobre segurança:**
   - Diga que apenas o email específico terá acesso
   - As funções verificam permissão antes de executar
   - RLS ainda protege contra acesso não autorizado

---

**Copie o prompt completo acima e cole no chat do Lovable!**

