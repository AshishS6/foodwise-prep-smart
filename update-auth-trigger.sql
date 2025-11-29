-- Update the auth trigger to handle pre-existing team members
-- Run this in Supabase SQL Editor

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create updated function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already exists in team_members (pre-invited)
  IF EXISTS (SELECT 1 FROM public.team_members WHERE email = NEW.email) THEN
    -- Update the existing team member record with the real user_id
    UPDATE public.team_members 
    SET user_id = NEW.id, updated_at = NOW()
    WHERE email = NEW.email;
  ELSE
    -- If not pre-invited, don't create team member automatically
    -- They will see "Invitation Required" message
    NULL;
  END IF;
  
  -- Log the user creation
  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (NEW.id, 'user_signup', 'auth_user', NEW.id::text, jsonb_build_object('email', NEW.email));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- Test
SELECT 'Auth trigger updated successfully' as status;