import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConversaoData {
  periodo: string;
  cotaçõesIniciadas: number;
  cotaçõesFinalizadas: number;
  pedidosGerados: number;
  taxaConversao: number;
  valorCotacoes: number;
  valorPedidos: number;
  roi: number;
  melhorFornecedor: string;
}

export const useReportConversao = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ConversaoData[]>([]);

  const generateReport = useCallback(async (startDate: Date, endDate: Date) => {
    setLoading(true);
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Buscar cotações e pedidos em paralelo
      const [quotesResult, ordersResult] = await Promise.all([
        supabase
          .from('quotes')
          .select(`
            id,
            data_inicio,
            status,
            quote_suppliers (
              valor_oferecido,
              supplier_id,
              suppliers (
                name
              )
            )
          `)
          .gte('data_inicio', startDateStr)
          .lte('data_inicio', endDateStr),
        supabase
          .from('orders')
          .select('*')
          .gte('order_date', startDateStr)
          .lte('order_date', endDateStr)
      ]);

      if (quotesResult.error) throw quotesResult.error;
      if (ordersResult.error) throw ordersResult.error;

      const quotes = quotesResult.data || [];
      const orders = ordersResult.data || [];

      // Agrupar por mês
      const reportMap = new Map<string, ConversaoData>();

      // Processar cotações
      quotes.forEach((quote: any) => {
        const mes = new Date(quote.data_inicio).toLocaleDateString('pt-BR', {
          month: '2-digit',
          year: 'numeric'
        });

        if (!reportMap.has(mes)) {
          reportMap.set(mes, {
            periodo: mes,
            cotaçõesIniciadas: 0,
            cotaçõesFinalizadas: 0,
            pedidosGerados: 0,
            taxaConversao: 0,
            valorCotacoes: 0,
            valorPedidos: 0,
            roi: 0,
            melhorFornecedor: ''
          });
        }

        const periodoData = reportMap.get(mes)!;
        periodoData.cotaçõesIniciadas++;

        if (quote.status === 'finalizada' || quote.status === 'concluida') {
          periodoData.cotaçõesFinalizadas++;

          // Calcular valor total das cotações (menor valor oferecido)
          const valores = quote.quote_suppliers
            ?.map((qs: any) => qs.valor_oferecido || 0)
            .filter((v: number) => v > 0) || [];

          if (valores.length > 0) {
            const menorValor = Math.min(...valores);
            periodoData.valorCotacoes += menorValor;
          }
        }
      });

      // Processar pedidos
      orders.forEach((order: any) => {
        const mes = new Date(order.order_date).toLocaleDateString('pt-BR', {
          month: '2-digit',
          year: 'numeric'
        });

        const periodoData = reportMap.get(mes);
        if (periodoData) {
          periodoData.pedidosGerados++;
          periodoData.valorPedidos += Number(order.total_value || 0);
        }
      });

      // Calcular métricas finais
      const reportData = Array.from(reportMap.values()).map(periodo => {
        const taxaConversao = periodo.cotaçõesIniciadas > 0
          ? (periodo.pedidosGerados / periodo.cotaçõesIniciadas) * 100
          : 0;

        // ROI = (Valor dos pedidos - Valor das cotações) / Valor das cotações * 100
        const roi = periodo.valorCotacoes > 0
          ? ((periodo.valorPedidos - periodo.valorCotacoes) / periodo.valorCotacoes) * 100
          : 0;

        // Buscar melhor fornecedor (mais pedidos no período)
        const pedidosNoPeriodo = orders.filter((o: any) => {
          const mesPedido = new Date(o.order_date).toLocaleDateString('pt-BR', {
            month: '2-digit',
            year: 'numeric'
          });
          return mesPedido === periodo.periodo;
        });

        const fornecedorCount = new Map<string, number>();
        pedidosNoPeriodo.forEach((p: any) => {
          const nome = p.supplier_name || 'Desconhecido';
          fornecedorCount.set(nome, (fornecedorCount.get(nome) || 0) + 1);
        });

        let melhorFornecedor = 'N/A';
        let maxCount = 0;
        fornecedorCount.forEach((count, nome) => {
          if (count > maxCount) {
            maxCount = count;
            melhorFornecedor = nome;
          }
        });

        return {
          ...periodo,
          taxaConversao: Math.round(taxaConversao * 10) / 10,
          roi: Math.round(roi * 10) / 10,
          melhorFornecedor
        };
      }).sort((a, b) => {
        const [mesA, anoA] = a.periodo.split('/');
        const [mesB, anoB] = b.periodo.split('/');
        if (anoA !== anoB) return parseInt(anoA) - parseInt(anoB);
        return parseInt(mesA) - parseInt(mesB);
      });

      setData(reportData);
      return reportData;
    } catch (error) {
      console.error('Erro ao gerar relatório de conversão:', error);
      setData([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, generateReport };
};
