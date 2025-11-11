-- Create shopping_list table
CREATE TABLE public.shopping_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'un',
  priority TEXT NOT NULL DEFAULT 'medium',
  notes TEXT,
  category TEXT,
  estimated_price DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_shopping_list_company_id ON public.shopping_list(company_id);
CREATE INDEX idx_shopping_list_product_id ON public.shopping_list(product_id);
CREATE INDEX idx_shopping_list_priority ON public.shopping_list(priority);
CREATE INDEX idx_shopping_list_created_at ON public.shopping_list(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view shopping list items from their company
CREATE POLICY "Users can view shopping list items from their company"
  ON public.shopping_list
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policy: Users can insert shopping list items for their company
CREATE POLICY "Users can insert shopping list items for their company"
  ON public.shopping_list
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- RLS Policy: Users can update shopping list items from their company
CREATE POLICY "Users can update shopping list items from their company"
  ON public.shopping_list
  FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policy: Users can delete shopping list items from their company
CREATE POLICY "Users can delete shopping list items from their company"
  ON public.shopping_list
  FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- Create function to validate priority (using trigger instead of CHECK constraint)
CREATE OR REPLACE FUNCTION public.validate_shopping_list_priority()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.priority NOT IN ('low', 'medium', 'high', 'urgent') THEN
    RAISE EXCEPTION 'Priority must be one of: low, medium, high, urgent';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for priority validation
CREATE TRIGGER validate_priority_before_insert_update
  BEFORE INSERT OR UPDATE ON public.shopping_list
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_shopping_list_priority();

-- Create trigger for automatic updated_at timestamp
CREATE TRIGGER shopping_list_updated_at
  BEFORE UPDATE ON public.shopping_list
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();