-- Create quotes table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'ativa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quote_items table (produtos da cotação)
CREATE TABLE public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantidade TEXT NOT NULL,
  unidade TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quote_suppliers table (fornecedores participantes)
CREATE TABLE public.quote_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  supplier_name TEXT NOT NULL,
  valor_oferecido DECIMAL(10,2) DEFAULT 0,
  data_resposta DATE,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quotes
CREATE POLICY "Users can view their own quotes" 
ON public.quotes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quotes" 
ON public.quotes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes" 
ON public.quotes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes" 
ON public.quotes 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for quote_items
CREATE POLICY "Users can view quote items of their quotes" 
ON public.quote_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.quotes 
  WHERE quotes.id = quote_items.quote_id 
  AND quotes.user_id = auth.uid()
));

CREATE POLICY "Users can create quote items for their quotes" 
ON public.quote_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.quotes 
  WHERE quotes.id = quote_items.quote_id 
  AND quotes.user_id = auth.uid()
));

CREATE POLICY "Users can update quote items of their quotes" 
ON public.quote_items 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.quotes 
  WHERE quotes.id = quote_items.quote_id 
  AND quotes.user_id = auth.uid()
));

CREATE POLICY "Users can delete quote items of their quotes" 
ON public.quote_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.quotes 
  WHERE quotes.id = quote_items.quote_id 
  AND quotes.user_id = auth.uid()
));

-- RLS Policies for quote_suppliers
CREATE POLICY "Users can view quote suppliers of their quotes" 
ON public.quote_suppliers 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.quotes 
  WHERE quotes.id = quote_suppliers.quote_id 
  AND quotes.user_id = auth.uid()
));

CREATE POLICY "Users can create quote suppliers for their quotes" 
ON public.quote_suppliers 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.quotes 
  WHERE quotes.id = quote_suppliers.quote_id 
  AND quotes.user_id = auth.uid()
));

CREATE POLICY "Users can update quote suppliers of their quotes" 
ON public.quote_suppliers 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.quotes 
  WHERE quotes.id = quote_suppliers.quote_id 
  AND quotes.user_id = auth.uid()
));

CREATE POLICY "Users can delete quote suppliers of their quotes" 
ON public.quote_suppliers 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.quotes 
  WHERE quotes.id = quote_suppliers.quote_id 
  AND quotes.user_id = auth.uid()
));

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quote_suppliers_updated_at
BEFORE UPDATE ON public.quote_suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX idx_quote_items_quote_id ON public.quote_items(quote_id);
CREATE INDEX idx_quote_suppliers_quote_id ON public.quote_suppliers(quote_id);