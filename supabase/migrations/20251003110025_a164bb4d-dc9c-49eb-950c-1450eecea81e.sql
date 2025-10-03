-- Create table for storing supplier values per product
CREATE TABLE public.quote_supplier_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  valor_oferecido NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_supplier_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view quote supplier items of their quotes"
ON public.quote_supplier_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM quotes
  WHERE quotes.id = quote_supplier_items.quote_id
  AND quotes.user_id = auth.uid()
));

CREATE POLICY "Users can create quote supplier items for their quotes"
ON public.quote_supplier_items
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM quotes
  WHERE quotes.id = quote_supplier_items.quote_id
  AND quotes.user_id = auth.uid()
));

CREATE POLICY "Users can update quote supplier items of their quotes"
ON public.quote_supplier_items
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM quotes
  WHERE quotes.id = quote_supplier_items.quote_id
  AND quotes.user_id = auth.uid()
));

CREATE POLICY "Users can delete quote supplier items of their quotes"
ON public.quote_supplier_items
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM quotes
  WHERE quotes.id = quote_supplier_items.quote_id
  AND quotes.user_id = auth.uid()
));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_quote_supplier_items_updated_at
BEFORE UPDATE ON public.quote_supplier_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();