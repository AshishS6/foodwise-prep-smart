
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell 
} from "@/components/ui/table";
import { 
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, Plus, X, Edit, Search 
} from "lucide-react";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/toast";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Recipe schema
const recipeIngredientSchema = z.object({
  ingredientId: z.string().min(1, "Ingredient is required"),
  quantity: z.coerce.number().positive("Quantity must be positive")
});

const recipeSchema = z.object({
  menuItemId: z.string().min(1, "Menu item is required"),
  ingredients: z.array(recipeIngredientSchema).min(1, "At least one ingredient is required")
});

type RecipeFormValues = z.infer<typeof recipeSchema>;

const Recipes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<number | null>(null);
  
  // Form setup
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      menuItemId: "",
      ingredients: [{ ingredientId: "", quantity: 0 }]
    }
  });

  // Reset form when dialog closes
  const resetForm = () => {
    form.reset({
      menuItemId: "",
      ingredients: [{ ingredientId: "", quantity: 0 }]
    });
    setSelectedRecipe(null);
  };

  // Fetch menu items
  const { data: menuItems, isLoading: menuLoading } = useQuery({
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

  // Fetch recipes for a specific menu item
  const { data: recipeDetails, isLoading: recipesLoading } = useQuery({
    queryKey: ['recipes', selectedMenuItem],
    enabled: !!selectedMenuItem,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id,
          quantity,
          ingredients (id, name, unit),
          menuitems (id, name, price)
        `)
        .eq('menuitemid', selectedMenuItem);
      
      if (error) {
        toast({
          title: "Error loading recipe details",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return data;
    }
  });

  // Save recipe mutation
  const saveRecipe = useMutation({
    mutationFn: async (values: RecipeFormValues) => {
      // First, delete existing recipe entries for this menu item
      const menuItemId = parseInt(values.menuItemId);
      
      const { error: deleteError } = await supabase
        .from('recipes')
        .delete()
        .eq('menuitemid', menuItemId);
      
      if (deleteError) throw new Error(deleteError.message);
      
      // Then insert new recipe entries
      const recipeEntries = values.ingredients.map(ing => ({
        menuitemid: menuItemId,
        ingredientid: parseInt(ing.ingredientId),
        quantity: ing.quantity
      }));
      
      const { data, error } = await supabase
        .from('recipes')
        .insert(recipeEntries)
        .select();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Recipe saved successfully" });
      resetForm();
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save recipe",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Add ingredient field to form
  const addIngredient = () => {
    const currentIngredients = form.getValues().ingredients || [];
    form.setValue('ingredients', [...currentIngredients, { ingredientId: "", quantity: 0 }]);
  };

  // Remove ingredient field from form
  const removeIngredient = (index: number) => {
    const currentIngredients = form.getValues().ingredients;
    if (currentIngredients.length <= 1) return;
    
    form.setValue('ingredients', 
      currentIngredients.filter((_, i) => i !== index)
    );
  };

  // Load recipe for editing
  const editRecipe = (menuItemId: number) => {
    const filteredRecipes = recipeDetails?.filter(r => r.menuitems?.id === menuItemId) || [];
    
    if (filteredRecipes.length > 0) {
      setSelectedRecipe({
        menuItemId: menuItemId.toString(),
        ingredients: filteredRecipes.map(r => ({
          ingredientId: r.ingredients?.id.toString() || "",
          quantity: r.quantity
        }))
      });
      
      form.reset({
        menuItemId: menuItemId.toString(),
        ingredients: filteredRecipes.map(r => ({
          ingredientId: r.ingredients?.id.toString() || "",
          quantity: r.quantity
        }))
      });
      
      setIsDialogOpen(true);
    } else {
      // New recipe for existing menu item
      setSelectedRecipe(null);
      form.reset({
        menuItemId: menuItemId.toString(),
        ingredients: [{ ingredientId: "", quantity: 0 }]
      });
      setIsDialogOpen(true);
    }
  };

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Menu Items Column */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Menu Items</h2>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Define Recipe
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedRecipe ? "Edit Recipe" : "Define New Recipe"}
                  </DialogTitle>
                  <DialogDescription>
                    Specify the ingredients and quantities needed for this dish.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => saveRecipe.mutate(data))} className="space-y-4">
                    {/* Menu Item Selection */}
                    <FormField
                      control={form.control}
                      name="menuItemId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Menu Item</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={!!selectedRecipe}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a menu item" />
                              </SelectTrigger>
                              <SelectContent>
                                {menuItems?.map((item) => (
                                  <SelectItem key={item.id} value={item.id.toString()}>
                                    {item.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Ingredients List */}
                    <div className="space-y-2">
                      <Label>Ingredients</Label>
                      {form.getValues().ingredients.map((_, index) => (
                        <div key={index} className="flex items-end gap-2">
                          <FormField
                            control={form.control}
                            name={`ingredients.${index}.ingredientId`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select ingredient" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ingredients?.map((ingredient) => (
                                        <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                                          {ingredient.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`ingredients.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem className="w-24">
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0.01" 
                                    step="0.01" 
                                    placeholder="Qty" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeIngredient(index)}
                            disabled={form.getValues().ingredients.length <= 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addIngredient}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Ingredient
                      </Button>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={saveRecipe.isPending}>
                        {saveRecipe.isPending ? "Saving..." : "Save Recipe"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {menuLoading ? (
            <p>Loading menu items...</p>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search menu items..." 
                  className="pl-8" 
                />
              </div>
              
              <div className="border rounded-md divide-y">
                {menuItems?.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-3 flex justify-between items-center cursor-pointer hover:bg-muted/50 ${
                      selectedMenuItem === item.id ? 'bg-muted/80' : ''
                    }`}
                    onClick={() => setSelectedMenuItem(item.id)}
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        editRecipe(item.id);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {!menuItems?.length && (
                  <p className="p-4 text-center text-muted-foreground">
                    No menu items found
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recipe Details Column */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Recipe Details</h2>
          
          {!selectedMenuItem ? (
            <div className="border rounded-md p-8 text-center text-muted-foreground">
              Select a menu item to view its recipe
            </div>
          ) : recipesLoading ? (
            <p>Loading recipe details...</p>
          ) : recipeDetails && recipeDetails.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipeDetails.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.ingredients?.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.ingredients?.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="border rounded-md p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No recipe defined for this menu item yet
              </p>
              <Button onClick={() => editRecipe(selectedMenuItem)}>
                <Plus className="h-4 w-4 mr-1" />
                Create Recipe
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recipes;
