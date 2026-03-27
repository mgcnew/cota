import { supabase } from "@/integrations/supabase/client";
import { WhatsAppConfig, SendWhatsAppQuoteParams } from "@/types/whatsapp";

// Configurações da W-API vindas do .env
console.log('[WhatsApp DEBUG] lib/whatsapp.ts carregado!');
const W_API_INSTANCE = import.meta.env.VITE_W_API_INSTANCE;
const W_API_TOKEN = import.meta.env.VITE_W_API_TOKEN;
console.log('[WhatsApp DEBUG] Configuração:', { instance: W_API_INSTANCE, token: W_API_TOKEN ? 'SIM' : 'NÃO' });

/**
 * Serviço de integração com WhatsApp
 */

// Formatar número de telefone para WhatsApp (formato internacional)
export function formatPhoneNumber(phone: string): string {
  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Se não começar com 55 (Brasil), adiciona
  if (!cleaned.startsWith('55')) {
    return `55${cleaned}`;
  }
  
  return cleaned;
}

// Verificar se o serviço de WhatsApp está configurado (via banco ou env)
export function isWhatsAppConfigured(): boolean {
  return (W_API_TOKEN && W_API_TOKEN !== "COLE_AQUI_O_TOKEN_DA_IMAGEM") || false;
}

// Buscar configuração do WhatsApp da empresa
export async function getWhatsAppConfig(companyId: string): Promise<WhatsAppConfig | null> {
  const { data, error } = await (supabase
    .from('whatsapp_config' as any)
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .single() as any);

  if (error) {
    console.error('Erro ao buscar config WhatsApp:', error);
    return null;
  }

  return data as WhatsAppConfig;
}

// Salvar ou atualizar configuração do WhatsApp
export async function saveWhatsAppConfig(config: Partial<WhatsAppConfig>): Promise<boolean> {
  const { error } = await (supabase
    .from('whatsapp_config' as any)
    .upsert(config as any, { onConflict: 'company_id' }) as any);

  if (error) {
    console.error('Erro ao salvar config WhatsApp:', error);
    return false;
  }

  return true;
}

