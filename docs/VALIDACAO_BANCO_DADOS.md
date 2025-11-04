# 🔍 QUERIES DE VALIDAÇÃO DO BANCO DE DADOS SAAS

## ✅ EXECUTE ESTAS QUERIES NO SQL EDITOR DO SUPABASE PARA VERIFICAR

---

## 1. VERIFICAR TABELA plan_features

```sql
-- Verificar se a tabela existe e tem os campos corretos
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'plan_features'
ORDER BY ordinal_position;
```

**Resultado esperado:**
- `plan_name` (TEXT, NOT NULL, PRIMARY KEY)
- `max_users` (INTEGER, nullable, DEFAULT 5)
- `max_products` (INTEGER, nullable, DEFAULT 100)
- `max_suppliers` (INTEGER, nullable, DEFAULT 50)
- `max_quotes_per_month` (INTEGER, nullable, DEFAULT 100)
- `api_access` (BOOLEAN, nullable, DEFAULT FALSE)
- `advanced_analytics` (BOOLEAN, nullable, DEFAULT FALSE)
- `priority_support` (BOOLEAN, nullable, DEFAULT FALSE)
- `created_at` (TIMESTAMPTZ, nullable)

---

## 2. VERIFICAR SE OS PLANOS FORAM INSERIDOS

```sql
-- Ver todos os planos cadastrados
SELECT * FROM plan_features ORDER BY plan_name;
```

**Resultado esperado:**
- `basic`: max_users=5, max_products=100, max_suppliers=50, max_quotes_per_month=100, todos booleanos FALSE
- `professional`: max_users=15, max_products=500, max_suppliers=200, max_quotes_per_month=1000, api_access=TRUE, advanced_analytics=TRUE, priority_support=FALSE
- `enterprise`: max_users=100, max_products=-1, max_suppliers=-1, max_quotes_per_month=-1, todos booleanos TRUE

---

## 3. VERIFICAR CAMPOS NA TABELA companies

```sql
-- Verificar se os campos foram adicionados
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'companies' 
AND column_name IN ('trial_ends_at', 'subscription_expires_at', 'subscription_status', 'subscription_plan')
ORDER BY column_name;
```

**Resultado esperado:**
- `subscription_expires_at` (TIMESTAMPTZ, nullable)
- `subscription_plan` (TEXT, nullable, pode ter DEFAULT 'basic')
- `subscription_status` (TEXT, nullable, pode ter DEFAULT 'trial')
- `trial_ends_at` (TIMESTAMPTZ, nullable)

---

## 4. VERIFICAR FUNÇÕES SQL CRIADAS

```sql
-- Verificar se todas as funções foram criadas
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'check_max_users',
  'check_max_products', 
  'check_max_suppliers',
  'is_subscription_active',
  'get_plan_features'
)
ORDER BY routine_name;
```

**Resultado esperado:**
- `check_max_users` (FUNCTION, retorna TRIGGER)
- `check_max_products` (FUNCTION, retorna TRIGGER)
- `check_max_suppliers` (FUNCTION, retorna TRIGGER)
- `is_subscription_active` (FUNCTION, retorna BOOLEAN)
- `get_plan_features` (FUNCTION, retorna TABLE)

---

## 5. VERIFICAR TRIGGERS CRIADOS

```sql
-- Verificar se todos os triggers foram criados
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name IN (
  'enforce_max_users',
  'enforce_max_products',
  'enforce_max_suppliers'
)
ORDER BY trigger_name;
```

**Resultado esperado:**
- `enforce_max_users` em `company_users`, evento INSERT, timing BEFORE
- `enforce_max_products` em `products`, evento INSERT, timing BEFORE
- `enforce_max_suppliers` em `suppliers`, evento INSERT, timing BEFORE

---

## 6. TESTAR FUNÇÃO is_subscription_active

```sql
-- Testar a função com uma empresa (substitua o UUID)
SELECT 
  id,
  name,
  subscription_status,
  subscription_plan,
  is_subscription_active(id) as is_active
FROM companies
LIMIT 5;
```

**Resultado esperado:**
- Retorna TRUE ou FALSE para cada empresa
- Se subscription_status for 'trial' e expirado, deve retornar FALSE
- Se subscription_status for 'active', deve retornar TRUE (se não expirado)

