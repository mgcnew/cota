# SQL para Módulo de Embalagens

Execute este SQL no Lovable para criar as tabelas necessárias para o módulo de cotação de embalagens.

## Tabelas

```sql
-- Tabela de embalagens (cadastro)
CREATE TABLE packaging_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  reference_unit VARCHAR(20) NOT NULL DEFAULT 'un',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de cotações de embalagens
CREATE TABLE packaging_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'ativa',
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens da cotação de embalagem
CREATE TABLE packaging_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES packaging_quotes(id) ON DELETE CASCADE,
  packaging_id UUID NOT NULL REFERENCES packaging_items(id),
  packaging_name VARCHAR(255) NOT NULL,
  quantidade_necessaria DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fornecedores participantes da cotação
CREATE TABLE packaging_quote_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES packaging_quotes(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  supplier_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente',
  data_resposta TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Valores oferecidos por fornecedor (CHAVE para comparação)
CREATE TABLE packaging_supplier_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES packaging_quotes(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  packaging_id UUID NOT NULL REFERENCES packaging_items(id),
  packaging_name VARCHAR(255) NOT NULL,
  valor_total DECIMAL(10,2),
  unidade_venda VARCHAR(20),
  quantidade_venda DECIMAL(10,2),
  quantidade_unidades_estimada INT,
  gramatura DECIMAL(6,2),
  dimensoes VARCHAR(100),
  custo_por_unidade DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE packaging_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging_quote_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging_supplier_items ENABLE ROW LEVEL SECURITY;

-- Policies para packaging_items
CREATE POLICY "Users can view own company packaging_items" ON packaging_items
  FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own company packaging_items" ON packaging_items
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own company packaging_items" ON packaging_items
  FOR UPDATE USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own company packaging_items" ON packaging_items
  FOR DELETE USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Policies para packaging_quotes
CREATE POLICY "Users can view own company packaging_quotes" ON packaging_quotes
  FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own company packaging_quotes" ON packaging_quotes
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own company packaging_quotes" ON packaging_quotes
  FOR UPDATE USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own company packaging_quotes" ON packaging_quotes
  FOR DELETE USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Policies para packaging_quote_items
CREATE POLICY "Users can manage packaging_quote_items" ON packaging_quote_items
  FOR ALL USING (quote_id IN (
    SELECT id FROM packaging_quotes WHERE company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  ));

-- Policies para packaging_quote_suppliers
CREATE POLICY "Users can manage packaging_quote_suppliers" ON packaging_quote_suppliers
  FOR ALL USING (quote_id IN (
    SELECT id FROM packaging_quotes WHERE company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  ));

-- Policies para packaging_supplier_items
CREATE POLICY "Users can manage packaging_supplier_items" ON packaging_supplier_items
  FOR ALL USING (quote_id IN (
    SELECT id FROM packaging_quotes WHERE company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  ));
```

## Índices (opcional, para performance)

```sql
CREATE INDEX idx_packaging_items_company ON packaging_items(company_id);
CREATE INDEX idx_packaging_quotes_company ON packaging_quotes(company_id);
CREATE INDEX idx_packaging_quotes_status ON packaging_quotes(status);
CREATE INDEX idx_packaging_quote_items_quote ON packaging_quote_items(quote_id);
CREATE INDEX idx_packaging_quote_suppliers_quote ON packaging_quote_suppliers(quote_id);
CREATE INDEX idx_packaging_supplier_items_quote ON packaging_supplier_items(quote_id);
CREATE INDEX idx_packaging_supplier_items_supplier ON packaging_supplier_items(supplier_id);
```

## Campos Importantes

### packaging_supplier_items
- `valor_total`: Preço total oferecido pelo fornecedor
- `unidade_venda`: Como o fornecedor vende (kg, pacote, cento, milheiro, etc.)
- `quantidade_venda`: Quantidade na unidade de venda (ex: 5kg)
- `quantidade_unidades_estimada`: Quantas unidades reais vêm (ex: 500 sacolas)
- `gramatura`: Espessura/gramatura do material (opcional)
- `dimensoes`: Tamanho do item (ex: "30x40cm")
- `custo_por_unidade`: Calculado automaticamente (valor_total / quantidade_unidades_estimada)

### Lógica de Comparação
O sistema compara fornecedores pelo **custo por unidade**, permitindo comparar mesmo quando:
- Um vende por kg e outro por pacote
- As quantidades são diferentes
- A gramatura varia (afetando quantidade de unidades por kg)
