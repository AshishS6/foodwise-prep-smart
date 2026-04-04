-- ============================================================
-- FoodWise Demo Seed Data
-- Run this in Supabase SQL Editor after creating a new project.
-- NOTE: Sign up your admin account in the app first, then run
--       the UPDATE at the bottom to give yourself Admin role.
-- ============================================================

-- ============================================================
-- 1. INGREDIENTS
-- ============================================================
INSERT INTO ingredients (name, stock, unit) VALUES
  ('Basmati Rice', 25, 'kg'),
  ('Chicken', 15, 'kg'),
  ('Paneer', 8, 'kg'),
  ('Tomatoes', 12, 'kg'),
  ('Onions', 18, 'kg'),
  ('Ginger', 2, 'kg'),
  ('Garlic', 2, 'kg'),
  ('Heavy Cream', 6, 'litre'),
  ('Butter', 4, 'kg'),
  ('Dal (Lentils)', 10, 'kg'),
  ('Chickpeas', 8, 'kg'),
  ('Spinach', 5, 'kg'),
  ('Mutton', 6, 'kg'),
  ('Flour (Maida)', 15, 'kg'),
  ('Milk', 10, 'litre'),
  ('Sugar', 8, 'kg'),
  ('Ghee', 3, 'litre'),
  ('Cardamom', 0.5, 'kg'),
  ('Mango Pulp', 4, 'litre'),
  ('Yogurt', 5, 'kg');


-- ============================================================
-- 2. MENU ITEMS
-- ============================================================
INSERT INTO menuitems (name, category, price, halfprice, supportshalf, portions) VALUES
  -- Starters
  ('Chicken Tikka',        'Starters',   220, 130, true,  '[{"label":"Full","price":220,"unit":"plate","multiplier":1},{"label":"Half","price":130,"unit":"plate","multiplier":0.5}]'::jsonb),
  ('Paneer Tikka',         'Starters',   190, 110, true,  '[{"label":"Full","price":190,"unit":"plate","multiplier":1},{"label":"Half","price":110,"unit":"plate","multiplier":0.5}]'::jsonb),
  ('Veg Samosa (2 pcs)',   'Starters',    60, null, false, '[{"label":"Full","price":60,"unit":"plate","multiplier":1}]'::jsonb),
  ('Hara Bhara Kabab',     'Starters',   150, null, false, '[{"label":"Full","price":150,"unit":"plate","multiplier":1}]'::jsonb),
  ('Chicken Soup',         'Starters',   120, null, false, '[{"label":"Full","price":120,"unit":"bowl","multiplier":1}]'::jsonb),

  -- Main Course
  ('Butter Chicken',       'Main Course', 320, 180, true,  '[{"label":"Full","price":320,"unit":"plate","multiplier":1},{"label":"Half","price":180,"unit":"plate","multiplier":0.5}]'::jsonb),
  ('Paneer Butter Masala', 'Main Course', 280, 160, true,  '[{"label":"Full","price":280,"unit":"plate","multiplier":1},{"label":"Half","price":160,"unit":"plate","multiplier":0.5}]'::jsonb),
  ('Dal Makhani',          'Main Course', 220, 130, true,  '[{"label":"Full","price":220,"unit":"plate","multiplier":1},{"label":"Half","price":130,"unit":"plate","multiplier":0.5}]'::jsonb),
  ('Chole Bhature',        'Main Course', 180, null, false, '[{"label":"Full","price":180,"unit":"plate","multiplier":1}]'::jsonb),
  ('Mutton Rogan Josh',    'Main Course', 380, 210, true,  '[{"label":"Full","price":380,"unit":"plate","multiplier":1},{"label":"Half","price":210,"unit":"plate","multiplier":0.5}]'::jsonb),
  ('Palak Paneer',         'Main Course', 260, 150, true,  '[{"label":"Full","price":260,"unit":"plate","multiplier":1},{"label":"Half","price":150,"unit":"plate","multiplier":0.5}]'::jsonb),
  ('Chicken Biryani',      'Main Course', 340, null, false, '[{"label":"Full","price":340,"unit":"plate","multiplier":1}]'::jsonb),
  ('Veg Biryani',          'Main Course', 250, null, false, '[{"label":"Full","price":250,"unit":"plate","multiplier":1}]'::jsonb),
  ('Butter Naan',          'Main Course',  40, null, false, '[{"label":"Piece","price":40,"unit":"piece","multiplier":1}]'::jsonb),
  ('Garlic Naan',          'Main Course',  50, null, false, '[{"label":"Piece","price":50,"unit":"piece","multiplier":1}]'::jsonb),
  ('Jeera Rice',           'Main Course',  80, null, false, '[{"label":"Full","price":80,"unit":"plate","multiplier":1}]'::jsonb),

  -- Desserts
  ('Gulab Jamun (2 pcs)',  'Desserts',    80, null, false, '[{"label":"Full","price":80,"unit":"plate","multiplier":1}]'::jsonb),
  ('Kheer',                'Desserts',   100, null, false, '[{"label":"Full","price":100,"unit":"bowl","multiplier":1}]'::jsonb),
  ('Rasgulla (2 pcs)',     'Desserts',    70, null, false, '[{"label":"Full","price":70,"unit":"plate","multiplier":1}]'::jsonb),
  ('Mango Kulfi',          'Desserts',    90, null, false, '[{"label":"Full","price":90,"unit":"piece","multiplier":1}]'::jsonb),

  -- Beverages
  ('Mango Lassi',          'Beverages',   90, null, false, '[{"label":"Glass","price":90,"unit":"glass","multiplier":1}]'::jsonb),
  ('Sweet Lassi',          'Beverages',   70, null, false, '[{"label":"Glass","price":70,"unit":"glass","multiplier":1}]'::jsonb),
  ('Masala Chai',          'Beverages',   40, null, false, '[{"label":"Cup","price":40,"unit":"cup","multiplier":1}]'::jsonb),
  ('Fresh Lime Soda',      'Beverages',   60, null, false, '[{"label":"Glass","price":60,"unit":"glass","multiplier":1}]'::jsonb),
  ('Cold Coffee',          'Beverages',  100, null, false, '[{"label":"Glass","price":100,"unit":"glass","multiplier":1}]'::jsonb);


