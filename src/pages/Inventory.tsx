import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell 
} from "@/components/ui/table";
import { 
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, RefreshCcw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";

// Form schema for adding/updating ingredients
const ingredientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  stock: z.coerce.number().min(0, "Stock cannot be negative"),
  unit: z.string().min(1, "Unit is required")
});

type IngredientFormValues = z.infer<typeof ingredientSchema>;

const Inventory = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);

  // Form setup for adding new ingredients
  const addForm = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: "",
      stock: 0,
      unit: ""
    }
  });

  // Form setup for updating ingredient stock
  const updateForm = useForm<{ addStock: number }>({
    resolver: zodResolver(z.object({
      addStock: z.coerce.number()
    })),
    defaultValues: {
      addStock: 0
    }
  });

  // Fetch ingredients
  const { data: ingredients, isLoading } = useQuery({
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

  // Add new ingredient mutation
  const addIngredient = useMutation({
    mutationFn: async (values: IngredientFormValues) => {
      const { data, error } = await supabase
        .from('ingredients')
        .insert(values)
        .select();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Ingredient added successfully" });
      addForm.reset();
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add ingredient",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update ingredient stock mutation
  const updateStock = useMutation({
    mutationFn: async ({ ingredientId, addStock }: { ingredientId: number, addStock: number }) => {
      const { data: currentData, error: fetchError } = await supabase
        .from('ingredients')
        .select('stock')
        .eq('id', ingredientId)
        .single();
      
      if (fetchError) throw new Error(fetchError.message);
      
      const newStock = (currentData?.stock || 0) + addStock;
      
      const { data, error } = await supabase
        .from('ingredients')
        .update({ stock: newStock })
        .eq('id', ingredientId)
        .select();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Stock updated successfully" });
      updateForm.reset();
      setSelectedIngredient(null);
      setIsUpdateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update stock",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle opening the update dialog
  const handleUpdateClick = (ingredient: any) => {
    setSelectedIngredient(ingredient);
    setIsUpdateDialogOpen(true);
    updateForm.reset();
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
        <h1 className="text-2xl font-bold">Inventory Management</h1>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Ingredients</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Add New Ingredient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Ingredient</DialogTitle>
              <DialogDescription>
                Enter the details for the new ingredient.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit((data) => addIngredient.mutate(data))} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Tomatoes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Stock</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="kg, liters, pieces, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addIngredient.isPending}>
                    {addIngredient.isPending ? "Adding..." : "Add Ingredient"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p>Loading ingredients...</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No ingredients found. Add your first ingredient.
                  </TableCell>
                </TableRow>
              ) : (
                ingredients?.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell>{ingredient.name}</TableCell>
                    <TableCell>
                      <span className={ingredient.stock < 10 ? "text-destructive font-medium" : ""}>
                        {ingredient.stock}
                      </span>
                    </TableCell>
                    <TableCell>{ingredient.unit}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleUpdateClick(ingredient)}
                      >
                        <RefreshCcw className="h-3.5 w-3.5 mr-1" />
                        Update Stock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Update Stock Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Ingredient Stock</DialogTitle>
            <DialogDescription>
              {selectedIngredient && (
                <>
                  Current stock of {selectedIngredient.name}: <strong>{selectedIngredient.stock} {selectedIngredient.unit}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={updateForm.handleSubmit((data) => {
            if (!selectedIngredient) return;
            updateStock.mutate({
              ingredientId: selectedIngredient.id,
              addStock: data.addStock
            });
          })} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addStock">Add/Remove Stock</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  id="addStock"
                  type="number"
                  step="0.1"
                  placeholder="Enter amount (+ or -)"
                  {...updateForm.register("addStock", { valueAsNumber: true })}
                />
                <span>{selectedIngredient?.unit}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Use positive values to add stock, negative to remove
              </p>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsUpdateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateStock.isPending}>
                {updateStock.isPending ? "Updating..." : "Update Stock"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
