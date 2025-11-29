-- Check authentication users and team members
-- Run this in Supabase SQL Editor

-- View auth users (system table)
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at
FROM auth.users;

-- View team members (your custom table)
SELECT 
    id,
    user_id,
    email,
    name,
    role,
    created_at
FROM public.team_members;

-- Join both tables to see complete user info
SELECT 
    au.id as auth_id,
    au.email as auth_email,
    au.created_at as auth_created,
    tm.id as team_id,
    tm.name,
    tm.role,
    tm.created_at as team_created
FROM auth.users au
LEFT JOIN public.team_members tm ON au.id = tm.user_id;