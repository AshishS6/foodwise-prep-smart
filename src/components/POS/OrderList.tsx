
import { ShoppingCart, MinusCircle, PlusCircle, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CartItem } from "./POSContainer";

interface OrderListProps {
  cart: CartItem[];
  total: number;
  onUpdateQuantity: (menuItemId: number, isHalf: boolean, change: number) => void;
  onSetQuantity: (menuItemId: number, isHalf: boolean, quantity: number) => void;
  onRemoveItem: (menuItemId: number, isHalf: boolean) => void;
  onSubmitOrder: () => void;
  isSubmitting: boolean;
}

const OrderList = ({ 
  cart, 
  total, 
  onUpdateQuantity, 
  onSetQuantity, 
  onRemoveItem, 
  onSubmitOrder, 
  isSubmitting 
}: OrderListProps) => {
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
                key={`${item.menuItemId}-${item.isHalf}-${index}`} 
                className="flex justify-between items-center bg-background p-3 rounded-md"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">₹{item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => onUpdateQuantity(item.menuItemId, item.isHalf, -1)}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <Input 
                    type="number" 
                    value={item.quantity} 
                    onChange={(e) => {
                      const newQuantity = parseInt(e.target.value) || 0;
                      onSetQuantity(item.menuItemId, item.isHalf, newQuantity);
                    }} 
                    className="w-16 h-8 text-center" 
                    min="0"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => onUpdateQuantity(item.menuItemId, item.isHalf, 1)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => onRemoveItem(item.menuItemId, item.isHalf)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="py-3 border-t border-border">
            <div className="flex justify-between mb-2">
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
              {isSubmitting ? "Processing..." : "Complete Order"}
            </Button>
          </div>
        </>
      )}
    </>
  );
};

export default OrderList;
