import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PackagingItem } from '@/types/packaging';

export function usePackagingSearch(searchTerm: string) {
  return useQuery({
    queryKey: ['packaging-search', searchTerm],
    queryFn: async () => {
      const cleanTerm = searchTerm.trim();
      if (!cleanTerm) return [];

      const { data, error } = await supabase
        .from('packaging_items')
        .select('*')
        .ilike('name', `%${cleanTerm}%`)
        .order('name', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Erro ao buscar embalagens:', error);
        throw error;
      }

      return data as PackagingItem[];
    },
    enabled: searchTerm.trim().length > 0,
    staleTime: 1000 * 60, // 1 minuto de cache
  });
}
