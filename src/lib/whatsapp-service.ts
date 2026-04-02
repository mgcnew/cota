import { sendWhatsAppMessage as sendMsg, sendWhatsAppImage, isWApiConfigured } from "./w-api";
import { supabase } from "@/integrations/supabase/client";

const fmtCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const DEFAULT_PHONE_NUMBER = "11966670314";

export async function sendWhatsApp(phone: string, message: string, company_id?: string) {
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

        const contentType = response.headers.get("content-type");
        if (response.ok) {
          return { success: true };
        } else {
          let errorMsg = "Erro na Evolution API";
          if (contentType && contentType.includes("application/json")) {
            const errData = await response.json().catch(() => ({}));
            errorMsg = errData.message || errorMsg;
          } else {
            const text = await response.text();
            console.error("Resposta não JSON:", text.substring(0, 100));
            errorMsg = `Erro na API (Status ${response.status}): Verifique se a URL da instância está correta.`;
          }
          throw new Error(errorMsg);
        }
      }
    }

    // Fallback para W-API.app (Legado ou VITE_ envs)
    return await sendMsg(phone, message);
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
  potentialSavings?: number
): string {
  const company = "MERCADÃO NOVO BOI JOÃO DIAS";
  const SEP = "━━━━━━━━━━━━━━━━━━━";
  
  // Extrair lista de produtos únicos
  const allProductsSet = new Set<string>();
  groupedData.forEach(g => g.items.forEach(i => {
    const name = i.productName || i.product_name || "Item";
    if (name) allProductsSet.add(name);
  }));
  const productsList = Array.from(allProductsSet).slice(0, 15);
  
  // Extrair fornecedores arrematantes
  const suppliersNames = groupedData
    .filter(g => g.name !== "Pendente / Sem Vencedor")
    .map(g => g.name);

  let m = "📜 *RELATÓRIO DE COMPRAS | CotaPro*\n";
  m += "🏢 *" + company + "*\n";
  m += SEP + "\n\n";

  m += "📦 *ITENS EM COTAÇÃO*\n";
  m += productsList.map(p => "• " + p).join("\n") + "\n";
  if (allProductsSet.size > 15) {
    m += "_(... e outros " + (allProductsSet.size - 15) + " itens)_\n";
  }
  m += "\n" + SEP + "\n\n";

  m += "👥 *FORNECEDORES ARREMATANTES*\n";
  m += suppliersNames.map(s => "• " + s).join("\n");
  m += "\n\n" + SEP + "\n\n";

  m += "📋 *CONQUISTAS DE NEGOCIAÇÃO*\n";
  const negotiationWins = groupedData.flatMap(g => 
    g.items
      .filter(i => (i.priceSequence?.length || 0) > 1 || (i.allPrices?.length > 1))
      .map(i => {
        const initial = i.priceSequence?.[0] || (i.allPrices?.[0]?.valor_inicial) || i.bestPrice;
        const final = i.bestPrice;
        const diff = initial - final;
        if (diff <= 0) return null;
        return { 
          name: i.productName || i.product_name, 
          initial, 
          final, 
          economy: diff * i.quantidade,
          percent: ((diff / initial) * 100).toFixed(0)
        };
      })
  ).filter(Boolean) as any[];

  if (negotiationWins.length > 0) {
    m += negotiationWins.slice(0, 10).map(w => 
      `✅ *${w.name}*\n   De ${fmtCurrency(w.initial)} por *${fmtCurrency(w.final)}* (-${w.percent}%)\n   Economia: *+ ${fmtCurrency(w.economy)}*`
    ).join("\n\n") + "\n";
    if (negotiationWins.length > 10) m += `_(... e outros ${negotiationWins.length - 10} itens negociados)_\n`;
  } else {
    m += "_Pedidos fechados no lance inicial._\n";
  }
  m += "\n" + SEP + "\n\n";

  m += "🚀 *ECONOMIA REAL NEGOCIADA: " + fmtCurrency(totalSavings) + "*\n";
  m += "_(Redução bruta alcançada nas negociações)_\n\n";
  
  m += SEP + "\n\n";

  if (analysisResult) {
    m += "💡 *ANÁLISE ESTRATÉGICA (IA)*\n";
    m += "_" + analysisResult + "_\n\n";
    m += SEP + "\n\n";
  }

  m += "*GESTÃO DE COMPRAS AUDITADA*\n";
  m += "Sistema *CotaPro* — Inteligência de Mercado";

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
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await sendMsg(phone, message);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
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

  // Format items list
  const itemsList = (order.order_items || [])
    .map((item: any) => {
      const qty = item.quantidade || 1;
      const unit = item.unidade || "un";
      return `  • ${item.product_name || "Produto"} — *${qty} ${unit}*`;
    })
    .join("\n");

  let msg = `Olá, *${contactName}*! 👋\n\n`;
  msg += `Tudo bem?\n\n`;
  msg += SEP + "\n";
  msg += `📦 *PEDIDO DE COMPRA*\n`;
  msg += SEP + "\n\n";

  msg += `*Comprador:*\n`;
  msg += `🏢 ${CLIENT_RAZAO_SOCIAL}\n`;
  msg += `CNPJ: ${CLIENT_CNPJ}\n\n`;

  msg += `*Pedido para:* ${supplierName}\n\n`;

  msg += SEP + "\n";
  msg += `🛒 *ITENS SOLICITADOS*\n`;
  msg += SEP + "\n";
  msg += itemsList + "\n\n";

  if (order.observations) {
    msg += SEP + "\n";
    msg += `📝 *OBSERVAÇÕES*\n`;
    msg += order.observations + "\n\n";
  }

  msg += SEP + "\n";
  msg += `📅 *PRAZO DE ENTREGA*\n`;
  msg += `Por favor, informe o *prazo de entrega disponível* para os itens acima.\n\n`;

  msg += SEP + "\n";
  msg += `Aguardamos seu retorno. Qualquer dúvida estamos à disposição!\n\n`;
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
      sent++;
    } catch (e: any) {
      failed++;
      errors.push((qs.supplier_name || "Fornecedor") + ": " + e.message);
    }
  }

  return { success: sent > 0, sent, failed, errors };
}
