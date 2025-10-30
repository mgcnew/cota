-- Alterar coluna quantity de integer para numeric(10,2) para permitir valores decimais
ALTER TABLE order_items 
ALTER COLUMN quantity TYPE NUMERIC(10,2);