-- ============================================================
-- 3. RECIPES (menu item → ingredients)
-- ============================================================
-- Butter Chicken (id=6)
INSERT INTO recipes (menuitemid, ingredientid, quantity) VALUES
  (6, 2, 0.30),
  (6, 4, 0.10),
  (6, 5, 0.08),
  (6, 8, 0.05),
  (6, 9, 0.02),
  (6, 6, 0.01),
  (6, 7, 0.01);

-- Paneer Butter Masala (id=7)
INSERT INTO recipes (menuitemid, ingredientid, quantity) VALUES
  (7, 3, 0.25),
  (7, 4, 0.12),
  (7, 8, 0.05),
  (7, 9, 0.02);

-- Dal Makhani (id=8)
INSERT INTO recipes (menuitemid, ingredientid, quantity) VALUES
  (8, 10, 0.20),
  (8, 9,  0.03),
  (8, 8,  0.03),
  (8, 5,  0.05);

-- Chicken Biryani (id=12)
INSERT INTO recipes (menuitemid, ingredientid, quantity) VALUES
  (12, 1,  0.25),
  (12, 2,  0.30),
  (12, 5,  0.08),
  (12, 20, 0.05);

-- Palak Paneer (id=11)
INSERT INTO recipes (menuitemid, ingredientid, quantity) VALUES
  (11, 3,  0.20),
  (11, 12, 0.15),
  (11, 5,  0.06),
  (11, 8,  0.03);

-- Mutton Rogan Josh (id=10)
INSERT INTO recipes (menuitemid, ingredientid, quantity) VALUES
  (10, 13, 0.35),
  (10, 5,  0.10),
  (10, 20, 0.08),
  (10, 4,  0.08);

-- Kheer (id=18)
INSERT INTO recipes (menuitemid, ingredientid, quantity) VALUES
  (18, 15, 0.30),
  (18, 1,  0.05),
  (18, 16, 0.04),
  (18, 18, 0.002);

-- Mango Lassi (id=21)
INSERT INTO recipes (menuitemid, ingredientid, quantity) VALUES
  (21, 20, 0.15),
  (21, 19, 0.10),
  (21, 16, 0.02);


-- ============================================================
-- 4. ORDERS — 30 days of realistic data
-- Weekends have higher volume, lunch & dinner peaks
-- ============================================================

