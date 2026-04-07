-- public_packaging_order_rpcs.sql
-- Funções para o portal público de pedidos de embalagens

-- 1. Obter dados do pedido e itens
CREATE OR REPLACE FUNCTION get_public_packaging_order_data(p_order_id UUID)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_supplier RECORD;
  v_items JSON;
  v_quote_supplier_id UUID;
BEGIN
  -- Busca o pedido de embalagem
  SELECT *
  INTO v_order
  FROM packaging_orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_order.quote_id IS NOT NULL THEN
    SELECT id INTO v_quote_supplier_id
    FROM packaging_quote_suppliers
    WHERE quote_id = v_order.quote_id AND supplier_id = v_order.supplier_id
    LIMIT 1;
  ELSE
    v_quote_supplier_id := NULL;
  END IF;

  -- Busca o fornecedor
  SELECT id, name, cnpj, email, phone, contact
  INTO v_supplier
  FROM suppliers
  WHERE id = (
    SELECT supplier_id 
    FROM packaging_quote_suppliers 
    WHERE id = v_quote_supplier_id
  );
  
  -- Fallback
  IF NOT FOUND THEN
     SELECT id, name, cnpj, email, phone, contact
     INTO v_supplier
     FROM suppliers
     WHERE id = v_order.supplier_id;
  END IF;

  -- Busca os itens do pedido
  SELECT json_agg(
    json_build_object(
      'id', psi.id,
      'product_name', pqi.product_name,
      'quantidade_venda', psi.quantidade_venda,
      'unidade_venda', psi.unidade_venda,
      'quantidade_unidades_estimada', psi.quantidade_unidades_estimada,
      'valor_oferecido', psi.valor_oferecido,
      'observacoes', psi.observacoes
    )
  )
  INTO v_items
  FROM packaging_supplier_items psi
  JOIN packaging_quote_items pqi ON pqi.id = psi.quote_item_id
  WHERE psi.quote_supplier_id = v_quote_supplier_id
  AND psi.valor_oferecido IS NOT NULL;

  RETURN json_build_object(
    'order', row_to_json(v_order),
    'supplier', row_to_json(v_supplier),
    'order_items', v_items
  );
END;
$$ LANGUAGE plpgsql;

-- 2. Confirmar o recebimento do pedido
CREATE OR REPLACE FUNCTION public_confirm_packaging_order(p_order_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  UPDATE packaging_orders
  SET status = 'confirmado',
      updated_at = NOW()
  WHERE id = p_order_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
