import { useSupabaseQuery, useSupabaseMutation } from './useSupabase';
import { supabase } from '@/integrations/supabase/client';

export interface PrepPlan {
  id: number;
  date: string;
  dish: string;
  suggested_qty: number;
  actual_prepared?: number;
  leftovers?: number;
}

export const usePrepPlans = () => {
  return useSupabaseQuery<PrepPlan[]>(async () => {
    return await supabase
      .from('prepplans')
      .select('*')
      .order('date', { ascending: false });
  });
};

export const usePrepPlansByDate = (date: string) => {
  return useSupabaseQuery<PrepPlan[]>(async () => {
    return await supabase
      .from('prepplans')
      .select('*')
      .eq('date', date)
      .order('dish', { ascending: true });
  });
};

export const useCreatePrepPlan = () => {
  return useSupabaseMutation<PrepPlan>(async (prepPlan: Omit<PrepPlan, 'id'>) => {
    return await supabase
      .from('prepplans')
      .insert([prepPlan])
      .select()
      .single();
  });
};

export const useUpdatePrepPlan = () => {
  return useSupabaseMutation<PrepPlan>(async ({ id, ...updates }: Partial<PrepPlan> & { id: number }) => {
    return await supabase
      .from('prepplans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  });
};

export const useDeletePrepPlan = () => {
  return useSupabaseMutation<void>(async (id: number) => {
    return await supabase
      .from('prepplans')
      .delete()
      .eq('id', id);
  });
};

export const useTodaysPrepPlans = () => {
  const today = new Date().toISOString().split('T')[0];
  return useSupabaseQuery<PrepPlan[]>(async () => {
    return await supabase
      .from('prepplans')
      .select('*')
      .eq('date', today)
      .order('dish', { ascending: true });
  });
};