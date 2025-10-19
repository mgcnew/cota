import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export function useDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      // OPTIMIZED: Fetch all data in parallel
      const [quotesResult, suppliersResult, productsResult, ordersResult, quoteSupplierItemsResult] = await Promise.all([
        supabase.from("quotes").select(`*, quote_items(*), quote_suppliers(*)`).order("created_at", { ascending: false }),
        supabase.from("suppliers").select("*"),
        supabase.from("products").select("*"),
        supabase.from("orders").select("*").order("order_date", { ascending: false }),
        supabase.from("quote_supplier_items").select("*"),
      ]);

      if (quotesResult.error) throw quotesResult.error;
      if (suppliersResult.error) throw suppliersResult.error;
      if (productsResult.error) throw productsResult.error;
      if (ordersResult.error) throw ordersResult.error;
      if (quoteSupplierItemsResult.error) throw quoteSupplierItemsResult.error;

      // Integrate quote_supplier_items into quotes
      const quotesWithSupplierItems = quotesResult.data?.map(quote => ({
        ...quote,
        quote_supplier_items: quoteSupplierItemsResult.data?.filter(item => item.quote_id === quote.id) || []
      })) || [];

      return {
        quotes: quotesWithSupplierItems,
        suppliers: suppliersResult.data || [],
        products: productsResult.data || [],
        orders: ordersResult.data || [],
      };
    },
  });

  // OPTIMIZED: Memoize expensive calculations
  const metrics = useMemo(() => {
    if (!data) return { cotacoesAtivas: 0, fornecedores: 0, economiaGerada: 0, produtosCotados: 0 };

    const cotacoesAtivas = data.quotes.filter(q => q.status === 'ativa').length;
    const fornecedoresCount = data.suppliers.length;
    
    let economiaTotal = 0;
    
    // Calcular economia APENAS para cotações finalizadas/concluídas
    const cotacoesFinalizadas = data.quotes.filter((q: any) => 
      q.status === 'finalizada' || q.status === 'concluida'
    );
    
    cotacoesFinalizadas.forEach((quote: any) => {
      if (quote.quote_supplier_items && quote.quote_supplier_items.length >= 2) {
        // Agrupar itens por fornecedor e calcular valor total de cada fornecedor
        const fornecedoresMap = new Map();
        
        quote.quote_supplier_items.forEach((item: any) => {
          const supplierId = item.supplier_id;
          const quoteItem = quote.quote_items?.find((qi: any) => qi.product_id === item.product_id);
          const quantidade = parseInt(quoteItem?.quantidade || "1") || 1;
          const valorTotal = (item.valor_oferecido || 0) * quantidade;
          
          if (!fornecedoresMap.has(supplierId)) {
            fornecedoresMap.set(supplierId, 0);
          }
          fornecedoresMap.set(supplierId, fornecedoresMap.get(supplierId) + valorTotal);
        });

        // Calcular economia: diferença entre o maior e menor valor total
        const valoresFornecedores = Array.from(fornecedoresMap.values()).filter(v => v > 0);
        if (valoresFornecedores.length >= 2) {
          const menorValorTotal = Math.min(...valoresFornecedores);
          const maiorValorTotal = Math.max(...valoresFornecedores);
          economiaTotal += maiorValorTotal - menorValorTotal;
        }
      }
    });

    const produtosUnicos = new Set();
    data.quotes.forEach((quote: any) => {
      quote.quote_items?.forEach((item: any) => {
        produtosUnicos.add(item.product_id);
      });
    });

    // Calcular taxa de atividade: fornecedores que participaram de cotações
    const fornecedoresAtivos = new Set();
    data.quotes.forEach((quote: any) => {
      quote.quote_suppliers?.forEach((qs: any) => {
        if (qs.supplier_id) {
          fornecedoresAtivos.add(qs.supplier_id);
        }
      });
    });
    
    const taxaAtividade = fornecedoresCount > 0 
      ? Math.round((fornecedoresAtivos.size / fornecedoresCount) * 100) 
      : 0;

    // Calcular taxa de aprovação: cotações finalizadas/aprovadas vs total
    const cotacoesAprovadas = data.quotes.filter((q: any) => 
      q.status === 'finalizada' || q.status === 'concluida' || q.status === 'approved' || q.status === 'aprovada'
    ).length;
    
    const taxaAprovacao = data.quotes.length > 0
      ? Math.round((cotacoesAprovadas / data.quotes.length) * 100)
      : 0;

    // Calcular crescimento comparando mês atual com mês anterior
    const now = new Date();
    const mesAtualInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    const mesAnteriorInicio = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const mesAnteriorFim = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Cotações do mês atual
    const cotacoesMesAtual = data.quotes.filter((q: any) => {
      const dataInicio = new Date(q.data_inicio || q.created_at);
      return dataInicio >= mesAtualInicio;
    }).length;

    // Cotações do mês anterior
    const cotacoesMesAnterior = data.quotes.filter((q: any) => {
      const dataInicio = new Date(q.data_inicio || q.created_at);
      return dataInicio >= mesAnteriorInicio && dataInicio <= mesAnteriorFim;
    }).length;

    // Economia do mês atual
    let economiaMesAtual = 0;
    const cotacoesFinalizadasMesAtual = data.quotes.filter((q: any) => {
      const dataInicio = new Date(q.data_inicio || q.created_at);
      const isFinalized = q.status === 'finalizada' || q.status === 'concluida';
      return dataInicio >= mesAtualInicio && isFinalized;
    });

    cotacoesFinalizadasMesAtual.forEach((quote: any) => {
      if (quote.quote_supplier_items && quote.quote_supplier_items.length >= 2) {
        const fornecedoresMap = new Map();
        quote.quote_supplier_items.forEach((item: any) => {
          const supplierId = item.supplier_id;
          const quoteItem = quote.quote_items?.find((qi: any) => qi.product_id === item.product_id);
          const quantidade = parseInt(quoteItem?.quantidade || "1") || 1;
          const valorTotal = (item.valor_oferecido || 0) * quantidade;
          if (!fornecedoresMap.has(supplierId)) {
            fornecedoresMap.set(supplierId, 0);
          }
          fornecedoresMap.set(supplierId, fornecedoresMap.get(supplierId) + valorTotal);
        });
        const valoresFornecedores = Array.from(fornecedoresMap.values()).filter(v => v > 0);
        if (valoresFornecedores.length >= 2) {
          economiaMesAtual += Math.max(...valoresFornecedores) - Math.min(...valoresFornecedores);
        }
      }
    });

    // Economia do mês anterior
    let economiaMesAnterior = 0;
    const cotacoesFinalizadasMesAnterior = data.quotes.filter((q: any) => {
      const dataInicio = new Date(q.data_inicio || q.created_at);
      const isFinalized = q.status === 'finalizada' || q.status === 'concluida';
      return dataInicio >= mesAnteriorInicio && dataInicio <= mesAnteriorFim && isFinalized;
    });

    cotacoesFinalizadasMesAnterior.forEach((quote: any) => {
      if (quote.quote_supplier_items && quote.quote_supplier_items.length >= 2) {
        const fornecedoresMap = new Map();
        quote.quote_supplier_items.forEach((item: any) => {
          const supplierId = item.supplier_id;
          const quoteItem = quote.quote_items?.find((qi: any) => qi.product_id === item.product_id);
          const quantidade = parseInt(quoteItem?.quantidade || "1") || 1;
          const valorTotal = (item.valor_oferecido || 0) * quantidade;
          if (!fornecedoresMap.has(supplierId)) {
            fornecedoresMap.set(supplierId, 0);
          }
          fornecedoresMap.set(supplierId, fornecedoresMap.get(supplierId) + valorTotal);
        });
        const valoresFornecedores = Array.from(fornecedoresMap.values()).filter(v => v > 0);
        if (valoresFornecedores.length >= 2) {
          economiaMesAnterior += Math.max(...valoresFornecedores) - Math.min(...valoresFornecedores);
        }
      }
    });

    // Calcular percentuais de crescimento
    const crescimentoCotacoes = cotacoesMesAnterior > 0
      ? Math.round(((cotacoesMesAtual - cotacoesMesAnterior) / cotacoesMesAnterior) * 100)
      : cotacoesMesAtual > 0 ? 100 : 0;

    const crescimentoEconomia = economiaMesAnterior > 0
      ? Math.round(((economiaMesAtual - economiaMesAnterior) / economiaMesAnterior) * 100)
      : economiaMesAtual > 0 ? 100 : 0;

    // Calcular cotações dos últimos 7 dias para o mini gráfico
    const ultimos7Dias = [];
    const hoje = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoje.getTime() - i * 24 * 60 * 60 * 1000);
      const diaInicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, 0, 0);
      const diaFim = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 23, 59, 59);
      
      const cotacoesDoDia = data.quotes.filter((q: any) => {
        const dataCriacao = new Date(q.data_inicio || q.created_at);
        return dataCriacao >= diaInicio && dataCriacao <= diaFim;
      }).length;
      
      ultimos7Dias.push(cotacoesDoDia);
    }

    return {
      cotacoesAtivas,
      fornecedores: fornecedoresCount,
      economiaGerada: economiaTotal,
      produtosCotados: produtosUnicos.size,
      taxaAtividade,
      taxaAprovacao,
      crescimentoCotacoes,
      crescimentoEconomia,
      ultimos7DiasCotacoes: ultimos7Dias
    };
  }, [data]);

  const recentQuotes = useMemo(() => {
    if (!data) return [];

    return data.quotes.slice(0, 4).map((quote: any) => {
      const firstItem = quote.quote_items?.[0];
      
      if (!firstItem) {
        return {
          id: quote.id.substring(0, 8),
          product: "Produto",
          quantity: "0",
          bestPrice: "Sem ofertas",
          supplier: "-",
          date: new Date(quote.created_at).toLocaleDateString('pt-BR'),
          status: quote.status
        };
      }

      // Find best price from quote_supplier_items for the first product
      let melhorPreco = Infinity;
      let fornecedorMelhorOferta = null;

      if (quote.quote_supplier_items && quote.quote_supplier_items.length > 0) {
        const ofertasProduto = quote.quote_supplier_items.filter(
          (item: any) => item.product_id === firstItem.product_id && item.valor_oferecido > 0
        );

        ofertasProduto.forEach((item: any) => {
          if (item.valor_oferecido < melhorPreco) {
            melhorPreco = item.valor_oferecido;
            // Find supplier name from quote_suppliers
            const supplier = quote.quote_suppliers?.find((qs: any) => qs.supplier_id === item.supplier_id);
            fornecedorMelhorOferta = supplier?.supplier_name || "Fornecedor";
          }
        });
      }

      return {
        id: quote.id.substring(0, 8),
        product: firstItem.product_name || "Produto",
        quantity: firstItem.quantidade || "0",
        bestPrice: melhorPreco !== Infinity ? `R$ ${melhorPreco.toFixed(2)}` : "Sem ofertas",
        supplier: fornecedorMelhorOferta || "-",
        date: new Date(quote.created_at).toLocaleDateString('pt-BR'),
        status: quote.status
      };
    });
  }, [data]);

  const topSuppliers = useMemo(() => {
    if (!data) return [];

    const supplierStats = new Map();
    
    // 1. Contar vitórias em cotações (fornecedor com menor preço)
    const cotacoesFinalizadas = data.quotes.filter((q: any) => 
      q.status === 'finalizada' || q.status === 'concluida'
    );
    
    cotacoesFinalizadas.forEach((quote: any) => {
      if (!quote.quote_supplier_items || quote.quote_supplier_items.length < 2) return;
      
      // Calcular valor total de cada fornecedor nesta cotação
      const fornecedoresMap = new Map();
      
      quote.quote_supplier_items.forEach((item: any) => {
        const supplierId = item.supplier_id;
        const quoteItem = quote.quote_items?.find((qi: any) => qi.product_id === item.product_id);
        const quantidade = parseInt(quoteItem?.quantidade || "1") || 1;
        const valorTotal = (item.valor_oferecido || 0) * quantidade;
        
        if (!fornecedoresMap.has(supplierId)) {
          const supplier = quote.quote_suppliers?.find((qs: any) => qs.supplier_id === supplierId);
          fornecedoresMap.set(supplierId, {
            name: supplier?.supplier_name || "Fornecedor",
            valorTotal: 0
          });
        }
        
        const fornecedor = fornecedoresMap.get(supplierId);
        fornecedor.valorTotal += valorTotal;
      });
      
      // Identificar o fornecedor vencedor (menor valor total)
      const fornecedoresArray = Array.from(fornecedoresMap.entries());
      if (fornecedoresArray.length >= 2) {
        const valoresFornecedores = fornecedoresArray.map(([_, data]) => data.valorTotal).filter(v => v > 0);
        
        if (valoresFornecedores.length >= 2) {
          const menorValor = Math.min(...valoresFornecedores);
          const maiorValor = Math.max(...valoresFornecedores);
          const economiaGerada = maiorValor - menorValor;
          
          // Encontrar o fornecedor vencedor
          fornecedoresArray.forEach(([supplierId, fornecedorData]) => {
            if (fornecedorData.valorTotal === menorValor && fornecedorData.valorTotal > 0) {
              if (!supplierStats.has(supplierId)) {
                supplierStats.set(supplierId, {
                  name: fornecedorData.name,
                  vitoriasEmCotacoes: 0,
                  pedidosDiretos: 0,
                  economiaTotal: 0,
                  valorTotalCotacoes: 0
                });
              }
              
              const stats = supplierStats.get(supplierId);
              stats.vitoriasEmCotacoes += 1;
              stats.economiaTotal += economiaGerada;
              stats.valorTotalCotacoes += maiorValor;
            }
          });
        }
      }
    });

    // 2. Contar pedidos diretos (pedidos que não vieram de cotações)
    if (data.orders && Array.isArray(data.orders)) {
      data.orders.forEach((order: any) => {
        if (order.supplier_id) {
          // Buscar nome do fornecedor
          const supplier = data.suppliers?.find((s: any) => s.id === order.supplier_id);
          
          if (!supplierStats.has(order.supplier_id)) {
            supplierStats.set(order.supplier_id, {
              name: supplier?.name || "Fornecedor",
              vitoriasEmCotacoes: 0,
              pedidosDiretos: 0,
              economiaTotal: 0,
              valorTotalCotacoes: 0
            });
          }
          
          const stats = supplierStats.get(order.supplier_id);
          stats.pedidosDiretos += 1;
        }
      });
    }

    // Ordenar por: total de vitórias + pedidos diretos, depois por percentual de economia
    return Array.from(supplierStats.values())
      .map((supplier: any) => {
        const totalVitorias = supplier.vitoriasEmCotacoes + supplier.pedidosDiretos;
        return {
          name: supplier.name,
          quotes: totalVitorias,
          vitoriasEmCotacoes: supplier.vitoriasEmCotacoes,
          pedidosDiretos: supplier.pedidosDiretos,
          avgPrice: supplier.valorTotalCotacoes > 0 
            ? `R$ ${(supplier.valorTotalCotacoes / supplier.vitoriasEmCotacoes).toFixed(2)}` 
            : "R$ 0.00",
          savings: supplier.valorTotalCotacoes > 0 
            ? `${((supplier.economiaTotal / supplier.valorTotalCotacoes) * 100).toFixed(1)}%`
            : "0%",
          economiaPercentual: supplier.valorTotalCotacoes > 0 
            ? (supplier.economiaTotal / supplier.valorTotalCotacoes) * 100
            : 0
        };
      })
      .sort((a: any, b: any) => {
        // Primeiro por total de vitórias
        if (b.quotes !== a.quotes) {
          return b.quotes - a.quotes;
        }
        // Se empatar, por percentual de economia
        return b.economiaPercentual - a.economiaPercentual;
      })
      .slice(0, 5);
  }, [data]);

  const monthlyData = useMemo(() => {
    if (!data) return [];

    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const monthlyDataArray = [];

    for (let i = 5; i >= 0; i--) {
      const mesData = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mesNome = meses[mesData.getMonth()];
      const mesInicio = new Date(mesData.getFullYear(), mesData.getMonth(), 1);
      const mesFim = new Date(mesData.getFullYear(), mesData.getMonth() + 1, 0);

      const quotesDoMes = data.quotes.filter((q: any) => {
        const dataInicio = new Date(q.data_inicio);
        const isFinalized = q.status === 'finalizada' || q.status === 'concluida';
        return dataInicio >= mesInicio && dataInicio <= mesFim && isFinalized;
      });

      let economiaDoMes = 0;
      quotesDoMes.forEach((quote: any) => {
        if (quote.quote_supplier_items && quote.quote_supplier_items.length >= 2) {
          // Agrupar por fornecedor e calcular valor total
          const fornecedoresMap = new Map();
          
          quote.quote_supplier_items.forEach((item: any) => {
            const supplierId = item.supplier_id;
            const quoteItem = quote.quote_items?.find((qi: any) => qi.product_id === item.product_id);
            const quantidade = parseInt(quoteItem?.quantidade || "1") || 1;
            const valorTotal = (item.valor_oferecido || 0) * quantidade;
            
            if (!fornecedoresMap.has(supplierId)) {
              fornecedoresMap.set(supplierId, 0);
            }
            fornecedoresMap.set(supplierId, fornecedoresMap.get(supplierId) + valorTotal);
          });

          // Calcular economia
          const valoresFornecedores = Array.from(fornecedoresMap.values()).filter(v => v > 0);
          if (valoresFornecedores.length >= 2) {
            const menorValorTotal = Math.min(...valoresFornecedores);
            const maiorValorTotal = Math.max(...valoresFornecedores);
            economiaDoMes += maiorValorTotal - menorValorTotal;
          }
        }
      });

      monthlyDataArray.push({
        month: mesNome,
        economia: economiaDoMes,
        cotacoes: quotesDoMes.length
      });
    }

    return monthlyDataArray;
  }, [data]);

  const dailyData = useMemo(() => {
    if (!data) return [];

    const now = new Date();
    const dailyDataArray = [];

    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayInicio = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayFim = new Date(dayInicio.getTime() + 24 * 60 * 60 * 1000 - 1);

      const quotesDoDia = data.quotes.filter((q: any) => {
        const dataCriacao = new Date(q.created_at);
        const isFinalized = q.status === 'finalizada' || q.status === 'concluida';
        return dataCriacao >= dayInicio && dataCriacao <= dayFim && isFinalized;
      });

      let economiaDoDia = 0;
      quotesDoDia.forEach((quote: any) => {
        if (quote.quote_supplier_items && quote.quote_supplier_items.length >= 2) {
          // Agrupar por fornecedor e calcular valor total
          const fornecedoresMap = new Map();
          
          quote.quote_supplier_items.forEach((item: any) => {
            const supplierId = item.supplier_id;
            const quoteItem = quote.quote_items?.find((qi: any) => qi.product_id === item.product_id);
            const quantidade = parseInt(quoteItem?.quantidade || "1") || 1;
            const valorTotal = (item.valor_oferecido || 0) * quantidade;
            
            if (!fornecedoresMap.has(supplierId)) {
              fornecedoresMap.set(supplierId, 0);
            }
            fornecedoresMap.set(supplierId, fornecedoresMap.get(supplierId) + valorTotal);
          });

          // Calcular economia
          const valoresFornecedores = Array.from(fornecedoresMap.values()).filter(v => v > 0);
          if (valoresFornecedores.length >= 2) {
            const menorValorTotal = Math.min(...valoresFornecedores);
            const maiorValorTotal = Math.max(...valoresFornecedores);
            economiaDoDia += maiorValorTotal - menorValorTotal;
          }
        }
      });

      dailyDataArray.push({
        day: day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        economia: economiaDoDia,
        cotacoes: quotesDoDia.length
      });
    }

    return dailyDataArray;
  }, [data]);

  return {
    metrics,
    recentQuotes,
    topSuppliers,
    monthlyData,
    dailyData,
    isLoading,
  };
}
