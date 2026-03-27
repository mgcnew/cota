-- 1. Gerar tokens de acesso para fornecedores em cotações
ALTER TABLE quote_suppliers ADD COLUMN access_token UUID DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_quote_suppliers_token ON quote_suppliers(access_token);

-- 2. Diferenciar se o preço foi preenchido pelo comprador ou pelo fornecedor
ALTER TABLE quote_supplier_items ADD COLUMN updated_by_type TEXT DEFAULT 'comprador' CHECK (updated_by_type IN ('comprador', 'fornecedor'));
