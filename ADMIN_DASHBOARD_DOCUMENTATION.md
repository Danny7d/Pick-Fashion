# Pick Fashion Admin Dashboard

This project now extends the existing customer storefront with a separate owner area at `/admin` without replacing the current authentication flow or public pages.

## Included

- Role-based `profiles` access with `customer | admin`
- Protected admin routes:
  - `/admin`
  - `/admin/products`
  - `/admin/orders`
  - `/admin/customers`
  - `/admin/analytics`
  - `/admin/settings`
- Admin product CRUD with hide/show, stock control, image upload support, and live storefront sync
- Admin order workflow for `pending_manual -> confirmed -> delivered | cancelled`
- Customer summaries and lightweight analytics
- Persistent `admin_settings`
- Supabase RLS and admin-only RPCs

## Files

### Frontend

```text
src/
  App.jsx
  components/
    TopBar.jsx
    ProfileMenu.jsx
    productUtils.js
    useCatalogProducts.js
    context/AuthContext.jsx
    Admin/
      AdminRoute.jsx
      AdminLayout.jsx
      Dashboard.jsx
      Products.jsx
      Orders.jsx
      Customers.jsx
      Analytics.jsx
      Settings.jsx
      adminUtils.js
```

### Supabase

```text
supabase/migrations/
  004_add_role_to_profiles.sql
  005_create_products_table.sql
  006_update_orders_table.sql
  007_demo_data.sql
  008_admin_dashboard_hardening.sql
```

## Database model

### `profiles`

```sql
id uuid primary key references auth.users(id)
username text
role text not null default 'customer' check (role in ('customer', 'admin'))
created_at timestamptz
updated_at timestamptz
```

### `products`

```sql
id uuid primary key default uuid_generate_v4()
name text not null
description text
category text not null
price numeric(10,2) not null
stock integer not null default 0
sold_count integer not null default 0
image_url text
status text not null default 'active' check (status in ('active', 'hidden', 'sold_out'))
created_at timestamptz
updated_at timestamptz
```

### `orders`

```sql
id uuid primary key default uuid_generate_v4()
user_id uuid references auth.users(id)
legacy_product_id text
product_id uuid references public.products(id)
product_name text not null
product_image text
quantity integer not null
unit_price numeric(10,2) not null
total_amount numeric(10,2) not null
phone_number text not null
telegram_handle text not null
chat_id bigint
status text not null default 'pending_manual'
created_at timestamptz
updated_at timestamptz
```

### `admin_settings`

```sql
id integer primary key default 1 check (id = 1)
store_name text not null
store_email text not null
store_phone text not null
currency text not null default 'ETB'
low_stock_threshold integer not null default 3
notify_new_orders boolean not null default true
notify_low_stock boolean not null default true
notify_customer_messages boolean not null default true
created_at timestamptz
updated_at timestamptz
```

## Security and RLS

- Customers can read only their own `orders`
- Customers can read only active, in-stock `products`
- Admins can read/manage all `products`, `orders`, `profiles`, and `admin_settings`
- `AdminRoute` blocks admin pages in React
- Admin summary RPCs enforce `public.is_admin()` server-side

## Inventory logic

- `sync_product_status_from_stock()` forces `stock = 0` products to `sold_out`
- Admin can manually set `hidden`
- `admin_update_order_status()` controls valid transitions
- `handle_order_delivery()` updates inventory only when an order becomes `delivered`
- Delivering an order:
  - decreases `stock`
  - increases `sold_count`
- Reversing a delivered order restores stock and rolls back `sold_count`

## State management

- `AuthContext` now exposes:
  - `session`
  - `profile`
  - `profileLoading`
  - `isAdmin`
  - `refreshProfile`
- `adminUtils.js` centralizes admin data access
- `useCatalogProducts.js` powers customer-facing product views from Supabase with static fallback data

## Example API calls

### Get admin dashboard summary

```js
const { data, error } = await supabase.rpc("admin_dashboard_summary");
```

### Fetch admin order summaries

```js
const { data, error } = await supabase.rpc("admin_order_summaries");
```

### Update order status as admin

```js
const { data, error } = await supabase.rpc("admin_update_order_status", {
  p_order_id: orderId,
  p_status: "confirmed",
});
```

### Create or update a product

```js
const { error } = await supabase.from("products").upsert({
  id,
  name,
  description,
  category,
  price,
  stock,
  image_url,
  status,
});
```

### Save store settings

```js
const { error } = await supabase.from("admin_settings").upsert({
  id: 1,
  store_name: "Pick Fashion",
  store_email: "pickfashionzr@gmail.com",
  currency: "ETB",
});
```

## Setup order

1. Run the existing profile/order/product migrations.
2. Run `008_admin_dashboard_hardening.sql`.
3. Make sure the owner account exists in Supabase Auth.
4. Confirm `danny0988lewis@gmail.com` has a `profiles.role = 'admin'`.

If the user already existed before the migration, run:

```sql
UPDATE public.profiles AS p
SET role = 'admin'
FROM auth.users AS au
WHERE au.id = p.id
  AND lower(au.email::text) = lower('danny0988lewis@gmail.com');
```

## Demo data

- `007_demo_data.sql` seeds sample products
- Existing manual orders can be kept
- New demo orders should use real users so `user_id`, customer summaries, and RLS stay valid

## Build status

- `npm run build` passes
- `npm run lint` passes after the admin integration changes
