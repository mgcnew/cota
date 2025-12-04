-- Set default pricing unit based on product's base unit
UPDATE public.quote_supplier_items qsi
SET unidade_preco = COALESCE(p.unit, 'un')
FROM public.products p
WHERE qsi.product_id = p.id
AND qsi.unidade_preco IS NULL;

-- Set default conversion factor to 1 for existing records
UPDATE public.quote_supplier_items
SET fator_conversao = 1
WHERE fator_conversao IS NULL;