-- Day 1 (today)
INSERT INTO orders (items, total, timestamp) VALUES
  ('[{"id":6,"name":"Butter Chicken","price":320,"quantity":2,"total":640},{"id":14,"name":"Butter Naan","price":40,"quantity":4,"total":160}]'::json, 800, NOW() - INTERVAL '2 hours'),
  ('[{"id":7,"name":"Paneer Butter Masala","price":280,"quantity":1,"total":280},{"id":21,"name":"Mango Lassi","price":90,"quantity":2,"total":180}]'::json, 460, NOW() - INTERVAL '3 hours'),
  ('[{"id":12,"name":"Chicken Biryani","price":340,"quantity":2,"total":680},{"id":23,"name":"Masala Chai","price":40,"quantity":2,"total":80}]'::json, 760, NOW() - INTERVAL '4 hours'),
  ('[{"id":1,"name":"Chicken Tikka","price":220,"quantity":1,"total":220},{"id":6,"name":"Butter Chicken","price":320,"quantity":1,"total":320},{"id":16,"name":"Jeera Rice","price":80,"quantity":1,"total":80}]'::json, 620, NOW() - INTERVAL '5 hours');

-- Day 2
INSERT INTO orders (items, total, timestamp) VALUES
  ('[{"id":6,"name":"Butter Chicken","price":320,"quantity":1,"total":320},{"id":7,"name":"Paneer Butter Masala","price":280,"quantity":1,"total":280},{"id":14,"name":"Butter Naan","price":40,"quantity":2,"total":80}]'::json, 680, NOW() - INTERVAL '1 day 1 hour'),
  ('[{"id":10,"name":"Mutton Rogan Josh","price":380,"quantity":2,"total":760},{"id":15,"name":"Garlic Naan","price":50,"quantity":3,"total":150},{"id":21,"name":"Mango Lassi","price":90,"quantity":2,"total":180}]'::json, 1090, NOW() - INTERVAL '1 day 2 hours'),
  ('[{"id":11,"name":"Palak Paneer","price":260,"quantity":1,"total":260},{"id":8,"name":"Dal Makhani","price":220,"quantity":1,"total":220},{"id":16,"name":"Jeera Rice","price":80,"quantity":2,"total":160}]'::json, 640, NOW() - INTERVAL '1 day 5 hours'),
  ('[{"id":12,"name":"Chicken Biryani","price":340,"quantity":1,"total":340},{"id":17,"name":"Gulab Jamun (2 pcs)","price":80,"quantity":1,"total":80}]'::json, 420, NOW() - INTERVAL '1 day 7 hours'),
  ('[{"id":2,"name":"Paneer Tikka","price":190,"quantity":1,"total":190},{"id":13,"name":"Veg Biryani","price":250,"quantity":1,"total":250},{"id":22,"name":"Sweet Lassi","price":70,"quantity":1,"total":70}]'::json, 510, NOW() - INTERVAL '1 day 9 hours');

-- Day 3
INSERT INTO orders (items, total, timestamp) VALUES
  ('[{"id":6,"name":"Butter Chicken","price":320,"quantity":3,"total":960},{"id":14,"name":"Butter Naan","price":40,"quantity":6,"total":240}]'::json, 1200, NOW() - INTERVAL '2 days 1 hour'),
  ('[{"id":9,"name":"Chole Bhature","price":180,"quantity":2,"total":360},{"id":23,"name":"Masala Chai","price":40,"quantity":2,"total":80}]'::json, 440, NOW() - INTERVAL '2 days 3 hours'),
  ('[{"id":1,"name":"Chicken Tikka","price":220,"quantity":2,"total":440},{"id":10,"name":"Mutton Rogan Josh","price":380,"quantity":1,"total":380},{"id":21,"name":"Mango Lassi","price":90,"quantity":2,"total":180}]'::json, 1000, NOW() - INTERVAL '2 days 6 hours'),
  ('[{"id":20,"name":"Mango Kulfi","price":90,"quantity":3,"total":270},{"id":23,"name":"Masala Chai","price":40,"quantity":3,"total":120}]'::json, 390, NOW() - INTERVAL '2 days 8 hours');

-- Day 4
INSERT INTO orders (items, total, timestamp) VALUES
  ('[{"id":7,"name":"Paneer Butter Masala","price":280,"quantity":2,"total":560},{"id":11,"name":"Palak Paneer","price":260,"quantity":1,"total":260},{"id":14,"name":"Butter Naan","price":40,"quantity":4,"total":160}]'::json, 980, NOW() - INTERVAL '3 days 2 hours'),
  ('[{"id":12,"name":"Chicken Biryani","price":340,"quantity":2,"total":680},{"id":5,"name":"Chicken Soup","price":120,"quantity":2,"total":240}]'::json, 920, NOW() - INTERVAL '3 days 4 hours'),
  ('[{"id":8,"name":"Dal Makhani","price":220,"quantity":2,"total":440},{"id":16,"name":"Jeera Rice","price":80,"quantity":2,"total":160},{"id":24,"name":"Fresh Lime Soda","price":60,"quantity":2,"total":120}]'::json, 720, NOW() - INTERVAL '3 days 7 hours');

