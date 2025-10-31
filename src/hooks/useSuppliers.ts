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
      // Fetch suppliers (RLS filtra por company_id automaticamente)
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (suppliersError) throw suppliersError;

      // Fetch all necessary data for rating calculation
      const [
        { data: quoteSuppliers, error: qsError },
        { data: orders, error: ordersError },
        { data: quoteSupplierItems, error: qsiError },
        { data: quoteResponses, error: qrError }
      ] = await Promise.all([
        supabase.from('quote_suppliers').select('supplier_id, valor_oferecido, quote_id, quotes(status, data_inicio)'),
        supabase.from('orders').select('supplier_id, order_date, total_value, status').order('order_date', { ascending: false }),
        supabase.from('quote_supplier_items').select('supplier_id, quote_id, product_id, valor_oferecido'),
        supabase.from('quote_suppliers').select('supplier_id, quote_id, data_resposta, quotes(data_inicio)').not('data_resposta', 'is', null)
      ]);

      if (qsError) throw qsError;
      if (ordersError) throw ordersError;
      if (qsiError) throw qsiError;
      if (qrError) throw qrError;

      const formattedSuppliers: Supplier[] = suppliersData.map(s => {
        // Get supplier-specific data
        const supplierQuotes = quoteSuppliers?.filter(qs => qs.supplier_id === s.id) || [];
        const supplierItems = quoteSupplierItems?.filter(qi => qi.supplier_id === s.id) || [];
        const supplierOrders = orders?.filter(o => o.supplier_id === s.id) || [];
        const supplierResponseData = quoteResponses?.filter(qr => qr.supplier_id === s.id) || [];

        // Active quotes count
        const activeQuotes = supplierQuotes.filter(qs => 
          qs.quotes?.status === 'ativa' || qs.quotes?.status === 'pendente'
        ).length;
        
        const totalQuotes = supplierQuotes.length;
        
        // Calculate average price
        const respondedQuotes = supplierQuotes.filter(qs => 
          qs.valor_oferecido && qs.valor_oferecido > 0
        );
        const avgPrice = respondedQuotes.length > 0
          ? respondedQuotes.reduce((sum, qs) => sum + Number(qs.valor_oferecido), 0) / respondedQuotes.length
          : 0;

        // Last order date
        const lastOrderDate = supplierOrders.length > 0 
          ? new Date(supplierOrders[0].order_date).toLocaleDateString('pt-BR')
          : new Date(s.created_at).toLocaleDateString('pt-BR');

        // Total limit from orders
        const totalLimit = supplierOrders.reduce((sum, o) => sum + Number(o.total_value || 0), 0);

        // ===== RATING CALCULATION (0-5 stars) =====
        let rating = 0;

        // 1. WIN RATE (30%): How often supplier had the best price
        const supplierItemsWithPrice = supplierItems.filter(si => si.valor_oferecido && si.valor_oferecido > 0);
        let wins = 0;
        
        supplierItemsWithPrice.forEach(item => {
          const competingOffers = quoteSupplierItems?.filter(qi => 
            qi.quote_id === item.quote_id && 
            qi.product_id === item.product_id &&
            qi.valor_oferecido && qi.valor_oferecido > 0
          ) || [];
          
          if (competingOffers.length > 0) {
            const bestPrice = Math.min(...competingOffers.map(o => Number(o.valor_oferecido)));
            if (Number(item.valor_oferecido) === bestPrice) wins++;
          }
        });
        
        const winRate = supplierItemsWithPrice.length > 0 ? wins / supplierItemsWithPrice.length : 0;
        const scoreWinRate = winRate * 5 * 0.3;

        // 2. PRICE COMPETITIVENESS (25%): How competitive are prices vs market
        let scorePrice = 0;
        if (supplierItemsWithPrice.length > 0) {
          const avgSupplierPrice = supplierItemsWithPrice.reduce((sum, i) => sum + Number(i.valor_oferecido), 0) / supplierItemsWithPrice.length;
          const allPrices = quoteSupplierItems?.filter(qi => qi.valor_oferecido && qi.valor_oferecido > 0) || [];
          
          if (allPrices.length > 0) {
            const marketAvgPrice = allPrices.reduce((sum, i) => sum + Number(i.valor_oferecido), 0) / allPrices.length;
            const competitiveness = marketAvgPrice > 0 ? Math.max(0, Math.min(1, 1 - (avgSupplierPrice - marketAvgPrice) / marketAvgPrice)) : 0;
            scorePrice = competitiveness * 5 * 0.25;
          }
        }

        // 3. RESPONSE TIME (20%): Average response time in hours
        let scoreResponseTime = 0;
        if (supplierResponseData.length > 0) {
          const responseTimes = supplierResponseData.map(r => {
            if (!r.data_resposta || !r.quotes?.data_inicio) return null;
            const start = new Date(r.quotes.data_inicio).getTime();
            const response = new Date(r.data_resposta).getTime();
            return (response - start) / (1000 * 60 * 60); // hours
          }).filter(t => t !== null && t >= 0) as number[];
          
          if (responseTimes.length > 0) {
            const avgResponseHours = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
            // < 24h = excellent (5), < 48h = good (4), > 72h = poor (2)
            scoreResponseTime = Math.max(0, Math.min(5, 5 - (avgResponseHours / 24))) * 5 * 0.2;
          }
        }

        // 4. AVAILABILITY RATE (15%): Percentage of quoted products responded to
        let scoreAvailability = 0;
        const totalItemsRequested = supplierItems.length;
        const itemsResponded = supplierItemsWithPrice.length;
        
        if (totalItemsRequested > 0) {
          const availabilityRate = itemsResponded / totalItemsRequested;
          scoreAvailability = availabilityRate * 5 * 0.15;
        }

        // 5. ORDER HISTORY (10%): Completed orders vs won quotes
        let scoreOrders = 0;
        const completedOrders = supplierOrders.filter(o => 
          o.status === 'entregue' || o.status === 'concluido'
        ).length;
        
        if (wins > 0) {
          const orderCompletionRate = completedOrders / wins;
          scoreOrders = Math.min(1, orderCompletionRate) * 5 * 0.1;
        } else if (completedOrders > 0 && totalQuotes > 0) {
          // Fallback: if no wins tracked, use order/quote ratio
          scoreOrders = Math.min(1, completedOrders / totalQuotes) * 5 * 0.1;
        }

        // Calculate final rating
        rating = Math.min(5, Math.max(0, scoreWinRate + scorePrice + scoreResponseTime + scoreAvailability + scoreOrders));
        
        // Update rating in database (fire and forget)
        if (rating !== s.rating) {
          supabase.from('suppliers').update({ rating: Number(rating.toFixed(2)) }).eq('id', s.id).then();
        }

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
