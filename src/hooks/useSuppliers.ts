import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  limit: string;
  activeQuotes: number;
  totalQuotes: number;
  avgPrice: string;
  lastOrder: string;
  rating: number;
  status: "active" | "inactive" | "pending";
  phone?: string;
  email?: string;
  address?: string;
}

export function useSuppliers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading, error } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      // Fetch suppliers with their related quotes and orders
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (suppliersError) throw suppliersError;

      // Fetch all quote_suppliers to calculate metrics
      const { data: quoteSuppliers, error: qsError } = await supabase
        .from('quote_suppliers')
        .select('supplier_id, valor_oferecido, quote_id, quotes(status)');

      if (qsError) throw qsError;

      // Fetch all orders to get last order date
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('supplier_id, order_date, total_value')
        .order('order_date', { ascending: false });

      if (ordersError) throw ordersError;

      const formattedSuppliers: Supplier[] = suppliersData.map(s => {
        // Calculate metrics for this supplier
        const supplierQuotes = quoteSuppliers?.filter(qs => qs.supplier_id === s.id) || [];
        const activeQuotes = supplierQuotes.filter(qs => 
          qs.quotes?.status === 'ativa' || qs.quotes?.status === 'pendente'
        ).length;
        
        const totalQuotes = supplierQuotes.length;
        
        // Calculate average price from responded quotes
        const respondedQuotes = supplierQuotes.filter(qs => 
          qs.valor_oferecido && qs.valor_oferecido > 0
        );
        const avgPrice = respondedQuotes.length > 0
          ? respondedQuotes.reduce((sum, qs) => sum + Number(qs.valor_oferecido), 0) / respondedQuotes.length
          : 0;

        // Get last order date
        const supplierOrders = orders?.filter(o => o.supplier_id === s.id) || [];
        const lastOrderDate = supplierOrders.length > 0 
          ? new Date(supplierOrders[0].order_date).toLocaleDateString('pt-BR')
          : new Date(s.created_at).toLocaleDateString('pt-BR');

        // Calculate total limit from orders
        const totalLimit = supplierOrders.reduce((sum, o) => sum + Number(o.total_value || 0), 0);

        // Calculate rating based on response rate and price competitiveness
        const responseRate = totalQuotes > 0 ? (respondedQuotes.length / totalQuotes) : 0;
        const rating = Math.min(5, Math.round(responseRate * 5));

        return {
          id: s.id,
          name: s.name,
          contact: s.contact || "",
          limit: totalLimit > 0 ? `R$ ${(totalLimit / 1000).toFixed(0)}k` : "R$ 0",
          activeQuotes,
          totalQuotes,
          avgPrice: avgPrice > 0 ? `R$ ${avgPrice.toFixed(2)}` : "R$ 0,00",
          lastOrder: lastOrderDate,
          rating: rating || 0,
          status: "active" as const,
          phone: s.phone || undefined,
          email: s.email || undefined,
          address: s.address || undefined,
        };
      });

      return formattedSuppliers;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Sucesso",
        description: "Fornecedor excluído com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o fornecedor",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ supplierId, data }: { 
      supplierId: string, 
      data: {
        name: string,
        contact: string,
        phone?: string,
        email?: string,
        address?: string,
      } 
    }) => {
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: data.name,
          contact: data.contact,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', supplierId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Sucesso",
        description: "Fornecedor atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o fornecedor",
        variant: "destructive",
      });
    },
  });

  return {
    suppliers,
    isLoading,
    error,
    deleteSupplier: deleteMutation.mutate,
    updateSupplier: updateMutation.mutate,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  };
}
