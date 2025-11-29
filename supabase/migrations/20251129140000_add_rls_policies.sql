-- Enable Row Level Security on all tables
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menuitems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prepplans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for ingredients table
CREATE POLICY "Allow authenticated users to read ingredients" ON public.ingredients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update ingredients" ON public.ingredients
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert ingredients" ON public.ingredients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete ingredients" ON public.ingredients
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for menuitems table
CREATE POLICY "Allow authenticated users to read menuitems" ON public.menuitems
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update menuitems" ON public.menuitems
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert menuitems" ON public.menuitems
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete menuitems" ON public.menuitems
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for orders table
CREATE POLICY "Allow authenticated users to read orders" ON public.orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert orders" ON public.orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policies for prepplans table
CREATE POLICY "Allow authenticated users to read prepplans" ON public.prepplans
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update prepplans" ON public.prepplans
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert prepplans" ON public.prepplans
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete prepplans" ON public.prepplans
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for recipes table
CREATE POLICY "Allow authenticated users to read recipes" ON public.recipes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update recipes" ON public.recipes
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert recipes" ON public.recipes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete recipes" ON public.recipes
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for team_members table
CREATE POLICY "Allow users to read their own team member record" ON public.team_members
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own team member record" ON public.team_members
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert team member records" ON public.team_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policies for activity_logs table
CREATE POLICY "Allow authenticated users to read activity logs" ON public.activity_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create a trigger to automatically create team member record when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_members (user_id, email, role)
  VALUES (NEW.id, NEW.email, 'Cashier');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();