
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, MinusCircle, ShoppingCart, ArrowLeft, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const POS = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Cart state
  const [cart, setCart] = useState<Array<{
    menuItemId: number;
    name: string;
    price: number;
    quantity: number;
  }>>([]);

  // Fetch menu items
  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menuitems')
        .select('*')
        .order('name');
      
      if (error) {
        toast({
          title: "Error loading menu items",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return data;
    }
  });

  // Add item to cart
  const addToCart = (item: any) => {
    const existingItem = cart.find(cartItem => cartItem.menuItemId === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.menuItemId === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 } 
          : cartItem
      ));
    } else {
      setCart([...cart, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1
      }]);
    }
  };

  // Update item quantity in cart
  const updateQuantity = (menuItemId: number, change: number) => {
    const updatedCart = cart.map(item => {
      if (item.menuItemId === menuItemId) {
        const newQuantity = Math.max(0, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0);

    setCart(updatedCart);
  };

  // Remove item from cart
  const removeFromCart = (menuItemId: number) => {
    setCart(cart.filter(item => item.menuItemId !== menuItemId));
  };

  // Calculate total
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
      // This would ideally be handled by a database trigger or transaction
      // but we'll implement it client-side for simplicity
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
            const totalUsed = recipe.quantity * item.quantity;
            
            const { error: updateError } = await supabase
              .from('ingredients')
              .update({ 
                stock: supabase.rpc('decrement_stock', { 
                  ingredient_id: recipe.ingredientid, 
                  amount: totalUsed 
                }) 
              })
              .eq('id', recipe.ingredientid);
            
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
      <div className="flex items-center mb-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Menu Items</h2>
          </div>
          
          {isLoading ? (
            <p>Loading menu items...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {menuItems?.map((item) => (
                <Card 
                  key={item.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => addToCart(item)}
                >
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                    </div>
                    <PlusCircle className="h-5 w-5 text-primary" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="bg-muted/30 rounded-lg p-4 border">
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
                {cart.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between items-center bg-background p-3 rounded-md">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => updateQuantity(item.menuItemId, -1)}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <Input 
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value) || 0;
                          setCart(cart.map(cartItem => 
                            cartItem.menuItemId === item.menuItemId 
                              ? { ...cartItem, quantity: Math.max(0, newQuantity) } 
                              : cartItem
                          ));
                        }} 
                        className="w-16 h-8 text-center" 
                        min="0"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => updateQuantity(item.menuItemId, 1)}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.menuItemId)}
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
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => submitOrder.mutate()}
                  disabled={submitOrder.isPending}
                >
                  {submitOrder.isPending ? "Processing..." : "Complete Order"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default POS;
