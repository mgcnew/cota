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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProducts: Product[] = data.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        weight: p.weight || "N/A",
        lastQuotePrice: "R$ 0,00",
        bestSupplier: "-",
        quotesCount: 0,
        lastUpdate: new Date(p.created_at).toLocaleDateString('pt-BR'),
        trend: "stable" as const,
      }));

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
