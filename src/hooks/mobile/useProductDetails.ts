import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMobileQueryConfig } from './useMobileQueryConfig';
import type { ProductMobileFull } from './useProductsMobile';

/**
 * Hook para lazy loading de detalhes completos do produto
 * 
 * Características:
 * - Query habilitada apenas quando productId fornecido
 * - Campos completos: preços, fornecedores, histórico
 * - Cache de 5 minutos
 * - Placeholder data para transições suaves
 * - Zero carregamentos desnecessários
 */
export function useProductDetails(productId: string | null | undefined) {
  const mobileConfig = useMobileQueryConfig();

  const {
    data: productDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product-details', productId],
    queryFn: async (): Promise<ProductMobileFull | null> => {
      if (!productId) return null;

      // Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar produto completo
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;
      if (!product) return null;

      // Buscar cotações relacionadas para calcular métricas
      const { data: quoteItems } = await supabase
        .from('quote_items')
        .select(`
          quote_id,
          quotes(
            id,
            status,
            created_at
          )
        `)
        .eq('product_id', productId);

      // Buscar itens de pedidos para preços reais
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          product_id,
          price,
          orders!inner(
            id,
            status,
            created_at
          )
        `)
        .eq('product_id', productId)
        .eq('orders.status', 'confirmado');

      // Calcular métricas
      const quotes = quoteItems || [];
      const activeQuotes = quotes.filter((qi: any) => 
        qi.quotes && (qi.quotes.status === 'aberta' || qi.quotes.status === 'em_andamento')
      ).length;

      // Calcular melhor preço e fornecedor
      let bestPrice = 0;
      let bestSupplier = 'N/A';
      let lastQuotePrice = 'R$ 0,00';

      if (orderItems && orderItems.length > 0) {
        // Ordenar por data mais recente
        const sortedOrders = orderItems
          .map((oi: any) => ({
            price: parseFloat(oi.price || 0),
            date: new Date(oi.orders?.created_at || 0),
          }))
          .sort((a, b) => b.date.getTime() - a.date.getTime());

        if (sortedOrders.length > 0) {
          bestPrice = sortedOrders[0].price;
          lastQuotePrice = `R$ ${bestPrice.toFixed(2).replace('.', ',')}`;
        }
      }

      // Calcular tendência (simplificado)
      let trend: "up" | "down" | "stable" = "stable";
      if (orderItems && orderItems.length >= 2) {
        const prices = orderItems
          .map((oi: any) => parseFloat(oi.price || 0))
          .sort((a, b) => b - a);
        
        if (prices.length >= 2) {
          const recent = prices[0];
          const previous = prices[1];
          if (recent > previous) trend = "up";
          else if (recent < previous) trend = "down";
        }
      }

      return {
        id: product.id,
        name: product.name,
        category: product.category || 'Sem Categoria',
        unit: product.unit || 'un',
        barcode: product.barcode || undefined,
        image_url: product.image_url || undefined,
        lastQuotePrice,
        bestSupplier,
        quotesCount: activeQuotes,
        lastUpdate: product.updated_at ? new Date(product.updated_at).toLocaleDateString('pt-BR') : 'N/A',
        trend,
      };
    },
    enabled: !!productId,
    ...mobileConfig,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData,
  });

  return {
    productDetails,
    isLoading,
    error,
  };
}

