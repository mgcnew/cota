# 📊 ANÁLISE DO ESTADO ATUAL DO PROJETO

## ✅ VERIFICAÇÃO DO BANCO DE DADOS SAAS

### **Status: ✅ COMPLETO E FUNCIONAL**

#### 1. Tabela `plan_features` ✅
- ✅ Criada corretamente com todos os campos
- ✅ 3 planos inseridos: `basic`, `professional`, `enterprise`
- ✅ Limites configurados corretamente (-1 = ilimitado para enterprise)
- ✅ RLS configurado para leitura pública

**Localização:** `supabase/migrations/20250120000000_subscription_limits_and_guards.sql`

#### 2. Tabela `companies` ✅
- ✅ Campos adicionados:
  - `subscription_status` (trial, active, suspended, cancelled)
  - `subscription_plan` (basic, professional, enterprise)
  - `subscription_expires_at` (TIMESTAMPTZ)
  - `trial_ends_at` (TIMESTAMPTZ) - adicionado automaticamente

**Localização:** `supabase/migrations/20251031164537_a63f5db2-78a5-4443-94d6-7e4915c3d932.sql`

#### 3. Funções SQL ✅
- ✅ `check_max_users()` - Valida limite antes de inserir usuário
- ✅ `check_max_products()` - Valida limite antes de inserir produto
- ✅ `check_max_suppliers()` - Valida limite antes de inserir fornecedor
- ✅ `is_subscription_active(company_id)` - Verifica se assinatura está ativa
- ✅ `get_plan_features(plan_name)` - Retorna features do plano

**Localização:** `supabase/migrations/20250120000000_subscription_limits_and_guards.sql`

#### 4. Triggers ✅
- ✅ `enforce_max_users` - Antes de INSERT em `company_users`
- ✅ `enforce_max_products` - Antes de INSERT em `products`
- ✅ `enforce_max_suppliers` - Antes de INSERT em `suppliers`

**Localização:** `supabase/migrations/20250120000000_subscription_limits_and_guards.sql`

#### 5. RLS (Row Level Security) ✅
- ✅ `plan_features` - Leitura pública para usuários autenticados
- ✅ Funções usando `SECURITY DEFINER` para funcionar corretamente

---

## 🎯 PAINEL DE GERENCIAMENTO DO SISTEMA ADMIN

### **Status: ⚠️ PARCIALMENTE IMPLEMENTADO**

#### O que EXISTE atualmente:

1. **SuperAdminDashboard Component** ✅
   - **Localização:** `src/components/settings/SuperAdminDashboard.tsx`
   - **Funcionalidade:** Mostra empresas do grupo corporativo do usuário
   - **Limitação:** Só vê empresas do próprio grupo, não todas as empresas do sistema

2. **Hooks relacionados:**
   - ✅ `useUserCompanies()` - Lista empresas do usuário
   - ✅ `useCorporateGroup()` - Gerencia grupos corporativos
   - ✅ `useUserRole()` - Verifica se é owner

#### O que FALTA para o Painel Admin Completo:

### 🔴 **FASE 1: Estrutura no Banco de Dados** (CRÍTICO)

#### 1.1. Criar Enum `system_admin` ou Campo `is_system_admin`
```sql
-- Opção 1: Adicionar campo na tabela auth.users (via Supabase Dashboard)
-- Opção 2: Criar tabela system_admins
-- Opção 3: Usar email específico como identificador
```

**Recomendação:** Criar função que verifica se o email é `mgc.info.new@gmail.com`

#### 1.2. Criar Função `is_system_admin(user_id UUID)`
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

#### 1.3. Criar Função `get_all_companies_for_admin()`
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
  users_count BIGINT,
  products_count BIGINT,
  suppliers_count BIGINT
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
    (SELECT COUNT(*) FROM company_users WHERE company_id = c.id) as users_count,
    (SELECT COUNT(*) FROM products WHERE company_id = c.id) as products_count,
    (SELECT COUNT(*) FROM suppliers WHERE company_id = c.id) as suppliers_count
  FROM companies c
  ORDER BY c.created_at DESC;
$$;
```

#### 1.4. Criar Função `get_system_stats()`
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
  total_suppliers BIGINT
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
    (SELECT COUNT(*) FROM suppliers) as total_suppliers;
$$;
```

#### 1.5. Configurar RLS para Admin
```sql
-- Permitir que system admin veja todas as empresas
CREATE POLICY "System admin can view all companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email = 'mgc.info.new@gmail.com'
    )
  );
```

---

### 🟡 **FASE 2: Hook React para System Admin** (IMPORTANTE)

#### 2.1. Criar Hook `useSystemAdmin.ts`
```typescript
// src/hooks/useSystemAdmin.ts
export function useSystemAdmin() {
  // Verificar se é system admin
  // Buscar todas as empresas usando get_all_companies_for_admin()
  // Buscar estatísticas usando get_system_stats()
}
```

