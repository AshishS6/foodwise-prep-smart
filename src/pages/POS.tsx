
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, MinusCircle, ShoppingCart, ArrowLeft, Trash2, Upload, Edit, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/stores/authStore";

const POS = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  
  // Cart state
  const [cart, setCart] = useState<Array<{
    menuItemId: number;
    name: string;
    price: number;
    quantity: number;
    isHalf: boolean;
  }>>([]);

  // New menu item state
  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    price: 0,
    isHalf: false
  });

  // File upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<{name: string, price: number}[]>([]);

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

  // Add menu item mutation
  const addMenuItem = useMutation({
    mutationFn: async (item: { name: string, price: number }) => {
      const { data, error } = await supabase
        .from('menuitems')
        .insert({
          name: item.name,
          price: item.price
        });
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setNewMenuItem({ name: "", price: 0, isHalf: false });
      toast({ 
        title: "Menu item added successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add menu item",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Add item to cart
  const addToCart = (item: any, isHalf: boolean = false) => {
    const price = isHalf ? item.price / 2 : item.price;
    const itemName = isHalf ? `${item.name} (Half)` : item.name;
    
    // Create a unique identifier for the item based on id and half status
    const cartItemId = `${item.id}-${isHalf ? 'half' : 'full'}`;
    
    // Check if this specific item variant (half or full) already exists in cart
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

  // Calculate total
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Handle CSV file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };

  // Generate and download sample template
  const downloadSampleTemplate = () => {
    const csvHeader = "Name,Price\n";
    const sampleData = "Butter Chicken,250\nPaneer Tikka,200\nVeg Biryani,180\nNaan,30\n";
    const csvContent = csvHeader + sampleData;
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "menu_items_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = () => {
    if (!csvFile) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target?.result) return;
      
      const text = e.target.result.toString();
      const rows = text.split("\n");
      const items: {name: string, price: number}[] = [];
      
      // Skip header if it exists
      const startRow = rows[0].toLowerCase().includes("name") && rows[0].toLowerCase().includes("price") ? 1 : 0;
      
      for (let i = startRow; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        
        const columns = rows[i].split(",");
        if (columns.length >= 2) {
          const name = columns[0].trim();
          const price = parseFloat(columns[1].trim());
          
          if (name && !isNaN(price)) {
            items.push({ name, price });
          }
        }
      }
      
      setParsedItems(items);
    };
    
    reader.readAsText(csvFile);
  };

  // Import parsed items
  const importItems = async () => {
    if (parsedItems.length === 0) {
      toast({
        title: "No items to import",
        description: "Please upload and parse a CSV file first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      for (const item of parsedItems) {
        await addMenuItem.mutateAsync(item);
      }
      
      setParsedItems([]);
      setCsvFile(null);
      toast({ 
        title: "Menu items imported successfully"
      });
    } catch (error: any) {
      toast({
        title: "Failed to import menu items",
        description: error.message,
        variant: "destructive"
      });
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

  // Check if user is authenticated
  useEffect(() => {
    if (!session) {
      navigate('/auth');
    }
  }, [session, navigate]);

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
            
            {/* Add Menu Item Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Menu Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Menu Item</DialogTitle>
                  <DialogDescription>
                    Add a new item to your restaurant menu.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="item-name">Item Name</Label>
                    <Input 
                      id="item-name" 
                      value={newMenuItem.name}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                      placeholder="Butter Chicken"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="item-price">Price (₹)</Label>
                    <Input 
                      id="item-price" 
                      type="number" 
                      value={newMenuItem.price}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, price: parseFloat(e.target.value) || 0 })}
                      placeholder="250"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    onClick={() => {
                      if (!newMenuItem.name || newMenuItem.price <= 0) {
                        toast({
                          title: "Invalid menu item",
                          description: "Please provide a name and a valid price",
                          variant: "destructive"
                        });
                        return;
                      }
                      addMenuItem.mutate(newMenuItem);
                    }}
                    disabled={addMenuItem.isPending}
                  >
                    Save Item
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Import Menu Items Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Menu
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Menu Items</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file with menu items. Format: Name, Price
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="csv-file">CSV File</Label>
                    <Input 
                      id="csv-file" 
                      type="file" 
                      accept=".csv" 
                      onChange={handleFileChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Example format: "Butter Chicken, 250"
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={downloadSampleTemplate}
                      className="flex items-center mt-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Sample Template
                    </Button>
                  </div>
                  
                  {csvFile && (
                    <Button onClick={parseCSV} variant="secondary">
                      Parse CSV
                    </Button>
                  )}
                  
                  {parsedItems.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Preview ({parsedItems.length} items):</h3>
                      <div className="max-h-32 overflow-y-auto border rounded-md">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="px-2 py-1 text-left">Name</th>
                              <th className="px-2 py-1 text-right">Price (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedItems.map((item, index) => (
                              <tr key={index} className="border-b last:border-0">
                                <td className="px-2 py-1">{item.name}</td>
                                <td className="px-2 py-1 text-right">₹{item.price}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    onClick={importItems}
                    disabled={parsedItems.length === 0 || addMenuItem.isPending}
                  >
                    Import All
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {isLoading ? (
            <p>Loading menu items...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {menuItems?.map((item) => (
                <Card 
                  key={item.id} 
                  className="hover:bg-muted/50 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">₹{item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`half-${item.id}`} className="text-sm">Half</Label>
                        <Switch id={`half-${item.id}`} onCheckedChange={(checked) => setNewMenuItem({ ...newMenuItem, isHalf: checked })} />
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addToCart(item, true)}
                          title="Add half portion"
                        >
                          Add Half
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => addToCart(item, false)}
                        >
                          Add Full
                        </Button>
                      </div>
                    </div>
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
                {cart.map((item, index) => (
                  <div key={`${item.menuItemId}-${item.isHalf}-${index}`} className="flex justify-between items-center bg-background p-3 rounded-md">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">₹{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => updateQuantity(item.menuItemId, item.isHalf, -1)}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <Input 
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value) || 0;
                          setCart(cart.map((cartItem, cartIndex) => 
                            cartIndex === index 
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
                        onClick={() => updateQuantity(item.menuItemId, item.isHalf, 1)}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.menuItemId, item.isHalf)}
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
