import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';

export interface StockCount {
  id: string;
  order_id: string | null;
  company_id: string;
  user_id: string;
  status: 'pendente' | 'em_andamento' | 'finalizada' | 'cancelada';
  count_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  completed_by?: string;
  order?: {
    id: string;
    supplier_name: string;
    order_date: string;
  } | null;
}

export interface StockCountItem {
  id: string;
  stock_count_id: string;
  order_item_id?: string;
  product_id?: string;
  product_name: string;
  sector_id: string;
  quantity_ordered: number;
  quantity_existing: number;
  quantity_counted: number;
  notes?: string;
  photo_url?: string;
  sector?: {
    id: string;
    name: string;
  };
}

export function useStockCounts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: stockCounts = [], isLoading, error } = useQuery({
    queryKey: ['stock-counts'],
    queryFn: async ({ signal }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Primeiro verificar se há contagens (query mais rápida)
      const { count, error: countError } = await supabase
        .from('stock_counts')
        .select('*', { count: 'exact', head: true })
        .abortSignal(signal);

      if (countError) throw countError;

      // Se não há contagens, retornar array vazio imediatamente
      if (!count || count === 0) {
        return [] as StockCount[];
      }

      // Se há contagens, buscar com join
      const { data, error: fetchError } = await supabase
        .from('stock_counts')
        .select(`
          *,
          order:orders(
            id,
            supplier_name,
            order_date
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100) // Limitar para evitar queries muito grandes
        .abortSignal(signal);

      if (fetchError) throw fetchError;
      return (data || []) as StockCount[];
    },
    enabled: !!user,
    staleTime: 30000, // 30 segundos - dados não ficam obsoletos imediatamente
    gcTime: 300000, // 5 minutos - cache mantido por mais tempo
    // Retornar dados vazios imediatamente se não houver cache
    placeholderData: [],
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

      // Criar contagem (order_id pode ser null se for do zero)
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

          console.log('Criando itens para contagem:', {
            stockCountId: stockCount.id,
            orderItems: order.order_items.length,
            sectors: sectors.length,
          });

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
            console.log('Inserindo itens:', itemsToInsert.length);
            const { error: itemsError } = await supabase
              .from('stock_count_items')
              .insert(itemsToInsert);

            if (itemsError) {
              console.error('Erro ao inserir itens:', itemsError);
              throw new Error(`Erro ao criar itens da contagem: ${itemsError.message}`);
            }
            console.log('Itens inseridos com sucesso');
          }
        } else {
          console.warn('Pedido sem itens:', order);
          throw new Error('O pedido selecionado não possui itens');
        }
      }
      // Se não tiver order_id (criar do zero), não criar itens agora
      // O usuário poderá adicionar itens manualmente depois

      return stockCount;
    },
    onSuccess: () => {
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
      status?: StockCount['status'];
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
    stockCounts,
    isLoading,
    error,
    createStockCount,
    updateStockCount,
    deleteStockCount,
  };
}

