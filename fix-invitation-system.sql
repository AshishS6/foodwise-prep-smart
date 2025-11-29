-- Fix the invitation system

-- First, let's create a proper invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    invited_by UUID REFERENCES auth.users(id),
    token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on invitations table
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Create policy for invitations
CREATE POLICY "Allow authenticated users to read invitations" ON public.invitations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert invitations" ON public.invitations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Drop the problematic function if it exists
DROP FUNCTION IF EXISTS public.invite_team_member_rpc(text, text);

-- Create a new, simpler invite function
CREATE OR REPLACE FUNCTION public.invite_team_member(
    invite_email TEXT,
    invite_role TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_id UUID;
    current_user_id UUID;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Check if user is already invited or exists
    IF EXISTS (
        SELECT 1 FROM public.invitations 
        WHERE email = invite_email AND accepted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'User already has a pending invitation';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE email = invite_email
    ) THEN
        RAISE EXCEPTION 'User is already a team member';
    END IF;
    
    -- Create invitation
    INSERT INTO public.invitations (email, role, invited_by)
    VALUES (invite_email, invite_role, current_user_id)
    RETURNING id INTO invitation_id;
    
    RETURN invitation_id;
END;
$$;

-- Create function to accept invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(
    invitation_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_record RECORD;
    current_user_id UUID;
    current_user_email TEXT;
BEGIN
    -- Get current user info
    current_user_id := auth.uid();
    SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
    
    -- Get invitation
    SELECT * INTO invitation_record 
    FROM public.invitations 
    WHERE token = invitation_token 
    AND expires_at > NOW() 
    AND accepted_at IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invitation';
    END IF;
    
    -- Check if email matches
    IF invitation_record.email != current_user_email THEN
        RAISE EXCEPTION 'Invitation email does not match your account';
    END IF;
    
    -- Create team member record
    INSERT INTO public.team_members (user_id, email, role, name)
    VALUES (
        current_user_id, 
        current_user_email, 
        invitation_record.role,
        split_part(current_user_email, '@', 1)
    );
    
    -- Mark invitation as accepted
    UPDATE public.invitations 
    SET accepted_at = NOW() 
    WHERE id = invitation_record.id;
    
    RETURN TRUE;
END;
$$;

-- Update the trigger to NOT automatically create team members
-- Only create them through invitations
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a new trigger that only logs the user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Just log the user creation, don't auto-create team member
  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (NEW.id, 'user_signup', 'auth_user', NEW.id::text, jsonb_build_object('email', NEW.email));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();