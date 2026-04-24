import { sendWhatsAppMessage as sendMsg, sendWhatsAppImage, isWApiConfigured } from "./w-api";
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
    // Tenta usar configuração do banco primeiro se existir
    const config = company_id ? await getWhatsAppConfig(company_id) : null;
    
    if (config?.api_url && config?.api_key && config?.instance_name) {
       // Suporte para envio de mídia na Evolution API se necessário futuramente
       // Por enquanto mantém o fallback
    }

    const data = await sendWhatsAppImage(phone, base64Image, caption);
    return { success: true, messageId: data.data?.messageId || "wapi-sent" };
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
