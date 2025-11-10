import { useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseSmart } from './useSupabaseSmart';

export interface ProductMobile {
  id: string;
  name: string;
  category: string;
  unit: string;
  barcode?: string;
  image_url?: string;
  // Campos essenciais apenas - sem cálculos pesados
}

export interface ProductMobileFull extends ProductMobile {
  lastQuotePrice: string;
  bestSupplier: string;
  quotesCount: number;
  lastUpdate: string;
  trend: "up" | "down" | "stable";
}

export interface UseProductsMobileOptions {
  searchQuery?: string;
  categoryFilter?: string;
}

/**
 * Hook ultra-otimizado para produtos no mobile com infinite scroll
 * 
 * Características:
 * - Infinite scroll com useInfiniteQuery
 * - Paginação server-side (limit 10)
 * - Filtros server-side (search, category)
 * - Campos essenciais apenas (sem JOINs pesados)
 * - Cache agressivo (5 minutos)
 * - Mutations (create, update, delete)
 * - Zero carregamentos desnecessários
 */
export function useProductsMobile(options: UseProductsMobileOptions = {}) {
  const { searchQuery = '', categoryFilter = 'all' } = options;
  const supabaseSmart = useSupabaseSmart();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Memoizar limit para evitar recalculos
  const limit = useMemo(() => supabaseSmart.getLimit(), [supabaseSmart]);

  // Infinite query para carregar páginas progressivamente
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useInfiniteQuery<{
    data: ProductMobile[];
    nextPage: number | undefined;
    total: number;
  }, Error>({
    queryKey: ['products-mobile', searchQuery, categoryFilter, limit],
    queryFn: async ({ pageParam = 0 }) => {
      const page = typeof pageParam === 'number' ? pageParam : 0;
      const from = page * limit;
      const to = from + limit - 1;

      // Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Query otimizada - apenas campos essenciais
      let query = supabase
        .from('products')
        .select('id, name, category, unit, barcode, image_url', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Aplicar busca server-side
      const searchTerm = searchQuery?.trim() || '';
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }

      // Aplicar filtro de categoria server-side
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      // Aplicar range para paginação
      query = query.range(from, to);

      const { data: productsData, error: productsError, count } = await query;

      if (productsError) throw productsError;

      if (!productsData || productsData.length === 0) {
        return {
          data: [],
          nextPage: undefined,
          total: count || 0,
        };
      }

      // Retornar produtos formatados
      const products: ProductMobile[] = productsData.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category || 'Sem Categoria',
        unit: product.unit || 'un',
        barcode: product.barcode || undefined,
        image_url: product.image_url || undefined,
      }));

      // Calcular próxima página
      const hasMore = to < (count || 0) - 1;
      const nextPage = hasMore ? page + 1 : undefined;

      return {
        data: products,
        nextPage,
        total: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
  });

  // Flatten products de todas as páginas com deduplicação
  const products = useMemo(() => {
    if (!data?.pages) return [];
    
    // Usar Map para garantir unicidade por ID
    const uniqueProducts = new Map<string, ProductMobile>();
    
    data.pages.forEach((page) => {
      page.data.forEach((product) => {
        uniqueProducts.set(product.id, product);
      });
    });
    
    return Array.from(uniqueProducts.values());
  }, [data?.pages]);

  // Mutation para criar produto
  const createProduct = useMutation({
    mutationFn: async (productData: {
      name: string;
      category: string;
      unit: string;
      barcode?: string;
      weight?: string;
      image_url?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar company_id do usuário
      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!companyUser) throw new Error('Empresa não encontrada');

      const { data, error } = await supabase
        .from('products')
        .insert({
          ...productData,
          company_id: companyUser.company_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidação seletiva - apenas queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['products-mobile'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Produto criado",
        description: "O produto foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar produto",
        description: error.message || "Não foi possível criar o produto.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar produto
  const updateProduct = useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: Partial<ProductMobile> }) => {
      const { error } = await supabase
        .from('products')
        .update(data)
        .eq('id', productId);

      if (error) throw error;
      return { id: productId, ...data };
    },
    onSuccess: () => {
      // Invalidação seletiva
      queryClient.invalidateQueries({ queryKey: ['products-mobile'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message || "Não foi possível atualizar o produto.",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar produto
  const deleteProduct = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidação seletiva
      queryClient.invalidateQueries({ queryKey: ['products-mobile'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
        variant: "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir produto",
        description: error.message || "Não foi possível excluir o produto.",
        variant: "destructive",
      });
    },
  });

  return {
    products,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
