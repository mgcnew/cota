-- ============================================
-- QUERIES PARA EXPORTAR DADOS DO LOVABLE
-- ============================================
-- Execute estas queries no SQL Editor do Lovable Cloud
-- Copie os resultados para importar no Supabase depois

-- ============================================
-- 1. EXPORTAR PRODUTOS
-- ============================================
SELECT * FROM products 
ORDER BY created_at;

-- OU exportar em CSV format:
-- COPY (SELECT * FROM products) TO STDOUT WITH CSV HEADER;

-- ============================================
-- 2. EXPORTAR FORNECEDORES
-- ============================================
SELECT * FROM suppliers 
ORDER BY created_at;

-- ============================================
-- 3. EXPORTAR COTAÇÕES
-- ============================================
SELECT * FROM quotes 
ORDER BY created_at;

-- ============================================
-- 4. EXPORTAR ITENS DE COTAÇÃO
-- ============================================
SELECT * FROM quote_items 
ORDER BY created_at;

-- ============================================
-- 5. EXPORTAR FORNECEDORES PARTICIPANTES
-- ============================================
SELECT * FROM quote_suppliers 
ORDER BY created_at;

-- ============================================
-- 6. EXPORTAR PEDIDOS
-- ============================================
SELECT * FROM orders 
ORDER BY created_at;

-- ============================================
-- 7. EXPORTAR ITENS DE PEDIDOS
-- ============================================
SELECT * FROM order_items 
ORDER BY created_at;

-- ============================================
-- 8. EXPORTAR EMPRESAS
-- ============================================
SELECT * FROM companies 
ORDER BY created_at;

-- ============================================
-- 9. EXPORTAR RELAÇÃO USUÁRIO-EMPRESA
-- ============================================
SELECT * FROM company_users 
ORDER BY created_at;

-- ============================================
-- 10. EXPORTAR CONVITES
-- ============================================
SELECT * FROM company_invitations 
ORDER BY created_at;

-- ============================================
-- 11. EXPORTAR ROLES
-- ============================================
SELECT * FROM user_roles 
ORDER BY created_at;

-- ============================================
-- 12. EXPORTAR GRUPOS CORPORATIVOS
-- ============================================
SELECT * FROM corporate_groups 
ORDER BY created_at;

-- ============================================
-- 13. EXPORTAR LOG DE ATIVIDADES (OPCIONAL)
-- ============================================
SELECT * FROM activity_log 
ORDER BY created_at DESC 
LIMIT 1000; -- Limite para não exportar tudo de uma vez

-- ============================================
-- 14. CONTAR REGISTROS (VERIFICAÇÃO)
-- ============================================
SELECT 
  'products' as tabela, COUNT(*) as total FROM products
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes
UNION ALL
SELECT 'quote_items', COUNT(*) FROM quote_items
UNION ALL
SELECT 'quote_suppliers', COUNT(*) FROM quote_suppliers
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'companies', COUNT(*) FROM companies
UNION ALL
SELECT 'company_users', COUNT(*) FROM company_users
UNION ALL
SELECT 'company_invitations', COUNT(*) FROM company_invitations
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL
SELECT 'corporate_groups', COUNT(*) FROM corporate_groups
ORDER BY tabela;

-- ============================================
-- INSTRUÇÕES:
-- ============================================
-- 1. Execute cada query no SQL Editor do Lovable
-- 2. Copie os resultados (CSV ou JSON)
-- 3. Salve em arquivos separados (ex: products.csv, suppliers.csv)
-- 4. Use esses arquivos para importar no Supabase depois
--
-- OU
--
-- 1. Use COPY para exportar diretamente em CSV:
--    COPY products TO '/tmp/products.csv' WITH CSV HEADER;
--
-- OU
--
-- 1. Use pg_dump para exportar tudo de uma vez:
--    pg_dump -h [host] -U [user] -d [database] > backup.sql