-- Day 5
INSERT INTO orders (items, total, timestamp) VALUES
  ('[{"id":6,"name":"Butter Chicken","price":320,"quantity":2,"total":640},{"id":10,"name":"Mutton Rogan Josh","price":380,"quantity":1,"total":380},{"id":15,"name":"Garlic Naan","price":50,"quantity":4,"total":200}]'::json, 1220, NOW() - INTERVAL '4 days 1 hour'),
  ('[{"id":2,"name":"Paneer Tikka","price":190,"quantity":2,"total":380},{"id":7,"name":"Paneer Butter Masala","price":280,"quantity":1,"total":280},{"id":22,"name":"Sweet Lassi","price":70,"quantity":2,"total":140}]'::json, 800, NOW() - INTERVAL '4 days 3 hours'),
  ('[{"id":13,"name":"Veg Biryani","price":250,"quantity":2,"total":500},{"id":18,"name":"Kheer","price":100,"quantity":2,"total":200}]'::json, 700, NOW() - INTERVAL '4 days 6 hours'),
  ('[{"id":9,"name":"Chole Bhature","price":180,"quantity":3,"total":540},{"id":23,"name":"Masala Chai","price":40,"quantity":3,"total":120}]'::json, 660, NOW() - INTERVAL '4 days 8 hours');

-- Day 6 (weekend)
INSERT INTO orders (items, total, timestamp) VALUES
  ('[{"id":6,"name":"Butter Chicken","price":320,"quantity":2,"total":640},{"id":1,"name":"Chicken Tikka","price":220,"quantity":2,"total":440},{"id":14,"name":"Butter Naan","price":40,"quantity":4,"total":160},{"id":21,"name":"Mango Lassi","price":90,"quantity":2,"total":180}]'::json, 1420, NOW() - INTERVAL '5 days 1 hour'),
  ('[{"id":10,"name":"Mutton Rogan Josh","price":380,"quantity":2,"total":760},{"id":12,"name":"Chicken Biryani","price":340,"quantity":2,"total":680},{"id":15,"name":"Garlic Naan","price":50,"quantity":4,"total":200}]'::json, 1640, NOW() - INTERVAL '5 days 2 hours'),
  ('[{"id":7,"name":"Paneer Butter Masala","price":280,"quantity":2,"total":560},{"id":11,"name":"Palak Paneer","price":260,"quantity":1,"total":260},{"id":13,"name":"Veg Biryani","price":250,"quantity":1,"total":250},{"id":22,"name":"Sweet Lassi","price":70,"quantity":2,"total":140}]'::json, 1210, NOW() - INTERVAL '5 days 3 hours'),
  ('[{"id":2,"name":"Paneer Tikka","price":190,"quantity":1,"total":190},{"id":6,"name":"Butter Chicken","price":320,"quantity":1,"total":320},{"id":8,"name":"Dal Makhani","price":220,"quantity":1,"total":220}]'::json, 730, NOW() - INTERVAL '5 days 5 hours'),
  ('[{"id":20,"name":"Mango Kulfi","price":90,"quantity":4,"total":360},{"id":17,"name":"Gulab Jamun (2 pcs)","price":80,"quantity":2,"total":160},{"id":23,"name":"Masala Chai","price":40,"quantity":4,"total":160}]'::json, 680, NOW() - INTERVAL '5 days 7 hours'),
  ('[{"id":12,"name":"Chicken Biryani","price":340,"quantity":1,"total":340},{"id":5,"name":"Chicken Soup","price":120,"quantity":1,"total":120},{"id":24,"name":"Fresh Lime Soda","price":60,"quantity":2,"total":120}]'::json, 580, NOW() - INTERVAL '5 days 8 hours');

