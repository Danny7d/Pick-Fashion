-- ============================================================================
-- UPDATE ORDERS TABLE TO REFERENCE PRODUCTS TABLE
-- ============================================================================
-- This migration updates the orders table to properly reference the products table
-- and adds admin-specific RLS policies

-- Add product_id column as a foreign key to products table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

-- Create index on product_id for performance
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders(product_id);

-- Migrate existing orders: try to match product_id from product_name
-- This is a one-time migration for existing data
DO $$
BEGIN
  -- Update orders that have a product_name but no product_id
  UPDATE public.orders o
  SET product_id = p.id
  FROM public.products p
  WHERE o.product_id IS NULL
    AND o.product_name = p.name;
END $$;

-- ============================================================================
-- UPDATE RLS POLICIES FOR ORDERS TO ALLOW ADMIN ACCESS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update_own" ON public.orders;

-- Customers can view only their own orders
CREATE POLICY "Customers can view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Customers can insert only their own orders
CREATE POLICY "Customers can insert own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins can insert orders (for manual order creation)
CREATE POLICY "Admins can insert orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Customers can update only their own orders (limited fields)
CREATE POLICY "Customers can update own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND status IN ('pending_manual', 'cancelled')
);

-- Admins can update any order
CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Admins can delete orders
CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================================
-- TRIGGER: Update product stock and sold_count when order is delivered
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_order_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If order status changes to delivered
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Decrease stock and increase sold_count
    IF NEW.product_id IS NOT NULL THEN
      PERFORM public.decrease_stock(NEW.product_id, NEW.quantity);
    END IF;
  END IF;
  
  -- If order status changes from delivered to something else (e.g., cancelled)
  IF OLD.status = 'delivered' AND NEW.status != 'delivered' THEN
    -- Increase stock back and decrease sold_count
    IF NEW.product_id IS NOT NULL THEN
      PERFORM public.increase_stock(NEW.product_id, NEW.quantity);
      UPDATE public.products
      SET sold_count = sold_count - NEW.quantity
      WHERE id = NEW.product_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_delivery_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.handle_order_delivery();

-- ============================================================================
-- HELPER FUNCTIONS FOR ORDER MANAGEMENT
-- ============================================================================

-- Function to get order statistics
CREATE OR REPLACE FUNCTION public.get_order_stats()
RETURNS TABLE (
  total_orders bigint,
  pending_orders bigint,
  confirmed_orders bigint,
  delivered_orders bigint,
  cancelled_orders bigint,
  total_revenue numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::bigint as total_orders,
    COUNT(*) FILTER (WHERE status = 'pending_manual')::bigint as pending_orders,
    COUNT(*) FILTER (WHERE status = 'confirmed')::bigint as confirmed_orders,
    COUNT(*) FILTER (WHERE status = 'delivered')::bigint as delivered_orders,
    COUNT(*) FILTER (WHERE status = 'cancelled')::bigint as cancelled_orders,
    COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered'), 0) as total_revenue
  FROM public.orders;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_stats() TO authenticated;

-- Function to get customer order history
CREATE OR REPLACE FUNCTION public.get_customer_orders(customer_id uuid)
RETURNS SETOF public.orders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders
  WHERE user_id = customer_id
  ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_orders(uuid) TO authenticated;

-- Function to get recent orders (admin only)
CREATE OR REPLACE FUNCTION public.get_recent_orders(limit_count integer DEFAULT 50)
RETURNS SETOF public.orders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders
  ORDER BY created_at DESC
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION public.get_recent_orders(integer) TO authenticated;
