import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Brand {
  id: string;
  name: string;
  company_id: string;
  manual_rating: number;
  created_at: string;
  updated_at: string;
  purchaseScore?: number;
  productsCount?: number;
}

export function useBrands() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: brands = [], isLoading, error } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Fetch brands
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true });

      if (brandsError) throw brandsError;

      // Fetch products to count them per brand
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, brand_id');

      if (productsError) throw productsError;

      // Fetch order items to calculate purchase score
      const { data: orderItems, error: oiError } = await supabase
        .from('order_items')
        .select(`
          total_price,
          product_id,
          products!inner(brand_id)
        `);

      if (oiError) throw oiError;

      return brandsData.map(brand => {
        const brandProducts = productsData.filter(p => p.brand_id === brand.id);
        const productsCount = brandProducts.length;

        // Calculate purchase score (sum of total_price for all products of this brand)
        const purchaseScore = orderItems
          ?.filter(oi => (oi.products as any)?.brand_id === brand.id)
          .reduce((sum, oi) => sum + Number(oi.total_price || 0), 0) || 0;

        return {
          ...brand,
          productsCount,
          purchaseScore,
        };
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get user's company_id
      const { data: userData, error: userError } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (userError) throw userError;

      const { data, error } = await supabase
        .from('brands')
        .insert({
          name,
          company_id: userData.company_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: "Sucesso",
        description: "Marca criada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a marca",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, manual_rating }: { id: string, name?: string, manual_rating?: number }) => {
      const { data, error } = await supabase
        .from('brands')
        .update({
          ...(name !== undefined && { name }),
          ...(manual_rating !== undefined && { manual_rating }),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: "Sucesso",
        description: "Marca atualizada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a marca",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: "Sucesso",
        description: "Marca excluída com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a marca",
        variant: "destructive",
      });
    },
  });

  return {
    brands,
    isLoading,
    error,
    createBrand: createMutation.mutateAsync,
    updateBrand: updateMutation.mutate,
    deleteBrand: deleteMutation.mutate,
  };
}
