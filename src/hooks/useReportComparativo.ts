import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ComparativoData {
  produto: string;
  categoria: string;
  cotacoes: number;
  menorPreco: number;
  maiorPreco: number;
  precoMedio: number;
  variacao: number;
  economiaMedia: number;
  fornecedorMaisBarato: string;
}

export const useReportComparativo = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ComparativoData[]>([]);

  const generateReport = useCallback(async (startDate: Date, endDate: Date) => {
    setLoading(true);
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Buscar produtos com cotações no período
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          category,
          quote_items (
            quantity,
            unit_price,
            quote_suppliers (
              valor_oferecido,
              suppliers (
                name
              ),
              quotes (
                data_inicio
              )
            )
          )
        `);

      if (error) throw error;

      const reportData: ComparativoData[] = products?.map((product: any) => {
        // Filtrar cotações no período
        const cotacoesNoPeriodo = product.quote_items?.filter((qi: any) => {
          const dataInicio = qi.quote_suppliers?.quotes?.data_inicio;
          return dataInicio && dataInicio >= startDateStr && dataInicio <= endDateStr;
        }) || [];

        const precos = cotacoesNoPeriodo
          .map((qi: any) => qi.quote_suppliers?.valor_oferecido || 0)
          .filter((p: number) => p > 0);

        if (precos.length === 0) {
          return null;
        }

        const menorPreco = Math.min(...precos);
        const maiorPreco = Math.max(...precos);
        const precoMedio = precos.reduce((acc: number, p: number) => acc + p, 0) / precos.length;
        const variacao = maiorPreco > 0 ? ((maiorPreco - menorPreco) / maiorPreco) * 100 : 0;
        const economiaMedia = maiorPreco - menorPreco;

        // Encontrar fornecedor mais barato
        const itemMaisBarato = cotacoesNoPeriodo.find(
          (qi: any) => qi.quote_suppliers?.valor_oferecido === menorPreco
        );
        const fornecedorMaisBarato = itemMaisBarato?.quote_suppliers?.suppliers?.name || 'N/A';

        return {
          produto: product.name,
          categoria: product.category || 'Sem categoria',
          cotacoes: cotacoesNoPeriodo.length,
          menorPreco,
          maiorPreco,
          precoMedio,
          variacao: Math.round(variacao),
          economiaMedia,
          fornecedorMaisBarato
        };
      }).filter((item: any) => item !== null)
        .sort((a: any, b: any) => b.economiaMedia - a.economiaMedia) || [];

      setData(reportData);
    } catch (error) {
      console.error('Erro ao gerar relatório comparativo:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, generateReport };
};
