-- ============================================
-- QUERIES PARA VERIFICAR MIGRAÇÃO NO SUPABASE
-- ============================================
-- Execute estas queries no SQL Editor do Supabase após aplicar migrations

-- ============================================
-- 1. VERIFICAR TABELAS CRIADAS
-- ============================================
SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_name = t.table_name 
   AND table_schema = 'public') as colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- 2. VERIFICAR FUNÇÕES CRIADAS
-- ============================================
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ============================================
-- 3. VERIFICAR TRIGGERS CRIADOS
-- ============================================
SELECT 
  trigger_name,
  event_object_table as tabela,
  event_manipulation as evento,
  action_timing as timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 4. VERIFICAR POLÍTICAS RLS
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as comando
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 5. VERIFICAR ÍNDICES
-- ============================================
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- 6. VERIFICAR FUNÇÕES DE ADMIN
-- ============================================
-- Verificar se is_system_admin existe
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'is_system_admin',
    'get_all_companies_for_admin',
    'get_system_stats',
    'update_company_plan',
    'update_company_subscription_status',
    'is_current_user_system_admin'
  )
ORDER BY routine_name;

-- ============================================
-- 7. VERIFICAR FUNÇÕES DE LIMITES SAAS
-- ============================================
SELECT 
  routine_name
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

-- ============================================
-- 8. VERIFICAR TABELA plan_features
-- ============================================
SELECT * FROM plan_features 
ORDER BY plan_name;

-- Deve retornar 3 planos: basic, professional, enterprise

-- ============================================
-- 9. VERIFICAR ESTRUTURA DA TABELA companies
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'companies'
ORDER BY ordinal_position;

-- Deve ter: subscription_status, subscription_plan, trial_ends_at, etc.

-- ============================================
-- 10. TESTAR FUNÇÕES (se houver dados)
-- ============================================
-- Testar get_plan_features
SELECT * FROM get_plan_features('basic');
SELECT * FROM get_plan_features('professional');
SELECT * FROM get_plan_features('enterprise');

-- Testar is_system_admin (substitua pelo seu user_id)
-- SELECT is_system_admin('seu-user-id-aqui');

-- ============================================
-- 11. VERIFICAR CONTADORES DE DADOS
-- ============================================
SELECT 
  'products' as tabela, 
  COUNT(*) as total,
  COUNT(DISTINCT company_id) as empresas_com_dados
FROM products
UNION ALL
SELECT 'suppliers', COUNT(*), COUNT(DISTINCT company_id) FROM suppliers
UNION ALL
SELECT 'quotes', COUNT(*), COUNT(DISTINCT company_id) FROM quotes
UNION ALL
SELECT 'orders', COUNT(*), COUNT(DISTINCT company_id) FROM orders
UNION ALL
SELECT 'companies', COUNT(*), NULL FROM companies
UNION ALL
SELECT 'company_users', COUNT(*), COUNT(DISTINCT company_id) FROM company_users
ORDER BY tabela;

-- ============================================
-- CHECKLIST DE VALIDAÇÃO
-- ============================================
-- Use estas queries para verificar se tudo foi migrado corretamente:
--
-- ✅ Tabelas principais existem (products, suppliers, quotes, orders, companies)
-- ✅ Funções SQL criadas (check_max_*, is_subscription_active, get_plan_features)
-- ✅ Funções de admin criadas (is_system_admin, get_all_companies_for_admin)
-- ✅ Triggers criados (enforce_max_*, update_*_updated_at)
-- ✅ Políticas RLS ativas
-- ✅ Índices criados
-- ✅ Tabela plan_features tem 3 planos
-- ✅ Tabela companies tem campos de assinatura


