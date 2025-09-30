import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  name: string;
  category: string;
  weight: string;
  lastQuotePrice: string;
  bestSupplier: string;
  quotesCount: number;
  lastUpdate: string;
  trend: "up" | "down" | "stable";
}

export function useProducts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      // Fetch products
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch all quote items to calculate real metrics
      const { data: quoteItems, error: qiError } = await supabase
        .from('quote_items')
        .select(`
          product_id,
          quote_id,
          quotes(
            id,
            status,
            created_at,
            quote_suppliers(
              supplier_name,
              valor_oferecido,
              status
            )
          )
        `);

      if (qiError) throw qiError;

      const formattedProducts: Product[] = data.map(p => {
        // Get all quotes for this product
        const productQuotes = quoteItems?.filter(qi => qi.product_id === p.id) || [];
        const quotesCount = new Set(productQuotes.map(qi => qi.quote_id)).size;

        // Get the most recent quote with valid prices
        const quotesWithPrices = productQuotes
          .filter(qi => {
            const suppliers = qi.quotes?.quote_suppliers || [];
            return suppliers.some(s => s.valor_oferecido && s.valor_oferecido > 0);
          })
          .sort((a, b) => {
            const dateA = new Date(a.quotes?.created_at || 0).getTime();
            const dateB = new Date(b.quotes?.created_at || 0).getTime();
            return dateB - dateA;
          });

        let lastQuotePrice = "R$ 0,00";
        let bestSupplier = "-";
        let trend: "up" | "down" | "stable" = "stable";

        if (quotesWithPrices.length > 0) {
          const latestQuote = quotesWithPrices[0];
          const suppliers = latestQuote.quotes?.quote_suppliers || [];
          
          // Find best price and supplier
          const validSuppliers = suppliers.filter(s => s.valor_oferecido && s.valor_oferecido > 0);
          if (validSuppliers.length > 0) {
            const bestOffer = validSuppliers.reduce((min, s) => 
              Number(s.valor_oferecido) < Number(min.valor_oferecido) ? s : min
            );
            lastQuotePrice = `R$ ${Number(bestOffer.valor_oferecido).toFixed(2)}`;
            bestSupplier = bestOffer.supplier_name;

            // Calculate trend if we have at least 2 quotes
            if (quotesWithPrices.length >= 2) {
              const previousQuote = quotesWithPrices[1];
              const prevSuppliers = previousQuote.quotes?.quote_suppliers || [];
              const prevValidSuppliers = prevSuppliers.filter(s => s.valor_oferecido && s.valor_oferecido > 0);
              
              if (prevValidSuppliers.length > 0) {
                const prevBest = prevValidSuppliers.reduce((min, s) => 
                  Number(s.valor_oferecido) < Number(min.valor_oferecido) ? s : min
                );
                const currentPrice = Number(bestOffer.valor_oferecido);
                const previousPrice = Number(prevBest.valor_oferecido);
                
                if (currentPrice < previousPrice * 0.95) trend = "down";
                else if (currentPrice > previousPrice * 1.05) trend = "up";
              }
            }
          }
        }

        const lastUpdate = quotesWithPrices.length > 0
          ? new Date(quotesWithPrices[0].quotes?.created_at || p.created_at).toLocaleDateString('pt-BR')
          : new Date(p.created_at).toLocaleDateString('pt-BR');

        return {
          id: p.id,
          name: p.name,
          category: p.category,
          weight: p.weight || "N/A",
          lastQuotePrice,
          bestSupplier,
          quotesCount,
          lastUpdate,
          trend,
        };
      });

      return formattedProducts;
    },
  });

  const { data: categories = ["all"] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category');

      if (error) throw error;

      const uniqueCategories = Array.from(new Set(data.map(p => p.category)));
      return ["all", ...uniqueCategories];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Sucesso",
        description: "Produto excluído com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto",
        variant: "destructive",
      });
    },
  });

  return {
    products,
    categories,
    isLoading,
    error,
    deleteProduct: deleteMutation.mutate,
  };
}
