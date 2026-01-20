import { useState, useMemo, useEffect } from "react";
import { useStockCounts } from "@/hooks/useStockCounts";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

export function useContagemEstoque() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { stockCounts, isLoading, createStockCount, updateStockCount, deleteStockCount } = useStockCounts();
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const total = stockCounts.length;
    const pendentes = stockCounts.filter((c) => c.status === "pendente").length;
    const emAndamento = stockCounts.filter((c) => c.status === "em_andamento").length;
    const finalizadas = stockCounts.filter((c) => c.status === "finalizada").length;

    return { total, pendentes, emAndamento, finalizadas };
  }, [stockCounts]);

  // Filter counts
  const filteredCounts = useMemo(() => {
    return stockCounts.filter((count) => {
      const matchesSearch =
        (count as any).order?.supplier_name
          ?.toLowerCase()
          .includes(debouncedSearch.toLowerCase()) ||
        count.notes?.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesStatus = statusFilter === "all" || count.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [stockCounts, debouncedSearch, statusFilter]);

  // Load available orders
  const loadOrders = async () => {
    if (!user) return;
    
    setLoadingOrders(true);
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("id, supplier_name, order_date, status")
        .order("order_date", { ascending: false })
        .limit(100);

      if (error) throw error;
      setAvailableOrders(orders || []);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos.",
        variant: "destructive",
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    stockCounts,
    filteredCounts,
    stats,
    isLoading,
    createStockCount,
    updateStockCount,
    deleteStockCount,
    availableOrders,
    loadingOrders,
    loadOrders
  };
}
