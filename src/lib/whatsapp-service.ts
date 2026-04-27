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
    
    // 2. Enviar o HTML como documento
    const base64Html = btoa(unescape(encodeURIComponent(htmlContent)));
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
 * Responsive, dark-themed, audit-ready.
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
  viewMode: "winners" | "comparative";
  groupedData?: { name: string; items: any[]; total: number }[];
}): string {
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // --- Header ---
  let items = "";

  if (opts.viewMode === "comparative") {
    opts.productsData.forEach((p, idx) => {
      const unit = (p.unidade || "un").toUpperCase();
      const sorted = [...(p.allOffers || [])].sort((a: any, b: any) => {
        if (a.isWinner) return -1;
        if (b.isWinner) return 1;
        return a.price - b.price;
      });

      let rows = "";
      sorted.forEach((o: any, oIdx: number) => {
        const neg = o.wasNegotiated && o.initialPrice > 0 && Math.abs(o.initialPrice - o.price) > 0.001;
        const winClass = o.isWinner ? "winner" : "";
        const badge = o.isWinner ? `<span class="badge-winner">🏆 Vencedor</span>` : `<span class="rank">#${oIdx + 1}</span>`;
        const initialCell = o.initialPrice > 0 ? fmt(o.initialPrice) : "-";
        const priceCell = neg
          ? `<span class="old-price">${fmt(o.initialPrice)}</span> → <strong>${fmt(o.price)}</strong>`
          : fmt(o.price);
        const econPerUnit = o.initialPrice > 0 && o.initialPrice > o.price
          ? (o.initialPrice - o.price)
          : 0;
        const econTotal = econPerUnit * (p.quantidade || 1);
        const econCell = econTotal > 0
          ? `<span class="econ-positive">${fmt(econTotal)}</span>`
          : "-";

        rows += `
          <tr class="${winClass}">
            <td>${badge} ${o.supplierName}</td>
            <td class="num">${initialCell}</td>
            <td class="num">${priceCell}</td>
            <td class="num"><strong>${fmt(o.total)}</strong></td>
            <td class="num">${econCell}</td>
          </tr>`;
      });

      items += `
        <div class="product-card">
          <div class="product-header">
            <span class="product-idx">${idx + 1}</span>
            <div>
              <h3>${(p.productName || "").toUpperCase()}</h3>
              <span class="demand">${p.quantidade} ${unit}</span>
            </div>
          </div>
          <table>
            <thead><tr><th>Fornecedor</th><th class="num">Val. Inicial</th><th class="num">Val. Final</th><th class="num">Total</th><th class="num">Economia</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    });
  } else {
    // Winners grouped view
    (opts.groupedData || []).forEach(g => {
      if (g.name === "Pendente / Sem Vencedor") return;
      let rows = "";
      g.items.forEach((i: any) => {
        const unit = (i.unidade || "un").toUpperCase();
        // Calcular valor inicial e economia do item
        const offers = i.allOffers || [];
        const highestOffer = offers.length > 0 ? Math.max(...offers.map((o: any) => o.price || 0)) : i.bestPrice;
        const initialPrice = offers.length > 0
          ? Math.max(...offers.map((o: any) => o.initialPrice || o.price || 0))
          : i.bestPrice;
        const valorInicial = Math.max(highestOffer, initialPrice);
        const econItem = valorInicial > i.bestPrice ? (valorInicial - i.bestPrice) * (i.quantidade || 1) : 0;
        rows += `
          <tr>
            <td>${i.productName || i.product_name}</td>
            <td class="num">${i.quantidade} ${unit}</td>
            <td class="num">${fmt(valorInicial)}</td>
            <td class="num">${fmt(i.bestPrice)}</td>
            <td class="num"><strong>${fmt(i.totalItem)}</strong></td>
            <td class="num">${econItem > 0 ? `<span class="econ-positive">${fmt(econItem)}</span>` : "-"}</td>
          </tr>`;
      });
      const groupEcon = g.items.reduce((sum: number, i: any) => {
        const offers = i.allOffers || [];
        const highestOffer = offers.length > 0 ? Math.max(...offers.map((o: any) => o.price || 0)) : i.bestPrice;
        const initialPrice = offers.length > 0
          ? Math.max(...offers.map((o: any) => o.initialPrice || o.price || 0))
          : i.bestPrice;
        const valorInicial = Math.max(highestOffer, initialPrice);
        return sum + (valorInicial > i.bestPrice ? (valorInicial - i.bestPrice) * (i.quantidade || 1) : 0);
      }, 0);
      items += `
        <div class="product-card">
          <div class="product-header supplier-header">
            <span class="product-idx">🏢</span>
            <div>
              <h3>${g.name.toUpperCase()}</h3>
              <span class="demand">${g.items.length} itens — Subtotal: ${fmt(g.total)}${groupEcon > 0 ? ` — Economia: ${fmt(groupEcon)}` : ""}</span>
            </div>
          </div>
          <table>
            <thead><tr><th>Produto</th><th class="num">Qtd</th><th class="num">Val. Inicial</th><th class="num">Val. Final</th><th class="num">Total</th><th class="num">Economia</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    });
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relatório de Negociação — #${opts.quoteId.slice(0, 8)}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#e4e4e7;padding:24px;min-height:100vh}
  .container{max-width:900px;margin:0 auto}
  .header{display:flex;align-items:center;gap:20px;padding-bottom:24px;border-bottom:2px solid #27272a;margin-bottom:32px}
  .logo{width:56px;height:56px;background:#18181b;border-radius:16px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:24px;color:#fff;border:3px solid #3f3f46;flex-shrink:0}
  .header h1{font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:-0.5px}
  .header p{font-size:12px;color:#71717a;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-top:4px}
  .header p span.brand{color:#10b981}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:32px}
  .stat-card{background:#18181b;border:1px solid #27272a;border-radius:16px;padding:20px}
  .stat-card .label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#71717a;margin-bottom:8px}
  .stat-card .value{font-size:24px;font-weight:900;letter-spacing:-1px}
  .stat-card.economy .value{color:#10b981}
  .product-card{background:#18181b;border:1px solid #27272a;border-radius:20px;overflow:hidden;margin-bottom:20px}
  .product-header{display:flex;align-items:center;gap:16px;padding:20px 24px;border-bottom:1px solid #27272a}
  .product-idx{width:36px;height:36px;background:#27272a;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;color:#a1a1aa;flex-shrink:0}
  .product-header h3{font-size:15px;font-weight:900;letter-spacing:-0.3px}
  .demand{font-size:11px;color:#71717a;font-weight:700;text-transform:uppercase;letter-spacing:1px}
  table{width:100%;border-collapse:collapse}
  thead th{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#52525b;padding:12px 24px;text-align:left;background:#111}
  th.num,td.num{text-align:right}
  tbody tr{border-top:1px solid #1e1e22;transition:background .15s}
  tbody tr:hover{background:#1c1c20}
  tbody td{padding:14px 24px;font-size:13px}
  tr.winner{background:rgba(16,185,129,0.06)}
  tr.winner td{color:#34d399;font-weight:700}
  .badge-winner{display:inline-block;background:rgba(16,185,129,0.15);color:#10b981;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:3px 10px;border-radius:999px;margin-right:8px}
  .rank{display:inline-block;background:#27272a;color:#71717a;font-size:10px;font-weight:800;padding:2px 8px;border-radius:6px;margin-right:8px}
  .old-price{text-decoration:line-through;color:#71717a;font-size:11px;margin-right:4px}
  .econ-positive{color:#10b981;font-weight:800}
  .footer{text-align:center;padding:32px 0 16px;border-top:2px solid #27272a;margin-top:32px;color:#52525b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px}
  .footer strong{color:#10b981}
  @media(max-width:600px){
    body{padding:12px}
    .stats{grid-template-columns:1fr 1fr}
    .stat-card .value{font-size:18px}
    thead th,tbody td{padding:10px 12px;font-size:11px}
    .product-header{padding:14px 16px}
  }
  @media print{body{background:#fff;color:#000}
    .product-card,.stat-card{border-color:#ddd}
    tr.winner{background:#f0fdf4}tr.winner td{color:#047857}
  }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">M</div>
    <div>
      <h1>Relatório de Negociação</h1>
      <p><span class="brand">#${opts.quoteId.slice(0, 8)}</span> &bull; ${opts.dateLabel} &bull; ${opts.companyName}</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat-card"><div class="label">Itens Cotados</div><div class="value">${opts.totalProdutos}</div></div>
    <div class="stat-card"><div class="label">Fornecedores</div><div class="value">${opts.fornecedoresRespondidos}/${opts.totalFornecedores}</div></div>
    <div class="stat-card economy"><div class="label">Economia Capturada</div><div class="value">${fmt(opts.totalEconomiaReal)}</div></div>
    <div class="stat-card"><div class="label">Total Negociado</div><div class="value">${fmt(opts.totalMelhorPreco)}</div></div>
  </div>

  ${items}

  <div class="footer">Relatório auditado via <strong>CotaJá</strong> — Inteligência de Compras</div>
</div>
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
