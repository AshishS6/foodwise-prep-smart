
import { ShoppingCart, MinusCircle, PlusCircle, Trash2, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/types";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface OrderListProps {
  cart: CartItem[];
  total: number;
  onUpdateQuantity: (index: number, change: number) => void;
  onSetQuantity: (index: number, quantity: number) => void;
  onUpdateNote?: (index: number, note: string) => void;
  onRemoveItem: (index: number) => void;
  onSubmitOrder: () => void;
  isSubmitting: boolean;
}

const OrderList = ({ 
  cart, 
  total, 
  onUpdateQuantity, 
  onSetQuantity, 
  onUpdateNote,
  onRemoveItem, 
  onSubmitOrder, 
  isSubmitting 
}: OrderListProps) => {
  // Map for tracking which notes are being edited
  const [editingNote, setEditingNote] = useState<number | null>(null);

  // Handle keyboard shortcuts for quantity adjustment
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // Plus key increases quantity
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      onUpdateQuantity(index, 1);
    }
    // Minus key decreases quantity
    else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      onUpdateQuantity(index, -1);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Current Order</h2>
        <ShoppingCart className="h-5 w-5" />
      </div>
      
      {cart.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Your cart is empty. Add items from the menu.
        </p>
      ) : (
        <>
          <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
            {cart.map((item, index) => (
              <div 
                key={`${item.menuItemId}-${item.portionType.label}-${index}`} 
                className="flex flex-col bg-background p-3 rounded-md"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-bold text-base">{item.name}</p>
                    <p className="text-sm font-semibold text-muted-foreground">
                      ₹{item.price.toFixed(2)} each
                    </p>
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mt-1">
                      <span className="inline-block bg-gray-100 px-2 py-0.5 rounded-full">
                        {item.portionType.label} ({item.portionType.unit})
                      </span>
                      <span>
                        × {item.portionType.multiplier}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-xs font-medium text-muted-foreground italic mt-1">
                        Note: {item.note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => onUpdateQuantity(index, -1)}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <Input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value) || 0;
                        onSetQuantity(index, newQuantity);
                      }} 
                      className="w-16 h-8 text-center" 
                      min="0"
                      onKeyDown={(e) => handleKeyDown(e, index)}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => onUpdateQuantity(index, 1)}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => onRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {onUpdateNote && (
                  <div className="mt-2">
                    <Popover open={editingNote === index} onOpenChange={(open) => {
                      if (open) {
                        setEditingNote(index);
                      } else {
                        setEditingNote(null);
                      }
                    }}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs w-full justify-start px-2 py-1 h-7 font-normal"
                        >
                          {item.note ? "Edit note" : "Add note"} (e.g., "less spicy")
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-2">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Special instructions</h4>
                          <Textarea 
                            placeholder="Add special instructions here..."
                            value={item.note || ''}
                            onChange={(e) => onUpdateNote(index, e.target.value)}
                            className="min-h-[80px]"
                          />
                          <div className="flex justify-end">
                            <Button 
                              size="sm" 
                              onClick={() => setEditingNote(null)}
                              className="mt-2"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="py-3 border-t border-border">
            <div className="flex justify-between mb-2 font-semibold">
              <span>Subtotal:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4">
            <Button 
              className="w-full" 
              size="lg"
              onClick={onSubmitOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : `Complete Order (₹${total.toFixed(2)})`}
            </Button>
          </div>
        </>
      )}
    </>
  );
};

export default OrderList;
