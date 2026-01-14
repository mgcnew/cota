-- Adicionar campo de economia estimada na tabela de pedidos de embalagens
-- A economia é calculada no momento da conversão da cotação em pedido

ALTER TABLE packaging_orders 
ADD COLUMN IF NOT EXISTS economia_estimada DECIMAL(12,2) DEFAULT 0;

-- Comentário explicativo
COMMENT ON COLUMN packaging_orders.economia_estimada IS 'Economia estimada ao escolher este fornecedor vs o maior preço disponível na cotação';
