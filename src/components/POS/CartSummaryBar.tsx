import React, { useState, useEffect } from "react";
import { ShoppingCart, CheckCircle2, Utensils, Package, Split, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/types";
import { LAYOUT_DIMENSIONS } from "@/constants/mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderList from "./OrderList";

interface CartSummaryBarProps {
  cart: CartItem[];
  total: number;
  currentBillGroup: number;
  billGroups: number[];
  orderTypes: Record<number, 'take_away' | 'seating'>;
  onUpdateQuantity: (itemId: number, portionLabel: string, change: number) => void;
  onSetQuantity: (itemId: number, portionLabel: string, quantity: number) => void;
  onUpdateNote: (itemId: number, portionLabel: string, note: string) => void;
  onRemoveItem: (itemId: number, portionLabel: string) => void;
  onOrderTypeChange: (billGroup: number, orderType: 'take_away' | 'seating') => void;
  onBillGroupChange: (billGroup: number) => void;
  onAddBillGroup: () => number;
  onDeleteBillGroup: (billGroup: number) => void;
  onSubmitOrder: (billGroup?: number) => void;
  onSubmitAllOrders: () => void;
  isSubmitting: boolean;
}

const CartSummaryBar = ({
  cart,
  total,
  currentBillGroup,
  billGroups,
  orderTypes,
  onUpdateQuantity,
  onSetQuantity,
  onUpdateNote,
  onRemoveItem,
  onOrderTypeChange,
  onBillGroupChange,
  onAddBillGroup,
  onDeleteBillGroup,
  onSubmitOrder,
  onSubmitAllOrders,
  isSubmitting
}: CartSummaryBarProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [localCurrentBillGroup, setLocalCurrentBillGroup] = useState(currentBillGroup);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalCurrentBillGroup(currentBillGroup);
  }, [currentBillGroup]);

  // Get current bill group items
  const currentBillItems = cart.filter(item => item.billGroup === localCurrentBillGroup);
  const currentBillTotal = currentBillItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const currentOrderType = orderTypes[localCurrentBillGroup] || 'take_away';

  const handleBillGroupChange = (value: string) => {
    const newGroup = Number(value);
    setLocalCurrentBillGroup(newGroup);
    onBillGroupChange(newGroup);
  };

  const handleAddBillGroup = () => {
    const newGroup = onAddBillGroup();
    setLocalCurrentBillGroup(newGroup);
    onBillGroupChange(newGroup);
  };

  // Get color scheme based on order type
  const getOrderTypeColors = () => {
    if (currentOrderType === 'seating') {
      return {
        bg: 'bg-green-500',
        bgHover: 'bg-green-600',
        text: 'text-white',
        border: 'border-green-400'
      };
    } else {
      return {
        bg: 'bg-blue-500',
        bgHover: 'bg-blue-600',
        text: 'text-white',
        border: 'border-blue-400'
      };
    }
  };

  const colors = getOrderTypeColors();

  // Don't show if cart is empty
  if (cart.length === 0) {
    return null;
  }

  // Calculate total items count
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Sticky Cart Summary Bar */}
      <div 
        className={`fixed bottom-0 left-0 right-0 ${colors.bg} ${colors.text} shadow-lg z-50 transition-all duration-300`}
        style={{
          paddingBottom: `${LAYOUT_DIMENSIONS.BOTTOM_NAV_HEIGHT}px`
        }}
      >
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              className="w-full px-4 py-3 flex items-center justify-between active:opacity-90 transition-opacity"
              onClick={() => setSheetOpen(true)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Cart Icon with Badge */}
                <div className="relative shrink-0">
                  <ShoppingCart className="h-6 w-6" />
                  {totalItems > 0 && (
                    <span className={`absolute -top-2 -right-2 bg-white ${currentOrderType === 'seating' ? 'text-green-600' : 'text-blue-600'} rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold`}>
                      {totalItems}
                    </span>
                  )}
                </div>
                
                {/* Bill Groups Display - Inline with + button after last bill */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
                  {billGroups.map((group, index) => (
                    <React.Fragment key={group}>
                      <span className="font-semibold text-sm whitespace-nowrap">
                        #{group}
                      </span>
                      {/* New Bill Button - Show only after the last bill */}
                      {index === billGroups.length - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddBillGroup();
                          }}
                          className="p-1 bg-white/20 hover:bg-white/30 rounded transition-colors flex-shrink-0 active:scale-95"
                          title="New Bill"
                          aria-label="Add new bill"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Order Type Toggle - Compact */}
                <div className="flex items-center gap-0.5 bg-white/20 rounded-lg p-0.5 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOrderTypeChange(localCurrentBillGroup, 'take_away');
                    }}
                    className={`px-2 py-1.5 rounded text-xs font-bold transition-all ${
                      currentOrderType === 'take_away'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                    title="Parcel / Take Away"
                    aria-label="Set order type to Parcel"
                  >
                    <Package className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOrderTypeChange(localCurrentBillGroup, 'seating');
                    }}
                    className={`px-2 py-1.5 rounded text-xs font-bold transition-all ${
                      currentOrderType === 'seating'
                        ? 'bg-white text-green-600 shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                    title="Seating / Dine In"
                    aria-label="Set order type to Seating"
                  >
                    <Utensils className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Total Amount */}
                <div className="flex flex-col items-end shrink-0 ml-2">
                  <span className="text-sm font-bold">
                    ₹{currentBillTotal.toFixed(2)}
                  </span>
                  {billGroups.length > 1 && (
                    <span className="text-xs opacity-80">
                      All: ₹{total.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Complete Order Button - Highlighted and Functional */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (billGroups.length === 1) {
                      onSubmitOrder(localCurrentBillGroup);
                    } else {
                      onSubmitAllOrders();
                    }
                  }}
                  disabled={isSubmitting || currentBillItems.length === 0}
                  className={`shrink-0 ml-2 p-2 rounded-full transition-all ${
                    isSubmitting || currentBillItems.length === 0
                      ? 'bg-white/20 opacity-50 cursor-not-allowed'
                      : 'bg-white hover:bg-white/90 shadow-lg hover:shadow-xl active:scale-95'
                  }`}
                  title={billGroups.length === 1 ? "Complete Order" : "Complete All Orders"}
                  aria-label={billGroups.length === 1 ? "Complete Order" : "Complete All Orders"}
                >
                  <CheckCircle2 className={`h-5 w-5 ${
                    isSubmitting || currentBillItems.length === 0
                      ? 'text-white/50'
                      : currentOrderType === 'seating' ? 'text-green-600' : 'text-blue-600'
                  }`} />
                </button>
              </div>
            </button>
          </SheetTrigger>

          <SheetContent 
            side="bottom" 
            className="h-[85vh] p-0 flex flex-col"
          >
            <SheetHeader className="px-4 pt-4 pb-3 border-b space-y-3">
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Cart ({totalItems} items)</span>
              </SheetTitle>
              
              {/* Bill Groups Header */}
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-base">Bill Groups</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddBillGroup}
                  className="flex items-center gap-1"
                >
                  <Split className="h-3 w-3" />
                  New Bill
                </Button>
              </div>

              {/* Bill Tabs */}
              <Tabs value={String(localCurrentBillGroup)} onValueChange={handleBillGroupChange}>
                <TabsList className="w-full flex overflow-x-auto gap-1">
                  {billGroups.map((group) => {
                    const groupItems = cart.filter(item => item.billGroup === group);
                    const groupTotal = groupItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    return (
                      <TabsTrigger 
                        key={group} 
                        value={String(group)}
                        className="flex-1 min-w-[80px] text-xs relative"
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span>Bill #{group}</span>
                          <span className="text-[10px] opacity-70">₹{groupTotal.toFixed(0)}</span>
                        </div>
                        {billGroups.length > 1 && group !== 1 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 w-5 p-0 absolute -top-1 -right-1 rounded-full hover:bg-destructive/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onDeleteBillGroup(group);
                              if (localCurrentBillGroup === group) {
                                const remainingGroups = billGroups.filter(g => g !== group);
                                if (remainingGroups.length > 0) {
                                  setLocalCurrentBillGroup(remainingGroups[0]);
                                  onBillGroupChange(remainingGroups[0]);
                                }
                              }
                            }}
                          >
                            <span className="text-xs">×</span>
                          </Button>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {/* Order Type Selector for Current Bill */}
                <div className="flex items-center gap-2 mt-3">
                  <label className={`text-sm font-medium ${
                    currentOrderType === 'seating' ? 'text-green-700' : 'text-blue-700'
                  }`}>
                    Order Type (Bill #{localCurrentBillGroup}):
                  </label>
                  <Select 
                    value={currentOrderType} 
                    onValueChange={(value: 'take_away' | 'seating') => {
                      onOrderTypeChange(localCurrentBillGroup, value);
                    }}
                  >
                    <SelectTrigger className={`w-[140px] ${
                      currentOrderType === 'seating' 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-blue-300 bg-blue-50'
                    }`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="take_away">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>Parcel</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="seating">
                        <div className="flex items-center gap-2">
                          <Utensils className="h-4 w-4" />
                          <span>Seating</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bill Content */}
                {billGroups.map((group) => {
                  const groupItems = cart.filter(item => item.billGroup === group);
                  const groupTotal = groupItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                  const groupOrderType = orderTypes[group] || 'take_away';
                  
                  return (
                    <TabsContent key={group} value={String(group)} className="mt-0">
                      <div className="flex-1 overflow-y-auto p-4 -mx-4">
                        <OrderList
                          cart={groupItems}
                          total={groupTotal}
                          orderType={groupOrderType}
                          onUpdateQuantity={(index, change) => {
                            const item = groupItems[index];
                            if (item) {
                              // Find the item in the full cart by matching all criteria including billGroup
                              const fullCartIndex = cart.findIndex(cartItem => 
                                cartItem.menuItemId === item.menuItemId && 
                                cartItem.portionType.label === item.portionType.label &&
                                cartItem.billGroup === group
                              );
                              if (fullCartIndex !== -1) {
                                // Call handler - it will find by itemId and portionLabel
                                // Since we filtered by group, the item is unique to this group
                                onUpdateQuantity(item.menuItemId, item.portionType.label, change);
                              }
                            }
                          }}
                          onSetQuantity={(index, quantity) => {
                            const item = groupItems[index];
                            if (item) {
                              onSetQuantity(item.menuItemId, item.portionType.label, quantity);
                            }
                          }}
                          onUpdateNote={(index, note) => {
                            const item = groupItems[index];
                            if (item) {
                              onUpdateNote(item.menuItemId, item.portionType.label, note);
                            }
                          }}
                          onRemoveItem={(index) => {
                            const item = groupItems[index];
                            if (item) {
                              onRemoveItem(item.menuItemId, item.portionType.label);
                            }
                          }}
                          onSubmitOrder={() => {
                            onSubmitOrder(group);
                            if (billGroups.length === 1) {
                              setSheetOpen(false);
                            }
                          }}
                          isSubmitting={isSubmitting}
                        />
                        {groupItems.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <Button
                              variant="outline"
                              className="w-full text-sm"
                              onClick={() => {
                                onSubmitOrder(group);
                                if (billGroups.length === 1) {
                                  setSheetOpen(false);
                                }
                              }}
                              disabled={isSubmitting}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Complete Bill #{group}
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </SheetHeader>

            {/* Complete All Bills Button */}
            {billGroups.length > 1 && (
              <div className="px-4 pb-4 border-t pt-3 mt-auto">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    onSubmitAllOrders();
                    setSheetOpen(false);
                  }}
                  disabled={isSubmitting || cart.length === 0}
                >
                  {isSubmitting ? "Processing..." : `Complete All Bills (₹${total.toFixed(2)})`}
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default CartSummaryBar;
