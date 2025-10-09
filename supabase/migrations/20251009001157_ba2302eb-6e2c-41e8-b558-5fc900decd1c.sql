-- Add unit column to order_items table
ALTER TABLE public.order_items 
ADD COLUMN unit TEXT NOT NULL DEFAULT 'un';