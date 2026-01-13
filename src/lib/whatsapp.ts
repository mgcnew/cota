import { supabase } from "@/integrations/supabase/client";
import { WhatsAppConfig, SendWhatsAppQuoteParams } from "@/types/whatsapp";

/**
 * Serviço de integração com WhatsApp usando Evolution API
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

// Enviar mensagem via Evolution API
export async function sendWhatsAppMessage(
  config: WhatsAppConfig,
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
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
      return { success: false, error: errorData.message || 'Erro ao enviar mensagem' };
    }

    const data = await response.json();
    return { success: true, messageId: data.key?.id };
  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    return { success: false, error: 'Erro de conexão com WhatsApp' };
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

  // Buscar empresa
  const { data: company } = await supabase
    .from('companies')
    .select('name')
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

  // Se não tiver template, usa o padrão
  if (!template) {
    const { data: defaultTemplate } = await (supabase
      .from('whatsapp_templates' as any)
      .select('template_text')
      .eq('company_id', quote.company_id)
      .eq('is_default', true)
      .single() as any);
    
    template = (defaultTemplate as any)?.template_text || 
      `Bom dia! 👋\n\nSomos da {company_name} e estamos solicitando uma cotação.\n\n📋 *Produtos:*\n{products_list}\n\n⏰ *Prazo para resposta:* {deadline}\n\nPor favor, nos envie os preços dos produtos acima.\n\nObrigado!`;
  }

  // Montar lista de produtos
  const productsList = quote.quote_items
    .map((item: any, index: number) => 
      `${index + 1}. ${item.product_name} - ${item.quantidade} ${item.unidade || 'un'}`
    )
    .join('\n');

  // Substituir variáveis no template
  let message = template
    .replace('{company_name}', company?.name || 'Nossa empresa')
    .replace('{products_list}', productsList)
    .replace('{deadline}', deadline || quote.data_fim || 'o mais breve possível');

  return message;
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
  if (!config) {
    return { success: false, sent: 0, failed: 0, errors: ['WhatsApp não configurado'] };
  }

  // Buscar fornecedores
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, phone')
    .in('id', supplierIds);

  if (!suppliers || suppliers.length === 0) {
    return { success: false, sent: 0, failed: 0, errors: ['Nenhum fornecedor encontrado'] };
  }

  // Gerar mensagem
  const message = await generateQuoteMessage(quoteId, templateId, customMessage, deadline);

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

    // Enviar mensagem
    const result = await sendWhatsAppMessage(config, supplier.phone, message);

    // Registrar no banco
    const messageRecord = {
      company_id: quote.company_id,
      quote_id: quoteId,
      supplier_id: supplier.id,
      phone_number: supplier.phone,
      message_text: message,
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
