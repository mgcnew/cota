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
  const LINE = "──────────────────";

  let m = "📜 *RELATÓRIO DE NEGOCIAÇÃO*\n";
  m += "🏢 *" + company + "*\n";
  m += LINE + "\n\n";

  m += "*RESUMO DA OPERAÇÃO*\n";
  m += "📦 Itens Cotados: *" + stats.totalProdutos + "*\n";
  m += "🏢 Fornecedores: *" + stats.fornecedoresRespondidos + "/" + stats.totalFornecedores + "*\n";

  if (potentialSavings && potentialSavings > totalSavings) {
    m += "🎯 Economia de Mercado: *" + fmtCurrency(potentialSavings) + "*\n";
    m += "📈 Economia Negociada: *" + fmtCurrency(totalSavings) + "*\n";
  } else {
    m += "📈 Economia Total: *" + fmtCurrency(totalSavings) + "*\n";
  }

  m += "💰 Valor Total: *" + fmtCurrency(melhorTotal) + "*\n\n";
  m += LINE + "\n\n";

  m += "*ARREMATE POR FORNECEDOR*\n\n";

  groupedData.slice(0, 5).forEach(function (group, index) {
    if (group.items.length === 0) return;
    const isWinner = index === 0 && group.name !== "Pendente / Sem Vencedor";
    const header = isWinner
      ? "🏆 *" + group.name + "*"
      : "*" + group.name + "*";
    m += header + "\n";
    m += "> " + group.items.length + " itens arrematados\n";
    m += "> Total: *" + fmtCurrency(group.total) + "*\n\n";

    group.items.slice(0, 5).forEach(function (item) {
      m += "  ✅ " + (item.productName || item.product_name || "Item") + "\n";
    });

    if (group.items.length > 5) {
      m += "  _... e mais " + (group.items.length - 5) + " itens_\n";
    }
    m += "\n";
  });

  if (groupedData.length > 5) {
    m += "_... e mais " + (groupedData.length - 5) + " fornecedores_\n\n";
  }

  m += LINE + "\n\n";

  if (analysisResult) {
    m += "💡 *ANÁLISE ESTRATÉGICA (IA)*\n";
    m += "_" + analysisResult + "_\n\n";
    m += LINE + "\n\n";
  }

  m += "*PLATAFORMA MGC | GESTÃO PROFISSIONAL*\n";
  m += "_Documento de auditoria de compras_";

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
    .select("name, phone")
    .eq("id", order.supplier_id)
    .single();

  const items = (order.order_items || [])
    .map(
      (item: any) =>
        "- " + (item.product_name || "Produto") + " x" + (item.quantidade || 1)
    )
    .join("\n");

  let msg = "*PEDIDO DE COMPRA*\n\n";
  msg += "*Fornecedor:* " + (supplier?.name || "-") + "\n";
  msg += "*Data Entrega:* " + (order.delivery_date || "-") + "\n\n";
  msg += "*Itens:*\n" + items + "\n\n";
  if (order.observations) {
    msg += "*Obs:* " + order.observations + "\n\n";
  }
  msg += "*PLATAFORMA MGC | COMPRAS*";

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
      await sendMsg(phone, customMessage);
      sent++;
    } catch (e: any) {
      failed++;
      errors.push((qs.supplier_name || "Fornecedor") + ": " + e.message);
    }
  }

  return { success: sent > 0, sent, failed, errors };
}
