import { sendWhatsAppMessage as sendMsg, sendWhatsAppImage, sendWhatsAppDocument, isWApiConfigured } from "./w-api";
import { supabase } from "@/integrations/supabase/client";

const fmtCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const DEFAULT_PHONE_NUMBER = "11966670314";

export async function sendWhatsApp(
  phone: string, 
  message: string, 
  company_id?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let targetCompanyId = company_id;

    // Se nâo informou ID, tenta pegar o primeiro ativo
    if (!targetCompanyId) {
      const { data: companies } = await supabase.from("company_settings").select("company_id").limit(1);
      if (companies && companies.length > 0) {
        targetCompanyId = companies[0].company_id;
      }
    }

    if (targetCompanyId) {
      try {
        const config = await getWhatsAppConfig(targetCompanyId);
        
        // Se tiver configuração da Evolution API
        if (config?.api_url && config?.api_key && config?.instance_name) {
          const endpoint = `${config.api_url}/message/sendText/${config.instance_name}`;
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": config.api_key
            },
            body: JSON.stringify({
              number: phone.replace(/\D/g, ""), // Número sem formatação para Evolution
              text: message,
              delay: 1200,
              linkPreview: false
            })
          });

          if (response.ok) {
            return { success: true };
          }
          // Caso a Evolution API retorne erro, registraremos no log mas tentaremos o fallback abaixo
          console.warn("Evolution API falhou, tentando fallback W-API...");
        }
      } catch (e) {
        console.error("Erro ao tentar Evolution API:", e);
      }
    }

    // Fallback para W-API.app (Legado ou VITE_ envs)
    await sendMsg(phone, message);
    return { success: true };
  } catch (error: any) {
    console.error("Erro no envio de WhatsApp:", error);
    return { success: false, error: error.message };
  }
}