// Enviar mensagem via WaAPI (ou Evolution API se configurada)
export async function sendWhatsAppMessage(
  config: WhatsAppConfig | null,
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    // Se tiver W-API configurada no env (Plataforma w-api.app)
    if (W_API_TOKEN && W_API_TOKEN !== "COLE_AQUI_O_TOKEN_DA_IMAGEM") {
      console.log('[WhatsApp DEBUG] ✅ Enviando via W-API.APP (Modo LITE)');
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const isProduction = import.meta.env.PROD;
      const baseUrl = isProduction ? 'https://api.w-api.app' : '/whatsapp-api';
      const endpoint = `${baseUrl}/v1/message/send-text?instanceId=${W_API_INSTANCE}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${W_API_TOKEN}`,
        },
        body: JSON.stringify({
          phone: formattedPhone,
          message: message,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error' || data.error) {
        return { success: false, error: data.message || data.error || `Erro HTTP ${response.status}` };
      }

      return { success: true, messageId: data.id || 'wapi-sent' };
    }

    // Se não tiver W-API mas tiver config da Evolution no banco
    if (config && config.api_url && config.instance_name) {
      console.log('[WhatsApp] Enviando via Evolution API para:', formattedPhone);
      
      const response = await fetch(`${config.api_url}/message/sendText/${config.instance_name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.api_key,
        },
        body: JSON.stringify({
          number: `${formattedPhone}@s.whatsapp.net`,
          text: message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Erro na Evolution API' };
      }

      const data = await response.json();
      return { success: true, messageId: data.key?.id };
    }

    return { success: false, error: 'Nenhum serviço de WhatsApp configurado' };
  } catch (error: any) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    return { success: false, error: error.message || 'Erro de conexão com o serviço' };
  }
}

// Enviar mídia via WaAPI
export async function sendWhatsAppMedia(
  phoneNumber: string,
  mediaBase64: string,
  caption?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    if (W_API_TOKEN && W_API_TOKEN !== "COLE_AQUI_O_TOKEN_DA_IMAGEM") {
      const isProduction = import.meta.env.PROD;
      const baseUrl = isProduction ? 'https://api.w-api.app' : '/whatsapp-api';
      const response = await fetch(`${baseUrl}/v1/message/send-image?instanceId=${W_API_INSTANCE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${W_API_TOKEN}`,
        },
        body: JSON.stringify({
          phone: formattedPhone,
          image: mediaBase64,   // Base64 completo (com 'data:image/jpeg;base64,')
          caption: caption,
          delayMessage: 10      // Conforme o exemplo do usuário
        }),
      });

      const data = await response.json();
      if (!response.ok || data.status === 'error' || data.error) {
        return { success: false, error: data.message || data.error || `Erro HTTP ${response.status}` };
      }

      return { success: true, messageId: data.id || 'wapi-media-sent' };
    }

    return { success: false, error: 'W-API não configurada para envio de mídia' };
  } catch (error: any) {
    console.error('Erro ao enviar mídia WhatsApp:', error);
    return { success: false, error: error.message || 'Erro de conexão no envio de mídia' };
  }
}

// Gerar mensagem de cotação personalizada
export async function generateQuoteMessage(
  quoteId: string,
  templateId?: string,
  customMessage?: string,
  deadline?: string
): Promise<string> {
  // Buscar dados da cotação
  const { data: quote } = await supabase
    .from('quotes')
    .select(`
      *,
      quote_items (
        product_name,
        quantidade,
        unidade
      )
    `)
    .eq('id', quoteId)
    .single();

  if (!quote) {
    throw new Error('Cotação não encontrada');
  }

  // Se tiver mensagem customizada, usa ela
  if (customMessage) {
    return customMessage;
  }

  // Buscar template
  let template = '';
  if (templateId) {
    const { data: templateData } = await (supabase
      .from('whatsapp_templates' as any)
      .select('template_text')
      .eq('id', templateId)
      .single() as any);
    
    template = (templateData as any)?.template_text || '';
  }

  // Se não tiver template, usa o padrão novo e sofisticado
  if (!template) {
    const { data: defaultTemplate } = await (supabase
      .from('whatsapp_templates' as any)
      .select('template_text')
      .eq('company_id', quote.company_id)
      .eq('is_default', true)
      .single() as any);
    
    template = (defaultTemplate as any)?.template_text || 
      `Olá *{supplier_name}*, tudo bem?\n\nEstamos realizando uma nova tomada de preços e gostaríamos de contar com a sua participação.\n\n*Empresa:* {company_name}\n*CNPJ:* {company_cnpj}\n\n📋 *Lista de Produtos Solicitados:*\n{products_list}\n\n⏰ *Prazo para envio dos preços:* {deadline}\n\nPor favor, nos responda informando os valores unitários para os itens acima.\n\nMuito obrigado!`;
  }

  // Montar lista de produtos
  const productsList = quote.quote_items
    .map((item: any, index: number) => 
      `${index + 1}. ${item.product_name} - ${item.quantidade} ${item.unidade || 'un'}`
    )
    .join('\n');

  // Tratamento da identificação forçando os dados fixos que o usuário estabeleceu
  const companyNameVal = "NOVO BOI JOÃO DIAS MERCADÃO LTDA";
  const companyCnpjVal = "63.195.471/0001-12";

  // Substituir variáveis no template, deixando {supplier_name} livre para o loop depois
  let messageTemplate = template
    .replace('{company_name}', companyNameVal)
    .replace('{company_cnpj}', companyCnpjVal)
    .replace('{products_list}', productsList)
    .replace('{deadline}', deadline || quote.data_fim || 'o mais breve possível');

  return messageTemplate;
}

// Enviar cotação via WhatsApp para múltiplos fornecedores
export async function sendQuoteViaWhatsApp(
  params: SendWhatsAppQuoteParams
): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
  const { quoteId, supplierIds, templateId, customMessage, deadline } = params;

  // Buscar cotação
  const { data: quote } = await supabase
    .from('quotes')
    .select('company_id')
    .eq('id', quoteId)
    .single();

  if (!quote) {
    return { success: false, sent: 0, failed: 0, errors: ['Cotação não encontrada'] };
  }

  // Buscar configuração do WhatsApp
  const config = await getWhatsAppConfig(quote.company_id);
  const globalConfigured = isWhatsAppConfigured();
  
  if (!config && !globalConfigured) {
    return { success: false, sent: 0, failed: 0, errors: ['WhatsApp não configurado'] };
  }

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, contact, phone')
    .in('id', supplierIds);

  if (!suppliers || suppliers.length === 0) {
    return { success: false, sent: 0, failed: 0, errors: ['Nenhum fornecedor encontrado'] };
  }

  const baseMessage = await generateQuoteMessage(quoteId, templateId, customMessage, deadline);

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const supplier of suppliers) {
    if (!supplier.phone) {
      errors.push(`${supplier.name}: Telefone não cadastrado`);
      failed++;
      continue;
    }

    const supplierContactName = supplier.contact || supplier.name || "Fornecedor";
    const personalizedMessage = baseMessage.replace(/{supplier_name}/g, supplierContactName);

    const result = await sendWhatsAppMessage(config, supplier.phone, personalizedMessage);

    const messageRecord = {
      company_id: quote.company_id,
      quote_id: quoteId,
      supplier_id: supplier.id,
      phone_number: supplier.phone,
      message_text: personalizedMessage,
      message_id: result.messageId,
      status: result.success ? 'sent' : 'failed',
      sent_at: result.success ? new Date().toISOString() : null,
    };

    await (supabase.from('whatsapp_messages' as any).insert(messageRecord as any) as any);

    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${supplier.name}: ${result.error}`);
    }
  }

  return { success: sent > 0, sent, failed, errors };
}

