import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Pedido {
  id: string;
  supplier_name: string;
  supplier_id?: string | null;
  order_date: string;
  delivery_date: string;
  status: string;
  total_value: number;
  observations?: string;
  items?: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
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
            product_name,
            quantity,
            unit_price,
            total_price
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
        items: o.order_items?.map((item: any) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          total_price: Number(item.total_price),
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

  return {
    pedidos,
    isLoading,
    error,
    deletePedido: deleteMutation.mutate,
    updatePedidoStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
    refetch: async () => {
      await refetch();
    },
  };
}
