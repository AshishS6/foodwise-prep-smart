
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Calculator, PlusSquare, ShoppingBag } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import MenuList from "./MenuList";
import OrderList from "./OrderList";

// Define cart item type that includes variant information
export type CartItem = {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  isHalf: boolean;
};

// Mock roles for demonstration (in a real app, would come from auth system)
const ROLES = ["Admin", "Kitchen Staff", "Cashier"];

const POSContainer = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  // For demo purposes - in a real app this would come from user profile
  const [userRole] = useState(ROLES[0]); // Default to Admin for demo
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Calculate total
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Add item to cart
  const addToCart = (item: any, isHalf: boolean = false) => {
    // Use specific half price if available, otherwise calculate as half of full price
    const price = isHalf ? (item.halfPrice || item.price / 2) : item.price;
    const itemName = isHalf ? `${item.name} (Half)` : item.name;
    
    // Check if this specific item variant already exists in cart
    const existingItemIndex = cart.findIndex(cartItem => 
      cartItem.menuItemId === item.id && cartItem.isHalf === isHalf
    );
    
    if (existingItemIndex !== -1) {
      // Update the quantity of the existing item
      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + 1
      };
      setCart(updatedCart);
    } else {
      // Add as a new item
      setCart([...cart, {
        menuItemId: item.id,
        name: itemName,
        price: price,
        quantity: 1,
        isHalf: isHalf
      }]);
    }
  };

  // Update item quantity in cart
  const updateQuantity = (menuItemId: number, isHalf: boolean, change: number) => {
    const updatedCart = cart.map(item => {
      if (item.menuItemId === menuItemId && item.isHalf === isHalf) {
        const newQuantity = Math.max(0, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0);

    setCart(updatedCart);
  };

  // Remove item from cart
  const removeFromCart = (menuItemId: number, isHalf: boolean) => {
    setCart(cart.filter(item => !(item.menuItemId === menuItemId && item.isHalf === isHalf)));
  };

  // Direct update of item quantity
  const setItemQuantity = (menuItemId: number, isHalf: boolean, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId, isHalf);
      return;
    }
    
    setCart(cart.map(item => {
      if (item.menuItemId === menuItemId && item.isHalf === isHalf) {
        return { ...item, quantity };
      }
      return item;
    }));
  };

  // Submit order mutation
  const submitOrder = useMutation({
    mutationFn: async () => {
      // First, create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          items: cart,
          total: total,
          timestamp: new Date().toISOString()
        }])
        .select();

      if (orderError) throw new Error(orderError.message);
      
      // Next, update ingredient stock levels based on recipes
      for (const item of cart) {
        // Get recipes for this menu item
        const { data: recipes, error: recipesError } = await supabase
          .from('recipes')
          .select('ingredientid, quantity')
          .eq('menuitemid', item.menuItemId);
        
        if (recipesError) throw new Error(recipesError.message);
        
        // Update stock for each ingredient
        if (recipes) {
          for (const recipe of recipes) {
            // For half items, use half the ingredients
            const multiplier = item.isHalf ? 0.5 : 1;
            const totalUsed = recipe.quantity * item.quantity * multiplier;
            
            // Use the RPC function to decrement stock
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
      }
      
      return orderData;
    },
    onSuccess: () => {
      toast({ 
        title: "Order submitted successfully",
        variant: "default"
      });
      setCart([]);
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
        
        {/* User and role info */}
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

      {/* Quick Action Buttons */}
      <div className="fixed bottom-6 right-6 z-10 flex flex-col gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="rounded-full h-12 w-12 shadow-lg" onClick={() => navigate('/pos')}>
                <Calculator className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>New Order</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="rounded-full h-12 w-12 shadow-lg bg-orange-500 hover:bg-orange-600" onClick={() => navigate('/inventory')}>
                <ShoppingBag className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>New Purchase</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="rounded-full h-12 w-12 shadow-lg bg-green-500 hover:bg-green-600" onClick={() => navigate('/recipes')}>
                <PlusSquare className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Add Recipe</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2 space-y-4">
          <MenuList onAddToCart={addToCart} />
        </div>

        {/* Order List */}
        <div className="bg-muted/30 rounded-lg p-4 border">
          <OrderList 
            cart={cart} 
            total={total}
            onUpdateQuantity={updateQuantity}
            onSetQuantity={setItemQuantity}
            onRemoveItem={removeFromCart}
            onSubmitOrder={() => submitOrder.mutate()}
            isSubmitting={submitOrder.isPending}
          />
        </div>
      </div>
    </div>
  );
};

export default POSContainer;
