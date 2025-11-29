import { useSupabaseQuery, useSupabaseMutation } from './useSupabase';
import { supabase } from '@/integrations/supabase/client';

export interface Order {
  id: number;
  items: any;
  total: number;
  timestamp: string;
}

export const useOrders = () => {
  return useSupabaseQuery<Order[]>(async () => {
    return await supabase
      .from('orders')
      .select('*')
      .order('timestamp', { ascending: false });
  });
};

export const useOrdersByDateRange = (startDate: string, endDate: string) => {
  return useSupabaseQuery<Order[]>(async () => {
    return await supabase
      .from('orders')
      .select('*')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: false });
  });
};

export const useCreateOrder = () => {
  return useSupabaseMutation<Order>(async (order: Omit<Order, 'id' | 'timestamp'>) => {
    return await supabase
      .from('orders')
      .insert([order])
      .select()
      .single();
  });
};

export const useTodaysOrders = () => {
  const today = new Date().toISOString().split('T')[0];
  return useSupabaseQuery<Order[]>(async () => {
    return await supabase
      .from('orders')
      .select('*')
      .gte('timestamp', `${today}T00:00:00`)
      .lt('timestamp', `${today}T23:59:59`)
      .order('timestamp', { ascending: false });
  });
};

export const useOrderStats = () => {
  return useSupabaseQuery<{ total_orders: number; total_revenue: number }>(async () => {
    const today = new Date().toISOString().split('T')[0];
    return await supabase
      .from('orders')
      .select('total')
      .gte('timestamp', `${today}T00:00:00`)
      .lt('timestamp', `${today}T23:59:59`)
      .then(({ data, error }) => {
        if (error) return { data: null, error };
        
        const totalOrders = data?.length || 0;
        const totalRevenue = data?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
        
        return {
          data: { total_orders: totalOrders, total_revenue: totalRevenue },
          error: null
        };
      });
  });
};