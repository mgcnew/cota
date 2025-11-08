import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSmart } from './useSupabaseSmart';
import { useState, useCallback } from 'react';

export interface CotacaoMobile {
  id: string;
  produto: string;
  produtoResumo: string;
  quantidade: string;
  status: string;
  dataInicio: string;
  dataFim: string;
  fornecedores: number;
  melhorPreco: string;
}

/**
 * Hook otimizado para cotações no mobile
 * 
 * Características:
 * - Paginação server-side (limit 10)
 * - Campos essenciais apenas (sem JOINs pesados inicialmente)
 * - Cache agressivo (5 minutos)
 * - Sem realtime por padrão
 * - Lazy loading de detalhes
 */
export function useCotacoesMobile() {
  const { getLimit, queryConfig, isMobile } = useSupabaseSmart();
  const [currentPage, setCurrentPage] = useState(1);
  const limit = getLimit();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cotacoes-mobile', currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * limit;
      const to = from + limit - 1;

      // Query otimizada - apenas campos essenciais
      const { data: quotesData, error: quotesError, count } = await supabase
        .from('quotes')
        .select(`
          id,
          status,
          data_inicio,
          data_fim,
          created_at
        `, { count: 'exact' })
        .order('data_planejada', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (quotesError) throw quotesError;

      // Buscar items e suppliers apenas dos IDs retornados
      const quoteIds = quotesData?.map(q => q.id) || [];
      
      const [itemsResult, suppliersResult] = await Promise.all([
        supabase
          .from('quote_items')
          .select('quote_id, product_name, quantidade, unidade')
          .in('quote_id', quoteIds),
        supabase
          .from('quote_suppliers')
          .select('quote_id, supplier_id')
          .in('quote_id', quoteIds)
      ]);

      // Agrupar por quote_id
      const itemsByQuote = new Map();
      const suppliersByQuote = new Map();

      itemsResult.data?.forEach(item => {
        if (!itemsByQuote.has(item.quote_id)) {
          itemsByQuote.set(item.quote_id, []);
        }
        itemsByQuote.get(item.quote_id).push(item);
      });

      suppliersResult.data?.forEach(supplier => {
        if (!suppliersByQuote.has(supplier.quote_id)) {
          suppliersByQuote.set(supplier.quote_id, []);
        }
        suppliersByQuote.get(supplier.quote_id).push(supplier);
      });

      const cotacoes: CotacaoMobile[] = quotesData?.map(quote => {
        const items = itemsByQuote.get(quote.id) || [];
        const suppliers = suppliersByQuote.get(quote.id) || [];

        const produtosTexto = items
          .map((item: any) => `${item.product_name} (${item.quantidade}${item.unidade})`)
          .join(', ');

        const produtoResumo = items.length > 0 
          ? items[0].product_name + (items.length > 1 ? '...' : '')
          : 'Sem produtos';

        return {
          id: quote.id,
          produto: produtosTexto || 'Sem produtos',
          produtoResumo,
          quantidade: `${items.length} produto(s)`,
          status: quote.status,
          dataInicio: new Date(quote.data_inicio).toLocaleDateString('pt-BR'),
          dataFim: new Date(quote.data_fim).toLocaleDateString('pt-BR'),
          fornecedores: suppliers.length,
          melhorPreco: 'R$ 0,00', // Será carregado sob demanda
        };
      }) || [];

      return {
        data: cotacoes,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      };
    },
    enabled: isMobile,
    ...queryConfig,
  });

  const pagination = {
    currentPage,
    totalPages: (data as any)?.totalPages || 0,
    totalItems: (data as any)?.total || 0,
    itemsPerPage: limit,
    hasNextPage: currentPage < ((data as any)?.totalPages || 0),
    hasPrevPage: currentPage > 1,
    nextPage: useCallback(() => {
      setCurrentPage(prev => Math.min(prev + 1, (data as any)?.totalPages || 1));
    }, [(data as any)?.totalPages]),
    prevPage: useCallback(() => {
      setCurrentPage(prev => Math.max(prev - 1, 1));
    }, []),
    goToPage: useCallback((page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, (data as any)?.totalPages || 1)));
    }, [(data as any)?.totalPages]),
  };

  return {
    cotacoes: (data as any)?.data || [],
    isLoading,
    error: error as Error | null,
    pagination,
    refetch,
  };
}

/**
 * Hook para carregar detalhes completos de uma cotação
 * Usado apenas quando modal é aberto
 */
export function useCotacaoDetails(quoteId: string | null, enabled: boolean = false) {
  const { queryConfig } = useSupabaseSmart();

  return useQuery({
    queryKey: ['cotacao-details', quoteId],
    queryFn: async () => {
      if (!quoteId) return null;

      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_items(*),
          quote_suppliers(*)
        `)
        .eq('id', quoteId)
        .single();

      if (error) throw error;

      // Buscar supplier items
      const { data: supplierItems } = await supabase
        .from('quote_supplier_items')
        .select('*')
        .eq('quote_id', quoteId);

      return {
        ...data,
        supplier_items: supplierItems || [],
      };
    },
    enabled: enabled && !!quoteId,
    ...queryConfig,
  });
}
