import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatLocalDate } from '@/lib/utils';

interface PedidosData {
  periodo: string;
  totalPedidos: number;
  valorTotal: number;
  valorMedio: number;
  pedidosEntregues: number;
  pedidosPendentes: number;
  pedidosCancelados: number;
  taxaEntrega: number;
  fornecedorFrequente: string;
}

export const useReportPedidos = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PedidosData[]>([]);

  const generateReport = useCallback(async (startDate: Date, endDate: Date) => {
    setLoading(true);
    try {
      const startDateStr = formatLocalDate(startDate);
      const endDateStr = formatLocalDate(endDate);

      // Buscar pedidos no período
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('order_date', startDateStr)
        .lte('order_date', endDateStr)
        .order('order_date', { ascending: false });

      if (error) throw error;

      // Agrupar por mês
      const reportMap = new Map<string, PedidosData>();

      orders?.forEach((order: any) => {
        const mes = new Date(order.order_date).toLocaleDateString('pt-BR', {
          month: '2-digit',
          year: 'numeric'
        });

        if (!reportMap.has(mes)) {
          reportMap.set(mes, {
            periodo: mes,
            totalPedidos: 0,
            valorTotal: 0,
            valorMedio: 0,
            pedidosEntregues: 0,
            pedidosPendentes: 0,
            pedidosCancelados: 0,
            taxaEntrega: 0,
            fornecedorFrequente: ''
          });
        }

        const periodoData = reportMap.get(mes)!;
        periodoData.totalPedidos++;
        periodoData.valorTotal += Number(order.total_value || 0);

        if (order.status === 'entregue') {
          periodoData.pedidosEntregues++;
        } else if (order.status === 'pendente' || order.status === 'processando') {
          periodoData.pedidosPendentes++;
        } else if (order.status === 'cancelado') {
          periodoData.pedidosCancelados++;
        }
      });

      // Calcular métricas finais e fornecedor mais frequente
      const reportData = Array.from(reportMap.entries()).map(([mes, periodo]) => {
        const valorMedio = periodo.totalPedidos > 0
          ? periodo.valorTotal / periodo.totalPedidos
          : 0;

        const taxaEntrega = periodo.totalPedidos > 0
          ? (periodo.pedidosEntregues / periodo.totalPedidos) * 100
          : 0;

        // Buscar fornecedor mais frequente no período
        const pedidosNoMes = orders?.filter((o: any) => {
          const mesPedido = new Date(o.order_date).toLocaleDateString('pt-BR', {
            month: '2-digit',
            year: 'numeric'
          });
          return mesPedido === mes;
        }) || [];

        const fornecedorCount = new Map<string, number>();
        pedidosNoMes.forEach((p: any) => {
          const nome = p.supplier_name || 'Desconhecido';
          fornecedorCount.set(nome, (fornecedorCount.get(nome) || 0) + 1);
        });

        let fornecedorFrequente = 'N/A';
        let maxCount = 0;
        fornecedorCount.forEach((count, nome) => {
          if (count > maxCount) {
            maxCount = count;
            fornecedorFrequente = nome;
          }
        });

        return {
          ...periodo,
          valorMedio: Math.round(valorMedio * 100) / 100,
          taxaEntrega: Math.round(taxaEntrega * 10) / 10,
          fornecedorFrequente
        };
      });

      const sortedData = reportData.sort((a, b) => {
        const [mesA, anoA] = a.periodo.split('/');
        const [mesB, anoB] = b.periodo.split('/');
        if (anoA !== anoB) return parseInt(anoA) - parseInt(anoB);
        return parseInt(mesA) - parseInt(mesB);
      });

      setData(sortedData);
      return sortedData;
    } catch (error) {
      console.error('Erro ao gerar relatório de pedidos:', error);
      setData([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, generateReport };
};
