import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PriceHistoryEntry {
  id: string;
  date: string;
  supplier: string;
  supplierId: string;
  price: number;
  quotationId?: string;
  orderId?: string;
  status: string;
  type: 'quote' | 'order';
}

export function useProductPriceHistory(productId: string) {
  return useQuery({
    queryKey: ['product-price-history', productId],
    queryFn: async () => {
      console.log(`📊 Fetching price history for product: ${productId}`);
      
      // 1. Fetch Quote History (All offers for this product)
      const { data: supplierItems, error: siError } = await supabase
        .from('quote_supplier_items')
        .select(`
          product_id,
          quote_id,
          supplier_id,
          valor_oferecido,
          created_at,
          quotes!inner(
            id,
            status,
            created_at
          )
        `)
        .eq('product_id', productId)
        .not('valor_oferecido', 'is', null)
        .gt('valor_oferecido', 0);

      if (siError) throw siError;

      // 2. Fetch Order History (Confirmed Orders)
      const { data: orderItems, error: oiError } = await supabase
        .from('order_items')
        .select(`
          id,
          product_id,
          order_id,
          unit_price,
          created_at,
          orders!inner(
            id,
            supplier_name,
            status,
            order_date,
            quote_id
          )
        `)
        .eq('product_id', productId)
        .neq('orders.status', 'cancelado')
        .gt('unit_price', 0);

      if (oiError) throw oiError;

      // 3. Fetch all related suppliers for names
      const quoteSupplierIds = supplierItems?.map(si => si.supplier_id) || [];
      const supplierIds = [...new Set([...quoteSupplierIds])];
      
      const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, name')
        .in('id', supplierIds);

      if (suppliersError) throw suppliersError;
      const supplierMap = new Map(suppliers?.map(s => [s.id, s.name]) || []);

      const quoteHistory: PriceHistoryEntry[] = [];
      const orderHistory: PriceHistoryEntry[] = [];

      // Process Quote History (Best price per quote)
      const quoteGroups = new Map<string, any>();
      supplierItems?.forEach(item => {
        const quote = (item as any).quotes;
        if (!quote) return;

        const currentBest = quoteGroups.get(item.quote_id);
        if (!currentBest || Number(item.valor_oferecido) < Number(currentBest.bestOffer.valor_oferecido)) {
          quoteGroups.set(item.quote_id, {
            quote,
            bestOffer: item
          });
        }
      });

      quoteGroups.forEach(({ quote, bestOffer }) => {
        quoteHistory.push({
          id: `quote-${bestOffer.quote_id}`,
          date: quote.created_at,
          supplier: supplierMap.get(bestOffer.supplier_id) || 'Fornecedor Desconhecido',
          supplierId: bestOffer.supplier_id,
          price: Number(bestOffer.valor_oferecido),
          quotationId: quote.id,
          status: quote.status,
          type: 'quote'
        });
      });

      // Process Order History
      orderItems?.forEach(item => {
        orderHistory.push({
          id: `order-${item.order_id}`,
          date: item.orders?.order_date || item.orders?.created_at || item.created_at,
          supplier: item.orders?.supplier_name || 'Fornecedor Desconhecido',
          supplierId: '', // We don't have supplier_id directly in order_items
          price: Number(item.unit_price),
          orderId: item.order_id,
          quotationId: item.orders?.quote_id || undefined,
          status: item.orders?.status || 'concluido',
          type: 'order'
        });
      });

      // Sort both by date
      const sortFn = (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime();
      quoteHistory.sort(sortFn);
      orderHistory.sort(sortFn);

      return { quoteHistory, orderHistory };
    },
    enabled: !!productId,
  });
}