import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, AlertCircle, Split, FileText } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import MenuList from "./MenuList";
import OrderList from "./OrderList";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsItem, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type CartItem = {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  isHalf: boolean;
  note?: string;
  billGroup?: number;
};

const POSContainer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, userRole } = useAuthStore();
  const timeZone = "Asia/Kolkata";

  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentBillGroup, setCurrentBillGroup] = useState<number>(1);
  const [billGroups, setBillGroups] = useState<number[]>([1]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [missingRecipes, setMissingRecipes] = useState<string[]>([]);
  const [showMissingRecipeAlert, setShowMissingRecipeAlert] = useState(false);
  const [isValidatingOrder, setIsValidatingOrder] = useState(false);

  const currentGroupTotal = cart
    .filter(item => item.billGroup === currentBillGroup)
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const addBillGroup = () => {
    const newGroup = Math.max(...billGroups) + 1;
    setBillGroups([...billGroups, newGroup]);
    setCurrentBillGroup(newGroup);
  };

  const deleteBillGroup = (groupToDelete: number) => {
    if (billGroups.length <= 1) return;
    
    const updatedCart = cart.filter(item => item.billGroup !== groupToDelete);
    setCart(updatedCart);
    
    const updatedGroups = billGroups.filter(g => g !== groupToDelete);
    setBillGroups(updatedGroups);
    
    setCurrentBillGroup(updatedGroups[0]);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
      return;
    }

    if (e.key >= '1' && e.key <= '9') {
      const groupIndex = parseInt(e.key) - 1;
      if (groupIndex < billGroups.length) {
        setCurrentBillGroup(billGroups[groupIndex]);
      }
    }

    if (e.key === '+') {
      addBillGroup();
    }
  };

  const logActivity = async (action: string, entityType: string, entityId: string, details: any = {}) => {
    try {
      await supabase.rpc('log_activity', {
        action,
        entity_type: entityType,
        entity_id: entityId,
        details
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  const { data: recipes } = useQuery({
    queryKey: ['allRecipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*');
      
      if (error) {
        console.error('Error fetching recipes:', error);
        return [];
      }
      
      return data || [];
    }
  });

  const addToCart = (item: any, isHalf: boolean = false, note: string = '') => {
    const price = isHalf ? (item.halfprice || item.price / 2) : item.price;
    const itemName = isHalf ? `${item.name} (Half)` : item.name;
    
    const existingItemIndex = cart.findIndex(cartItem => 
      cartItem.menuItemId === item.id && 
      cartItem.isHalf === isHalf && 
      cartItem.note === note &&
      cartItem.billGroup === currentBillGroup
    );
    
    if (existingItemIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + 1
      };
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        menuItemId: item.id,
        name: itemName,
        price: price,
        quantity: 1,
        isHalf: isHalf,
        note: note,
        billGroup: currentBillGroup
      }]);
    }
  };

  const updateQuantity = (index: number, change: number) => {
    const updatedCart = [...cart];
    const newQuantity = Math.max(0, updatedCart[index].quantity + change);
    
    if (newQuantity === 0) {
      updatedCart.splice(index, 1);
    } else {
      updatedCart[index] = { ...updatedCart[index], quantity: newQuantity };
    }
    
    setCart(updatedCart);
  };

  const removeFromCart = (index: number) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
  };

  const updateNote = (index: number, note: string) => {
    const updatedCart = [...cart];
    updatedCart[index] = { ...updatedCart[index], note };
    setCart(updatedCart);
  };

  const setItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    
    const updatedCart = [...cart];
    updatedCart[index] = { ...updatedCart[index], quantity };
    setCart(updatedCart);
  };

  const validateOrderRecipes = async () => {
    if (!recipes || recipes.length === 0 || cart.length === 0) return true;
    
    const missingRecipeItems: string[] = [];
    
    for (const item of cart) {
      const hasRecipes = recipes.some(recipe => recipe.menuitemid === item.menuItemId);
      
      if (!hasRecipes) {
        missingRecipeItems.push(item.name);
      }
    }
    
    if (missingRecipeItems.length > 0) {
      setMissingRecipes(missingRecipeItems);
      return false;
    }
    
    return true;
  };

  const handleOrderSubmit = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to your cart before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsValidatingOrder(true);
    const isValid = await validateOrderRecipes();
    setIsValidatingOrder(false);
    
    if (!isValid) {
      setShowMissingRecipeAlert(true);
    } else {
      submitOrder.mutate();
    }
  };

  const submitCurrentGroup = async () => {
    const currentGroupItems = cart.filter(item => item.billGroup === currentBillGroup);
    
    if (currentGroupItems.length === 0) {
      toast({
        title: "Empty bill",
        description: "Please add items to the current bill before submitting",
        variant: "destructive"
      });
      return;
    }
    
    setIsValidatingOrder(true);
    const isValid = await validateOrderRecipes();
    setIsValidatingOrder(false);
    
    if (!isValid) {
      setShowMissingRecipeAlert(true);
    } else {
      submitBillGroup.mutate(currentBillGroup);
    }
  };

  const submitOrder = useMutation({
    mutationFn: async () => {
      try {
        const groupedBills = billGroups.map(groupId => {
          const groupItems = cart.filter(item => item.billGroup === groupId);
          const groupTotal = groupItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          return { items: groupItems, total: groupTotal };
        }).filter(group => group.items.length > 0);
        
        for (const bill of groupedBills) {
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([{
              items: bill.items,
              total: bill.total,
              timestamp: new Date().toISOString()
            }])
            .select();

          if (orderError) throw new Error(orderError.message);
          
          logActivity('create', 'order', orderData?.[0]?.id?.toString(), {
            total: bill.total,
            items: bill.items.length
          });
          
          for (const item of bill.items) {
            await updateIngredientStocks(item);
          }
        }
        
        return { success: true };
      } catch (error: any) {
        console.error("Error submitting order:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ 
        title: "Orders submitted successfully",
        variant: "default"
      });
      setCart([]);
      setBillGroups([1]);
      setCurrentBillGroup(1);
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['todaySales'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit order",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const submitBillGroup = useMutation({
    mutationFn: async (groupId: number) => {
      try {
        const groupItems = cart.filter(item => item.billGroup === groupId);
        const groupTotal = groupItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([{
            items: groupItems,
            total: groupTotal,
            timestamp: new Date().toISOString()
          }])
          .select();

        if (orderError) throw new Error(orderError.message);
        
        logActivity('create', 'order', orderData?.[0]?.id?.toString(), {
          total: groupTotal,
          items: groupItems.length
        });
        
        for (const item of groupItems) {
          await updateIngredientStocks(item);
        }
        
        return { success: true, groupId };
      } catch (error: any) {
        console.error(`Error submitting bill group ${groupId}:`, error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({ 
        title: `Bill #${data.groupId} submitted successfully`,
        variant: "default"
      });
      
      setCart(cart.filter(item => item.billGroup !== data.groupId));
      
      if (billGroups.length > 1) {
        setBillGroups(billGroups.filter(g => g !== data.groupId));
        setCurrentBillGroup(billGroups.filter(g => g !== data.groupId)[0]);
      } else {
        setCurrentBillGroup(1);
      }
      
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['todaySales'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit bill",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateIngredientStocks = async (item: CartItem) => {
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('ingredientid, quantity')
      .eq('menuitemid', item.menuItemId);
    
    if (recipesError) throw new Error(recipesError.message);
    
    if (recipes) {
      for (const recipe of recipes) {
        const multiplier = item.isHalf ? 0.5 : 1;
        const totalUsed = recipe.quantity * item.quantity * multiplier;
        
        const { error: updateError } = await supabase.rpc(
          'decrement_stock',
          { 
            ingredient_id: recipe.ingredientid,
            amount: totalUsed 
          }
        );
        
        if (updateError) throw new Error(updateError.message);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Point of Sale</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">👤 {user?.email} | {userRole}</span>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2" onClick={() => navigate('/analytics')}>
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Analytics
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Sales Analytics</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <MenuList 
            onAddToCart={addToCart} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
          />
        </div>

        <div className="bg-muted/30 rounded-lg p-4 border">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Bill Groups</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addBillGroup}
                className="flex items-center gap-1"
              >
                <Split className="h-3 w-3" />
                New Bill
              </Button>
            </div>
            <Tabs value={String(currentBillGroup)} onValueChange={(val) => setCurrentBillGroup(Number(val))}>
              <TabsList className="w-full flex overflow-x-auto">
                {billGroups.map((group) => (
                  <TabsTrigger 
                    key={group} 
                    value={String(group)}
                    className="flex-1 min-w-[60px]"
                  >
                    Bill #{group}
                    {billGroups.length > 1 && group !== 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 w-5 p-0 ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBillGroup(group);
                        }}
                      >
                        ×
                      </Button>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {billGroups.map((group) => (
                <TabsContent key={group} value={String(group)}>
                  <OrderList 
                    cart={cart.filter(item => item.billGroup === group)} 
                    total={cart
                      .filter(item => item.billGroup === group)
                      .reduce((sum, item) => sum + (item.price * item.quantity), 0)
                    }
                    onUpdateQuantity={(index, change) => {
                      const globalIndex = cart.findIndex((item, i) => 
                        item.billGroup === group && 
                        i === index + cart.filter(item => item.billGroup === group).findIndex((_, idx) => idx === 0)
                      );
                      updateQuantity(globalIndex, change);
                    }}
                    onSetQuantity={(index, quantity) => {
                      const globalIndex = cart.findIndex((item, i) => 
                        item.billGroup === group && 
                        i === index + cart.filter(item => item.billGroup === group).findIndex((_, idx) => idx === 0)
                      );
                      setItemQuantity(globalIndex, quantity);
                    }}
                    onUpdateNote={(index, note) => {
                      const globalIndex = cart.findIndex((item, i) => 
                        item.billGroup === group && 
                        i === index + cart.filter(item => item.billGroup === group).findIndex((_, idx) => idx === 0)
                      );
                      updateNote(globalIndex, note);
                    }}
                    onRemoveItem={(index) => {
                      const globalIndex = cart.findIndex((item, i) => 
                        item.billGroup === group && 
                        i === index + cart.filter(item => item.billGroup === group).findIndex((_, idx) => idx === 0)
                      );
                      removeFromCart(globalIndex);
                    }}
                    onSubmitOrder={submitCurrentGroup}
                    isSubmitting={submitBillGroup.isPending || isValidatingOrder}
                  />
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      className="w-full text-sm"
                      onClick={submitCurrentGroup}
                      disabled={submitBillGroup.isPending || isValidatingOrder}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Complete Bill #{group}
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleOrderSubmit}
              disabled={submitOrder.isPending || isValidatingOrder || cart.length === 0}
            >
              {submitOrder.isPending || isValidatingOrder ? "Processing..." : `Complete All Bills (₹${total.toFixed(2)})`}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showMissingRecipeAlert} onOpenChange={setShowMissingRecipeAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
              Missing Recipe Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p>The following items do not have recipe data defined:</p>
              <ul className="mt-2 list-disc pl-5">
                {missingRecipes.map((item, index) => (
                  <li key={index} className="mb-1">{item}</li>
                ))}
              </ul>
              <p className="mt-2">
                Without recipe data, inventory stock will not be automatically reduced.
                Do you want to continue anyway?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (currentBillGroup !== billGroups[0]) {
                submitBillGroup.mutate(currentBillGroup);
              } else {
                submitOrder.mutate();
              }
            }}>
              Continue Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default POSContainer;
