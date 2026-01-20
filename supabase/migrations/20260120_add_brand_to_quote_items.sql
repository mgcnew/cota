-- Add brand_id to quote_supplier_items to track brand per supplier offer
ALTER TABLE public.quote_supplier_items 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_quote_supplier_items_brand_id ON public.quote_supplier_items(brand_id);
