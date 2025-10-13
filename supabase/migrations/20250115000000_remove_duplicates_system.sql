-- =====================================================
-- SISTEMA DE REMOÇÃO DE DUPLICATAS
-- =====================================================
-- Este arquivo contém funções para detectar e remover
-- registros duplicados mantendo sempre o mais recente
-- =====================================================

-- =====================================================
-- 1. FUNÇÃO PARA DETECTAR DUPLICATAS EM PRODUTOS
-- =====================================================
CREATE OR REPLACE FUNCTION detect_product_duplicates(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    duplicate_count BIGINT,
    name TEXT,
    category TEXT,
    user_id UUID,
    oldest_id UUID,
    newest_id UUID,
    oldest_created_at TIMESTAMP WITH TIME ZONE,
    newest_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    WITH duplicates AS (
        SELECT 
            p.name,
            p.category,
            p.user_id,
            COUNT(*) as duplicate_count,
            MIN(p.created_at) as oldest_created_at,
            MAX(p.created_at) as newest_created_at,
            MIN(p.id) as oldest_id,
            MAX(p.id) as newest_id
        FROM products p
        WHERE (user_uuid IS NULL OR p.user_id = user_uuid)
        GROUP BY p.name, p.category, p.user_id
        HAVING COUNT(*) > 1
    )
    SELECT 
        d.duplicate_count,
        d.name,
        d.category,
        d.user_id,
        d.oldest_id,
        d.newest_id,
        d.oldest_created_at,
        d.newest_created_at
    FROM duplicates d
    ORDER BY d.duplicate_count DESC, d.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. FUNÇÃO PARA DETECTAR DUPLICATAS EM FORNECEDORES
-- =====================================================
CREATE OR REPLACE FUNCTION detect_supplier_duplicates(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    duplicate_count BIGINT,
    name TEXT,
    cnpj TEXT,
    user_id UUID,
    oldest_id UUID,
    newest_id UUID,
    oldest_created_at TIMESTAMP WITH TIME ZONE,
    newest_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    WITH duplicates AS (
        SELECT 
            s.name,
            s.cnpj,
            s.user_id,
            COUNT(*) as duplicate_count,
            MIN(s.created_at) as oldest_created_at,
            MAX(s.created_at) as newest_created_at,
            MIN(s.id) as oldest_id,
            MAX(s.id) as newest_id
        FROM suppliers s
        WHERE (user_uuid IS NULL OR s.user_id = user_uuid)
        GROUP BY s.name, s.cnpj, s.user_id
        HAVING COUNT(*) > 1
    )
    SELECT 
        d.duplicate_count,
        d.name,
        d.cnpj,
        d.user_id,
        d.oldest_id,
        d.newest_id,
        d.oldest_created_at,
        d.newest_created_at
    FROM duplicates d
    ORDER BY d.duplicate_count DESC, d.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. FUNÇÃO PARA REMOVER DUPLICATAS EM PRODUTOS
-- =====================================================
CREATE OR REPLACE FUNCTION remove_product_duplicates(user_uuid UUID DEFAULT NULL, dry_run BOOLEAN DEFAULT TRUE)
RETURNS TABLE (
    action TEXT,
    product_name TEXT,
    category TEXT,
    removed_count INTEGER,
    kept_id UUID,
    removed_ids UUID[]
) AS $$
DECLARE
    duplicate_record RECORD;
    ids_to_remove UUID[];
    removed_count_var INTEGER;
BEGIN
    -- Loop através de cada grupo de duplicatas
    FOR duplicate_record IN 
        SELECT * FROM detect_product_duplicates(user_uuid)
    LOOP
        -- Buscar todos os IDs duplicados exceto o mais recente
        SELECT ARRAY_AGG(p.id) INTO ids_to_remove
        FROM products p
        WHERE p.name = duplicate_record.name 
          AND p.category = duplicate_record.category 
          AND p.user_id = duplicate_record.user_id
          AND p.id != duplicate_record.newest_id
          AND (user_uuid IS NULL OR p.user_id = user_uuid);
        
        removed_count_var := array_length(ids_to_remove, 1);
        
        IF NOT dry_run AND removed_count_var > 0 THEN
            -- Remover registros relacionados primeiro
            DELETE FROM quote_items WHERE product_id = ANY(ids_to_remove);
            DELETE FROM quote_supplier_items WHERE product_id = ANY(ids_to_remove);
            DELETE FROM order_items WHERE product_id = ANY(ids_to_remove);
            
            -- Remover os produtos duplicados
            DELETE FROM products WHERE id = ANY(ids_to_remove);
        END IF;
        
        -- Retornar informações sobre a ação
        RETURN QUERY SELECT 
            CASE WHEN dry_run THEN 'DRY_RUN' ELSE 'REMOVED' END::TEXT,
            duplicate_record.name,
            duplicate_record.category,
            removed_count_var,
            duplicate_record.newest_id,
            ids_to_remove;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. FUNÇÃO PARA REMOVER DUPLICATAS EM FORNECEDORES
-- =====================================================
CREATE OR REPLACE FUNCTION remove_supplier_duplicates(user_uuid UUID DEFAULT NULL, dry_run BOOLEAN DEFAULT TRUE)
RETURNS TABLE (
    action TEXT,
    supplier_name TEXT,
    cnpj TEXT,
    removed_count INTEGER,
    kept_id UUID,
    removed_ids UUID[]
) AS $$
DECLARE
    duplicate_record RECORD;
    ids_to_remove UUID[];
    removed_count_var INTEGER;
BEGIN
    -- Loop através de cada grupo de duplicatas
    FOR duplicate_record IN 
        SELECT * FROM detect_supplier_duplicates(user_uuid)
    LOOP
        -- Buscar todos os IDs duplicados exceto o mais recente
        SELECT ARRAY_AGG(s.id) INTO ids_to_remove
        FROM suppliers s
        WHERE s.name = duplicate_record.name 
          AND COALESCE(s.cnpj, '') = COALESCE(duplicate_record.cnpj, '')
          AND s.user_id = duplicate_record.user_id
          AND s.id != duplicate_record.newest_id
          AND (user_uuid IS NULL OR s.user_id = user_uuid);
        
        removed_count_var := array_length(ids_to_remove, 1);
        
        IF NOT dry_run AND removed_count_var > 0 THEN
            -- Atualizar referências para o fornecedor mantido
            UPDATE orders SET supplier_id = duplicate_record.newest_id 
            WHERE supplier_id = ANY(ids_to_remove);
            
            UPDATE quote_suppliers SET supplier_id = duplicate_record.newest_id 
            WHERE supplier_id = ANY(ids_to_remove);
            
            UPDATE quote_supplier_items SET supplier_id = duplicate_record.newest_id 
            WHERE supplier_id = ANY(ids_to_remove);
            
            -- Remover os fornecedores duplicados
            DELETE FROM suppliers WHERE id = ANY(ids_to_remove);
        END IF;
        
        -- Retornar informações sobre a ação
        RETURN QUERY SELECT 
            CASE WHEN dry_run THEN 'DRY_RUN' ELSE 'REMOVED' END::TEXT,
            duplicate_record.name,
            duplicate_record.cnpj,
            removed_count_var,
            duplicate_record.newest_id,
            ids_to_remove;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. FUNÇÃO PRINCIPAL PARA LIMPEZA COMPLETA
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_all_duplicates(user_uuid UUID DEFAULT NULL, dry_run BOOLEAN DEFAULT TRUE)
RETURNS TABLE (
    table_name TEXT,
    action TEXT,
    item_name TEXT,
    removed_count INTEGER,
    details JSONB
) AS $$
DECLARE
    product_result RECORD;
    supplier_result RECORD;
    total_products_removed INTEGER := 0;
    total_suppliers_removed INTEGER := 0;
BEGIN
    -- Limpar duplicatas de produtos
    FOR product_result IN 
        SELECT * FROM remove_product_duplicates(user_uuid, dry_run)
    LOOP
        total_products_removed := total_products_removed + product_result.removed_count;
        
        RETURN QUERY SELECT 
            'products'::TEXT,
            product_result.action,
            product_result.product_name,
            product_result.removed_count,
            jsonb_build_object(
                'category', product_result.category,
                'kept_id', product_result.kept_id,
                'removed_ids', product_result.removed_ids
            );
    END LOOP;
    
    -- Limpar duplicatas de fornecedores
    FOR supplier_result IN 
        SELECT * FROM remove_supplier_duplicates(user_uuid, dry_run)
    LOOP
        total_suppliers_removed := total_suppliers_removed + supplier_result.removed_count;
        
        RETURN QUERY SELECT 
            'suppliers'::TEXT,
            supplier_result.action,
            supplier_result.supplier_name,
            supplier_result.removed_count,
            jsonb_build_object(
                'cnpj', supplier_result.cnpj,
                'kept_id', supplier_result.kept_id,
                'removed_ids', supplier_result.removed_ids
            );
    END LOOP;
    
    -- Retornar resumo
    RETURN QUERY SELECT 
        'summary'::TEXT,
        CASE WHEN dry_run THEN 'DRY_RUN_SUMMARY' ELSE 'CLEANUP_SUMMARY' END::TEXT,
        'Total'::TEXT,
        total_products_removed + total_suppliers_removed,
        jsonb_build_object(
            'products_removed', total_products_removed,
            'suppliers_removed', total_suppliers_removed,
            'dry_run', dry_run
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. FUNÇÃO PARA ESTATÍSTICAS DE DUPLICATAS
-- =====================================================
CREATE OR REPLACE FUNCTION get_duplicate_stats(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    table_name TEXT,
    total_records BIGINT,
    duplicate_groups BIGINT,
    total_duplicates BIGINT,
    potential_removals BIGINT
) AS $$
BEGIN
    -- Estatísticas de produtos
    RETURN QUERY
    WITH product_stats AS (
        SELECT 
            COUNT(*) as total_records,
            COUNT(*) FILTER (WHERE dup_count > 1) as duplicate_groups,
            SUM(dup_count) FILTER (WHERE dup_count > 1) as total_duplicates,
            SUM(dup_count - 1) FILTER (WHERE dup_count > 1) as potential_removals
        FROM (
            SELECT COUNT(*) as dup_count
            FROM products p
            WHERE (user_uuid IS NULL OR p.user_id = user_uuid)
            GROUP BY p.name, p.category, p.user_id
        ) grouped
    )
    SELECT 
        'products'::TEXT,
        ps.total_records,
        ps.duplicate_groups,
        ps.total_duplicates,
        ps.potential_removals
    FROM product_stats ps;
    
    -- Estatísticas de fornecedores
    RETURN QUERY
    WITH supplier_stats AS (
        SELECT 
            COUNT(*) as total_records,
            COUNT(*) FILTER (WHERE dup_count > 1) as duplicate_groups,
            SUM(dup_count) FILTER (WHERE dup_count > 1) as total_duplicates,
            SUM(dup_count - 1) FILTER (WHERE dup_count > 1) as potential_removals
        FROM (
            SELECT COUNT(*) as dup_count
            FROM suppliers s
            WHERE (user_uuid IS NULL OR s.user_id = user_uuid)
            GROUP BY s.name, s.cnpj, s.user_id
        ) grouped
    )
    SELECT 
        'suppliers'::TEXT,
        ss.total_records,
        ss.duplicate_groups,
        ss.total_duplicates,
        ss.potential_removals
    FROM supplier_stats ss;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS DE USO
-- =====================================================
/*
EXEMPLOS DE USO:

1. Ver estatísticas de duplicatas:
   SELECT * FROM get_duplicate_stats();
   SELECT * FROM get_duplicate_stats('user-uuid-here');

2. Detectar duplicatas específicas:
   SELECT * FROM detect_product_duplicates();
   SELECT * FROM detect_supplier_duplicates();

3. Simular remoção (dry run):
   SELECT * FROM cleanup_all_duplicates(NULL, true);
   SELECT * FROM cleanup_all_duplicates('user-uuid', true);

4. Executar remoção real:
   SELECT * FROM cleanup_all_duplicates(NULL, false);
   SELECT * FROM cleanup_all_duplicates('user-uuid', false);

5. Remover apenas produtos ou fornecedores:
   SELECT * FROM remove_product_duplicates(NULL, false);
   SELECT * FROM remove_supplier_duplicates(NULL, false);

IMPORTANTE:
- Sempre execute primeiro com dry_run=true para ver o que será removido
- As funções mantêm sempre o registro mais recente (maior created_at)
- Todas as referências são atualizadas automaticamente
- Use user_uuid para limitar a um usuário específico
*/