// Processar resposta do fornecedor (webhook)
export async function processWhatsAppResponse(
  phoneNumber: string,
  messageText: string,
  companyId: string
): Promise<{ success: boolean; parsed?: any }> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('company_id', companyId)
      .ilike('phone', `%${formattedPhone.slice(-9)}%`)
      .single();

    if (!supplier) {
      return { success: false };
    }

    const { data: lastMessage } = await (supabase
      .from('whatsapp_messages' as any)
      .select('id, quote_id, packaging_quote_id')
      .eq('supplier_id', supplier.id)
      .eq('company_id', companyId)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single() as any);

    if (!lastMessage) {
      return { success: false };
    }

    const parsedData = parseQuoteResponse(messageText);

    await (supabase.from('whatsapp_responses' as any).insert({
      company_id: companyId,
      whatsapp_message_id: (lastMessage as any).id,
      quote_id: (lastMessage as any).quote_id,
      packaging_quote_id: (lastMessage as any).packaging_quote_id,
      supplier_id: supplier.id,
      phone_number: phoneNumber,
      response_text: messageText,
      parsed_data: parsedData,
      is_processed: false,
    } as any) as any);

    return { success: true, parsed: parsedData };
  } catch (error) {
    console.error('Erro ao processar resposta WhatsApp:', error);
    return { success: false };
  }
}

// Parser inteligente para extrair preços da mensagem
function parseQuoteResponse(text: string): any {
  const prices: Array<{ product?: string; price?: number; quantity?: number }> = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const priceMatch = line.match(/R?\$?\s*(\d+[.,]\d{2})/i);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(',', '.'));
      const productMatch = line.match(/^[\d.)\-\s]*([a-záàâãéèêíïóôõöúçñ\s]+)/i);
      const product = productMatch ? productMatch[1].trim() : undefined;
      prices.push({ product, price });
    }
  }
  return { prices, raw_text: text };
}

// Gerar mensagem de pedido personalizada para o Fornecedor
export async function generateOrderMessage(
  orderId: string
): Promise<{ message: string; phone: string | null }> {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        product_name,
        quantity,
        unidade_pedida
      )
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    throw new Error('Pedido não encontrado para gerar mensagem.');
  }

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('name, contact, phone')
    .eq('id', order.supplier_id)
    .single();

  const isQuoted = !!order.quote_id;
  const headerText = isQuoted 
    ? `Este é um pedido referente à cotação que vocês venceram conosco.` 
    : `Este é um pedido direto do setor de compras.`;

  const productsList = order.order_items
    .map((item: any, index: number) => 
      `${index + 1}. *${item.product_name}* - ${item.quantity} ${item.unidade_pedida || 'un'}`
    )
    .join('\n');

  const companyName = "NOVO BOI JOÃO DIAS MERCADÃO LTDA";
  const companyCnpj = "63.195.471/0001-12";
  const supplierContactName = supplier?.contact || supplier?.name || "Fornecedor";

  let message = `Olá *${supplierContactName}*, tudo bem?\n\n`;
  message += `${headerText}\n\n`;
  message += `*Empresa:* ${companyName}\n`;
  message += `*CNPJ:* ${companyCnpj}\n\n`;
  message += `📋 *Lista de Produtos Solicitados:*\n${productsList}\n\n`;
  message += `Por favor, nos envie o *espelho da nota* ou *comprovante do pedido* para conferência.\n\nMuito obrigado!`;

  return { message, phone: supplier?.phone || null };
}

