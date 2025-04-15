
export type MenuCategory = "Main Course" | "Starters" | "Desserts" | "Beverages";

export type PortionType = {
  label: string;     // "Full", "Half", "Glass", "1L", "500ml", "Piece"
  price: number;     // Price for this portion
  unit: string;      // "plate", "glass", "liter", "piece"
  multiplier: number;  // For inventory calculations (e.g., 1, 0.5, 0.15 for glass)
};

export type MenuItem = {
  id: number;
  name: string;
  category: string;
  portions: PortionType[];
};

export type CartItem = {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  note: string;
  billGroup: number;
  portionType: PortionType;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type TeamMember = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};
