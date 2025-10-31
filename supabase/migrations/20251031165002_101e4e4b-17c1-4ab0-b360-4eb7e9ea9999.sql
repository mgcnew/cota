-- FASE 4: Atualizar RLS Policies (user_id → company_id)
-- Trocar políticas baseadas em user_id para company_id

-- ============================================
-- PRODUCTS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own products" ON products;
DROP POLICY IF EXISTS "Users can create their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;

CREATE POLICY "Users can view company products"
ON products FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company products"
ON products FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company products"
ON products FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company products"
ON products FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- ============================================
-- SUPPLIERS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can create their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can update their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can delete their own suppliers" ON suppliers;

CREATE POLICY "Users can view company suppliers"
ON suppliers FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company suppliers"
ON suppliers FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company suppliers"
ON suppliers FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company suppliers"
ON suppliers FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- ============================================
-- QUOTES
-- ============================================
DROP POLICY IF EXISTS "Users can view their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can create their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON quotes;

CREATE POLICY "Users can view company quotes"
ON quotes FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company quotes"
ON quotes FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company quotes"
ON quotes FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company quotes"
ON quotes FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- ============================================
-- ORDERS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete their own orders" ON orders;

CREATE POLICY "Users can view company orders"
ON orders FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company orders"
ON orders FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company orders"
ON orders FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- ============================================
-- ACTIVITY_LOG
-- ============================================
DROP POLICY IF EXISTS "Users can view their own activity log" ON activity_log;
DROP POLICY IF EXISTS "Users can create their own activity log" ON activity_log;

CREATE POLICY "Users can view company activity log"
ON activity_log FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company activity log"
ON activity_log FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- ============================================
-- QUOTE_ITEMS (baseado em quotes.company_id)
-- ============================================
DROP POLICY IF EXISTS "Users can view quote items of their quotes" ON quote_items;
DROP POLICY IF EXISTS "Users can create quote items for their quotes" ON quote_items;
DROP POLICY IF EXISTS "Users can update quote items of their quotes" ON quote_items;
DROP POLICY IF EXISTS "Users can delete quote items of their quotes" ON quote_items;

CREATE POLICY "Users can view company quote items"
ON quote_items FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM quotes 
  WHERE quotes.id = quote_items.quote_id 
  AND quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can create company quote items"
ON quote_items FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM quotes 
  WHERE quotes.id = quote_items.quote_id 
  AND quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can update company quote items"
ON quote_items FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM quotes 
  WHERE quotes.id = quote_items.quote_id 
  AND quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can delete company quote items"
ON quote_items FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM quotes 
  WHERE quotes.id = quote_items.quote_id 
  AND quotes.company_id = get_user_company_id(auth.uid())
));

-- ============================================
-- QUOTE_SUPPLIERS (baseado em quotes.company_id)
-- ============================================
DROP POLICY IF EXISTS "Users can view quote suppliers of their quotes" ON quote_suppliers;
DROP POLICY IF EXISTS "Users can create quote suppliers for their quotes" ON quote_suppliers;
DROP POLICY IF EXISTS "Users can update quote suppliers of their quotes" ON quote_suppliers;
DROP POLICY IF EXISTS "Users can delete quote suppliers of their quotes" ON quote_suppliers;

CREATE POLICY "Users can view company quote suppliers"
ON quote_suppliers FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM quotes 
  WHERE quotes.id = quote_suppliers.quote_id 
  AND quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can create company quote suppliers"
ON quote_suppliers FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM quotes 
  WHERE quotes.id = quote_suppliers.quote_id 
  AND quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can update company quote suppliers"
ON quote_suppliers FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM quotes 
  WHERE quotes.id = quote_suppliers.quote_id 
  AND quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can delete company quote suppliers"
ON quote_suppliers FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM quotes 
  WHERE quotes.id = quote_suppliers.quote_id 
  AND quotes.company_id = get_user_company_id(auth.uid())
));

-- ============================================
-- QUOTE_SUPPLIER_ITEMS (baseado em quotes.company_id)
-- ============================================
DROP POLICY IF EXISTS "Users can view quote supplier items of their quotes" ON quote_supplier_items;
DROP POLICY IF EXISTS "Users can create quote supplier items for their quotes" ON quote_supplier_items;
DROP POLICY IF EXISTS "Users can update quote supplier items of their quotes" ON quote_supplier_items;
DROP POLICY IF EXISTS "Users can delete quote supplier items of their quotes" ON quote_supplier_items;

CREATE POLICY "Users can view company quote supplier items"
ON quote_supplier_items FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM quotes 
  WHERE quotes.id = quote_supplier_items.quote_id 
  AND quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can create company quote supplier items"
ON quote_supplier_items FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM quotes 
  WHERE quotes.id = quote_supplier_items.quote_id 
  AND quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can update company quote supplier items"
ON quote_supplier_items FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM quotes 
  WHERE quotes.id = quote_supplier_items.quote_id 
  AND quotes.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can delete company quote supplier items"
ON quote_supplier_items FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM quotes 
  WHERE quotes.id = quote_supplier_items.quote_id 
  AND quotes.company_id = get_user_company_id(auth.uid())
));

-- ============================================
-- ORDER_ITEMS (baseado em orders.company_id)
-- ============================================
DROP POLICY IF EXISTS "Users can view order items of their orders" ON order_items;
DROP POLICY IF EXISTS "Users can create order items for their orders" ON order_items;
DROP POLICY IF EXISTS "Users can update order items of their orders" ON order_items;
DROP POLICY IF EXISTS "Users can delete order items of their orders" ON order_items;

CREATE POLICY "Users can view company order items"
ON order_items FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.id = order_items.order_id 
  AND orders.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can create company order items"
ON order_items FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.id = order_items.order_id 
  AND orders.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can update company order items"
ON order_items FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.id = order_items.order_id 
  AND orders.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can delete company order items"
ON order_items FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.id = order_items.order_id 
  AND orders.company_id = get_user_company_id(auth.uid())
));