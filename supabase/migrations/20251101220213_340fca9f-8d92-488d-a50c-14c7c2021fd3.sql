-- Adicionar novos campos à tabela products
ALTER TABLE products 
  ADD COLUMN unit text NOT NULL DEFAULT 'un',
  ADD COLUMN barcode text,
  ADD COLUMN image_url text;

-- Criar índice para busca por código de barras
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;

-- Adicionar comentários para documentação
COMMENT ON COLUMN products.unit IS 'Unidade de medida: kg, un, lt, cx, etc';
COMMENT ON COLUMN products.barcode IS 'Código de barras EAN-13, EAN-8, UPC, etc';
COMMENT ON COLUMN products.image_url IS 'URL da foto do produto (Supabase Storage ou externa)';