#### 2.2. Criar Hook `useSystemStats.ts`
```typescript
// src/hooks/useSystemStats.ts
export function useSystemStats() {
  // Buscar estatísticas do sistema usando get_system_stats()
}
```

---

### 🟢 **FASE 3: Componente SystemAdminPanel** (UI)

#### 3.1. Criar Componente `SystemAdminPanel.tsx`
**Localização:** `src/components/settings/SystemAdminPanel.tsx`

**Funcionalidades:**
- ✅ Dashboard com estatísticas gerais do sistema
- ✅ Tabela com todas as empresas e seus planos
- ✅ Filtros por status de assinatura
- ✅ Filtros por plano
- ✅ Botões para editar empresa (mudar plano, status)
- ✅ Gráficos de crescimento
- ✅ Exportar dados

**Componentes necessários:**
- Cards de métricas (total empresas, ativas, trial, etc.)
- Tabela com paginação
- Filtros e busca
- Modal para editar empresa
- Gráficos (usando recharts)

---

### 🔵 **FASE 4: Integração na Página de Configurações** (INTEGRAÇÃO)

#### 4.1. Adicionar Seção "System Admin" em Configurações
- ✅ Já existe a aba "Super Admin" mas precisa ser melhorada
- ⚠️ Atualmente só mostra empresas do grupo corporativo
- 🔴 Precisa mostrar TODAS as empresas do sistema

**Mudanças necessárias:**
1. Modificar `SuperAdminDashboard.tsx` para usar `useSystemAdmin()`
2. Adicionar verificação de `is_system_admin`
3. Mostrar estatísticas globais se for system admin
4. Mostrar tabela com todas as empresas

---

## 📋 RESUMO DO STATUS

### ✅ **COMPLETO:**
- ✅ Estrutura de banco de dados SaaS
- ✅ Tabela `plan_features` com 3 planos
- ✅ Funções de validação de limites
- ✅ Triggers de validação
- ✅ Componente SuperAdminDashboard (parcial)
- ✅ Hooks básicos de empresas

### ⚠️ **PARCIALMENTE IMPLEMENTADO:**
- ⚠️ Painel de gerenciamento (só mostra grupo corporativo, não sistema inteiro)
- ⚠️ Verificação de system admin (não existe ainda)

### 🔴 **FALTANDO:**
- 🔴 Função `is_system_admin()` no banco
- 🔴 Função `get_all_companies_for_admin()` no banco
- 🔴 Função `get_system_stats()` no banco
- 🔴 RLS policies para system admin
- 🔴 Hook `useSystemAdmin()` no frontend
- 🔴 Hook `useSystemStats()` no frontend
- 🔴 Componente `SystemAdminPanel` completo
- 🔴 Integração completa em Configurações

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

### **PRIORIDADE 1: Criar Estrutura no Banco** (30 min)
1. Criar função `is_system_admin()`
2. Criar função `get_all_companies_for_admin()`
3. Criar função `get_system_stats()`
4. Configurar RLS policies

### **PRIORIDADE 2: Criar Hooks React** (20 min)
1. Criar `useSystemAdmin.ts`
2. Criar `useSystemStats.ts`

### **PRIORIDADE 3: Criar Componente Admin** (1-2h)
1. Criar `SystemAdminPanel.tsx`
2. Adicionar métricas, tabela, filtros
3. Integrar em Configurações

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### Banco de Dados:
- [ ] Função `is_system_admin(user_id UUID)`
- [ ] Função `get_all_companies_for_admin()`
- [ ] Função `get_system_stats()`
- [ ] RLS policy para system admin ver todas empresas

### Frontend:
- [ ] Hook `useSystemAdmin()`
- [ ] Hook `useSystemStats()`
- [ ] Componente `SystemAdminPanel.tsx`
- [ ] Integração em `Configuracoes.tsx`
- [ ] Verificação de permissão antes de mostrar

### Testes:
- [ ] Verificar se apenas `mgc.info.new@gmail.com` vê o painel
- [ ] Testar listagem de todas empresas
- [ ] Testar estatísticas do sistema
- [ ] Testar filtros e busca

---

## 💡 RECOMENDAÇÃO IMEDIATA

**Começar pela FASE 1 (Banco de Dados)** porque:
- ✅ É a base de tudo
- ✅ Leva ~30 minutos
- ✅ Permite testar as funções diretamente no Supabase
- ✅ Depois é só integrar no frontend

**Depois seguir para FASE 2 e 3** para completar o painel.

---

## 📚 ARQUIVOS DE REFERÊNCIA

- **Migração de limites:** `supabase/migrations/20250120000000_subscription_limits_and_guards.sql`
- **SuperAdmin atual:** `src/components/settings/SuperAdminDashboard.tsx`
- **Configurações:** `src/pages/Configuracoes.tsx`
- **Hook empresas:** `src/hooks/useUserCompanies.ts`

---

**Quer que eu crie a migração SQL agora para começar a implementação?**


