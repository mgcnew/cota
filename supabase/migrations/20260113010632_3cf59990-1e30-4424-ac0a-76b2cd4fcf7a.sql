-- Pedidos de embalagens
CREATE TABLE packaging_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES packaging_quotes(id) ON DELETE SET NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  supplier_name TEXT NOT NULL,
  total_value DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pendente',
  order_date DATE NOT NULL,
  delivery_date DATE,
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens do pedido de embalagem
CREATE TABLE packaging_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES packaging_orders(id) ON DELETE CASCADE,
  packaging_id UUID NOT NULL REFERENCES packaging_items(id),
  packaging_name TEXT NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL,
  unidade_compra TEXT,
  quantidade_por_unidade INTEGER,
  valor_unitario DECIMAL(10,4),
  valor_total DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE packaging_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging_order_items ENABLE ROW LEVEL SECURITY;

-- Policies para packaging_orders
CREATE POLICY "Users can view company packaging_orders" ON packaging_orders
  FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company packaging_orders" ON packaging_orders
  FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company packaging_orders" ON packaging_orders
  FOR UPDATE USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company packaging_orders" ON packaging_orders
  FOR DELETE USING (company_id = get_user_company_id(auth.uid()));

-- Policies para packaging_order_items
CREATE POLICY "Users can view company packaging_order_items" ON packaging_order_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM packaging_orders 
    WHERE packaging_orders.id = packaging_order_items.order_id 
    AND packaging_orders.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can create company packaging_order_items" ON packaging_order_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM packaging_orders 
    WHERE packaging_orders.id = packaging_order_items.order_id 
    AND packaging_orders.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can update company packaging_order_items" ON packaging_order_items
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM packaging_orders 
    WHERE packaging_orders.id = packaging_order_items.order_id 
    AND packaging_orders.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can delete company packaging_order_items" ON packaging_order_items
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM packaging_orders 
    WHERE packaging_orders.id = packaging_order_items.order_id 
    AND packaging_orders.company_id = get_user_company_id(auth.uid())
  ));

-- Índices para performance
CREATE INDEX idx_packaging_orders_company ON packaging_orders(company_id);
CREATE INDEX idx_packaging_orders_status ON packaging_orders(status);
CREATE INDEX idx_packaging_orders_supplier ON packaging_orders(supplier_id);
CREATE INDEX idx_packaging_order_items_order ON packaging_order_items(order_id);
CREATE INDEX idx_packaging_order_items_packaging ON packaging_order_items(packaging_id);