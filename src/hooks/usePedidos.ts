import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PedidoItem {
  id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  quantidade_pedida?: number | null;
  unidade_pedida?: string | null;
  quantidade_entregue?: number | null;
  unidade_entregue?: string | null;
  valor_unitario_cotado?: number | null;
  maior_valor_cotado?: number | null;
  quantidade_por_embalagem?: number | null;
  brand_name?: string | null;
}

export interface Pedido {
  id: string;
  supplier_name: string;
  supplier_id?: string | null;
  order_date: string;
  delivery_date: string;
  status: string;
  total_value: number;
  observations?: string;
  quote_id?: string | null; // NULL = pedido direto, preenchido = veio de cotação
  economia_estimada?: number;
  economia_real?: number;
  diferenca_preco_kg?: number;
  items?: PedidoItem[];
}

// Global flag to prevent multiple subscriptions across hook instances
let isRealtimeSubscribed = false;
let globalChannel: ReturnType<typeof supabase.channel> | null = null;

// Deduplication guard — tracks when the last local mutation completed
// If realtime fires within this window, we skip the invalidation (mutation already handled it)
let lastMutationTimestamp = 0;
const DEDUP_WINDOW_MS = 1500;

function markMutationComplete() {
  lastMutationTimestamp = Date.now();
  console.log("🕒 Mutation marked as complete in usePedidos");
}

function shouldSkipRealtimeInvalidation(): boolean {
  const skip = (Date.now() - lastMutationTimestamp) < DEDUP_WINDOW_MS;
  if (skip) console.log("⏭️ Skipped redundant Realtime refetch in usePedidos");
  return skip;
}

