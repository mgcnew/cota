-- Create activity_log table for system history
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('cotacao', 'pedido', 'fornecedor', 'produto')),
  acao TEXT NOT NULL,
  detalhes TEXT NOT NULL,
  valor DECIMAL(10,2),
  economia DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_log
CREATE POLICY "Users can view their own activity log" 
ON public.activity_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activity log" 
ON public.activity_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX idx_activity_log_tipo ON public.activity_log(tipo);
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at DESC);