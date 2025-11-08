import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMobileQueryConfig } from './useMobileQueryConfig';

/**
 * Hook para buscar categorias do servidor
 * Otimizado para mobile - cache agressivo, busca apenas quando necessário
 */
export function useCategoriesMobile(enabled: boolean = true) {
  const mobileConfig = useMobileQueryConfig<string[]>();

  const { data: categories = ['all'], isLoading, error } = useQuery({
    queryKey: ['product-categories-mobile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar apenas categorias distintas - query otimizada
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;

      // Usar Set para remover duplicatas de forma eficiente
      const uniqueCategories = Array.from(
        new Set(data.map(p => p.category).filter(Boolean))
      ).sort();

      return ['all', ...uniqueCategories];
    },
    enabled,
    ...mobileConfig,
  });

  return { categories, isLoading, error };
}

