# Pick Fashion Admin Dashboard - Complete Implementation Guide

## 🎯 Overview

The admin dashboard system extends the Pick Fashion e-commerce platform with a complete owner/admin area. This guide covers the architecture, setup, usage, and customization.

**Status:** ✅ Production-ready
**Features:** Role-based access, product management, order processing, customer analytics, inventory tracking

---

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Setup Instructions](#setup-instructions)
3. [Database Schema](#database-schema)
4. [Security & RLS](#security--rls)
5. [API Reference](#api-reference)
6. [Component Guide](#component-guide)
7. [Customization](#customization)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + React Router 7 |
| Auth | Supabase Auth |
| Database | PostgreSQL (Supabase) |
| Storage | Supabase Storage (product images) |
| Styling | Tailwind CSS |
| UI Components | React Icons |

### System Components

```
Frontend (React App)
├── Admin Routes (Protected)
│   ├── /admin (Dashboard)
│   ├── /admin/products (CRUD)
│   ├── /admin/orders (Status Management)
│   ├── /admin/customers (Analytics)
│   ├── /admin/analytics (Metrics)
│   └── /admin/settings (Configuration)
├── Auth Context
│   └── Role-based access control (admin/customer)
└── Public Pages (unchanged)

Backend (Supabase)
├── Authentication
│   └── auth.users + profiles table
├── Database
│   ├── products
│   ├── orders
│   ├── profiles
│   └── admin_settings
├── Row Level Security (RLS)
│   ├── Customer policies
│   └── Admin policies
└── Helper Functions (RPCs)
    ├── admin_dashboard_summary()
    ├── admin_order_summaries()
    ├── admin_customer_summaries()
    ├── admin_update_order_status()
    └── get_*_stats() functions
```

---

## ⚙️ Setup Instructions

### Prerequisites

- ✅ Existing Pick Fashion project running
- ✅ Supabase project configured
- ✅ Authentication already working
- ✅ React Router v7 installed

### 1️⃣ Apply Database Migrations

**Location:** `supabase/migrations/`

Two new migration files need to be applied:

1. **`009_complete_admin_system.sql`** - Core admin infrastructure
   - Admin settings table
   - Enhanced RLS policies
   - Helper functions and RPCs
   - Inventory management logic

2. **`010_demo_data.sql`** - Sample data for testing
   - 15 demo products (women, men, kids)
   - Admin settings
   - Instructions for demo orders

**Steps to apply:**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to your project → SQL Editor
3. Copy contents of `009_complete_admin_system.sql`
4. Click "Run"
5. Repeat for `010_demo_data.sql`

**Verify:**
```sql
-- Check tables exist
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM admin_settings;
SELECT COUNT(*) FROM profiles WHERE role = 'admin';
```

### 2️⃣ Setup Storage for Product Images

1. Go to **Storage** in Supabase Dashboard
2. Click **+ New bucket**
3. Name: `product-images`
4. Make **PUBLIC**
5. Go to **Policies** tab
6. Add policy for authenticated uploads

### 3️⃣ Promote Test User to Admin

After you create a test account:

```sql
-- Get user ID (from auth.users table)
SELECT id, email FROM auth.users LIMIT 5;

-- Promote to admin (replace <USER_ID>)
UPDATE public.profiles
SET role = 'admin'
WHERE id = '<USER_ID>';

-- Verify
SELECT id, role FROM profiles WHERE id = '<USER_ID>';
```

### 4️⃣ Frontend is Ready

The admin components are already implemented! No additional setup needed.

Access at: `http://localhost:5173/admin`

---

## 💾 Database Schema

### `profiles` Table

Stores user metadata including role.

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  role text DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**New columns:**
- `role` - 'customer' or 'admin'

---

### `products` Table

Product catalog with inventory tracking.

```sql
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sold_count integer NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
  image_url text,
  status text DEFAULT 'active' 
    CHECK (status IN ('active', 'hidden', 'sold_out')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Status logic:**
- `active` - Product is available for sale
- `hidden` - Admin hid product from public
- `sold_out` - Stock = 0 (automatic)

---

### `orders` Table (Enhanced)

Existing orders table now connects to products properly.

```sql
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,  -- NEW
  legacy_product_id text,  -- LEGACY (for migration)
  product_name text NOT NULL,
  product_image text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  phone_number text NOT NULL,
  telegram_handle text NOT NULL,
  status text DEFAULT 'pending_manual'
    CHECK (status IN ('pending_manual', 'confirmed', 'delivered', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Status transitions:**
```
pending_manual → confirmed → delivered
         ↓
      cancelled
```

When order → `delivered`:
- Stock decreases by quantity
- Sold count increases by quantity

---

### `admin_settings` Table (New)

Single row storing admin preferences.

```sql
CREATE TABLE admin_settings (
  id integer PRIMARY KEY DEFAULT 1,  -- Always 1
  store_name text DEFAULT 'Pick Fashion',
  store_email text DEFAULT 'pickfashionzr@gmail.com',
  store_phone text DEFAULT '',
  currency text DEFAULT 'ETB',
  low_stock_threshold integer DEFAULT 3,
  notify_new_orders boolean DEFAULT true,
  notify_low_stock boolean DEFAULT true,
  notify_customer_messages boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## 🔒 Security & RLS

### Row Level Security Policies

#### Products Table

| Action | User Type | Rule |
|--------|-----------|------|
| SELECT | Customer | Status = 'active' only |
| SELECT | Admin | All products |
| INSERT | Customer | NOT ALLOWED |
| INSERT | Admin | Allowed |
| UPDATE | Customer | NOT ALLOWED |
| UPDATE | Admin | Allowed |
| DELETE | Customer | NOT ALLOWED |
| DELETE | Admin | Allowed |

#### Orders Table

| Action | User Type | Rule |
|--------|-----------|------|
| SELECT | Customer | Own orders only |
| SELECT | Admin | All orders |
| INSERT | Customer | Own user_id only |
| INSERT | Admin | Any user_id |
| UPDATE | Customer | Own pending_manual only |
| UPDATE | Admin | Any order, status transitions |

#### Profiles Table

| Action | User Type | Rule |
|--------|-----------|------|
| SELECT | Any | Own profile only |
| SELECT | Admin | All profiles |
| UPDATE | Any | Own profile (cannot change role) |
| UPDATE | Admin | Any profile |

#### Admin Settings Table

| Action | User Type | Rule |
|--------|-----------|------|
| SELECT | Admin | Allowed |
| UPDATE | Admin | Allowed |
| SELECT | Customer | NOT ALLOWED |

### Helper Functions

All admin functions check `is_admin()` first.

```sql
-- Check if current user is admin
SELECT public.is_admin();

-- Check if specific user is admin
SELECT public.is_user_admin(user_id);

-- Promote user to admin
SELECT public.promote_to_admin(user_id);
```

---

## 📡 API Reference

### Frontend API (adminUtils.js)

#### Dashboard & Stats

```javascript
// Get dashboard summary
await fetchDashboardStats()
→ {
    total_products,
    active_products,
    pending_orders,
    delivered_orders,
    revenue_estimate,
    items_sold,
    customers_count,
    low_stock_products
  }
```

#### Products API

```javascript
// Fetch all products
await fetchProducts()
→ Product[]

// Save product (create or update)
await saveProduct(product, imageFile?)
→ productId

// Delete product
await deleteProduct(productId)
→ void

// Set visibility (active/hidden)
await setProductVisibility(product, status)
→ void

// Upload image
await uploadProductImage(file)
→ publicUrl
```

#### Orders API

```javascript
// Fetch all orders with customer info
await fetchOrderSummaries()
→ OrderSummary[]

// Update order status
await updateOrderStatus(orderId, status)
→ { success: boolean, message: string }

// Inventory is auto-managed when order → delivered
```

#### Customers API

```javascript
// Fetch all customers with stats
await fetchCustomerSummaries()
→ CustomerSummary[]
```

#### Analytics API

```javascript
// Get full analytics snapshot
await fetchAnalyticsSnapshot()
→ {
    dashboard,
    totalRevenue,
    totalOrders,
    averageOrderValue,
    topProducts,
    recentOrders
  }
```

#### Settings API

```javascript
// Fetch admin settings
await fetchAdminSettings()
→ AdminSettings

// Save admin settings
await saveAdminSettings(settings)
→ void
```

---

## 🎨 Component Guide

### Protected Route: `AdminRoute`

**Location:** `src/components/Admin/AdminRoute.jsx`

Protects all admin routes from non-admin users.

```jsx
<Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  }
>
  {/* Admin sub-routes */}
</Route>
```

**Behavior:**
- ✅ Admin → Shows content
- ❌ Customer → Redirect to `/`
- ⏳ Loading → Shows spinner

---

### Layout: `AdminLayout`

**Location:** `src/components/Admin/AdminLayout.jsx`

Sidebar navigation + header for all admin pages.

**Features:**
- Responsive sidebar (mobile collapsible)
- Active page highlighting
- Profile info in header
- Logout button
- Notification bell (placeholder)

**Navigation:**
- Dashboard
- Products
- Orders
- Customers
- Analytics
- Settings

---

### Dashboard: `Dashboard`

**Location:** `src/components/Admin/Dashboard.jsx`

Homepage showing key metrics.

**Displays:**
- Total products
- Pending orders
- Delivered orders
- Revenue estimate
- Items sold
- Customers count

---

### Products: `Products`

**Location:** `src/components/Admin/Products.jsx`

CRUD operations for products.

**Features:**
- Search by name/category/description
- Filter by status (active/hidden/sold_out)
- Add/edit/delete products
- Upload product images
- Visibility toggle (show/hide)
- Stock management
- Automatic sold_out status

**Modal Form:**
- Product name (required)
- Category (required)
- Description
- Price (required)
- Stock (required)
- Status
- Image URL or upload

---

### Orders: `Orders`

**Location:** `src/components/Admin/Orders.jsx`

Order management and status tracking.

**Features:**
- View all orders
- Search by customer/email/phone/Telegram/product
- Filter by status
- Update order status
- Customer contact info
- Order total and date
- Inventory auto-sync on delivery

**Status Actions:**
- Pending → Confirmed
- Confirmed → Delivered
- Any → Cancelled
- Delivered → (locked)

---

### Customers: `Customers`

**Location:** `src/components/Admin/Customers.jsx`

Customer management and analytics.

**Features:**
- View all customers
- Search by username/email/phone/Telegram
- Filter (all/active/new/frequent)
- Order count per customer
- Total purchases amount
- Last order date
- Join date

**Statistics:**
- Total customers
- Active customers
- Frequent buyers (5+ orders)

---

### Analytics: `Analytics`

**Location:** `src/components/Admin/Analytics.jsx`

Revenue and performance metrics.

**Displays:**
- Total revenue (delivered orders only)
- Order count
- Average order value
- Items sold total
- Top 5 best-selling products
- Recent orders (latest 8)

---

### Settings: `Settings`

**Location:** `src/components/Admin/Settings.jsx`

Admin configuration.

**Admin Profile:**
- Username (read-only)
- Email (read-only)
- Role (read-only)

**Store Settings:**
- Store name
- Store email
- Store phone
- Currency
- Low stock threshold
- Notification toggles

---

## 🔧 Customization

### Change Admin Role Name

```sql
-- Add new role value to check
ALTER TABLE profiles
DROP CONSTRAINT profiles_role_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('customer', 'admin', 'moderator'));
```

### Customize Low Stock Alert

```sql
-- Update threshold
UPDATE admin_settings
SET low_stock_threshold = 5
WHERE id = 1;

-- Query low stock products
SELECT * FROM products
WHERE stock <= (SELECT low_stock_threshold FROM admin_settings);
```

### Add Custom Order Status

**Note:** Status is validated as:
```
'pending_manual', 'confirmed', 'delivered', 'cancelled'
```

To add new status, update:
1. Database check constraint
2. Frontend `ORDER_STATUSES` constant
3. Status tone function in adminUtils

---

### Change Product Categories

Products use free-text categories. Examples:
- Women
- Men
- Kids
- Accessories
- Sale

**Filter by category:**
```javascript
const category = 'Women';
const products = await fetchProducts();
const filtered = products.filter(p => p.category === category);
```

---

### Customize Currency

**Update admin settings:**
```sql
UPDATE admin_settings
SET currency = 'USD'
WHERE id = 1;
```

**Frontend automatically uses it:**
```javascript
formatCurrency(amount); // Uses currency from settings
```

---

### Enable/Disable Notifications

```javascript
// In Settings page, toggle notification checkboxes
// Stored in admin_settings table
notify_new_orders
notify_low_stock
notify_customer_messages
```

These are stored but not yet used in notifications system.

---

## 🐛 Troubleshooting

### Issue: Can't access `/admin` - redirects to home

**Cause:** User is not an admin

**Solution:**
```sql
-- Check user's role
SELECT role FROM profiles WHERE id = auth.uid();

-- Promote to admin
UPDATE profiles
SET role = 'admin'
WHERE id = '<your_user_id>';
```

---

### Issue: Products not loading

**Cause:** RLS policy blocking access

**Solution:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'products';

-- Verify user is authenticated
SELECT auth.uid();
```

---

### Issue: Order status update fails

**Cause:** Inventory constraint or invalid transition

**Solution:**
```sql
-- Check stock before delivery
SELECT stock FROM products WHERE id = '<product_id>';

-- Check order details
SELECT * FROM orders WHERE id = '<order_id>';

-- Valid transitions: pending_manual → confirmed → delivered
-- Cannot go backwards from delivered
```

---

### Issue: Image upload fails

**Cause:** Storage bucket not configured

**Solution:**
1. Verify `product-images` bucket exists in Supabase Storage
2. Bucket must be PUBLIC
3. Add upload policy for authenticated users

---

### Issue: Admin settings table doesn't exist

**Cause:** Migration 009 not applied

**Solution:**
```sql
-- Run migration 009_complete_admin_system.sql
-- Check it exists:
SELECT * FROM admin_settings;
```

---

## 📊 Database Performance

### Indexes Already Created

```sql
-- Products
idx_products_category
idx_products_status
idx_products_created_at

-- Orders
idx_orders_user_id
idx_orders_status
idx_orders_product_id

-- Profiles
idx_profiles_role
```

### Query Performance Tips

**Slow:** 1000 customer queries
```javascript
customers.map(c => fetchOrderCount(c.id))
```

**Fast:** Batch with RPC
```javascript
const summaries = await fetchCustomerSummaries();
// Returns: user_id, username, total_orders, total_spent, last_order_date
```

---

## 🚀 Going to Production

### Pre-deployment Checklist

- [ ] All migrations applied
- [ ] Product images storage bucket configured
- [ ] Admin user(s) created and promoted
- [ ] Settings configured (store name, email, etc.)
- [ ] RLS policies verified
- [ ] Test admin workflow end-to-end
- [ ] Set low_stock_threshold appropriately
- [ ] Verify currency is correct

### Environment Variables

Ensure these are set in `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

### Security Review

✅ **Already Implemented:**
- RLS blocks customer access to admin data
- Admin functions require is_admin() check
- Passwords hashed by Supabase Auth
- Images stored in Supabase Storage
- Email verification for auth

⚠️ **Recommended:**
- Enable 2FA for admin accounts
- Regular backups of database
- Monitor orders table for fraudulent activity
- Rate limit API calls
- Add audit logging for admin actions

---

## 📝 Demo Data

The `010_demo_data.sql` migration includes:

**15 Sample Products:**
- 5 Women's items (dresses, blazers, pants, boots, etc.)
- 5 Men's items (shirts, pants, sweaters, belts, etc.)
- 5 Kids' items (hoodies, jeans, t-shirts, jackets, socks)

**Prices:** 300 - 2100 ETB

**Stock Levels:** 0 - 35 units (includes sold_out examples)

**To Add Demo Orders:**

1. Create test users through app
2. Get their UUIDs:
   ```sql
   SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
   ```
3. Insert sample orders:
   ```sql
   INSERT INTO orders (user_id, product_name, quantity, unit_price, total_amount, phone_number, telegram_handle, status)
   VALUES (
     '<USER_UUID>',
     'Classic Denim Jacket',
     1,
     1200,
     1200,
     '+251912345678',
     'testuser',
     'pending_manual'
   );
   ```

---

## 🔗 Related Documentation

- [Supabase Docs](https://supabase.com/docs)
- [React Router Docs](https://reactrouter.com)
- [Tailwind CSS](https://tailwindcss.com)
- [React Icons](https://react-icons.github.io/react-icons)

---

## 📞 Support

For issues:
1. Check this troubleshooting section
2. Review Supabase logs
3. Check browser console for errors
4. Verify RLS policies in Supabase Dashboard

---

**Last Updated:** May 18, 2026
**Version:** 1.0
**Status:** ✅ Production Ready
