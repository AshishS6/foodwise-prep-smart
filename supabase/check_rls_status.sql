-- ============================================================================
-- DIAGNOSTIC: Check RLS status and policies
-- ============================================================================
-- Run this to check if RLS is enabled and what policies exist
-- ============================================================================

-- Check if RLS is enabled on each table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('ingredients', 'menuitems', 'orders', 'prepplans', 'recipes', 'team_members', 'activity_logs')
ORDER BY tablename;

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('ingredients', 'menuitems', 'orders', 'prepplans', 'recipes', 'team_members', 'activity_logs')
ORDER BY tablename, policyname;

-- Check if helper functions exist
SELECT 
    proname as function_name,
    provolatile as volatility,
    prosecdef as security_definer
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
    AND proname IN ('get_current_user_role', 'user_has_role', 'user_has_any_role');

-- Test get_current_user_role function (run as authenticated user)
-- SELECT get_current_user_role();
