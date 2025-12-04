-- Add pricing unit metadata columns to quote_supplier_items table
ALTER TABLE public.quote_supplier_items
ADD COLUMN unidade_preco VARCHAR(10) DEFAULT NULL,
ADD COLUMN fator_conversao DECIMAL(10, 4) DEFAULT NULL,
ADD COLUMN quantidade_por_embalagem DECIMAL(10, 4) DEFAULT NULL;

-- Create index for pricing unit lookups
CREATE INDEX idx_quote_supplier_items_unidade_preco 
ON public.quote_supplier_items(unidade_preco);
