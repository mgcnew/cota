-- SQL para criação de funções seguras (RPC) para o Portal do Pedido
-- Estas funções rodam com privilégios elevados (SECURITY DEFINER) para que usuários anônimos
-- possam interagir apenas com o pedido vinculado ao link (ID).

-- 1. Função para buscar os dados do pedido e itens publicamente
CREATE OR REPLACE FUNCTION get_public_order_data(p_order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order json;
    v_supplier json;
    v_items json;
    v_result json;
BEGIN
    -- Obter pedido
    SELECT row_to_json(o) INTO v_order
    FROM orders o
    WHERE id = p_order_id;

    IF v_order IS NULL THEN
        RETURN NULL;
    END IF;

    -- Obter itens do pedido
    SELECT json_agg(row_to_json(oi)) INTO v_items
    FROM order_items oi
    WHERE order_id = p_order_id;

    -- Obter fornecedor
    SELECT row_to_json(s) INTO v_supplier
    FROM suppliers s
    WHERE id = (v_order->>'supplier_id')::uuid;

    -- Construir JSON final
    v_result = json_build_object(
        'order', v_order,
        'order_items', COALESCE(v_items, '[]'::json),
        'supplier', v_supplier
    );

    RETURN v_result;
END;
$$;

-- 2. Função para o fornecedor confirmar o pedido
CREATE OR REPLACE FUNCTION public_confirm_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE orders
    SET status = 'confirmado',
        updated_at = NOW()
    WHERE id = p_order_id
      AND status != 'entregue'
      AND status != 'cancelado';
      
    RETURN FOUND;
END;
$$;
