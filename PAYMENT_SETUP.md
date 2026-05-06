# Pick Fashion Payment System Setup

Complete e-commerce payment integration using Supabase Edge Functions with Chapa and Telebirr support.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Supabase        │────▶│   Chapa API     │
│  (React)        │     │  Edge Functions  │     │  (Payment)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │
         │                       ▼
         │              ┌──────────────────┐
         └─────────────▶│  Supabase DB     │
                        │  (orders,        │
                        │   payments)      │
                        └──────────────────┘
```

## Database Schema

### Tables Created:

1. **orders** - Stores customer orders
   - `id`, `user_id`, `total_amount`, `status` (pending/paid/failed)
   - `phone_number`, `telegram_handle`, `payment_method`

2. **payments** - Tracks payment attempts
   - `id`, `order_id`, `provider` (chapa/telebirr)
   - `transaction_ref`, `status`, `verified_at`

3. **order_items** - Line items for each order
   - `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`

## Setup Instructions

### Step 1: Run Database Migration

```bash
# In Supabase SQL Editor, run:
supabase/migrations/001_payment_system.sql
```

### Step 2: Deploy Edge Functions

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy Edge Functions
supabase functions deploy create-payment-session
supabase functions deploy chapa-webhook
supabase functions deploy verify-payment
```

### Step 3: Configure Environment Secrets

In Supabase Dashboard → Settings → API → Edge Functions Secrets, add:

| Secret Name | Value |
|-------------|-------|
| `CHAPA_SECRET_KEY` | Your Chapa secret key (test or live) |
| `CHAPA_PUBLIC_KEY` | Your Chapa public key |
| `SITE_URL` | Your production URL |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `SUPABASE_ANON_KEY` | Anon/public key |

**Get Chapa Keys:**
- Sign up at [dashboard.chapa.co](https://dashboard.chapa.co)
- Go to Settings → API Keys
- Use test keys for development

### Step 4: Configure Chapa Webhook

In Chapa Dashboard → Webhooks, add:

```
URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/chapa-webhook
Events: payment.success, payment.failed
```

### Step 5: Frontend Integration

Add the CheckoutModal component to your product pages:

```jsx
import { useState } from "react";
import CheckoutModal from "./components/CheckoutModal";

function ProductPage({ product }) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [cart, setCart] = useState([{ ...product, quantity: 1 }]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div>
      {/* Your product display */}
      <button onClick={() => setShowCheckout(true)}>
        Buy Now
      </button>

      {showCheckout && (
        <CheckoutModal
          cart={cart}
          total={total}
          onClose={() => setShowCheckout(false)}
          onSuccess={(orderId) => {
            console.log("Order created:", orderId);
            setShowCheckout(false);
          }}
        />
      )}
    </div>
  );
}
```

## Payment Flows

### Chapa Flow (Automated)

1. User clicks "Buy" → Checkout modal opens
2. User enters phone + telegram → Selects Chapa
3. Edge Function creates order (status: pending)
4. Edge Function calls Chapa API → Gets checkout URL
5. User redirected to Chapa checkout page
6. User completes payment on Chapa
7. Chapa sends webhook to your Edge Function
8. Webhook verifies payment → Updates order to "paid"
9. User redirected back to success page

### Telebirr Flow (Manual)

1. User clicks "Buy" → Checkout modal opens
2. User enters phone + telegram → Selects Telebirr
3. Edge Function creates order (status: pending)
4. Edge Function generates unique reference code
5. User sees instructions:
   - Open Telebirr app
   - Send amount to +251 913 950 321
   - Include reference code in description
6. User completes transfer manually
7. Admin verifies via Telegram (@Rutha_5)
8. Admin updates order status via admin panel

## Security Features

- ✅ API keys never exposed in frontend
- ✅ Webhook signature verification (recommended to add)
- ✅ Row Level Security on all tables
- ✅ Only authenticated users can create orders
- ✅ Users can only view their own orders
- ✅ Duplicate payment protection
- ✅ Transaction references are unique

## API Endpoints

### Create Payment Session
```
POST /functions/v1/create-payment-session
Authorization: Bearer <JWT_TOKEN>

Body:
{
  "items": [{ "product_id": "123", "name": "Shirt", "quantity": 1, "unit_price": 25.00 }],
  "total_amount": 25.00,
  "phone_number": "+251913950321",
  "telegram_handle": "customer123",
  "payment_method": "chapa",
  "return_url": "https://yoursite.com/payment-success"
}
```

### Verify Payment (Polling)
```
POST /functions/v1/verify-payment
Authorization: Bearer <JWT_TOKEN>

Body:
{
  "order_id": "uuid-here"
}
```

### Chapa Webhook (Called by Chapa)
```
POST /functions/v1/chapa-webhook
Content-Type: application/json

Body: (Chapa sends this)
{
  "tx_ref": "PF-1234567890-ABC123",
  "status": "success",
  "amount": "25.00",
  ...
}
```

## Testing

### Test Chapa Integration
1. Use Chapa test keys
2. Use test card: `0000 0000 0000 0000`
3. Any future expiry date
4. Any CVV

### Test Telebirr Flow
1. Create order with Telebirr
2. Save the reference code
3. Simulate "payment" by updating via SQL:
   ```sql
   UPDATE payments SET status = 'success' WHERE transaction_ref = 'YOUR_REF';
   UPDATE orders SET status = 'paid' WHERE id = 'YOUR_ORDER_ID';
   ```

## Production Checklist

- [ ] Switch to Chapa live keys
- [ ] Update `SITE_URL` to production domain
- [ ] Enable RLS policies (already configured)
- [ ] Test webhook with Chapa dashboard
- [ ] Set up Telegram notifications (optional)
- [ ] Configure custom domain for Supabase
- [ ] Add error monitoring (Sentry/etc)

## Troubleshooting

### Orders not updating after payment
- Check Edge Function logs in Supabase Dashboard
- Verify webhook URL is correct in Chapa dashboard
- Ensure `CHAPA_SECRET_KEY` is set correctly

### CORS errors
- Edge Functions handle CORS automatically
- Check that `SUPABASE_URL` matches your project

### "Payment not found" errors
- Transaction reference might not match
- Check database for correct refs

## Support

For issues:
1. Check Edge Function logs
2. Verify environment secrets
3. Test with Chapa test mode first
4. Contact: pickfashionzr@gmail.com or @Rutha_5
