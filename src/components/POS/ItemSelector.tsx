
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ItemSelectorProps {
  item: {
    id: number;
    name: string;
    price: number;
  };
  onAddToCart: (item: any, isHalf: boolean) => void;
}

const ItemSelector = ({ item, onAddToCart }: ItemSelectorProps) => {
  const [isHalf, setIsHalf] = useState(false);
  
  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">
              ₹{isHalf ? (item.price / 2).toFixed(2) : item.price.toFixed(2)}
              {isHalf ? " (Half)" : " (Full)"}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
          {/* Portion Size Selector */}
          <RadioGroup 
            value={isHalf ? "half" : "full"}
            onValueChange={(value) => setIsHalf(value === "half")}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="full" id={`full-${item.id}`} />
              <Label htmlFor={`full-${item.id}`}>Full</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="half" id={`half-${item.id}`} />
              <Label htmlFor={`half-${item.id}`}>Half</Label>
            </div>
          </RadioGroup>
          
          {/* Add Button */}
          <Button 
            size="sm"
            onClick={() => onAddToCart(item, isHalf)}
            className="w-full mt-2"
          >
            Add to Order
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemSelector;
