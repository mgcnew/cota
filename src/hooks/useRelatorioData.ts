import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { format, startOfMonth, subMonths } from "date-fns";

interface RelatorioFilters {
  startDate?: Date;
  endDate?: Date;
}

export function useRelatorioData({ startDate, endDate }: RelatorioFilters = {}) {
  const { data: quotes, isLoading } = useQuery({
    queryKey: ["relatorio-data", startDate?.toISOString(), endDate?.toISOString()],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("quotes")
        .select(`
          id, status, data_inicio, data_fim,
          quote_items(id, product_id, product_name),
          quote_suppliers(id, supplier_id, supplier_name, valor_oferecido, status, data_resposta)
        `)
        .order("data_inicio", { ascending: false });

      if (startDate) query = query.gte("data_inicio", format(startDate, "yyyy-MM-dd"));
      if (endDate) query = query.lte("data_inicio", format(endDate, "yyyy-MM-dd"));

      const { data, error } = await query;
      if (error) throw error;

      const quoteIds = (data || []).map((q: any) => q.id);
      let supplierItems: any[] = [];
      if (quoteIds.length > 0) {
        const { data: items } = await supabase
          .from("quote_supplier_items")
          .select("*")
          .in("quote_id", quoteIds);
        supplierItems = items || [];
      }

      return (data || []).map((q: any) => ({
        ...q,
        quote_supplier_items: supplierItems.filter((i) => i.quote_id === q.id),
      }));
    },
  });

  // ── Hero metrics ────────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    if (!quotes) return { economiaTotal: 0, cotacoesComComparacao: 0, cotacoesSemComparacao: 0, fornecedoresAtivos: 0, totalCotacoes: 0 };

    let economiaTotal = 0;
    let cotacoesComComparacao = 0;
    let cotacoesSemComparacao = 0;
    const fornecedoresAtivos = new Set<string>();

    quotes.forEach((quote: any) => {
      quote.quote_suppliers?.forEach((qs: any) => {
        if (qs.supplier_id) fornecedoresAtivos.add(qs.supplier_id);
      });

      const prodMap = new Map<string, number[]>();
      quote.quote_supplier_items?.forEach((item: any) => {
        if (item.valor_oferecido > 0) {
          if (!prodMap.has(item.product_id)) prodMap.set(item.product_id, []);
          prodMap.get(item.product_id)!.push(item.valor_oferecido);
        }
      });

      let hasComparacao = false;
      prodMap.forEach((valores) => {
        if (valores.length >= 2) {
          hasComparacao = true;
          economiaTotal += Math.max(...valores) - Math.min(...valores);
        }
      });

      const temAlgumValor = quote.quote_supplier_items?.some((i: any) => i.valor_oferecido > 0);
      if (hasComparacao) cotacoesComComparacao++;
      else if (temAlgumValor) cotacoesSemComparacao++;
    });

    return {
      economiaTotal,
      cotacoesComComparacao,
      cotacoesSemComparacao,
      fornecedoresAtivos: fornecedoresAtivos.size,
      totalCotacoes: quotes.length,
    };
  }, [quotes]);

  // ── Economia por mês (últimos 6 meses, sempre fixo) ─────────────────────────
  const { data: allQuotesForChart, isLoading: isLoadingChart } = useQuery({
    queryKey: ["relatorio-chart"],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
      const { data, error } = await supabase
        .from("quotes")
        .select("id, data_inicio")
        .gte("data_inicio", format(sixMonthsAgo, "yyyy-MM-dd"))
        .order("data_inicio", { ascending: true });
      if (error) throw error;

      const quoteIds = (data || []).map((q: any) => q.id);
      let supplierItems: any[] = [];
      if (quoteIds.length > 0) {
        const { data: items } = await supabase
          .from("quote_supplier_items")
          .select("quote_id, product_id, valor_oferecido")
          .in("quote_id", quoteIds);
        supplierItems = items || [];
      }

      return (data || []).map((q: any) => ({
        ...q,
        quote_supplier_items: supplierItems.filter((i) => i.quote_id === q.id),
      }));
    },
  });

  const economiaPorMes = useMemo(() => {
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const hoje = new Date();

    return Array.from({ length: 6 }, (_, i) => {
      const mesStart = startOfMonth(subMonths(hoje, 5 - i));
      const mesEnd = new Date(mesStart.getFullYear(), mesStart.getMonth() + 1, 0);

      const quotesMes = (allQuotesForChart || []).filter((q: any) => {
        const d = new Date(q.data_inicio);
        return d >= mesStart && d <= mesEnd;
      });

      let economia = 0;
      quotesMes.forEach((q: any) => {
        const prodMap = new Map<string, number[]>();
        q.quote_supplier_items?.forEach((item: any) => {
          if (item.valor_oferecido > 0) {
            if (!prodMap.has(item.product_id)) prodMap.set(item.product_id, []);
            prodMap.get(item.product_id)!.push(item.valor_oferecido);
          }
        });
        prodMap.forEach((valores) => {
          if (valores.length >= 2) economia += Math.max(...valores) - Math.min(...valores);
        });
      });

      return { mes: meses[mesStart.getMonth()], economia, cotacoes: quotesMes.length };
    });
  }, [allQuotesForChart]);

  // ── Produtos com maior variação de preço ────────────────────────────────────
  const variacaoProdutos = useMemo(() => {
    if (!quotes) return [];

    const prodMap = new Map<string, {
      nome: string;
      todosPrecos: number[];
      fornecedores: Set<string>;
      cotacoes: Set<string>;
    }>();

    quotes.forEach((quote: any) => {
      const produtosNaQuote = new Map<string, { nome: string; precosPorForn: Map<string, number> }>();

      quote.quote_supplier_items?.forEach((item: any) => {
        if (item.valor_oferecido > 0) {
          if (!produtosNaQuote.has(item.product_id)) {
            const prodItem = quote.quote_items?.find((qi: any) => qi.product_id === item.product_id);
            produtosNaQuote.set(item.product_id, {
              nome: prodItem?.product_name || item.product_id,
              precosPorForn: new Map(),
            });
          }
          produtosNaQuote.get(item.product_id)!.precosPorForn.set(item.supplier_id, item.valor_oferecido);
        }
      });

      produtosNaQuote.forEach((prodData, productId) => {
        if (!prodMap.has(productId)) {
          prodMap.set(productId, { nome: prodData.nome, todosPrecos: [], fornecedores: new Set(), cotacoes: new Set() });
        }
        const prod = prodMap.get(productId)!;
        prodData.precosPorForn.forEach((preco, supplierId) => {
          prod.todosPrecos.push(preco);
          prod.fornecedores.add(supplierId);
        });
        prod.cotacoes.add(quote.id);
      });
    });

    return Array.from(prodMap.entries())
      .filter(([, p]) => p.todosPrecos.length >= 2 && p.fornecedores.size >= 2)
      .map(([, p]) => {
        const min = Math.min(...p.todosPrecos);
        const max = Math.max(...p.todosPrecos);
        return {
          produto: p.nome,
          precoMin: min,
          precoMax: max,
          variacaoPercent: min > 0 ? ((max - min) / min) * 100 : 0,
          numFornecedores: p.fornecedores.size,
          cotacoes: p.cotacoes.size,
        };
      })
      .sort((a, b) => b.variacaoPercent - a.variacaoPercent)
      .slice(0, 10);
  }, [quotes]);

  // ── Ranking de fornecedores ──────────────────────────────────────────────────
  const rankingFornecedores = useMemo(() => {
    if (!quotes) return [];

    const fornMap = new Map<string, {
      nome: string;
      cotacoesConvidado: number;
      cotacoesRespondeu: number;
      economiaGerada: number;
      tempoTotal: number;
      tempoCount: number;
    }>();

    quotes.forEach((quote: any) => {
      quote.quote_suppliers?.forEach((qs: any) => {
        if (!fornMap.has(qs.supplier_id)) {
          fornMap.set(qs.supplier_id, { nome: qs.supplier_name, cotacoesConvidado: 0, cotacoesRespondeu: 0, economiaGerada: 0, tempoTotal: 0, tempoCount: 0 });
        }
        const f = fornMap.get(qs.supplier_id)!;
        f.cotacoesConvidado++;
        if (qs.valor_oferecido > 0) {
          f.cotacoesRespondeu++;
          if (qs.data_resposta && quote.data_inicio) {
            const dias = (new Date(qs.data_resposta).getTime() - new Date(quote.data_inicio).getTime()) / (1000 * 60 * 60 * 24);
            if (dias >= 0) { f.tempoTotal += dias; f.tempoCount++; }
          }
        }
      });

      // Economia gerada = fornecedor que ofereceu o menor preço por produto
      const prodPorForn = new Map<string, Map<string, number>>();
      quote.quote_supplier_items?.forEach((item: any) => {
        if (item.valor_oferecido > 0) {
          if (!prodPorForn.has(item.product_id)) prodPorForn.set(item.product_id, new Map());
          prodPorForn.get(item.product_id)!.set(item.supplier_id, item.valor_oferecido);
        }
      });

      prodPorForn.forEach((precosPorForn) => {
        if (precosPorForn.size >= 2) {
          const min = Math.min(...precosPorForn.values());
          const max = Math.max(...precosPorForn.values());
          const economia = max - min;
          precosPorForn.forEach((valor, supplierId) => {
            if (valor === min && fornMap.has(supplierId)) {
              fornMap.get(supplierId)!.economiaGerada += economia;
            }
          });
        }
      });
    });

    return Array.from(fornMap.values())
      .filter((f) => f.cotacoesConvidado > 0)
      .map((f) => ({
        nome: f.nome,
        cotacoes: f.cotacoesConvidado,
        taxaResposta: f.cotacoesConvidado > 0 ? (f.cotacoesRespondeu / f.cotacoesConvidado) * 100 : 0,
        economiaGerada: f.economiaGerada,
        tempoMedio: f.tempoCount > 0 ? f.tempoTotal / f.tempoCount : null,
      }))
      .sort((a, b) => b.economiaGerada - a.economiaGerada)
      .slice(0, 8);
  }, [quotes]);

  return {
    isLoading: isLoading || isLoadingChart,
    ...summary,
    economiaPorMes,
    variacaoProdutos,
    rankingFornecedores,
  };
}
