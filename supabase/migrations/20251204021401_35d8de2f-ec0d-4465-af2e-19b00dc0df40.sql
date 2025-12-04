-- Adicionar colunas de metadados de unidade de preço na tabela quote_supplier_items
ALTER TABLE public.quote_supplier_items
ADD COLUMN IF NOT EXISTS unidade_preco VARCHAR(10) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fator_conversao DECIMAL(10, 4) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS quantidade_por_embalagem DECIMAL(10, 4) DEFAULT NULL;

-- Criar índice para buscas por unidade de preço
CREATE INDEX IF NOT EXISTS idx_quote_supplier_items_unidade_preco 
ON public.quote_supplier_items(unidade_preco);

-- Definir valores padrão para registros existentes baseados no produto
UPDATE public.quote_supplier_items qsi
SET unidade_preco = COALESCE(p.unit, 'un')
FROM public.products p
WHERE qsi.product_id = p.id
AND qsi.unidade_preco IS NULL;

-- Definir fator de conversão padrão como 1 para registros existentes
UPDATE public.quote_supplier_items
SET fator_conversao = 1
WHERE fator_conversao IS NULL;