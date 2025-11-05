-- Criar tabela de setores de estoque
CREATE TABLE IF NOT EXISTS public.stock_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS na tabela stock_sectors
ALTER TABLE public.stock_sectors ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para stock_sectors
CREATE POLICY "Users can view company stock sectors"
  ON public.stock_sectors FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company stock sectors"
  ON public.stock_sectors FOR INSERT
  TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company stock sectors"
  ON public.stock_sectors FOR UPDATE
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company stock sectors"
  ON public.stock_sectors FOR DELETE
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

-- Criar tabela de contagens de estoque
CREATE TABLE IF NOT EXISTS public.stock_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'finalizada', 'cancelada')),
  count_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Habilitar RLS na tabela stock_counts
ALTER TABLE public.stock_counts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para stock_counts
CREATE POLICY "Users can view company stock counts"
  ON public.stock_counts FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company stock counts"
  ON public.stock_counts FOR INSERT
  TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company stock counts"
  ON public.stock_counts FOR UPDATE
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company stock counts"
  ON public.stock_counts FOR DELETE
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

-- Criar tabela de itens de contagem de estoque
CREATE TABLE IF NOT EXISTS public.stock_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_count_id UUID NOT NULL REFERENCES public.stock_counts(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sector_id UUID NOT NULL REFERENCES public.stock_sectors(id) ON DELETE CASCADE,
  quantity_ordered NUMERIC DEFAULT 0,
  quantity_existing NUMERIC DEFAULT 0,
  quantity_counted NUMERIC DEFAULT 0,
  notes TEXT,
  photo_url TEXT
);

-- Habilitar RLS na tabela stock_count_items
ALTER TABLE public.stock_count_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para stock_count_items
CREATE POLICY "Users can view company stock count items"
  ON public.stock_count_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stock_counts 
      WHERE id = stock_count_items.stock_count_id 
      AND company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can create company stock count items"
  ON public.stock_count_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stock_counts 
      WHERE id = stock_count_items.stock_count_id 
      AND company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can update company stock count items"
  ON public.stock_count_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stock_counts 
      WHERE id = stock_count_items.stock_count_id 
      AND company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can delete company stock count items"
  ON public.stock_count_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stock_counts 
      WHERE id = stock_count_items.stock_count_id 
      AND company_id = get_user_company_id(auth.uid())
    )
  );

-- Criar triggers para updated_at
CREATE TRIGGER update_stock_sectors_updated_at
  BEFORE UPDATE ON public.stock_sectors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_counts_updated_at
  BEFORE UPDATE ON public.stock_counts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar função para resumo de contagem por setor
CREATE OR REPLACE FUNCTION public.get_stock_count_sector_summary(p_stock_count_id UUID)
RETURNS TABLE (
  sector_id UUID,
  sector_name TEXT,
  total_items BIGINT,
  total_ordered NUMERIC,
  total_existing NUMERIC,
  total_counted NUMERIC,
  discrepancies BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id AS sector_id,
    s.name AS sector_name,
    COUNT(sci.id) AS total_items,
    COALESCE(SUM(sci.quantity_ordered), 0) AS total_ordered,
    COALESCE(SUM(sci.quantity_existing), 0) AS total_existing,
    COALESCE(SUM(sci.quantity_counted), 0) AS total_counted,
    COUNT(CASE WHEN sci.quantity_counted <> sci.quantity_ordered THEN 1 END) AS discrepancies
  FROM stock_sectors s
  LEFT JOIN stock_count_items sci ON sci.sector_id = s.id AND sci.stock_count_id = p_stock_count_id
  WHERE EXISTS (
    SELECT 1 FROM stock_count_items WHERE sector_id = s.id AND stock_count_id = p_stock_count_id
  )
  GROUP BY s.id, s.name
  ORDER BY s.name;
$$;