-- ============================================================================
-- CREATE PRODUCTS TABLE
-- ============================================================================
-- This migration creates the products table with full schema for inventory management

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sold_count integer NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
  image_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'sold_out')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.products IS 'Product catalog for Pick Fashion e-commerce';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Auto-update updated_at trigger
CREATE TRIGGER products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TRIGGER: Auto-set status to sold_out when stock reaches 0
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_product_status_on_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.stock = 0 AND OLD.stock > 0 THEN
    NEW.status := 'sold_out';
  ELSIF NEW.stock > 0 AND NEW.status = 'sold_out' THEN
    NEW.status := 'active';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_stock_status_trigger
BEFORE UPDATE ON public.products
FOR EACH ROW
WHEN (OLD.stock IS DISTINCT FROM NEW.stock)
EXECUTE FUNCTION public.update_product_status_on_stock();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Customers can only read active products
CREATE POLICY "Customers can read active products"
ON public.products
FOR SELECT
TO authenticated
USING (status = 'active');

-- Anonymous users can read active products (for browsing without login)
CREATE POLICY "Anonymous can read active products"
ON public.products
FOR SELECT
TO anon
USING (status = 'active');

-- Admins can read all products
CREATE POLICY "Admins can read all products"
ON public.products
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can insert products
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Admins can update products
CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Admins can delete products
CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================================
-- HELPER FUNCTIONS FOR INVENTORY MANAGEMENT
-- ============================================================================

-- Function to decrease stock when order is delivered
CREATE OR REPLACE FUNCTION public.decrease_stock(product_id uuid, quantity integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock = stock - quantity,
      sold_count = sold_count + quantity
  WHERE id = product_id AND stock >= quantity;
  
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrease_stock(uuid, integer) TO authenticated;

-- Function to increase stock (for returns or restocking)
CREATE OR REPLACE FUNCTION public.increase_stock(product_id uuid, quantity integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock = stock + quantity
  WHERE id = product_id;
  
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increase_stock(uuid, integer) TO authenticated;

-- Function to get product stats
CREATE OR REPLACE FUNCTION public.get_product_stats()
RETURNS TABLE (
  total_products bigint,
  active_products bigint,
  hidden_products bigint,
  sold_out_products bigint,
  total_stock bigint,
  total_sold bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::bigint as total_products,
    COUNT(*) FILTER (WHERE status = 'active')::bigint as active_products,
    COUNT(*) FILTER (WHERE status = 'hidden')::bigint as hidden_products,
    COUNT(*) FILTER (WHERE status = 'sold_out')::bigint as sold_out_products,
    COALESCE(SUM(stock), 0)::bigint as total_stock,
    COALESCE(SUM(sold_count), 0)::bigint as total_sold
  FROM public.products;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_stats() TO authenticated;

-- Function to get products by category
CREATE OR REPLACE FUNCTION public.get_products_by_category(category_name text)
RETURNS SETOF public.products
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.products
  WHERE category = category_name AND status = 'active'
  ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_products_by_category(text) TO authenticated, anon;
