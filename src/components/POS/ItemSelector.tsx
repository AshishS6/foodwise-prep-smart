
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ItemSelectorProps {
  item: {
    id: string | number;
    name: string;
    price: number;
    halfprice?: number; // Updated to match database column name
    supportshalf?: boolean;
  };
  onAddToCart: (item: any, isHalf: boolean) => void;
}

const ItemSelector = ({ item, onAddToCart }: ItemSelectorProps) => {
  // Use the correct property name from the database
  const supportsHalfPortion = item.supportshalf || false;
  const [isHalf, setIsHalf] = useState(false);
  
  const handleAddToCart = () => {
    onAddToCart(item, isHalf);
  };
  
  // Calculate display price based on selection
  const displayPrice = isHalf && item.halfprice 
    ? item.halfprice 
    : isHalf 
      ? item.price / 2 
      : item.price;
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-muted-foreground text-sm">₹{displayPrice}</p>
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleAddToCart}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Half portion toggle - only shown if item supports half portions */}
          {supportsHalfPortion && (
            <div className="flex items-center space-x-2 mt-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Switch
                      id={`half-toggle-${item.id}`}
                      checked={isHalf}
                      onCheckedChange={setIsHalf}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Half Portion (H)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Label htmlFor={`half-toggle-${item.id}`} className="text-sm cursor-pointer">
                Half (H)
              </Label>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemSelector;
