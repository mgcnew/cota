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

export function usePedidos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pedidos = [], isLoading, error, refetch } = useQuery({
    queryKey: ['pedidos'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

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
            maior_valor_cotado
          )
        `)
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
        })) || [],
      }));

      return formattedPedidos;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (pedidoId: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', pedidoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast({
        title: "Sucesso",
        description: "Pedido excluído com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o pedido",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar status do pedido
  const updateStatusMutation = useMutation({
    mutationFn: async ({ pedidoId, status }: { pedidoId: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', pedidoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast({
        title: "Status atualizado",
        description: "O status do pedido foi atualizado",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
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
      itens: Array<{ itemId: string; quantidadeEntregue: number; unidadeEntregue?: string }>;
    }) => {
      // Atualizar cada item com a quantidade entregue
      for (const item of itens) {
        const { error } = await supabase
          .from('order_items')
          .update({ 
            quantidade_entregue: item.quantidadeEntregue,
            unidade_entregue: item.unidadeEntregue || 'kg'
          })
          .eq('id', item.itemId);

        if (error) throw error;
      }

      // Buscar os itens atualizados para calcular economia real
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('quantidade_entregue, valor_unitario_cotado, maior_valor_cotado')
        .eq('order_id', pedidoId);

      if (itemsError) throw itemsError;

      // Calcular economia real
      let economiaReal = 0;
      for (const item of orderItems || []) {
        if (item.quantidade_entregue && item.valor_unitario_cotado && item.maior_valor_cotado) {
          const diferenca = Number(item.maior_valor_cotado) - Number(item.valor_unitario_cotado);
          economiaReal += diferenca * Number(item.quantidade_entregue);
        }
      }

      // Atualizar pedido com economia real e status entregue
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          economia_real: economiaReal,
          status: 'entregue'
        })
        .eq('id', pedidoId);

      if (orderError) throw orderError;

      return { economiaReal };
    },
    onSuccess: (data) => {
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
