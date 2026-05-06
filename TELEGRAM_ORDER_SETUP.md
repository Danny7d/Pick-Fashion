# Telegram-Based Order System Setup

Simple MVP checkout system without payment integration. Users place orders and complete them via Telegram.

## How It Works

```
User clicks "Buy"
    ↓
Enter phone + telegram (Checkout Modal)
    ↓
Order created in Supabase (status: pending_manual)
    ↓
Redirect to Telegram with order details pre-filled
    ↓
Admin confirms via Telegram chat
    ↓
Admin updates order status in Supabase
    ↓
Order delivered
```

## Quick Setup

### Step 1: Run Database Migration

In Supabase SQL Editor, run:
```sql
-- File: supabase/migrations/002_telegram_orders.sql
-- Creates orders table with status tracking
```

### Step 2: Update Your Product Detail Page

Add the checkout modal to your product pages:

```jsx
import { useState } from "react";
import TelegramCheckout from "../components/TelegramCheckout";

function ProductDetail({ product }) {
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <div>
      {/* Your existing product display */}
      
      <button 
        onClick={() => setShowCheckout(true)}
        className="bg-cyan-600 text-white px-6 py-3 rounded-lg"
      >
        Buy Now
      </button>

      {showCheckout && (
        <TelegramCheckout
          product={product}
          onClose={() => setShowCheckout(false)}
          onSuccess={(orderId) => {
            console.log("Order created:", orderId);
          }}
        />
      )}
    </div>
  );
}
```

### Step 3: Customize Telegram Username

In `src/components/TelegramCheckout.jsx`, change line 14:

```javascript
const adminTelegram = "Rutha_5"; // ← Change to your actual Telegram username
```

### Step 4: Test the Flow

1. Login to your app
2. Click "Buy" on any product
3. Enter phone number: `+251 91 395 0321`
4. Enter telegram: `@yourusername`
5. Click "Place Order"
6. You'll be redirected to Telegram with pre-filled message
7. Send the message to complete

## Order Statuses

| Status | Description | User Can Cancel? |
|--------|-------------|------------------|
| `pending_manual` | Awaiting admin confirmation | ✅ Yes |
| `confirmed` | Order accepted, preparing | ❌ No |
| `delivered` | Order completed | ❌ No |
| `cancelled` | Order cancelled | - |

## Admin Workflow

### Receiving Orders

When a user places an order, they send you a message like:

```
🛒 New Order from Pick Fashion

📦 Product: Classic White T-Shirt
💰 Price: $25.00
📊 Quantity: 2
🆔 Order ID: abc12345
📱 Phone: +251 91 395 0321
💬 Telegram: @customer123

Please confirm my order!
```

### Confirming Orders

Option 1: **Supabase Dashboard**
1. Go to Supabase Dashboard → Table Editor → orders
2. Find the order by ID
3. Change status from `pending_manual` to `confirmed`

Option 2: **SQL (for admin panel)**
```sql
SELECT confirm_order('order-uuid-here', 'Confirmed via Telegram');
```

### Marking Delivered

```sql
SELECT mark_delivered('order-uuid-here');
```

## User Pages

### Orders Page

Users can view all their orders at `/orders`:
- Shows order status
- Shows product details
- Can cancel pending orders
- Link to message admin on Telegram

### Add to Navigation

Add this link to your TopBar/Navigation:

```jsx
<Link to="/orders" className="text-white">
  My Orders
</Link>
```

## Database Functions

### For Users

```sql
-- Get user's orders
SELECT * FROM get_user_orders();

-- Get specific order
SELECT * FROM get_order_by_id('order-uuid');

-- Cancel pending order
SELECT cancel_order('order-uuid');
```

### For Admin

```sql
-- Confirm order
SELECT confirm_order('order-uuid', 'Optional notes');

-- Mark as delivered
SELECT mark_delivered('order-uuid');

-- Get stats
SELECT get_order_stats();
```

## Security

- ✅ RLS enabled on orders table
- ✅ Users can only see their own orders
- ✅ Users can only cancel pending orders
- ✅ Authenticated users only

## Customization Ideas

### Add Telegram Bot (Optional)

For automated confirmations, create a simple bot:

```javascript
// bot.js - Node.js Telegram Bot
const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const bot = new Telegraf(process.env.BOT_TOKEN);
const supabase = createClient(url, key);

bot.command('orders', async (ctx) => {
  // Admin checks pending orders
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'pending_manual')
    .order('created_at', { ascending: false })
    .limit(10);
    
  ctx.reply(`Pending orders: ${data.length}`);
});

bot.launch();
```

### Add SMS Notifications (Future)

Integrate with Ethiopian SMS providers when ready to scale.

## Troubleshooting

### Orders not showing
- Check user is logged in
- Verify RLS policies are working
- Check browser console for errors

### Telegram link not working
- Verify `adminTelegram` variable is set correctly
- Make sure username doesn't include @ symbol in the code
- Test link manually: `https://t.me/Rutha_5?text=test`

### Can't cancel order
- Only `pending_manual` orders can be cancelled
- Check order status in Supabase

## Next Steps

When ready to add payments later:
1. Keep existing order system
2. Add payment column to orders table
3. Integrate Chapa/Telebirr
4. Mark paid orders as `confirmed` automatically

## Support

Issues? Contact: pickfashionzr@gmail.com or @Rutha_5
