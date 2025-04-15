
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Edit } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ItemSelectorProps {
  item: {
    id: string | number;
    name: string;
    price: number;
    halfprice?: number;
    supportshalf?: boolean;
  };
  onAddToCart: (item: any, isHalf: boolean) => void;
  onEditItem?: (item: any) => void;
}

const ItemSelector = ({ item, onAddToCart, onEditItem }: ItemSelectorProps) => {
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
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-muted-foreground text-sm">₹{displayPrice}</p>
            </div>
            <div className="flex space-x-1">
              {onEditItem && (
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onEditItem(item)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleAddToCart}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
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
                      className="bg-gray-300 data-[state=checked]:bg-purple-500" // Changed toggle color
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
              {isHalf && item.halfprice && (
                <span className="text-xs font-medium ml-auto text-green-600">
                  ₹{item.halfprice}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemSelector;
