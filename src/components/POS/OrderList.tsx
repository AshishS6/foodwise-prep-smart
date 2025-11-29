
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
  orderType?: 'take_away' | 'seating';
}

const OrderList = ({ 
  cart, 
  total, 
  onUpdateQuantity, 
  onSetQuantity, 
  onUpdateNote,
  onRemoveItem, 
  onSubmitOrder, 
  isSubmitting,
  orderType = 'take_away'
}: OrderListProps) => {
  // Map for tracking which notes are being edited
  const [editingNote, setEditingNote] = useState<number | null>(null);

  // Get color scheme based on order type
  const getOrderTypeColors = () => {
    if (orderType === 'seating') {
      return {
        border: 'border-green-300',
        bg: 'bg-green-50',
        bgDark: 'bg-green-100',
        text: 'text-green-700',
        accent: 'bg-green-600 hover:bg-green-700',
        badge: 'bg-green-100 text-green-800 border-green-300'
      };
    } else {
      // take_away (default)
      return {
        border: 'border-blue-300',
        bg: 'bg-blue-50',
        bgDark: 'bg-blue-100',
        text: 'text-blue-700',
        accent: 'bg-blue-600 hover:bg-blue-700',
        badge: 'bg-blue-100 text-blue-800 border-blue-300'
      };
    }
  };

  const colors = getOrderTypeColors();

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
    <div className={`rounded-lg border-2 ${colors.border} ${colors.bg} p-1 transition-colors`}>
      <div className="flex justify-between items-center mb-4 pb-3 border-b">
        <div className="flex items-center gap-2">
          <ShoppingCart className={`h-5 w-5 ${colors.text}`} />
          <h2 className={`text-xl font-semibold ${colors.text}`}>Current Order</h2>
          {cart.length > 0 && (
            <span className={`${colors.badge} border rounded-full px-2 py-0.5 text-xs font-bold`}>
              {cart.length}
            </span>
          )}
        </div>
      </div>
      
      {cart.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium">
            Your cart is empty
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Add items from the menu above
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
            {cart.map((item, index) => (
              <div 
                key={`${item.menuItemId}-${item.portionType.label}-${index}`} 
                className="flex flex-col bg-background border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
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
                      variant="outline" 
                      size="icon" 
                      className="h-9 w-9"
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
                      className="w-16 h-9 text-center font-semibold" 
                      min="0"
                      onKeyDown={(e) => handleKeyDown(e, index)}
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-9 w-9"
                      onClick={() => onUpdateQuantity(index, 1)}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
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

          <div className={`py-4 border-t ${colors.border} ${colors.bgDark} -mx-3 -mb-3 px-3 rounded-b-lg`}>
            <div className={`flex justify-between mb-2 text-sm ${colors.text} opacity-80`}>
              <span>Subtotal:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between font-bold text-lg mb-4 ${colors.text}`}>
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <Button 
              className={`w-full ${colors.accent} text-white`}
              size="lg"
              onClick={onSubmitOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : `Complete Order (₹${total.toFixed(2)})`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderList;
