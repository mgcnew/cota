/**
 * useDatePeriod Hook
 * 
 * Custom hook for managing date period state and related statistics.
 * Extracts date period management logic from Relatorios.tsx for better reusability.
 * 
 * @module hooks/useDatePeriod
 * Requirements: 1.3, 7.5
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Estatisticas } from "@/types/reports";

/**
 * Return type for useDatePeriod hook
 */
export interface UseDatePeriodReturn {
  /** Start date of the period */
  startDate: Date | undefined;
  /** End date of the period */
  endDate: Date | undefined;
  /** Set the start date */
  setStartDate: (date: Date | undefined) => void;
  /** Set the end date */
  setEndDate: (date: Date | undefined) => void;
  /** Apply a preset period (e.g., 7, 30, 90, 365 days) */
  applyPreset: (days: number) => void;
  /** Formatted date range text for display */
  dateRangeText: string;
  /** Statistics for the selected period */
  estatisticas: Estatisticas;
  /** Whether initial data is loading */
  loading: boolean;
  /** Whether data is being refreshed */
  refreshing: boolean;
  /** Refresh the statistics */
  refresh: () => void;
}

/**
 * Default statistics values
 */
const DEFAULT_ESTATISTICAS: Estatisticas = {
  economiaTotal: "R$ 0,00",
  economiaPercentual: "0%",
  cotacoesRealizadas: 0,
  fornecedoresAtivos: 0,
  produtosCotados: 0,
  pedidosGerados: 0
};

/**
 * Custom hook for managing date period and loading related statistics
 * 
 * @returns Object containing date state, setters, and statistics
 */
export function useDatePeriod(): UseDatePeriodReturn {
  const { toast } = useToast();
  const { user } = useAuth();

  // Date state - defaults to first day of current month to today
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(1);
    return date;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Statistics state
  const [estatisticas, setEstatisticas] = useState<Estatisticas>(DEFAULT_ESTATISTICAS);

  // Refs to track if we've loaded and what dates we loaded for
  const hasLoadedStatistics = useRef(false);
  const lastStartDate = useRef<Date | undefined>();
  const lastEndDate = useRef<Date | undefined>();

  /**
   * Apply a preset period (e.g., last 7 days, 30 days, etc.)
   */
  const applyPreset = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start);
    setEndDate(end);
  }, []);

  /**
   * Formatted date range text for display
   */
  const dateRangeText = useMemo(() => {
    if (!startDate || !endDate) return 'Selecionar período';
    return `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`;
  }, [startDate, endDate]);

  /**
   * Load statistics from the database
   */
  const loadStatistics = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Load data in parallel for better performance
      let quotesQuery = supabase.from("quotes")
        .select("id, status, data_inicio, data_fim, quote_suppliers(valor_oferecido, supplier_id), quote_items(product_id)");
      
      if (startDate) {
        quotesQuery = quotesQuery.gte('data_inicio', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        quotesQuery = quotesQuery.lte('data_fim', format(endDate, 'yyyy-MM-dd'));
      }

      let ordersQuery = supabase.from("orders")
        .select("id, order_date, total_value, status");
      
      if (startDate) {
        ordersQuery = ordersQuery.gte('order_date', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        ordersQuery = ordersQuery.lte('order_date', format(endDate, 'yyyy-MM-dd'));
      }

      const [quotesResult, ordersResult, suppliersResult, productsResult] = await Promise.all([
        quotesQuery,
        ordersQuery,
        supabase.from("suppliers").select("id, name"),
        supabase.from("products").select("id, name, category")
      ]);

      if (quotesResult.error) throw quotesResult.error;
      if (ordersResult.error) throw ordersResult.error;
      if (suppliersResult.error) throw suppliersResult.error;
      if (productsResult.error) throw productsResult.error;

      const quotes = quotesResult.data || [];
      const orders = ordersResult.data || [];

      // Calculate metrics - only finalized quotes
      const quotesFinalizadas = quotes.filter((q: any) => 
        q.status === 'finalizada' || q.status === 'concluida'
      );

      const metricsData = quotesFinalizadas.reduce((acc, quote: any) => {
        if (quote.quote_suppliers && quote.quote_suppliers.length >= 2) {
          const fornecedoresMap = new Map();
          
          quote.quote_suppliers.forEach((supplier: any) => {
            const supplierId = supplier.supplier_id;
            const valorTotal = supplier.valor_oferecido || 0;
            
            if (!fornecedoresMap.has(supplierId)) {
              fornecedoresMap.set(supplierId, 0);
            }
            fornecedoresMap.set(supplierId, fornecedoresMap.get(supplierId) + valorTotal);
          });
          
          const valoresFornecedores = Array.from(fornecedoresMap.values()).filter(v => v > 0);
          if (valoresFornecedores.length >= 2) {
            const menorValorTotal = Math.min(...valoresFornecedores);
            const maiorValorTotal = Math.max(...valoresFornecedores);
            acc.economiaTotal += maiorValorTotal - menorValorTotal;
            acc.cotacoesComEconomia++;
          }
        }
        return acc;
      }, { economiaTotal: 0, cotacoesComEconomia: 0 });

      // Calculate totals and averages
      const totalPedidos = orders.reduce((acc, order) => acc + Number(order.total_value || 0), 0);
      const economiaPercentual = totalPedidos > 0 ? metricsData.economiaTotal / totalPedidos * 100 : 0;

      // Filter active suppliers in the period
      const fornecedoresIdsNasQuotes = new Set<string>();
      quotes.forEach((q: any) => {
        if (q.quote_suppliers) {
          q.quote_suppliers.forEach((qs: any) => {
            if (qs.supplier_id) {
              fornecedoresIdsNasQuotes.add(qs.supplier_id);
            }
          });
        }
      });

      // Filter quoted products in the period
      const produtosIdsNasQuotes = new Set<string>();
      quotes.forEach((q: any) => {
        if (q.quote_items) {
          q.quote_items.forEach((qi: any) => {
            if (qi.product_id) {
              produtosIdsNasQuotes.add(qi.product_id);
            }
          });
        }
      });

      // Format currency
      const economiaTotalFormatada = metricsData.economiaTotal > 0
        ? metricsData.economiaTotal.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })
        : 'R$ 0,00';

      setEstatisticas({
        economiaTotal: economiaTotalFormatada,
        economiaPercentual: `${economiaPercentual.toFixed(1)}%`,
        cotacoesRealizadas: quotes.length,
        fornecedoresAtivos: fornecedoresIdsNasQuotes.size,
        produtosCotados: produtosIdsNasQuotes.size,
        pedidosGerados: orders.length
      });

      if (isRefresh) {
        toast({
          title: "Dados atualizados",
          description: "Estatísticas carregadas com sucesso"
        });
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [startDate, endDate, toast]);

  /**
   * Refresh statistics
   */
  const refresh = useCallback(() => {
    loadStatistics(true);
  }, [loadStatistics]);

  // Load statistics on mount and when dates change
  useEffect(() => {
    if (user) {
      const datesChanged = 
        lastStartDate.current?.getTime() !== startDate?.getTime() ||
        lastEndDate.current?.getTime() !== endDate?.getTime();

      if (!hasLoadedStatistics.current || datesChanged) {
        loadStatistics();
        hasLoadedStatistics.current = true;
        lastStartDate.current = startDate;
        lastEndDate.current = endDate;
      }
    }
  }, [user, startDate, endDate, loadStatistics]);

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    applyPreset,
    dateRangeText,
    estatisticas,
    loading,
    refreshing,
    refresh
  };
}

export default useDatePeriod;
