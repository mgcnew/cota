import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useServerPagination, ServerPaginationParams } from './useServerPagination';
import { useMobileQueryConfig } from './useMobileQueryConfig';

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
}

/**
 * Hook otimizado para mobile - carrega apenas dados essenciais de pedidos
 * Usa paginação server-side para melhor performance
 */
export function usePedidosMobile(
  searchQuery?: string,
  statusFilter?: "all" | "pendente" | "processando" | "confirmado" | "entregue" | "cancelado",
  enabled: boolean = true
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query principal com paginação server-side
  const pagination = useServerPagination<PedidoMobile>({
    queryKey: ['pedidos-mobile', searchQuery, statusFilter],
    enabled,
    queryFn: async (params: ServerPaginationParams) => {
      const { page, pageSize } = params;

      // Verificar autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ usePedidosMobile: Erro de autenticação', authError);
        throw new Error('Usuário não autenticado');
      }
      
      console.log('✅ usePedidosMobile: Usuário autenticado', user.id);

      // Query otimizada - apenas campos essenciais
      console.log('📦 usePedidosMobile: Buscando pedidos', { page, pageSize, searchQuery, statusFilter });
      let query = supabase
        .from('orders')
        .select('id, supplier_name, supplier_id, order_date, delivery_date, status, total_value, observations', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Aplicar busca se houver
      const searchTerm = searchQuery?.trim() || '';
      if (searchTerm) {
        query = query.or(`supplier_name.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
      }

      // Aplicar filtro de status
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Aplicar paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar pedidos mobile:', error);
        throw error;
      }

      console.log('📦 usePedidosMobile: Resultados recebidos', { 
        dataCount: data?.length || 0, 
        totalCount: count || 0,
        sample: data?.slice(0, 2)
      });

      // Buscar contagem de itens em uma única query (mais eficiente)
      const pedidoIds = (data || []).map(p => p.id);
      let itemsCountMap: Record<string, number> = {};
      
      if (pedidoIds.length > 0) {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('order_id')
          .in('order_id', pedidoIds);
        
        // Contar itens por pedido
        itemsCountMap = (itemsData || []).reduce((acc, item) => {
          acc[item.order_id] = (acc[item.order_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }

      // Adicionar contagem de itens aos pedidos
      const pedidosWithItemsCount = (data || []).map((pedido) => ({
        ...pedido,
        items_count: itemsCountMap[pedido.id] || 0,
      }));

      return { data: pedidosWithItemsCount as PedidoMobile[], total: count || 0 };
    },
    initialPageSize: 20, // Menos itens por página no mobile
  });

  const deletePedido = useMutation({
    mutationFn: async (pedidoId: string) => {
      const { error } = await supabase.from('orders').delete().eq('id', pedidoId);
      if (error) throw error;
      return pedidoId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-mobile'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast({ title: "Pedido excluído", description: "O pedido foi excluído com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir pedido", description: err.message, variant: "destructive" });
    },
  });

  return {
    pedidos: pagination.data,
    isLoading: pagination.isLoading,
    error: pagination.error,
    pagination: pagination.pagination,
    refetch: pagination.refetch,
    deletePedido: deletePedido.mutateAsync,
  };
}

