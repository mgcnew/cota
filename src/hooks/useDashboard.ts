import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { normalizePrice, calculateEconomy, type PriceMetadata } from '@/utils/priceNormalization';

const COMPETITIVE_THRESHOLD = 0.05;
const APPROVAL_TARGET = 75;
const PENDING_SLA_DAYS = 3;
const APPROVED_STATUSES = new Set(['finalizada', 'concluida', 'approved', 'aprovada']);
const PENDING_STATUSES = new Set(['pendente', 'pending', 'ativa']);
const REJECTED_STATUSES = new Set(['rejeitada', 'rejected', 'cancelada', 'expirada']);

type SupplierTotals = {
  supplierId: string;
  total: number;
  productTotals: Record<string, number>;
};

type QuoteEconomics = {
  economiaRealizada: number;
  economiaPotencial: number;
  fornecedoresCompetitivos: number;
  fornecedoresValidos: number;
};

type EconomyBreakdown = {
  economiaRealizada: number;
  economiaPotencial: number;
  eficienciaEconomia: number;
};

type ApprovalHistoryPoint = {
  label: string;
  taxa: number;
  aprovadas: number;
  total: number;
};

const buildSupplierTotals = (quote: any): SupplierTotals[] => {
  const totalsMap = new Map<string, { total: number; productTotals: Record<string, number> }>();

  quote.quote_supplier_items?.forEach((item: any) => {
    const supplierId = item.supplier_id;
    if (!supplierId) return;

    const rawValor = Number(item.valor_oferecido);
    if (!Number.isFinite(rawValor) || rawValor <= 0) return;

    const quoteItem = quote.quote_items?.find((qi: any) => qi.product_id === item.product_id);
    const parsedQuantity = parseFloat(quoteItem?.quantidade ?? '1');
    const quantidade = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;
    
    // Get purchase unit from quote item
    const purchaseUnit = quoteItem?.unidade_compra || 'un';
    
    // Build price metadata from supplier item
    const priceMetadata: PriceMetadata = {
      valorOferecido: rawValor,
      unidadePreco: (item.unidade_preco || 'un') as any,
      fatorConversao: item.fator_conversao || undefined,
      quantidadePorEmbalagem: item.quantidade_por_embalagem || undefined,
    };
    
    // Normalize price to get total value
    let valorTotal: number;
    try {
      const normalized = normalizePrice(priceMetadata, quantidade, purchaseUnit);
      valorTotal = normalized.valorTotal;
    } catch (error) {
      // If normalization fails, fall back to simple multiplication
      valorTotal = rawValor * quantidade;
    }

    if (valorTotal <= 0) return;

    const supplierKey = String(supplierId);
    const entry = totalsMap.get(supplierKey) || { total: 0, productTotals: {} };
    entry.total += valorTotal;
    const productKey = String(item.product_id);
    entry.productTotals[productKey] = (entry.productTotals[productKey] || 0) + valorTotal;
    totalsMap.set(supplierKey, entry);
  });

  return Array.from(totalsMap.entries())
    .map(([supplierId, data]) => ({
      supplierId,
      total: data.total,
      productTotals: data.productTotals,
    }))
    .filter(({ total }) => total > 0);
};

