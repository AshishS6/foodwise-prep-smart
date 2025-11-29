-- Add missing users to team_members table
-- First, let's see what users exist in auth but not in team_members

SELECT 
    au.id,
    au.email,
    au.created_at,
    tm.id as team_member_id
FROM auth.users au
LEFT JOIN public.team_members tm ON au.id = tm.user_id
WHERE tm.id IS NULL;

-- Add the missing users (replace with actual user IDs from above query)
-- You'll need to get the actual user IDs from the query above

-- Example - replace with actual data:
-- INSERT INTO public.team_members (user_id, email, role, name)
-- SELECT 
--     id as user_id,
--     email,
--     'Cashier' as role,
--     split_part(email, '@', 1) as name
-- FROM auth.users 
-- WHERE email IN ('ashish.s@bankopen.co', 'humnlabel@gmail.com')
-- AND id NOT IN (SELECT user_id FROM public.team_members WHERE user_id IS NOT NULL);

-- Or manually insert if you know the user IDs:
-- INSERT INTO public.team_members (user_id, email, role, name) VALUES
-- ('user-id-1', 'ashish.s@bankopen.co', 'Admin', 'Ashish'),
-- ('user-id-2', 'humnlabel@gmail.com', 'Manager', 'User');

-- Check the result
SELECT 
    tm.email,
    tm.role,
    tm.name,
    tm.created_at
FROM public.team_members tm
ORDER BY tm.created_at DESC;