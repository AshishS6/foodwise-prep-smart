
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, AlertCircle } from "lucide-react";
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

// Define cart item type that includes variant information
export type CartItem = {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  isHalf: boolean;
};

const POSContainer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, userRole, logActivity } = useAuthStore();
  const timeZone = "Asia/Kolkata"; // Set timezone to IST
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  // Alert state for items with missing recipes
  const [missingRecipes, setMissingRecipes] = useState<string[]>([]);
  const [showMissingRecipeAlert, setShowMissingRecipeAlert] = useState(false);
  const [isValidatingOrder, setIsValidatingOrder] = useState(false);

  // Calculate total
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Fetch all recipes for validation
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

  // Add item to cart
  const addToCart = (item: any, isHalf: boolean = false) => {
    // Use specific half price if available, otherwise calculate as half of full price
    const price = isHalf ? (item.halfprice || item.price / 2) : item.price;
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

  // Check if all menu items in cart have recipes defined
  const validateOrderRecipes = async () => {
    if (!recipes || recipes.length === 0 || cart.length === 0) return true;
    
    const missingRecipeItems: string[] = [];
    
    for (const item of cart) {
      // Check if this menu item has any recipes defined
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

  // Handle order validation before submission
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
      
      // Log the order creation
      logActivity('create', 'order', orderData?.[0]?.id?.toString(), {
        total: total,
        items: cart.length
      });
      
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
            onSubmitOrder={handleOrderSubmit}
            isSubmitting={submitOrder.isPending || isValidatingOrder}
          />
        </div>
      </div>

      {/* Alert Dialog for Missing Recipes */}
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
            <AlertDialogAction onClick={() => submitOrder.mutate()}>
              Continue Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default POSContainer;
