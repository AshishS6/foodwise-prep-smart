import { useSupabaseQuery, useSupabaseMutation } from './useSupabase';
import { supabase } from '@/integrations/supabase/client';

export interface Ingredient {
  id: number;
  name: string;
  stock: number;
  unit: string;
}

export const useIngredients = () => {
  return useSupabaseQuery<Ingredient[]>(async () => {
    return await supabase
      .from('ingredients')
      .select('*')
      .order('name', { ascending: true });
  });
};

export const useIngredient = (id: number) => {
  return useSupabaseQuery<Ingredient>(async () => {
    return await supabase
      .from('ingredients')
      .select('*')
      .eq('id', id)
      .single();
  });
};

export const useCreateIngredient = () => {
  return useSupabaseMutation<Ingredient>(async (ingredient: Omit<Ingredient, 'id'>) => {
    return await supabase
      .from('ingredients')
      .insert([ingredient])
      .select()
      .single();
  });
};

export const useUpdateIngredient = () => {
  return useSupabaseMutation<Ingredient>(async ({ id, ...updates }: Partial<Ingredient> & { id: number }) => {
    return await supabase
      .from('ingredients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  });
};

export const useDeleteIngredient = () => {
  return useSupabaseMutation<void>(async (id: number) => {
    return await supabase
      .from('ingredients')
      .delete()
      .eq('id', id);
  });
};

export const useDecrementStock = () => {
  return useSupabaseMutation<number>(async ({ ingredientId, amount }: { ingredientId: number; amount: number }) => {
    return await supabase.rpc('decrement_stock', {
      ingredient_id: ingredientId,
      amount: amount
    });
  });
};