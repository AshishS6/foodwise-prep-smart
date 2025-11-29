import { useSupabaseQuery, useSupabaseMutation } from './useSupabase';
import { supabase } from '@/integrations/supabase/client';

export interface MenuItem {
  id: number;
  name: string;
  category: 'Main Course' | 'Starters' | 'Desserts' | 'Beverages';
  price: number;
  halfprice?: number;
  supportshalf: boolean;
  portions?: any;
}

export const useMenuItems = () => {
  return useSupabaseQuery<MenuItem[]>(async () => {
    return await supabase
      .from('menuitems')
      .select('*')
      .order('category', { ascending: true });
  });
};

export const useMenuItemsByCategory = (category: string) => {
  return useSupabaseQuery<MenuItem[]>(async () => {
    return await supabase
      .from('menuitems')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true });
  });
};

export const useCreateMenuItem = () => {
  return useSupabaseMutation<MenuItem>(async (menuItem: Omit<MenuItem, 'id'>) => {
    return await supabase
      .from('menuitems')
      .insert([menuItem])
      .select()
      .single();
  });
};

export const useUpdateMenuItem = () => {
  return useSupabaseMutation<MenuItem>(async ({ id, ...updates }: Partial<MenuItem> & { id: number }) => {
    return await supabase
      .from('menuitems')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  });
};

export const useDeleteMenuItem = () => {
  return useSupabaseMutation<void>(async (id: number) => {
    return await supabase
      .from('menuitems')
      .delete()
      .eq('id', id);
  });
};