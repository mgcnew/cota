-- Tabelas de integração WhatsApp com Evolution API

-- Tabela para configuração do WhatsApp por empresa
CREATE TABLE whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  api_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id)
);

-- Tabela para mensagens enviadas
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  packaging_quote_id UUID REFERENCES packaging_quotes(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message_text TEXT NOT NULL,
  message_id TEXT,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para respostas recebidas
CREATE TABLE whatsapp_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  whatsapp_message_id UUID REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  packaging_quote_id UUID REFERENCES packaging_quotes(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  response_text TEXT NOT NULL,
  parsed_data JSONB,
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para templates de mensagem
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_text TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- Habilitar RLS
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Policies para whatsapp_config
CREATE POLICY "Users can view company whatsapp_config" ON whatsapp_config
  FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can create company whatsapp_config" ON whatsapp_config
  FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update company whatsapp_config" ON whatsapp_config
  FOR UPDATE USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can delete company whatsapp_config" ON whatsapp_config
  FOR DELETE USING (company_id = get_user_company_id(auth.uid()));

-- Policies para whatsapp_messages
CREATE POLICY "Users can view company whatsapp_messages" ON whatsapp_messages
  FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can create company whatsapp_messages" ON whatsapp_messages
  FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update company whatsapp_messages" ON whatsapp_messages
  FOR UPDATE USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can delete company whatsapp_messages" ON whatsapp_messages
  FOR DELETE USING (company_id = get_user_company_id(auth.uid()));

-- Policies para whatsapp_responses
CREATE POLICY "Users can view company whatsapp_responses" ON whatsapp_responses
  FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can create company whatsapp_responses" ON whatsapp_responses
  FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update company whatsapp_responses" ON whatsapp_responses
  FOR UPDATE USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can delete company whatsapp_responses" ON whatsapp_responses
  FOR DELETE USING (company_id = get_user_company_id(auth.uid()));

-- Policies para whatsapp_templates
CREATE POLICY "Users can view company whatsapp_templates" ON whatsapp_templates
  FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can create company whatsapp_templates" ON whatsapp_templates
  FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update company whatsapp_templates" ON whatsapp_templates
  FOR UPDATE USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can delete company whatsapp_templates" ON whatsapp_templates
  FOR DELETE USING (company_id = get_user_company_id(auth.uid()));

-- Índices para performance
CREATE INDEX idx_whatsapp_config_company ON whatsapp_config(company_id);
CREATE INDEX idx_whatsapp_messages_company ON whatsapp_messages(company_id);
CREATE INDEX idx_whatsapp_messages_quote_id ON whatsapp_messages(quote_id);
CREATE INDEX idx_whatsapp_messages_packaging_quote_id ON whatsapp_messages(packaging_quote_id);
CREATE INDEX idx_whatsapp_messages_supplier_id ON whatsapp_messages(supplier_id);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_responses_company ON whatsapp_responses(company_id);
CREATE INDEX idx_whatsapp_responses_quote_id ON whatsapp_responses(quote_id);
CREATE INDEX idx_whatsapp_responses_packaging_quote_id ON whatsapp_responses(packaging_quote_id);
CREATE INDEX idx_whatsapp_responses_is_processed ON whatsapp_responses(is_processed);
CREATE INDEX idx_whatsapp_templates_company ON whatsapp_templates(company_id);

-- Triggers para updated_at (usando função existente)
CREATE TRIGGER update_whatsapp_config_updated_at
  BEFORE UPDATE ON whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_messages_updated_at
  BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();