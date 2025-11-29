-- Check what users exist in team_members table
SELECT 
    tm.id,
    tm.user_id,
    tm.email,
    tm.name,
    tm.role,
    tm.created_at,
    au.email as auth_email,
    au.email_confirmed_at
FROM public.team_members tm
FULL OUTER JOIN auth.users au ON tm.user_id = au.id
ORDER BY tm.created_at DESC;

-- Check if the trigger is working
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
ORDER BY created_at DESC;