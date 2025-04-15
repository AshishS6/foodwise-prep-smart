
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CartItem } from "@/types";

export const useOrderSubmission = () => {
  const [missingRecipes, setMissingRecipes] = useState<string[]>([]);
  const [showMissingRecipeAlert, setShowMissingRecipeAlert] = useState(false);
  const [isValidatingOrder, setIsValidatingOrder] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateIngredientStocks = async (item: CartItem) => {
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('ingredientid, quantity')
      .eq('menuitemid', item.menuItemId);
    
    if (recipesError) throw new Error(recipesError.message);
    
    if (recipes) {
      for (const recipe of recipes) {
        const multiplier = item.portionType.multiplier;
        const totalUsed = recipe.quantity * item.quantity * multiplier;
        
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
  };

  const logActivity = async (action: string, entityType: string, entityId: string, details: any = {}) => {
    try {
      await supabase.rpc('log_activity', {
        action,
        entity_type: entityType,
        entity_id: entityId,
        details
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  const validateOrderRecipes = async (cart: CartItem[], recipes: any[]) => {
    if (!recipes || recipes.length === 0 || cart.length === 0) return true;
    
    const missingRecipeItems: string[] = [];
    
    for (const item of cart) {
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

  const submitOrder = useMutation({
    mutationFn: async (cart: CartItem[]) => {
      try {
        const groupedBills = cart.reduce((acc, item) => {
          const group = acc.find(g => g.groupId === item.billGroup);
          if (group) {
            group.items.push(item);
            group.total += item.price * item.quantity;
          } else {
            acc.push({
              items: [item],
              total: item.price * item.quantity,
              groupId: item.billGroup
            });
          }
          return acc;
        }, [] as Array<{ items: CartItem[]; total: number; groupId: number }>);
        
        for (const bill of groupedBills) {
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([{
              items: bill.items,
              total: bill.total,
              timestamp: new Date().toISOString()
            }])
            .select();

          if (orderError) throw new Error(orderError.message);
          
          logActivity('create', 'order', orderData?.[0]?.id?.toString(), {
            total: bill.total,
            items: bill.items.length
          });
          
          for (const item of bill.items) {
            await updateIngredientStocks(item);
          }
        }
        
        return { success: true };
      } catch (error: any) {
        console.error("Error submitting order:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ 
        title: "All orders submitted successfully",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['todaySales'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit order",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    missingRecipes,
    setMissingRecipes,
    showMissingRecipeAlert,
    setShowMissingRecipeAlert,
    isValidatingOrder,
    setIsValidatingOrder,
    submitOrder,
    validateOrderRecipes,
    updateIngredientStocks
  };
};
