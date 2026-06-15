import { generateQuoteReportHTML } from "./whatsapp-service";

/**
 * Fonte única do relatório profissional de cotação.
 *
 * Tanto o "Resumo de Cotação" quanto o "Gerenciar Cotação" usam estas funções
 * para gerar EXATAMENTE o mesmo relatório — seja para baixar (HTML) ou enviar
 * pelo WhatsApp. A lógica foi portada do ResumoCotacaoDialog para evitar
 * divergência entre os dois fluxos.
 */

export interface QuoteReportInput {
  quoteId: string;
  dateLabel: string;
  companyName: string;
  /** {product_id, product_name, quantidade, unidade} */
  products: any[];
  /** {id, nome, status} */
  fornecedores: any[];
  /** {supplier_id, product_id, valor_oferecido, valor_inicial, price_history} */
  supplierItems: any[];
  viewMode?: "winners" | "comparative";
}

const safeStr = (val: any): string => (typeof val === "string" ? val : String(val || ""));

/**
 * Monta o objeto de opções consumido por generateQuoteReportHTML a partir dos
 * dados crus da cotação (produtos, fornecedores e ofertas).
 */
export function buildQuoteReportOpts(input: QuoteReportInput) {
  const { products, fornecedores, supplierItems } = input;

  const getSupplierProductValue = (supplierId: string, productId: string): number =>
    supplierItems.find((i: any) => i?.supplier_id === supplierId && i?.product_id === productId)?.valor_oferecido || 0;

  const getProductHistorySequence = (productId: string, winnerId: string | null): number[] => {
    if (!winnerId) return [];
    const item = supplierItems.find((i: any) => i?.supplier_id === winnerId && i?.product_id === productId);
    if (!item) return [];

    const history = item.price_history || [];
    const currentPrice = item.valor_oferecido;
    const initialPrice = item.valor_inicial;

    const sequencePrices: number[] = [];
    if (initialPrice > 0) sequencePrices.push(initialPrice);

    const seq = [...history].sort(
      (a: any, b: any) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
    );
    seq.forEach((h: any) => {
      if (sequencePrices.length === 0 || sequencePrices[sequencePrices.length - 1] !== h.old_price) {
        sequencePrices.push(h.old_price);
      }
    });

    if (
      sequencePrices.length === 0 ||
      Math.abs(sequencePrices[sequencePrices.length - 1] - currentPrice) > 0.001
    ) {
      sequencePrices.push(currentPrice);
    }

    return sequencePrices;
  };

  const getBestPrice = (productId: string) => {
    let best = { price: 0, supplier: "-" };
    fornecedores.forEach((f: any) => {
      const val = getSupplierProductValue(f.id, productId);
      if (val > 0 && (best.price === 0 || val < best.price)) {
        best = { price: val, supplier: safeStr(f.nome) };
      }
    });
    return best;
  };

  const produtosComVencedor = products.map((p: any) => {
    const best = getBestPrice(p.product_id);
    const qtd = Number(p.quantidade) || 1;

    let winnerId: string | null = null;
    fornecedores.forEach((f: any) => {
      const val = getSupplierProductValue(f.id, p.product_id);
      if (val > 0 && val === best.price) winnerId = f.id;
    });

    const priceSequence = getProductHistorySequence(p.product_id, winnerId);

    const allOffers = fornecedores
      .map((f: any) => {
        const val = getSupplierProductValue(f.id, p.product_id);
        const entry = supplierItems.find(
          (i: any) => i?.supplier_id === f.id && i?.product_id === p.product_id
        );
        const initialPrice = Number(entry?.valor_inicial) || val;
        return {
          supplierId: f.id,
          supplierName: safeStr(f.nome),
          price: val,
          initialPrice,
          total: val * qtd,
          isWinner: f.id === winnerId && val > 0,
          wasNegotiated: initialPrice > 0 && val > 0 && Math.abs(initialPrice - val) > 0.001,
        };
      })
      .filter((s: any) => s.price > 0)
      .sort((a: any, b: any) => a.price - b.price);

    return {
      productId: p.product_id,
      productName: p.product_name,
      quantidade: qtd,
      unidade: p.unidade,
      bestPrice: best.price,
      bestSupplier: best.supplier,
      winnerId,
      totalItem: best.price * qtd,
      priceSequence,
      allOffers,
    };
  });

  const totalMelhorPreco = produtosComVencedor.reduce((t: number, p: any) => t + p.totalItem, 0);

  const totalEconomiaReal = produtosComVencedor.reduce((economia: number, p: any) => {
    if (p.priceSequence && p.priceSequence.length > 1) {
      const first = p.priceSequence[0];
      const last = p.priceSequence[p.priceSequence.length - 1];
      if (first > last && p.quantidade) return economia + (first - last) * p.quantidade;
    }
    return economia;
  }, 0);

  // Economia da NEGOCIAÇÃO: preço inicial ofertado pelo vencedor − preço final negociado.
  // Quando não houve negociação (inicial == final), é 0 — não usamos o spread
  // entre fornecedores (mais caro vs mais barato), que NÃO é economia negociada.
  const totalEconomiaCalculada = produtosComVencedor.reduce((sum: number, p: any) => {
    const winnerOffer = (p.allOffers || []).find((o: any) => o.isWinner);
    if (!winnerOffer) return sum;
    const inicial = winnerOffer.initialPrice || 0;
    const final_ = winnerOffer.price || 0;
    if (inicial > final_ && final_ > 0) return sum + (inicial - final_) * (p.quantidade || 1);
    return sum;
  }, 0);

  const groupedData = Object.values(
    produtosComVencedor.reduce((acc: Record<string, any>, p: any) => {
      const name = p.bestSupplier || "Pendente / Sem Vencedor";
      if (!acc[name]) acc[name] = { name, items: [], total: 0 };
      acc[name].items.push(p);
      acc[name].total += p.totalItem;
      return acc;
    }, {})
  ).sort((a: any, b: any) => {
    if (a.name === "Pendente / Sem Vencedor") return 1;
    if (b.name === "Pendente / Sem Vencedor") return -1;
    return a.name.localeCompare(b.name);
  });

  return {
    quoteId: input.quoteId,
    dateLabel: input.dateLabel,
    companyName: input.companyName,
    totalProdutos: products.length,
    totalFornecedores: fornecedores.length,
    fornecedoresRespondidos: fornecedores.filter((f: any) => f.status === "respondido").length,
    totalMelhorPreco,
    totalEconomiaReal: totalEconomiaReal || totalEconomiaCalculada,
    productsData: produtosComVencedor,
    viewMode: input.viewMode || "winners",
    groupedData,
  };
}

/** Gera o HTML completo do relatório profissional a partir dos dados da cotação. */
export function generateQuoteReportFromData(input: QuoteReportInput): string {
  return generateQuoteReportHTML(buildQuoteReportOpts(input));
}

/**
 * Legenda curta que acompanha o relatório no WhatsApp:
 * empresa, economia total e data.
 */
export function buildQuoteReportCaption(opts: { companyName: string; totalEconomiaReal: number }): string {
  const economia = (opts.totalEconomiaReal || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const data = new Date().toLocaleDateString("pt-BR");
  return `*Relatório de Negociação*\n${opts.companyName}\n\nEconomia total: *${economia}*\nData: ${data}`;
}

/** Dispara o download do relatório HTML no navegador. */
export function downloadQuoteReport(html: string, quoteId: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-cotacao-${safeStr(quoteId).slice(0, 8)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
