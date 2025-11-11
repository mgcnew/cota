import { useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/utils/formatters';

export interface PedidoMobile {
  id: string;
  supplier_name: string;
  supplier_id?: string | null;
  order_date: string;
  delivery_date: string;
  status: string;
  total_value: number;
  observations?: string;
  items_count?: number;
  // Campos pré-formatados para evitar processamento no componente
  total_value_formatted?: string;
  order_date_formatted?: string;
  delivery_date_formatted?: string;
}

export function usePedidosMobileInfinite(options: { searchQuery?: string; statusFilter?: string } = {}) {
  const { searchQuery = '', statusFilter = 'all' } = options;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const pageSize = 20;

  const query = useInfiniteQuery({
    queryKey: ['pedidos-mobile-infinite', searchQuery, statusFilter],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let q = supabase
        .from('orders')
        .select('id, supplier_name, supplier_id, order_date, delivery_date, status, total_value, observations', { count: 'exact' })
        .order('created_at', { ascending: false });

      const term = searchQuery.trim();
      if (term) {
        q = q.or(`supplier_name.ilike.%${term}%,id.ilike.%${term}%`);
      }
      if (statusFilter && statusFilter !== 'all') {
        q = q.eq('status', statusFilter);
      }

      const from = pageParam * pageSize;
      const to = from + pageSize - 1;
      q = q.range(from, to);

      const { data, error, count } = await q;
      if (error) throw error;

      const ids = (data || []).map(d => d.id);
      let itemsCountMap: Record<string, number> = {};
      if (ids.length) {
        const { data: items } = await supabase
          .from('order_items')
          .select('order_id')
          .in('order_id', ids);
        itemsCountMap = (items || []).reduce((acc, it: any) => {
          acc[it.order_id] = (acc[it.order_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }

      const rows: PedidoMobile[] = (data || []).map((p) => ({
        ...p,
        total_value: Number(p.total_value),
        items_count: itemsCountMap[p.id] || 0,
        // Pré-formatar dados para evitar processamento no render
        total_value_formatted: formatCurrency(Number(p.total_value)),
        order_date_formatted: formatDate(p.order_date),
        delivery_date_formatted: p.delivery_date ? formatDate(p.delivery_date) : '',
      }));

      const nextPage = data && data.length === pageSize ? pageParam + 1 : undefined;
      return { rows, nextPage, total: count || 0 };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 60_000,
  });

  const pedidos = useMemo(() => {
    const pages = query.data?.pages || [];
    const map = new Map<string, PedidoMobile>();
    pages.forEach(p => p.rows.forEach(row => map.set(row.id, row)));
    return Array.from(map.values());
  }, [query.data?.pages]);

  const deletePedido = useMutation({
    mutationFn: async (pedidoId: string) => {
      const { error } = await supabase.from('orders').delete().eq('id', pedidoId);
      if (error) throw error;
      return pedidoId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-mobile-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast({ title: 'Pedido excluído', description: 'O pedido foi excluído com sucesso.' });
    },
  });

  return {
    pedidos,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: !!query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    error: query.error as Error | null,
    deletePedido: deletePedido.mutateAsync,
  };
}
