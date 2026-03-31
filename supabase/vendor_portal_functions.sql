-- 1. Function to safely get quote data via token (bypass RLS)
CREATE OR REPLACE FUNCTION get_vendor_quote_data(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'quote_id', q.id,
    'supplier_id', qs.supplier_id,
    'status', q.status,
    'supplier_name', qs.supplier_name,
    'company_id', q.company_id,
    'items', (
      SELECT jsonb_agg(jsonb_build_object(
        'product_id', qi.product_id,
        'product_name', qi.product_name,
        'quantidade', qi.quantidade,
        'unidade', qi.unidade,
        'valor_oferecido', COALESCE(qsi.valor_oferecido, 0),
        'observacoes', qsi.observacoes
      ))
      FROM quote_items qi
      LEFT JOIN quote_supplier_items qsi ON qsi.quote_id = q.id 
        AND qsi.supplier_id = qs.supplier_id 
        AND qsi.product_id = qi.product_id
      WHERE qi.quote_id = q.id
    )
  ) INTO v_result
  FROM quote_suppliers qs
  JOIN quotes q ON q.id = qs.quote_id
  WHERE qs.access_token = p_token;

  RETURN v_result;
END;
$$;

-- 2. Function to safely save quote items via token (bypass RLS)
CREATE OR REPLACE FUNCTION save_vendor_quote_items(p_token UUID, p_items JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote_id UUID;
  v_supplier_id UUID;
  v_item JSONB;
  v_old_valor NUMERIC;
  v_valor_inicial NUMERIC;
  v_price_history JSONB;
BEGIN
  -- Identify quote and supplier
  SELECT quote_id, supplier_id INTO v_quote_id, v_supplier_id
  FROM quote_suppliers
  WHERE access_token = p_token;

  IF v_quote_id IS NULL THEN
    RAISE EXCEPTION 'Token inválido ou expirado';
  END IF;

  -- Upsert items from JSONB array
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Get existing data to maintain history and initial value
    SELECT valor_oferecido, valor_inicial, price_history 
    INTO v_old_valor, v_valor_inicial, v_price_history
    FROM quote_supplier_items
    WHERE quote_id = v_quote_id 
      AND supplier_id = v_supplier_id 
      AND product_id = (v_item->>'product_id')::UUID;

    -- Update history if value changed
    IF v_old_valor IS NOT NULL AND v_old_valor > 0 AND v_old_valor != (v_item->>'valor_oferecido')::NUMERIC THEN
      v_price_history := COALESCE(v_price_history, '[]'::JSONB) || jsonb_build_object(
        'old_value', v_old_valor,
        'new_value', (v_item->>'valor_oferecido')::NUMERIC,
        'date', NOW(),
        'by', 'vendedor'
      );
    END IF;

    -- Set initial value if not set
    IF v_valor_inicial IS NULL AND (v_item->>'valor_oferecido')::NUMERIC > 0 THEN
      v_valor_inicial := COALESCE(v_old_valor, (v_item->>'valor_oferecido')::NUMERIC);
    END IF;

    -- Insert or update item price
    INSERT INTO quote_supplier_items (
      quote_id, 
      supplier_id, 
      product_id, 
      product_name,
      valor_oferecido, 
      valor_inicial,
      price_history,
      observacoes, 
      updated_by_type,
      updated_at
    )
    SELECT 
      v_quote_id, 
      v_supplier_id, 
      (v_item->>'product_id')::UUID, 
      p.name,
      (v_item->>'valor_oferecido')::NUMERIC, 
      v_valor_inicial,
      v_price_history,
      v_item->>'observacoes', 
      'fornecedor',
      NOW()
    FROM products p 
    WHERE p.id = (v_item->>'product_id')::UUID
    ON CONFLICT (quote_id, supplier_id, product_id) 
    DO UPDATE SET 
      valor_oferecido = EXCLUDED.valor_oferecido,
      valor_inicial = EXCLUDED.valor_inicial,
      price_history = EXCLUDED.price_history,
      observacoes = EXCLUDED.observacoes,
      updated_by_type = 'fornecedor',
      updated_at = NOW();
  END LOOP;

  -- Update overall supplier status
  UPDATE quote_suppliers 
  SET 
    status = 'respondido',
    data_resposta = NOW()
  WHERE access_token = p_token;
END;
$$;
