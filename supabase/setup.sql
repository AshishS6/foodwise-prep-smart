-- ============================================================
-- FoodWise — Full Database Setup
-- Run this in Supabase SQL Editor on a brand-new project.
-- Paste the entire file and click "Run".
-- ============================================================


-- ============================================================
-- STEP 1: SCHEMA
-- ============================================================

DO $$ BEGIN
  CREATE TYPE menu_category AS ENUM ('Main Course', 'Starters', 'Desserts', 'Beverages');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_type AS ENUM ('take_away', 'seating');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.ingredients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    stock NUMERIC NOT NULL,
    unit TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.menuitems (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category menu_category NOT NULL,
    price NUMERIC NOT NULL,
    halfprice NUMERIC,
    supportshalf BOOLEAN DEFAULT false,
    portions JSONB
);

CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    order_type order_type DEFAULT 'take_away',
    order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'in_progress', 'ready', 'completed'))
);

CREATE TABLE IF NOT EXISTS public.prepplans (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    dish TEXT NOT NULL,
    suggested_qty INTEGER NOT NULL,
    actual_prepared INTEGER,
    leftovers INTEGER
);

CREATE TABLE IF NOT EXISTS public.recipes (
    id SERIAL PRIMARY KEY,
    menuitemid INTEGER REFERENCES public.menuitems(id),
    ingredientid INTEGER REFERENCES public.ingredients(id),
    quantity NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    invited_by UUID REFERENCES auth.users(id),
    token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_timestamp_order_type ON public.orders(timestamp, order_type);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);


