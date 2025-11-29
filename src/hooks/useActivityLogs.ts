import { useSupabaseQuery, useSupabaseMutation } from './useSupabase';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: any;
  created_at: string;
}

export const useActivityLogs = (limit: number = 50) => {
  return useSupabaseQuery<ActivityLog[]>(async () => {
    return await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
  });
};

export const useActivityLogsByUser = (userId: string, limit: number = 50) => {
  return useSupabaseQuery<ActivityLog[]>(async () => {
    return await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
  });
};

export const useActivityLogsByEntity = (entityType: string, entityId: string) => {
  return useSupabaseQuery<ActivityLog[]>(async () => {
    return await supabase
      .from('activity_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });
  });
};

export const useLogActivity = () => {
  return useSupabaseMutation<string>(async ({ 
    action, 
    entityType, 
    entityId, 
    details 
  }: { 
    action: string; 
    entityType: string; 
    entityId?: string; 
    details?: any; 
  }) => {
    return await supabase.rpc('log_activity', {
      action,
      entity_type: entityType,
      entity_id: entityId,
      details
    });
  });
};