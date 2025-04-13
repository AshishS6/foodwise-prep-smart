
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, CalendarIcon, ArrowRight, ArrowLeft as PrevIcon 
} from "lucide-react";
import { format, addDays, subDays, isToday, isTomorrow, parseISO } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const PrepPlans = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [actualQuantities, setActualQuantities] = useState<Record<number, number>>({});
  const [leftoverQuantities, setLeftoverQuantities] = useState<Record<number, number>>({});
  
  // Format date for display
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const displayDate = isToday(selectedDate) 
    ? "Today" 
    : isTomorrow(selectedDate)
      ? "Tomorrow"
      : format(selectedDate, 'EEEE, MMMM d');
  
  // Navigate to previous or next day
  const goToPrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  // Fetch prep plans for the selected date
  const { data: prepPlans, isLoading: plansLoading } = useQuery({
    queryKey: ['prepPlans', formattedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prepplans')
        .select('*')
        .eq('date', formattedDate);
      
      if (error) {
        toast({
          title: "Error loading prep plans",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      // Initialize the input states
      if (data) {
        const actualQtys: Record<number, number> = {};
        const leftoverQtys: Record<number, number> = {};
        
        data.forEach(plan => {
          if (plan.id) {
            actualQtys[plan.id] = plan.actual_prepared || 0;
            leftoverQtys[plan.id] = plan.leftovers || 0;
          }
        });
        
        setActualQuantities(actualQtys);
        setLeftoverQuantities(leftoverQtys);
      }
      
      return data;
    }
  });

  // Generate prep suggestions for a date
  const generateSuggestions = useMutation({
    mutationFn: async (date: string) => {
      // Fetch all menu items
      const { data: menuItems, error: menuError } = await supabase
        .from('menuitems')
        .select('*');
      
      if (menuError) throw new Error(menuError.message);
      
      // For each menu item, analyze sales data from the past 7 days
      // to suggest preparation quantities
      const suggestions = [];
      
      for (const item of menuItems || []) {
        // Get the day of week (0-6, where 0 is Sunday)
        const dayOfWeek = new Date(date).getDay();
        
        // Fetch orders from the past that match this day of week
        // This is a simplified approach - in reality you'd want to do more complex analysis
        const pastDate = new Date(date);
        pastDate.setDate(pastDate.getDate() - 7); // Go back 7 days
        
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .gte('timestamp', pastDate.toISOString());
        
        if (orderError) throw new Error(orderError.message);
        
        // Calculate total quantity sold for this menu item
        let totalQtySold = 0;
        let daysWithSales = 0;
        
        // Process orders to find sales for this menu item
        (orderData || []).forEach(order => {
          const orderItems = order.items || [];
          const matchingItem = orderItems.find((i: any) => i.menuItemId === item.id);
          
          if (matchingItem) {
            totalQtySold += matchingItem.quantity;
            daysWithSales += 1;
          }
        });
        
        // Calculate suggested quantity (simple average)
        // In a real system, this would be more sophisticated
        const suggestedQty = daysWithSales > 0 
          ? Math.ceil(totalQtySold / Math.max(1, daysWithSales)) 
          : 5; // Default if no sales data
        
        suggestions.push({
          date,
          dish: item.name,
          suggested_qty: suggestedQty
        });
      }
      
      // Check existing records for this date
      const { data: existingPlans, error: existingError } = await supabase
        .from('prepplans')
        .select('*')
        .eq('date', date);
      
      if (existingError) throw new Error(existingError.message);
      
      // If records exist, update them
      if (existingPlans && existingPlans.length > 0) {
        // Get a mapping of dish name to existing plan
        const existingPlanMap = existingPlans.reduce((acc, plan) => {
          acc[plan.dish] = plan;
          return acc;
        }, {} as Record<string, any>);
        
        // Update existing plans
        for (const suggestion of suggestions) {
          if (existingPlanMap[suggestion.dish]) {
            const existingPlan = existingPlanMap[suggestion.dish];
            
            await supabase
              .from('prepplans')
              .update({ 
                suggested_qty: suggestion.suggested_qty
              })
              .eq('id', existingPlan.id);
          } else {
            // Insert new plans for any dishes that don't have existing plans
            await supabase
              .from('prepplans')
              .insert([suggestion]);
          }
        }
      } else {
        // Insert all new suggestions
        await supabase
          .from('prepplans')
          .insert(suggestions);
      }
      
      return suggestions;
    },
    onSuccess: () => {
      toast({ title: "Prep suggestions generated successfully" });
      queryClient.invalidateQueries({ queryKey: ['prepPlans', formattedDate] });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate suggestions",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update a prep plan entry
  const updatePlan = useMutation({
    mutationFn: async ({ 
      id, actual_prepared, leftovers 
    }: { 
      id: number, 
      actual_prepared?: number, 
      leftovers?: number 
    }) => {
      const updateData: { 
        actual_prepared?: number,
        leftovers?: number
      } = {};
      
      if (actual_prepared !== undefined) updateData.actual_prepared = actual_prepared;
      if (leftovers !== undefined) updateData.leftovers = leftovers;
      
      const { data, error } = await supabase
        .from('prepplans')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prepPlans', formattedDate] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update prep plan",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle saving all changes
  const saveAllChanges = () => {
    // Process actual quantities
    Object.entries(actualQuantities).forEach(([idStr, qty]) => {
      const id = parseInt(idStr);
      const plan = prepPlans?.find(p => p.id === id);
      
      if (plan && plan.actual_prepared !== qty) {
        updatePlan.mutate({ id, actual_prepared: qty });
      }
    });
    
    // Process leftover quantities
    Object.entries(leftoverQuantities).forEach(([idStr, qty]) => {
      const id = parseInt(idStr);
      const plan = prepPlans?.find(p => p.id === id);
      
      if (plan && plan.leftovers !== qty) {
        updatePlan.mutate({ id, leftovers: qty });
      }
    });
    
    toast({ title: "All changes saved" });
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
        <h1 className="text-2xl font-bold">Prep Planning</h1>
      </div>

      {/* Date Selector */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" size="sm" onClick={goToPrevDay}>
          <PrevIcon className="h-4 w-4 mr-1" />
          Previous Day
        </Button>
        
        <div className="flex items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {displayDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <Button variant="outline" size="sm" onClick={goToNextDay}>
          Next Day
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Preparation Plan</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => generateSuggestions.mutate(formattedDate)}
            disabled={generateSuggestions.isPending}
          >
            {generateSuggestions.isPending ? "Generating..." : "Generate Suggestions"}
          </Button>
          <Button onClick={saveAllChanges}>Save Changes</Button>
        </div>
      </div>

      {plansLoading ? (
        <p>Loading prep plans...</p>
      ) : prepPlans && prepPlans.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dish</TableHead>
                <TableHead className="text-right">Suggested Quantity</TableHead>
                <TableHead className="text-right">Actual Prepared</TableHead>
                <TableHead className="text-right">Leftovers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prepPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>{plan.dish}</TableCell>
                  <TableCell className="text-right">{plan.suggested_qty}</TableCell>
                  <TableCell className="text-right">
                    <Input 
                      type="number"
                      min="0"
                      value={actualQuantities[plan.id] || 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setActualQuantities({
                          ...actualQuantities,
                          [plan.id]: value
                        });
                      }}
                      className="w-20 text-right ml-auto"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input 
                      type="number"
                      min="0"
                      value={leftoverQuantities[plan.id] || 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setLeftoverQuantities({
                          ...leftoverQuantities,
                          [plan.id]: value
                        });
                      }}
                      className="w-20 text-right ml-auto"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-muted/20 border rounded-md p-8 text-center">
          <p className="text-muted-foreground mb-4">
            No preparation plan found for this date.
          </p>
          <Button 
            onClick={() => generateSuggestions.mutate(formattedDate)}
            disabled={generateSuggestions.isPending}
          >
            {generateSuggestions.isPending ? "Generating..." : "Generate Suggestions"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PrepPlans;
