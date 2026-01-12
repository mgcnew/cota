-- Tabela de embalagens
CREATE TABLE packaging_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  reference_unit TEXT NOT NULL DEFAULT 'un',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de cotações de embalagens
CREATE TABLE packaging_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'ativa',
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
  packaging_id UUID NOT NULL REFERENCES packaging_items(id) ON DELETE CASCADE,
  packaging_name TEXT NOT NULL,
  quantidade_necessaria DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fornecedores participantes da cotação
CREATE TABLE packaging_quote_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES packaging_quotes(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  status TEXT DEFAULT 'pendente',
  data_resposta TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Valores oferecidos por fornecedor
CREATE TABLE packaging_supplier_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES packaging_quotes(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  packaging_id UUID NOT NULL REFERENCES packaging_items(id) ON DELETE CASCADE,
  packaging_name TEXT NOT NULL,
  valor_total DECIMAL(10,2),
  unidade_venda TEXT,
  quantidade_venda DECIMAL(10,2),
  quantidade_unidades_estimada INTEGER,
  gramatura DECIMAL(6,2),
  dimensoes TEXT,
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
CREATE POLICY "Users can view company packaging_items" ON packaging_items
  FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company packaging_items" ON packaging_items
  FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company packaging_items" ON packaging_items
  FOR UPDATE USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company packaging_items" ON packaging_items
  FOR DELETE USING (company_id = get_user_company_id(auth.uid()));

-- Policies para packaging_quotes
CREATE POLICY "Users can view company packaging_quotes" ON packaging_quotes
  FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company packaging_quotes" ON packaging_quotes
  FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company packaging_quotes" ON packaging_quotes
  FOR UPDATE USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company packaging_quotes" ON packaging_quotes
  FOR DELETE USING (company_id = get_user_company_id(auth.uid()));

-- Policies para packaging_quote_items
CREATE POLICY "Users can view company packaging_quote_items" ON packaging_quote_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_quote_items.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can create company packaging_quote_items" ON packaging_quote_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_quote_items.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can update company packaging_quote_items" ON packaging_quote_items
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_quote_items.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can delete company packaging_quote_items" ON packaging_quote_items
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_quote_items.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
  ));

-- Policies para packaging_quote_suppliers
CREATE POLICY "Users can view company packaging_quote_suppliers" ON packaging_quote_suppliers
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_quote_suppliers.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can create company packaging_quote_suppliers" ON packaging_quote_suppliers
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_quote_suppliers.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can update company packaging_quote_suppliers" ON packaging_quote_suppliers
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_quote_suppliers.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can delete company packaging_quote_suppliers" ON packaging_quote_suppliers
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_quote_suppliers.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
  ));

-- Policies para packaging_supplier_items
CREATE POLICY "Users can view company packaging_supplier_items" ON packaging_supplier_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_supplier_items.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can create company packaging_supplier_items" ON packaging_supplier_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_supplier_items.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can update company packaging_supplier_items" ON packaging_supplier_items
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_supplier_items.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can delete company packaging_supplier_items" ON packaging_supplier_items
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM packaging_quotes 
    WHERE packaging_quotes.id = packaging_supplier_items.quote_id 
    AND packaging_quotes.company_id = get_user_company_id(auth.uid())
  ));