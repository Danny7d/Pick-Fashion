-- ============================================================================
-- Pick Fashion - Demo Data for Testing
-- Includes sample products, customers, and orders for development/testing
-- ============================================================================

-- Ensure extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. INITIALIZE ADMIN_SETTINGS IF NOT EXISTS
-- ============================================================================
INSERT INTO public.admin_settings (
  id, store_name, store_email, store_phone, currency,
  low_stock_threshold, notify_new_orders, notify_low_stock, notify_customer_messages
)
VALUES (
  1, 'Pick Fashion', 'pickfashionzr@gmail.com', '+251912345678', 'ETB',
  3, true, true, true
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. SAMPLE PRODUCTS
-- ============================================================================
-- Clear existing demo products (optional - comment out to keep)
DELETE FROM public.products
WHERE name ILIKE '%women%' OR name ILIKE '%men%' OR name ILIKE '%kids%'
  OR category IN ('Women', 'Men', 'Kids');

-- Insert sample products
INSERT INTO public.products (name, description, category, price, stock, status)
VALUES
  -- Women's collection
  ('Classic Denim Jacket', 'Timeless blue denim jacket with perfect fit', 'Women', 1200, 15, 'active'),
  ('Elegant Black Blazer', 'Professional blazer for office and formal events', 'Women', 1800, 8, 'active'),
  ('Summer Floral Dress', 'Lightweight floral print dress perfect for summer', 'Women', 950, 22, 'active'),
  ('White Linen Pants', 'Breathable linen pants for casual wear', 'Women', 850, 3, 'active'),
  ('Leather Ankle Boots', 'Premium leather ankle boots with comfortable sole', 'Women', 2100, 0, 'sold_out'),
  
  -- Men's collection
  ('Premium Cotton Shirt', 'High-quality cotton shirt in multiple colors', 'Men', 750, 25, 'active'),
  ('Casual Cargo Pants', 'Practical cargo pants with multiple pockets', 'Men', 980, 18, 'active'),
  ('Athletic Performance T-shirt', 'Moisture-wicking sports t-shirt', 'Men', 550, 30, 'active'),
  ('Wool Sweater', 'Warm wool sweater for winter', 'Men', 1400, 5, 'active'),
  ('Leather Belt', 'Classic leather belt with metal buckle', 'Men', 650, 20, 'active'),
  
  -- Kids' collection
  ('Colorful Kids Hoodie', 'Warm and cozy hoodie for children', 'Kids', 700, 16, 'active'),
  ('Kids Jeans', 'Durable jeans designed for active kids', 'Kids', 600, 24, 'active'),
  ('Graphic T-shirt for Kids', 'Fun graphic print t-shirt in various designs', 'Kids', 400, 35, 'active'),
  ('Kids Winter Jacket', 'Insulated winter jacket for kids', 'Kids', 1100, 2, 'active'),
  ('Colorful Socks Pack', 'Pack of 5 pairs of colorful socks', 'Kids', 300, 0, 'sold_out')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. DEMO ORDERS (only if you have test users)
-- ============================================================================
-- This section requires actual user IDs from auth.users
-- You should manually add orders or use this as a template

-- Example: Assuming you have test user IDs, you can uncomment and modify:
-- INSERT INTO public.orders (user_id, product_name, quantity, unit_price, total_amount, phone_number, telegram_handle, status, created_at)
-- VALUES
--   ('00000000-0000-0000-0000-000000000001'::uuid, 'Classic Denim Jacket', 1, 1200, 1200, '+251912345678', '@testuser1', 'pending_manual', now() - interval '2 days'),
--   ('00000000-0000-0000-0000-000000000002'::uuid, 'Summer Floral Dress', 2, 950, 1900, '+251912345679', '@testuser2', 'confirmed', now() - interval '1 day'),
--   ('00000000-0000-0000-0000-000000000001'::uuid, 'Premium Cotton Shirt', 3, 750, 2250, '+251912345678', '@testuser1', 'delivered', now() - interval '5 days')
-- ON CONFLICT DO NOTHING;

-- Note: To properly test orders, you need to:
-- 1. Create test users through the authentication UI
-- 2. Get their user IDs from auth.users
-- 3. Insert orders with those actual user IDs

-- ============================================================================
-- 4. VERIFY DATA
-- ============================================================================
-- Run these queries to verify the demo data was inserted:
-- SELECT COUNT(*) as product_count FROM public.products;
-- SELECT COUNT(*) as order_count FROM public.orders;
-- SELECT * FROM public.admin_dashboard_summary();
