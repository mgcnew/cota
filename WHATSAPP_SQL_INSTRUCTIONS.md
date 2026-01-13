# 📱 Instruções para Configurar WhatsApp no Banco de Dados

## ⚠️ IMPORTANTE
Execute este SQL no **Lovable** (Database > SQL Editor) para criar as tabelas necessárias para a integração com WhatsApp.

## 📋 SQL para Executar

```sql
-- Tabela para configuração do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_config (
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
CREATE TABLE IF NOT EXISTS whatsapp_messages (
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
CREATE TABLE IF NOT EXISTS whatsapp_responses (
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
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_text TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_quote_id ON whatsapp_messages(quote_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_packaging_quote_id ON whatsapp_messages(packaging_quote_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_supplier_id ON whatsapp_messages(supplier_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_responses_quote_id ON whatsapp_responses(quote_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_responses_packaging_quote_id ON whatsapp_responses(packaging_quote_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_responses_is_processed ON whatsapp_responses(is_processed);

-- RLS Policies
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Policies para whatsapp_config
CREATE POLICY "Users can view their company whatsapp config"
  ON whatsapp_config FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their company whatsapp config"
  ON whatsapp_config FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their company whatsapp config"
  ON whatsapp_config FOR UPDATE
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

-- Policies para whatsapp_messages
CREATE POLICY "Users can view their company whatsapp messages"
  ON whatsapp_messages FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their company whatsapp messages"
  ON whatsapp_messages FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their company whatsapp messages"
  ON whatsapp_messages FOR UPDATE
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

-- Policies para whatsapp_responses
CREATE POLICY "Users can view their company whatsapp responses"
  ON whatsapp_responses FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their company whatsapp responses"
  ON whatsapp_responses FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their company whatsapp responses"
  ON whatsapp_responses FOR UPDATE
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

-- Policies para whatsapp_templates
CREATE POLICY "Users can view their company whatsapp templates"
  ON whatsapp_templates FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their company whatsapp templates"
  ON whatsapp_templates FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their company whatsapp templates"
  ON whatsapp_templates FOR UPDATE
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their company whatsapp templates"
  ON whatsapp_templates FOR DELETE
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_whatsapp_config_updated_at
  BEFORE UPDATE ON whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER update_whatsapp_messages_updated_at
  BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

-- Inserir template padrão para todas as empresas
INSERT INTO whatsapp_templates (company_id, name, template_text, is_default)
SELECT 
  c.id,
  'Template Padrão',
  E'Bom dia! 👋\n\nSomos da {company_name} e estamos solicitando uma cotação.\n\n📋 *Produtos:*\n{products_list}\n\n⏰ *Prazo para resposta:* {deadline}\n\nPor favor, nos envie os preços dos produtos acima.\n\nObrigado!',
  true
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM whatsapp_templates WHERE company_id = c.id
);
```

## ✅ Após Executar o SQL

1. As tabelas serão criadas automaticamente
2. Um template padrão será inserido para sua empresa
3. O sistema estará pronto para usar WhatsApp!

## 🚀 Como Usar

1. **Configurar WhatsApp**: Abra uma cotação e clique no botão "WhatsApp" verde
2. **Primeira vez**: Clique em "Configurar" para adicionar suas credenciais da Evolution API
3. **Enviar Cotação**: Selecione os fornecedores e envie a mensagem
4. **Receber Respostas**: As respostas dos fornecedores aparecerão automaticamente no sistema

## 📖 Documentação Evolution API

Para instalar a Evolution API: https://doc.evolution-api.com/install/docker

Opções:
- **Docker** (recomendado): Rápido e fácil
- **Cloud**: Heroku, Railway, Render
- **Local**: Node.js

## 🔧 Configuração Rápida com Docker

```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua-chave-secreta \
  atendai/evolution-api:latest
```

Acesse: http://localhost:8080

## 💡 Dicas

- Guarde bem sua API Key da Evolution API
- Teste a conexão antes de enviar para fornecedores
- Personalize o template de mensagem conforme sua necessidade
- As respostas são processadas automaticamente
