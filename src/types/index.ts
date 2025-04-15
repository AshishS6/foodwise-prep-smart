
export type PortionType = {
  label: string;       // e.g., "Full", "Half", "Glass"
  price: number;       // Price for this portion
  multiplier: number;  // How much of the base item is used
  unit: string;        // Unit of measurement (Plate, Glass, Liter)
};
