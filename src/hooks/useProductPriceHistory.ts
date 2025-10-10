import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PriceHistoryEntry {
  id: string;
  date: string;
  supplier: string;
  supplierId: string;
  price: number;
  quotationId: string;
  status: "concluida" | "ativa" | "expirada";
}

export function useProductPriceHistory(productId: string) {
  return useQuery({
    queryKey: ['product-price-history', productId],
    queryFn: async () => {
      console.log(`📊 Fetching price history for product: ${productId}`);
      
      // Buscar todos os itens de cotação para este produto
      const { data: quoteItems, error: qiError } = await supabase
        .from('quote_items')
        .select(`
          product_id,
          quote_id,
          quotes(
            id,
            status,
            created_at
          )
        `)
        .eq('product_id', productId);

      if (qiError) {
        console.error("❌ Error fetching quote items:", qiError);
        throw qiError;
      }

      if (!quoteItems || quoteItems.length === 0) {
        console.log("✅ No quote items found for product");
        return [];
      }

      // Buscar todos os valores oferecidos pelos fornecedores para este produto
      const { data: supplierItems, error: siError } = await supabase
        .from('quote_supplier_items')
        .select(`
          product_id,
          quote_id,
          supplier_id,
          valor_oferecido,
          created_at
        `)
        .eq('product_id', productId)
        .not('valor_oferecido', 'is', null)
        .gt('valor_oferecido', 0);

      if (siError) {
        console.error("❌ Error fetching supplier items:", siError);
        throw siError;
      }

      if (!supplierItems || supplierItems.length === 0) {
        console.log("✅ No supplier items found for product");
        return [];
      }

      // Buscar informações dos fornecedores
      const supplierIds = [...new Set(supplierItems.map(si => si.supplier_id))];
      const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, name')
        .in('id', supplierIds);

      if (suppliersError) {
        console.error("❌ Error fetching suppliers:", suppliersError);
        throw suppliersError;
      }

      // Criar mapa de fornecedores para lookup rápido
      const supplierMap = new Map(suppliers?.map(s => [s.id, s.name]) || []);

      // Processar dados para criar histórico
      const priceHistory: PriceHistoryEntry[] = [];

      // Agrupar por cotação para pegar apenas o melhor preço de cada cotação
      const quoteGroups = new Map<string, {
        quote: any;
        bestOffer: any;
      }>();

      supplierItems.forEach(item => {
        const quote = quoteItems.find(qi => qi.quote_id === item.quote_id);
        if (!quote || !quote.quotes) return;

        const currentBest = quoteGroups.get(item.quote_id);
        if (!currentBest || Number(item.valor_oferecido) < Number(currentBest.bestOffer.valor_oferecido)) {
          quoteGroups.set(item.quote_id, {
            quote: quote.quotes,
            bestOffer: item
          });
        }
      });

      // Converter para array de histórico
      quoteGroups.forEach(({ quote, bestOffer }) => {
        const supplierName = supplierMap.get(bestOffer.supplier_id) || 'Fornecedor Desconhecido';
        
        priceHistory.push({
          id: `${bestOffer.quote_id}-${bestOffer.supplier_id}`,
          date: quote.created_at,
          supplier: supplierName,
          supplierId: bestOffer.supplier_id,
          price: Number(bestOffer.valor_oferecido),
          quotationId: quote.id,
          status: quote.status as "concluida" | "ativa" | "expirada"
        });
      });

      // Ordenar por data (mais recente primeiro)
      priceHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log(`✅ Found ${priceHistory.length} price history entries`);
      return priceHistory;
    },
    enabled: !!productId,
  });
}