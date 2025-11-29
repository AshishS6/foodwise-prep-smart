// Database types based on your schema
export interface MenuItem {
  id: number;
  name: string;
  category: 'Main Course' | 'Starters' | 'Desserts' | 'Beverages';
  price: number;
  halfprice?: number;
  supportshalf: boolean;
  portions?: any;
}

export interface Ingredient {
  id: number;
  name: string;
  stock: number;
  unit: string;
}

export interface Order {
  id: number;
  items: any;
  total: number;
  timestamp: string;
}

export interface PrepPlan {
  id: number;
  date: string;
  dish: string;
  suggested_qty: number;
  actual_prepared?: number;
  leftovers?: number;
}

export interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: any;
  created_at: string;
}

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

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  error: any;
}

// Form types
export interface CreateMenuItemForm {
  name: string;
  category: MenuItem['category'];
  price: number;
  halfprice?: number;
  supportshalf: boolean;
  portions?: any;
}

export interface CreateIngredientForm {
  name: string;
  stock: number;
  unit: string;
}

export interface CreateOrderForm {
  items: any;
  total: number;
}

export interface CreatePrepPlanForm {
  date: string;
  dish: string;
  suggested_qty: number;
  actual_prepared?: number;
  leftovers?: number;
}

export interface CreateTeamMemberForm {
  user_id: string;
  email: string;
  name?: string;
  role: string;
}

export interface CreateRecipeForm {
  menuitemid: number;
  ingredientid: number;
  quantity: number;
}

// Auth types
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: any;
  app_metadata?: any;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

// Role-based permissions
export type UserRole = 'Admin' | 'Kitchen Staff' | 'Cashier' | 'Manager';

export interface RolePermissions {
  [key: string]: string[];
}

export const ROLE_PERMISSIONS: RolePermissions = {
  'Admin': ['dashboard', 'pos', 'inventory', 'recipes', 'prepplans', 'orderhistory', 'analytics', 'reports', 'team'],
  'Kitchen Staff': ['dashboard', 'inventory', 'recipes', 'prepplans'],
  'Cashier': ['dashboard', 'pos', 'orderhistory'],
  'Manager': ['dashboard', 'pos', 'inventory', 'recipes', 'prepplans', 'orderhistory', 'analytics', 'reports']
};