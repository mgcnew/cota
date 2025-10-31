-- FASE 2: Migrar dados existentes
-- Cria uma empresa para cada usuário atual e vincula como 'owner'

-- 1. Criar empresas para todos os usuários existentes
INSERT INTO companies (name, subscription_status, subscription_plan, max_users)
SELECT 
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    'Empresa de ' || COALESCE(email, id::text)
  ) as name,
  'active' as subscription_status,
  'professional' as subscription_plan,
  10 as max_users
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM company_users);

-- 2. Vincular cada usuário à sua empresa como 'owner'
INSERT INTO company_users (company_id, user_id, role)
SELECT 
  c.id as company_id,
  u.id as user_id,
  'owner' as role
FROM auth.users u
CROSS JOIN LATERAL (
  SELECT id 
  FROM companies 
  WHERE name = COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    'Empresa de ' || COALESCE(u.email, u.id::text)
  )
  LIMIT 1
) c
WHERE u.id NOT IN (SELECT user_id FROM company_users);