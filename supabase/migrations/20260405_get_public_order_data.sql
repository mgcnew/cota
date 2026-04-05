CREATE OR REPLACE FUNCTION get_public_order_data(p_order_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
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
