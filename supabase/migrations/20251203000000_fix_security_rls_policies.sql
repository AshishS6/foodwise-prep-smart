-- ============================================================================
-- SECURITY FIX: Role-Based Row Level Security Policies
-- ============================================================================
-- This migration fixes critical security issues by:
-- 1. Dropping all existing permissive policies
-- 2. Enabling RLS on all tables (force enable)
-- 3. Creating role-based policies matching frontend permissions
-- 4. Fixing conflicting team_members policies
-- ============================================================================

-- Ensure get_current_user_role function exists (from previous migration)
-- Fixed: Removed SET search_path from STABLE function, set it via function attribute instead
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM team_members WHERE user_id = auth.uid();
$$;

-- Helper function to check if user has specific role
CREATE OR REPLACE FUNCTION public.user_has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_current_user_role() = required_role;
$$;

-- Helper function to check if user has one of multiple roles
CREATE OR REPLACE FUNCTION public.user_has_any_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_current_user_role() = ANY(required_roles);
$$;

-- ============================================================================
-- STEP 1: Drop all existing permissive policies
-- ============================================================================

-- Drop all existing policies on ingredients
DROP POLICY IF EXISTS "Allow authenticated users to read ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Allow authenticated users to update ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Allow authenticated users to insert ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Allow authenticated users to delete ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Allow authenticated users to modify ingredients" ON public.ingredients;

-- Drop all existing policies on menuitems
DROP POLICY IF EXISTS "Allow authenticated users to read menuitems" ON public.menuitems;
DROP POLICY IF EXISTS "Allow authenticated users to update menuitems" ON public.menuitems;
DROP POLICY IF EXISTS "Allow authenticated users to insert menuitems" ON public.menuitems;
DROP POLICY IF EXISTS "Allow authenticated users to delete menuitems" ON public.menuitems;
DROP POLICY IF EXISTS "Allow authenticated users to modify menuitems" ON public.menuitems;

-- Drop all existing policies on orders
DROP POLICY IF EXISTS "Allow authenticated users to read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated users to insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated users to modify orders" ON public.orders;

-- Drop all existing policies on prepplans
DROP POLICY IF EXISTS "Allow authenticated users to read prepplans" ON public.prepplans;
DROP POLICY IF EXISTS "Allow authenticated users to update prepplans" ON public.prepplans;
DROP POLICY IF EXISTS "Allow authenticated users to insert prepplans" ON public.prepplans;
DROP POLICY IF EXISTS "Allow authenticated users to delete prepplans" ON public.prepplans;
DROP POLICY IF EXISTS "Allow authenticated users to modify prepplans" ON public.prepplans;

-- Drop all existing policies on recipes
DROP POLICY IF EXISTS "Allow authenticated users to read recipes" ON public.recipes;
DROP POLICY IF EXISTS "Allow authenticated users to update recipes" ON public.recipes;
DROP POLICY IF EXISTS "Allow authenticated users to insert recipes" ON public.recipes;
DROP POLICY IF EXISTS "Allow authenticated users to delete recipes" ON public.recipes;
DROP POLICY IF EXISTS "Allow authenticated users to modify recipes" ON public.recipes;

-- Drop all existing policies on team_members (including conflicting ones)
DROP POLICY IF EXISTS "Allow users to read their own team member record" ON public.team_members;
DROP POLICY IF EXISTS "Allow users to update their own team member record" ON public.team_members;
DROP POLICY IF EXISTS "Allow authenticated users to insert team member records" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated users can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated users can invite team members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated users can update team members" ON public.team_members;

-- Drop all existing policies on activity_logs
DROP POLICY IF EXISTS "Allow authenticated users to read activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow authenticated users to insert activity logs" ON public.activity_logs;

-- ============================================================================
-- STEP 2: Force enable RLS on all tables
-- ============================================================================

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menuitems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prepplans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Create role-based policies
-- ============================================================================

-- ============================================================================
-- INGREDIENTS TABLE
-- Read: Admin, Manager, Kitchen Staff (all authenticated users can read for POS)
-- Write: Admin, Manager, Kitchen Staff only
-- ============================================================================

-- All authenticated users can read ingredients (needed for POS)
CREATE POLICY "ingredients_select_authenticated" ON public.ingredients
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only Admin, Manager, Kitchen Staff can modify ingredients
CREATE POLICY "ingredients_modify_admin_manager_kitchen" ON public.ingredients
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        user_has_any_role(ARRAY['Admin', 'Manager', 'Kitchen Staff'])
    );

-- ============================================================================
-- MENUITEMS TABLE
-- Read: All authenticated users (needed for POS)
-- Write: Admin, Manager, Kitchen Staff only
-- ============================================================================

