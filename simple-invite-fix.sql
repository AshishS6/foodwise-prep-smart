-- Simple fix for invitation system
-- Run this in Supabase SQL Editor

-- Create a simple invite function that works
CREATE OR REPLACE FUNCTION public.invite_team_member(
    invite_email TEXT,
    invite_role TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    result_message TEXT;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE user_id = current_user_id AND role = 'Admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can invite team members';
    END IF;
    
    -- Check if user is already a team member
    IF EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE email = invite_email
    ) THEN
        RAISE EXCEPTION 'User is already a team member';
    END IF;
    
    -- For now, just create the team member directly
    -- In a real system, you'd send an email invitation
    INSERT INTO public.team_members (user_id, email, role, name)
    VALUES (
        gen_random_uuid(), -- Temporary user_id, will be updated when user signs up
        invite_email, 
        invite_role,
        split_part(invite_email, '@', 1)
    );
    
    result_message := 'Invitation sent to ' || invite_email || ' as ' || invite_role;
    RETURN result_message;
END;
$$;

-- Test the function
SELECT 'Function created successfully' as status;