import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StockCountItem } from './useStockCounts';

export function useStockCountItems(stockCountId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['stock-count-items', stockCountId],
    queryFn: async () => {
      if (!stockCountId) return [];

      const { data, error: fetchError } = await supabase
        .from('stock_count_items')
        .select(`
          *,
          sector:stock_sectors(
            id,
            name
          )
        `)
        .eq('stock_count_id', stockCountId)
        .order('product_name', { ascending: true });

      if (fetchError) throw fetchError;
      return data as StockCountItem[];
    },
    enabled: !!stockCountId,
  });

  const updateItem = useMutation({
    mutationFn: async ({
      id,
      quantity_existing,
      quantity_counted,
      notes,
    }: {
      id: string;
      quantity_existing?: number;
      quantity_counted?: number;
      notes?: string;
    }) => {
      const updateData: any = {};
      if (quantity_existing !== undefined) updateData.quantity_existing = quantity_existing;
      if (quantity_counted !== undefined) updateData.quantity_counted = quantity_counted;
      if (notes !== undefined) updateData.notes = notes;

      const { data, error } = await supabase
        .from('stock_count_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-count-items', stockCountId] });
      queryClient.invalidateQueries({ queryKey: ['stock-count-summary', stockCountId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar item',
        description: error.message || 'Não foi possível atualizar o item.',
        variant: 'destructive',
      });
    },
  });

  const updateMultipleItems = useMutation({
    mutationFn: async (updates: Array<{
      id: string;
      quantity_existing?: number;
      quantity_counted?: number;
      notes?: string;
    }>) => {
      const promises = updates.map(update => {
        const updateData: any = {};
        if (update.quantity_existing !== undefined) updateData.quantity_existing = update.quantity_existing;
        if (update.quantity_counted !== undefined) updateData.quantity_counted = update.quantity_counted;
        if (update.notes !== undefined) updateData.notes = update.notes;

        return supabase
          .from('stock_count_items')
          .update(updateData)
          .eq('id', update.id);
      });

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        throw new Error('Alguns itens não puderam ser atualizados');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-count-items', stockCountId] });
      queryClient.invalidateQueries({ queryKey: ['stock-count-summary', stockCountId] });
      toast({
        title: 'Itens atualizados',
        description: 'Os itens foram atualizados com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar itens',
        description: error.message || 'Não foi possível atualizar os itens.',
        variant: 'destructive',
      });
    },
  });

  // Buscar resumo por setor usando a função SQL
  const { data: sectorSummary } = useQuery({
    queryKey: ['stock-count-summary', stockCountId],
    queryFn: async () => {
      if (!stockCountId) return [];

      const { data, error } = await supabase.rpc('get_stock_count_sector_summary', {
        p_stock_count_id: stockCountId,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!stockCountId,
  });

  return {
    items,
    sectorSummary: sectorSummary || [],
    isLoading,
    error,
    updateItem,
    updateMultipleItems,
  };
}






