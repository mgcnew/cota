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
      // Verificar autenticação primeiro
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      console.log('[PRODUCTS DEBUG] Fetching products for user:', user.id);

      // Primeiro, obter a contagem total de produtos do usuário
      const { count: totalCount, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) throw countError;

      console.log('[PRODUCTS DEBUG] Total products count for user:', totalCount);

      // Se não há produtos, retornar array vazio
      if (!totalCount || totalCount === 0) {
        console.log('[PRODUCTS DEBUG] No products found for user');
        return [];
      }

      // Implementar paginação para carregar todos os produtos
      const pageSize = 1000; // Tamanho máximo por página
      const totalPages = Math.ceil(totalCount / pageSize);
      const allProducts = [];

      console.log('[PRODUCTS DEBUG] Loading products in', totalPages, 'pages of', pageSize, 'items each');

      // Carregar todos os produtos em lotes
      for (let page = 0; page < totalPages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        console.log(`[PRODUCTS DEBUG] Loading page ${page + 1}/${totalPages} (items ${from}-${to})`);

        const { data: pageData, error: pageError } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (pageError) throw pageError;

        if (pageData && pageData.length > 0) {
          allProducts.push(...pageData);
          console.log(`[PRODUCTS DEBUG] Loaded ${pageData.length} products from page ${page + 1}`);
        }
      }

      console.log('[PRODUCTS DEBUG] Total products loaded:', allProducts.length);
      console.log('[PRODUCTS DEBUG] First 5 products:', allProducts.slice(0, 5).map(p => ({ id: p.id, name: p.name })));

      // Usar allProducts em vez de data
      const data = allProducts;

      // Fetch all quote items to calculate real metrics
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
        `);

      if (qiError) throw qiError;

      // Fetch quote_supplier_items for real prices
      const { data: quoteSupplierItems, error: qsiError } = await supabase
        .from('quote_supplier_items')
        .select(`
          product_id,
          quote_id,
          supplier_id,
          product_name,
          valor_oferecido,
          created_at
        `);

      if (qsiError) throw qsiError;

      // Fetch suppliers to get names
      const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, name');

      if (suppliersError) throw suppliersError;

      // Create a map for quick supplier name lookup
      const supplierMap = new Map(suppliers?.map(s => [s.id, s.name]) || []);

      const formattedProducts: Product[] = data.map(p => {
        // Get all quotes for this product
        const productQuotes = quoteItems?.filter(qi => qi.product_id === p.id) || [];
        const quotesCount = new Set(productQuotes.map(qi => qi.quote_id)).size;

        // Get all price offers for this product from quote_supplier_items
        const productPriceOffers = quoteSupplierItems?.filter(qsi => qsi.product_id === p.id) || [];

        // Group offers by quote_id and find best price per quote
        const quotesBestPrices: Array<{
          quote_id: string;
          created_at: string;
          bestPrice: number;
          supplierName: string;
        }> = [];

        productQuotes.forEach(qi => {
          const quoteOffers = productPriceOffers.filter(po => po.quote_id === qi.quote_id);
          const validOffers = quoteOffers.filter(o => o.valor_oferecido && Number(o.valor_oferecido) > 0);

          if (validOffers.length > 0) {
            const bestOffer = validOffers.reduce((min, o) =>
              Number(o.valor_oferecido) < Number(min.valor_oferecido) ? o : min
            );
            quotesBestPrices.push({
              quote_id: qi.quote_id,
              created_at: qi.quotes?.created_at || '',
              bestPrice: Number(bestOffer.valor_oferecido),
              supplierName: supplierMap.get(bestOffer.supplier_id) || '-'
            });
          }
        });

        // Sort by date to get most recent quotes
        quotesBestPrices.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        let lastQuotePrice = "R$ 0,00";
        let bestSupplier = "-";
        let trend: "up" | "down" | "stable" = "stable";

        if (quotesBestPrices.length > 0) {
          const latestBestPrice = quotesBestPrices[0];
          lastQuotePrice = `R$ ${latestBestPrice.bestPrice.toFixed(2)}`;
          bestSupplier = latestBestPrice.supplierName;

          // Calculate trend if we have at least 2 quotes
          if (quotesBestPrices.length >= 2) {
            const currentPrice = latestBestPrice.bestPrice;
            const previousPrice = quotesBestPrices[1].bestPrice;

            if (currentPrice < previousPrice * 0.95) trend = "down";
            else if (currentPrice > previousPrice * 1.05) trend = "up";
          }
        }

        const lastUpdate = quotesBestPrices.length > 0
          ? new Date(quotesBestPrices[0].created_at).toLocaleDateString('pt-BR')
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

      console.log('[PRODUCTS DEBUG] Total formatted products:', formattedProducts.length);
      console.log('[PRODUCTS DEBUG] Sample formatted products:', formattedProducts.slice(0, 3).map(p => ({ 
        id: p.id, 
        name: p.name, 
        category: p.category,
        quotesCount: p.quotesCount 
      })));

      return formattedProducts;
    },
  });

  const { data: categories = ["all"] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      // Verificar autenticação primeiro
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('user_id', user.id);

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
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
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

  const updateMutation = useMutation({
    mutationFn: async ({ productId, data }: { 
      productId: string, 
      data: { name: string, category: string, weight: string } 
    }) => {
      const { error } = await supabase
        .from('products')
        .update({
          name: data.name,
          category: data.category,
          weight: data.weight || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o produto",
        variant: "destructive",
      });
    },
  });

  const invalidateCache = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['product-categories'] });
  };

  return {
    products,
    categories,
    isLoading,
    error,
    deleteProduct: deleteMutation.mutate,
    updateProduct: updateMutation.mutate,
    invalidateCache,
  };
}
