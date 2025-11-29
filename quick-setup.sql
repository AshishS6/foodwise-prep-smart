-- Quick setup - Run this in Supabase SQL Editor

-- Insert basic ingredients
INSERT INTO public.ingredients (name, stock, unit) VALUES
('Chicken Breast', 50, 'kg'),
('Rice', 100, 'kg'),
('Tomatoes', 30, 'kg'),
('Onions', 25, 'kg'),
('Cheese', 10, 'kg');

-- Insert basic menu items
INSERT INTO public.menuitems (name, category, price, supportshalf) VALUES
('Grilled Chicken', 'Main Course', 18.99, true),
('Fried Rice', 'Main Course', 15.99, true),
('Caesar Salad', 'Starters', 8.99, false),
('Coffee', 'Beverages', 3.99, false);

-- Check if data was inserted
SELECT 'Ingredients' as table_name, count(*) as records FROM public.ingredients
UNION ALL
SELECT 'Menu Items' as table_name, count(*) as records FROM public.menuitems;