import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EficienciaData {
  periodo: string;
  cotacoesIniciadas: number;
  cotacoesFinalizadas: number;
  taxaConversao: number;
  tempoMedioCotacao: number;
  fornecedoresPorCotacao: number;
  economiaTotal: number;
  roi: number;
}

export const useReportEficiencia = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EficienciaData[]>([]);

  const generateReport = useCallback(async (startDate: Date, endDate: Date) => {
    setLoading(true);
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Buscar todas as cotações no período
      const { data: quotes, error } = await supabase
        .from('quotes')
        .select(`
          id,
          data_inicio,
          data_fim,
          status,
          quote_suppliers (
            id,
            valor_oferecido
          )
        `)
        .gte('data_inicio', startDateStr)
        .lte('data_inicio', endDateStr);

      if (error) throw error;

      // Agrupar por mês
      const reportMap = new Map<string, EficienciaData>();

      quotes?.forEach((quote: any) => {
        const mes = new Date(quote.data_inicio).toLocaleDateString('pt-BR', {
          month: '2-digit',
          year: 'numeric'
        });

        if (!reportMap.has(mes)) {
          reportMap.set(mes, {
            periodo: mes,
            cotacoesIniciadas: 0,
            cotacoesFinalizadas: 0,
            taxaConversao: 0,
            tempoMedioCotacao: 0,
            fornecedoresPorCotacao: 0,
            economiaTotal: 0,
            roi: 0
          });
        }

        const periodoData = reportMap.get(mes)!;
        periodoData.cotacoesIniciadas++;

        if (quote.status === 'finalizada' || quote.status === 'concluida') {
          periodoData.cotacoesFinalizadas++;

          // Calcular tempo de cotação
          if (quote.data_fim) {
            const inicio = new Date(quote.data_inicio);
            const fim = new Date(quote.data_fim);
            const dias = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
            periodoData.tempoMedioCotacao += dias;
          }

          // Calcular economia
          const valores = quote.quote_suppliers
            ?.map((qs: any) => qs.valor_oferecido || 0)
            .filter((v: number) => v > 0) || [];

          if (valores.length >= 2) {
            const economia = Math.max(...valores) - Math.min(...valores);
            periodoData.economiaTotal += economia;
          }

          periodoData.fornecedoresPorCotacao += quote.quote_suppliers?.length || 0;
        }
      });

      // Calcular médias e taxas
      const reportData = Array.from(reportMap.values()).map(periodo => {
        const taxaConversao = periodo.cotacoesIniciadas > 0
          ? (periodo.cotacoesFinalizadas / periodo.cotacoesIniciadas) * 100
          : 0;

        const tempoMedio = periodo.cotacoesFinalizadas > 0
          ? periodo.tempoMedioCotacao / periodo.cotacoesFinalizadas
          : 0;

        const fornecedoresMedio = periodo.cotacoesFinalizadas > 0
          ? periodo.fornecedoresPorCotacao / periodo.cotacoesFinalizadas
          : 0;

        // ROI simplificado (economia / custo operacional estimado)
        const custoOperacional = periodo.cotacoesIniciadas * 50; // R$50 por cotação
        const roi = custoOperacional > 0
          ? (periodo.economiaTotal / custoOperacional) * 100
          : 0;

        return {
          ...periodo,
          taxaConversao: Math.round(taxaConversao),
          tempoMedioCotacao: Math.round(tempoMedio * 10) / 10,
          fornecedoresPorCotacao: Math.round(fornecedoresMedio * 10) / 10,
          roi: Math.round(roi)
        };
      });

      setData(reportData);
      return reportData;
    } catch (error) {
      console.error('Erro ao gerar relatório de eficiência:', error);
      setData([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, generateReport };
};
