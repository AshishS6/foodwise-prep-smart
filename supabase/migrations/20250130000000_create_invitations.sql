-- Create invitations table for invite-based signup
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    invited_by UUID REFERENCES auth.users(id),
    token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on invitations table
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Note: get_current_user_role() function should already exist from previous migration
-- If it doesn't exist, it will be created by the previous migration

-- Create an RPC function to create invitations, with admin checks handled on the backend
-- This uses SECURITY DEFINER to bypass RLS and prevent permission issues
CREATE OR REPLACE FUNCTION public.create_invitation(
    invite_email TEXT,
    invite_role TEXT
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    token TEXT,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public
AS $$
DECLARE
    caller_role TEXT;
    current_user_id UUID;
    invitation_record RECORD;
BEGIN
    
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Check if the caller is an Admin
    SELECT get_current_user_role() INTO caller_role;
    IF caller_role <> 'Admin' THEN
        RAISE EXCEPTION 'Only administrators can create invitations';
    END IF;
    
    -- Check if user already exists as team member
    IF EXISTS (SELECT 1 FROM team_members WHERE email = invite_email) THEN
        RAISE EXCEPTION 'User with email % is already a team member', invite_email;
    END IF;
    
    -- Check if there's a pending invitation
    IF EXISTS (
        SELECT 1 FROM invitations 
        WHERE email = invite_email 
        AND accepted_at IS NULL 
        AND expires_at > NOW()
    ) THEN
        RAISE EXCEPTION 'User already has a pending invitation';
    END IF;
    
    -- Create invitation
    INSERT INTO invitations (email, role, invited_by)
    VALUES (invite_email, invite_role, current_user_id)
    RETURNING * INTO invitation_record;
    
    -- Return the invitation details
    RETURN QUERY SELECT 
        invitation_record.id,
        invitation_record.email,
        invitation_record.role,
        invitation_record.token,
        invitation_record.expires_at;
END;
$$;

-- Drop existing policies if they exist (to allow re-running the migration)
DROP POLICY IF EXISTS "Allow authenticated users to read invitations" ON public.invitations;
DROP POLICY IF EXISTS "Allow authenticated users to update invitations" ON public.invitations;
DROP POLICY IF EXISTS "Allow admins to read all invitations" ON public.invitations;
DROP POLICY IF EXISTS "Allow users to read their own invitations" ON public.invitations;
DROP POLICY IF EXISTS "Allow admins to insert invitations" ON public.invitations;
DROP POLICY IF EXISTS "Allow users to update their own invitations" ON public.invitations;

-- Create policy for invitations - allow authenticated users to read invitations they can see
CREATE POLICY "Allow authenticated users to read invitations" ON public.invitations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to update invitations (for accepting them)
CREATE POLICY "Allow authenticated users to update invitations" ON public.invitations
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON public.invitations(expires_at);
