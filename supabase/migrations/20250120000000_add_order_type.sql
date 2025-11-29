-- Add order_type field to orders table
-- This allows distinguishing between take away and seating orders

-- Create enum for order types
CREATE TYPE order_type AS ENUM ('take_away', 'seating');

-- Add order_type column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_type order_type DEFAULT 'take_away';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_timestamp_order_type ON public.orders(timestamp, order_type);