export function usePedidos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ==========================================
  // REALTIME SUBSCRIPTION
  // Listen for changes in orders and their items
  // ==========================================
  useEffect(() => {
    if (isRealtimeSubscribed && globalChannel) return;

    console.log("📡 Initializing Unified Realtime for Pedidos...");
    isRealtimeSubscribed = true;

    globalChannel = supabase
      .channel('orders-realtime-global')
      .on('postgres_changes' as any, { event: '*', table: 'orders' }, (payload: any) => {
        if (shouldSkipRealtimeInvalidation()) return;
        console.log("🔄 Orders changed (Realtime), invalidating...", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      })
      .on('postgres_changes' as any, { event: '*', table: 'order_items' }, () => {
        if (shouldSkipRealtimeInvalidation()) return;
        queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      })
      .subscribe();

    return () => {
      // Keep alive for other hook instances
    };
  }, [queryClient]);

  const { data: pedidos = [], isLoading, error, refetch } = useQuery({
    queryKey: ['pedidos'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const dateFilter = sixMonthsAgo.toISOString().split('T')[0];

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            id,
            product_name,
            quantity,
            unit_price,
            total_price,
            quantidade_pedida,
            unidade_pedida,
            quantidade_entregue,
            unidade_entregue,
            valor_unitario_cotado,
            maior_valor_cotado,
            quantidade_por_embalagem
          )
        `)
        .gte('created_at', dateFilter)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const formattedPedidos: Pedido[] = ordersData.map(o => ({
        id: o.id,
        supplier_name: o.supplier_name,
        supplier_id: o.supplier_id || null,
        order_date: o.order_date,
        delivery_date: o.delivery_date,
        status: o.status,
        total_value: Number(o.total_value),
        observations: o.observations || undefined,
        quote_id: o.quote_id || null,
        economia_estimada: Number(o.economia_estimada) || 0,
        economia_real: Number(o.economia_real) || 0,
        diferenca_preco_kg: Number(o.diferenca_preco_kg) || 0,
        items: o.order_items?.map((item: any) => ({
          id: item.id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          total_price: Number(item.total_price),
          quantidade_pedida: item.quantidade_pedida ? Number(item.quantidade_pedida) : null,
          unidade_pedida: item.unidade_pedida || null,
          quantidade_entregue: item.quantidade_entregue ? Number(item.quantidade_entregue) : null,
          unidade_entregue: item.unidade_entregue || null,
          valor_unitario_cotado: item.valor_unitario_cotado ? Number(item.valor_unitario_cotado) : null,
          maior_valor_cotado: item.maior_valor_cotado ? Number(item.maior_valor_cotado) : null,
          quantidade_por_embalagem: item.quantidade_por_embalagem ? Number(item.quantidade_por_embalagem) : null,
        })) || [],
      }));

      return formattedPedidos;
    },
    staleTime: 60 * 1000, // 1 minuto - dados frescos por pouco tempo
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: 'always', // Always refetch on mount to pick up orders created from cotacoes conversion
  });

  const deleteMutation = useMutation({
    mutationFn: async (pedidoId: string) => {
      // Check order status first
      const { data: order, error: statusError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', pedidoId)
        .single();
      
      if (statusError) throw statusError;
      if (order?.status === 'entregue') {
        throw new Error("Este pedido já foi entregue e não pode ser excluído.");
      }

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', pedidoId);

      if (error) throw error;
    },
    onMutate: async (pedidoId) => {
      await queryClient.cancelQueries({ queryKey: ['pedidos'] });
      const previousPedidos = queryClient.getQueryData<Pedido[]>(['pedidos']);
      
      if (previousPedidos) {
        queryClient.setQueryData<Pedido[]>(['pedidos'], 
          previousPedidos.filter(p => p.id !== pedidoId)
        );
      }
      
      return { previousPedidos };
    },
    onSuccess: () => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast({
        title: "Sucesso",
        description: "Pedido excluído com sucesso",
      });
    },
    onError: (error, _pedidoId, context) => {
      if (context?.previousPedidos) {
        queryClient.setQueryData(['pedidos'], context.previousPedidos);
      }
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível excluir o pedido",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar status do pedido
  const updateStatusMutation = useMutation({
    mutationFn: async ({ pedidoId, status }: { pedidoId: string; status: string }) => {
      // Check order status first
      const { data: order, error: statusError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', pedidoId)
        .single();
      
      if (statusError) throw statusError;
      if (order?.status === 'entregue') {
        throw new Error("Este pedido já foi entregue e não pode ser alterado.");
      }

      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', pedidoId);

      if (error) throw error;
    },
    onMutate: async ({ pedidoId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['pedidos'] });
      const previousPedidos = queryClient.getQueryData<Pedido[]>(['pedidos']);
      
      if (previousPedidos) {
        queryClient.setQueryData<Pedido[]>(['pedidos'], 
          previousPedidos.map(p => p.id === pedidoId ? { ...p, status } : p)
        );
      }
      
      return { previousPedidos };
    },
    onSuccess: () => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast({
        title: "Status atualizado",
        description: "O status do pedido foi atualizado",
      });
    },
    onError: (error, _variables, context) => {
      if (context?.previousPedidos) {
        queryClient.setQueryData(['pedidos'], context.previousPedidos);
      }
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o status",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar quantidade entregue (quando nota chega)
  const updateQuantidadeEntregueMutation = useMutation({
    mutationFn: async ({ 
      pedidoId, 
      itens 
    }: { 
      pedidoId: string; 
      itens: Array<{ itemId: string; quantidadeEntregue: number; unidadeEntregue?: string; valorFaturado: number; fatorEmbalagem?: number }>;
    }) => {
      // Check order status first
      const { data: order, error: statusError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', pedidoId)
        .single();
      
      if (statusError) throw statusError;
      if (order?.status === 'entregue') {
        throw new Error("Este pedido já foi entregue e não pode ser alterado.");
      }

      // Atualizar cada item com a quantidade entregue e o Preço Faturado
      for (const item of itens) {
        const { error } = await supabase
          .from('order_items')
          .update({ 
            quantidade_entregue: item.quantidadeEntregue,
            unidade_entregue: item.unidadeEntregue || 'kg',
            unit_price: item.valorFaturado, // Atualiza para o valor real da nota
            total_price: item.quantidadeEntregue * item.valorFaturado * (item.fatorEmbalagem || 1)
          })
          .eq('id', item.itemId);

        if (error) throw error;
      }

      // Buscar os itens atualizados para calcular economia real global da NFe
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('quantidade_entregue, unit_price, valor_unitario_cotado, maior_valor_cotado')
        .eq('order_id', pedidoId);

      if (itemsError) throw itemsError;

      // Calcular economia real considerando o unit_price (que agora é o valor faturado da NFe) vs maior_valor de base
      let economiaReal = 0;
      let totalValueAtualizado = 0;
      
      for (const item of orderItems || []) {
        const passedItem = itens.find(i => i.itemId === item.id);
        const fator = passedItem?.fatorEmbalagem || 1;

        if (item.quantidade_entregue && item.unit_price && item.maior_valor_cotado) {
          // A Economia da NFe é a diferença do "melhor valor que ele ia pagar" pelo valor REAL que a NFe cobrou
          const diferenca = Number(item.maior_valor_cotado) - Number(item.unit_price);
          economiaReal += diferenca * Number(item.quantidade_entregue) * fator;
        }
        if (item.quantidade_entregue && item.unit_price) {
          totalValueAtualizado += Number(item.quantidade_entregue) * Number(item.unit_price) * fator;
        }
      }

      // Atualizar pedido com economia real e novo Total consolidado, fechar o ciclo
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          economia_real: economiaReal,
          total_value: totalValueAtualizado,
          status: 'entregue'
        })
        .eq('id', pedidoId);

      if (orderError) throw orderError;

      return { economiaReal };
    },
    onSuccess: (data) => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast({
        title: "Entrega registrada!",
        description: data.economiaReal > 0 
          ? `Economia real calculada: R$ ${data.economiaReal.toFixed(2)}`
          : "Quantidades atualizadas com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível registrar a entrega",
        variant: "destructive",
      });
    },
  });

  return {
    pedidos,
    isLoading,
    error,
    deletePedido: deleteMutation.mutate,
    updatePedidoStatus: updateStatusMutation.mutate,
    updateQuantidadeEntregue: updateQuantidadeEntregueMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending || updateQuantidadeEntregueMutation.isPending,
    refetch: async () => {
      await refetch();
    },
  };
}
