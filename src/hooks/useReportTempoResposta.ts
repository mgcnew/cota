import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TempoRespostaData {
  fornecedor: string;
  totalCotacoes: number;
  respostasRecebidas: number;
  tempoMedioResposta: number;
  tempoMinimo: number;
  tempoMaximo: number;
  taxaResposta: number;
  status: 'excelente' | 'bom' | 'regular' | 'ruim';
}

export const useReportTempoResposta = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TempoRespostaData[]>([]);

  const generateReport = useCallback(async (startDate: Date, endDate: Date) => {
    setLoading(true);
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Buscar cotações com fornecedores e datas
      const { data: quotes, error } = await supabase
        .from('quotes')
        .select(`
          id,
          data_inicio,
          data_fim,
          quote_suppliers (
            supplier_id,
            supplier_name,
            data_resposta,
            status,
            valor_oferecido
          )
        `)
        .gte('data_inicio', startDateStr)
        .lte('data_inicio', endDateStr);

      if (error) throw error;

      // Agrupar por fornecedor
      const fornecedoresMap = new Map<string, {
        fornecedor: string;
        cotações: Set<string>;
        temposResposta: number[];
      }>();

      quotes?.forEach((quote: any) => {
        if (!quote.data_inicio) return;

        quote.quote_suppliers?.forEach((qs: any) => {
          const supplierId = qs.supplier_id;
          const supplierName = qs.supplier_name || 'Desconhecido';

          if (!fornecedoresMap.has(supplierId)) {
            fornecedoresMap.set(supplierId, {
              fornecedor: supplierName,
              cotações: new Set(),
              temposResposta: []
            });
          }

          const fornecedorData = fornecedoresMap.get(supplierId)!;
          fornecedorData.cotações.add(quote.id);

          // Calcular tempo de resposta se houver data_resposta
          if (qs.data_resposta && quote.data_inicio) {
            const inicio = new Date(quote.data_inicio);
            const resposta = new Date(qs.data_resposta);
            const dias = (resposta.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
            
            if (dias >= 0) {
              fornecedorData.temposResposta.push(dias);
            }
          }
        });
      });

      // Processar dados finais
      const reportData: TempoRespostaData[] = Array.from(fornecedoresMap.entries()).map(([supplierId, fornecedorData]) => {
        const totalCotacoes = fornecedorData.cotações.size;
        const respostasRecebidas = fornecedorData.temposResposta.length;
        const taxaResposta = totalCotacoes > 0
          ? (respostasRecebidas / totalCotacoes) * 100
          : 0;

        let tempoMedioResposta = 0;
        let tempoMinimo = 0;
        let tempoMaximo = 0;

        if (fornecedorData.temposResposta.length > 0) {
          const temposOrdenados = [...fornecedorData.temposResposta].sort((a, b) => a - b);
          tempoMinimo = temposOrdenados[0];
          tempoMaximo = temposOrdenados[temposOrdenados.length - 1];
          tempoMedioResposta = fornecedorData.temposResposta.reduce((acc, t) => acc + t, 0) / fornecedorData.temposResposta.length;
        }

        // Classificar status
        let status: 'excelente' | 'bom' | 'regular' | 'ruim' = 'regular';
        if (tempoMedioResposta <= 2 && taxaResposta >= 80) {
          status = 'excelente';
        } else if (tempoMedioResposta <= 5 && taxaResposta >= 60) {
          status = 'bom';
        } else if (tempoMedioResposta > 10 || taxaResposta < 40) {
          status = 'ruim';
        }

        return {
          fornecedor: fornecedorData.fornecedor,
          totalCotacoes,
          respostasRecebidas,
          tempoMedioResposta: Math.round(tempoMedioResposta * 10) / 10,
          tempoMinimo: Math.round(tempoMinimo * 10) / 10,
          tempoMaximo: Math.round(tempoMaximo * 10) / 10,
          taxaResposta: Math.round(taxaResposta * 10) / 10,
          status
        };
      }).sort((a, b) => {
        // Ordenar por tempo médio (melhor primeiro)
        if (a.tempoMedioResposta !== b.tempoMedioResposta) {
          return a.tempoMedioResposta - b.tempoMedioResposta;
        }
        // Se empate, por taxa de resposta (maior primeiro)
        return b.taxaResposta - a.taxaResposta;
      });

      setData(reportData);
      return reportData;
    } catch (error) {
      console.error('Erro ao gerar relatório de tempo de resposta:', error);
      setData([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, generateReport };
};