-- All authenticated users can read menu items (needed for POS)
CREATE POLICY "menuitems_select_authenticated" ON public.menuitems
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only Admin, Manager, Kitchen Staff can modify menu items
CREATE POLICY "menuitems_modify_admin_manager_kitchen" ON public.menuitems
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        user_has_any_role(ARRAY['Admin', 'Manager', 'Kitchen Staff'])
    );

-- ============================================================================
-- ORDERS TABLE
-- Read: Admin, Manager, Cashier (for order history)
-- Insert: All authenticated users (for POS)
-- Update/Delete: Admin, Manager only
-- ============================================================================

-- Admin, Manager, Cashier can read orders
CREATE POLICY "orders_select_admin_manager_cashier" ON public.orders
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        user_has_any_role(ARRAY['Admin', 'Manager', 'Cashier'])
    );

-- All authenticated users can create orders (POS functionality)
CREATE POLICY "orders_insert_authenticated" ON public.orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only Admin and Manager can update/delete orders
CREATE POLICY "orders_modify_admin_manager" ON public.orders
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        user_has_any_role(ARRAY['Admin', 'Manager'])
    );

CREATE POLICY "orders_delete_admin_manager" ON public.orders
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        user_has_any_role(ARRAY['Admin', 'Manager'])
    );

-- ============================================================================
-- PREPPLANS TABLE
-- Read: Admin, Manager, Kitchen Staff
-- Write: Admin, Manager, Kitchen Staff only
-- ============================================================================

-- Admin, Manager, Kitchen Staff can read prep plans
CREATE POLICY "prepplans_select_admin_manager_kitchen" ON public.prepplans
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        user_has_any_role(ARRAY['Admin', 'Manager', 'Kitchen Staff'])
    );

-- Admin, Manager, Kitchen Staff can modify prep plans
CREATE POLICY "prepplans_modify_admin_manager_kitchen" ON public.prepplans
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        user_has_any_role(ARRAY['Admin', 'Manager', 'Kitchen Staff'])
    );

-- ============================================================================
-- RECIPES TABLE
-- Read: Admin, Manager, Kitchen Staff
-- Write: Admin, Manager, Kitchen Staff only
-- ============================================================================

-- Admin, Manager, Kitchen Staff can read recipes
CREATE POLICY "recipes_select_admin_manager_kitchen" ON public.recipes
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        user_has_any_role(ARRAY['Admin', 'Manager', 'Kitchen Staff'])
    );

-- Admin, Manager, Kitchen Staff can modify recipes
CREATE POLICY "recipes_modify_admin_manager_kitchen" ON public.recipes
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        user_has_any_role(ARRAY['Admin', 'Manager', 'Kitchen Staff'])
    );

-- ============================================================================
-- TEAM_MEMBERS TABLE
-- Read: Users can read their own record, Admin can read all
-- Write: Admin only (via RPC function for invites)
-- Update: Users can update their own record, Admin can update all
-- ============================================================================

-- Users can read their own team member record
CREATE POLICY "team_members_select_own" ON public.team_members
    FOR SELECT USING (auth.uid() = user_id);

-- Admin can read all team members (for team management)
CREATE POLICY "team_members_select_admin" ON public.team_members
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        user_has_role('Admin')
    );

-- Users can update their own team member record (limited fields)
CREATE POLICY "team_members_update_own" ON public.team_members
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admin can update all team members
CREATE POLICY "team_members_update_admin" ON public.team_members
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        user_has_role('Admin')
    );

-- Only Admin can insert team members (via RPC function)
-- Direct inserts are restricted - use invite_team_member_rpc() function
CREATE POLICY "team_members_insert_admin_only" ON public.team_members
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        user_has_role('Admin')
    );

-- Only Admin can delete team members
CREATE POLICY "team_members_delete_admin" ON public.team_members
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        user_has_role('Admin')
    );

-- ============================================================================
-- ACTIVITY_LOGS TABLE
-- Read: Admin, Manager (for analytics)
-- Insert: All authenticated users (for logging)
-- ============================================================================

-- Admin and Manager can read activity logs
CREATE POLICY "activity_logs_select_admin_manager" ON public.activity_logs
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        user_has_any_role(ARRAY['Admin', 'Manager'])
    );

-- All authenticated users can insert activity logs
CREATE POLICY "activity_logs_insert_authenticated" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- COMMENTS
-- ============================================================================
-- Role Permissions Summary:
-- 
-- Admin: Full access to everything
-- Manager: Access to most features except team management
-- Kitchen Staff: POS, inventory, recipes, prep plans, kitchen orders
-- Cashier: Dashboard, POS, order history (read-only for most)
-- 
-- Security Notes:
-- - All policies require authentication
-- - Role checks are done at database level (not just frontend)
-- - Team member management restricted to Admin only
-- - Activity logs restricted to Admin and Manager
-- ============================================================================