-- ============================================================
-- STEP 2: FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.decrement_stock(ingredient_id INTEGER, amount NUMERIC)
RETURNS NUMERIC LANGUAGE plpgsql AS $$
DECLARE new_stock NUMERIC;
BEGIN
    UPDATE public.ingredients SET stock = GREATEST(stock - amount, 0) WHERE id = ingredient_id RETURNING stock INTO new_stock;
    RETURN new_stock;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT role FROM team_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT LANGUAGE sql STABLE AS $$
    SELECT role FROM public.team_members WHERE user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.user_has_role(required_role TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT get_current_user_role() = required_role;
$$;

CREATE OR REPLACE FUNCTION public.user_has_any_role(required_roles TEXT[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT get_current_user_role() = ANY(required_roles);
$$;

CREATE OR REPLACE FUNCTION public.log_activity(action TEXT, entity_type TEXT, entity_id TEXT, details JSONB)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE activity_id UUID;
BEGIN
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), action, entity_type, entity_id, details)
    RETURNING id INTO activity_id;
    RETURN activity_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.invite_team_member_rpc(invite_email TEXT, invite_role TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE caller_role TEXT;
BEGIN
    SET search_path = public;
    SELECT get_current_user_role() INTO caller_role;
    IF caller_role <> 'Admin' THEN RAISE EXCEPTION 'Only administrators can invite team members'; END IF;
    IF EXISTS (SELECT 1 FROM team_members WHERE email = invite_email) THEN
        RAISE EXCEPTION 'User with email % is already a team member', invite_email;
    END IF;
    INSERT INTO team_members (email, role, user_id) VALUES (invite_email, invite_role, '00000000-0000-0000-0000-000000000000');
    PERFORM log_activity('invite', 'team_member', invite_email, jsonb_build_object('role', invite_role));
END;
$$;


-- ============================================================
-- STEP 3: ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menuitems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prepplans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Ingredients
DROP POLICY IF EXISTS "ingredients_select" ON public.ingredients;
DROP POLICY IF EXISTS "ingredients_modify" ON public.ingredients;
CREATE POLICY "ingredients_select" ON public.ingredients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "ingredients_modify" ON public.ingredients FOR ALL USING (auth.role() = 'authenticated' AND user_has_any_role(ARRAY['Admin', 'Manager', 'Kitchen Staff']));

-- Menu Items
DROP POLICY IF EXISTS "menuitems_select" ON public.menuitems;
DROP POLICY IF EXISTS "menuitems_modify" ON public.menuitems;
CREATE POLICY "menuitems_select" ON public.menuitems FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "menuitems_modify" ON public.menuitems FOR ALL USING (auth.role() = 'authenticated' AND user_has_any_role(ARRAY['Admin', 'Manager', 'Kitchen Staff']));

-- Orders
DROP POLICY IF EXISTS "orders_select" ON public.orders;
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_update" ON public.orders;
DROP POLICY IF EXISTS "orders_delete" ON public.orders;
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (auth.role() = 'authenticated' AND user_has_any_role(ARRAY['Admin', 'Manager', 'Cashier', 'Kitchen Staff']));
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_has_any_role(ARRAY['Admin', 'Manager', 'Cashier', 'Kitchen Staff']));
CREATE POLICY "orders_update" ON public.orders FOR UPDATE USING (auth.role() = 'authenticated' AND user_has_any_role(ARRAY['Admin', 'Manager', 'Kitchen Staff']));
CREATE POLICY "orders_delete" ON public.orders FOR DELETE USING (auth.role() = 'authenticated' AND user_has_any_role(ARRAY['Admin', 'Manager']));

-- Prep Plans
DROP POLICY IF EXISTS "prepplans_select" ON public.prepplans;
DROP POLICY IF EXISTS "prepplans_modify" ON public.prepplans;
CREATE POLICY "prepplans_select" ON public.prepplans FOR SELECT USING (auth.role() = 'authenticated' AND user_has_any_role(ARRAY['Admin', 'Manager', 'Kitchen Staff']));
CREATE POLICY "prepplans_modify" ON public.prepplans FOR ALL USING (auth.role() = 'authenticated' AND user_has_any_role(ARRAY['Admin', 'Manager', 'Kitchen Staff']));

-- Recipes
DROP POLICY IF EXISTS "recipes_select" ON public.recipes;
DROP POLICY IF EXISTS "recipes_modify" ON public.recipes;
CREATE POLICY "recipes_select" ON public.recipes FOR SELECT USING (auth.role() = 'authenticated' AND user_has_any_role(ARRAY['Admin', 'Manager', 'Kitchen Staff']));
CREATE POLICY "recipes_modify" ON public.recipes FOR ALL USING (auth.role() = 'authenticated' AND user_has_any_role(ARRAY['Admin', 'Manager', 'Kitchen Staff']));

-- Team Members
DROP POLICY IF EXISTS "team_members_select_own" ON public.team_members;
DROP POLICY IF EXISTS "team_members_select_admin" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update_own" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update_admin" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete_admin" ON public.team_members;
CREATE POLICY "team_members_select_own" ON public.team_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "team_members_select_admin" ON public.team_members FOR SELECT USING (auth.role() = 'authenticated' AND user_has_role('Admin'));
CREATE POLICY "team_members_update_own" ON public.team_members FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "team_members_update_admin" ON public.team_members FOR UPDATE USING (auth.role() = 'authenticated' AND user_has_role('Admin'));
CREATE POLICY "team_members_insert" ON public.team_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "team_members_delete_admin" ON public.team_members FOR DELETE USING (auth.role() = 'authenticated' AND user_has_role('Admin'));

-- Activity Logs
DROP POLICY IF EXISTS "activity_logs_select" ON public.activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert" ON public.activity_logs;
CREATE POLICY "activity_logs_select" ON public.activity_logs FOR SELECT USING (auth.role() = 'authenticated' AND user_has_any_role(ARRAY['Admin', 'Manager']));
CREATE POLICY "activity_logs_insert" ON public.activity_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Invitations
DROP POLICY IF EXISTS "invitations_select" ON public.invitations;
DROP POLICY IF EXISTS "invitations_update" ON public.invitations;
CREATE POLICY "invitations_select" ON public.invitations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "invitations_update" ON public.invitations FOR UPDATE USING (auth.role() = 'authenticated');
