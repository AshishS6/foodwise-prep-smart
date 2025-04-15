
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PortionType } from "@/types";

interface EditItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id?: string | number;
    name: string;
    category?: string;
    portions?: PortionType[];
  };
}

const categories = ['Main Course', 'Starters', 'Desserts', 'Beverages'] as const;
const units = ['plate', 'glass', 'liter', 'piece'] as const;

export default function EditItemDialog({
  isOpen,
  onClose,
  item
}: EditItemDialogProps) {
  const [itemData, setItemData] = useState({
    name: "",
    category: "Main Course" as typeof categories[number],
    portions: [] as PortionType[],
  });
  
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (item) {
      setItemData({
        name: item.name,
        category: (item.category as typeof categories[number]) || "Main Course",
        portions: item.portions || [],
      });
    }
  }, [item]);

  const addPortion = () => {
    setItemData({
      ...itemData,
      portions: [
        ...itemData.portions,
        { label: "", price: 0, unit: "plate", multiplier: 1 }
      ],
    });
  };

  const removePortion = (index: number) => {
    setItemData({
      ...itemData,
      portions: itemData.portions.filter((_, i) => i !== index),
    });
  };

  const updatePortion = (index: number, field: keyof PortionType, value: string | number) => {
    const newPortions = [...itemData.portions];
    newPortions[index] = {
      ...newPortions[index],
      [field]: field === "price" || field === "multiplier" ? Number(value) : value,
    };
    setItemData({ ...itemData, portions: newPortions });
  };

  // Create new item mutation
  const createItem = useMutation({
    mutationFn: async () => {
      // Calculate a default price from the first portion for backward compatibility
      const defaultPrice = itemData.portions.length > 0 ? itemData.portions[0].price : 0;
      
      const { error } = await supabase
        .from('menuitems')
        .insert([{
          name: itemData.name,
          category: itemData.category,
          price: defaultPrice, // Include price for backward compatibility
          portions: itemData.portions,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Item created successfully" });
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      onClose();
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create item", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });
  
  // Update item mutation
  const updateItem = useMutation({
    mutationFn: async () => {
      if (!item || item.id === undefined) {
        throw new Error("No item ID provided for update");
      }

      // Calculate a default price from the first portion for backward compatibility
      const defaultPrice = itemData.portions.length > 0 ? itemData.portions[0].price : 0;
      
      const { error } = await supabase
        .from('menuitems')
        .update({
          name: itemData.name,
          category: itemData.category,
          price: defaultPrice, // Include price for backward compatibility
          portions: itemData.portions,
        })
        .eq('id', typeof item.id === 'string' ? parseInt(item.id, 10) : item.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Item updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      onClose();
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update item", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (itemData.portions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one portion type",
        variant: "destructive"
      });
      return;
    }

    if (item && item.id !== undefined) {
      updateItem.mutate();
    } else {
      createItem.mutate();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{item && item.id !== undefined ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
            <DialogDescription>
              {item && item.id !== undefined ? "Update the details for this menu item." : "Add a new menu item to your menu."} Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={itemData.name}
                onChange={(e) => setItemData({ ...itemData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={itemData.category}
                onValueChange={(value) => setItemData({ ...itemData, category: value as typeof categories[number] })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Portions</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPortion}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Portion
                </Button>
              </div>
              
              {itemData.portions.map((portion, index) => (
                <div key={index} className="grid gap-2 p-3 border rounded-lg relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-6 w-6 p-0"
                    onClick={() => removePortion(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label htmlFor={`portion-${index}-label`} className="text-right">
                      Label
                    </Label>
                    <Input
                      id={`portion-${index}-label`}
                      value={portion.label}
                      onChange={(e) => updatePortion(index, "label", e.target.value)}
                      className="col-span-3"
                      placeholder="e.g., Full, Half, Glass"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label htmlFor={`portion-${index}-price`} className="text-right">
                      Price (₹)
                    </Label>
                    <Input
                      id={`portion-${index}-price`}
                      type="number"
                      value={portion.price}
                      onChange={(e) => updatePortion(index, "price", e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label htmlFor={`portion-${index}-unit`} className="text-right">
                      Unit
                    </Label>
                    <Select
                      value={portion.unit}
                      onValueChange={(value) => updatePortion(index, "unit", value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label htmlFor={`portion-${index}-multiplier`} className="text-right">
                      Multiplier
                    </Label>
                    <Input
                      id={`portion-${index}-multiplier`}
                      type="number"
                      step="0.01"
                      value={portion.multiplier}
                      onChange={(e) => updatePortion(index, "multiplier", e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createItem.isPending || updateItem.isPending || !itemData.name || itemData.portions.length === 0}
            >
              {createItem.isPending || updateItem.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
