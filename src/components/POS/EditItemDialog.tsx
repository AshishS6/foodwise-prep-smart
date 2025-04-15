
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EditItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id?: string | number;
    name: string;
    price: number;
    halfprice?: number;
    supportshalf?: boolean;
  };
}

export default function EditItemDialog({
  isOpen,
  onClose,
  item
}: EditItemDialogProps) {
  const [itemData, setItemData] = useState({
    name: "",
    price: 0,
    supportshalf: false,
    halfprice: 0,
  });
  
  const queryClient = useQueryClient();
  
  // Reset form data when item changes
  useEffect(() => {
    if (item) {
      setItemData({
        name: item.name,
        price: item.price,
        supportshalf: item.supportshalf || false,
        halfprice: item.halfprice || item.price / 2,
      });
    }
  }, [item]);

  // Create new item mutation
  const createItem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('menuitems')
        .insert([{
          name: itemData.name,
          price: itemData.price,
          supportshalf: itemData.supportshalf,
          halfprice: itemData.supportshalf ? Number(itemData.halfprice) : null
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
      const { error } = await supabase
        .from('menuitems')
        .update({
          name: itemData.name,
          price: itemData.price,
          supportshalf: itemData.supportshalf,
          halfprice: itemData.supportshalf ? Number(itemData.halfprice) : null
        })
        .eq('id', item.id);
      
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
    if (item.id) {
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
            <DialogTitle>{item.id ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
            <DialogDescription>
              {item.id ? "Update the details for this menu item." : "Add a new menu item to your menu."} Click save when you're done.
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
              <Label htmlFor="price" className="text-right">
                Price (₹)
              </Label>
              <Input
                id="price"
                type="number"
                value={itemData.price}
                onChange={(e) => setItemData({ ...itemData, price: Number(e.target.value) })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supportshalf" className="text-right">
                Support Half?
              </Label>
              <div className="flex items-center col-span-3 space-x-2">
                <Switch
                  id="supportshalf"
                  checked={itemData.supportshalf}
                  onCheckedChange={(checked) => setItemData({ ...itemData, supportshalf: checked })}
                />
                <span className="text-sm text-muted-foreground">
                  {itemData.supportshalf ? "Yes" : "No"}
                </span>
              </div>
            </div>
            
            {itemData.supportshalf && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="halfprice" className="text-right">
                  Half Price (₹)
                </Label>
                <Input
                  id="halfprice"
                  type="number"
                  value={itemData.halfprice}
                  onChange={(e) => setItemData({ ...itemData, halfprice: Number(e.target.value) })}
                  className="col-span-3"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createItem.isPending || updateItem.isPending || !itemData.name || itemData.price <= 0}
            >
              {createItem.isPending || updateItem.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
