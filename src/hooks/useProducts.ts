import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  brand_id?: string;
  brand_name?: string;
  brand_rating?: number;
  brand_score?: number;
  barcode?: string;
  image_url?: string;
  lastOrderPrice: string;
  bestSupplier: string;
  quotesCount: number;
  lastUpdate: string;
  trend: "up" | "down" | "stable";
}

export function useProducts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      console.log('[PRODUCTS DEBUG] Fetching products for user:', user.id);

      // Primeiro, obter a contagem total de produtos (RLS filtra por company_id automaticamente)
      const { count: totalCount, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

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
          .select('*, brands(id, name, manual_rating)')
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

      // Fetch order_items for real prices from closed orders
      const { data: orderItems, error: oiError } = await supabase
        .from('order_items')
        .select(`
          product_id,
          order_id,
          unit_price,
          created_at,
          orders!inner(
            id,
            supplier_name,
            status,
            created_at
          )
        `);

      if (oiError) throw oiError;

      const formattedProducts: Product[] = data.map(p => {
        // Get all quotes for this product
        const productQuotes = quoteItems?.filter(qi => qi.product_id === p.id) || [];
        const quotesCount = new Set(productQuotes.map(qi => qi.quote_id)).size;

        // Get all order items for this product from CONFIRMED orders
        // Only include orders that are NOT "cancelado"
        const productOrderItems = orderItems?.filter(oi => 
          oi.product_id === p.id && 
          oi.orders?.status !== 'cancelado'
        ) || [];

        // Group order items by order and get prices
        const orderPrices: Array<{
          order_id: string;
          created_at: string;
          price: number;
          supplierName: string;
        }> = [];

        productOrderItems.forEach(oi => {
          if (oi.unit_price && Number(oi.unit_price) > 0) {
            orderPrices.push({
              order_id: oi.order_id,
              created_at: oi.orders?.created_at || oi.created_at,
              price: Number(oi.unit_price),
              supplierName: oi.orders?.supplier_name || '-'
            });
          }
        });

        // Sort by date to get most recent orders
        orderPrices.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        let lastOrderPrice = "R$ 0,00";
        let bestSupplier = "-";
        let trend: "up" | "down" | "stable" = "stable";
        let lastOrderTimestamp: number | null = null;

        if (orderPrices.length > 0) {
          const latestOrderPrice = orderPrices[0];
          lastOrderPrice = `R$ ${latestOrderPrice.price.toFixed(2)}`;
          bestSupplier = latestOrderPrice.supplierName;
          lastOrderTimestamp = new Date(latestOrderPrice.created_at).getTime();

          // Calculate trend if we have at least 2 orders
          if (orderPrices.length >= 2) {
            const currentPrice = latestOrderPrice.price;
            const previousPrice = orderPrices[1].price;

            if (currentPrice < previousPrice * 0.95) trend = "down";
            else if (currentPrice > previousPrice * 1.05) trend = "up";
          }
        }

        const lastUpdate = orderPrices.length > 0
          ? new Date(orderPrices[0].created_at).toLocaleDateString('pt-BR')
          : new Date(p.created_at).toLocaleDateString('pt-BR');

        return {
          id: p.id,
          name: p.name,
          category: p.category,
          unit: p.unit || "un",
          brand_id: p.brand_id,
          brand_name: p.brands?.name,
          brand_rating: p.brands?.manual_rating,
          barcode: p.barcode,
          image_url: p.image_url,
          lastOrderPrice, // Repurposed to show last order price
          bestSupplier,
          quotesCount,
          lastUpdate,
          trend,
          _lastOrderTimestamp: lastOrderTimestamp, // Internal field for sorting
        };
      });

      // Sort products: those with recent orders first, then by created_at
      formattedProducts.sort((a, b) => {
        const aTimestamp = (a as any)._lastOrderTimestamp;
        const bTimestamp = (b as any)._lastOrderTimestamp;
        
        // Products with orders come first
        if (aTimestamp && !bTimestamp) return -1;
        if (!aTimestamp && bTimestamp) return 1;
        
        // Both have orders: sort by most recent order
        if (aTimestamp && bTimestamp) {
          return bTimestamp - aTimestamp;
        }
        
        // Neither has orders: maintain original order (by created_at)
        return 0;
      });

      // Remove internal sorting field before returning
      const cleanedProducts = formattedProducts.map(({ _lastOrderTimestamp, ...rest }: any) => rest as Product);

      console.log('[PRODUCTS DEBUG] Total formatted products:', cleanedProducts.length);
      
      // Ensure unique products by ID to prevent duplicate key warnings
      const uniqueProducts = Array.from(new Map(cleanedProducts.map(p => [p.id, p])).values());
      
      if (uniqueProducts.length !== cleanedProducts.length) {
        console.warn(`[PRODUCTS DEBUG] Found ${cleanedProducts.length - uniqueProducts.length} duplicate products. Filtered them out.`);
      }

      console.log('[PRODUCTS DEBUG] Total unique products:', uniqueProducts.length);
      return uniqueProducts;
    },
  });

  const { data: categories = ["all"] } = useQuery({
    queryKey: ['product-categories', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

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
      data: { name: string, category: string, unit: string, brand_id?: string, barcode?: string } 
    }) => {
      const { error } = await supabase
        .from('products')
        .update({
          name: data.name,
          category: data.category,
          unit: data.unit,
          brand_id: data.brand_id || null,
          barcode: data.barcode || null,
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
