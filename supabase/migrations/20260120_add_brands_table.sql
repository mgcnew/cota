-- Create brands table
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    manual_rating INTEGER DEFAULT 0 CHECK (manual_rating >= 0 AND manual_rating <= 5),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add brand_id to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

-- Enable RLS on brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brands
CREATE POLICY "Users can view brands of their company" ON public.brands
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert brands for their company" ON public.brands
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update brands of their company" ON public.brands
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete brands of their company" ON public.brands
    FOR DELETE USING (company_id IN (
        SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
    ));

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on brands
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
