-- Adiciona 'enviado' aos status permitidos de pedidos
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pendente', 'enviado', 'confirmado', 'entregue', 'cancelado', 'pago'));
