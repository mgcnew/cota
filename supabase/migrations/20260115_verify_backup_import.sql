-- =====================================================
-- Script de Verificação de Importação de Backup
-- Execute este script para verificar se os dados foram importados
-- =====================================================

-- 1. Verificar contagem de registros por tabela
SELECT 
  'suppliers' as table_name, 
  COUNT(*) as total_records,
  COUNT(DISTINCT company_id) as companies
FROM suppliers
UNION ALL
SELECT 'products', COUNT(*), COUNT(DISTINCT company_id) FROM products
UNION ALL
SELECT 'quotes', COUNT(*), COUNT(DISTINCT company_id) FROM quotes
UNION ALL
SELECT 'quote_items', COUNT(*), NULL FROM quote_items
UNION ALL
SELECT 'quote_suppliers', COUNT(*), NULL FROM quote_suppliers
UNION ALL
SELECT 'orders', COUNT(*), COUNT(DISTINCT company_id) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*), NULL FROM order_items
UNION ALL
SELECT 'packaging_items', COUNT(*), COUNT(DISTINCT company_id) FROM packaging_items
UNION ALL
SELECT 'packaging_quotes', COUNT(*), COUNT(DISTINCT company_id) FROM packaging_quotes
UNION ALL
SELECT 'packaging_orders', COUNT(*), COUNT(DISTINCT company_id) FROM packaging_orders
ORDER BY table_name;

-- 2. Verificar distribuição por company_id
SELECT 
  company_id,
  (SELECT name FROM companies WHERE id = company_id) as company_name,
  COUNT(*) as supplier_count
FROM suppliers
GROUP BY company_id
ORDER BY supplier_count DESC;

-- 3. Verificar se há dados órfãos (sem company_id)
SELECT 'suppliers' as table_name, COUNT(*) as orphaned_records
FROM suppliers
WHERE company_id IS NULL
UNION ALL
SELECT 'products', COUNT(*) FROM products WHERE company_id IS NULL
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes WHERE company_id IS NULL
UNION ALL
SELECT 'orders', COUNT(*) FROM orders WHERE company_id IS NULL
UNION ALL
SELECT 'packaging_items', COUNT(*) FROM packaging_items WHERE company_id IS NULL
UNION ALL
SELECT 'packaging_quotes', COUNT(*) FROM packaging_quotes WHERE company_id IS NULL
UNION ALL
SELECT 'packaging_orders', COUNT(*) FROM packaging_orders WHERE company_id IS NULL;

-- 4. Verificar integridade de foreign keys
SELECT 
  'quote_items sem quote' as issue,
  COUNT(*) as count
FROM quote_items qi
WHERE NOT EXISTS (SELECT 1 FROM quotes q WHERE q.id = qi.quote_id)
UNION ALL
SELECT 'quote_items sem product', COUNT(*)
FROM quote_items qi
WHERE qi.product_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.id = qi.product_id)
UNION ALL
SELECT 'order_items sem order', COUNT(*)
FROM order_items oi
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.id = oi.order_id)
UNION ALL
SELECT 'order_items sem product', COUNT(*)
FROM order_items oi
WHERE oi.product_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.id = oi.product_id);

-- 5. Amostra de dados importados
SELECT 'Suppliers' as data_type, COUNT(*) as count, MAX(created_at) as last_import
FROM suppliers
UNION ALL
SELECT 'Products', COUNT(*), MAX(created_at) FROM products
UNION ALL
SELECT 'Quotes', COUNT(*), MAX(created_at) FROM quotes
UNION ALL
SELECT 'Orders', COUNT(*), MAX(created_at) FROM orders;

-- 6. Verificar se o usuário consegue acessar os dados (teste RLS)
-- Execute como usuário autenticado para verificar se RLS está funcionando
SELECT COUNT(*) as accessible_suppliers FROM suppliers;
SELECT COUNT(*) as accessible_products FROM products;
SELECT COUNT(*) as accessible_quotes FROM quotes;
