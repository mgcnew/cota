import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useServerPagination, ServerPaginationParams } from './useServerPagination';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMobileQueryConfig } from './useMobileQueryConfig';

export interface StockCountMobile {
  id: string;
  order_id: string | null;
  status: 'pendente' | 'em_andamento' | 'finalizada' | 'cancelada';
  count_date: string;
  notes?: string;
  supplier_name?: string; // Do join com orders
  order_date?: string; // Do join com orders
}

/**
 * Hook otimizado para mobile - carrega apenas dados essenciais de contagens de estoque
 * Usa paginação server-side para melhor performance
 */
export function useStockCountsMobile(
  searchQuery?: string,
  statusFilter?: "all" | "pendente" | "em_andamento" | "finalizada" | "cancelada",
  enabled: boolean = true
) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Configuração otimizada para mobile
  const mobileConfig = useMobileQueryConfig();
  
  // Query principal com paginação server-side
  const pagination = useServerPagination<StockCountMobile>({
    queryKey: ['stock-counts-mobile', searchQuery, statusFilter],
    enabled: enabled && !!user,
    staleTime: mobileConfig.staleTime,
    gcTime: mobileConfig.gcTime,
    refetchOnWindowFocus: mobileConfig.refetchOnWindowFocus,
    refetchOnMount: mobileConfig.refetchOnMount,
    retry: mobileConfig.retry,
    queryFn: async (params: ServerPaginationParams) => {
      const { page, pageSize } = params;

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Query otimizada - apenas campos essenciais com join simplificado
      let query = supabase
        .from('stock_counts')
        .select(`
          id,
          order_id,
          status,
          count_date,
          notes,
          order:orders(
            supplier_name,
            order_date
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Aplicar busca se houver
      const searchTerm = searchQuery?.trim() || '';
      if (searchTerm) {
        // Buscar por supplier_name (via join) ou notes
        // Como não podemos fazer OR direto com join, vamos fazer duas queries ou filtrar client-side
        // Por enquanto, vamos buscar apenas por notes e depois filtrar por supplier_name client-side
        query = query.or(`notes.ilike.%${searchTerm}%`);
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
        console.error('Erro ao buscar contagens mobile:', error);
        throw error;
      }

      // Transformar dados para formato mobile
      const stockCountsMobile: StockCountMobile[] = (data || []).map((count: any) => ({
        id: count.id,
        order_id: count.order_id,
        status: count.status,
        count_date: count.count_date,
        notes: count.notes,
        supplier_name: count.order?.supplier_name || null,
        order_date: count.order?.order_date || null,
      }));

      // Filtrar por supplier_name se houver busca (client-side após fetch)
      // Otimização: só filtrar se realmente houver searchTerm
      let filteredCounts = stockCountsMobile;
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filteredCounts = stockCountsMobile.filter(count => {
          const matchesNotes = count.notes?.toLowerCase().includes(searchLower);
          const matchesSupplier = count.supplier_name?.toLowerCase().includes(searchLower);
          return matchesNotes || matchesSupplier;
        });
      }

      return { data: filteredCounts, total: count || 0 };
    },
    initialPageSize: 15, // Reduzido para melhor performance no mobile
  });

  const createStockCount = useMutation({
    mutationFn: async (data: {
      order_id?: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Obter company_id do usuário
      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!companyUser) throw new Error('Empresa não encontrada');

      // Se tiver order_id, validar que o pedido existe
      if (data.order_id) {
        const { data: order } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', data.order_id)
          .single();

        if (!order) throw new Error('Pedido não encontrado');
      }

      // Criar contagem
      const { data: stockCount, error: countError } = await supabase
        .from('stock_counts')
        .insert({
          order_id: data.order_id || null,
          company_id: companyUser.company_id,
          user_id: user.id,
          notes: data.notes,
          status: 'pendente',
        })
        .select()
        .single();

      if (countError) throw countError;

      // Se tiver order_id, criar itens da contagem para cada item do pedido
      if (data.order_id) {
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select(`
            id,
            order_items (
              id,
              product_id,
              product_name,
              quantity
            )
          `)
          .eq('id', data.order_id)
          .single();

        if (orderError) {
          console.error('Erro ao buscar pedido:', orderError);
          throw new Error('Não foi possível buscar os itens do pedido');
        }

        if (order && order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0) {
          // Obter setores ativos da empresa
          const { data: sectors, error: sectorsError } = await supabase
            .from('stock_sectors')
            .select('id, name')
            .eq('company_id', companyUser.company_id)
            .eq('is_active', true);

          if (sectorsError) {
            console.error('Erro ao buscar setores:', sectorsError);
            throw new Error('Não foi possível buscar os setores');
          }

          if (!sectors || sectors.length === 0) {
            throw new Error('Nenhum setor ativo encontrado. Crie pelo menos um setor antes de criar a contagem.');
          }

          const itemsToInsert = [];
          
          for (const orderItem of order.order_items) {
            for (const sector of sectors) {
              itemsToInsert.push({
                stock_count_id: stockCount.id,
                order_item_id: orderItem.id,
                product_id: orderItem.product_id,
                product_name: orderItem.product_name,
                sector_id: sector.id,
                quantity_ordered: Number(orderItem.quantity) || 0,
                quantity_existing: 0,
                quantity_counted: 0,
              });
            }
          }

          if (itemsToInsert.length > 0) {
            const { error: itemsError } = await supabase
              .from('stock_count_items')
              .insert(itemsToInsert);

            if (itemsError) {
              console.error('Erro ao inserir itens:', itemsError);
              throw new Error(`Erro ao criar itens da contagem: ${itemsError.message}`);
            }
          }
        } else {
          throw new Error('O pedido selecionado não possui itens');
        }
      }

      return stockCount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-counts-mobile'] });
      queryClient.invalidateQueries({ queryKey: ['stock-counts'] });
      toast({
        title: 'Contagem criada',
        description: 'A contagem de estoque foi criada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar contagem',
        description: error.message || 'Não foi possível criar a contagem.',
        variant: 'destructive',
      });
    },
  });

  const updateStockCount = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status?: 'pendente' | 'em_andamento' | 'finalizada' | 'cancelada';
      notes?: string;
    }) => {
      const updateData: any = {};
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      
      if (status === 'finalizada') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = user?.id;
      }

      const { data, error } = await supabase
        .from('stock_counts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-counts-mobile'] });
      queryClient.invalidateQueries({ queryKey: ['stock-counts'] });
      toast({
        title: 'Contagem atualizada',
        description: 'A contagem foi atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar contagem',
        description: error.message || 'Não foi possível atualizar a contagem.',
        variant: 'destructive',
      });
    },
  });

  const deleteStockCount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stock_counts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-counts-mobile'] });
      queryClient.invalidateQueries({ queryKey: ['stock-counts'] });
      toast({
        title: 'Contagem excluída',
        description: 'A contagem foi excluída com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir contagem',
        description: error.message || 'Não foi possível excluir a contagem.',
        variant: 'destructive',
      });
    },
  });

  return {
    stockCounts: pagination.data,
    isLoading: pagination.isLoading,
    error: pagination.error,
    pagination: pagination.pagination,
    refetch: pagination.refetch,
    createStockCount: createStockCount.mutateAsync,
    updateStockCount: updateStockCount.mutateAsync,
    deleteStockCount: deleteStockCount.mutateAsync,
  };
}

