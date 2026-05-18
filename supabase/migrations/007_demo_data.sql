-- ============================================================================
-- DEMO DATA FOR TESTING
-- ============================================================================
-- This migration inserts sample data for testing the admin dashboard

-- Insert demo products
INSERT INTO public.products (name, description, category, price, stock, sold_count, image_url, status) VALUES
('Ethiopian Traditional Dress', 'Beautiful traditional Ethiopian dress made from high-quality fabric with intricate embroidery', 'Women', 2500.00, 15, 8, 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400', 'active'),
('Modern Habesha Kemis', 'Contemporary style Habesha Kemis with modern design elements', 'Women', 1800.00, 20, 12, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400', 'active'),
('Men''s Ethiopian Suit', 'Elegant Ethiopian suit for special occasions', 'Men', 3000.00, 10, 5, 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400', 'active'),
('Kids Traditional Outfit', 'Colorful traditional outfit for children', 'Kids', 800.00, 25, 15, 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400', 'active'),
('Ethiopian Scarf', 'Handwoven Ethiopian scarf with traditional patterns', 'Accessories', 350.00, 50, 30, 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400', 'active'),
('Embroidered Shawl', 'Beautiful embroidered shawl perfect for any occasion', 'Women', 1200.00, 12, 7, 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400', 'active'),
('Traditional Shoes', 'Handcrafted Ethiopian leather shoes', 'Men', 600.00, 30, 20, 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400', 'active'),
('Kids Casual Wear', 'Comfortable casual wear for everyday use', 'Kids', 450.00, 40, 25, 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400', 'active'),
('Ethiopian Jewelry Set', 'Traditional jewelry set including necklace and earrings', 'Accessories', 1500.00, 8, 4, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', 'active'),
('Modern Dress', 'Stylish modern dress with Ethiopian-inspired design', 'Women', 2200.00, 18, 10, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400', 'active')
ON CONFLICT DO NOTHING;

-- Note: Demo orders require existing users, so they should be created after user registration
-- You can create demo orders manually through the admin interface after setting up admin users

-- ============================================================================
-- INSTRUCTIONS FOR SETTING UP ADMIN USER
-- ============================================================================
-- 1. Register a new user through the frontend
-- 2. Run the following SQL in Supabase SQL Editor to promote them to admin:

-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE username = 'your_admin_username';

-- Or use the promote_to_admin function:
-- SELECT public.promote_to_admin('user_uuid_here');

-- ============================================================================
-- END
-- ============================================================================