const calculateQuoteEconomics = (supplierTotals: SupplierTotals[], quote?: any): QuoteEconomics => {
  const validSuppliers = supplierTotals.filter(({ total }) => total > 0);

  if (validSuppliers.length < 2) {
    const participantes = validSuppliers.length;
    return {
      economiaRealizada: 0,
      economiaPotencial: 0,
      fornecedoresCompetitivos: participantes,
      fornecedoresValidos: participantes,
    };
  }

  const productOffers = new Map<string, Array<{ supplierId: string; value: number }>>();

  validSuppliers.forEach(({ supplierId, productTotals }) => {
    Object.entries(productTotals).forEach(([productId, value]) => {
      if (!Number.isFinite(value) || value <= 0) return;
      const list = productOffers.get(productId) || [];
      list.push({ supplierId, value });
      productOffers.set(productId, list);
    });
  });

  let economiaRealizada = 0;
  let economiaPotencial = 0;

  const bestValuePerProduct = new Map<string, number>();

  productOffers.forEach((offers, productId) => {
    if (offers.length < 2) return;

    let minValue = Infinity;
    let maxValue = -Infinity;

    offers.forEach(({ value }) => {
      if (value < minValue) minValue = value;
      if (value > maxValue) maxValue = value;
    });

    if (!Number.isFinite(minValue) || minValue <= 0) return;

    economiaRealizada += Math.max(maxValue - minValue, 0);

    offers.forEach(({ value }) => {
      if (value > minValue) {
        economiaPotencial += value - minValue;
      }
    });

    bestValuePerProduct.set(productId, minValue);
  });

  if (economiaRealizada < 0) economiaRealizada = 0;
  if (economiaPotencial < 0) economiaPotencial = 0;

  let fornecedoresCompetitivos = 0;
  let fornecedoresValidos = 0;

  validSuppliers.forEach(({ productTotals }) => {
    let supplierTotal = 0;
    let comparableBestTotal = 0;

    Object.entries(productTotals).forEach(([productId, value]) => {
      const bestValue = bestValuePerProduct.get(productId);
      if (!bestValue || value <= 0) return;
      supplierTotal += value;
      comparableBestTotal += bestValue;
    });

    if (supplierTotal <= 0 || comparableBestTotal <= 0) {
      return;
    }

    fornecedoresValidos += 1;

    const diffPercent = (supplierTotal - comparableBestTotal) / comparableBestTotal;
    if (diffPercent <= COMPETITIVE_THRESHOLD) {
      fornecedoresCompetitivos += 1;
    }
  });

  if (fornecedoresCompetitivos === 0 && fornecedoresValidos > 0) {
    fornecedoresCompetitivos = 1;
  }

  return {
    economiaRealizada,
    economiaPotencial,
    fornecedoresCompetitivos,
    fornecedoresValidos,
  };
};

