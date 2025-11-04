import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProdutosData {
  produto: string;
  categoria: string;
  totalCotacoes: number;
  valorMinimo: number;
  valorMaximo: number;
  valorMedio: number;
  variacaoPreco: number;
  economiaPotencial: number;
  fornecedorMaisBarato: string;
  tendencia: 'alta' | 'baixa' | 'estavel';
}

export const useReportProdutos = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProdutosData[]>([]);

  const generateReport = useCallback(async (startDate: Date, endDate: Date) => {
    setLoading(true);
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Buscar produtos com cotações no período
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          id,
          data_inicio,
          quote_items (
            product_id,
            product_name
          ),
          quote_supplier_items (
            product_id,
            product_name,
            valor_oferecido,
            supplier_id
          )
        `)
        .gte('data_inicio', startDateStr)
        .lte('data_inicio', endDateStr)
        .in('status', ['finalizada', 'concluida']);

      if (quotesError) throw quotesError;

      // Agrupar dados por produto
      const produtosMap = new Map<string, {
        produto: string;
        categoria: string;
        valores: number[];
        fornecedores: Map<string, number>;
        cotações: Set<string>;
      }>();

      quotes?.forEach((quote: any) => {
        quote.quote_items?.forEach((item: any) => {
          const productId = item.product_id;
          const productName = item.product_name;

          if (!produtosMap.has(productId)) {
            produtosMap.set(productId, {
              produto: productName,
              categoria: 'Geral', // Pode ser melhorado buscando da tabela products
              valores: [],
              fornecedores: new Map(),
              cotações: new Set()
            });
          }

          const produtoData = produtosMap.get(productId)!;
          produtoData.cotações.add(quote.id);

          // Buscar valores deste produto nas cotações de fornecedores
          quote.quote_supplier_items?.forEach((qsi: any) => {
            if (qsi.product_id === productId && qsi.valor_oferecido) {
              produtoData.valores.push(Number(qsi.valor_oferecido));
              produtoData.fornecedores.set(
                qsi.supplier_id,
                qsi.valor_oferecido
              );
            }
          });
        });
      });

      // Buscar categorias dos produtos
      const productIds = Array.from(produtosMap.keys());
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, category')
          .in('id', productIds);

        products?.forEach((p: any) => {
          const produtoData = produtosMap.get(p.id);
          if (produtoData) {
            produtoData.categoria = p.category || 'Geral';
          }
        });
      }

      // Processar dados finais
      const reportData: ProdutosData[] = Array.from(produtosMap.entries()).map(([productId, produtoData]) => {
        if (produtoData.valores.length === 0) return null;

        const valoresOrdenados = [...produtoData.valores].sort((a, b) => a - b);
        const valorMinimo = valoresOrdenados[0];
        const valorMaximo = valoresOrdenados[valoresOrdenados.length - 1];
        const valorMedio = produtoData.valores.reduce((acc, v) => acc + v, 0) / produtoData.valores.length;
        const variacaoPreco = valorMaximo > 0 ? ((valorMaximo - valorMinimo) / valorMaximo) * 100 : 0;
        const economiaPotencial = valorMaximo - valorMinimo;

        // Buscar fornecedor mais barato
        let fornecedorMaisBarato = 'N/A';
        let menorValor = Infinity;
        produtoData.fornecedores.forEach((valor, supplierId) => {
          if (valor < menorValor) {
            menorValor = valor;
            fornecedorMaisBarato = supplierId; // Será substituído pelo nome se possível
          }
        });

        // Calcular tendência (comparar primeiros e últimos valores)
        const primeiraMetade = valoresOrdenados.slice(0, Math.floor(valoresOrdenados.length / 2));
        const segundaMetade = valoresOrdenados.slice(Math.floor(valoresOrdenados.length / 2));
        const mediaPrimeira = primeiraMetade.reduce((a, b) => a + b, 0) / primeiraMetade.length;
        const mediaSegunda = segundaMetade.reduce((a, b) => a + b, 0) / segundaMetade.length;
        
        let tendencia: 'alta' | 'baixa' | 'estavel' = 'estavel';
        const variacaoPercentual = mediaPrimeira > 0 ? ((mediaSegunda - mediaPrimeira) / mediaPrimeira) * 100 : 0;
        if (variacaoPercentual > 5) tendencia = 'alta';
        else if (variacaoPercentual < -5) tendencia = 'baixa';

        return {
          produto: produtoData.produto,
          categoria: produtoData.categoria,
          totalCotacoes: produtoData.cotações.size,
          valorMinimo: Math.round(valorMinimo * 100) / 100,
          valorMaximo: Math.round(valorMaximo * 100) / 100,
          valorMedio: Math.round(valorMedio * 100) / 100,
          variacaoPreco: Math.round(variacaoPreco * 10) / 10,
          economiaPotencial: Math.round(economiaPotencial * 100) / 100,
          fornecedorMaisBarato: fornecedorMaisBarato,
          tendencia
        };
      }).filter((item): item is ProdutosData => item !== null)
        .sort((a, b) => b.totalCotacoes - a.totalCotacoes);

      setData(reportData);
      return reportData;
    } catch (error) {
      console.error('Erro ao gerar relatório de produtos:', error);
      setData([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, generateReport };
};