-- Day 7 (weekend)
INSERT INTO orders (items, total, timestamp) VALUES
  ('[{"id":6,"name":"Butter Chicken","price":320,"quantity":3,"total":960},{"id":14,"name":"Butter Naan","price":40,"quantity":6,"total":240},{"id":21,"name":"Mango Lassi","price":90,"quantity":3,"total":270}]'::json, 1470, NOW() - INTERVAL '6 days 1 hour'),
  ('[{"id":10,"name":"Mutton Rogan Josh","price":380,"quantity":2,"total":760},{"id":1,"name":"Chicken Tikka","price":220,"quantity":2,"total":440},{"id":15,"name":"Garlic Naan","price":50,"quantity":4,"total":200}]'::json, 1400, NOW() - INTERVAL '6 days 2 hours'),
  ('[{"id":9,"name":"Chole Bhature","price":180,"quantity":2,"total":360},{"id":7,"name":"Paneer Butter Masala","price":280,"quantity":2,"total":560},{"id":22,"name":"Sweet Lassi","price":70,"quantity":2,"total":140}]'::json, 1060, NOW() - INTERVAL '6 days 4 hours'),
  ('[{"id":12,"name":"Chicken Biryani","price":340,"quantity":2,"total":680},{"id":18,"name":"Kheer","price":100,"quantity":2,"total":200},{"id":25,"name":"Cold Coffee","price":100,"quantity":2,"total":200}]'::json, 1080, NOW() - INTERVAL '6 days 6 hours'),
  ('[{"id":11,"name":"Palak Paneer","price":260,"quantity":1,"total":260},{"id":8,"name":"Dal Makhani","price":220,"quantity":1,"total":220},{"id":16,"name":"Jeera Rice","price":80,"quantity":2,"total":160}]'::json, 640, NOW() - INTERVAL '6 days 8 hours');

-- Days 8–13
INSERT INTO orders (items, total, timestamp) VALUES
  ('[{"id":6,"name":"Butter Chicken","price":320,"quantity":1,"total":320},{"id":14,"name":"Butter Naan","price":40,"quantity":2,"total":80}]'::json, 400, NOW() - INTERVAL '7 days 2 hours'),
  ('[{"id":7,"name":"Paneer Butter Masala","price":280,"quantity":2,"total":560},{"id":21,"name":"Mango Lassi","price":90,"quantity":1,"total":90}]'::json, 650, NOW() - INTERVAL '7 days 5 hours'),
  ('[{"id":12,"name":"Chicken Biryani","price":340,"quantity":1,"total":340},{"id":5,"name":"Chicken Soup","price":120,"quantity":1,"total":120}]'::json, 460, NOW() - INTERVAL '8 days 1 hour'),
  ('[{"id":10,"name":"Mutton Rogan Josh","price":380,"quantity":1,"total":380},{"id":15,"name":"Garlic Naan","price":50,"quantity":2,"total":100}]'::json, 480, NOW() - INTERVAL '8 days 4 hours'),
  ('[{"id":8,"name":"Dal Makhani","price":220,"quantity":2,"total":440},{"id":16,"name":"Jeera Rice","price":80,"quantity":2,"total":160},{"id":23,"name":"Masala Chai","price":40,"quantity":2,"total":80}]'::json, 680, NOW() - INTERVAL '9 days 2 hours'),
  ('[{"id":6,"name":"Butter Chicken","price":320,"quantity":2,"total":640},{"id":7,"name":"Paneer Butter Masala","price":280,"quantity":1,"total":280},{"id":14,"name":"Butter Naan","price":40,"quantity":3,"total":120}]'::json, 1040, NOW() - INTERVAL '9 days 5 hours'),
  ('[{"id":9,"name":"Chole Bhature","price":180,"quantity":2,"total":360},{"id":22,"name":"Sweet Lassi","price":70,"quantity":2,"total":140}]'::json, 500, NOW() - INTERVAL '10 days 3 hours'),
  ('[{"id":1,"name":"Chicken Tikka","price":220,"quantity":2,"total":440},{"id":6,"name":"Butter Chicken","price":320,"quantity":1,"total":320},{"id":21,"name":"Mango Lassi","price":90,"quantity":2,"total":180}]'::json, 940, NOW() - INTERVAL '10 days 6 hours'),
  ('[{"id":11,"name":"Palak Paneer","price":260,"quantity":2,"total":520},{"id":13,"name":"Veg Biryani","price":250,"quantity":1,"total":250}]'::json, 770, NOW() - INTERVAL '11 days 2 hours'),
  ('[{"id":12,"name":"Chicken Biryani","price":340,"quantity":2,"total":680},{"id":20,"name":"Mango Kulfi","price":90,"quantity":2,"total":180}]'::json, 860, NOW() - INTERVAL '11 days 5 hours'),
  ('[{"id":6,"name":"Butter Chicken","price":320,"quantity":2,"total":640},{"id":10,"name":"Mutton Rogan Josh","price":380,"quantity":1,"total":380},{"id":15,"name":"Garlic Naan","price":50,"quantity":3,"total":150}]'::json, 1170, NOW() - INTERVAL '12 days 1 hour'),
  ('[{"id":2,"name":"Paneer Tikka","price":190,"quantity":1,"total":190},{"id":8,"name":"Dal Makhani","price":220,"quantity":1,"total":220},{"id":16,"name":"Jeera Rice","price":80,"quantity":1,"total":80}]'::json, 490, NOW() - INTERVAL '12 days 4 hours'),
  ('[{"id":7,"name":"Paneer Butter Masala","price":280,"quantity":2,"total":560},{"id":11,"name":"Palak Paneer","price":260,"quantity":1,"total":260},{"id":22,"name":"Sweet Lassi","price":70,"quantity":2,"total":140}]'::json, 960, NOW() - INTERVAL '13 days 3 hours'),
  ('[{"id":9,"name":"Chole Bhature","price":180,"quantity":1,"total":180},{"id":23,"name":"Masala Chai","price":40,"quantity":2,"total":80}]'::json, 260, NOW() - INTERVAL '13 days 6 hours');

