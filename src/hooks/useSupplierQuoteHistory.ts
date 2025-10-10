import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierQuoteHistoryEntry {
  id: string;
  date: string;
  product: string;
  productId: string;
  price: number;
  quotationId: string;
  status: "concluida" | "ativa" | "expirada";
  isWinner: boolean; // Se foi o fornecedor escolhido nesta cotação
}

export function useSupplierQuoteHistory(supplierId: string) {
  return useQuery({
    queryKey: ['supplier-quote-history', supplierId],
    queryFn: async () => {
      console.log(`📊 Fetching quote history for supplier: ${supplierId}`);
      
      // Buscar todos os itens de cotação onde este fornecedor participou
      const { data: supplierItems, error: siError } = await supabase
        .from('quote_supplier_items')
        .select(`
          product_id,
          quote_id,
          supplier_id,
          product_name,
          valor_oferecido,
          created_at
        `)
        .eq('supplier_id', supplierId)
        .not('valor_oferecido', 'is', null)
        .gt('valor_oferecido', 0);

      if (siError) {
        console.error("❌ Error fetching supplier items:", siError);
        throw siError;
      }

      if (!supplierItems || supplierItems.length === 0) {
        console.log("✅ No supplier items found");
        return [];
      }

      // Buscar informações das cotações
      const quoteIds = [...new Set(supplierItems.map(si => si.quote_id))];
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('id, status, created_at')
        .in('id', quoteIds);

      if (quotesError) {
        console.error("❌ Error fetching quotes:", quotesError);
        throw quotesError;
      }

      // Buscar todos os itens de fornecedores para determinar quem ganhou cada cotação
      const { data: allSupplierItems, error: allSiError } = await supabase
        .from('quote_supplier_items')
        .select(`
          product_id,
          quote_id,
          supplier_id,
          valor_oferecido
        `)
        .in('quote_id', quoteIds)
        .not('valor_oferecido', 'is', null)
        .gt('valor_oferecido', 0);

      if (allSiError) {
        console.error("❌ Error fetching all supplier items:", allSiError);
        throw allSiError;
      }

      // Criar mapa de cotações para lookup rápido
      const quotesMap = new Map(quotes?.map(q => [q.id, q]) || []);

      // Processar dados para criar histórico
      const quoteHistory: SupplierQuoteHistoryEntry[] = [];

      supplierItems.forEach(item => {
        const quote = quotesMap.get(item.quote_id);
        if (!quote) return;

        // Determinar se este fornecedor teve o melhor preço para este produto nesta cotação
        const competingOffers = allSupplierItems?.filter(
          asi => asi.quote_id === item.quote_id && asi.product_id === item.product_id
        ) || [];

        const bestPrice = Math.min(...competingOffers.map(o => Number(o.valor_oferecido)));
        const isWinner = Number(item.valor_oferecido) === bestPrice;

        quoteHistory.push({
          id: `${item.quote_id}-${item.product_id}`,
          date: quote.created_at,
          product: item.product_name || 'Produto não identificado',
          productId: item.product_id,
          price: Number(item.valor_oferecido),
          quotationId: quote.id,
          status: quote.status as "concluida" | "ativa" | "expirada",
          isWinner
        });
      });

      // Ordenar por data (mais recente primeiro)
      quoteHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log(`✅ Found ${quoteHistory.length} quote history entries`);
      return quoteHistory;
    },
    enabled: !!supplierId,
  });
}