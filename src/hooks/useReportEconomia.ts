import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EconomiaData {
  periodo: string;
  totalCotacoes: number;
  economiaGerada: number;
  economiaPercentual: number;
  melhorFornecedor: string;
  maiorEconomia: number;
}

export const useReportEconomia = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EconomiaData[]>([]);

  const generateReport = useCallback(async (startDate: Date, endDate: Date) => {
    setLoading(true);
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Buscar cotações finalizadas com fornecedores
      const { data: quotes, error } = await supabase
        .from('quotes')
        .select(`
          id,
          data_inicio,
          status,
          quote_suppliers (
            supplier_id,
            valor_oferecido,
            suppliers (
              name
            )
          )
        `)
        .gte('data_inicio', startDateStr)
        .lte('data_inicio', endDateStr)
        .in('status', ['finalizada', 'concluida']);

      if (error) throw error;

      // Processar dados por período (mensal)
      const reportData: Map<string, EconomiaData> = new Map();

      quotes?.forEach((quote: any) => {
        const mes = new Date(quote.data_inicio).toLocaleDateString('pt-BR', { 
          month: '2-digit', 
          year: 'numeric' 
        });

        if (!reportData.has(mes)) {
          reportData.set(mes, {
            periodo: mes,
            totalCotacoes: 0,
            economiaGerada: 0,
            economiaPercentual: 0,
            melhorFornecedor: '',
            maiorEconomia: 0
          });
        }

        const periodoData = reportData.get(mes)!;
        periodoData.totalCotacoes++;

        // Calcular economia desta cotação
        const valores = quote.quote_suppliers
          ?.map((qs: any) => qs.valor_oferecido || 0)
          .filter((v: number) => v > 0) || [];

        if (valores.length >= 2) {
          const menorValor = Math.min(...valores);
          const maiorValor = Math.max(...valores);
          const economia = maiorValor - menorValor;
          
          periodoData.economiaGerada += economia;
          periodoData.economiaPercentual = (economia / maiorValor) * 100;

          // Identificar melhor fornecedor (menor valor)
          const melhorSupplier = quote.quote_suppliers?.find(
            (qs: any) => qs.valor_oferecido === menorValor
          );
          
          if (melhorSupplier && economia > periodoData.maiorEconomia) {
            periodoData.maiorEconomia = economia;
            periodoData.melhorFornecedor = melhorSupplier.suppliers?.name || 'N/A';
          }
        }
      });

      const finalData = Array.from(reportData.values());
      setData(finalData);
      return finalData;
    } catch (error) {
      console.error('Erro ao gerar relatório de economia:', error);
      setData([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, generateReport };
};
