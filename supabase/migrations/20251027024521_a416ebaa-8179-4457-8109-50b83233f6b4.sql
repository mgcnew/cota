-- Add rating column to suppliers table
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_quote_supplier_items_supplier ON quote_supplier_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_quote_supplier_items_quote_product ON quote_supplier_items(quote_id, product_id);
CREATE INDEX IF NOT EXISTS idx_orders_supplier ON orders(supplier_id, status);
CREATE INDEX IF NOT EXISTS idx_quote_suppliers_supplier ON quote_suppliers(supplier_id);

-- Add comment to rating column
COMMENT ON COLUMN suppliers.rating IS 'Calculated rating based on win rate, price competitiveness, response time, availability, and delivery history (0.00-5.00)';