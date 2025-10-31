-- FASE 3: Adicionar company_id às tabelas principais
-- Estratégia: NULLABLE → Preencher → NOT NULL (sem quebrar dados)

-- 1. Adicionar coluna company_id (NULLABLE primeiro) em todas as tabelas
ALTER TABLE products ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE suppliers ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE quotes ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE orders ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE activity_log ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- 2. Criar índices para performance
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_suppliers_company ON suppliers(company_id);
CREATE INDEX idx_quotes_company ON quotes(company_id);
CREATE INDEX idx_orders_company ON orders(company_id);
CREATE INDEX idx_activity_log_company ON activity_log(company_id);

-- 3. Preencher company_id com base no user_id atual
-- Produtos
UPDATE products p
SET company_id = cu.company_id
FROM company_users cu
WHERE p.user_id = cu.user_id AND p.company_id IS NULL;

-- Fornecedores
UPDATE suppliers s
SET company_id = cu.company_id
FROM company_users cu
WHERE s.user_id = cu.user_id AND s.company_id IS NULL;

-- Cotações
UPDATE quotes q
SET company_id = cu.company_id
FROM company_users cu
WHERE q.user_id = cu.user_id AND q.company_id IS NULL;

-- Pedidos
UPDATE orders o
SET company_id = cu.company_id
FROM company_users cu
WHERE o.user_id = cu.user_id AND o.company_id IS NULL;

-- Activity Log
UPDATE activity_log a
SET company_id = cu.company_id
FROM company_users cu
WHERE a.user_id = cu.user_id AND a.company_id IS NULL;

-- 4. Tornar company_id obrigatório (NOT NULL)
-- Apenas após preencher TODOS os dados
ALTER TABLE products ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE suppliers ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE quotes ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE orders ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE activity_log ALTER COLUMN company_id SET NOT NULL;