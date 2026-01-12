-- Adicionar coluna package_quantity na tabela packaging_items
ALTER TABLE packaging_items 
ADD COLUMN package_quantity DECIMAL(10,2);

COMMENT ON COLUMN packaging_items.package_quantity IS 'Quantidade padrão do pacote (ex: 100 para 100 unidades, ou 5 para 5kg)';