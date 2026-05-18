# Admin Dashboard - Quick Reference

## 🚀 Quick Start

### 1. Apply Migrations
```bash
# Go to Supabase Dashboard → SQL Editor
# Copy and paste supabase/migrations/009_complete_admin_system.sql
# Copy and paste supabase/migrations/010_demo_data.sql
# Click "Run"
```

### 2. Create Admin User
```sql
-- Get your user ID after signing up
SELECT id FROM auth.users WHERE email = 'your@email.com';

-- Promote to admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = '<YOUR_USER_ID>';
```

### 3. Access Admin Panel
```
http://localhost:5173/admin
```

---

## 📁 Project Structure

```
src/components/Admin/
├── AdminLayout.jsx          # Main layout with sidebar
├── AdminRoute.jsx           # Protected route wrapper
├── Dashboard.jsx            # /admin - KPI dashboard
├── Products.jsx             # /admin/products - CRUD
├── Orders.jsx               # /admin/orders - Order management
├── Customers.jsx            # /admin/customers - Customer analytics
├── Analytics.jsx            # /admin/analytics - Revenue metrics
├── Settings.jsx             # /admin/settings - Configuration
└── adminUtils.js            # API calls & helpers

supabase/migrations/
├── 009_complete_admin_system.sql  # Core admin features
└── 010_demo_data.sql              # Sample data
```

---

## 🔐 Role System

### Profiles Table

New column in `profiles`:
```sql
role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin'))
```

### Auth Context

Access in components:
```jsx
const { isAdmin, profile, session } = UserAuth();

if (isAdmin) {
  // Show admin features
}
```

---

## 📊 Database Objects

### Tables

| Table | Purpose |
|-------|---------|
| `products` | Catalog with inventory |
| `orders` | Purchase records |
| `profiles` | User metadata (includes role) |
| `admin_settings` | Single-row config |

### Key Functions (RPCs)

```sql
admin_dashboard_summary()      -- Dashboard KPIs
admin_order_summaries()        -- All orders with customer info
admin_customer_summaries()     -- All customers with stats
admin_update_order_status()    -- Update order & sync inventory
get_low_stock_products()       -- Products below threshold
get_product_stats()            -- Sales statistics
get_order_revenue_summary()    -- Revenue breakdown
```

### Triggers

```sql
products_stock_status_trigger  -- Auto-set status based on stock
orders_updated_at              -- Update timestamp on change
profiles_set_updated_at        -- Update timestamp on change
```

---

## 🎯 Common Tasks

### Add a Product

```javascript
import { saveProduct } from './adminUtils';

const newProduct = {
  name: 'Product Name',
  description: 'Description',
  category: 'Category',
  price: 1000,
  stock: 50,
  status: 'active',
  image_url: null
};

const imageFile = /* File from input */;
const productId = await saveProduct(newProduct, imageFile);
```

### Update Order Status

```javascript
import { updateOrderStatus } from './adminUtils';

await updateOrderStatus(orderId, 'delivered');
// Automatically decreases stock & increases sold_count
```

### Get Dashboard Stats

```javascript
import { fetchDashboardStats } from './adminUtils';

const stats = await fetchDashboardStats();
console.log(stats.total_products);
console.log(stats.pending_orders);
console.log(stats.revenue_estimate);
```

### Fetch Customers

```javascript
import { fetchCustomerSummaries } from './adminUtils';

const customers = await fetchCustomerSummaries();
// Returns: user_id, username, email, total_orders, total_spent, last_order_date
```

---

## 🔒 Security

### RLS Policies in Place

✅ **Customers can:**
- See only their own orders
- See only active products
- Cannot access admin pages
- Cannot modify products

✅ **Admins can:**
- See all orders
- See all products (including hidden)
- Manage products
- Update order statuses
- Modify settings

### Protection Layers

1. **Frontend:** `AdminRoute` redirects non-admins
2. **Backend:** RLS policies enforce access
3. **Functions:** `is_admin()` check on RPCs
4. **Auth:** Supabase Auth handles sessions

---

## 🐛 Debugging

### Check if user is admin
```sql
SELECT role FROM profiles WHERE id = auth.uid();
```

