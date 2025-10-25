import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  selectedFornecedores?: string[];
  selectedProdutos?: string[];
}

export const useAnalytics = (filters: AnalyticsFilters = {}) => {
  const { startDate, endDate, selectedFornecedores = [], selectedProdutos = [] } = filters;

  // Fetch all data in parallel
  const { data: quotes, isLoading: loadingQuotes } = useQuery({
    queryKey: ['analytics-quotes', startDate, endDate],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from('quotes')
        .select(`
          *,
          quote_items (
            id,
            product_id,
            product_name,
            quantidade,
            unidade
          ),
          quote_suppliers (
            id,
            supplier_id,
            supplier_name,
            valor_oferecido,
            status,
            data_resposta,
            observacoes
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('data_inicio', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        query = query.lte('data_fim', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch quote_supplier_items separately and merge
      const quoteIds = data?.map(q => q.id) || [];
      let supplierItems: any[] = [];
      
      if (quoteIds.length > 0) {
        const { data: itemsData } = await supabase
          .from('quote_supplier_items')
          .select('*')
          .in('quote_id', quoteIds);
        
        supplierItems = itemsData || [];
      }

      // Merge supplier items into quotes
      const quotesWithItems = data?.map(quote => ({
        ...quote,
        quote_supplier_items: supplierItems.filter(item => item.quote_id === quote.id)
      })) || [];

      return quotesWithItems;
    },
  });

  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['analytics-orders', startDate, endDate],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id);

      if (startDate) {
        query = query.gte('order_date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        query = query.lte('order_date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = loadingQuotes || loadingOrders;

  // Calculate metrics
  const metricas = useMemo(() => {
    if (!quotes || quotes.length === 0) {
      return [
        {
          titulo: "Taxa de Economia",
          valor: "0%",
          variacao: "0%",
          tipo: "neutro" as const,
          descricao: "Nenhuma cotação no período"
        },
        {
          titulo: "Tempo Médio de Cotação",
          valor: "0 dias",
          variacao: "0 dias",
          tipo: "neutro" as const,
          descricao: "Nenhuma cotação no período"
        },
        {
          titulo: "Taxa de Resposta",
          valor: "0%",
          variacao: "0%",
          tipo: "neutro" as const,
          descricao: "Nenhuma cotação no período"
        },
        {
          titulo: "Valor Médio por Pedido",
          valor: "R$ 0",
          variacao: "0%",
          tipo: "neutro" as const,
          descricao: "Nenhum pedido no período"
        }
      ];
    }

    // Filter quotes based on suppliers and products
    let filteredQuotes = quotes;
    if (selectedFornecedores.length > 0 || selectedProdutos.length > 0) {
      filteredQuotes = quotes.filter(q => {
        const hasSupplier = selectedFornecedores.length === 0 || 
          q.quote_suppliers?.some(qs => selectedFornecedores.includes(qs.supplier_id));
        const hasProduct = selectedProdutos.length === 0 || 
          q.quote_items?.some(qi => selectedProdutos.includes(qi.product_id));
        return hasSupplier && hasProduct;
      });
    }

    // Taxa de Economia - Cálculo real baseado em quote_supplier_items
    let totalEconomia = 0;
    let totalValorMenor = 0;
    let cotacoesComEconomia = 0;

    filteredQuotes.forEach(quote => {
      // Agrupa valores por produto
      const produtosComValores = new Map<string, number[]>();
      
      quote.quote_supplier_items?.forEach(item => {
        if (item.valor_oferecido && item.valor_oferecido > 0) {
          if (!produtosComValores.has(item.product_id)) {
            produtosComValores.set(item.product_id, []);
          }
          produtosComValores.get(item.product_id)!.push(item.valor_oferecido);
        }
      });

      // Calcula economia para cada produto
      produtosComValores.forEach((valores) => {
        if (valores.length >= 2) {
          const max = Math.max(...valores);
          const min = Math.min(...valores);
          const economia = max - min;
          totalEconomia += economia;
          totalValorMenor += min;
          cotacoesComEconomia++;
        }
      });
    });

    const taxaEconomia = totalValorMenor > 0 ? (totalEconomia / (totalValorMenor + totalEconomia)) * 100 : 0;

    // Tempo Médio de Cotação
    const tempos = filteredQuotes
      .filter(q => q.data_inicio && q.data_fim)
      .map(q => {
        const inicio = new Date(q.data_inicio);
        const fim = new Date(q.data_fim);
        return (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
      });
    const tempoMedio = tempos.length > 0 
      ? tempos.reduce((a, b) => a + b, 0) / tempos.length 
      : 0;

    // Taxa de Resposta
    const fornecedoresConvidados = new Set<string>();
    const fornecedoresResponderam = new Set<string>();

    filteredQuotes.forEach(q => {
      q.quote_suppliers?.forEach(qs => {
        fornecedoresConvidados.add(qs.supplier_id);
        if (qs.valor_oferecido && qs.valor_oferecido > 0) {
          fornecedoresResponderam.add(qs.supplier_id);
        }
      });
    });

    const taxaResposta = fornecedoresConvidados.size > 0
      ? (fornecedoresResponderam.size / fornecedoresConvidados.size) * 100
      : 0;

    // Valor Médio por Pedido
    const valorTotalPedidos = orders?.reduce((sum, order) => sum + (order.total_value || 0), 0) || 0;
    const valorMedioPedido = orders && orders.length > 0 
      ? valorTotalPedidos / orders.length 
      : 0;

    return [
      {
        titulo: "Taxa de Economia",
        valor: `${taxaEconomia.toFixed(1)}%`,
        variacao: cotacoesComEconomia > 0 ? `${cotacoesComEconomia} cotações` : "0 cotações",
        tipo: taxaEconomia > 10 ? "positivo" as const : taxaEconomia > 5 ? "neutro" as const : "negativo" as const,
        descricao: `R$ ${totalEconomia.toFixed(2)} economizados`
      },
      {
        titulo: "Tempo Médio de Cotação",
        valor: `${tempoMedio.toFixed(1)} dias`,
        variacao: `${tempos.length} cotações`,
        tipo: tempoMedio < 3 ? "positivo" as const : tempoMedio < 5 ? "neutro" as const : "negativo" as const,
        descricao: "tempo de resposta"
      },
      {
        titulo: "Taxa de Resposta",
        valor: `${taxaResposta.toFixed(0)}%`,
        variacao: `${fornecedoresResponderam.size}/${fornecedoresConvidados.size}`,
        tipo: taxaResposta > 80 ? "positivo" as const : taxaResposta > 60 ? "neutro" as const : "negativo" as const,
        descricao: "fornecedores respondendo"
      },
      {
        titulo: "Valor Médio por Pedido",
        valor: `R$ ${valorMedioPedido.toFixed(2)}`,
        variacao: `${orders?.length || 0} pedidos`,
        tipo: "neutro" as const,
        descricao: "no período"
      }
    ];
  }, [quotes, orders, selectedFornecedores, selectedProdutos]);

  // Calculate top products
  const topProdutos = useMemo(() => {
    if (!quotes || quotes.length === 0) return [];

    let filteredQuotes = quotes;
    if (selectedFornecedores.length > 0) {
      filteredQuotes = quotes.filter(q => 
        q.quote_suppliers?.some(qs => selectedFornecedores.includes(qs.supplier_id))
      );
    }

    const produtosMap = new Map<string, {
      produto: string;
      cotacoes: number;
      economiaTotal: number;
      valorTotal: number;
    }>();

    filteredQuotes.forEach(quote => {
      quote.quote_items?.forEach(item => {
        const valoresProduto = quote.quote_supplier_items
          ?.filter(si => si.product_id === item.product_id)
          .map(si => si.valor_oferecido)
          .filter(v => v && v > 0) || [];

        if (valoresProduto.length >= 2) {
          const max = Math.max(...valoresProduto);
          const min = Math.min(...valoresProduto);
          const economia = max - min;

          if (!produtosMap.has(item.product_id)) {
            produtosMap.set(item.product_id, {
              produto: item.product_name,
              cotacoes: 0,
              economiaTotal: 0,
              valorTotal: 0
            });
          }

          const prod = produtosMap.get(item.product_id)!;
          prod.cotacoes++;
          prod.economiaTotal += economia;
          prod.valorTotal += min;
        }
      });
    });

    return Array.from(produtosMap.values())
      .filter(p => selectedProdutos.length === 0 || selectedProdutos.some(id => p.produto.includes(id)))
      .map(p => ({
        produto: p.produto,
        cotacoes: p.cotacoes,
        economia: p.valorTotal > 0 ? `${((p.economiaTotal / p.valorTotal) * 100).toFixed(1)}%` : "0%",
        valor: `R$ ${p.economiaTotal.toFixed(2)}`
      }))
      .sort((a, b) => parseFloat(b.valor.replace(/[R$\s]/g, '')) - parseFloat(a.valor.replace(/[R$\s]/g, '')))
      .slice(0, 5);
  }, [quotes, selectedFornecedores, selectedProdutos]);

  // Calculate top suppliers
  const performanceFornecedores = useMemo(() => {
    if (!quotes || quotes.length === 0) return [];

    let filteredQuotes = quotes;
    if (selectedProdutos.length > 0) {
      filteredQuotes = quotes.filter(q => 
        q.quote_items?.some(qi => selectedProdutos.includes(qi.product_id))
      );
    }

    const fornecedoresMap = new Map<string, {
      fornecedor: string;
      cotacoes: number;
      respondidas: number;
      economiaGerada: number;
      tempoTotal: number;
      respostasComTempo: number;
    }>();

    filteredQuotes.forEach(quote => {
      quote.quote_suppliers?.forEach(qs => {
        if (!fornecedoresMap.has(qs.supplier_id)) {
          fornecedoresMap.set(qs.supplier_id, {
            fornecedor: qs.supplier_name,
            cotacoes: 0,
            respondidas: 0,
            economiaGerada: 0,
            tempoTotal: 0,
            respostasComTempo: 0
          });
        }

        const forn = fornecedoresMap.get(qs.supplier_id)!;
        forn.cotacoes++;

        if (qs.valor_oferecido && qs.valor_oferecido > 0) {
          forn.respondidas++;

          if (qs.data_resposta && quote.data_inicio) {
            const tempo = (new Date(qs.data_resposta).getTime() - 
                          new Date(quote.data_inicio).getTime()) / 
                          (1000 * 60 * 60 * 24);
            if (tempo >= 0) {
              forn.tempoTotal += tempo;
              forn.respostasComTempo++;
            }
          }
        }
      });
    });

    return Array.from(fornecedoresMap.values())
      .filter(f => selectedFornecedores.length === 0 || selectedFornecedores.includes(f.fornecedor))
      .map(f => {
        const taxaResposta = f.cotacoes > 0 ? (f.respondidas / f.cotacoes) * 100 : 0;
        const tempoMedio = f.respostasComTempo > 0 ? f.tempoTotal / f.respostasComTempo : 0;
        const score = Math.round(
          (taxaResposta * 0.5) + 
          (f.cotacoes * 2) + 
          (tempoMedio > 0 ? Math.max(0, 20 - tempoMedio) : 0)
        );

        return {
          fornecedor: f.fornecedor,
          score,
          cotacoes: f.cotacoes,
          economia: `${taxaResposta.toFixed(0)}%`,
          tempo: tempoMedio > 0 ? `${tempoMedio.toFixed(1)} dias` : "N/A"
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [quotes, selectedFornecedores, selectedProdutos]);

  // Calculate monthly trends
  const tendenciasMensais = useMemo(() => {
    if (!quotes) return [];

    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const hoje = new Date();
    const tendencias = [];

    for (let i = 5; i >= 0; i--) {
      const mesData = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesProximo = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 0);

      const cotacoesMes = quotes.filter(q => {
        const data = new Date(q.data_inicio);
        return data >= mesData && data <= mesProximo;
      });

      let economiaMes = 0;
      let valorTotalMes = 0;

      cotacoesMes.forEach(q => {
        // Agrupa valores por produto
        const produtosComValores = new Map<string, number[]>();
        
        q.quote_supplier_items?.forEach(item => {
          if (item.valor_oferecido && item.valor_oferecido > 0) {
            if (!produtosComValores.has(item.product_id)) {
              produtosComValores.set(item.product_id, []);
            }
            produtosComValores.get(item.product_id)!.push(item.valor_oferecido);
          }
        });

        // Calcula economia para cada produto
        produtosComValores.forEach((valores) => {
          if (valores.length >= 2) {
            const max = Math.max(...valores);
            const min = Math.min(...valores);
            economiaMes += max - min;
            valorTotalMes += min;
          }
        });
      });

      tendencias.push({
        mes: meses[mesData.getMonth()],
        cotacoes: cotacoesMes.length,
        economia: valorTotalMes > 0 ? ((economiaMes / (valorTotalMes + economiaMes)) * 100) : 0,
        valor: valorTotalMes
      });
    }

    return tendencias;
  }, [quotes]);

  return {
    metricas,
    topProdutos,
    performanceFornecedores,
    tendenciasMensais,
    isLoading
  };
};
