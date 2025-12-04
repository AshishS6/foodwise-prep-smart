-- ============================================================================
-- QUICK FIX: Fix the "SET is not allowed in a non-volatile function" error
-- ============================================================================
-- This fixes the helper functions by moving SET search_path outside the function body
-- ============================================================================

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM team_members WHERE user_id = auth.uid();
$$;

-- Fix user_has_role function
CREATE OR REPLACE FUNCTION public.user_has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_current_user_role() = required_role;
$$;

-- Fix user_has_any_role function
CREATE OR REPLACE FUNCTION public.user_has_any_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_current_user_role() = ANY(required_roles);
$$;
