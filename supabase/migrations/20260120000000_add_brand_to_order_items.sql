alter table public.order_items 
add column brand_id uuid references public.brands(id);
