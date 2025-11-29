import { useSupabaseQuery, useSupabaseMutation } from './useSupabase';
import { supabase } from '@/integrations/supabase/client';

export interface Recipe {
  id: number;
  menuitemid: number;
  ingredientid: number;
  quantity: number;
}

export interface RecipeWithDetails extends Recipe {
  menuitem?: {
    id: number;
    name: string;
    category: string;
  };
  ingredient?: {
    id: number;
    name: string;
    unit: string;
  };
}

export const useRecipes = () => {
  return useSupabaseQuery<RecipeWithDetails[]>(async () => {
    return await supabase
      .from('recipes')
      .select(`
        *,
        menuitem:menuitems(id, name, category),
        ingredient:ingredients(id, name, unit)
      `)
      .order('menuitemid', { ascending: true });
  });
};

export const useRecipesByMenuItem = (menuItemId: number) => {
  return useSupabaseQuery<RecipeWithDetails[]>(async () => {
    return await supabase
      .from('recipes')
      .select(`
        *,
        ingredient:ingredients(id, name, unit)
      `)
      .eq('menuitemid', menuItemId)
      .order('ingredientid', { ascending: true });
  });
};

export const useCreateRecipe = () => {
  return useSupabaseMutation<Recipe>(async (recipe: Omit<Recipe, 'id'>) => {
    return await supabase
      .from('recipes')
      .insert([recipe])
      .select()
      .single();
  });
};

export const useUpdateRecipe = () => {
  return useSupabaseMutation<Recipe>(async ({ id, ...updates }: Partial<Recipe> & { id: number }) => {
    return await supabase
      .from('recipes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  });
};

export const useDeleteRecipe = () => {
  return useSupabaseMutation<void>(async (id: number) => {
    return await supabase
      .from('recipes')
      .delete()
      .eq('id', id);
  });
};

export const useRecipeIngredients = (menuItemId: number) => {
  return useSupabaseQuery<{ ingredient_name: string; quantity: number; unit: string }[]>(async () => {
    return await supabase
      .from('recipes')
      .select(`
        quantity,
        ingredient:ingredients(name, unit)
      `)
      .eq('menuitemid', menuItemId)
      .then(({ data, error }) => {
        if (error) return { data: null, error };
        
        const ingredients = data?.map(recipe => ({
          ingredient_name: recipe.ingredient?.name || '',
          quantity: recipe.quantity,
          unit: recipe.ingredient?.unit || ''
        })) || [];
        
        return { data: ingredients, error: null };
      });
  });
};