-- ============================================================================
-- Pick Fashion - Complete Admin System
-- Comprehensive hardening, RLS, and helper functions for admin dashboard
-- ============================================================================

-- ============================================================================
-- 1. ENSURE ADMIN_SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id integer PRIMARY KEY DEFAULT 1,
  store_name text NOT NULL DEFAULT 'Pick Fashion',
  store_email text NOT NULL DEFAULT 'pickfashionzr@gmail.com',
  store_phone text DEFAULT '',
  currency text NOT NULL DEFAULT 'ETB',
  low_stock_threshold integer NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0),
  notify_new_orders boolean NOT NULL DEFAULT true,
  notify_low_stock boolean NOT NULL DEFAULT true,
  notify_customer_messages boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT only_one_setting CHECK (id = 1)
);

DROP TRIGGER IF EXISTS admin_settings_updated_at ON public.admin_settings;
CREATE TRIGGER admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read and update admin settings
DROP POLICY IF EXISTS "Admins can read admin settings" ON public.admin_settings;
CREATE POLICY "Admins can read admin settings"
ON public.admin_settings
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update admin settings" ON public.admin_settings;
CREATE POLICY "Admins can update admin settings"
ON public.admin_settings
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- 2. ENHANCE RLS FOR ORDERS WITH ADMIN ACCESS
-- ============================================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update_own" ON public.orders;
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can create orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can update their own pending orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update any order" ON public.orders;

-- Customers can view only their own orders
CREATE POLICY "Customers can view their own orders"
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

-- Customers can insert their own orders
CREATE POLICY "Customers can create their own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins can insert orders on behalf of anyone
CREATE POLICY "Admins can create orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Customers can update their own pending orders only
CREATE POLICY "Customers can update their own pending orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending_manual')
WITH CHECK (user_id = auth.uid() AND status = 'pending_manual');

