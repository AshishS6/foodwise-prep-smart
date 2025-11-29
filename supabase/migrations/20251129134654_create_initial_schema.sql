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