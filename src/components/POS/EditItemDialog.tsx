
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/stores/authStore";

interface EditItemDialogProps {
  item: {
    id: string | number;
    name: string;
    price: number;
    halfprice?: number;
    supportshalf?: boolean;
  } | null;
  open: boolean;
  onClose: () => void;
}

const EditItemDialog = ({ item, open, onClose }: EditItemDialogProps) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [supportsHalf, setSupportsHalf] = useState(false);
  const [halfPrice, setHalfPrice] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { logActivity } = useAuthStore();
  
  useEffect(() => {
    if (item) {
      setName(item.name);
      setPrice(item.price);
      setSupportsHalf(item.supportshalf || false);
      setHalfPrice(item.halfprice || null);
    }
  }, [item]);
  
  const updateItemMutation = useMutation({
    mutationFn: async () => {
      if (!item) return null;
      
      const updateData: any = {
        name,
        price,
        supportshalf: supportsHalf,
      };
      
      // Only include halfprice if supports half is enabled
      if (supportsHalf) {
        updateData.halfprice = halfPrice || price / 2;
      } else {
        updateData.halfprice = null;
      }
      
      const { data, error } = await supabase
        .from('menuitems')
        .update(updateData)
        .eq('id', item.id)
        .select();
      
      if (error) throw error;
      
      // Log the activity
      logActivity('update', 'menuitem', String(item.id), { 
        name, 
        price, 
        supportsHalf,
        halfPrice: supportsHalf ? halfPrice : null 
      });
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Menu item updated",
        description: "The menu item has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to update menu item",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateItemMutation.mutate();
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supportshalf" className="text-right">
                Half Portion
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="supportshalf"
                  checked={supportsHalf}
                  onCheckedChange={setSupportsHalf}
                  className="bg-gray-300 data-[state=checked]:bg-purple-500"
                />
                <Label htmlFor="supportshalf">Supports half portion</Label>
              </div>
            </div>
            {supportsHalf && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="halfprice" className="text-right">
                  Half Price (₹)
                </Label>
                <Input
                  id="halfprice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={halfPrice !== null ? halfPrice : price / 2}
                  onChange={(e) => setHalfPrice(parseFloat(e.target.value) || 0)}
                  className="col-span-3"
                  placeholder={`Default: ${price / 2}`}
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
              disabled={updateItemMutation.isPending || !name || price <= 0}
            >
              {updateItemMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemDialog;