export function useDashboard() {
  // 1. Calculate the date range (last 6 months) for recent analysis
  const sixMonthsAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      // 2. Parallel fetching with date filters to reduce payload
      const [quotesRes, suppliersRes, ordersRes] = await Promise.all([
        supabase
          .from("quotes")
          .select(`id, status, created_at, data_planejada, data_inicio, data_fim, quote_items(product_id, product_name, quantidade, unidade), quote_suppliers(supplier_id, supplier_name, status, data_resposta)`)
          .gte('created_at', sixMonthsAgo)
          .order("created_at", { ascending: false }),
        supabase.from("suppliers").select("id, name"),
        supabase
          .from("orders")
          .select("*")
          .gte('created_at', sixMonthsAgo)
          .order("order_date", { ascending: false }),
      ]);

      if (quotesRes.error) throw quotesRes.error;
      const quotes = quotesRes.data || [];
      const quoteIds = quotes.map(q => q.id);

      // 3. Optimized chunked fetching for supplier items (only recent quotes)
      let allSupplierItems: any[] = [];
      if (quoteIds.length > 0) {
        const chunkSize = 50; // Smaller chunks for better responsiveness
        for (let i = 0; i < quoteIds.length; i += chunkSize) {
          const chunk = quoteIds.slice(i, i + chunkSize);
          const { data: items, error: itemsError } = await supabase
            .from("quote_supplier_items")
            .select("quote_id, supplier_id, product_id, valor_oferecido, unidade_preco, fator_conversao, quantidade_por_embalagem")
            .in("quote_id", chunk);
          
          if (!itemsError && items) {
            allSupplierItems = [...allSupplierItems, ...items];
          }
        }
      }

      // 4. Efficient integration using a Map for O(1) lookups
      const itemsByQuote = new Map();
      allSupplierItems.forEach(item => {
        const list = itemsByQuote.get(item.quote_id) || [];
        list.push(item);
        itemsByQuote.set(item.quote_id, list);
      });

      const quotesWithSupplierItems = quotes.map(quote => ({
        ...quote,
        quote_supplier_items: itemsByQuote.get(quote.id) || []
      }));

      return {
        quotes: quotesWithSupplierItems,
        suppliers: suppliersRes.data || [],
        products: [],
        orders: ordersRes.data || [],
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000, // Sync with persistQueryClient
  });

  // OPTIMIZED: Memoize expensive calculations
  const metrics = useMemo(() => {
    if (!data) {
      return {
        cotacoesAtivas: 0,
        fornecedores: 0,
        economiaGerada: 0,
        economiaPotencial: 0,
        eficienciaEconomia: 0,
        competitividadeMedia: 0,
        mediaFornecedoresParticipantes: 0,
        produtosCotados: 0,
        taxaAtividade: 0,
        taxaAprovacao: 0,
        taxaAprovacaoAnterior: 0,
        variacaoTaxaAprovacao: 0,
        aprovacoesTotal: 0,
        pendenciasTotal: 0,
        rejeicoesTotal: 0,
        aprovacoesMesAtual: 0,
        aprovacoesMesAnterior: 0,
        pendenciasAtrasadas: 0,
        taxaAprovacaoMeta: APPROVAL_TARGET,
        ultimasRejeicoes: [],
        crescimentoCotacoes: 0,
        crescimentoEconomia: 0,
        economiaPotencialCrescimento: 0,
        ultimos7DiasCotacoes: Array(7).fill(0),
        economiaPorPeriodo: [],
      };
    }

    // Helper para calcular status real
    const getStatusReal = (quote: any): string => {
      if (quote.data_planejada) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const planejada = new Date(quote.data_planejada);
        planejada.setHours(0, 0, 0, 0);
        
        if (planejada > hoje && quote.status === 'planejada') {
          return 'planejada';
        } else if (planejada <= hoje && quote.status === 'planejada') {
          return 'ativa';
        }
      }
      return quote.status;
    };

    const cotacoesAtivas = data.quotes.filter((q: any) => getStatusReal(q) === 'ativa').length;
    const fornecedoresCount = data.suppliers.length;

    const produtosUnicos = new Set();
    data.quotes.forEach((quote: any) => {
      quote.quote_items?.forEach((item: any) => {
        produtosUnicos.add(item.product_id);
      });
    });

    const cotacoesFinalizadas = data.quotes.filter((q: any) => {
      const statusReal = getStatusReal(q);
      return q.status === 'finalizada' || q.status === 'concluida';
    });

    let economiaTotalRealizada = 0;
    let economiaPotencialTotal = 0;
    let fornecedoresValidosTotal = 0;
    let competitividadePercentualSoma = 0;
    let cotacoesComCompetitividade = 0;
    let cotacoesProcessadas = 0;

    cotacoesFinalizadas.forEach((quote: any) => {
      const supplierTotals = buildSupplierTotals(quote);
      if (supplierTotals.length === 0) return;

      const economics = calculateQuoteEconomics(supplierTotals, quote);
      economiaTotalRealizada += economics.economiaRealizada;
      economiaPotencialTotal += economics.economiaPotencial;
      fornecedoresValidosTotal += economics.fornecedoresValidos;
      cotacoesProcessadas += 1;

      if (economics.fornecedoresValidos > 0) {
        competitividadePercentualSoma += economics.fornecedoresCompetitivos / economics.fornecedoresValidos;
        cotacoesComCompetitividade += 1;
      }
    });

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

    const cotacoesAprovadas = data.quotes.filter((q: any) => {
      const statusReal = getStatusReal(q);
      return APPROVED_STATUSES.has(q.status);
    });

    const cotacoesPendentes = data.quotes.filter((q: any) => {
      const statusReal = getStatusReal(q);
      return PENDING_STATUSES.has(statusReal);
    });

    const cotacoesRejeitadas = data.quotes.filter((q: any) =>
      REJECTED_STATUSES.has(q.status)
    );

    const taxaAprovacao = data.quotes.length > 0
      ? Math.round((cotacoesAprovadas.length / data.quotes.length) * 100)
      : 0;

    const now = new Date();
    const mesAtualInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    const mesAnteriorInicio = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const mesAnteriorFim = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const cotacoesMesAtualLista = data.quotes.filter((q: any) => {
      const dataInicio = new Date(q.data_inicio || q.created_at);
      return dataInicio >= mesAtualInicio;
    });

    const cotacoesMesAnteriorLista = data.quotes.filter((q: any) => {
      const dataInicio = new Date(q.data_inicio || q.created_at);
      return dataInicio >= mesAnteriorInicio && dataInicio <= mesAnteriorFim;
    });

    const cotacoesMesAtual = cotacoesMesAtualLista.length;
    const cotacoesMesAnterior = cotacoesMesAnteriorLista.length;

    const aprovacoesMesAtual = cotacoesMesAtualLista.filter((q: any) => APPROVED_STATUSES.has(q.status)).length;
    const aprovacoesMesAnterior = cotacoesMesAnteriorLista.filter((q: any) => APPROVED_STATUSES.has(q.status)).length;

    const taxaAprovacaoAnterior = cotacoesMesAnterior > 0
      ? Math.round((aprovacoesMesAnterior / cotacoesMesAnterior) * 100)
      : 0;

    const variacaoTaxaAprovacao = taxaAprovacao - taxaAprovacaoAnterior;

    const slaLimit = new Date();
    slaLimit.setDate(slaLimit.getDate() - PENDING_SLA_DAYS);

    const pendenciasAtrasadas = cotacoesPendentes.filter((q: any) => {
      const dataInicio = new Date(q.data_inicio || q.created_at);
      return dataInicio < slaLimit;
    }).length;

    const ultimasRejeicoes = data.quotes
      .filter((q: any) => REJECTED_STATUSES.has(q.status))
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .map((quote: any) => {
        const firstItem = quote.quote_items?.[0];
        const productName = firstItem?.product_name || 'Produto';
        const supplierName = quote.quote_suppliers?.[0]?.supplier_name || '-';

        return {
          id: quote.id,
          product: productName,
          supplier: supplierName,
          status: quote.status,
          date: new Date(quote.created_at).toLocaleDateString('pt-BR'),
        };
      });

    let economiaMesAtual = 0;
    let economiaPotencialMesAtual = 0;
    data.quotes.forEach((quote: any) => {
      const dataInicio = new Date(quote.data_inicio || quote.created_at);
      const isFinalized = quote.status === 'finalizada' || quote.status === 'concluida';
      if (!isFinalized || dataInicio < mesAtualInicio) return;

      const supplierTotals = buildSupplierTotals(quote);
      if (supplierTotals.length === 0) return;
      const economics = calculateQuoteEconomics(supplierTotals, quote);
      economiaMesAtual += economics.economiaRealizada;
      economiaPotencialMesAtual += economics.economiaPotencial;
    });

    let economiaMesAnterior = 0;
    let economiaPotencialMesAnterior = 0;
    data.quotes.forEach((quote: any) => {
      const dataInicio = new Date(quote.data_inicio || quote.created_at);
      const isFinalized = quote.status === 'finalizada' || quote.status === 'concluida';
      if (!isFinalized || dataInicio < mesAnteriorInicio || dataInicio > mesAnteriorFim) return;

      const supplierTotals = buildSupplierTotals(quote);
      if (supplierTotals.length === 0) return;
      const economics = calculateQuoteEconomics(supplierTotals, quote);
      economiaMesAnterior += economics.economiaRealizada;
      economiaPotencialMesAnterior += economics.economiaPotencial;
    });

    const crescimentoCotacoes = cotacoesMesAnterior > 0
      ? Math.round(((cotacoesMesAtual - cotacoesMesAnterior) / cotacoesMesAnterior) * 100)
      : cotacoesMesAtual > 0 ? 100 : 0;

    const crescimentoEconomia = economiaMesAnterior > 0
      ? Math.round(((economiaMesAtual - economiaMesAnterior) / economiaMesAnterior) * 100)
      : economiaMesAtual > 0 ? 100 : 0;

    const economiaPotencialCrescimento = economiaPotencialMesAnterior > 0
      ? Math.round(((economiaPotencialMesAtual - economiaPotencialMesAnterior) / economiaPotencialMesAnterior) * 100)
      : economiaPotencialMesAtual > 0 ? 100 : 0;

    const ultimos7Dias: number[] = [];
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

    const eficienciaEconomia = economiaPotencialTotal > 0
      ? Math.round((economiaTotalRealizada / economiaPotencialTotal) * 100)
      : 0;

    const competitividadeMedia = cotacoesComCompetitividade > 0
      ? Math.round((competitividadePercentualSoma / cotacoesComCompetitividade) * 100)
      : 0;

    const mediaFornecedoresParticipantes = cotacoesProcessadas > 0
      ? Math.round(fornecedoresValidosTotal / cotacoesProcessadas)
      : 0;

    const computeEconomyBreakdown = (start: Date, end: Date): EconomyBreakdown => {
      let totalRealizada = 0;
      let totalPotencial = 0;

      data.quotes.forEach((quote: any) => {
        const dataInicio = new Date(quote.data_inicio || quote.created_at);
        const isFinalized = quote.status === 'finalizada' || quote.status === 'concluida';
        if (!isFinalized || dataInicio < start || dataInicio > end) return;

        const supplierTotals = buildSupplierTotals(quote);
        if (supplierTotals.length < 2) return;

        const economics = calculateQuoteEconomics(supplierTotals, quote);
        totalRealizada += economics.economiaRealizada;
        totalPotencial += economics.economiaPotencial;
      });

      const eficienciaPeriodo = totalPotencial > 0
        ? Math.round((totalRealizada / totalPotencial) * 100)
        : 0;

      return {
        economiaRealizada: totalRealizada,
        economiaPotencial: totalPotencial,
        eficienciaEconomia: eficienciaPeriodo,
      };
    };

    const fimMesAtual = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const doisMesesAtrasInicio = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const doisMesesAtrasFim = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);

    const economiaPorPeriodo = [
      {
        key: 'current',
        label: 'Mês atual',
        ...computeEconomyBreakdown(mesAtualInicio, fimMesAtual),
      },
      {
        key: 'previous',
        label: 'Mês anterior',
        ...computeEconomyBreakdown(mesAnteriorInicio, mesAnteriorFim),
      },
      {
        key: 'twoMonthsAgo',
        label: 'Há 2 meses',
        ...computeEconomyBreakdown(doisMesesAtrasInicio, doisMesesAtrasFim),
      },
    ];

    const approvalHistory: ApprovalHistoryPoint[] = [];
    const historyMap = new Map<string, { date: Date; aprovadas: number; total: number }>();

    data.quotes.forEach((quote: any) => {
      const dataInicio = new Date(quote.data_inicio || quote.created_at);
      if (Number.isNaN(dataInicio.getTime())) return;

      const monthStart = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1);
      const key = monthStart.toISOString();

      const entry = historyMap.get(key) || { date: monthStart, aprovadas: 0, total: 0 };
      entry.total += 1;
      if (APPROVED_STATUSES.has(quote.status)) {
        entry.aprovadas += 1;
      }

      historyMap.set(key, entry);
    });

    const sortedHistory = Array.from(historyMap.values())
      .filter((entry) => entry.total > 0)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    sortedHistory.forEach((entry) => {
      const taxaMes = entry.total > 0 ? Math.round((entry.aprovadas / entry.total) * 100) : 0;
      approvalHistory.push({
        label: entry.date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        taxa: taxaMes,
        aprovadas: entry.aprovadas,
        total: entry.total,
      });
    });

    return {
      cotacoesAtivas,
      fornecedores: fornecedoresCount,
      economiaGerada: economiaTotalRealizada,
      economiaPotencial: economiaPotencialTotal,
      eficienciaEconomia,
      competitividadeMedia,
      mediaFornecedoresParticipantes,
      produtosCotados: produtosUnicos.size,
      taxaAtividade,
      taxaAprovacao,
      taxaAprovacaoAnterior,
      variacaoTaxaAprovacao,
      aprovacoesTotal: cotacoesAprovadas.length,
      pendenciasTotal: cotacoesPendentes.length,
      rejeicoesTotal: cotacoesRejeitadas.length,
      aprovacoesMesAtual,
      aprovacoesMesAnterior,
      pendenciasAtrasadas,
      taxaAprovacaoMeta: APPROVAL_TARGET,
      ultimasRejeicoes,
      crescimentoCotacoes,
      crescimentoEconomia,
      economiaPotencialCrescimento,
      ultimos7DiasCotacoes: ultimos7Dias,
      economiaPorPeriodo,
      approvalHistory,
    };
  }, [data]);

  const recentQuotes = useMemo(() => {
    if (!data) return [];

    const truncateText = (value: string, maxLength: number) => {
      const normalized = (value || "").trim();
      if (!normalized) return "-";
      return normalized.length > maxLength
        ? `${normalized.slice(0, Math.max(0, maxLength - 1))}…`
        : normalized;
    };

    const summarizeProduct = (name: string, hasMore: boolean) => {
      const normalized = (name || "Produto").trim();
      const maxLength = hasMore ? 22 : 28;
      let summary = truncateText(normalized, maxLength);
      if (hasMore && !summary.endsWith("…")) {
        summary = `${summary}…`;
      }
      return summary;
    };

    return data.quotes.slice(0, 4).map((quote: any) => {
      const firstItem = quote.quote_items?.[0];
      
      if (!firstItem) {
        const supplierName = quote.quote_suppliers?.[0]?.supplier_name || "-";
        return {
          id: quote.id.substring(0, 8),
          product: "Produto",
          productFull: quote.quote_items?.map((item: any) => item.product_name).filter(Boolean).join(", ") || "Produto",
          supplier: truncateText(supplierName, 24),
          quantity: "0",
          bestPrice: "Sem ofertas",
          supplierFull: supplierName,
          date: new Date(quote.created_at).toLocaleDateString('pt-BR'),
          status: quote.status
        };
      }

      // Find best price from quote_supplier_items for the first product
      let melhorPreco = Infinity;
      let fornecedorMelhorOferta = null;
      let allOffers: { supplier: string; price: number }[] = [];

      if (quote.quote_supplier_items && quote.quote_supplier_items.length > 0) {
        const ofertasProduto = quote.quote_supplier_items.filter((item: any) => {
          const hasValor = Number(item.valor_oferecido) > 0;
          const matchesId = item.product_id && firstItem.product_id && item.product_id.toString() === firstItem.product_id.toString();
          const matchesName = item.product_name === firstItem.product_name;
          return (matchesId || matchesName) && hasValor;
        });

        allOffers = ofertasProduto.map((item: any) => {
          const supplier = quote.quote_suppliers?.find(
            (qs: any) => qs.supplier_id?.toString() === item.supplier_id?.toString()
          );
          return {
            supplier: supplier?.supplier_name || "Fornecedor",
            price: item.valor_oferecido
          };
        }).sort((a: any, b: any) => a.price - b.price);

        if (allOffers.length > 0) {
          melhorPreco = allOffers[0].price;
          fornecedorMelhorOferta = allOffers[0].supplier;
        }
      }

      const productName = firstItem.product_name || "Produto";
      const productFull = quote.quote_items?.map((item: any) => item.product_name || "Produto").join(", ") || productName;
      const hasMultipleProducts = (quote.quote_items?.length || 0) > 1;
      const productSummary = summarizeProduct(productName, hasMultipleProducts);
      const supplierName = fornecedorMelhorOferta || "-";
      const supplierSummary = truncateText(supplierName, 24);

      return {
        id: quote.id.substring(0, 8),
        product: productSummary,
        productFull,
        quantity: firstItem.quantidade || "0",
        bestPrice: melhorPreco !== Infinity ? `R$ ${melhorPreco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Sem ofertas",
        supplier: supplierSummary,
        supplierFull: supplierName,
        date: new Date(quote.created_at).toLocaleDateString('pt-BR'),
        status: quote.status,
        offers: allOffers
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

  const scheduledSuppliers = useMemo(() => {
    if (!data) return [];
    
    const hoje = new Date();
    const diaDaSemanaStr = hoje.getDay(); // 0 = Domingo, 1 = Segunda, ...
    
    const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
    const fimDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

    return data.suppliers
      .filter((supplier: any) => {
        // Verifica se hoje é dia de pedido para o fornecedor
        const schedule = supplier.delivery_schedule || [];
        if (!schedule.includes(diaDaSemanaStr)) return false;

        // Verifica se já existe pedido feito hoje
        const pedidosHoje = data.orders.filter((order: any) => {
          if (order.supplier_id !== supplier.id) return false;
          const orderDate = new Date(order.order_date || order.created_at);
          return orderDate >= inicioDoDia && orderDate <= fimDoDia;
        });

        // Retorna apenas se não houver pedidos hoje (ou seja, alerta pendente)
        return pedidosHoje.length === 0;
      })
      .map((supplier: any) => ({
        id: supplier.id,
        name: supplier.name,
      }));
  }, [data]);

  return {
    metrics,
    recentQuotes,
    topSuppliers,
    monthlyData,
    dailyData,
    scheduledSuppliers,
    isLoading,
  };
}
