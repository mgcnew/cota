-- Fix: remove referência a psi.observacoes que não existe em packaging_supplier_items
-- Replica o padrão do RPC geral (get_vendor_quote_data) adaptado para embalagens

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
    -- NOTA: packaging_supplier_items NÃO tem coluna 'observacoes'
    -- As observações ficam em packaging_quote_suppliers.observacoes (nível fornecedor, não item)
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
                    'observacoes', NULL,
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
