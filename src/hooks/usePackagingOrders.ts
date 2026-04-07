import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { PackagingOrderDisplay, PackagingOrderItemDisplay } from '@/types/packaging';

// Global flag to prevent multiple subscriptions
let isRealtimeSubscribed = false;

export function usePackagingOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Ativar Realtime para Pedidos de Embalagem
  useEffect(() => {
    if (isRealtimeSubscribed) return;
    
    isRealtimeSubscribed = true;
    
    const channel = supabase
      .channel('packaging-orders-realtime')
      .on('postgres_changes' as any, { 
        event: '*', 
        schema: 'public', 
        table: 'packaging_orders' 
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['packaging-orders'] });
      })
      .on('postgres_changes' as any, { 
        event: '*', 
        schema: 'public', 
        table: 'packaging_order_items' 
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['packaging-orders'] });
      })
      .subscribe();

    return () => {
      // Mantemos o canal aberto para sincronização global durante a sessão
    };
  }, [queryClient]);

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['packaging-orders'],
    staleTime: 1000 * 60 * 5, // 5 minutos - evita refetch desnecessário
    refetchOnWindowFocus: false, // Não refaz query ao focar na janela
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar pedidos
      const { data: ordersData, error: ordersError } = await (supabase
        .from('packaging_orders' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any);

      if (ordersError) {
        console.error('Erro ao buscar pedidos de embalagens:', ordersError);
        throw ordersError;
      }

      if (!ordersData || ordersData.length === 0) {
        return [];
      }

      // Buscar itens dos pedidos
      const { data: itemsData, error: itemsError } = await (supabase
        .from('packaging_order_items' as any)
        .select('*') as any);

      if (itemsError) {
        console.warn('Erro ao buscar itens dos pedidos:', itemsError);
      }

      // Transformar para formato de exibição
      const ordersDisplay: PackagingOrderDisplay[] = ordersData.map((order: any) => {
        const orderItems = (itemsData || []).filter((item: any) => item.order_id === order.id);

        const itens: PackagingOrderItemDisplay[] = orderItems.map((item: any) => ({
          id: item.id,
          packagingId: item.packaging_id,
          packagingName: item.packaging_name,
          quantidade: item.quantidade,
          unidadeCompra: item.unidade_compra,
          quantidadePorUnidade: item.quantidade_por_unidade,
          valorUnitario: item.valor_unitario,
          valorTotal: item.valor_total,
        }));

        return {
          id: order.id,
          quoteId: order.quote_id,
          supplierId: order.supplier_id,
          supplierName: order.supplier_name,
          totalValue: order.total_value || 0,
          economiaEstimada: order.economia_estimada || 0,
          status: order.status,
          orderDate: (() => {
            const [y, m, d] = order.order_date.split('-').map(Number);
            return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
          })(),
          deliveryDate: order.delivery_date 
            ? (() => {
                const [y, m, d] = order.delivery_date.split('-').map(Number);
                return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
              })()
            : null,
          observations: order.observations,
          itens,
        };
      });

      return ordersDisplay;
    },
  });

  // Criar pedido a partir de cotação
  const createOrderFromQuote = useMutation({
    mutationFn: async (data: {
      quoteId: string;
      supplierId: string;
      supplierName: string;
      deliveryDate: string;
      observations?: string;
      economiaEstimada?: number;
      itens: {
        packagingId: string;
        packagingName: string;
        quantidade: number;
        unidadeCompra: string;
        quantidadePorUnidade?: number;
        valorUnitario: number;
      }[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!companyUser?.company_id) throw new Error('Empresa não encontrada');

      // Calcular total
      const totalValue = data.itens.reduce((sum, item) => 
        sum + (item.quantidade * item.valorUnitario), 0);

      // Criar pedido
      const { data: order, error: orderError } = await (supabase
        .from('packaging_orders' as any)
        .insert({
          company_id: companyUser.company_id,
          quote_id: data.quoteId,
          supplier_id: data.supplierId,
          supplier_name: data.supplierName,
          total_value: totalValue,
          economia_estimada: data.economiaEstimada || 0,
          status: 'pendente',
          order_date: format(new Date(), 'yyyy-MM-dd'),
          delivery_date: data.deliveryDate,
          observations: data.observations || null,
        })
        .select()
        .single() as any);

      if (orderError) throw orderError;

      // Criar itens do pedido
      const orderItems = data.itens.map(item => ({
        order_id: order.id,
        packaging_id: item.packagingId,
        packaging_name: item.packagingName,
        quantidade: item.quantidade,
        unidade_compra: item.unidadeCompra,
        quantidade_por_unidade: item.quantidadePorUnidade || null,
        valor_unitario: item.valorUnitario,
        valor_total: item.quantidade * item.valorUnitario,
      }));

      const { error: itemsError } = await (supabase
        .from('packaging_order_items' as any)
        .insert(orderItems) as any);

      if (itemsError) throw itemsError;

      // IMPORTANTE: Atualizar status da cotação para "concluida"
      const { error: quoteUpdateError } = await (supabase
        .from('packaging_quotes' as any)
        .update({ 
          status: 'concluida', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', data.quoteId) as any);

      if (quoteUpdateError) {
        console.warn('Erro ao atualizar status da cotação:', quoteUpdateError);
      }

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-orders'] });
      queryClient.invalidateQueries({ queryKey: ['packaging-quotes'] });
      toast({ title: 'Pedido de embalagem criado com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar pedido',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Criar pedido direto (sem cotação)
  const createOrder = useMutation({
    mutationFn: async (data: {
      supplierId: string;
      supplierName: string;
      deliveryDate: string;
      observations?: string;
      itens: {
        packagingId: string;
        packagingName: string;
        quantidade: number;
        unidadeCompra: string;
        quantidadePorUnidade?: number;
        valorUnitario: number;
      }[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!companyUser?.company_id) throw new Error('Empresa não encontrada');

      const totalValue = data.itens.reduce((sum, item) => 
        sum + (item.quantidade * item.valorUnitario), 0);

      const { data: order, error: orderError } = await (supabase
        .from('packaging_orders' as any)
        .insert({
          company_id: companyUser.company_id,
          quote_id: null,
          supplier_id: data.supplierId,
          supplier_name: data.supplierName,
          total_value: totalValue,
          status: 'pendente',
          order_date: format(new Date(), 'yyyy-MM-dd'),
          delivery_date: data.deliveryDate,
          observations: data.observations || null,
        })
        .select()
        .single() as any);

      if (orderError) throw orderError;

      const orderItems = data.itens.map(item => ({
        order_id: order.id,
        packaging_id: item.packagingId,
        packaging_name: item.packagingName,
        quantidade: item.quantidade,
        unidade_compra: item.unidadeCompra,
        quantidade_por_unidade: item.quantidadePorUnidade || null,
        valor_unitario: item.valorUnitario,
        valor_total: item.quantidade * item.valorUnitario,
      }));

      const { error: itemsError } = await (supabase
        .from('packaging_order_items' as any)
        .insert(orderItems) as any);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-orders'] });
      toast({ title: 'Pedido de embalagem criado com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar pedido',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Atualizar status do pedido
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await (supabase
        .from('packaging_orders' as any)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-orders'] });
    },
  });

  // Confirmar entrega do pedido ajustando quantidades e valores reais
  const confirmDelivery = useMutation({
    mutationFn: async (data: {
      orderId: string;
      totalValue: number;
      economiaEstimada: number;
      itens: {
        id: string; // The order item ID
        quantidade: number;
        valorTotal: number;
        valorUnitario: number;
      }[];
    }) => {
      // Atualizar o pedido principal para entregue
      const { error: orderError } = await (supabase
        .from('packaging_orders' as any)
        .update({ 
          status: 'entregue', 
          total_value: data.totalValue,
          economia_estimada: data.economiaEstimada,
          updated_at: new Date().toISOString() 
        })
        .eq('id', data.orderId) as any);

      if (orderError) throw orderError;

      // Atualizar cada item do pedido
      for (const item of data.itens) {
        const { error: itemError } = await (supabase
          .from('packaging_order_items' as any)
          .update({
            quantidade: item.quantidade,
            valor_total: item.valorTotal,
            valor_unitario: item.valorUnitario
          })
          .eq('id', item.id) as any);
          
        if (itemError) throw itemError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-orders'] });
      toast({ title: 'Entrega confirmada!', description: 'Valores atualizados na nota com sucesso.' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao confirmar entrega',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Excluir pedido
  const deleteOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await (supabase
        .from('packaging_orders' as any)
        .delete()
        .eq('id', orderId) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-orders'] });
      toast({ title: 'Pedido excluído com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir pedido',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    orders,
    isLoading,
    error,
    createOrderFromQuote,
    createOrder,
    updateOrderStatus,
    confirmDelivery,
    deleteOrder,
  };
}
