
-- A helper function to safely get the current user's role.
-- This uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  -- Set a search path to prevent hijacking.
  SET search_path = public;
  SELECT role FROM team_members WHERE user_id = auth.uid();
$$;

-- An RPC function to invite a team member, with admin checks handled on the backend.
-- This also uses SECURITY DEFINER to bypass the problematic RLS policy.
CREATE OR REPLACE FUNCTION public.invite_team_member_rpc(invite_email TEXT, invite_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Set a search path to prevent hijacking.
  SET search_path = public;

  -- Check if the caller is an Admin using our safe helper function.
  SELECT get_current_user_role() INTO caller_role;
  IF caller_role <> 'Admin' THEN
    RAISE EXCEPTION 'Only administrators can invite team members';
  END IF;

  -- Check if user already exists.
  IF EXISTS (SELECT 1 FROM team_members WHERE email = invite_email) THEN
    RAISE EXCEPTION 'User with email % is already a team member', invite_email;
  END IF;
  
  -- Insert the new team member.
  INSERT INTO team_members (email, role, user_id)
  VALUES (invite_email, invite_role, '00000000-0000-0000-0000-000000000000');

  -- Log activity using the existing log_activity function.
  PERFORM log_activity(
    'invite', 
    'team_member', 
    invite_email, 
    jsonb_build_object('role', invite_role)
  );
END;
$$;
