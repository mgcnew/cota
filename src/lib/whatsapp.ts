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
      
      // O endpoint original da W-API.APP (usando o proxy local para evitar CORS em dev)
      // Endpoint exato documentado no Postman da W-API para a Instância LITE
      const isProduction = import.meta.env.PROD;
      const baseUrl = isProduction ? 'https://api.w-api.app' : '/whatsapp-api';
      const endpoint = `${baseUrl}/v1/message/send-text?instanceId=${W_API_INSTANCE}`;
      
      console.log('[WhatsApp DEBUG] Endpoint Final:', endpoint);
      console.log('[WhatsApp DEBUG] Destinatário:', formattedPhone);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${W_API_TOKEN}`,
        },
        body: JSON.stringify({
          phone: formattedPhone, // Conforme documentação a chave deve ser 'phone' e não 'number'
          message: message,
        }),
      });

      const data = await response.json();
      console.log('[WhatsApp DEBUG] HTTP Status:', response.status);
      console.log('[WhatsApp DEBUG] Resposta JSON:', JSON.stringify(data));

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

  // Buscar empresa e CNPJ
  const { data: company } = await supabase
    .from('companies')
    .select('name, cnpj')
    .eq('id', quote.company_id)
    .single();

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

  // Buscar fornecedores (precisamos do contact tbm agora para saudação)
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, contact, phone')
    .in('id', supplierIds);

  if (!suppliers || suppliers.length === 0) {
    return { success: false, sent: 0, failed: 0, errors: ['Nenhum fornecedor encontrado'] };
  }

  // Gerar template genérico da mensagem (sem o nome do fornecedor específico)
  const baseMessage = await generateQuoteMessage(quoteId, templateId, customMessage, deadline);

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Enviar para cada fornecedor
  for (const supplier of suppliers) {
    if (!supplier.phone) {
      errors.push(`${supplier.name}: Telefone não cadastrado`);
      failed++;
      continue;
    }

    // Adaptar mensagem substituindo o placeholder de saudação com o nome daquele exato contatro (ou empresa)
    const supplierContactName = supplier.contact || supplier.name || "Fornecedor";
    // Tenta substituir se a tag estiver lá (nossos novos defaults têm). Se não tiver a tag, se houver um fallback simples (como o Bom dia), 
    // podemos opcionalmente empurrar, mas como refizemos o default, será trocado com sucesso
    const personalizedMessage = baseMessage.replace(/{supplier_name}/g, supplierContactName);

    // Enviar mensagem
    const result = await sendWhatsAppMessage(config, supplier.phone, personalizedMessage);

    // Registrar no banco
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

  return {
    success: sent > 0,
    sent,
    failed,
    errors,
  };
}

// Processar resposta do fornecedor (webhook)
export async function processWhatsAppResponse(
  phoneNumber: string,
  messageText: string,
  companyId: string
): Promise<{ success: boolean; parsed?: any }> {
  try {
    // Buscar fornecedor pelo telefone
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('company_id', companyId)
      .ilike('phone', `%${formattedPhone.slice(-9)}%`) // Últimos 9 dígitos
      .single();

    if (!supplier) {
      console.log('Fornecedor não encontrado para o telefone:', phoneNumber);
      return { success: false };
    }

    // Buscar última mensagem enviada para este fornecedor
    const { data: lastMessage } = await (supabase
      .from('whatsapp_messages' as any)
      .select('id, quote_id, packaging_quote_id')
      .eq('supplier_id', supplier.id)
      .eq('company_id', companyId)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single() as any);

    if (!lastMessage) {
      console.log('Nenhuma mensagem anterior encontrada');
      return { success: false };
    }

    // Tentar extrair preços da mensagem
    const parsedData = parseQuoteResponse(messageText);

    // Salvar resposta
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
  
  // Padrões comuns de resposta:
  // "Arroz R$ 5,50"
  // "1. Feijão - R$ 8,00"
  // "Óleo: 12.50"
  
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Tentar encontrar preço na linha
    const priceMatch = line.match(/R?\$?\s*(\d+[.,]\d{2})/i);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(',', '.'));
      
      // Tentar encontrar nome do produto
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
  // Buscar dados do pedido
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

  // Buscar empresa atual
  const { data: company } = await supabase
    .from('companies')
    .select('name, cnpj')
    .eq('id', order.company_id)
    .single();

  // Buscar fornecedor
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('name, contact, phone')
    .eq('id', order.supplier_id)
    .single();

  // Identificar se foi oriundo de uma Cotação ou Pedido Direto
  const isQuoted = !!order.quote_id;

  const headerText = isQuoted 
    ? `Este é um pedido referente à cotação que vocês venceram conosco.` 
    : `Este é um pedido direto do setor de compras.`;

  // Lista de produtos formatada
  const productsList = order.order_items
    .map((item: any, index: number) => 
      `${index + 1}. *${item.product_name}* - ${item.quantity} ${item.unidade_pedida || 'un'}`
    )
    .join('\n');

  // Aplicando dados do comprador:
  // Forçando as informações solicitadas (pois o nome da tabela companies está "Empresa de xxx@email...")
  const companyName = "NOVO BOI JOÃO DIAS MERCADÃO LTDA";
  const companyCnpj = "63.195.471/0001-12";
  
  // Tratamento do vendedor fornecedor
  const supplierContactName = supplier?.contact || supplier?.name || "Fornecedor";

  // Montagem da mensagem final
  let message = `Olá *${supplierContactName}*, tudo bem?\n\n`;
  message += `${headerText}\n\n`;
  message += `*Empresa:* ${companyName}\n`;
  message += `*CNPJ:* ${companyCnpj}\n\n`;
  message += `📋 *Lista de Produtos Solicitados:*\n${productsList}\n\n`;
  message += `Por favor, nos envie o *espelho da nota* ou *comprovante do pedido* para conferência.\n\nMuito obrigado!`;

  return { message, phone: supplier?.phone || null };
}
