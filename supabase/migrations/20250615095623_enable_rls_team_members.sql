
-- Enable RLS on team_members table
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows authenticated users to read all team members
-- This is needed for team management functionality
CREATE POLICY "Authenticated users can view team members" 
ON public.team_members 
FOR SELECT 
TO authenticated 
USING (true);

-- Create a policy that allows authenticated users to insert team members
-- This is needed for inviting new team members
CREATE POLICY "Authenticated users can invite team members" 
ON public.team_members 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Create a policy that allows authenticated users to update team members
-- This is needed for updating team member information
CREATE POLICY "Authenticated users can update team members" 
ON public.team_members 
FOR UPDATE 
TO authenticated 
USING (true);
