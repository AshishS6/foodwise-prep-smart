-- ============================================================
-- Demo User Setup
-- Run this AFTER creating auth users in Supabase Dashboard.
--
-- STEP 1: Go to Authentication > Users > "Add user" and create:
--   Email: admin@foodwise.demo      Password: FoodWise@2024
--   Email: manager@foodwise.demo    Password: FoodWise@2024
--   Email: kitchen@foodwise.demo    Password: FoodWise@2024
--   Email: cashier@foodwise.demo    Password: FoodWise@2024
--   (Enable "Auto Confirm User" for each)
--
-- STEP 2: Run this SQL in the SQL editor.
-- ============================================================

INSERT INTO public.team_members (user_id, email, name, role)
VALUES
  (
    (SELECT id FROM auth.users WHERE email = 'admin@foodwise.demo'),
    'admin@foodwise.demo',
    'Aryan Kapoor',
    'Admin'
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'manager@foodwise.demo'),
    'manager@foodwise.demo',
    'Priya Nair',
    'Manager'
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'kitchen@foodwise.demo'),
    'kitchen@foodwise.demo',
    'Ravi Kumar',
    'Kitchen Staff'
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'cashier@foodwise.demo'),
    'cashier@foodwise.demo',
    'Deepa Sharma',
    'Cashier'
  )
ON CONFLICT (email) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Verify
SELECT name, email, role FROM team_members
WHERE email LIKE '%@foodwise.demo'
ORDER BY role;
