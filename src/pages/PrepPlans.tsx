
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Save,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const PrepPlans = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  // Track actual prepared and leftovers amounts
  const [actuals, setActuals] = useState<Record<number, { 
    actual_prepared: number | null, 
    leftovers: number | null 
  }>>({});

  // Get today's orders to analyze trends
  const { data: todayOrders } = useQuery({
    queryKey: ['todaySales'],
    queryFn: async () => {
      const todayStr = format(today, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('timestamp', `${todayStr}T00:00:00`)
        .lte('timestamp', `${todayStr}T23:59:59`);
      
      if (error) {
        toast({
          title: "Error loading today's orders",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return data || [];  // Ensure we always return an array
    }
  });

  // Get menu items
  const { data: menuItems } = useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menuitems')
        .select('*');
      
      if (error) {
        toast({
          title: "Error loading menu items",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return data || []; // Ensure we always return an array
    }
  });

  // Calculate sales data - safely check if todayOrders is an array
  const salesByItem = Array.isArray(todayOrders) ? todayOrders.reduce((acc: Record<number, number>, order: any) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        if (typeof item === 'object' && item !== null && 'menuItemId' in item && 'quantity' in item) {
          acc[item.menuItemId] = (acc[item.menuItemId] || 0) + item.quantity;
        }
      });
    }
    return acc;
  }, {}) : {};

  // Get prep plans for tomorrow
  const { data: prepPlans, isLoading } = useQuery({
    queryKey: ['prepPlans', format(tomorrow, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prepplans')
        .select('*')
        .eq('date', format(tomorrow, 'yyyy-MM-dd'));
      
      if (error) {
        toast({
          title: "Error loading prep plans",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      // Initialize actuals state with data from the database
      if (data && data.length > 0) {
        const newActuals: Record<number, { actual_prepared: number | null, leftovers: number | null }> = {};
        data.forEach(plan => {
          newActuals[plan.id] = {
            actual_prepared: plan.actual_prepared,
            leftovers: plan.leftovers
          };
        });
        setActuals(newActuals);
      }
      
      return data || [];  // Ensure we always return an array
    }
  });

  // Generate prep plans for tomorrow
  const generatePrepPlan = useMutation({
    mutationFn: async () => {
      // Delete any existing plans for tomorrow
      const { error: deleteError } = await supabase
        .from('prepplans')
        .delete()
        .eq('date', format(tomorrow, 'yyyy-MM-dd'));
      
      if (deleteError) throw new Error(deleteError.message);
      
      // For each menu item, create a prep plan
      const plans = [];
      if (menuItems && Array.isArray(menuItems)) {
        for (const item of menuItems) {
          // Calculate suggested quantity - this is a simple algorithm
          // In real life, you might use more complex forecasting
          const todaySales = salesByItem[item.id] || 0;
          const suggestedQty = Math.max(5, todaySales); // Ensure at least 5 of each item
          
          plans.push({
            date: format(tomorrow, 'yyyy-MM-dd'),
            dish: item.name,
            suggested_qty: suggestedQty,
            actual_prepared: null,
            leftovers: null
          });
        }
      }
      
      const { data, error } = await supabase
        .from('prepplans')
        .insert(plans)
        .select();
      
      if (error) throw new Error(error.message);
      
      return data || []; // Ensure we always return an array
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prepPlans'] });
      toast({ 
        title: "Prep plan generated for tomorrow",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate prep plan",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update actual prepared and leftovers
  const updateActuals = useMutation({
    mutationFn: async (id: number) => {
      if (!actuals[id]) return;
      
      const { error } = await supabase
        .from('prepplans')
        .update({
          actual_prepared: actuals[id].actual_prepared,
          leftovers: actuals[id].leftovers
        })
        .eq('id', id);
      
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prepPlans'] });
      toast({ 
        title: "Prep plan updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update prep plan",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle input change for actual prepared and leftovers
  const handleInputChange = (id: number, field: 'actual_prepared' | 'leftovers', value: string) => {
    const numValue = value === '' ? null : parseInt(value);
    
    setActuals(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: numValue
      }
    }));
  };

  // Calculate stat cards - safely using optional chaining and default to 0 if array is undefined
  const totalSuggestedPrep = Array.isArray(prepPlans) ? prepPlans.reduce((sum, plan) => sum + plan.suggested_qty, 0) : 0;
  const totalActualPrep = Array.isArray(prepPlans) ? prepPlans.reduce((sum, plan) => sum + (actuals[plan.id]?.actual_prepared || 0), 0) : 0;
  const totalLeftovers = Array.isArray(prepPlans) ? prepPlans.reduce((sum, plan) => sum + (actuals[plan.id]?.leftovers || 0), 0) : 0;

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
        <h1 className="text-2xl font-bold">Preparation Planning</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Suggested Prep
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSuggestedPrep}</div>
            <p className="text-xs text-muted-foreground">
              Total items suggested for tomorrow
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Actual Prepared
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActualPrep}</div>
            <p className="text-xs text-muted-foreground">
              Items actually prepared (enter as prepared)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Leftovers
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeftovers}</div>
            <p className="text-xs text-muted-foreground">
              Unsold items at end of day
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-lg shadow mb-6">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Tomorrow's Prep Plan</h2>
            <p className="text-sm text-muted-foreground">
              {format(tomorrow, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <Button 
            onClick={() => generatePrepPlan.mutate()}
            disabled={generatePrepPlan.isPending}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Generate Prep Plan
          </Button>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">Loading prep plans...</div>
        ) : prepPlans && prepPlans.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dish</TableHead>
                  <TableHead className="text-right">Suggested Qty</TableHead>
                  <TableHead>Actual Prepared</TableHead>
                  <TableHead>Leftovers</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prepPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.dish}</TableCell>
                    <TableCell className="text-right">{plan.suggested_qty}</TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={actuals[plan.id]?.actual_prepared === null ? '' : actuals[plan.id]?.actual_prepared || ''} 
                        onChange={(e) => handleInputChange(plan.id, 'actual_prepared', e.target.value)}
                        className="w-24" 
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={actuals[plan.id]?.leftovers === null ? '' : actuals[plan.id]?.leftovers || ''}
                        onChange={(e) => handleInputChange(plan.id, 'leftovers', e.target.value)}
                        className="w-24" 
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => updateActuals.mutate(plan.id)}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No prep plan for tomorrow. Generate one using the button above.
          </div>
        )}
      </div>
    </div>
  );
};

export default PrepPlans;
