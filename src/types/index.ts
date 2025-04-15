
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
};
