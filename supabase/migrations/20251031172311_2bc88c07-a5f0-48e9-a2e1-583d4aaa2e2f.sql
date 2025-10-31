-- Phase 6: Drop user_id columns from all tables
-- This is safe because we've already migrated all data to use company_id

-- Drop user_id from products
ALTER TABLE public.products DROP COLUMN IF EXISTS user_id;

-- Drop user_id from suppliers
ALTER TABLE public.suppliers DROP COLUMN IF EXISTS user_id;

-- Drop user_id from quotes
ALTER TABLE public.quotes DROP COLUMN IF EXISTS user_id;

-- Drop user_id from orders
ALTER TABLE public.orders DROP COLUMN IF EXISTS user_id;

-- Drop user_id from activity_log
ALTER TABLE public.activity_log DROP COLUMN IF EXISTS user_id;