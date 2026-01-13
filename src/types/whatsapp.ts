export interface WhatsAppConfig {
  id: string;
  company_id: string;
  api_url: string;
  api_key: string;
  instance_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  company_id: string;
  quote_id?: string;
  packaging_quote_id?: string;
  supplier_id: string;
  phone_number: string;
  message_text: string;
  message_id?: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppResponse {
  id: string;
  company_id: string;
  whatsapp_message_id?: string;
  quote_id?: string;
  packaging_quote_id?: string;
  supplier_id: string;
  phone_number: string;
  response_text: string;
  parsed_data?: any;
  is_processed: boolean;
  processed_at?: string;
  received_at: string;
  created_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  company_id: string;
  name: string;
  template_text: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SendWhatsAppQuoteParams {
  quoteId: string;
  supplierIds: string[];
  templateId?: string;
  customMessage?: string;
  deadline?: string;
}
