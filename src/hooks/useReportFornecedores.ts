import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FornecedorPerformance {
  nome: string;
  totalCotacoes: number;
  cotacoesVencidas: number;
  taxaVitoria: number;
  valorMedioOfertas: number;
  tempoMedioResposta: string;
  economiaGerada: number;
  score: number;
}

export const useReportFornecedores = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FornecedorPerformance[]>([]);

  const generateReport = useCallback(async (startDate: Date, endDate: Date) => {
    setLoading(true);
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Buscar fornecedores com suas cotações
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select(`
          id,
          name,
          quote_suppliers (
            id,
            valor_oferecido,
            selected,
            quotes (
              data_inicio,
              data_fim
            )
          )
        `);

      if (error) throw error;

      const reportData: FornecedorPerformance[] = suppliers?.map((supplier: any) => {
        const cotacoesNoPeriodo = supplier.quote_suppliers?.filter((qs: any) => {
          const dataInicio = qs.quotes?.data_inicio;
          return dataInicio >= startDateStr && dataInicio <= endDateStr;
        }) || [];

        const totalCotacoes = cotacoesNoPeriodo.length;
        const cotacoesVencidas = cotacoesNoPeriodo.filter((qs: any) => qs.selected).length;
        const taxaVitoria = totalCotacoes > 0 ? (cotacoesVencidas / totalCotacoes) * 100 : 0;

        const valores = cotacoesNoPeriodo
          .map((qs: any) => qs.valor_oferecido || 0)
          .filter((v: number) => v > 0);
        
        const valorMedioOfertas = valores.length > 0 
          ? valores.reduce((acc: number, v: number) => acc + v, 0) / valores.length 
          : 0;

        // Calcular tempo médio de resposta (simplificado)
        const temposResposta = cotacoesNoPeriodo
          .filter((qs: any) => qs.quotes?.data_inicio && qs.quotes?.data_fim)
          .map((qs: any) => {
            const inicio = new Date(qs.quotes.data_inicio);
            const fim = new Date(qs.quotes.data_fim);
            return (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24); // dias
          });

        const tempoMedio = temposResposta.length > 0
          ? temposResposta.reduce((acc: number, t: number) => acc + t, 0) / temposResposta.length
          : 0;

        // Calcular score (0-100)
        const score = Math.min(100, Math.round(
          (taxaVitoria * 0.4) + // 40% peso para taxa de vitória
          ((totalCotacoes / 10) * 30) + // 30% peso para participação
          (tempoMedio > 0 ? (1 / tempoMedio) * 30 : 0) // 30% peso para rapidez
        ));

        return {
          nome: supplier.name,
          totalCotacoes,
          cotacoesVencidas,
          taxaVitoria: Math.round(taxaVitoria),
          valorMedioOfertas,
          tempoMedioResposta: `${tempoMedio.toFixed(1)} dias`,
          economiaGerada: 0, // Calculado posteriormente
          score
        };
      }).sort((a, b) => b.score - a.score) || [];

      setData(reportData);
      return reportData;
    } catch (error) {
      console.error('Erro ao gerar relatório de fornecedores:', error);
      setData([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, generateReport };
};
