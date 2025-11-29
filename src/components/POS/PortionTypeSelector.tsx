import React from "react";
import { Button } from "@/components/ui/button";
import { PortionType } from "@/types";
import { cn } from "@/lib/utils";

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

  // If only one portion, don't show selector
  if (portions.length === 1) {
    return null;
  }

  // For two portions (typically Full/Half), show as toggle switch
  if (portions.length === 2) {
    const [first, second] = portions;
    const isFirstSelected = selectedPortion.label === first.label;
    
    return (
      <div 
        className="relative inline-flex h-8 w-full rounded-full bg-muted p-1 cursor-pointer transition-colors"
        onClick={() => onSelectPortion(isFirstSelected ? second : first)}
      >
        <div
          className={cn(
            "absolute h-6 rounded-full bg-primary transition-all duration-200 ease-in-out",
            isFirstSelected ? "left-1 w-[calc(50%-0.25rem)]" : "right-1 w-[calc(50%-0.25rem)]"
          )}
        />
        <div className="relative flex w-full items-center">
          <button
            type="button"
            className={cn(
              "relative z-10 flex-1 text-xs font-medium transition-colors h-6 rounded-full",
              isFirstSelected ? "text-primary-foreground" : "text-muted-foreground"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onSelectPortion(first);
            }}
          >
            {first.label}
          </button>
          <button
            type="button"
            className={cn(
              "relative z-10 flex-1 text-xs font-medium transition-colors h-6 rounded-full",
              !isFirstSelected ? "text-primary-foreground" : "text-muted-foreground"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onSelectPortion(second);
            }}
          >
            {second.label}
          </button>
        </div>
      </div>
    );
  }

  // For more than 2 portions, show as compact button group
  return (
    <div className="flex flex-wrap gap-1">
      {portions.map((portion) => (
        <Button
          key={portion.label}
          variant={selectedPortion.label === portion.label ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-7 text-xs px-2",
            selectedPortion.label === portion.label && "shadow-sm"
          )}
          onClick={() => onSelectPortion(portion)}
        >
          {portion.label}
        </Button>
      ))}
    </div>
  );
};

export default PortionTypeSelector;
