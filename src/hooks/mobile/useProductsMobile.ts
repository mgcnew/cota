import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMobileQueryConfig } from './useMobileQueryConfig';
import { useServerPagination, ServerPaginationParams } from './useServerPagination';

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

/**
 * Hook otimizado para mobile - carrega apenas dados essenciais
 * Usa paginação server-side para melhor performance
 */
export function useProductsMobile(searchQuery?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const mobileConfig = useMobileQueryConfig();

  // Query principal com paginação server-side
  const pagination = useServerPagination<ProductMobile>({
    queryKey: ['products-mobile', searchQuery],
    queryFn: async (params: ServerPaginationParams) => {
      const { page, pageSize } = params;

      // Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Query otimizada - apenas campos essenciais
      let query = supabase
        .from('products')
        .select('id, name, category, unit, barcode, image_url', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Aplicar busca se houver (usa o searchQuery passado como parâmetro)
      // Se searchQuery mudar, a query será refeita automaticamente devido ao queryKey
      const searchTerm = searchQuery?.trim() || '';
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      // Aplicar paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: (data || []) as ProductMobile[],
        total: count || 0,
      };
    },
    initialPageSize: 20, // Mobile: 20 itens por página
  });

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
      queryClient.invalidateQueries({ queryKey: ['products-mobile'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Invalida também a versão desktop
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
    products: pagination.data,
    isLoading: pagination.isLoading,
    error: pagination.error,
    pagination: pagination.pagination,
    refetch: pagination.refetch,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}

