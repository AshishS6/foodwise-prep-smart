import { ShoppingCart, MinusCircle, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/types";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { TOUCH_TARGETS, LAYOUT_DIMENSIONS } from "@/constants/mobile";
import { triggerHapticFeedback } from "@/utils/mobileUtils";
import { MobileCard } from "@/components/ui/MobileCard";
import { cn } from "@/lib/utils";

interface MobileOrderListProps {
  cart: CartItem[];
  total: number;
  onUpdateQuantity: (index: number, change: number) => void;
  onSetQuantity: (index: number, quantity: number) => void;
  onUpdateNote?: (index: number, note: string) => void;
  onRemoveItem: (index: number) => void;
  onSubmitOrder: () => void;
  isSubmitting: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  orderType?: 'take_away' | 'seating';
}

const MobileOrderList = ({ 
  cart, 
  total, 
  onUpdateQuantity, 
  onSetQuantity, 
  onUpdateNote,
  onRemoveItem, 
  onSubmitOrder, 
  isSubmitting,
  isOpen = false,
  onOpenChange,
  orderType = 'take_away'
}: MobileOrderListProps) => {
  const { isMobile, touchSupported } = useDeviceDetection();
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteText, setNoteText] = useState<string>("");

  // Get color scheme based on order type
  const getOrderTypeColors = () => {
    if (orderType === 'seating') {
      return {
        border: 'border-green-300',
        bg: 'bg-green-50',
        bgDark: 'bg-green-100',
        text: 'text-green-700',
        accent: 'bg-green-600 hover:bg-green-700',
        badge: 'bg-green-100 text-green-800 border-green-300',
        button: 'bg-green-600 hover:bg-green-700'
      };
    } else {
      // take_away (default)
      return {
        border: 'border-blue-300',
        bg: 'bg-blue-50',
        bgDark: 'bg-blue-100',
        text: 'text-blue-700',
        accent: 'bg-blue-600 hover:bg-blue-700',
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
        button: 'bg-blue-600 hover:bg-blue-700'
      };
    }
  };

  const colors = getOrderTypeColors();

  const handleSwipeDelete = (index: number) => {
    if (touchSupported) {
      triggerHapticFeedback('medium');
    }
    onRemoveItem(index);
  };

  const handleQuantityChange = (index: number, change: number) => {
    if (touchSupported) {
      triggerHapticFeedback('light');
    }
    onUpdateQuantity(index, change);
  };

  if (!isMobile) {
    // Fallback to regular OrderList on desktop
    return null;
  }

  const cartButton = (
    <Button
      className={`fixed bottom-20 right-4 z-40 rounded-full h-14 w-14 shadow-lg ${colors.button} text-white`}
      onClick={() => onOpenChange?.(true)}
      style={{
        bottom: `calc(${LAYOUT_DIMENSIONS.BOTTOM_NAV_HEIGHT}px + 1rem)`,
      }}
    >
      <ShoppingCart className="h-6 w-6" />
      {cart.length > 0 && (
        <span className={`absolute -top-2 -right-2 ${colors.badge} border rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold`}>
          {cart.length}
        </span>
      )}
    </Button>
  );

  return (
    <>
      {cartButton}
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className={`max-h-[85vh] overflow-y-auto ${colors.bg} border-t-4 ${colors.border}`}>
          <SheetHeader>
            <SheetTitle className={colors.text}>Current Order ({cart.length} items)</SheetTitle>
          </SheetHeader>
          
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              Your cart is empty. Add items from the menu.
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {cart.map((item, index) => (
                <MobileCard
                  key={`${item.menuItemId}-${item.portionType.label}-${index}`}
                  swipeable
                  onSwipeLeft={() => handleSwipeDelete(index)}
                  className="p-4"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        ₹{item.price.toFixed(2)} each
                      </p>
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mt-1">
                        <span className="inline-block bg-gray-100 px-2 py-0.5 rounded-full">
                          {item.portionType.label} ({item.portionType.unit})
                        </span>
                      </div>
                      {item.note && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                          Note: {item.note}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn("h-11 w-11")}
                          style={{
                            minWidth: `${TOUCH_TARGETS.MINIMUM}px`,
                            minHeight: `${TOUCH_TARGETS.MINIMUM}px`,
                          }}
                          onClick={() => handleQuantityChange(index, -1)}
                        >
                          <MinusCircle className="h-5 w-5" />
                        </Button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 0;
                            onSetQuantity(index, newQuantity);
                          }}
                          className="w-16 h-11 text-center text-base border rounded-md"
                          min="0"
                          inputMode="numeric"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn("h-11 w-11")}
                          style={{
                            minWidth: `${TOUCH_TARGETS.MINIMUM}px`,
                            minHeight: `${TOUCH_TARGETS.MINIMUM}px`,
                          }}
                          onClick={() => handleQuantityChange(index, 1)}
                        >
                          <PlusCircle className="h-5 w-5" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-11 w-11 text-destructive")}
                        style={{
                          minWidth: `${TOUCH_TARGETS.MINIMUM}px`,
                          minHeight: `${TOUCH_TARGETS.MINIMUM}px`,
                        }}
                        onClick={() => handleSwipeDelete(index)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  
                  {onUpdateNote && (
                    <div className="mt-3 pt-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => {
                          setEditingNote(index);
                          setNoteText(item.note || "");
                        }}
                      >
                        {item.note ? "Edit note" : "Add note"}
                      </Button>
                      {editingNote === index && (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            placeholder="Special instructions (e.g., less spicy)"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            className="min-h-[80px] text-base"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                onUpdateNote(index, noteText);
                                setEditingNote(null);
                                setNoteText("");
                              }}
                              className="flex-1"
                            >
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingNote(null);
                                setNoteText("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </MobileCard>
              ))}
            </div>
          )}
          
          {cart.length > 0 && (
            <SheetFooter className={`sticky bottom-0 ${colors.bgDark} border-t-2 ${colors.border} pt-4 mt-4`}>
              <div className="w-full space-y-3">
                <div className={`flex justify-between items-center text-lg font-bold ${colors.text}`}>
                  <span>Total:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <Button
                  className={`w-full h-14 text-base font-semibold ${colors.button} text-white`}
                  onClick={onSubmitOrder}
                  disabled={isSubmitting}
                  style={{
                    minHeight: `${TOUCH_TARGETS.LARGE}px`,
                  }}
                >
                  {isSubmitting ? "Processing..." : "Place Order"}
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileOrderList;


