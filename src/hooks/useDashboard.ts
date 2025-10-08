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
    data.quotes.forEach((quote: any) => {
      // Use quote_supplier_items for accurate price comparison
      if (quote.quote_supplier_items && quote.quote_supplier_items.length >= 2) {
        // Group by product to compare prices per product
        const produtosMap = new Map();
        quote.quote_supplier_items.forEach((item: any) => {
          if (!produtosMap.has(item.product_id)) {
            produtosMap.set(item.product_id, []);
          }
          if (item.valor_oferecido > 0) {
            produtosMap.get(item.product_id).push(item.valor_oferecido);
          }
        });

        // Calculate savings per product
        produtosMap.forEach((valores: number[]) => {
          if (valores.length >= 2) {
            const melhorPreco = Math.min(...valores);
            const piorPreco = Math.max(...valores);
            economiaTotal += piorPreco - melhorPreco;
          }
        });
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
        if (quote.quote_supplier_items && quote.quote_supplier_items.length >= 2) {
          // Group by product to compare prices per product
          const produtosMap = new Map();
          quote.quote_supplier_items.forEach((item: any) => {
            if (!produtosMap.has(item.product_id)) {
              produtosMap.set(item.product_id, []);
            }
            if (item.valor_oferecido > 0) {
              produtosMap.get(item.product_id).push(item.valor_oferecido);
            }
          });

          // Calculate savings per product
          produtosMap.forEach((valores: number[]) => {
            if (valores.length >= 2) {
              const melhorPreco = Math.min(...valores);
              const piorPreco = Math.max(...valores);
              economiaDoMes += piorPreco - melhorPreco;
            }
          });
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