export async function sendWhatsAppMedia(
  phone: string,
  base64Image: string,
  caption?: string,
  company_id?: string
) {
  try {
    const data = await sendWhatsAppImage(phone, base64Image, caption);
    return { success: true, messageId: data.data?.messageId || "wapi-sent" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendWhatsAppReport(
  phone: string,
  base64Image: string,
  htmlContent: string,
  quoteId: string,
  caption?: string,
  company_id?: string
) {
  try {
    // 1. Enviar imagem com a saudação como legenda
    const imgResult = await sendWhatsAppImage(phone, base64Image, caption);
    
    // 2. Enviar o HTML como documento com prefixo data URI
    const base64Html = `data:text/html;base64,${btoa(unescape(encodeURIComponent(htmlContent)))}`;
    const fileName = `relatorio_cotacao_${quoteId.slice(0, 8)}.html`;
    
    await sendWhatsAppDocument(phone, base64Html, fileName, "Arquivo do Relatório Interativo");
    
    return { success: true, messageId: imgResult.data?.messageId || "sent" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateQuoteMessage(quoteId: string): Promise<string> {
  const { data: quote } = await supabase
    .from("quotes")
    .select("*, quote_items(*), quote_suppliers(*)")
    .eq("id", quoteId)
    .single();

  if (!quote) return "*Cotação não encontrada*";

  const companyName = "MERCADÃO NOVO BOI JOÃO DIAS";
  const productsList = (quote.quote_items || [])
    .map((item: any) => "- " + (item.product_name || "Produto") + " (" + (item.quantidade || 1) + " " + (item.unidade || "un") + ")")
    .join("\n");

  let msg = "*SOLICITAÇÃO DE COTAÇÃO - " + companyName + "*\n\n";
  msg += "Olá, gostaria de solicitar cotação para os seguintes itens:\n\n";
  msg += productsList + "\n\n";
  msg += "Por favor, envie o *espelho da nota* ou *comprovante do pedido* assim que possível.\n\n";
  msg += "*PLATAFORMA MGC | COMPRAS*";
  return msg;
}

export function generateQuoteExportMessage(
  stats: {
    totalProdutos: number;
    totalFornecedores: number;
    fornecedoresRespondidos: number;
  },
  groupedData: { name: string; items: any[]; total: number }[],
  totalSavings: number,
  melhorTotal: number,
  analysisResult?: string | null,
  potentialSavings?: number,
  companyName: string = "MERCADÃO NOVO BOI JOÃO DIAS"
): string {
  const SEP = "━━━━━━━━━━━━━━━━━━━";
  
  let m = "📜 *RESUMO DE GANHADORES | CotaJá*\n";
  m += "🏢 *" + companyName + "*\n";
  m += SEP + "\n\n";

  m += "📊 *MÉTRICAS GERAIS*\n";
  m += `• Itens: *${stats.totalProdutos}*\n`;
  m += `• Fornecedores: *${stats.fornecedoresRespondidos}/${stats.totalFornecedores}*\n`;
  m += `• Valor Total: *${fmtCurrency(melhorTotal)}*\n`;
  m += `• Economia Real: *${fmtCurrency(totalSavings)}*\n`;
  m += "\n" + SEP + "\n\n";

  m += "🏆 *DISTRIBUIÇÃO POR FORNECEDOR*\n\n";

  groupedData.forEach(g => {
    if (g.name === "Pendente / Sem Vencedor") return;

    m += `🏢 *${g.name.toUpperCase()}*\n`;
    g.items.forEach(i => {
      const unit = (i.unidade || 'un').toUpperCase();
      m += `• ${i.productName || i.product_name}\n`;
      m += `  ${i.quantidade} ${unit} x ${fmtCurrency(i.bestPrice)} = *${fmtCurrency(i.totalItem)}*\n`;
    });
    m += `💰 *Subtotal: ${fmtCurrency(g.total)}*\n\n`;
  });

  m += SEP + "\n\n";

  if (analysisResult) {
    m += "💡 *ANÁLISE ESTRATÉGICA (IA)*\n";
    m += "_" + analysisResult + "_\n\n";
    m += SEP + "\n\n";
  }

  m += "*GESTÃO DE COMPRAS AUDITADA*\n";
  m += "Sistema *CotaJá* — Inteligência de Mercado";

  return m;
}

export function generateComparativeQuoteExportMessage(
  stats: {
    totalProdutos: number;
    totalFornecedores: number;
    fornecedoresRespondidos: number;
  },
  productsData: any[],
  totalSavings: number,
  melhorTotal: number,
  analysisResult?: string | null,
  companyName: string = "MERCADÃO NOVO BOI JOÃO DIAS"
): string {
  const SEP = "━━━━━━━━━━━━━━━━━━━━━━";
  const ITEM_SEP = "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈";
  
  let m = "📊 *QUADRO COMPARATIVO GERAL*\n";
  m += `🏢 *${companyName.toUpperCase()}*\n`;
  m += SEP + "\n\n";

  productsData.forEach((p, idx) => {
    const unit = (p.unidade || 'un').toUpperCase();
    m += `*${idx + 1}. ${(p.productName || '').toUpperCase()}*\n`;
    m += `📦 Demanda: *${p.quantidade} ${unit}*\n\n`;

    // Ordenar ofertas: ganhador primeiro, depois por preço
    const sortedOffers = [...p.allOffers].sort((a, b) => {
      if (a.isWinner) return -1;
      if (b.isWinner) return 1;
      return a.price - b.price;
    });

    sortedOffers.forEach((o: any) => {
      const isWinner = o.isWinner;
      const indicator = isWinner ? "🏆" : "•";
      const supplierName = isWinner ? `*${o.supplierName.toUpperCase()}*` : o.supplierName;
      const negotiated = o.wasNegotiated && o.initialPrice > 0 && Math.abs(o.initialPrice - o.price) > 0.001;
      
      m += `${indicator} ${supplierName}\n`;
      if (negotiated) {
        m += `   └ ~${fmtCurrency(o.initialPrice)}~ → *${fmtCurrency(o.price)}* | Total: *${fmtCurrency(o.total)}*\n`;
      } else {
        m += `   └ Unit: ${fmtCurrency(o.price)} | Total: *${fmtCurrency(o.total)}*\n`;
      }
    });
    
    if (idx < productsData.length - 1) {
      m += "\n" + ITEM_SEP + "\n\n";
    }
  });

  m += "\n" + SEP + "\n";
  m += `💰 *VALOR TOTAL DO PEDIDO: ${fmtCurrency(melhorTotal)}*\n`;
  m += `📈 *ECONOMIA CAPTURADA: ${fmtCurrency(totalSavings)}*\n`;
  m += SEP + "\n\n";

  if (analysisResult) {
    m += "💡 *ANÁLISE ESTRATÉGICA*\n";
    m += "_" + analysisResult + "_\n\n";
  }

   m += "✅ *Relatório Auditado via CotaJá*\n";
  m += "_Inteligência em Gestão de Suprimentos_";

  return m;
}

/**
 * Short WhatsApp greeting — no data, just announces the report image that follows.
 */
export function generateWhatsAppGreeting(
  quoteId: string,
  totalProdutos: number,
  companyName: string = "MERCADÃO NOVO BOI JOÃO DIAS"
): string {
  return (
    `📊 *RELATÓRIO DE NEGOCIAÇÃO*\n` +
    `🏢 *${companyName.toUpperCase()}*\n\n` +
    `Cotação *#${quoteId.slice(0, 8)}* — ${totalProdutos} itens\n` +
    `Segue o comparativo completo em imagem. 👇\n\n` +
    `_CotaJá • Inteligência de Compras_`
  );
}

/**
 * Generates a self-contained HTML report for the quotation.
 * Always light mode, card-based (no horizontal scroll), responsive.
 * Contains two tabs: Melhores Preços (winners) + Comparativo por Produto.
 */
export function generateQuoteReportHTML(opts: {
  quoteId: string;
  dateLabel: string;
  companyName: string;
  totalProdutos: number;
  totalFornecedores: number;
  fornecedoresRespondidos: number;
  totalMelhorPreco: number;
  totalEconomiaReal: number;
  productsData: any[];
  viewMode?: "winners" | "comparative";
  groupedData?: { name: string; items: any[]; total: number }[];
}): string {
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const economyPct = opts.totalMelhorPreco > 0
    ? (opts.totalEconomiaReal / (opts.totalMelhorPreco + opts.totalEconomiaReal) * 100)
    : 0;
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  // ── Build winners section (by supplier) ───────────────────────────────────
  let winnersSection = "";
  (opts.groupedData || []).forEach(g => {
    if (g.name === "Pendente / Sem Vencedor") return;
    const groupEcon = g.items.reduce((sum: number, i: any) => {
      const wo = (i.allOffers || []).find((o: any) => o.isWinner);
      const vi = wo?.initialPrice || i.bestPrice;
      return sum + (vi > i.bestPrice ? (vi - i.bestPrice) * (i.quantidade || 1) : 0);
    }, 0);

    let productRows = "";
    g.items.forEach((i: any) => {
      const unit = (i.unidade || "un").toUpperCase();
      const wo = (i.allOffers || []).find((o: any) => o.isWinner);
      const vi = wo?.initialPrice || i.bestPrice;
      const econItem = vi > i.bestPrice ? (vi - i.bestPrice) * (i.quantidade || 1) : 0;

      productRows += `
        <div class="offer-row">
          <div class="offer-top">
            <span class="offer-name">${i.productName || i.product_name}</span>
            <span class="offer-unit-pill">${i.quantidade} ${unit}</span>
          </div>
          <div class="offer-bottom">
            <div class="offer-price">
              ${econItem > 0 ? `<span class="old-price">${fmt(vi)}</span>` : ""}
              <strong>${fmt(i.bestPrice)}</strong>
              <span class="offer-unit">/ ${unit}</span>
            </div>
            <span class="offer-sep">·</span>
            <div class="offer-total">${fmt(i.totalItem)}</div>
            ${econItem > 0 ? `<span class="offer-sep">·</span><div class="offer-econ">-${fmt(econItem)}</div>` : ""}
          </div>
        </div>`;
    });

    winnersSection += `
      <div class="card">
        <div class="card-head supplier-head">
          <div class="card-icon">🏢</div>
          <div class="card-info" style="flex:1">
            <div class="card-title">${g.name.toUpperCase()}</div>
            <div class="card-sub">${g.items.length} ${g.items.length === 1 ? "item" : "itens"}${groupEcon > 0 ? ` · <span class="econ-inline">${fmt(groupEcon)} economizados</span>` : ""}</div>
          </div>
          <div class="group-total">${fmt(g.total)}</div>
        </div>
        <div class="offers">${productRows}</div>
      </div>`;
  });
  if (!winnersSection) {
    winnersSection = `<div class="empty-state">Nenhum vencedor definido ainda.</div>`;
  }

  // ── Build comparative section (by product, all suppliers) ─────────────────
  let comparativeSection = "";
  opts.productsData.forEach((p, idx) => {
    const unit = (p.unidade || "un").toUpperCase();
    const sorted = [...(p.allOffers || [])].sort((a: any, b: any) => {
      if (a.isWinner) return -1;
      if (b.isWinner) return 1;
      return a.price - b.price;
    });

    let offerRows = "";
    sorted.forEach((o: any, oIdx: number) => {
      const neg = o.wasNegotiated && o.initialPrice > 0 && Math.abs(o.initialPrice - o.price) > 0.001;
      const econTotal = (o.initialPrice > 0 && o.initialPrice > o.price)
        ? (o.initialPrice - o.price) * (p.quantidade || 1) : 0;

      offerRows += `
        <div class="offer-row ${o.isWinner ? "offer-winner" : ""}">
          <div class="offer-top">
            ${o.isWinner
              ? `<span class="badge-best">✓</span>`
              : `<span class="badge-rank">${oIdx + 1}</span>`}
            <span class="offer-name">${o.supplierName}</span>
          </div>
          <div class="offer-bottom">
            <div class="offer-price">
              ${neg ? `<span class="old-price">${fmt(o.initialPrice)}</span>` : ""}
              <strong>${fmt(o.price)}</strong>
              <span class="offer-unit">/ ${unit}</span>
            </div>
            <span class="offer-sep">·</span>
            <div class="offer-total">${fmt(o.total)}</div>
            ${econTotal > 0 ? `<span class="offer-sep">·</span><div class="offer-econ">-${fmt(econTotal)}</div>` : ""}
          </div>
        </div>`;
    });

    comparativeSection += `
      <div class="card">
        <div class="card-head">
          <div class="card-num">${idx + 1}</div>
          <div class="card-info">
            <div class="card-title">${(p.productName || "").toUpperCase()}</div>
            <div class="card-sub">${p.quantidade} ${unit} · ${sorted.length} fornecedor${sorted.length !== 1 ? "es" : ""}</div>
          </div>
        </div>
        <div class="offers">${offerRows}</div>
      </div>`;
  });
  if (!comparativeSection) {
    comparativeSection = `<div class="empty-state">Nenhum dado comparativo disponível.</div>`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relatório de Negociação — #${opts.quoteId.slice(0, 8).toUpperCase()}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',system-ui,-apple-system,sans-serif;background:#f1f5f9;color:#0f172a;-webkit-font-smoothing:antialiased;color-scheme:light}
  .page{max-width:760px;margin:0 auto;padding:28px 16px 52px}

  /* ── Doc header ── */
  .doc-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:18px;border-bottom:1px solid #e2e8f0;margin-bottom:22px;flex-wrap:wrap}
  .doc-eyebrow{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#64748b;margin-bottom:4px}
  .doc-title{font-size:20px;font-weight:900;letter-spacing:-.3px;line-height:1.1}
  .doc-meta{font-size:11px;color:#64748b;margin-top:4px}
  .doc-ref{text-align:right;flex-shrink:0}
  .doc-id{font-size:11px;font-weight:600;color:#94a3b8}
  .doc-date{font-size:11px;color:#94a3b8;margin-top:2px}

  /* ── Economy hero ── */
  .hero{background:#1d4ed8;border-radius:14px;padding:22px 24px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
  .hero-label{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#bfdbfe;margin-bottom:4px}
  .hero-value{font-size:34px;font-weight:900;color:#fff;letter-spacing:-1px;line-height:1}
  .hero-sub{font-size:11px;color:#93c5fd;margin-top:5px}
  .hero-right{text-align:right}
  .hero-pct-label{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#bfdbfe;margin-bottom:3px}
  .hero-pct{font-size:26px;font-weight:900;color:#fff;letter-spacing:-.4px;line-height:1}
  .hero-total-label{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#bfdbfe;margin-top:12px;margin-bottom:2px}
  .hero-total{font-size:16px;font-weight:800;color:#dbeafe}

  /* ── Stats ── */
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:24px}
  .stat{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px}
  .stat-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:4px}
  .stat-value{font-size:17px;font-weight:800;color:#0f172a}

  /* ── Tabs ── */
  .tab-bar{display:flex;gap:0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:4px;margin-bottom:16px}
  .tab-btn{flex:1;padding:9px 12px;border:none;background:none;border-radius:9px;font-family:inherit;font-size:12px;font-weight:600;color:#64748b;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap}
  .tab-btn.active{background:#0f172a;color:#f8fafc;box-shadow:0 1px 3px rgba(0,0,0,.2)}
  .tab-btn:not(.active):hover{background:#f1f5f9;color:#0f172a}
  .tab-icon{font-size:13px;line-height:1}

  /* ── Section title ── */
  .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:#64748b;margin-bottom:10px;padding-bottom:7px;border-bottom:1px solid #e2e8f0}

  /* ── Cards ── */
  .card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:12px}
  .card-head{display:flex;align-items:center;gap:10px;padding:12px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
  .supplier-head{background:#f0fdf9;border-bottom-color:#bbf7d0}
  .card-num{width:28px;height:28px;background:#e2e8f0;border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;color:#64748b;flex-shrink:0}
  .card-icon{font-size:18px;flex-shrink:0;line-height:1}
  .card-info{}
  .card-title{font-size:12px;font-weight:800;color:#0f172a;letter-spacing:-.1px}
  .card-sub{font-size:10px;color:#64748b;font-weight:500;margin-top:1px}
  .econ-inline{color:#059669;font-weight:700}
  .group-total{font-size:14px;font-weight:800;color:#059669;margin-left:auto;white-space:nowrap;flex-shrink:0}

  /* ── Offer rows ── */
  .offers{display:flex;flex-direction:column}
  .offer-row{display:flex;flex-direction:column;gap:4px;padding:10px 16px;border-bottom:1px solid #f8fafc}
  .offer-row:last-child{border-bottom:none}
  .offer-winner{background:#f0fdf9}
  .offer-winner .offer-name{font-weight:700;color:#065f46}
  .offer-top{display:flex;align-items:center;gap:8px}
  .offer-bottom{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .offer-name{font-size:12px;font-weight:600;color:#334155;flex:1;min-width:0}
  .offer-unit-pill{font-size:10px;font-weight:600;color:#94a3b8;background:#f1f5f9;padding:1px 6px;border-radius:20px;white-space:nowrap;flex-shrink:0}
  .offer-price{display:flex;align-items:baseline;gap:3px;font-size:13px;color:#0f172a;white-space:nowrap}
  .offer-price strong{font-weight:800}
  .offer-unit{font-size:10px;color:#94a3b8;font-weight:500}
  .offer-sep{font-size:10px;color:#cbd5e1}
  .offer-total{font-size:12px;font-weight:700;color:#334155;white-space:nowrap}
  .offer-econ{font-size:11px;font-weight:700;color:#059669;white-space:nowrap}
  .offer-winner .offer-price strong{color:#059669}
  .offer-winner .offer-total{color:#065f46;font-weight:800}
  .badge-best{display:inline-flex;align-items:center;background:#dcfce7;color:#15803d;border:1px solid #bbf7d0;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:800;flex-shrink:0}
  .badge-rank{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:#f1f5f9;color:#94a3b8;border-radius:5px;font-size:9px;font-weight:700;flex-shrink:0}
  .old-price{text-decoration:line-through;color:#94a3b8;font-size:10px}

  /* ── Empty state ── */
  .empty-state{text-align:center;padding:32px 16px;font-size:13px;color:#94a3b8}

  /* ── Footer ── */
  .footer{text-align:center;padding-top:18px;border-top:1px solid #e2e8f0;margin-top:6px;font-size:10px;color:#94a3b8;font-weight:500}

  @media(max-width:480px){
    .stats{grid-template-columns:1fr 1fr}
    .hero-value{font-size:26px}
    .hero-pct{font-size:20px}
    .doc-title{font-size:17px}
    .tab-btn{font-size:11px;padding:8px 8px;gap:4px}
  }
  @media print{
    body{background:#fff}
    .page{padding:0;max-width:100%}
    .card{break-inside:avoid}
    .hero{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .tab-bar{display:none}
    .tab-panel{display:block!important}
  }
</style>
</head>
<body>
<div class="page">

  <div class="doc-header">
    <div>
      <div class="doc-eyebrow">CotaJá · Relatório de Negociação</div>
      <div class="doc-title">${opts.companyName}</div>
      <div class="doc-meta">Referência: ${opts.dateLabel}</div>
    </div>
    <div class="doc-ref">
      <div class="doc-id">#${opts.quoteId.slice(0, 8).toUpperCase()}</div>
      <div class="doc-date">${today}</div>
    </div>
  </div>

  ${opts.totalEconomiaReal > 0 ? `
  <div class="hero">
    <div>
      <div class="hero-label">Economia obtida na negociação</div>
      <div class="hero-value">${fmt(opts.totalEconomiaReal)}</div>
      <div class="hero-sub">em relação aos preços iniciais praticados</div>
    </div>
    <div class="hero-right">
      <div class="hero-pct-label">Redução média</div>
      <div class="hero-pct">${economyPct.toFixed(1)}%</div>
      <div class="hero-total-label">Total negociado</div>
      <div class="hero-total">${fmt(opts.totalMelhorPreco)}</div>
    </div>
  </div>` : `
  <div class="hero">
    <div>
      <div class="hero-label">Total negociado</div>
      <div class="hero-value">${fmt(opts.totalMelhorPreco)}</div>
      <div class="hero-sub">melhor opção por item</div>
    </div>
  </div>`}

  <div class="stats">
    <div class="stat"><div class="stat-label">Produtos</div><div class="stat-value">${opts.totalProdutos}</div></div>
    <div class="stat"><div class="stat-label">Fornecedores</div><div class="stat-value">${opts.totalFornecedores}</div></div>
    <div class="stat"><div class="stat-label">Responderam</div><div class="stat-value">${opts.fornecedoresRespondidos}/${opts.totalFornecedores}</div></div>
    <div class="stat"><div class="stat-label">Gerado em</div><div class="stat-value" style="font-size:12px;padding-top:3px">${new Date().toLocaleDateString("pt-BR")}</div></div>
  </div>

  <div class="tab-bar">
    <button class="tab-btn active" id="btn-winners" onclick="switchTab('winners')">
      <span class="tab-icon">🏆</span> Melhores Preços
    </button>
    <button class="tab-btn" id="btn-comparative" onclick="switchTab('comparative')">
      <span class="tab-icon">📊</span> Comparativo por Produto
    </button>
  </div>

  <div id="panel-winners" class="tab-panel">
    <div class="section-title">Itens por Fornecedor Vencedor</div>
    ${winnersSection}
  </div>

  <div id="panel-comparative" class="tab-panel" style="display:none">
    <div class="section-title">Comparativo por Produto — todos os fornecedores</div>
    ${comparativeSection}
  </div>

  <div class="footer">CotaJá · Relatório gerado automaticamente · #${opts.quoteId.slice(0, 8).toUpperCase()}</div>
</div>
<script>
function switchTab(tab) {
  document.getElementById('panel-winners').style.display = tab === 'winners' ? 'block' : 'none';
  document.getElementById('panel-comparative').style.display = tab === 'comparative' ? 'block' : 'none';
  document.getElementById('btn-winners').classList.toggle('active', tab === 'winners');
  document.getElementById('btn-comparative').classList.toggle('active', tab === 'comparative');
}
</script>
</body>
</html>`;
}

export function isWhatsAppConfigured(): boolean {
  return isWApiConfigured;
}

export async function getWhatsAppConfig(companyId: string): Promise<any> {
  try {
    const { data } = await supabase
      .from("company_settings")
      .select("whatsapp_config")
      .eq("company_id", companyId)
      .single();
    return data?.whatsapp_config || null;
  } catch {
    return null;
  }
}

export async function saveWhatsAppConfig(config: {
  company_id: string;
  api_url?: string;
  api_key?: string;
  instance_name?: string;
  instance_id?: string;
  token?: string;
  is_active?: boolean;
}): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("company_settings")
      .upsert(
        { company_id: config.company_id, whatsapp_config: config },
        { onConflict: "company_id" }
      );
    return !error;
  } catch {
    return false;
  }
}

export async function sendWhatsAppMessage(
  _config: any,
  phone: string,
  message: string,
  company_id?: string
): Promise<{ success: boolean; error?: string }> {
  return await sendWhatsApp(phone, message, company_id);
}

export async function generateOrderMessage(orderId: string): Promise<{ message: string; phone: string }> {
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (!order) throw new Error("Pedido não encontrado");

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("name, phone, contact")
    .eq("id", order.supplier_id)
    .single();

  const SEP = "─────────────────────";
  const supplierName = supplier?.name || "Prezado(a) Fornecedor(a)";
  const contactName = supplier?.contact || supplierName;

  // Client details
  const CLIENT_RAZAO_SOCIAL = "Novo Boi Dias Mercadão Ltda";
  const CLIENT_CNPJ = "63.195.471/0001-12";

  let msg = `Olá, *${contactName}*! 👋\n\n`;
  msg += `Tudo bem? Somos do *Novo Boi João Dias Mercadão Ltda*.\n\n`;
  msg += `Temos um *novo pedido de compra* para você!\n\n`;

  // --- LISTING ITEMS ---
  const items = order.order_items || [];
  if (items.length > 0) {
    msg += `📦 *ITENS DO PEDIDO:*\n\n`;
    
    items.forEach((item: any) => {
      const isBox = (item.unit || item.unidade || '').toUpperCase().includes('CX');
      const unitLabel = (item.unit || item.unidade || 'un').toUpperCase();
      const quantity = item.quantity || 1;
      const unitPrice = item.unit_price || 0;
      const total = quantity * unitPrice;

      msg += `• *${(item.product_name || "Produto").toUpperCase()}*\n`;
      msg += `  Qtd: ${quantity} ${unitLabel}\n`;
      
      if (isBox) {
        msg += `  💰 Valor: *${fmtCurrency(unitPrice)}* (Preço por KG/UN)\n`;
        msg += `  ⚠️ _Favor confirmar o peso e valor total do item._\n`;
      } else {
        msg += `  💰 Valor: ${fmtCurrency(unitPrice)} | Total: *${fmtCurrency(total)}*\n`;
      }
      msg += `\n`;
    });
    
    msg += SEP + "\n\n";
  }

  msg += `Para garantir que não haja divergências e que você tenha certeza absoluta do que está confirmando, geramos um link para você ver o pedido completo e dar o aceite:\n\n`;

  // --- LOGIC FOR SHORT LINK ---
  const originalTokens = `order_${orderId}`;
  let shortId = "";
  try {
    const { data: existingLink } = await supabase
      .from('short_links')
      .select('id')
      .eq('original_tokens', originalTokens)
      .maybeSingle();

    shortId = existingLink?.id;

    if (!shortId) {
      shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
      await supabase
        .from('short_links')
        .insert([{ id: shortId, original_tokens: originalTokens }]);
    }
  } catch (err) {
    console.error("Erro gerando short link do pedido", err);
  }

  if (shortId) {
    const orderPortalUrl = `https://cotaja.vercel.app/r/${shortId}`;
    msg += `👇 **CLIQUE AQUI PARA VER E CONFIRMAR:**\n`;
    msg += `${orderPortalUrl}\n\n`;
  }

  msg += `Por favor, pedimos que sempre abra o link e confirme para que fique registrado no nosso sistema e possamos dar andamento na liberação de pagamento e recebimento.\n\n`;
  msg += `Aguardamos seu retorno. Qualquer dúvida estamos à disposição!\n\n`;
  msg += `_Atenciosamente,_\n`;
  msg += `*${CLIENT_RAZAO_SOCIAL}*\n`;
  msg += `_Setor de Compras_`;

  return { message: msg, phone: supplier?.phone || "" };
}

export async function generatePackagingOrderMessage(orderId: string): Promise<{ message: string; phone: string }> {
  // Busca o pedido de embalagem
  const { data: order } = await supabase
    .from("packaging_orders")
    .select("*, suppliers(*)")
    .eq("id", orderId)
    .single();

  if (!order) throw new Error("Pedido de embalagem não encontrado");

  let qs: any = null;
  if (order.quote_id && order.supplier_id) {
    const { data: qsData } = await supabase
      .from("packaging_quote_suppliers")
      .select("id")
      .eq("quote_id", order.quote_id)
      .eq("supplier_id", order.supplier_id)
      .single();
    qs = qsData;
  }

  const supplierId = order.supplier_id;
  const supplier = order.suppliers;

  let items: any[] = [];
  if (qs?.id) {
    const { data: quoteItems } = await supabase
      .from("packaging_supplier_items")
      .select("*, packaging_quote_items(*)")
      .eq("quote_supplier_id", qs.id);
    if (quoteItems) items = quoteItems;
  } else {
    // Busca na packaging_order_items se não houver quote vinculada ou não achou qs
    const { data: directItems } = await supabase
      .from("packaging_order_items")
      .select("*")
      .eq("order_id", order.id);
    if (directItems) {
      items = directItems.map(di => ({
        packaging_quote_items: { product_name: di.packaging_name },
        unidade_venda: di.unidade_compra,
        quantidade_unidades_estimada: di.quantidade,
        quantidade_venda: di.quantidade_por_unidade
      }));
    }
  }

  const SEP = "─────────────────────";
  const supplierName = supplier?.name || "Prezado(a) Fornecedor(a)";
  const contactName = supplier?.contact || supplierName;

  // Client details
  const CLIENT_RAZAO_SOCIAL = "Novo Boi Dias Mercadão Ltda";
  const CLIENT_CNPJ = "63.195.471/0001-12";

  let msg = `Olá, *${contactName}*! 👋\n\n`;
  msg += `Tudo bem? Somos do *Novo Boi João Dias Mercadão Ltda*.\n\n`;
  msg += `Temos um *novo pedido de compra de EMBALAGENS* para você!\n\n`;

  // --- LISTING ITEMS ---
  if (items && items.length > 0) {
    msg += `📦 *ITENS DO PEDIDO:*\n\n`;
    
    items.forEach((item: any) => {
      const prodName = item.packaging_quote_items?.product_name || "Embalagem";
      const unitLabel = item.unidade_venda || 'un';
      const quantity = item.quantidade_unidades_estimada || 1;
      const qtVenda = item.quantidade_venda;

      msg += `• *${prodName.toUpperCase()}*\n`;
      msg += `  ${qtVenda ? `Peso/Volume: ${qtVenda}${unitLabel} | ` : ''}Qtd Est.: ${quantity} un\n`;
      msg += `  ⚠️ _Favor confirmar todas as especificações e quantidades no link._\n\n`;
    });
    
    msg += SEP + "\n\n";
  }

  msg += `Para garantir que não haja divergências e que você tenha certeza absoluta do que está confirmando, geramos um link para você ver as especificações negociadas e dar o aceite:\n\n`;

  // --- LOGIC FOR SHORT LINK ---
  const originalTokens = `pkg_order_${orderId}`;
  let shortId = "";
  try {
    const { data: existingLink } = await supabase
      .from('short_links')
      .select('id')
      .eq('original_tokens', originalTokens)
      .maybeSingle();

    shortId = existingLink?.id;

    if (!shortId) {
      shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
      await supabase
        .from('short_links')
        .insert([{ id: shortId, original_tokens: originalTokens }]);
    }
  } catch (err) {
    console.error("Erro gerando short link do pedido de embalagem", err);
  }

  if (shortId) {
    const orderPortalUrl = `https://cotaja.vercel.app/r/${shortId}`;
    msg += `👇 **CLIQUE AQUI PARA VER E CONFIRMAR:**\n`;
    msg += `${orderPortalUrl}\n\n`;
  }

  msg += `Atenção: Os dados de faturamento são CNPJ: *${CLIENT_CNPJ}* / Razão Social: *${CLIENT_RAZAO_SOCIAL}*.\n\n`;
  msg += `Por favor, pedimos que sempre abra o link e confirme para que fique registrado no nosso sistema e possamos dar andamento na recepção do material.\n\n`;
  msg += `Qualquer dúvida estamos à disposição!\n\n`;
  msg += `_Atenciosamente,_\n`;
  msg += `*${CLIENT_RAZAO_SOCIAL}*\n`;
  msg += `_Setor de Compras_`;

  return { message: msg, phone: supplier?.phone || "" };
}

export async function sendQuoteViaWhatsApp(params: {
  quoteId: string;
  supplierIds: string[];
  customMessage: string;
}): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
  const { quoteId, supplierIds, customMessage } = params;
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  const { data: quote } = await supabase
    .from("quotes")
    .select("*, quote_suppliers(*)")
    .eq("id", quoteId)
    .single();

  if (!quote) return { success: false, sent: 0, failed: supplierIds.length, errors: ["Cotação não encontrada"] };

  for (const supplierId of supplierIds) {
    const qs = quote.quote_suppliers?.find((s: any) => s.supplier_id === supplierId);
    if (!qs) continue;

    const { data: supplier } = await supabase
      .from("suppliers")
      .select("phone")
      .eq("id", supplierId)
      .single();

    const phone = supplier?.phone;
    if (!phone) {
      failed++;
      errors.push((qs.supplier_name || "Fornecedor") + ": sem telefone");
      continue;
    }

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cotapro.com';
      const linkMsg = qs.access_token 
        ? `\n\n🔗 *Responda direto no link seguro:*\n${baseUrl}/responder/${qs.access_token}` 
        : '';
        
      const finalMessage = customMessage + linkMsg;

      await sendMsg(phone, finalMessage);
      
      // Registrar log no quote_suppliers
      await supabase
        .from("quote_suppliers")
        .update({ last_whatsapp_at: new Date().toISOString() })
        .eq("quote_id", quoteId)
        .eq("supplier_id", supplierId);

      sent++;
    } catch (e: any) {
      failed++;
      errors.push((qs.supplier_name || "Fornecedor") + ": " + e.message);
    }
  }

  // Se pelo menos um foi enviado, atualiza o status geral da cotação
  if (sent > 0) {
    await supabase
      .from("quotes")
      .update({ whatsapp_sent_at: new Date().toISOString() })
      .eq("id", quoteId);
  }

  return { success: sent > 0, sent, failed, errors };
}
