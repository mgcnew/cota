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
      
      // ============== QUOTE HISTORY ==============
      // 1. Find all quotes that include this product via quote_items
      const { data: quoteItems, error: qiError } = await supabase
        .from('quote_items')
        .select('quote_id, product_id, product_name')
        .eq('product_id', productId);

      if (qiError) {
        console.error("❌ Error fetching quote_items:", qiError);
        throw qiError;
      }

      console.log(`📊 Found ${quoteItems?.length || 0} quote_items for product`);

      const quoteIds = [...new Set(quoteItems?.map(qi => qi.quote_id) || [])];
      
      // 2. Fetch quote details
      let quotesMap = new Map<string, { id: string; status: string; created_at: string }>();
      if (quoteIds.length > 0) {
        const { data: quotes, error: quotesError } = await supabase
          .from('quotes')
          .select('id, status, created_at')
          .in('id', quoteIds);

        if (quotesError) {
          console.error("❌ Error fetching quotes:", quotesError);
          throw quotesError;
        }
        quotesMap = new Map(quotes?.map(q => [q.id, q]) || []);
      }

      // 3. Fetch supplier offers (quote_supplier_items) for this product in these quotes
      let supplierItemsByQuote = new Map<string, Array<{ supplier_id: string; valor_oferecido: number }>>();
      if (quoteIds.length > 0) {
        const { data: supplierItems, error: siError } = await supabase
          .from('quote_supplier_items')
          .select('quote_id, supplier_id, valor_oferecido')
          .eq('product_id', productId)
          .in('quote_id', quoteIds);

        if (siError) {
          console.error("❌ Error fetching quote_supplier_items:", siError);
          throw siError;
        }

        // Group by quote_id
        supplierItems?.forEach(item => {
          const list = supplierItemsByQuote.get(item.quote_id) || [];
          list.push({ supplier_id: item.supplier_id, valor_oferecido: Number(item.valor_oferecido) });
          supplierItemsByQuote.set(item.quote_id, list);
        });
      }

      // 4. Collect all supplier IDs to fetch names
      const allSupplierIds = new Set<string>();
      supplierItemsByQuote.forEach(items => {
        items.forEach(item => allSupplierIds.add(item.supplier_id));
      });

      let supplierMap = new Map<string, string>();
      if (allSupplierIds.size > 0) {
        const { data: suppliers, error: suppliersError } = await supabase
          .from('suppliers')
          .select('id, name')
          .in('id', Array.from(allSupplierIds));

        if (suppliersError) {
          console.error("❌ Error fetching suppliers:", suppliersError);
          throw suppliersError;
        }
        supplierMap = new Map(suppliers?.map(s => [s.id, s.name]) || []);
      }

      // 5. Build quote history entries
      const quoteHistory: PriceHistoryEntry[] = [];

      quoteIds.forEach(quoteId => {
        const quote = quotesMap.get(quoteId);
        if (!quote) return;

        const offers = supplierItemsByQuote.get(quoteId) || [];
        // Filter offers with actual values
        const validOffers = offers.filter(o => o.valor_oferecido > 0);

        if (validOffers.length > 0) {
          // Find best (lowest) price offer
          const bestOffer = validOffers.reduce((best, curr) => 
            curr.valor_oferecido < best.valor_oferecido ? curr : best
          , validOffers[0]);

          quoteHistory.push({
            id: `quote-${quoteId}`,
            date: quote.created_at,
            supplier: supplierMap.get(bestOffer.supplier_id) || 'Fornecedor Desconhecido',
            supplierId: bestOffer.supplier_id,
            price: bestOffer.valor_oferecido,
            quotationId: quote.id,
            status: quote.status,
            type: 'quote'
          });
        } else {
          // Quote exists but no offers yet — still show it with price 0
          quoteHistory.push({
            id: `quote-${quoteId}`,
            date: quote.created_at,
            supplier: 'Aguardando propostas',
            supplierId: '',
            price: 0,
            quotationId: quote.id,
            status: quote.status,
            type: 'quote'
          });
        }
      });

      // ============== ORDER HISTORY ==============
      // 6. Fetch order items for this product
      const { data: orderItems, error: oiError } = await supabase
        .from('order_items')
        .select('id, product_id, order_id, unit_price, created_at')
        .eq('product_id', productId)
        .gt('unit_price', 0);

      if (oiError) {
        console.error("❌ Error fetching order items:", oiError);
        throw oiError;
      }

      // 7. Fetch order details separately
      const orderIds = [...new Set(orderItems?.map(oi => oi.order_id) || [])];
      let ordersMap = new Map<string, { id: string; supplier_name: string; supplier_id: string; status: string; order_date: string; quote_id: string | null; created_at: string }>();
      
      if (orderIds.length > 0) {
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, supplier_name, supplier_id, status, order_date, quote_id, created_at')
          .in('id', orderIds);

        if (ordersError) {
          console.error("❌ Error fetching orders:", ordersError);
          throw ordersError;
        }
        ordersMap = new Map(orders?.map(o => [o.id, o]) || []);
      }

      // 8. Build order history entries
      const orderHistory: PriceHistoryEntry[] = [];

      orderItems?.forEach(item => {
        const order = ordersMap.get(item.order_id);
        if (!order) return;
        if (order.status === 'cancelado') return;

        orderHistory.push({
          id: `order-${item.order_id}`,
          date: order.order_date || order.created_at || item.created_at,
          supplier: order.supplier_name || 'Fornecedor Desconhecido',
          supplierId: order.supplier_id || '',
          price: Number(item.unit_price),
          orderId: item.order_id,
          quotationId: order.quote_id || undefined,
          status: order.status || 'concluido',
          type: 'order'
        });
      });

      // Sort both by date (most recent first)
      const sortFn = (a: PriceHistoryEntry, b: PriceHistoryEntry) => 
        new Date(b.date).getTime() - new Date(a.date).getTime();
      quoteHistory.sort(sortFn);
      orderHistory.sort(sortFn);

      console.log(`✅ Price history: ${quoteHistory.length} quotes, ${orderHistory.length} orders`);
      return { quoteHistory, orderHistory };
    },
    enabled: !!productId,
  });
}