-- Add product_image column to existing orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS product_image TEXT;

-- Add chat_id column for admin to message customers back
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS chat_id bigint;

-- Make user_id nullable for Telegram orders (users may not have website accounts)
ALTER TABLE orders
ALTER COLUMN user_id DROP NOT NULL;

-- Add index on telegram_handle for quick lookups
CREATE INDEX IF NOT EXISTS idx_orders_telegram_handle ON orders(telegram_handle);