### Check RLS is enabled
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('products', 'orders', 'profiles');
-- Should show: t (true)
```

### Test admin function
```sql
SELECT public.is_admin();
-- Returns: true/false
```

### View low stock products
```sql
SELECT * FROM products
WHERE stock <= (SELECT low_stock_threshold FROM admin_settings);
```

---

## 📱 Routes

| Route | Component | Auth | Description |
|-------|-----------|------|-------------|
| `/admin` | Dashboard | Admin | KPI overview |
| `/admin/products` | Products | Admin | CRUD products |
| `/admin/orders` | Orders | Admin | Manage orders |
| `/admin/customers` | Customers | Admin | View customers |
| `/admin/analytics` | Analytics | Admin | Revenue metrics |
| `/admin/settings` | Settings | Admin | Configuration |

---

## 🎨 UI Constants

### Order Status Tones
```javascript
pending_manual → amber (waiting for confirmation)
confirmed    → sky (admin accepted)
delivered    → emerald (completed)
cancelled    → rose (rejected)
```

### Product Status Tones
```javascript
active   → emerald (for sale)
hidden   → slate (admin hidden)
sold_out → rose (out of stock)
```

---

## 💾 API Reference

### Products API
```javascript
fetchProducts()              // Get all products
saveProduct(data, file)      // Create/update + upload image
deleteProduct(id)            // Remove product
setProductVisibility(p, s)   // Toggle hidden/active
uploadProductImage(file)     // Upload to Supabase Storage
```

### Orders API
```javascript
fetchOrderSummaries()        // Get all orders with customer info
updateOrderStatus(id, s)     // Change status (syncs inventory)
```

### Customers API
```javascript
fetchCustomerSummaries()     // Get all customers with stats
```

### Settings API
```javascript
fetchAdminSettings()         // Get admin_settings
saveAdminSettings(data)      // Update admin_settings
```

### Analytics API
```javascript
fetchDashboardStats()        // Dashboard KPIs
fetchAnalyticsSnapshot()     // Revenue + top products
```

---

## 🚨 Important Notes

⚠️ **Stock Management:**
- Stock can only be decreased via order delivery
- Order cancellation after delivery restores stock
- Sold_count auto-increments on delivery
- Status auto-sets to sold_out when stock = 0

⚠️ **Image Uploads:**
- Requires `product-images` bucket in Supabase Storage
- Bucket must be PUBLIC
- Uses cryptographic randomUUID for filenames
- Returns public URL

⚠️ **Order Status Transitions:**
- Can't go backwards from `delivered`
- Can't transition from `cancelled` to confirmed/delivered
- Inventory only syncs on `delivered` status

⚠️ **Inventory Sync:**
- Only happens when order reaches `delivered`
- Decreases stock by quantity
- Increases sold_count by quantity
- Auto-sets status to sold_out if stock = 0

---

## 🔄 Inventory Logic

### When Order → `delivered`

```javascript
// Automatically executed
Product.stock -= order.quantity
Product.sold_count += order.quantity

// If new stock = 0
Product.status = 'sold_out'
```

### When Order Reverted from `delivered`

```javascript
// If manually changed back
Product.stock += order.quantity
Product.sold_count = max(0, sold_count - quantity)

// If stock > 0 and was sold_out
Product.status = 'active'
```

---

## 📝 Demo Data

### Sample Products Included
- 15 products across categories (Women, Men, Kids)
- Mix of stock levels (0-35)
- Prices from 300-2100 ETB
- Includes sold_out examples

### Creating Demo Orders

Get user IDs:
```sql
SELECT id, email FROM auth.users ORDER BY created_at DESC;
```

Insert order:
```sql
INSERT INTO orders (
  user_id, product_name, quantity, unit_price, 
  total_amount, phone_number, telegram_handle, status
)
VALUES (
  '<USER_ID>',
  'Classic Denim Jacket',
  1,
  1200,
  1200,
  '+251912345678',
  'customer_handle',
  'pending_manual'
);
```

---

## ✅ Checklist for Production

- [ ] Migrations applied (009 + 010)
- [ ] Storage bucket created and public
- [ ] Admin user(s) promoted
- [ ] Store settings configured
- [ ] Low stock threshold set
- [ ] Currency correct
- [ ] Test product CRUD
- [ ] Test order workflow
- [ ] Verify RLS policies
- [ ] Image uploads working
- [ ] Backup configured

---

## 📞 Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Only admins can..." | User not promoted | Run promote SQL |
| 403 Forbidden | RLS blocking access | Check RLS policy |
| "Storage bucket not found" | Bucket not created | Create `product-images` bucket |
| "Insufficient stock" | Product out of stock | Check stock quantity |
| Order status stuck | Invalid transition | Check transition rules |

---

**Version:** 1.0
**Last Updated:** May 18, 2026
**Status:** ✅ Production Ready