-- Days 14–15 (weekend)
INSERT INTO orders (items, total, timestamp) VALUES
  ('[{"id":6,"name":"Butter Chicken","price":320,"quantity":3,"total":960},{"id":1,"name":"Chicken Tikka","price":220,"quantity":2,"total":440},{"id":14,"name":"Butter Naan","price":40,"quantity":5,"total":200},{"id":21,"name":"Mango Lassi","price":90,"quantity":3,"total":270}]'::json, 1870, NOW() - INTERVAL '14 days 1 hour'),
  ('[{"id":10,"name":"Mutton Rogan Josh","price":380,"quantity":2,"total":760},{"id":12,"name":"Chicken Biryani","price":340,"quantity":2,"total":680},{"id":15,"name":"Garlic Naan","price":50,"quantity":4,"total":200},{"id":18,"name":"Kheer","price":100,"quantity":2,"total":200}]'::json, 1840, NOW() - INTERVAL '14 days 3 hours'),
  ('[{"id":7,"name":"Paneer Butter Masala","price":280,"quantity":2,"total":560},{"id":13,"name":"Veg Biryani","price":250,"quantity":2,"total":500},{"id":11,"name":"Palak Paneer","price":260,"quantity":1,"total":260}]'::json, 1320, NOW() - INTERVAL '14 days 5 hours'),
  ('[{"id":6,"name":"Butter Chicken","price":320,"quantity":2,"total":640},{"id":8,"name":"Dal Makhani","price":220,"quantity":1,"total":220},{"id":16,"name":"Jeera Rice","price":80,"quantity":2,"total":160},{"id":25,"name":"Cold Coffee","price":100,"quantity":2,"total":200}]'::json, 1220, NOW() - INTERVAL '15 days 2 hours'),
  ('[{"id":2,"name":"Paneer Tikka","price":190,"quantity":2,"total":380},{"id":9,"name":"Chole Bhature","price":180,"quantity":2,"total":360},{"id":22,"name":"Sweet Lassi","price":70,"quantity":3,"total":210}]'::json, 950, NOW() - INTERVAL '15 days 4 hours'),
  ('[{"id":20,"name":"Mango Kulfi","price":90,"quantity":4,"total":360},{"id":17,"name":"Gulab Jamun (2 pcs)","price":80,"quantity":3,"total":240},{"id":23,"name":"Masala Chai","price":40,"quantity":4,"total":160}]'::json, 760, NOW() - INTERVAL '15 days 7 hours');

