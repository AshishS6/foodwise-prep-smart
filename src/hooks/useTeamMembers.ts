import { useSupabaseQuery, useSupabaseMutation } from './useSupabase';
import { supabase } from '@/integrations/supabase/client';

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
  return useSupabaseQuery<TeamMember>(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };
    
    return await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', user.id)
      .single();
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