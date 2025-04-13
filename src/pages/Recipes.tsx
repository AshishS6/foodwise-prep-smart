
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const Recipes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Selected menu item for viewing/editing recipe
  const [selectedMenuItem, setSelectedMenuItem] = useState<number | null>(null);
  
  // New recipe ingredient state
  const [newIngredient, setNewIngredient] = useState<{
    ingredientId: number | null;
    quantity: number;
  }>({
    ingredientId: null,
    quantity: 1
  });
  
  // Fetch menu items
  const { data: menuItems, isLoading: menuItemsLoading } = useQuery({
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
  
  // Fetch ingredients
  const { data: ingredients, isLoading: ingredientsLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name');
      
      if (error) {
        toast({
          title: "Error loading ingredients",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return data;
    }
  });
  
  // Fetch recipe for selected menu item
  const { data: recipe, isLoading: recipeLoading } = useQuery({
    queryKey: ['recipe', selectedMenuItem],
    queryFn: async () => {
      if (!selectedMenuItem) return [];
      
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id,
          quantity,
          ingredients:ingredientid (id, name, unit)
        `)
        .eq('menuitemid', selectedMenuItem);
      
      if (error) {
        toast({
          title: "Error loading recipe",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return data;
    },
    enabled: !!selectedMenuItem,
  });
  
  // Add ingredient to recipe
  const addIngredientToRecipe = useMutation({
    mutationFn: async () => {
      if (!selectedMenuItem || !newIngredient.ingredientId) {
        throw new Error("Missing required fields");
      }
      
      const { data, error } = await supabase
        .from('recipes')
        .insert({
          menuitemid: selectedMenuItem,
          ingredientid: newIngredient.ingredientId,
          quantity: newIngredient.quantity
        });
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', selectedMenuItem] });
      setNewIngredient({ ingredientId: null, quantity: 1 });
      toast({ 
        title: "Ingredient added to recipe"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add ingredient",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Remove ingredient from recipe
  const removeIngredientFromRecipe = useMutation({
    mutationFn: async (recipeId: number) => {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);
      
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', selectedMenuItem] });
      toast({ 
        title: "Ingredient removed from recipe"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove ingredient",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Get selected menu item name
  const getSelectedMenuItemName = () => {
    if (!selectedMenuItem || !menuItems) return "Select a dish";
    
    const item = menuItems.find(item => item.id === selectedMenuItem);
    return item ? item.name : "Unknown dish";
  };

  // Loading states
  const isLoading = menuItemsLoading || ingredientsLoading || (selectedMenuItem && recipeLoading);

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
        <h1 className="text-2xl font-bold">Recipe Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Menu Items</CardTitle>
              <CardDescription>Select a dish to view or edit its recipe</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              {menuItemsLoading ? (
                <p>Loading menu items...</p>
              ) : menuItems && menuItems.length > 0 ? (
                <div className="space-y-2">
                  {menuItems.map((item) => (
                    <Button 
                      key={item.id} 
                      variant={selectedMenuItem === item.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedMenuItem(item.id)}
                    >
                      <span>{item.name}</span>
                      <span className="ml-auto text-muted-foreground">₹{item.price}</span>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  No menu items found.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recipe Details */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recipe: {getSelectedMenuItemName()}</CardTitle>
              <CardDescription>Manage ingredients required for this dish</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedMenuItem ? (
                <p className="text-center text-muted-foreground py-8">
                  Select a dish from the list to view or edit its recipe
                </p>
              ) : recipeLoading ? (
                <p>Loading recipe...</p>
              ) : (
                <div className="space-y-6">
                  {/* Ingredients Table */}
                  {recipe && recipe.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingredient</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipe.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.ingredients?.name || 'Unknown'}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.ingredients?.unit || '-'}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive"
                                onClick={() => removeIngredientFromRecipe.mutate(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      No ingredients in this recipe yet. Add some below.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
            {selectedMenuItem && (
              <CardFooter className="border-t pt-6">
                <div className="grid grid-cols-12 gap-4 w-full items-end">
                  <div className="col-span-6">
                    <Label htmlFor="ingredient">Ingredient</Label>
                    <Select
                      value={newIngredient.ingredientId?.toString() || ""}
                      onValueChange={(value) => 
                        setNewIngredient({ ...newIngredient, ingredientId: parseInt(value) })
                      }
                    >
                      <SelectTrigger id="ingredient">
                        <SelectValue placeholder="Select ingredient" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients?.map(ingredient => (
                          <SelectItem 
                            key={ingredient.id} 
                            value={ingredient.id.toString()}
                          >
                            {ingredient.name} ({ingredient.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input 
                      id="quantity" 
                      type="number"
                      value={newIngredient.quantity}
                      onChange={(e) => setNewIngredient({ 
                        ...newIngredient, 
                        quantity: parseFloat(e.target.value) || 0 
                      })}
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-3">
                    <Button 
                      onClick={() => addIngredientToRecipe.mutate()}
                      disabled={!newIngredient.ingredientId || newIngredient.quantity <= 0}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Recipes;
