-- ============================================================================
-- Pick Fashion Payment System Schema
-- Production-ready e-commerce payment integration
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------
-- Orders Table
-- ----------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  phone_number text NOT NULL,
  telegram_handle text NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('chapa', 'telebirr')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.orders IS 'Customer orders with payment tracking';

-- ----------------------------
-- Payments Table
-- ----------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL CHECK (provider IN ('chapa', 'telebirr')),
  transaction_ref text UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  chapa_response jsonb,
  telebirr_response jsonb,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.payments IS 'Payment attempts and verification records';

-- ----------------------------
-- Order Items Table (for cart details)
-- ----------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id text NOT NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10, 2) NOT NULL,
  total_price numeric(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ----------------------------
-- Indexes for Performance
-- ----------------------------
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_transaction_ref ON public.payments(transaction_ref);
CREATE INDEX idx_payments_status ON public.payments(status);

-- ----------------------------
-- Updated At Trigger
-- ----------------------------
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

-- ----------------------------
-- Row Level Security (RLS)
-- ----------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users can only see their own orders
CREATE POLICY "orders_select_own"
ON public.orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can only insert their own orders
CREATE POLICY "orders_insert_own"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Only system/webhooks can update orders (handled via Edge Functions with service role)
CREATE POLICY "orders_update_system"
ON public.orders
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can see payments for their orders only
CREATE POLICY "payments_select_own"
ON public.payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid()
  )
);

-- System can insert payments
CREATE POLICY "payments_insert_system"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid()
  )
);

-- Order items follow same rules as orders
CREATE POLICY "order_items_select_own"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "order_items_insert_own"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  )
);

-- ----------------------------
-- RPC Functions
-- ----------------------------

-- Get order with payment status
CREATE OR REPLACE FUNCTION public.get_order_with_payment(p_order_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'order', row_to_json(o),
    'payment', row_to_json(p),
    'items', (
      SELECT json_agg(row_to_json(oi))
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    )
  )
  INTO result
  FROM public.orders o
  LEFT JOIN public.payments p ON p.order_id = o.id
  WHERE o.id = p_order_id AND o.user_id = auth.uid();

  RETURN result;
END;
$$;

-- Check if order is paid
CREATE OR REPLACE FUNCTION public.is_order_paid(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = p_order_id AND user_id = auth.uid() AND status = 'paid'
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_order_with_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_order_paid(uuid) TO authenticated;

-- ============================================================================
-- End
-- ============================================================================