// Gerar relatório de fechamento de cotação para WhatsApp
export function generateQuoteExportMessage(
  stats: { totalProdutos: number; totalFornecedores: number; fornecedoresRespondidos: number; },
  groupedData: { name: string, items: any[], total: number }[],
  totalSavings: number,
  melhorTotal: number,
  analysisResult?: string | null
): string {
  let message = `🏢 *NOVO BOI JOÃO DIAS MERCADÃO LTDA*\n`;
  message += `📊 *RELATÓRIO EXECUTIVO DE NEGOCIAÇÃO*\n`;
  message += `──────────────────────\n\n`;

  if (analysisResult) {
    message += `💡 *INSIGHTS E ESTRATÉGIA (IA):*\n_${analysisResult}_\n\n`;
    message += `──────────────────────\n\n`;
  }

  message += `📈 *MÉTRICAS DE PERFORMANCE:*\n`;
  message += `• Itens Negociados: *${stats.totalProdutos}*\n`;
  message += `• Fornecedores Consultados: *${stats.totalFornecedores}*\n`;
  message += `• Participação Efetiva: *${stats.fornecedoresRespondidos} empresas*\n\n`;

  message += `💰 *VALORES DA NEGOCIAÇÃO:*\n`;
  message += `• Valor Final do Lote: *R$ ${melhorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n`;
  
  if (totalSavings > 0) {
    const savingsPercent = ((totalSavings / (melhorTotal + totalSavings)) * 100).toFixed(1);
    message += `• Economia Gerada: *R$ ${totalSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}* (-${savingsPercent}%)\n`;
  }
  message += `\n`;

  message += `🏆 *FORNECEDORES SELECIONADOS:*\n\n`;

  groupedData.forEach(group => {
    if (group.name === "Pendente / Sem Vencedor") return;

    message += `*${group.name.toUpperCase()}*\n`;
    message += `Total Alocado: *R$ ${group.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n`;
    message += `_Itens Conquistados (_${group.items.length}_):_\n`;

    group.items.forEach((item, index) => {
      const finalPrice = item.bestPrice;
      const qtd = item.quantidade || 1;
      const itemTotalValue = finalPrice * qtd;
      const winningSupplierPriceInfo = item.allPrices?.find((p: any) => p.fornecedorId === item.bestSupplierId);
      const initialPrice = winningSupplierPriceInfo?.valor_inicial || finalPrice;
      
      message += `${index + 1}. *${item.productName}*\n`;
      message += `   ${qtd} ${item.unidade || 'un'} × R$ ${finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} = *R$ ${itemTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n`;
      
      if (initialPrice > finalPrice) {
        const itemSavingsUnit = initialPrice - finalPrice;
        const totalItemSavings = itemSavingsUnit * qtd;
        const savingsPercent = ((itemSavingsUnit / initialPrice) * 100).toFixed(0);
        message += `   📉 _Negociado:_ ~R$ ${initialPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}~ → *R$ ${finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}* (-${savingsPercent}%)\n`;
        message += `   ✅ *Economia de R$ ${totalItemSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} neste item*\n`;
      }
    });
    message += `\n`;
  });

  const pendingGroup = groupedData.find(g => g.name === "Pendente / Sem Vencedor");
  if (pendingGroup && pendingGroup.items.length > 0) {
    message += `⚠️ *ITENS AGUARDANDO DEFINIÇÃO (${pendingGroup.items.length}):*\n`;
    pendingGroup.items.forEach((item, index) => {
      message += `${index + 1}. _${item.productName}_\n`;
    });
    message += `\n`;
  }

  message += `──────────────────────\n`;
  message += `_Este relatório demonstra o valor técnico das negociações realizadas, focado em otimização de custos e eficiência de suprimentos._\n\n`;
  message += `*MGC COTAÇÕES | GESTÃO PROFISSIONAL*`;

  return message;
}
