-- Complete database setup for restaurant management system
-- Run this entire script in Supabase SQL Editor

-- Create enum for menu categories
CREATE TYPE menu_category AS ENUM ('Main Course', 'Starters', 'Desserts', 'Beverages');

-- Create ingredients table
CREATE TABLE public.ingredients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    stock INTEGER NOT NULL,
    unit TEXT NOT NULL
);

-- Create menuitems table
CREATE TABLE public.menuitems (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category menu_category NOT NULL,
    price NUMERIC NOT NULL,
    halfprice NUMERIC,
    supportshalf BOOLEAN DEFAULT false,
    portions JSONB
);

-- Create orders table
CREATE TABLE public.orders (
    id SERIAL PRIMARY KEY,
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create prepplans table
CREATE TABLE public.prepplans (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    dish TEXT NOT NULL,
    suggested_qty INTEGER NOT NULL,
    actual_prepared INTEGER,
    leftovers INTEGER
);

-- Create recipes table
CREATE TABLE public.recipes (
    id SERIAL PRIMARY KEY,
    menuitemid INTEGER REFERENCES public.menuitems(id),
    ingredientid INTEGER REFERENCES public.ingredients(id),
    quantity NUMERIC NOT NULL
);

-- Create team_members table
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to decrement stock
CREATE OR REPLACE FUNCTION public.decrement_stock(ingredient_id INTEGER, amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    new_stock INTEGER;
BEGIN
    UPDATE public.ingredients 
    SET stock = stock - amount 
    WHERE id = ingredient_id 
    RETURNING stock INTO new_stock;
    
    RETURN new_stock;
END;
$$;

-- Create function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
    action TEXT,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), action, entity_type, entity_id, details)
    RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT role FROM public.team_members WHERE user_id = user_uuid;
$$;

-- Enable Row Level Security
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menuitems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prepplans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read ingredients" ON public.ingredients
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to modify ingredients" ON public.ingredients
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read menuitems" ON public.menuitems
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to modify menuitems" ON public.menuitems
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read orders" ON public.orders
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert orders" ON public.orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read prepplans" ON public.prepplans
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to modify prepplans" ON public.prepplans
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read recipes" ON public.recipes
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to modify recipes" ON public.recipes
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to read their own team member record" ON public.team_members
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to update their own team member record" ON public.team_members
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to insert team member records" ON public.team_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read activity logs" ON public.activity_logs
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create trigger function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_members (user_id, email, role)
  VALUES (NEW.id, NEW.email, 'Cashier');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table (this will auto-create team member records)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data
INSERT INTO public.ingredients (name, stock, unit) VALUES
('Chicken Breast', 50, 'kg'),
('Rice', 100, 'kg'),
('Tomatoes', 30, 'kg'),
('Onions', 25, 'kg'),
('Garlic', 5, 'kg'),
('Olive Oil', 10, 'liters'),
('Salt', 5, 'kg'),
('Black Pepper', 2, 'kg'),
('Flour', 20, 'kg'),
('Eggs', 100, 'pieces'),
('Milk', 15, 'liters'),
('Cheese', 10, 'kg'),
('Lettuce', 8, 'kg'),
('Bread', 50, 'loaves'),
('Potatoes', 40, 'kg');

INSERT INTO public.menuitems (name, category, price, halfprice, supportshalf, portions) VALUES
('Grilled Chicken', 'Main Course', 18.99, 12.99, true, '{"full": 1, "half": 0.6}'),
('Chicken Fried Rice', 'Main Course', 15.99, 10.99, true, '{"full": 1, "half": 0.7}'),
('Caesar Salad', 'Starters', 8.99, null, false, '{"full": 1}'),
('Garlic Bread', 'Starters', 6.99, null, false, '{"full": 1}'),
('Tomato Soup', 'Starters', 7.99, null, false, '{"full": 1}'),
('Chocolate Cake', 'Desserts', 9.99, null, false, '{"full": 1}'),
('Ice Cream', 'Desserts', 5.99, null, false, '{"full": 1}'),
('Fresh Orange Juice', 'Beverages', 4.99, null, false, '{"full": 1}'),
('Coffee', 'Beverages', 3.99, null, false, '{"full": 1}'),
('Iced Tea', 'Beverages', 3.49, null, false, '{"full": 1}');

INSERT INTO public.recipes (menuitemid, ingredientid, quantity) VALUES
(1, 1, 0.3), -- Grilled Chicken: Chicken Breast
(1, 6, 0.02), -- Grilled Chicken: Olive Oil
(1, 7, 0.005), -- Grilled Chicken: Salt
(1, 8, 0.002), -- Grilled Chicken: Black Pepper
(2, 1, 0.2), -- Chicken Fried Rice: Chicken Breast
(2, 2, 0.15), -- Chicken Fried Rice: Rice
(2, 4, 0.05), -- Chicken Fried Rice: Onions
(2, 5, 0.01), -- Chicken Fried Rice: Garlic
(2, 6, 0.02), -- Chicken Fried Rice: Olive Oil
(3, 13, 0.1), -- Caesar Salad: Lettuce
(3, 12, 0.03), -- Caesar Salad: Cheese
(3, 14, 0.05), -- Caesar Salad: Bread
(4, 14, 0.1), -- Garlic Bread: Bread
(4, 5, 0.02), -- Garlic Bread: Garlic
(4, 6, 0.01); -- Garlic Bread: Olive Oil

INSERT INTO public.prepplans (date, dish, suggested_qty, actual_prepared, leftovers) VALUES
(CURRENT_DATE, 'Grilled Chicken', 20, 18, 2),
(CURRENT_DATE, 'Chicken Fried Rice', 15, 15, 0),
(CURRENT_DATE, 'Caesar Salad', 10, 12, 1),
(CURRENT_DATE, 'Garlic Bread', 25, 25, 3);

INSERT INTO public.orders (items, total, timestamp) VALUES
('{"items": [{"id": 1, "name": "Grilled Chicken", "quantity": 2, "price": 18.99}], "subtotal": 37.98, "tax": 3.04, "total": 41.02}', 41.02, NOW() - INTERVAL '2 hours'),
('{"items": [{"id": 2, "name": "Chicken Fried Rice", "quantity": 1, "price": 15.99}, {"id": 8, "name": "Fresh Orange Juice", "quantity": 1, "price": 4.99}], "subtotal": 20.98, "tax": 1.68, "total": 22.66}', 22.66, NOW() - INTERVAL '1 hour'),
('{"items": [{"id": 3, "name": "Caesar Salad", "quantity": 1, "price": 8.99}, {"id": 4, "name": "Garlic Bread", "quantity": 1, "price": 6.99}], "subtotal": 15.98, "tax": 1.28, "total": 17.26}', 17.26, NOW() - INTERVAL '30 minutes');

-- Verify setup
SELECT 'Setup Complete!' as status;
SELECT 'Ingredients' as table_name, count(*) as records FROM public.ingredients
UNION ALL
SELECT 'Menu Items' as table_name, count(*) as records FROM public.menuitems
UNION ALL
SELECT 'Recipes' as table_name, count(*) as records FROM public.recipes
UNION ALL
SELECT 'Prep Plans' as table_name, count(*) as records FROM public.prepplans
UNION ALL
SELECT 'Orders' as table_name, count(*) as records FROM public.orders;