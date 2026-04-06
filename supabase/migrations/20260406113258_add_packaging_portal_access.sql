-- 1. Adicionar access_token à tabela packaging_quote_suppliers se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packaging_quote_suppliers' AND column_name = 'access_token') THEN
        ALTER TABLE packaging_quote_suppliers ADD COLUMN access_token UUID DEFAULT gen_random_uuid();
    END IF;
END $$;

-- 2. Função para buscar os dados da cotação de EMBALAGENS via token
CREATE OR REPLACE FUNCTION get_packaging_vendor_quote_data(p_token UUID)
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
    FROM packaging_quote_suppliers qs
    JOIN packaging_quotes q ON q.id = qs.quote_id
    WHERE qs.access_token = p_token;

    -- Se não achou
    IF v_quote_id IS NULL THEN
        RAISE EXCEPTION 'Token inválido ou cotação de embalagens não encontrada';
    END IF;

    -- Obter os itens e seus preços atuais
    SELECT json_build_object(
        'quote_id', v_quote_id,
        'supplier_id', v_supplier_id,
        'status', v_quote_status,
        'supplier_name', v_supplier_name,
        'company_id', v_company_id,
        'is_packaging', true,
        'items', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'product_id', qi.packaging_id,
                    'product_name', qi.packaging_name,
                    'quantidade', COALESCE(qi.quantidade_necessaria, 1),
                    'unidade', COALESCE(psi.unidade_venda, 'un'),
                    'valor_oferecido', psi.valor_total,
                    'observacoes', psi.observacoes,
                    'is_packaging', true,
                    'quantidade_venda', psi.quantidade_venda,
                    'quantidade_unidades_estimada', psi.quantidade_unidades_estimada,
                    'gramatura', psi.gramatura,
                    'dimensoes', psi.dimensoes
                )
            )
            FROM packaging_quote_items qi
            LEFT JOIN packaging_supplier_items psi 
                ON psi.quote_id = v_quote_id 
                AND psi.supplier_id = v_supplier_id 
                AND psi.packaging_id = qi.packaging_id
            WHERE qi.quote_id = v_quote_id
        ), '[]'::json)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- 3. Função para o fornecedor salvar os preços de EMBALAGENS
CREATE OR REPLACE FUNCTION save_packaging_vendor_quote_items(p_token UUID, p_items JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quote_id UUID;
    v_supplier_id UUID;
    v_status TEXT;
    v_member JSONB;
BEGIN
    -- Validar token
    SELECT q.id, qs.supplier_id, q.status
    INTO v_quote_id, v_supplier_id, v_status
    FROM packaging_quote_suppliers qs
    JOIN packaging_quotes q ON q.id = qs.quote_id
    WHERE qs.access_token = p_token;

    IF v_quote_id IS NULL THEN
        RAISE EXCEPTION 'Token inválido';
    END IF;

    IF v_status = 'concluida' OR v_status = 'cancelada' THEN
        RAISE EXCEPTION 'Esta cotação não aceita mais propostas.';
    END IF;

    -- Inserir ou atualizar os itens iterando sobre o JSON
    FOR v_member IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO packaging_supplier_items (
            quote_id, 
            supplier_id, 
            packaging_id, 
            packaging_name,
            valor_total, 
            unidade_venda,
            quantidade_venda,
            quantidade_unidades_estimada,
            gramatura,
            dimensoes,
            custo_por_unidade,
            updated_at
        ) VALUES (
            v_quote_id,
            v_supplier_id,
            (v_member->>'product_id')::UUID,
            (v_member->>'product_name'),
            (v_member->>'valor_oferecido')::NUMERIC,
            (v_member->>'unidade'),
            (v_member->>'quantidade_venda')::NUMERIC,
            (v_member->>'quantidade_unidades_estimada')::INTEGER,
            (v_member->>'gramatura')::NUMERIC,
            (v_member->>'dimensoes'),
            CASE 
                WHEN (v_member->>'quantidade_unidades_estimada')::NUMERIC > 0 
                THEN (v_member->>'valor_oferecido')::NUMERIC / (v_member->>'quantidade_unidades_estimada')::NUMERIC 
                ELSE 0 
            END,
            NOW()
        )
        ON CONFLICT (quote_id, supplier_id, packaging_id) 
        DO UPDATE SET 
            valor_total = EXCLUDED.valor_total,
            unidade_venda = EXCLUDED.unidade_venda,
            quantidade_venda = EXCLUDED.quantidade_venda,
            quantidade_unidades_estimada = EXCLUDED.quantidade_unidades_estimada,
            gramatura = EXCLUDED.gramatura,
            dimensoes = EXCLUDED.dimensoes,
            custo_por_unidade = EXCLUDED.custo_por_unidade,
            updated_at = NOW();
    END LOOP;

    -- Atualizar status do fornecedor
    UPDATE packaging_quote_suppliers 
    SET 
        status = 'respondido',
        data_resposta = NOW()
    WHERE access_token = p_token;

    RETURN TRUE;
END;
$$;