-- Admins can update any order (for status transitions)
CREATE POLICY "Admins can update any order"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- 3. ENHANCE RLS FOR PROFILES
-- ============================================================================
-- Drop existing profile policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Users can always read their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- 4. ADMIN DASHBOARD SUMMARY RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_dashboard_summary()
RETURNS TABLE (
  total_products bigint,
  active_products bigint,
  pending_orders bigint,
  delivered_orders bigint,
  revenue_estimate numeric,
  items_sold bigint,
  customers_count bigint,
  low_stock_products bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can access dashboard summary';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.products) AS total_products,
    (SELECT COUNT(*) FROM public.products WHERE status = 'active') AS active_products,
    (SELECT COUNT(*) FROM public.orders WHERE status = 'pending_manual') AS pending_orders,
    (SELECT COUNT(*) FROM public.orders WHERE status = 'delivered') AS delivered_orders,
    COALESCE(SUM(o.total_amount), 0) AS revenue_estimate,
    COALESCE(SUM(p.sold_count), 0) AS items_sold,
    (SELECT COUNT(DISTINCT id) FROM public.profiles WHERE role = 'customer') AS customers_count,
    (SELECT COUNT(*) FROM public.products WHERE stock <= (SELECT low_stock_threshold FROM public.admin_settings LIMIT 1)) AS low_stock_products
  FROM public.orders o
  LEFT JOIN public.products p ON o.product_id = p.id
  WHERE o.status = 'delivered';
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_dashboard_summary() TO authenticated;

-- ============================================================================
-- 5. ADMIN ORDER SUMMARIES RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_order_summaries()
RETURNS TABLE (
  id uuid,
  customer_name text,
  customer_email text,
  phone_number text,
  telegram_handle text,
  product_name text,
  product_image text,
  quantity integer,
  unit_price numeric,
  total_amount numeric,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can access order summaries';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    p.username AS customer_name,
    u.email AS customer_email,
    o.phone_number,
    o.telegram_handle,
    o.product_name,
    o.product_image,
    o.quantity,
    o.unit_price,
    o.total_amount,
    o.status,
    o.created_at,
    o.updated_at
  FROM public.orders o
  LEFT JOIN public.profiles p ON o.user_id = p.id
  LEFT JOIN auth.users u ON o.user_id = u.id
  ORDER BY o.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_order_summaries() TO authenticated;

-- ============================================================================
-- 6. ADMIN CUSTOMER SUMMARIES RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_customer_summaries()
RETURNS TABLE (
  customer_id uuid,
  username text,
  email text,
  phone_number text,
  telegram_handle text,
  orders_count bigint,
  total_purchases numeric,
  last_order_date timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can access customer summaries';
  END IF;

  RETURN QUERY
  SELECT
    p.id AS customer_id,
    p.username,
    u.email::text,
    latest_order.phone_number,
    latest_order.telegram_handle,
    COALESCE(order_totals.orders_count, 0)::bigint,
    COALESCE(order_totals.total_purchases, 0),
    order_totals.last_order_date,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  LEFT JOIN (
    SELECT
      user_id,
      COUNT(*) FILTER (WHERE status <> 'cancelled') AS orders_count,
      COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered'), 0) AS total_purchases,
      MAX(created_at) AS last_order_date
    FROM public.orders
    GROUP BY user_id
  ) AS order_totals ON order_totals.user_id = p.id
  LEFT JOIN LATERAL (
    SELECT phone_number, telegram_handle
    FROM public.orders o
    WHERE o.user_id = p.id
    ORDER BY o.created_at DESC
    LIMIT 1
  ) AS latest_order ON true
  WHERE p.role = 'customer'
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_customer_summaries() TO authenticated;

-- ============================================================================
-- 7. ADMIN UPDATE ORDER STATUS RPC (with inventory management)
-- ============================================================================
DROP FUNCTION IF EXISTS public.admin_update_order_status(uuid, text);

CREATE OR REPLACE FUNCTION public.admin_update_order_status(
  p_order_id uuid,
  p_status text
)
RETURNS TABLE (
  success boolean,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_record RECORD;
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin() THEN
    RETURN QUERY SELECT false, 'Only admins can update order status'::text;
    RETURN;
  END IF;

  -- Validate new status
  IF p_status NOT IN ('pending_manual', 'confirmed', 'delivered', 'cancelled') THEN
    RETURN QUERY SELECT false, 'Invalid status'::text;
    RETURN;
  END IF;

  -- Get current order
  SELECT * INTO v_order_record
  FROM public.orders
  WHERE id = p_order_id;

  IF v_order_record IS NULL THEN
    RETURN QUERY SELECT false, 'Order not found'::text;
    RETURN;
  END IF;

  -- Prevent invalid transitions
  IF v_order_record.status = 'pending_manual' AND p_status NOT IN ('confirmed', 'cancelled') THEN
    RETURN QUERY SELECT false, 'Pending orders can only be confirmed or cancelled'::text;
    RETURN;
  END IF;

  IF v_order_record.status = 'confirmed' AND p_status NOT IN ('delivered', 'cancelled') THEN
    RETURN QUERY SELECT false, 'Confirmed orders can only be delivered or cancelled'::text;
    RETURN;
  END IF;

  IF v_order_record.status IN ('delivered', 'cancelled') AND p_status <> v_order_record.status THEN
    RETURN QUERY SELECT false, 'Delivered or cancelled orders are locked'::text;
    RETURN;
  END IF;

  -- Inventory is adjusted by orders_delivery_trigger from migration 008.
  UPDATE public.orders
  SET status = p_status, updated_at = now()
  WHERE id = p_order_id;

  RETURN QUERY SELECT true, 'Order status updated successfully'::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid, text) TO authenticated;

-- ============================================================================
-- 8. HELPER: Get products with low stock
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_low_stock_products()
RETURNS TABLE (
  id uuid,
  name text,
  stock integer,
  threshold integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can access this function';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.stock,
    (SELECT low_stock_threshold FROM public.admin_settings LIMIT 1)::integer AS threshold
  FROM public.products p
  WHERE p.stock <= (SELECT low_stock_threshold FROM public.admin_settings LIMIT 1)
  ORDER BY p.stock ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_low_stock_products() TO authenticated;

-- ============================================================================
-- 9. HELPER: Get product sales statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_product_stats()
RETURNS TABLE (
  id uuid,
  name text,
  category text,
  sold_count bigint,
  revenue numeric,
  stock integer,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can access this function';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.category,
    p.sold_count::bigint,
    (p.sold_count * p.price)::numeric AS revenue,
    p.stock,
    p.status
  FROM public.products p
  ORDER BY p.sold_count DESC, p.name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_stats() TO authenticated;

-- ============================================================================
-- 10. HELPER: Get order revenue by period
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_order_revenue_summary()
RETURNS TABLE (
  total_delivered numeric,
  total_pending numeric,
  total_cancelled numeric,
  average_order_value numeric,
  order_count bigint,
  delivered_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can access this function';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END), 0) AS total_delivered,
    COALESCE(SUM(CASE WHEN status = 'pending_manual' THEN total_amount ELSE 0 END), 0) AS total_pending,
    COALESCE(SUM(CASE WHEN status = 'cancelled' THEN total_amount ELSE 0 END), 0) AS total_cancelled,
    COALESCE(AVG(CASE WHEN status = 'delivered' THEN total_amount ELSE NULL END), 0) AS average_order_value,
    COUNT(*)::bigint AS order_count,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END)::bigint AS delivered_count
  FROM public.orders;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_revenue_summary() TO authenticated;
