#!/usr/bin/env bash

# =============================================================================
# DEPLOYMENT STEPS FOR ADMIN DASHBOARD SYSTEM
# =============================================================================
# This script provides the step-by-step instructions to deploy the admin
# dashboard. Run each section in order or execute as a complete script.
# =============================================================================

echo "=========================================="
echo "PICK FASHION ADMIN DASHBOARD SETUP"
echo "=========================================="
echo ""

# Step 1: Apply Migrations
echo "STEP 1: Applying Supabase migrations..."
echo "- Go to Supabase Dashboard → SQL Editor"
echo "- Copy and paste the contents of:"
echo "  - supabase/migrations/009_complete_admin_system.sql"
echo "  - supabase/migrations/010_demo_data.sql"
echo "- Click 'Run'"
echo "- Wait for completion"
echo ""

# Step 2: Verify Setup
echo "STEP 2: Verify migrations..."
echo "- Run this query in SQL Editor to verify tables exist:"
echo ""
echo "SELECT table_name FROM information_schema.tables"
echo "WHERE table_schema = 'public'"
echo "ORDER BY table_name;"
echo ""
echo "Expected tables:"
echo "  ✓ admin_settings"
echo "  ✓ products"
echo "  ✓ profiles"
echo "  ✓ orders"
echo ""

# Step 3: Check Functions
echo "STEP 3: Verify RLS policies and functions..."
echo "- In SQL Editor, run:"
echo ""
echo "SELECT p.polname, p.polcmd"
echo "FROM pg_policies p"
echo "WHERE p.tablename IN ('products', 'orders', 'profiles', 'admin_settings')"
echo "ORDER BY p.tablename, p.polname;"
echo ""

# Step 4: Enable Storage for Images
echo "STEP 4: Setup Supabase Storage for product images..."
echo "- Go to Supabase Dashboard → Storage"
echo "- Create a new bucket named 'product-images'"
echo "- Set it to PUBLIC"
echo "- Go to 'Policies' tab"
echo "- Add policy: Authenticated users can upload"
echo ""

# Step 5: Create Admin User
echo "STEP 5: Promote user to admin..."
echo "- Create a test user account through the app"
echo "- Go to Supabase → SQL Editor"
echo "- Run this query (replace with actual user ID from auth.users):"
echo ""
echo "UPDATE public.profiles"
echo "SET role = 'admin'"
echo "WHERE id = '<YOUR_USER_ID_HERE>';"
echo ""

# Step 6: Frontend Setup
echo "STEP 6: Frontend is ready!"
echo "- Admin routes are already implemented:"
echo "  - /admin (Dashboard)"
echo "  - /admin/products"
echo "  - /admin/orders"
echo "  - /admin/customers"
echo "  - /admin/analytics"
echo "  - /admin/settings"
echo ""

# Step 7: Test
echo "STEP 7: Testing..."
echo "- Navigate to http://localhost:5173/admin"
echo "- You should see the admin dashboard"
echo "- If redirected to home, user is not an admin"
echo ""

echo "=========================================="
echo "SETUP COMPLETE! Ready to use admin dashboard"
echo "=========================================="
