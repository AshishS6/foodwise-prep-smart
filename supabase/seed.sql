-- Seed data for the restaurant management system

-- Insert sample ingredients
INSERT INTO public.ingredients (name, stock, unit) VALUES
('Chicken Breast', 50, 'kg'),
('Rice', 100, 'kg'),
('Tomatoes', 30, 'kg'),
('Onions', 25, 'kg'),
('Garlic', 5, 'kg'),
('Olive Oil', 10, 'liters'),
('Salt', 5, 'kg'),
('Black Pepper', 2, 'kg'),
('Flour', 20, 'kg'),
('Eggs', 100, 'pieces'),
('Milk', 15, 'liters'),
('Cheese', 10, 'kg'),
('Lettuce', 8, 'kg'),
('Bread', 50, 'loaves'),
('Potatoes', 40, 'kg');

-- Insert sample menu items
INSERT INTO public.menuitems (name, category, price, halfprice, supportshalf, portions) VALUES
('Grilled Chicken', 'Main Course', 18.99, 12.99, true, '{"full": 1, "half": 0.6}'),
('Chicken Fried Rice', 'Main Course', 15.99, 10.99, true, '{"full": 1, "half": 0.7}'),
('Caesar Salad', 'Starters', 8.99, null, false, '{"full": 1}'),
('Garlic Bread', 'Starters', 6.99, null, false, '{"full": 1}'),
('Tomato Soup', 'Starters', 7.99, null, false, '{"full": 1}'),
('Chocolate Cake', 'Desserts', 9.99, null, false, '{"full": 1}'),
('Ice Cream', 'Desserts', 5.99, null, false, '{"full": 1}'),
('Fresh Orange Juice', 'Beverages', 4.99, null, false, '{"full": 1}'),
('Coffee', 'Beverages', 3.99, null, false, '{"full": 1}'),
('Iced Tea', 'Beverages', 3.49, null, false, '{"full": 1}');

-- Insert sample recipes (ingredient relationships)
INSERT INTO public.recipes (menuitemid, ingredientid, quantity) VALUES
-- Grilled Chicken (id: 1)
(1, 1, 0.3), -- Chicken Breast
(1, 6, 0.02), -- Olive Oil
(1, 7, 0.005), -- Salt
(1, 8, 0.002), -- Black Pepper

-- Chicken Fried Rice (id: 2)
(2, 1, 0.2), -- Chicken Breast
(2, 2, 0.15), -- Rice
(2, 4, 0.05), -- Onions
(2, 5, 0.01), -- Garlic
(2, 6, 0.02), -- Olive Oil

-- Caesar Salad (id: 3)
(3, 13, 0.1), -- Lettuce
(3, 12, 0.03), -- Cheese
(3, 14, 0.05), -- Bread

-- Garlic Bread (id: 4)
(4, 14, 0.1), -- Bread
(4, 5, 0.02), -- Garlic
(4, 6, 0.01); -- Olive Oil

-- Insert sample prep plans for today
INSERT INTO public.prepplans (date, dish, suggested_qty, actual_prepared, leftovers) VALUES
(CURRENT_DATE, 'Grilled Chicken', 20, 18, 2),
(CURRENT_DATE, 'Chicken Fried Rice', 15, 15, 0),
(CURRENT_DATE, 'Caesar Salad', 10, 12, 1),
(CURRENT_DATE, 'Garlic Bread', 25, 25, 3);

-- Insert sample orders (for demonstration)
INSERT INTO public.orders (items, total, timestamp) VALUES
('{"items": [{"id": 1, "name": "Grilled Chicken", "quantity": 2, "price": 18.99}], "subtotal": 37.98, "tax": 3.04, "total": 41.02}', 41.02, NOW() - INTERVAL '2 hours'),
('{"items": [{"id": 2, "name": "Chicken Fried Rice", "quantity": 1, "price": 15.99}, {"id": 8, "name": "Fresh Orange Juice", "quantity": 1, "price": 4.99}], "subtotal": 20.98, "tax": 1.68, "total": 22.66}', 22.66, NOW() - INTERVAL '1 hour'),
('{"items": [{"id": 3, "name": "Caesar Salad", "quantity": 1, "price": 8.99}, {"id": 4, "name": "Garlic Bread", "quantity": 1, "price": 6.99}], "subtotal": 15.98, "tax": 1.28, "total": 17.26}', 17.26, NOW() - INTERVAL '30 minutes');

-- Note: team_members will be populated when users sign up through the application
-- The user_id will come from Supabase Auth, so we can't pre-populate this table