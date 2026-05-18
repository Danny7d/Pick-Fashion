-- ============================================================================
-- Pick Fashion - Full Admin Dashboard Supabase Setup
-- Paste this entire file into Supabase Dashboard > SQL Editor > Run.
-- Safe to run more than once. It does not rebuild Supabase auth.
-- Admin owner email promoted by this script: danny0988lewis@gmail.com
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Shared timestamp trigger helper
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Profiles and roles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  role text NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'admin'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key
    ON public.profiles (lower(trim(username)));
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not create unique username index: %', SQLERRM;
END $$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  requested_username text;
BEGIN
  requested_username := nullif(trim(NEW.raw_user_meta_data->>'username'), '');

  IF requested_username IS NULL THEN
    requested_username :=
      split_part(COALESCE(NEW.email::text, 'customer'), '@', 1)
      || '-'
      || left(NEW.id::text, 8);
  END IF;

  INSERT INTO public.profiles (id, username, role)
  VALUES (NEW.id, requested_username, 'customer')
  ON CONFLICT (id) DO UPDATE
  SET username = COALESCE(public.profiles.username, EXCLUDED.username),
      role = COALESCE(public.profiles.role, 'customer');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

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
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_username_available(request_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF request_username IS NULL OR length(trim(request_username)) = 0 THEN
    RETURN false;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE lower(trim(username)) = lower(trim(request_username))
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_email_for_username(login_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
  found_email text;
BEGIN
  SELECT au.email::text
  INTO found_email
  FROM auth.users au
  INNER JOIN public.profiles p ON p.id = au.id
  WHERE lower(trim(p.username)) = lower(trim(login_username))
  LIMIT 1;

  RETURN found_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_for_username(text) TO anon, authenticated;

-- Backfill profiles for existing auth users.
INSERT INTO public.profiles (id, username, role, created_at)
SELECT
  au.id,
  COALESCE(
    nullif(trim(au.raw_user_meta_data->>'username'), ''),
    split_part(au.email::text, '@', 1) || '-' || left(au.id::text, 8)
  ) AS username,
  'customer',
  COALESCE(au.created_at, now())
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- Promote the owner account. Register with this email first if no row is updated.
UPDATE public.profiles p
SET role = 'admin'
FROM auth.users au
WHERE au.id = p.id
  AND lower(au.email::text) = lower('danny0988lewis@gmail.com');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM auth.users au
    INNER JOIN public.profiles p ON p.id = au.id
    WHERE lower(au.email::text) = lower('danny0988lewis@gmail.com')
      AND p.role = 'admin'
  ) THEN
    RAISE NOTICE 'Admin email not found yet. Register/login once with danny0988lewis@gmail.com, then run this SQL again.';
  END IF;
END $$;

-- ============================================================================
-- Products
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sold_count integer NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
  image_url text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS price numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sold_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  ALTER TABLE public.products
    ADD CONSTRAINT products_status_check CHECK (status IN ('active', 'hidden', 'sold_out'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

CREATE OR REPLACE FUNCTION public.sync_product_status_from_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.stock := GREATEST(COALESCE(NEW.stock, 0), 0);
  NEW.sold_count := GREATEST(COALESCE(NEW.sold_count, 0), 0);

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

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- Orders
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  legacy_product_id text,
  product_name text,
  product_image text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total_amount numeric(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  phone_number text,
  telegram_handle text,
  chat_id bigint,
  status text NOT NULL DEFAULT 'pending_manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- If an older setup had orders.product_id as text, preserve it and create a UUID FK.
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
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS legacy_product_id text,
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS product_image text,
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS unit_price numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS telegram_handle text,
  ADD COLUMN IF NOT EXISTS chat_id bigint,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending_manual',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN legacy_product_id DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN product_name DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN phone_number DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN telegram_handle DROP NOT NULL;

DO $$
BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_status_check CHECK (status IN ('pending_manual', 'confirmed', 'delivered', 'cancelled'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_telegram_handle ON public.orders(telegram_handle);

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

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

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

-- ============================================================================
-- Admin settings
-- ============================================================================
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

INSERT INTO public.admin_settings (id, store_name, store_email, store_phone, currency)
VALUES (1, 'Pick Fashion', 'pickfashionzr@gmail.com', '', 'ETB')
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS admin_settings_updated_at ON public.admin_settings;
CREATE TRIGGER admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- Admin RPCs used by the React dashboard
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
SET search_path = public, auth
STABLE
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can read order summaries';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.user_id,
    p.username AS customer_name,
    au.email::text AS customer_email,
    o.phone_number,
    o.telegram_handle,
    o.product_id,
    COALESCE(o.product_name, pr.name) AS product_name,
    COALESCE(o.product_image, pr.image_url) AS product_image,
    o.quantity,
    COALESCE(o.unit_price, pr.price) AS unit_price,
    o.total_amount,
    o.status,
    o.created_at,
    o.updated_at
  FROM public.orders o
  LEFT JOIN public.profiles p ON p.id = o.user_id
  LEFT JOIN auth.users au ON au.id = o.user_id
  LEFT JOIN public.products pr ON pr.id = o.product_id
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
STABLE
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
  current_order public.orders;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN QUERY SELECT false, 'Only admins can update order status'::text;
    RETURN;
  END IF;

  IF p_status NOT IN ('pending_manual', 'confirmed', 'delivered', 'cancelled') THEN
    RETURN QUERY SELECT false, 'Invalid order status'::text;
    RETURN;
  END IF;

  SELECT * INTO current_order
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Order not found'::text;
    RETURN;
  END IF;

  IF current_order.status = 'pending_manual' AND p_status NOT IN ('confirmed', 'cancelled') THEN
    RETURN QUERY SELECT false, 'Pending orders can only be confirmed or cancelled'::text;
    RETURN;
  END IF;

  IF current_order.status = 'confirmed' AND p_status NOT IN ('delivered', 'cancelled') THEN
    RETURN QUERY SELECT false, 'Confirmed orders can only be delivered or cancelled'::text;
    RETURN;
  END IF;

  IF current_order.status IN ('delivered', 'cancelled') AND p_status <> current_order.status THEN
    RETURN QUERY SELECT false, 'Delivered or cancelled orders are locked'::text;
    RETURN;
  END IF;

  IF p_status = 'delivered'
     AND current_order.status <> 'delivered'
     AND current_order.product_id IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM public.products
       WHERE id = current_order.product_id
         AND stock < current_order.quantity
     ) THEN
    RETURN QUERY SELECT false, 'Insufficient stock'::text;
    RETURN;
  END IF;

  UPDATE public.orders
  SET status = p_status
  WHERE id = p_order_id;

  RETURN QUERY SELECT true, 'Order status updated successfully'::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid, text) TO authenticated;

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_customer" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles select own" ON public.profiles;
DROP POLICY IF EXISTS "profiles update own" ON public.profiles;

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

CREATE POLICY "profiles_update_own_customer"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = 'customer');

CREATE POLICY "profiles_update_admin"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_read_active_anon" ON public.products;
DROP POLICY IF EXISTS "products_read_active_authenticated" ON public.products;
DROP POLICY IF EXISTS "products_read_admin" ON public.products;
DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
DROP POLICY IF EXISTS "products_update_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
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

DROP POLICY IF EXISTS "orders_select_customer" ON public.orders;
DROP POLICY IF EXISTS "orders_select_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_customer" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_update_customer_pending" ON public.orders;
DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update_own" ON public.orders;
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can create orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can update their own pending orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update any order" ON public.orders;
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

DROP POLICY IF EXISTS "admin_settings_read_admin" ON public.admin_settings;
DROP POLICY IF EXISTS "admin_settings_write_admin" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can read admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can update admin settings" ON public.admin_settings;

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

-- ============================================================================
-- Product image storage bucket and policies
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;

CREATE POLICY "product_images_public_read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "product_images_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "product_images_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND public.is_admin())
WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "product_images_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND public.is_admin());

-- ============================================================================
-- Lightweight demo products
-- ============================================================================
INSERT INTO public.products (name, description, category, price, stock, image_url, status)
SELECT *
FROM (
  VALUES
    ('Classic Denim Jacket', 'Timeless blue denim jacket with a clean everyday fit.', 'Women', 1200.00, 15, 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=800', 'active'),
    ('Elegant Black Blazer', 'Sharp blazer for office, events, and polished styling.', 'Women', 1800.00, 8, 'https://images.unsplash.com/photo-1548454782-15b189d129ab?w=800', 'active'),
    ('Premium Cotton Shirt', 'Breathable cotton shirt for simple daily dressing.', 'Men', 750.00, 25, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800', 'active'),
    ('Casual Cargo Pants', 'Durable cargo pants with roomy utility pockets.', 'Men', 980.00, 18, 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800', 'active'),
    ('Colorful Kids Hoodie', 'Soft hoodie for children with a bright playful look.', 'Kids', 700.00, 16, 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800', 'active'),
    ('Kids Winter Jacket', 'Warm insulated jacket for cooler days.', 'Kids', 1100.00, 2, 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800', 'active')
) AS demo(name, description, category, price, stock, image_url, status)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.products p
  WHERE lower(p.name) = lower(demo.name)
);

-- ============================================================================
-- Verification queries
-- ============================================================================
SELECT
  au.email,
  p.role,
  p.username
FROM auth.users au
INNER JOIN public.profiles p ON p.id = au.id
WHERE lower(au.email::text) = lower('danny0988lewis@gmail.com');

SELECT
  (SELECT COUNT(*) FROM public.products) AS products_count,
  (SELECT COUNT(*) FROM public.admin_settings) AS admin_settings_count,
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'product-images') AS product_image_buckets;
