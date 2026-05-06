-- ============================================================================
-- SIMPLE E-COMMERCE (TELEGRAM CHECKOUT) SCHEMA
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  product_id text NOT NULL,
  product_name text NOT NULL,
  product_image text,

  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  total_amount numeric(10,2) NOT NULL CHECK (total_amount >= 0),

  phone_number text NOT NULL,
  telegram_handle text NOT NULL,

  status text NOT NULL DEFAULT 'pending_manual'
    CHECK (status IN ('pending_manual', 'confirmed', 'delivered', 'cancelled')),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.orders IS 'Manual orders handled via Telegram';

-- ============================================================================
-- INDEXES (performance)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ============================================================================
-- AUTO UPDATE TIMESTAMP
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (VERY IMPORTANT)
-- ============================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can view only their own orders
CREATE POLICY "orders_select_own"
ON public.orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert only their own orders
CREATE POLICY "orders_insert_own"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update ONLY their own orders (optional, you can remove later)
CREATE POLICY "orders_update_own"
ON public.orders
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- OPTIONAL: HELPER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_my_orders()
RETURNS SETOF public.orders
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.orders
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_orders() TO authenticated;

-- ============================================================================
-- END
-- ============================================================================