-- Days 16–22
INSERT INTO orders (items, total, timestamp) VALUES
  ('[{"id":6,"name":"Butter Chicken","price":320,"quantity":2,"total":640},{"id":14,"name":"Butter Naan","price":40,"quantity":3,"total":120}]'::json, 760, NOW() - INTERVAL '16 days 2 hours'),
  ('[{"id":12,"name":"Chicken Biryani","price":340,"quantity":1,"total":340},{"id":5,"name":"Chicken Soup","price":120,"quantity":1,"total":120},{"id":21,"name":"Mango Lassi","price":90,"quantity":1,"total":90}]'::json, 550, NOW() - INTERVAL '16 days 5 hours'),
  ('[{"id":11,"name":"Palak Paneer","price":260,"quantity":1,"total":260},{"id":8,"name":"Dal Makhani","price":220,"quantity":1,"total":220},{"id":16,"name":"Jeera Rice","price":80,"quantity":1,"total":80}]'::json, 560, NOW() - INTERVAL '17 days 3 hours'),
  ('[{"id":10,"name":"Mutton Rogan Josh","price":380,"quantity":1,"total":380},{"id":6,"name":"Butter Chicken","price":320,"quantity":1,"total":320},{"id":15,"name":"Garlic Naan","price":50,"quantity":3,"total":150}]'::json, 850, NOW() - INTERVAL '17 days 6 hours'),
  ('[{"id":7,"name":"Paneer Butter Masala","price":280,"quantity":2,"total":560},{"id":22,"name":"Sweet Lassi","price":70,"quantity":2,"total":140}]'::json, 700, NOW() - INTERVAL '18 days 2 hours'),
  ('[{"id":9,"name":"Chole Bhature","price":180,"quantity":2,"total":360},{"id":23,"name":"Masala Chai","price":40,"quantity":2,"total":80}]'::json, 440, NOW() - INTERVAL '18 days 4 hours'),
  ('[{"id":6,"name":"Butter Chicken","price":320,"quantity":1,"total":320},{"id":13,"name":"Veg Biryani","price":250,"quantity":1,"total":250},{"id":18,"name":"Kheer","price":100,"quantity":1,"total":100}]'::json, 670, NOW() - INTERVAL '19 days 3 hours'),
  ('[{"id":1,"name":"Chicken Tikka","price":220,"quantity":1,"total":220},{"id":12,"name":"Chicken Biryani","price":340,"quantity":1,"total":340}]'::json, 560, NOW() - INTERVAL '20 days 2 hours'),
  ('[{"id":7,"name":"Paneer Butter Masala","price":280,"quantity":1,"total":280},{"id":11,"name":"Palak Paneer","price":260,"quantity":1,"total":260},{"id":24,"name":"Fresh Lime Soda","price":60,"quantity":2,"total":120}]'::json, 660, NOW() - INTERVAL '21 days 4 hours');

-- Days 22–30
INSERT INTO orders (items, total, timestamp) VALUES
  ('[{"id":6,"name":"Butter Chicken","price":320,"quantity":2,"total":640},{"id":14,"name":"Butter Naan","price":40,"quantity":4,"total":160},{"id":21,"name":"Mango Lassi","price":90,"quantity":2,"total":180}]'::json, 980, NOW() - INTERVAL '22 days 2 hours'),
  ('[{"id":10,"name":"Mutton Rogan Josh","price":380,"quantity":1,"total":380},{"id":12,"name":"Chicken Biryani","price":340,"quantity":1,"total":340}]'::json, 720, NOW() - INTERVAL '23 days 3 hours'),
  ('[{"id":8,"name":"Dal Makhani","price":220,"quantity":2,"total":440},{"id":9,"name":"Chole Bhature","price":180,"quantity":1,"total":180},{"id":16,"name":"Jeera Rice","price":80,"quantity":2,"total":160}]'::json, 780, NOW() - INTERVAL '24 days 2 hours'),
  ('[{"id":7,"name":"Paneer Butter Masala","price":280,"quantity":2,"total":560},{"id":2,"name":"Paneer Tikka","price":190,"quantity":1,"total":190},{"id":22,"name":"Sweet Lassi","price":70,"quantity":2,"total":140}]'::json, 890, NOW() - INTERVAL '25 days 4 hours'),
  ('[{"id":6,"name":"Butter Chicken","price":320,"quantity":1,"total":320},{"id":11,"name":"Palak Paneer","price":260,"quantity":1,"total":260},{"id":23,"name":"Masala Chai","price":40,"quantity":2,"total":80}]'::json, 660, NOW() - INTERVAL '26 days 3 hours'),
  ('[{"id":12,"name":"Chicken Biryani","price":340,"quantity":2,"total":680},{"id":5,"name":"Chicken Soup","price":120,"quantity":2,"total":240},{"id":25,"name":"Cold Coffee","price":100,"quantity":2,"total":200}]'::json, 1120, NOW() - INTERVAL '27 days 2 hours'),
  ('[{"id":6,"name":"Butter Chicken","price":320,"quantity":2,"total":640},{"id":10,"name":"Mutton Rogan Josh","price":380,"quantity":1,"total":380},{"id":15,"name":"Garlic Naan","price":50,"quantity":3,"total":150}]'::json, 1170, NOW() - INTERVAL '28 days 1 hour'),
  ('[{"id":7,"name":"Paneer Butter Masala","price":280,"quantity":1,"total":280},{"id":13,"name":"Veg Biryani","price":250,"quantity":2,"total":500},{"id":18,"name":"Kheer","price":100,"quantity":2,"total":200}]'::json, 980, NOW() - INTERVAL '29 days 3 hours'),
  ('[{"id":9,"name":"Chole Bhature","price":180,"quantity":2,"total":360},{"id":6,"name":"Butter Chicken","price":320,"quantity":1,"total":320},{"id":21,"name":"Mango Lassi","price":90,"quantity":2,"total":180}]'::json, 860, NOW() - INTERVAL '30 days 2 hours');


