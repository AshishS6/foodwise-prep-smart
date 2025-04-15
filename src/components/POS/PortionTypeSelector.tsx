
import React from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PortionType = {
  label: string;
  price: number;
  multiplier: number;
  unit: string;
};

interface PortionTypeSelectorProps {
  portions: PortionType[];
  selectedPortion: PortionType;
  onSelectPortion: (portion: PortionType) => void;
}

const PortionTypeSelector: React.FC<PortionTypeSelectorProps> = ({
  portions,
  selectedPortion,
  onSelectPortion,
}) => {
  if (!portions || portions.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <Select
        value={selectedPortion.label}
        onValueChange={(value) => {
          const selected = portions.find((p) => p.label === value);
          if (selected) {
            onSelectPortion(selected);
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select portion" />
        </SelectTrigger>
        <SelectContent>
          {portions.map((portion) => (
            <SelectItem key={portion.label} value={portion.label}>
              {portion.label} (₹{portion.price}) - {portion.unit}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PortionTypeSelector;
