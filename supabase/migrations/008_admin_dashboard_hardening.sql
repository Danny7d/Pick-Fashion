-- ============================================================================
-- Pick Fashion admin hardening
-- - normalizes legacy orders.product_id
-- - adds admin settings
-- - adds admin summary RPCs
-- - hardens RLS and order status transitions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure profiles has role support for admin/customer separation.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'customer'
CHECK (role IN ('customer', 'admin'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Normalize the original text product_id column into legacy_product_id, then
-- keep a proper UUID foreign key for live inventory tracking.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'product_id'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.orders RENAME COLUMN product_id TO legacy_product_id;
  END IF;
END $$;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS legacy_product_id text;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders(product_id);

UPDATE public.orders o
SET legacy_product_id = COALESCE(o.legacy_product_id, o.product_name)
WHERE o.legacy_product_id IS NULL;

UPDATE public.orders o
SET product_id = p.id
FROM public.products p
WHERE o.product_id IS NULL
  AND (
    o.product_name = p.name
    OR o.legacy_product_id = p.id::text
  );

-- Keep product status in sync with stock on inserts and updates.
CREATE OR REPLACE FUNCTION public.sync_product_status_from_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.stock := GREATEST(COALESCE(NEW.stock, 0), 0);

  IF NEW.stock = 0 THEN
    NEW.status := 'sold_out';
  ELSIF NEW.status = 'sold_out' THEN
    NEW.status := 'active';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_stock_status_trigger ON public.products;
CREATE TRIGGER products_stock_status_trigger
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.sync_product_status_from_stock();

-- Products RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can read active products" ON public.products;
DROP POLICY IF EXISTS "Anonymous can read active products" ON public.products;
DROP POLICY IF EXISTS "Admins can read all products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

CREATE POLICY "products_read_active_anon"
ON public.products
FOR SELECT
TO anon
USING (status = 'active' AND stock > 0);

CREATE POLICY "products_read_active_authenticated"
ON public.products
FOR SELECT
TO authenticated
USING (status = 'active' AND stock > 0);

CREATE POLICY "products_read_admin"
ON public.products
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "products_insert_admin"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "products_update_admin"
ON public.products
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "products_delete_admin"
ON public.products
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Orders RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update_own" ON public.orders;
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

CREATE POLICY "orders_select_customer"
ON public.orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "orders_select_admin"
ON public.orders
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "orders_insert_customer"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_insert_admin"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "orders_update_customer_pending"
ON public.orders
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending_manual')
WITH CHECK (user_id = auth.uid() AND status = 'pending_manual');

CREATE POLICY "orders_update_admin"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "orders_delete_admin"
ON public.orders
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_admin"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Inventory adjustment helper
CREATE OR REPLACE FUNCTION public.decrease_stock(product_uuid uuid, order_quantity integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock = stock - order_quantity,
      sold_count = sold_count + order_quantity
  WHERE id = product_uuid
    AND stock >= order_quantity;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrease_stock(uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.restore_stock(product_uuid uuid, order_quantity integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock = stock + order_quantity,
      sold_count = GREATEST(sold_count - order_quantity, 0)
  WHERE id = product_uuid;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_stock(uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_order_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'delivered' AND OLD.status <> 'delivered' AND NEW.product_id IS NOT NULL THEN
    IF NOT public.decrease_stock(NEW.product_id, NEW.quantity) THEN
      RAISE EXCEPTION 'Insufficient stock to deliver this order';
    END IF;
  END IF;

  IF OLD.status = 'delivered' AND NEW.status <> 'delivered' AND NEW.product_id IS NOT NULL THEN
    PERFORM public.restore_stock(NEW.product_id, NEW.quantity);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_delivery_trigger ON public.orders;
CREATE TRIGGER orders_delivery_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.handle_order_delivery();

-- Customer self-cancel helper
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET status = 'cancelled'
  WHERE id = p_order_id
    AND user_id = auth.uid()
    AND status = 'pending_manual';

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_order(uuid) TO authenticated;

-- Admin order transitions
CREATE OR REPLACE FUNCTION public.admin_update_order_status(p_order_id uuid, p_status text)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_order public.orders;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can update order status';
  END IF;

  SELECT * INTO current_order
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF p_status NOT IN ('pending_manual', 'confirmed', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid order status';
  END IF;

  IF current_order.status = 'pending_manual' AND p_status NOT IN ('confirmed', 'cancelled') THEN
    RAISE EXCEPTION 'Pending orders can only be confirmed or cancelled';
  END IF;

  IF current_order.status = 'confirmed' AND p_status NOT IN ('delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Confirmed orders can only be delivered or cancelled';
  END IF;

  IF current_order.status IN ('delivered', 'cancelled') AND p_status <> current_order.status THEN
    RAISE EXCEPTION 'Delivered or cancelled orders are locked';
  END IF;

  UPDATE public.orders
  SET status = p_status
  WHERE id = p_order_id
  RETURNING * INTO current_order;

  RETURN current_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid, text) TO authenticated;

-- Admin settings
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name text NOT NULL DEFAULT 'Pick Fashion',
  store_email text NOT NULL DEFAULT 'pickfashionzr@gmail.com',
  store_phone text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'ETB',
  low_stock_threshold integer NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0),
  notify_new_orders boolean NOT NULL DEFAULT true,
  notify_low_stock boolean NOT NULL DEFAULT true,
  notify_customer_messages boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.admin_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_settings_read_admin" ON public.admin_settings;
DROP POLICY IF EXISTS "admin_settings_write_admin" ON public.admin_settings;

CREATE POLICY "admin_settings_read_admin"
ON public.admin_settings
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "admin_settings_write_admin"
ON public.admin_settings
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS admin_settings_updated_at ON public.admin_settings;
CREATE TRIGGER admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Admin RPCs for frontend summaries
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
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can read dashboard summary';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.products)::bigint,
    (SELECT COUNT(*) FROM public.products WHERE status = 'active')::bigint,
    (SELECT COUNT(*) FROM public.orders WHERE status = 'pending_manual')::bigint,
    (SELECT COUNT(*) FROM public.orders WHERE status = 'delivered')::bigint,
    COALESCE((SELECT SUM(total_amount) FROM public.orders WHERE status = 'delivered'), 0),
    COALESCE((SELECT SUM(sold_count) FROM public.products), 0)::bigint,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'customer')::bigint,
    (SELECT COUNT(*) FROM public.products WHERE stock <= (SELECT low_stock_threshold FROM public.admin_settings WHERE id = 1))::bigint;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_dashboard_summary() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_order_summaries()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  customer_name text,
  customer_email text,
  phone_number text,
  telegram_handle text,
  product_id uuid,
  product_name text,
  quantity integer,
  unit_price numeric,
  total_amount numeric,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can read order summaries';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.user_id,
    p.username,
    au.email::text,
    o.phone_number,
    o.telegram_handle,
    o.product_id,
    o.product_name,
    o.quantity,
    o.unit_price,
    o.total_amount,
    o.status,
    o.created_at
  FROM public.orders o
  LEFT JOIN public.profiles p ON p.id = o.user_id
  LEFT JOIN auth.users au ON au.id = o.user_id
  ORDER BY o.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_order_summaries() TO authenticated;

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
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can read customer summaries';
  END IF;

  RETURN QUERY
  SELECT
    p.id AS customer_id,
    p.username,
    au.email::text,
    latest_order.phone_number,
    latest_order.telegram_handle,
    COALESCE(order_totals.orders_count, 0)::bigint,
    COALESCE(order_totals.total_purchases, 0),
    order_totals.last_order_date,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.id
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

-- Optional bootstrap for the owner account once the auth user exists.
UPDATE public.profiles AS p
SET role = 'admin'
FROM auth.users AS au
WHERE au.id = p.id
  AND lower(au.email::text) = lower('danny0988lewis@gmail.com');
