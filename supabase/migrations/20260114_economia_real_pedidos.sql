-- =====================================================
-- MIGRAÇÃO: Economia Real em Pedidos
-- Data: 2026-01-14
-- Descrição: Adiciona campos para calcular economia real
--            baseada na quantidade entregue (nota fiscal)
-- =====================================================

-- 1. Adicionar campos na tabela orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) NULL,
ADD COLUMN IF NOT EXISTS economia_estimada DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS economia_real DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS diferenca_preco_kg DECIMAL(12,4) DEFAULT 0;

-- Comentários explicativos
COMMENT ON COLUMN orders.quote_id IS 'ID da cotação de origem. NULL = pedido direto, preenchido = veio de cotação';
COMMENT ON COLUMN orders.economia_estimada IS 'Economia estimada calculada na conversão (antes da entrega)';
COMMENT ON COLUMN orders.economia_real IS 'Economia real calculada após entrega com quantidade real';
COMMENT ON COLUMN orders.diferenca_preco_kg IS 'Diferença de preço por kg/un entre maior cotação e escolhida';

-- 2. Adicionar campos na tabela order_items
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS quantidade_pedida DECIMAL(12,3) NULL,
ADD COLUMN IF NOT EXISTS unidade_pedida VARCHAR(20) NULL,
ADD COLUMN IF NOT EXISTS quantidade_entregue DECIMAL(12,3) NULL,
ADD COLUMN IF NOT EXISTS unidade_entregue VARCHAR(20) NULL,
ADD COLUMN IF NOT EXISTS valor_unitario_cotado DECIMAL(12,4) NULL,
ADD COLUMN IF NOT EXISTS maior_valor_cotado DECIMAL(12,4) NULL;

-- Comentários explicativos
COMMENT ON COLUMN order_items.quantidade_pedida IS 'Quantidade pedida (ex: 10 caixas)';
COMMENT ON COLUMN order_items.unidade_pedida IS 'Unidade do pedido (ex: cx, un)';
COMMENT ON COLUMN order_items.quantidade_entregue IS 'Quantidade real entregue (ex: 152.5 kg) - preenchido na entrega';
COMMENT ON COLUMN order_items.unidade_entregue IS 'Unidade da entrega (ex: kg)';
COMMENT ON COLUMN order_items.valor_unitario_cotado IS 'Valor por unidade cotado (ex: R$ 25/kg)';
COMMENT ON COLUMN order_items.maior_valor_cotado IS 'Maior valor cotado entre fornecedores (para cálculo de economia)';

-- 3. Criar índice para busca por quote_id
CREATE INDEX IF NOT EXISTS idx_orders_quote_id ON orders(quote_id);

-- 4. Criar função para calcular economia real automaticamente
CREATE OR REPLACE FUNCTION calcular_economia_real()
RETURNS TRIGGER AS $$
DECLARE
    v_economia_real DECIMAL(12,2) := 0;
    v_item RECORD;
BEGIN
    -- Só calcula se o pedido veio de cotação e status é 'entregue'
    IF NEW.quote_id IS NOT NULL AND NEW.status = 'entregue' THEN
        -- Soma a economia de cada item
        FOR v_item IN 
            SELECT 
                quantidade_entregue,
                valor_unitario_cotado,
                maior_valor_cotado
            FROM order_items 
            WHERE order_id = NEW.id 
            AND quantidade_entregue IS NOT NULL
            AND quantidade_entregue > 0
            AND maior_valor_cotado IS NOT NULL
            AND valor_unitario_cotado IS NOT NULL
        LOOP
            -- Economia = (maior_valor - valor_escolhido) * quantidade_entregue
            v_economia_real := v_economia_real + 
                ((v_item.maior_valor_cotado - v_item.valor_unitario_cotado) * v_item.quantidade_entregue);
        END LOOP;
        
        NEW.economia_real := v_economia_real;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para calcular economia automaticamente
DROP TRIGGER IF EXISTS trigger_calcular_economia_real ON orders;
CREATE TRIGGER trigger_calcular_economia_real
    BEFORE UPDATE ON orders
    FOR EACH ROW
    WHEN (NEW.status = 'entregue')
    EXECUTE FUNCTION calcular_economia_real();

-- 6. Criar view para relatório de economia
CREATE OR REPLACE VIEW vw_economia_pedidos AS
SELECT 
    o.id,
    o.supplier_name,
    o.order_date,
    o.delivery_date,
    o.status,
    o.total_value,
    o.quote_id,
    CASE WHEN o.quote_id IS NOT NULL THEN 'Cotação' ELSE 'Direto' END as origem,
    o.economia_estimada,
    o.economia_real,
    o.diferenca_preco_kg,
    COALESCE(o.economia_real, o.economia_estimada, 0) as economia_final
FROM orders o
ORDER BY o.created_at DESC;

-- Comentário na view
COMMENT ON VIEW vw_economia_pedidos IS 'View para relatório de economia em pedidos';
