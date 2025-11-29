import { supabase } from '@/integrations/supabase/client';

// Auth Services
export const authService = {
  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  async signUp(email: string, password: string) {
    return await supabase.auth.signUp({ email, password });
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  async resetPassword(email: string) {
    return await supabase.auth.resetPasswordForEmail(email);
  },

  async getCurrentUser() {
    return await supabase.auth.getUser();
  },

  async getSession() {
    return await supabase.auth.getSession();
  }
};

// Menu Items Services
export const menuService = {
  async getAll() {
    return await supabase
      .from('menuitems')
      .select('*')
      .order('category', { ascending: true });
  },

  async getByCategory(category: string) {
    return await supabase
      .from('menuitems')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true });
  },

  async create(menuItem: any) {
    return await supabase
      .from('menuitems')
      .insert([menuItem])
      .select()
      .single();
  },

  async update(id: number, updates: any) {
    return await supabase
      .from('menuitems')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  async delete(id: number) {
    return await supabase
      .from('menuitems')
      .delete()
      .eq('id', id);
  }
};

// Ingredients Services
export const ingredientService = {
  async getAll() {
    return await supabase
      .from('ingredients')
      .select('*')
      .order('name', { ascending: true });
  },

  async getById(id: number) {
    return await supabase
      .from('ingredients')
      .select('*')
      .eq('id', id)
      .single();
  },

  async create(ingredient: any) {
    return await supabase
      .from('ingredients')
      .insert([ingredient])
      .select()
      .single();
  },

  async update(id: number, updates: any) {
    return await supabase
      .from('ingredients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  async delete(id: number) {
    return await supabase
      .from('ingredients')
      .delete()
      .eq('id', id);
  },

  async decrementStock(ingredientId: number, amount: number) {
    return await supabase.rpc('decrement_stock', {
      ingredient_id: ingredientId,
      amount: amount
    });
  }
};

// Orders Services
export const orderService = {
  async getAll() {
    return await supabase
      .from('orders')
      .select('*')
      .order('timestamp', { ascending: false });
  },

  async getByDateRange(startDate: string, endDate: string) {
    return await supabase
      .from('orders')
      .select('*')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: false });
  },

  async create(order: any) {
    return await supabase
      .from('orders')
      .insert([order])
      .select()
      .single();
  },

  async getTodaysOrders() {
    const today = new Date().toISOString().split('T')[0];
    return await supabase
      .from('orders')
      .select('*')
      .gte('timestamp', `${today}T00:00:00`)
      .lt('timestamp', `${today}T23:59:59`)
      .order('timestamp', { ascending: false });
  },

  async getStats() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('orders')
      .select('total')
      .gte('timestamp', `${today}T00:00:00`)
      .lt('timestamp', `${today}T23:59:59`);
    
    if (error) return { data: null, error };
    
    const totalOrders = data?.length || 0;
    const totalRevenue = data?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
    
    return {
      data: { total_orders: totalOrders, total_revenue: totalRevenue },
      error: null
    };
  }
};

// Prep Plans Services
export const prepPlanService = {
  async getAll() {
    return await supabase
      .from('prepplans')
      .select('*')
      .order('date', { ascending: false });
  },

  async getByDate(date: string) {
    return await supabase
      .from('prepplans')
      .select('*')
      .eq('date', date)
      .order('dish', { ascending: true });
  },

  async create(prepPlan: any) {
    return await supabase
      .from('prepplans')
      .insert([prepPlan])
      .select()
      .single();
  },

  async update(id: number, updates: any) {
    return await supabase
      .from('prepplans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  async delete(id: number) {
    return await supabase
      .from('prepplans')
      .delete()
      .eq('id', id);
  },

  async getTodaysPlans() {
    const today = new Date().toISOString().split('T')[0];
    return await supabase
      .from('prepplans')
      .select('*')
      .eq('date', today)
      .order('dish', { ascending: true });
  }
};

// Team Members Services
export const teamService = {
  async getAll() {
    return await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: false });
  },

  async getCurrent() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };
    
    return await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', user.id)
      .single();
  },

  async create(teamMember: any) {
    return await supabase
      .from('team_members')
      .insert([teamMember])
      .select()
      .single();
  },

  async update(id: string, updates: any) {
    return await supabase
      .from('team_members')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
  },

  async delete(id: string) {
    return await supabase
      .from('team_members')
      .delete()
      .eq('id', id);
  },

  async getUserRole(userId: string) {
    return await supabase.rpc('get_user_role', { user_uuid: userId });
  }
};

// Activity Logs Services
export const activityService = {
  async getAll(limit: number = 50) {
    return await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
  },

  async getByUser(userId: string, limit: number = 50) {
    return await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
  },

  async getByEntity(entityType: string, entityId: string) {
    return await supabase
      .from('activity_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });
  },

  async log(action: string, entityType: string, entityId?: string, details?: any) {
    return await supabase.rpc('log_activity', {
      action,
      entity_type: entityType,
      entity_id: entityId,
      details
    });
  }
};

// Recipes Services
export const recipeService = {
  async getAll() {
    return await supabase
      .from('recipes')
      .select(`
        *,
        menuitem:menuitems(id, name, category),
        ingredient:ingredients(id, name, unit)
      `)
      .order('menuitemid', { ascending: true });
  },

  async getByMenuItem(menuItemId: number) {
    return await supabase
      .from('recipes')
      .select(`
        *,
        ingredient:ingredients(id, name, unit)
      `)
      .eq('menuitemid', menuItemId)
      .order('ingredientid', { ascending: true });
  },

  async create(recipe: any) {
    return await supabase
      .from('recipes')
      .insert([recipe])
      .select()
      .single();
  },

  async update(id: number, updates: any) {
    return await supabase
      .from('recipes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  async delete(id: number) {
    return await supabase
      .from('recipes')
      .delete()
      .eq('id', id);
  },

  async getIngredients(menuItemId: number) {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        quantity,
        ingredient:ingredients(name, unit)
      `)
      .eq('menuitemid', menuItemId);
    
    if (error) return { data: null, error };
    
    const ingredients = data?.map(recipe => ({
      ingredient_name: recipe.ingredient?.name || '',
      quantity: recipe.quantity,
      unit: recipe.ingredient?.unit || ''
    })) || [];
    
    return { data: ingredients, error: null };
  }
};