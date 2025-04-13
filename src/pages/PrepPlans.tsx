import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { format, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const PrepPlans = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = React.useState<Date>(addDays(new Date(), 1)); // Default to tomorrow
  
  // Convert date to string format for querying
  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // Fetch prep plans for selected date
  const { data: prepPlans, isLoading } = useQuery({
    queryKey: ['prepPlans', dateString],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prepplans')
        .select('*')
        .eq('date', dateString)
        .order('dish');
      
      if (error) {
        toast({
          title: "Error loading prep plans",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return data || [];
    }
  });

  // Fetch menu items for suggestions
  const { data: menuItems } = useQuery({
    queryKey: ['menuItemsForPrep'],
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
      
      return data || [];
    }
  });

  // Fetch sales data for analysis
  const { data: salesData } = useQuery({
    queryKey: ['salesForPrep'],
    queryFn: async () => {
      // Get orders from the past 7 days
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('timestamp', pastDate.toISOString());
      
      if (error) {
        toast({
          title: "Error loading sales data",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return data || [];
    }
  });

  // Process sales data to get suggestions
  const getSuggestedQuantity = (dishName: string) => {
    if (!salesData || !menuItems) return 10; // Default if no data
    
    // Find menu item ID by name
    const menuItem = menuItems.find(item => item.name === dishName);
    if (!menuItem) return 10;
    
    // Count how many of this item were sold
    let totalSold = 0;
    let occurrences = 0;
    
    for (const order of salesData) {
      // Safely check if items is an array before using find
      const orderItems = Array.isArray(order.items) ? order.items : [];
      const orderItem = orderItems.find((item: any) => item.menuItemId === menuItem.id);
      
      if (orderItem) {
        totalSold += orderItem.quantity;
        occurrences++;
      }
    }
    
    // Calculate average daily sales, with a minimum of 5
    return Math.max(5, Math.ceil(totalSold / (occurrences || 1)));
  };

  // Update prep plan quantities
  const updatePrepPlan = useMutation({
    mutationFn: async ({ id, field, value }: { id: number, field: string, value: number | null }) => {
      const { data, error } = await supabase
        .from('prepplans')
        .update({ [field]: value })
        .eq('id', id)
        .select();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prepPlans'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update prep plan",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Add new dish to prep plan
  const addDishToPlan = useMutation({
    mutationFn: async (dishName: string) => {
      // Check if already in plan
      const existingPlan = prepPlans?.find(plan => plan.dish === dishName);
      if (existingPlan) {
        toast({
          title: "Dish already in prep plan",
          variant: "default"
        });
        return;
      }
      
      const suggestedQty = getSuggestedQuantity(dishName);
      
      const { data, error } = await supabase
        .from('prepplans')
        .insert({
          date: dateString,
          dish: dishName,
          suggested_qty: suggestedQty
        })
        .select();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prepPlans', dateString] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add dish to plan",
        description: error.message,
        variant: "destructive"
      });
    }
  });

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

      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold">Prep Plans for</h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={format(selectedDate, 'PPP') + " w-[200px] justify-start text-left font-normal"}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                defaultMonth={selectedDate}
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isLoading ? (
        <p>Loading prep plans...</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dish</TableHead>
                <TableHead>Suggested Quantity</TableHead>
                <TableHead>Actually Prepared</TableHead>
                <TableHead>Leftovers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prepPlans?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No prep plans found for this date.
                  </TableCell>
                </TableRow>
              ) : (
                prepPlans?.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>{plan.dish}</TableCell>
                    <TableCell>
                      {plan.suggested_qty}
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        defaultValue={plan.actual_prepared || 0}
                        onChange={(e) => {
                          const value = e.target.value === "" ? null : parseInt(e.target.value);
                          updatePrepPlan.mutate({
                            id: plan.id,
                            field: 'actual_prepared',
                            value: value
                          });
                        }}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        defaultValue={plan.leftovers || 0}
                        onChange={(e) => {
                          const value = e.target.value === "" ? null : parseInt(e.target.value);
                          updatePrepPlan.mutate({
                            id: plan.id,
                            field: 'leftovers',
                            value: value
                          });
                        }}
                        className="w-24"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-4">
        <label htmlFor="addDish" className="block text-sm font-medium text-gray-700">
          Add Dish to Prep Plan:
        </label>
        <div className="mt-1">
          <Input
            type="text"
            name="addDish"
            id="addDish"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addDishToPlan.mutate((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = '';
              }
            }}
            placeholder="Enter dish name and press Enter"
          />
        </div>
      </div>
    </div>
  );
};

export default PrepPlans;
