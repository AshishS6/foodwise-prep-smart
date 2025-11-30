import { useSupabaseQuery, useSupabaseMutation } from './useSupabase';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export const useTeamMembers = () => {
  return useSupabaseQuery<TeamMember[]>(async () => {
    return await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: false });
  });
};

export const useCurrentTeamMember = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['currentTeamMember', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        // If no team member found (PGRST116), return null (not an error)
        if (error && error.code === 'PGRST116') {
          return null;
        }
        
        if (error) throw error;
        return data as TeamMember;
      } catch (error: any) {
        // Handle any unexpected errors gracefully
        console.error('Error fetching team member:', error);
        return null;
      }
    },
    enabled: !!user, // Only run query if user exists
    retry: false, // Don't retry if team member not found
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const useCreateTeamMember = () => {
  return useSupabaseMutation<TeamMember>(async (teamMember: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>) => {
    return await supabase
      .from('team_members')
      .insert([teamMember])
      .select()
      .single();
  });
};

export const useUpdateTeamMember = () => {
  return useSupabaseMutation<TeamMember>(async ({ id, ...updates }: Partial<TeamMember> & { id: string }) => {
    return await supabase
      .from('team_members')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
  });
};

export const useDeleteTeamMember = () => {
  return useSupabaseMutation<void>(async (id: string) => {
    return await supabase
      .from('team_members')
      .delete()
      .eq('id', id);
  });
};

export const useUserRole = (userId?: string) => {
  return useSupabaseQuery<string>(async () => {
    if (!userId) return { data: null, error: null };
    
    return await supabase.rpc('get_user_role', { user_uuid: userId });
  });
};