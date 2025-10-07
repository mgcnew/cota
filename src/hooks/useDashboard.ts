import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export function useDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      // OPTIMIZED: Fetch all data in parallel
      const [quotesResult, suppliersResult, productsResult, ordersResult] = await Promise.all([
        supabase.from("quotes").select(`*, quote_items(*), quote_suppliers(*)`).order("created_at", { ascending: false }),
        supabase.from("suppliers").select("*"),
        supabase.from("products").select("*"),
        supabase.from("orders").select("*").order("order_date", { ascending: false }),
      ]);

      if (quotesResult.error) throw quotesResult.error;
      if (suppliersResult.error) throw suppliersResult.error;
      if (productsResult.error) throw productsResult.error;
      if (ordersResult.error) throw ordersResult.error;

      return {
        quotes: quotesResult.data || [],
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
    data.quotes.forEach((quote: any) => {
      if (quote.quote_suppliers && quote.quote_suppliers.length >= 2) {
        const valores = quote.quote_suppliers
          .map((qs: any) => {
            // Busca robusta por preços
            return qs.valor_oferecido || qs.price || qs.valor || qs.preco || 0;
          })
          .filter((valor: number) => valor > 0);
        
        if (valores.length >= 2) {
          const melhorPreco = Math.min(...valores);
          const piorPreco = Math.max(...valores);
          economiaTotal += piorPreco - melhorPreco;
        }
      }
    });

    const produtosUnicos = new Set();
    data.quotes.forEach((quote: any) => {
      quote.quote_items?.forEach((item: any) => {
        produtosUnicos.add(item.product_id);
      });
    });

    return {
      cotacoesAtivas,
      fornecedores: fornecedoresCount,
      economiaGerada: economiaTotal,
      produtosCotados: produtosUnicos.size
    };
  }, [data]);

  const recentQuotes = useMemo(() => {
    if (!data) return [];

    return data.quotes.slice(0, 4).map((quote: any) => {
      // Debug: Log da estrutura da cotação (remover após identificar o problema)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Analisando cotação:', {
          id: quote.id,
          quote_suppliers: quote.quote_suppliers,
          quote_items: quote.quote_items,
          campos_diretos: {
            valor_total: quote.valor_total,
            total: quote.total,
            price: quote.price
          }
        });
      }
      // Busca mais robusta por preços em diferentes campos possíveis
      let melhorOferta = null;
      let melhorPreco = Infinity;
      let fornecedorMelhorOferta = null;

      // Verifica quote_suppliers
      if (quote.quote_suppliers && quote.quote_suppliers.length > 0) {
        quote.quote_suppliers.forEach((qs: any) => {
          // Tenta diferentes campos onde o preço pode estar armazenado
          const preco = qs.valor_oferecido || qs.price || qs.valor || qs.preco || 0;
          
          if (preco > 0 && preco < melhorPreco) {
            melhorPreco = preco;
            melhorOferta = qs;
            fornecedorMelhorOferta = qs.supplier_name || qs.fornecedor || qs.name;
          }
        });
      }

      // Se não encontrou em quote_suppliers, verifica quote_items
      if (!melhorOferta && quote.quote_items && quote.quote_items.length > 0) {
        quote.quote_items.forEach((item: any) => {
          const preco = item.preco_unitario || item.price || item.valor || item.preco || 0;
          
          if (preco > 0 && preco < melhorPreco) {
            melhorPreco = preco;
            melhorOferta = { valor_oferecido: preco };
            fornecedorMelhorOferta = item.supplier_name || item.fornecedor || "Fornecedor";
          }
        });
      }

      // Se ainda não encontrou, verifica campos diretos na cotação
      if (!melhorOferta) {
        const precoQuote = quote.valor_total || quote.total || quote.price || 0;
        if (precoQuote > 0) {
          melhorPreco = precoQuote;
          melhorOferta = { valor_oferecido: precoQuote };
          fornecedorMelhorOferta = quote.supplier_name || quote.fornecedor || "Fornecedor";
        }
      }

      const firstItem = quote.quote_items?.[0];

      return {
        id: quote.id.substring(0, 8),
        product: firstItem?.product_name || firstItem?.nome || firstItem?.name || "Produto",
        quantity: firstItem?.quantidade || firstItem?.quantity || "0",
        bestPrice: melhorOferta && melhorPreco !== Infinity 
          ? `R$ ${melhorPreco.toFixed(2)}` 
          : "Sem ofertas",
        supplier: fornecedorMelhorOferta || "-",
        date: new Date(quote.created_at).toLocaleDateString('pt-BR'),
        status: quote.status
      };
    });
  }, [data]);

  const topSuppliers = useMemo(() => {
    if (!data) return [];

    const supplierStats = new Map();
    data.quotes.forEach((quote: any) => {
      quote.quote_suppliers?.forEach((qs: any) => {
        const supplierId = qs.supplier_id || qs.id || qs.fornecedor_id;
        const supplierName = qs.supplier_name || qs.name || qs.fornecedor || 'Fornecedor';
        
        if (!supplierStats.has(supplierId)) {
          supplierStats.set(supplierId, {
            name: supplierName,
            quotes: 0,
            totalValue: 0,
            count: 0
          });
        }
        const stats = supplierStats.get(supplierId);
        stats.quotes += 1;
        
        // Busca robusta por valor
        const valor = qs.valor_oferecido || qs.price || qs.valor || qs.preco || 0;
        if (valor > 0) {
          stats.totalValue += valor;
          stats.count += 1;
        }
      });
    });

    return Array.from(supplierStats.values())
      .sort((a, b) => b.quotes - a.quotes)
      .slice(0, 4)
      .map(supplier => ({
        name: supplier.name,
        quotes: supplier.quotes,
        avgPrice: supplier.count > 0 ? `R$ ${(supplier.totalValue / supplier.count).toFixed(2)}` : "R$ 0.00",
        savings: "0%"
      }));
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
        return dataInicio >= mesInicio && dataInicio <= mesFim;
      });

      let economiaDoMes = 0;
      quotesDoMes.forEach((quote: any) => {
        if (quote.quote_suppliers && quote.quote_suppliers.length >= 2) {
          const valores = quote.quote_suppliers
            .map((qs: any) => {
              // Busca robusta por preços
              return qs.valor_oferecido || qs.price || qs.valor || qs.preco || 0;
            })
            .filter((valor: number) => valor > 0);
          
          if (valores.length >= 2) {
            const melhorPreco = Math.min(...valores);
            const piorPreco = Math.max(...valores);
            economiaDoMes += piorPreco - melhorPreco;
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

  return {
    metrics,
    recentQuotes,
    topSuppliers,
    monthlyData,
    isLoading,
  };
}
