-- SQL para criação de funções seguras (RPC) para o Portal do Fornecedor
-- Estas funções rodam com privilégios elevados (SECURITY DEFINER) para que usuários anônimos
-- possam interagir apenas com os dados vinculados ao seu token.

-- 1. Função para buscar os dados da cotação via token
CREATE OR REPLACE FUNCTION get_vendor_quote_data(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quote_id UUID;
    v_supplier_id UUID;
    v_quote_status TEXT;
    v_supplier_name TEXT;
    v_company_id UUID;
    v_result JSON;
BEGIN
    -- Validar token e pegar IDs
    SELECT q.id, qs.supplier_id, q.status, qs.supplier_name, q.company_id
    INTO v_quote_id, v_supplier_id, v_quote_status, v_supplier_name, v_company_id
    FROM quote_suppliers qs
    JOIN quotes q ON q.id = qs.quote_id
    WHERE qs.access_token = p_token;

    -- Se não achou
    IF v_quote_id IS NULL THEN
        RAISE EXCEPTION 'Token inválido ou cotação não encontrada';
    END IF;

    -- Obter os itens e seus preços atuais (se já preenchidos)
    SELECT json_build_object(
        'quote_id', v_quote_id,
        'supplier_id', v_supplier_id,
        'status', v_quote_status,
        'supplier_name', v_supplier_name,
        'company_id', v_company_id,
        'items', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'product_id', qi.product_id,
                    'product_name', qi.product_name,
                    'quantidade', qi.quantidade,
                    'unidade', qi.unidade,
                    'valor_oferecido', qsi.valor_oferecido,
                    'observacoes', qsi.observacoes,
                    'updated_by_type', qsi.updated_by_type
                )
            )
            FROM quote_items qi
            LEFT JOIN quote_supplier_items qsi 
                ON qsi.quote_id = v_quote_id 
                AND qsi.supplier_id = v_supplier_id 
                AND qsi.product_id = qi.product_id
            WHERE qi.quote_id = v_quote_id
        ), '[]'::json)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- 2. Função para o fornecedor salvar os preços
CREATE OR REPLACE FUNCTION save_vendor_quote_items(p_token UUID, p_items JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quote_id UUID;
    v_supplier_id UUID;
    v_status TEXT;
    item JSONB;
    v_old_valor NUMERIC;
    v_valor_inicial NUMERIC;
    v_price_history JSONB;
BEGIN
    -- Validar token
    SELECT q.id, qs.supplier_id, q.status
    INTO v_quote_id, v_supplier_id, v_status
    FROM quote_suppliers qs
    JOIN quotes q ON q.id = qs.quote_id
    WHERE qs.access_token = p_token;

    IF v_quote_id IS NULL THEN
        RAISE EXCEPTION 'Token inválido';
    END IF;

    IF v_status = 'finalizada' THEN
        RAISE EXCEPTION 'Esta cotação já foi finalizada e não aceita mais propostas.';
    END IF;

    -- Inserir ou atualizar os itens iterando sobre o JSON
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Get existing data to maintain history and initial value
        SELECT valor_oferecido, valor_inicial, price_history 
        INTO v_old_valor, v_valor_inicial, v_price_history
        FROM quote_supplier_items
        WHERE quote_id = v_quote_id 
          AND supplier_id = v_supplier_id 
          AND product_id = (item->>'product_id')::UUID;

        -- Update history if value changed
        IF v_old_valor IS NOT NULL AND v_old_valor > 0 AND v_old_valor != (item->>'valor_oferecido')::NUMERIC THEN
          v_price_history := COALESCE(v_price_history, '[]'::JSONB) || jsonb_build_object(
            'old_value', v_old_valor,
            'new_value', (item->>'valor_oferecido')::NUMERIC,
            'date', NOW(),
            'by', 'vendedor'
          );
        END IF;

        -- Set initial value if not set
        IF v_valor_inicial IS NULL AND (item->>'valor_oferecido')::NUMERIC > 0 THEN
          v_valor_inicial := COALESCE(v_old_valor, (item->>'valor_oferecido')::NUMERIC);
        END IF;

        INSERT INTO quote_supplier_items (
            quote_id, 
            supplier_id, 
            product_id, 
            valor_oferecido, 
            valor_inicial,
            price_history,
            observacoes, 
            updated_by_type,
            updated_at
        ) VALUES (
            v_quote_id,
            v_supplier_id,
            (item->>'product_id')::UUID,
            (item->>'valor_oferecido')::NUMERIC,
            v_valor_inicial,
            v_price_history,
            item->>'observacoes',
            'fornecedor',
            NOW()
        )
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

    RETURN TRUE;
END;
$$;
