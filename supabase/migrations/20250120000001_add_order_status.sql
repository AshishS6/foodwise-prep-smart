-- Add order_status field to orders table
-- This allows tracking order progress in the kitchen

-- Create enum for order status
CREATE TYPE order_status AS ENUM ('pending', 'in_progress', 'ready', 'completed');

-- Add order_status column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_status order_status DEFAULT 'pending';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_status_timestamp ON public.orders(order_status, timestamp);