---

## 7. TESTAR FUNÇÃO get_plan_features

```sql
-- Testar retornar features de cada plano
SELECT * FROM get_plan_features('basic');
SELECT * FROM get_plan_features('professional');
SELECT * FROM get_plan_features('enterprise');
SELECT * FROM get_plan_features('plano_inexistente'); -- Deve retornar valores padrão
```

**Resultado esperado:**
- `basic`: max_users=5, max_products=100, max_suppliers=50, max_quotes_per_month=100
- `professional`: max_users=15, max_products=500, max_suppliers=200, max_quotes_per_month=1000
- `enterprise`: max_users=100, max_products=-1, max_suppliers=-1, max_quotes_per_month=-1
- Plano inexistente: valores padrão (5, 100, 50, 100)

---

## 8. TESTAR TRIGGER enforce_max_users (OPCIONAL - CUIDADO!)

```sql
-- ⚠️ ATENÇÃO: Este teste vai FALHAR se você já tiver 5 usuários
-- Substitua com IDs reais da sua empresa

-- Primeiro, veja quantos usuários você tem:
SELECT 
  c.id,
  c.name,
  COUNT(cu.user_id) as total_usuarios
FROM companies c
LEFT JOIN company_users cu ON cu.company_id = c.id
GROUP BY c.id, c.name;

-- Se uma empresa tiver menos de 5 usuários, você pode testar tentando adicionar um 6º
-- (mas isso vai depender do seu caso específico)
```

---

## 9. VERIFICAR RLS (Row Level Security)

```sql
-- Verificar políticas RLS na tabela plan_features
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'plan_features';
```

**Resultado esperado:**
- Deve ter pelo menos uma política que permite SELECT para usuários autenticados
- Ou a tabela pode não ter RLS (pode ser pública para leitura)

---

## 10. VERIFICAR ESTRUTURA COMPLETA (RESUMO)

```sql
-- Query completa para ver tudo de uma vez
SELECT 
  'plan_features' as tabela,
  COUNT(*) as total_planos
FROM plan_features
UNION ALL
SELECT 
  'companies com plano' as tabela,
  COUNT(*) as total
FROM companies 
WHERE subscription_plan IS NOT NULL
UNION ALL
SELECT 
  'funções criadas' as tabela,
  COUNT(*) as total
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('check_max_users', 'check_max_products', 'check_max_suppliers', 'is_subscription_active', 'get_plan_features')
UNION ALL
SELECT 
  'triggers criados' as tabela,
  COUNT(*) as total
FROM information_schema.triggers 
WHERE trigger_name IN ('enforce_max_users', 'enforce_max_products', 'enforce_max_suppliers');
```

---

## 🐛 PROBLEMAS COMUNS E SOLUÇÕES

### ❌ Erro: "relation plan_features does not exist"
**Solução:** A tabela não foi criada. Execute novamente o CREATE TABLE.

### ❌ Erro: "function check_max_users() does not exist"
**Solução:** A função não foi criada. Execute novamente o CREATE FUNCTION.

### ❌ Erro: "trigger enforce_max_users does not exist"
**Solução:** O trigger não foi criado. Execute novamente o CREATE TRIGGER.

### ❌ Erro: "column trial_ends_at does not exist"
**Solução:** O campo não foi adicionado. Execute:
```sql
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
```

### ❌ Erro ao executar função: "permission denied"
**Solução:** Verifique se as funções têm SECURITY DEFINER.

---

## ✅ CHECKLIST FINAL

Execute todas as queries acima e verifique:

- [ ] Tabela `plan_features` existe e tem 9 colunas
- [ ] 3 planos foram inseridos (basic, professional, enterprise)
- [ ] Campos adicionados em `companies` (trial_ends_at, subscription_status, subscription_plan)
- [ ] 5 funções foram criadas
- [ ] 3 triggers foram criados
- [ ] Função `is_subscription_active()` funciona
- [ ] Função `get_plan_features()` funciona
- [ ] RLS configurado corretamente (ou desabilitado se apropriado)

---

## 📝 PRÓXIMO PASSO

Após verificar tudo:
1. ✅ Se tudo estiver correto → Continuar com Landing Page
2. ❌ Se houver erros → Me informe qual query falhou e qual erro apareceu

