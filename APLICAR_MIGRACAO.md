# 🔧 Aplicar Migração - Corrigir Limite de Produtos para Owners

## ⚠️ IMPORTANTE
Esta migração corrige o problema onde owners não conseguiam adicionar produtos mesmo estando acima do limite.

## 🚀 Como Aplicar

### Opção 1: Via Supabase Dashboard (Mais Rápido) ⭐ RECOMENDADO

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor:**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New Query"

3. **Cole o SQL abaixo e execute:**

```sql
-- Corrigir função check_max_products para permitir owners sem limites
-- Owners devem poder adicionar produtos ilimitados

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
  
  -- Verificar se o usuário é owner (super admin ou system admin)
  -- Primeiro verifica pela função is_super_admin (owners em user_roles)
  SELECT is_super_admin(v_user_id) INTO v_is_owner;
  
  -- Se não for owner, verifica se é system admin (mgc.info.new@gmail.com)
  IF NOT v_is_owner THEN
    SELECT is_system_admin(v_user_id) INTO v_is_owner;
  END IF;
  
  -- Se não encontrou, verifica diretamente na tabela user_roles
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

-- Comentário atualizado
COMMENT ON FUNCTION public.check_max_products() IS 'Valida limite de produtos antes de inserir em products. Owners não têm limites.';
```

4. **Clique em "Run" ou pressione Ctrl+Enter**

5. **Verifique se executou com sucesso:**
   - Você deve ver uma mensagem de sucesso
   - A função será atualizada

### Opção 2: Via Supabase CLI

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Aplicar migrações
cd cotaja
supabase db push
```

## ✅ Verificação

Após aplicar a migração, teste cadastrando um produto como owner. O erro de limite não deve mais aparecer.

## 📝 O que esta migração faz?

1. **Verifica se o usuário é owner** antes de aplicar o limite
2. **Permite owners adicionar produtos ilimitados**
3. **Mantém o limite para usuários normais** (não-owners)

## 🐛 Problema Corrigido

**Antes:** Owners recebiam erro "Limite de produtos atingido (2365/500)" mesmo sendo owners

**Depois:** Owners podem adicionar produtos sem limites, apenas usuários normais têm limites