-- ============================================================
-- 5. PREP PLANS — past week + next 3 days
-- ============================================================
INSERT INTO prepplans (date, dish, suggested_qty, actual_prepared, leftovers) VALUES
  (CURRENT_DATE - 6, 'Butter Chicken', 40, 38, 4),
  (CURRENT_DATE - 6, 'Dal Makhani', 30, 28, 2),
  (CURRENT_DATE - 6, 'Chicken Biryani', 25, 25, 0),
  (CURRENT_DATE - 5, 'Paneer Butter Masala', 35, 33, 3),
  (CURRENT_DATE - 5, 'Mutton Rogan Josh', 20, 18, 1),
  (CURRENT_DATE - 5, 'Palak Paneer', 25, 24, 2),
  (CURRENT_DATE - 4, 'Butter Chicken', 45, 45, 5),
  (CURRENT_DATE - 4, 'Chicken Biryani', 30, 28, 2),
  (CURRENT_DATE - 4, 'Dal Makhani', 25, 22, 0),
  (CURRENT_DATE - 3, 'Chole Bhature', 30, 30, 3),
  (CURRENT_DATE - 3, 'Paneer Butter Masala', 30, 28, 1),
  (CURRENT_DATE - 2, 'Butter Chicken', 40, 38, 2),
  (CURRENT_DATE - 2, 'Mutton Rogan Josh', 22, 20, 0),
  (CURRENT_DATE - 2, 'Kheer', 35, 35, 5),
  (CURRENT_DATE - 1, 'Chicken Biryani', 35, 32, 3),
  (CURRENT_DATE - 1, 'Palak Paneer', 28, 26, 2),
  (CURRENT_DATE - 1, 'Dal Makhani', 30, 30, 4),
  -- Today (in progress)
  (CURRENT_DATE, 'Butter Chicken', 42, 40, null),
  (CURRENT_DATE, 'Paneer Butter Masala', 32, 30, null),
  (CURRENT_DATE, 'Chicken Biryani', 28, null, null),
  (CURRENT_DATE, 'Dal Makhani', 25, null, null),
  -- Upcoming
  (CURRENT_DATE + 1, 'Butter Chicken', 45, null, null),
  (CURRENT_DATE + 1, 'Mutton Rogan Josh', 24, null, null),
  (CURRENT_DATE + 1, 'Palak Paneer', 30, null, null),
  (CURRENT_DATE + 2, 'Chicken Biryani', 35, null, null),
  (CURRENT_DATE + 2, 'Chole Bhature', 28, null, null),
  (CURRENT_DATE + 2, 'Kheer', 40, null, null),
  (CURRENT_DATE + 3, 'Butter Chicken', 50, null, null),
  (CURRENT_DATE + 3, 'Paneer Butter Masala', 35, null, null),
  (CURRENT_DATE + 3, 'Dal Makhani', 30, null, null);


-- ============================================================
-- 6. DEMO TEAM MEMBERS (display only — cannot log in)
-- ============================================================
INSERT INTO team_members (user_id, email, name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'ravi.kumar@restaurant.demo', 'Ravi Kumar',   'Kitchen Staff'),
  ('00000000-0000-0000-0000-000000000002', 'priya.nair@restaurant.demo', 'Priya Nair',   'Manager'),
  ('00000000-0000-0000-0000-000000000003', 'arjun.m@restaurant.demo',    'Arjun Menon',  'Cashier'),
  ('00000000-0000-0000-0000-000000000004', 'deepa.s@restaurant.demo',    'Deepa Sharma', 'Kitchen Staff');


-- ============================================================
-- 7. GIVE YOURSELF ADMIN ROLE
-- Run this AFTER signing up in the app with your email.
-- ============================================================
-- UPDATE team_members
-- SET role = 'Admin', name = 'Your Name'
-- WHERE email = 'your@email.com';
