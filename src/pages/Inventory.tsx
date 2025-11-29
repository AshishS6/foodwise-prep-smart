
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { PlusCircle, ArrowLeft, Trash2, Save, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileCard } from "@/components/ui/MobileCard";
import { MobileFriendlyInput } from "@/components/ui/MobileFriendlyInput";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";
import { TOUCH_TARGETS } from "@/constants/mobile";

const Inventory = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useDeviceDetection();

  // Form state for adding/editing ingredients
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    stock: 0,
    unit: "",
  });

  const [editingIngredient, setEditingIngredient] = useState<null | {
    id: number;
    name: string;
    stock: number;
    unit: string;
  }>(null);

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

  // Add ingredient mutation
  const addIngredient = useMutation({
    mutationFn: async () => {
      // Make sure all required fields are non-null
      const ingredientToAdd = {
        name: newIngredient.name,
        stock: newIngredient.stock || 0, // Default to 0 if null
        unit: newIngredient.unit
      };
      
      const { data, error } = await supabase
        .from('ingredients')
        .insert(ingredientToAdd);
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      setNewIngredient({ name: "", stock: 0, unit: "" });
      toast({ 
        title: "Ingredient added successfully"
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

  // Update ingredient mutation
  const updateIngredient = useMutation({
    mutationFn: async () => {
      if (!editingIngredient) return;
      
      const { data, error } = await supabase
        .from('ingredients')
        .update({
          name: editingIngredient.name,
          stock: editingIngredient.stock,
          unit: editingIngredient.unit
        })
        .eq('id', editingIngredient.id);
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      setEditingIngredient(null);
      toast({ 
        title: "Ingredient updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update ingredient",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete ingredient mutation
  const deleteIngredient = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      toast({ 
        title: "Ingredient deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete ingredient",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newIngredient.name || !newIngredient.unit) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    addIngredient.mutate();
  };

  // Start editing an ingredient
  const handleEdit = (ingredient: {
    id: number;
    name: string;
    stock: number;
    unit: string;
  }) => {
    setEditingIngredient({ ...ingredient });
  };

  return (
    <>
      <MobileHeader title="Inventory Management" />
      <MobileContainer className="md:container md:mx-auto md:p-4">
        {!isMobile && (
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
        )}

      {/* Add Ingredient Form */}
      <MobileCard className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Add New Ingredient</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={isMobile ? "space-y-4" : "grid grid-cols-1 md:grid-cols-3 gap-4"}>
            <MobileFriendlyInput
              id="ingredient-name"
              label="Name"
              inputMode="text"
              value={newIngredient.name}
              onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
              placeholder="Tomato"
            />
            <MobileFriendlyInput
              id="ingredient-stock"
              label="Initial Stock"
              type="number"
              inputMode="numeric"
              value={newIngredient.stock}
              onChange={(e) => setNewIngredient({ ...newIngredient, stock: parseFloat(e.target.value) || 0 })}
              placeholder="10"
            />
            <MobileFriendlyInput
              id="ingredient-unit"
              label="Unit"
              inputMode="text"
              value={newIngredient.unit}
              onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
              placeholder="kg"
            />
          </div>
          <Button 
            type="submit" 
            disabled={addIngredient.isPending}
            className="w-full min-h-[44px]"
            style={{ minHeight: `${TOUCH_TARGETS.MINIMUM}px` }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Ingredient
          </Button>
        </form>
      </MobileCard>

      {/* Ingredients List */}
      <MobileCard>
        <h2 className="text-lg font-semibold mb-4">Current Inventory</h2>
        {isLoading ? (
          <div className="p-8 text-center">Loading ingredients...</div>
        ) : ingredients && ingredients.length > 0 ? (
          isMobile ? (
            <div className="space-y-3">
              {ingredients.map((ingredient) => (
                <MobileCard
                  key={ingredient.id}
                  swipeable
                  onSwipeLeft={() => deleteIngredient.mutate(ingredient.id)}
                  className="p-4"
                >
                  {editingIngredient?.id === ingredient.id ? (
                    <div className="space-y-3">
                      <MobileFriendlyInput
                        label="Name"
                        value={editingIngredient.name}
                        onChange={(e) => setEditingIngredient({ 
                          ...editingIngredient, 
                          name: e.target.value 
                        })}
                      />
                      <MobileFriendlyInput
                        label="Stock"
                        type="number"
                        inputMode="numeric"
                        value={editingIngredient.stock}
                        onChange={(e) => setEditingIngredient({ 
                          ...editingIngredient, 
                          stock: parseFloat(e.target.value) || 0
                        })}
                      />
                      <MobileFriendlyInput
                        label="Unit"
                        value={editingIngredient.unit}
                        onChange={(e) => setEditingIngredient({ 
                          ...editingIngredient, 
                          unit: e.target.value 
                        })}
                      />
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 min-h-[44px]"
                          onClick={() => updateIngredient.mutate()}
                          disabled={updateIngredient.isPending}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 min-h-[44px]"
                          onClick={() => setEditingIngredient(null)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-base">{ingredient.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {ingredient.stock} {ingredient.unit}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="min-h-[44px] min-w-[44px]"
                            onClick={() => handleEdit(ingredient)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="min-h-[44px] min-w-[44px] text-destructive"
                            onClick={() => deleteIngredient.mutate(ingredient.id)}
                            disabled={deleteIngredient.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </MobileCard>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>In Stock</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredients.map((ingredient) => (
                    <TableRow key={ingredient.id}>
                      <TableCell>
                        {editingIngredient?.id === ingredient.id ? (
                          <Input 
                            value={editingIngredient.name}
                            onChange={(e) => setEditingIngredient({ 
                              ...editingIngredient, 
                              name: e.target.value 
                            })}
                          />
                        ) : (
                          ingredient.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingIngredient?.id === ingredient.id ? (
                          <Input 
                            type="number"
                            value={editingIngredient.stock}
                            onChange={(e) => setEditingIngredient({ 
                              ...editingIngredient, 
                              stock: parseFloat(e.target.value) || 0
                            })}
                          />
                        ) : (
                          `${ingredient.stock} ${ingredient.unit}`
                        )}
                      </TableCell>
                      <TableCell>
                        {editingIngredient?.id === ingredient.id ? (
                          <Input 
                            value={editingIngredient.unit}
                            onChange={(e) => setEditingIngredient({ 
                              ...editingIngredient, 
                              unit: e.target.value 
                            })}
                          />
                        ) : (
                          ingredient.unit
                        )}
                      </TableCell>
                      <TableCell>
                        {editingIngredient?.id === ingredient.id ? (
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => updateIngredient.mutate()}
                              disabled={updateIngredient.isPending}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setEditingIngredient(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(ingredient)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive"
                              onClick={() => deleteIngredient.mutate(ingredient.id)}
                              disabled={deleteIngredient.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No ingredients found. Add some using the form above.
          </div>
        )}
      </MobileCard>
      </MobileContainer>
    </>
  );
};

export default Inventory;
